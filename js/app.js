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

fetch('tools.json?v=1', { cache: 'no-cache' })
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
