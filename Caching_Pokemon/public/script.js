let pokemonList = [];

async function loadPokemonNames() {
  try {
    const res = await fetch('https://pokeapi.co/api/v2/pokemon?limit=1000');
    const data = await res.json();
    pokemonList = data.results.map(p => p.name);
  } catch (err) {
    console.error("Couldn't fetch Pokémon list", err);
  }
}

loadPokemonNames();

async function fetchPokemon() {
  const name = document.getElementById('pokemonName').value.toLowerCase().trim();
  const container = document.getElementById('cardContainer');
  document.getElementById('suggestions').innerHTML = '';
  container.innerHTML = '';

  if (!name) return;

  try {
    const res = await fetch(`/pokemon/${name}`);
    const { source, data } = await res.json();

    const card = document.createElement('div');
    card.className = 'card';

    card.innerHTML = `
      <img src="${data.sprite}" class="pokemon-image" alt="${data.name}" />
      <div class="pokemon-name">${data.name} (#${data.id})</div>
      <div class="pokemon-types">
        ${data.types.map(type => `<div class="type">${type}</div>`).join('')}
      </div>
      <div class="stats">
        ${data.stats.map(stat => `
          <div class="stat">
            <span>${stat.name}</span>
            <span>${stat.value}</span>
          </div>`).join('')}
      </div>
      <div class="source-tag ${source.includes('PokéAPI') ? 'source-pokeapi' : ''}">
        ${source}
      </div>
    `;

    container.appendChild(card);
  } catch (err) {
    container.innerHTML = `<p style="color:red">Error: Pokémon not found or server error</p>`;
  }
}

function showSuggestions(input) {
  const suggestions = document.getElementById('suggestions');
  suggestions.innerHTML = '';

  if (!input || input.length < 2) return;

  const filtered = pokemonList.filter(name => name.startsWith(input.toLowerCase())).slice(0, 10);

  filtered.forEach(name => {
    const li = document.createElement('li');
    li.textContent = name;
    li.onclick = () => {
      document.getElementById('pokemonName').value = name;
      suggestions.innerHTML = '';
    };
    suggestions.appendChild(li);
  });
}
