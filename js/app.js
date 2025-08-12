const container = document.getElementById('tool-container');

fetch('tools.json')
  .then(res => res.json())
  .then(data => {
    data.forEach(tool => {
      const card = document.createElement('a');
      card.href = tool.url;
      card.className = "block p-6 bg-white shadow-lg rounded-lg hover:shadow-xl transition";
      card.innerHTML = `
        <h2 class="text-xl font-semibold mb-2">${tool.icon} ${tool.name}</h2>
        <p class="text-gray-600 mb-4">${tool.description}</p>
        <span class="inline-block px-4 py-2 text-white brand-bg rounded">Launch</span>
      `;
      container.appendChild(card);
    });
  })
  .catch(err => {
    console.error('Failed to load tools', err);
    container.innerHTML = '<p class="text-red-600">Failed to load tools.</p>';
  });
