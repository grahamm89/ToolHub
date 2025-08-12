
// ------- Service worker (relative path for GitHub Pages) -------
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js').catch(()=>{});
  });
}

// ------- State & DOM -------
const state = { tools: [], filter: 'all' };
const grid = document.getElementById('appsGrid');
const filters = document.getElementById('filters');

// ------- Diagnostics & Error UI -------
const errorBanner = document.getElementById('errorBanner');
function showError(msg){
  console.error('[App Error]', msg);
  if (errorBanner){
    errorBanner.textContent = String(msg);
    errorBanner.style.display = 'block';
  }
}

// Monkey-patch fetch to surface errors in UI
(function(){
  const _fetch = window.fetch;
  window.fetch = async function(resource, init){
    try {
      const res = await _fetch(resource, init);
      if (!res.ok) showError(`Failed to fetch ${typeof resource === 'string' ? resource : (resource && resource.url)} — HTTP ${res.status}`);
      return res;
    } catch (err){
      showError(`Network error while fetching ${typeof resource === 'string' ? resource : (resource && resource.url)} — ${err && err.message}`);
      throw err;
    }
  };
})();

// ------- Data load -------
fetch('tools.json?v=' + Date.now(), { cache: 'no-cache' })
  .then(r => r.json())
  .then(data => {
    if (!Array.isArray(data)) throw new Error('tools.json is not an array');
    state.tools = data;
    render();
    try { track && track('page_view'); } catch(e) {}
  })
  .catch(err => {
    showError('Could not load tools.json: ' + (err && err.message));
  });

// ------- Filters (with analytics) -------
if (filters) {
  filters.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-filter]');
    if (!btn) return;
    state.filter = btn.dataset.filter;
    [...filters.querySelectorAll('.chip')].forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    try { track && track('filter_click', { filter: state.filter }); } catch(e) {}
    render();
  });
}

// ------- Render -------
function render() {
  const items = state.tools.filter(t => state.filter === 'all' ? true : (t.category || '').toLowerCase() === state.filter);
  if (!Array.isArray(state.tools)) {
    showError('tools.json loaded but is not an array.');
  } else if (state.tools.length === 0) {
    showError('tools.json is valid but contains 0 tools.');
  }
  if (!items.length) {
    grid.innerHTML = '<p>No tools in this category yet.</p>';
    return;
  }
  grid.innerHTML = items.map(tool => Card(tool)).join('');

  // Delegate link clicks for analytics
  grid.addEventListener('click', (e) => {
    const a = e.target.closest('a.btn');
    if (!a) return;
    const nameEl = a.parentElement && a.parentElement.querySelector('h3');
    const name = nameEl ? nameEl.textContent.trim() : 'unknown';
    try { track && track('launch_click', { name, href: a.href }); } catch(e) {}
  }, { once: true });
}

// Card component (make sure return stays inside function)
function Card(tool){
  const icon = tool.icon || '🔧';
  const name = escapeHtml(tool.name || 'Untitled');
  const desc = escapeHtml(tool.description || '');
  const url = tool.url || '#';
  return `
  <article class="card">
    <h3>${icon} ${name}</h3>
    <p class="desc">${desc}</p>
    <a class="btn" href="${url}" target="_blank" rel="noopener">Launch</a>
  </article>
  `;
}

function escapeHtml(str){
  return String(str)
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'",'&#039;');
}

// ------- Footer timestamp -------
(function(){
  const footer = document.querySelector('footer');
  if (footer) footer.textContent = 'Offline ready. Updated: ' + new Date().toLocaleString();
})();

// ------- Install prompt (Chromium) -------
let deferredPrompt = null;
const installBanner = document.getElementById('installBanner');
const installBtn = document.getElementById('installBtn');
const dismissInstall = document.getElementById('dismissInstall');

// Edge-specific label
const isEdge = navigator.userAgent.includes('Edg/');
if (installBtn && isEdge) { installBtn.textContent = 'Install in Edge'; }

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  try { track && track('install_prompt_shown'); } catch(e) {}
  if (!localStorage.getItem('installDismissed')) installBanner.style.display = 'block';
});

if (installBtn) {
  installBtn.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    try { track && track('install_prompt_result', { outcome: choice && choice.outcome }); } catch(e) {}
    installBanner.style.display = 'none';
    deferredPrompt = null;
  });
}
if (dismissInstall) {
  dismissInstall.addEventListener('click', () => {
    installBanner.style.display = 'none';
    localStorage.setItem('installDismissed', '1');
    try { track && track('install_prompt_dismiss'); } catch(e) {}
  });
}

// ------- Hidden editor (E twice) -------
(function(){
  let lastPress = 0;
  document.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'e') {
      const now = Date.now();
      if (now - lastPress < 400) {
        const editBtnEl = document.getElementById('editBtn');
        if (editBtnEl) {
          editBtnEl.style.display = (editBtnEl.style.display === 'none' ? 'inline-block' : 'none');
        }
      }
      lastPress = now;
    }
  });
})();

// ------- Editor modal handlers -------
const editBtn = document.getElementById("editBtn");
const editorModal = document.getElementById('editorModal');
const toolsEditor = document.getElementById('toolsEditor');
const closeEditor = document.getElementById('closeEditor');
const applyPreview = document.getElementById('applyPreview');
const downloadJson = document.getElementById('downloadJson');

function openEditor() {
  if (toolsEditor) toolsEditor.value = JSON.stringify(state.tools, null, 2);
  if (editorModal) editorModal.style.display = 'block';
}
function closeModal(){ if (editorModal) editorModal.style.display = 'none'; }

if (editBtn) editBtn.addEventListener('click', openEditor);
if (closeEditor) closeEditor.addEventListener('click', closeModal);
if (editorModal) editorModal.addEventListener('click', (e)=>{ if (e.target === editorModal) closeModal(); });

if (applyPreview) applyPreview.addEventListener('click', () => {
  try {
    const next = JSON.parse(toolsEditor.value);
    if (!Array.isArray(next)) throw new Error('tools.json must be an array');
    state.tools = next;
    render();
    alert('Preview updated. Remember to Download and upload tools.json to GitHub.');
  } catch (err) {
    alert('Invalid JSON: ' + err.message);
  }
});

if (downloadJson) downloadJson.addEventListener('click', () => {
  try {
    const blob = new Blob([toolsEditor.value], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tools.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (err) {
    alert('Could not create download: ' + err.message);
  }
});

// ------- iOS Safari tip -------
(function() {
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
  const hasBeforeInstall = 'onbeforeinstallprompt' in window;
  const iosTip = document.getElementById('iosTip');
  if (isIOS && !isStandalone && !hasBeforeInstall && iosTip) iosTip.style.display = 'block';
})();

// ------- macOS Safari tip -------
(function() {
  const ua = navigator.userAgent.toLowerCase();
  const isMac = /macintosh/.test(ua);
  const isSafari = /^((?!chrome|chromium|android).)*safari/.test(ua);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
  const hasBeforeInstall = 'onbeforeinstallprompt' in window;
  const macSafariTip = document.getElementById('macSafariTip');
  if (isMac && isSafari && !isStandalone && !hasBeforeInstall && macSafariTip) macSafariTip.style.display = 'block';
})();

// ------- About modal bindings -------
const aboutBtn = document.getElementById('aboutBtn');
const aboutModal = document.getElementById('aboutModal');
const closeAbout = document.getElementById('closeAbout');
const aboutContent = document.getElementById('aboutContent');
const APP_VERSION = '1.2.0';
const CHANGELOG = ["Add install banner and editor modal.", "Auto cache-buster for tools.json.", "iOS & macOS install tips.", "About modal with version + changelog.", "Diagnostics for tools.json errors."];

function renderAbout() {
  if (!aboutContent) return;
  const list = CHANGELOG.map(item => '<li>' + item + '</li>').join('');
  aboutContent.innerHTML = [
    '<p><strong>Version:</strong> ' + APP_VERSION + '</p>',
    '<p><strong>Build time:</strong> ' + new Date().toLocaleString() + '</p>',
    '<p><strong>PWA:</strong> Offline caching via service worker; installable on supported browsers.</p>',
    '<p><strong>Changelog:</strong></p>',
    '<ul>' + list + '</ul>'
  ].join('');
}
if (aboutBtn) aboutBtn.addEventListener('click', () => { renderAbout(); if (aboutModal) aboutModal.style.display = 'block'; });
if (closeAbout) closeAbout.addEventListener('click', () => { if (aboutModal) aboutModal.style.display = 'none'; });
if (aboutModal) aboutModal.addEventListener('click', (e) => { if (e.target === aboutModal) aboutModal.style.display = 'none'; });

// ---- Auto-refresh when a new Service Worker activates ----
(function(){
  if (!('serviceWorker' in navigator)) return;
  let hasRefreshed = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (hasRefreshed) return;
    hasRefreshed = true;
    window.location.reload();
  });
  navigator.serviceWorker.addEventListener('message', (event) => {
    const data = event && event.data;
    if (data && data.type === 'SW_ACTIVATED_RELOAD' && !hasRefreshed) {
      hasRefreshed = true;
      window.location.reload();
    }
  });
})();
