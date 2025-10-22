// Mobile-aware in-app navigation & external-link handling for /ToolHub/
(function(){
  const APP_SCOPE = '/ToolHub/';

  function isStandalone(){
    return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches)
      || (window.navigator.standalone === true);
  }

  function isInAppScope(href){
    try {
      const u = new URL(href, location.href);
      return u.origin === location.origin && u.pathname.startsWith(APP_SCOPE);
    } catch(e){ return false; }
  }

  document.addEventListener('click', function(ev){
    if (ev.defaultPrevented) return;
    const a = ev.target.closest && ev.target.closest('a');
    if (!a) return;

    const href = a.getAttribute('href');
    if (!href || href.startsWith('javascript:') || href === '#') return;

    if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey || (typeof ev.button === 'number' && ev.button !== 0)) return;

    let u; try { u = new URL(a.href, location.href); } catch(e){ return; }

    if (isInAppScope(u.href)) {
      ev.preventDefault();
      history.pushState({}, '', u.pathname + u.search + u.hash);
      window.dispatchEvent(new PopStateEvent('popstate'));
      return;
    }

    if (isStandalone()) {
      ev.preventDefault();
      window.open(u.href, '_blank', 'noopener');
      return;
    }
  }, { passive:false });

  const _open = window.open;
  window.open = function(url, target, features){
    try {
      if (isInAppScope(url)) {
        history.pushState({}, '', new URL(url, location.href).pathname);
        window.dispatchEvent(new PopStateEvent('popstate'));
        return null;
      }
      if (isStandalone()) return _open.call(window, url, '_blank', 'noopener');
      return _open.call(window, url, target || '_blank', features);
    } catch(e){
      return _open.call(window, url, target || '_blank', features);
    }
  };
})();