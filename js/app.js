// Register service worker (silent fail if not supported)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js').catch(()=>{});
  });
}

const state = {
  tools: [],
  filter: 'all'
};

const grid = document.getElementById('appsGrid');
const filters = document.getElementById('filters');

fetch('tools.json?v=' + Date.now(), { cache: 'no-cache' })
  .then(r => r.json())
  .then(data => {
    state.tools = data;
    render();
  })
  .catch(() => {
    grid.innerHTML = '<p>Unable to load tools.</p>';
  });

filters.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-filter]');
  if (!btn) return;
  state.filter = btn.dataset.filter;
  [...filters.querySelectorAll('.chip')].forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  render();
});

function render() {
  const items = state.tools.filter(t => state.filter === 'all' ? true : (t.category || '').toLowerCase() === state.filter);
  if (!items.length) {
    grid.innerHTML = '<p>No tools in this category yet.</p>';
    return;
  }
  grid.innerHTML = items.map(tool => Card(tool)).join('');
}

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


// ----- Last updated footer -----
(function(){
  const footer = document.querySelector('footer');
  if (footer) {
    const stamp = new Date().toLocaleString();
    footer.textContent = 'Offline ready. Updated: ' + stamp;
  }
})();

// ----- Install prompt (PWA) -----
let deferredPrompt = null;
const installBanner = document.getElementById('installBanner');
const installBtn = document.getElementById('installBtn');
const dismissInstall = document.getElementById('dismissInstall');

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  if (!localStorage.getItem('installDismissed')) {
    installBanner.style.display = 'block';
  }
});

if (installBtn) {
  installBtn.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    installBanner.style.display = 'none';
    deferredPrompt = null;
  });
}
if (dismissInstall) {
  dismissInstall.addEventListener('click', () => {
    installBanner.style.display = 'none';
    localStorage.setItem('installDismissed', '1');
  });
}

// ----- Simple editor modal -----
const editBtn = document.getElementById('editBtn');
const editorModal = document.getElementById('editorModal');
const toolsEditor = document.getElementById('toolsEditor');
const closeEditor = document.getElementById('closeEditor');
const applyPreview = document.getElementById('applyPreview');
const downloadJson = document.getElementById('downloadJson');

function openEditor() {
  toolsEditor.value = JSON.stringify(state.tools, null, 2);
  editorModal.style.display = 'block';
}
function closeModal(){ editorModal.style.display = 'none'; }

if (editBtn) editBtn.addEventListener('click', openEditor);
if (closeEditor) closeEditor.addEventListener('click', closeModal);
if (editorModal) editorModal.addEventListener('click', (e)=>{
  if (e.target === editorModal) closeModal();
});

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


// ----- iOS Install Tip -----
(function(){
  const isIos = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
  const isInStandalone = window.navigator.standalone === true;
  if (isIos && !isInStandalone) {
    const tip = document.createElement('div');
    tip.style.cssText = 'position:fixed;bottom:12px;left:50%;transform:translateX(-50%);background:#0ea5a0;color:white;padding:10px 14px;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,.2);font-size:14px;z-index:1000;max-width:90%;text-align:center;';
    tip.innerHTML = '📲 To install, tap <strong>Share</strong> <span style="font-size:18px;">⬆️</span> and choose <strong>Add to Home Screen</strong>.';
    document.body.appendChild(tip);
    setTimeout(()=> tip.remove(), 10000);
  }
})();


// ----- About Menu -----
(function(){
  const btn = document.createElement('button');
  btn.textContent = 'About';
  btn.className = 'chip';
  btn.style.position = 'fixed';
  btn.style.left = '18px';
  btn.style.bottom = '18px';
  btn.style.zIndex = 1000;
  document.body.appendChild(btn);

  const modal = document.createElement('div');
  modal.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,.4);padding:24px;z-index:1100;';
  modal.innerHTML = `<div style="max-width:500px;margin:40px auto;background:#fff;border-radius:12px;box-shadow:0 10px 24px rgba(0,0,0,.2);padding:16px;">
    <h2 style="margin:6px 0 10px;">About This App</h2>
    <p><strong>Version:</strong> ${new Date().toLocaleDateString()}-${new Date().toLocaleTimeString()}</p>
    <p>This app is a PWA for quick access to Diversey field & sales tools.</p>
    <h3>Changelog</h3>
    <ul style="font-size:14px;color:#555;line-height:1.4;">
      <li>Added install banner and iOS tip</li>
      <li>Added built-in tools.json editor</li>
      <li>Added footer last-updated timestamp</li>
      <li>Cache-busting for tools.json updates</li>
    </ul>
    <div style="text-align:right;margin-top:14px;">
      <button id="closeAbout" class="chip">Close</button>
    </div>
  </div>`;
  document.body.appendChild(modal);

  btn.addEventListener('click', ()=> modal.style.display = 'block');
  modal.addEventListener('click', (e)=>{
    if (e.target.id === 'closeAbout' || e.target === modal) {
      modal.style.display = 'none';
    }
  });
})();


// ----- iOS install tip -----
(function() {
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
  const hasBeforeInstall = 'onbeforeinstallprompt' in window;
  const iosTip = document.getElementById('iosTip');
  // Show the tip only on iOS Safari where beforeinstallprompt is not supported and not standalone yet
  if (isIOS && !isStandalone && !hasBeforeInstall && iosTip) {
    iosTip.style.display = 'block';
  }
})();

// ----- About modal -----
const aboutBtn = document.getElementById('aboutBtn');
const aboutModal = document.getElementById('aboutModal');
const closeAbout = document.getElementById('closeAbout');
const aboutContent = document.getElementById('aboutContent');
const APP_VERSION = '1.2.0';
const CHANGELOG = ["Add install banner and editor modal.", "Auto cache-buster for tools.json.", "iOS install tip for Safari.", "About modal with version + changelog."];

function renderAbout() {
  const list = CHANGELOG.map(item => '<li>' + item + '</li>').join('');
  aboutContent.innerHTML = `
    <p><strong>Version:</strong> ${APP_VERSION}</p>
    <p><strong>Build time:</strong> $2025-08-12 02:22</p>
    <p><strong>PWA:</strong> Offline caching via service worker; installable on supported browsers.</p>
    <p><strong>Changelog:</strong></p>
    <ul>${list}</ul>
  `;
}

if (aboutBtn) aboutBtn.addEventListener('click', () => { renderAbout(); aboutModal.style.display = 'block'; });
if (closeAbout) closeAbout.addEventListener('click', () => aboutModal.style.display = 'none');
if (aboutModal) aboutModal.addEventListener('click', (e) => { if (e.target === aboutModal) aboutModal.style.display = 'none'; });
