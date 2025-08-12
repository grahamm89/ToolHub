(() => {
  const PASS = 'apex-admin';
  const $ = s => document.querySelector(s);

  const loginCard = $('#loginCard');
  const pwd = $('#pwd');
  const loginBtn = $('#loginBtn');
  const adminUI = $('#adminUI');
  const editor = $('#editor');
  const filePick = $('#filePick');
  const reloadBtn = $('#reloadBtn');
  const downloadBtn = $('#downloadBtn');
  const beautifyBtn = $('#beautifyBtn');
  const validateBtn = $('#validateBtn');
  const status = $('#status');

  function setStatus(t){ if(status) status.textContent = t; }

  function unlock(){
    if (pwd.value === PASS) {
      loginCard.style.display='none';
      adminUI.style.display='block';
      load();
    } else {
      alert('Incorrect password');
    }
  }
  loginBtn.addEventListener('click', unlock);
  pwd.addEventListener('keydown', e=>{ if(e.key==='Enter') unlock(); });

  async function load(){
    setStatus('Loading…');
    try{
      const res = await fetch('./' + filePick.value + '?_=' + Date.now(), { cache:'no-store' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const txt = await res.text();
      editor.value = txt;
      setStatus('Loaded ' + filePick.value);
    }catch(err){ alert('Load failed: ' + err.message); setStatus('Load failed'); }
  }
  reloadBtn.addEventListener('click', load);
  filePick.addEventListener('change', load);

  downloadBtn.addEventListener('click', () => {
    try{
      const blob = new Blob([editor.value], {type:'application/json'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const name = filePick.value.split('/').pop();
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setStatus('Downloaded ' + name);
    }catch(err){ alert('Download failed: ' + err.message); }
  });

  beautifyBtn.addEventListener('click', () => {
    try{
      const obj = JSON.parse(editor.value);
      editor.value = JSON.stringify(obj, null, 2);
    }catch(err){ alert('Invalid JSON: ' + err.message); }
  });

  validateBtn.addEventListener('click', () => {
    try{ JSON.parse(editor.value); alert('JSON valid ✔'); }
    catch(err){ alert('Invalid JSON: ' + err.message); }
  });
})();