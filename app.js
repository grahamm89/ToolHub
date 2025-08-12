(() => {
  const $ = s => document.querySelector(s);
  const cards = $('#cards');
  const stamp = $('#stamp');
  const aboutBtn = $('#aboutBtn');
  const aboutModal = $('#aboutModal');
  const closeAbout = $('#closeAbout');
  const aboutContent = $('#aboutContent');

  // Load tools.json (cache-busted)
  fetch('./tools.json?_=' + Date.now(), { cache:'no-store' })
    .then(r => r.json())
    .then(arr => {
      cards.innerHTML = '';
      arr.forEach(t => {
        const el = document.createElement('article');
        el.className = 'card';
        el.innerHTML = `
          <h3>${t.icon || '🔧'} ${t.name}</h3>
          <p>${t.description || ''}</p>
          <a class="btn" href="${t.url}" rel="noopener">Open</a>`;
        cards.appendChild(el);
      });
    });

  // Footer stamp
  if (stamp) stamp.textContent = 'Offline ready • Updated: ' + new Date().toLocaleString();

  // About modal
  function renderAbout(m) {
    const list = ['Standalone PWA shell','Offline support via service worker','Cache-busted JSON loads','Admin shortcut: press E twice'].map(i=>'<li>'+i+'</li>').join('');
    aboutContent.innerHTML = `
      <p><strong>Version:</strong> ${m.version || '1.0.0'}</p>
      <p><strong>Build time:</strong> ${new Date().toLocaleString()}</p>
      <p><strong>PWA:</strong> Installable; offline caching with network-first JSON.</p>
      <ul>${list}</ul>`;
  }
  if (aboutBtn) aboutBtn.addEventListener('click', () => {
    fetch('./manifest.json?_=' + Date.now()).then(r=>r.json()).then(renderAbout);
    aboutModal.style.display = 'flex';
  });
  if (closeAbout) closeAbout.addEventListener('click', () => aboutModal.style.display='none');
  if (aboutModal) aboutModal.addEventListener('click', (e)=>{ if(e.target===aboutModal) aboutModal.style.display='none'; });

  // Double-E opens admin.html
  (function(){
    let last=0, count=0, timer=null;
    document.addEventListener('keydown', (e)=>{
      if (e.key.toLowerCase() !== 'e') return;
      const now=Date.now();
      if (now - last < 400) { count++; if (count>=2){ window.location.href='./admin.html'; count=0; } }
      else { count=1; }
      last = now;
      clearTimeout(timer); timer=setTimeout(()=>count=0, 600);
    });
  })();

  // SW
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(()=>{}));
  }
})();