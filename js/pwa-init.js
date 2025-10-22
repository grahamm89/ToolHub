// PWA bootstrap (non-invasive) — registers SW and handles update + install UX
(function(){
  const swPath = '/ToolHub/service-worker.js';
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        await navigator.serviceWorker.register(swPath);
        navigator.serviceWorker.addEventListener('message', (e) => {
          const { type } = e.data || {};
          if (type === 'SW_ACTIVATED') {
            if (!sessionStorage.getItem('refreshed-after-activate')) {
              sessionStorage.setItem('refreshed-after-activate', '1');
              location.reload();
            }
          }
          if (type === 'TOOLS_UPDATED') {
            const bar = document.getElementById('updateBanner');
            if (bar) bar.style.display = 'flex';
          }
        });
      } catch (e) { console.warn('SW register failed', e); }
    });
  }

  let deferredPrompt;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const btn = document.getElementById('installBtn');
    if (btn) btn.style.display = 'inline-flex';
  });
  window.triggerInstall = async function(){
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    const btn = document.getElementById('installBtn');
    if (btn) btn.style.display = 'none';
  };
})();

window.applyToolsUpdate = () => location.reload();