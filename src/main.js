// Favorieten uit localStorage laden of initialiseren
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
const themeToggle = document.getElementById('theme-toggle');
const typeFilter = document.getElementById('type-filter');
const sortOrder = document.getElementById('sort-order');
const showFavoritesBtn = document.getElementById('show-favorites');
let activePokemonId = null;

const detailContainer = document.getElementById('pokemon-details');
const API_URL = 'https://pokeapi.co/api/v2/pokemon?limit=151';
const container = document.getElementById('pokemon-container');
const searchInput = document.getElementById('search');
const homeLink = document.getElementById('home-link');

let allPokemon = [];

async function fetchPokemonList() {
  try {
    const res = await fetch(API_URL);
    const data = await res.json();
    const detailedData = await Promise.all(
      data.results.map(pokemon => fetch(pokemon.url).then(res => res.json()))
    );
    allPokemon = detailedData;
    displayPokemon(detailedData);
    populateTypeFilter();
  } catch (error) {
    console.error('Fout bij ophalen van data:', error);
  }
}

function displayPokemon(pokemonList) {
  container.innerHTML = '';
  pokemonList.forEach(pokemon => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <img src="${pokemon.sprites.front_default}" alt="${pokemon.name}" width="100">
      <h3>${pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}</h3>
      <p>#${pokemon.id} ${favorites.includes(pokemon.id) ? '❤️' : ''}</p>
    `;
    card.addEventListener('click', () => showDetails(pokemon));
    container.appendChild(card);
  });
}

searchInput.addEventListener('input', () => applyFilters());
if (typeFilter) {
  typeFilter.addEventListener('change', () => applyFilters());
}
if (sortOrder) {
  sortOrder.addEventListener('change', () => applyFilters());
}

fetchPokemonList();

function showDetails(pokemon) {
  detailContainer.scrollIntoView({ behavior: 'smooth' });
  let closeButton;
  if (activePokemonId === pokemon.id) {
    detailContainer.innerHTML = '';
    activePokemonId = null;
  } else {
    activePokemonId = pokemon.id;
    detailContainer.innerHTML = `
      <div class="details-card">
        <span id="close-detail" style="float:right;cursor:pointer;">&times;</span>
        <h2>${pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}</h2>
        <img src="${pokemon.sprites.front_default}" alt="${pokemon.name}" width="150">
        <p><strong>ID:</strong> ${pokemon.id}</p>
        <p><strong>Hoogte:</strong> ${pokemon.height}</p>
        <p><strong>Gewicht:</strong> ${pokemon.weight}</p>
        <p><strong>Types:</strong> ${pokemon.types.map(t => t.type.name).join(', ')}</p>
        <p><strong>Base experience:</strong> ${pokemon.base_experience}</p>
      </div>
      <button id="scroll-to-top" style="margin-top: 1rem;">⬆️ Terug naar boven</button>
    `;
    container.classList.add('hidden');
    detailContainer.classList.remove('hidden');
    detailContainer.scrollIntoView({ behavior: 'smooth' });
    closeButton = document.getElementById('close-detail');
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        detailContainer.innerHTML = '';
        activePokemonId = null;
        container.classList.remove('hidden');
        detailContainer.classList.add('hidden');
      });
    }
    const scrollToTopBtn = document.getElementById('scroll-to-top');
    if (scrollToTopBtn) {
      scrollToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
    // Favorieten-knop toevoegen
    const favBtn = document.createElement('button');
    favBtn.textContent = favorites.includes(pokemon.id) ? '❤️ Verwijder uit favorieten' : '🤍 Voeg toe aan favorieten';
    favBtn.addEventListener('click', () => {
      if (favorites.includes(pokemon.id)) {
        favorites = favorites.filter(id => id !== pokemon.id);
      } else {
        favorites.push(pokemon.id);
      }
      localStorage.setItem('favorites', JSON.stringify(favorites));
      showDetails(pokemon); // herlaad detailweergave met bijgewerkte status
    });
    detailContainer.appendChild(favBtn);
  }
}

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
  });
}

// Initieel thema toepassen
if (localStorage.getItem('theme') === 'dark') {
  document.body.classList.add('dark');
}
function populateTypeFilter() {
  if (!typeFilter) return;
  // Clear existing options except empty
  typeFilter.innerHTML = '<option value="">Alle types</option>';
  const allTypes = new Set();
  allPokemon.forEach(pokemon => {
    pokemon.types.forEach(t => allTypes.add(t.type.name));
  });
  [...allTypes].sort().forEach(type => {
    const option = document.createElement('option');
    option.value = type;
    option.textContent = type.charAt(0).toUpperCase() + type.slice(1);
    typeFilter.appendChild(option);
  });
}

function applyFilters() {
  const searchTerm = searchInput.value.toLowerCase();
  const selectedType = typeFilter ? typeFilter.value : '';

  const filtered = allPokemon.filter(pokemon => {
    const matchesName = pokemon.name && pokemon.name.toLowerCase().includes(searchTerm);
    const matchesType = selectedType === '' || pokemon.types.some(t => t.type.name === selectedType);
    return matchesName && matchesType;
  });

  const selectedSort = sortOrder ? sortOrder.value : '';

  if (selectedSort === 'name-asc') {
    filtered.sort((a, b) => a.name.localeCompare(b.name));
  } else if (selectedSort === 'name-desc') {
    filtered.sort((a, b) => b.name.localeCompare(a.name));
  } else if (selectedSort === 'id-asc') {
    filtered.sort((a, b) => a.id - b.id);
  } else if (selectedSort === 'id-desc') {
    filtered.sort((a, b) => b.id - a.id);
  }

  displayPokemon(filtered);
}

if (showFavoritesBtn) {
  showFavoritesBtn.addEventListener('click', () => {
    const favoritePokemon = allPokemon.filter(p => favorites.includes(p.id));
    displayPokemon(favoritePokemon);
  });
}

if (homeLink) {
  homeLink.addEventListener('click', () => {
    detailContainer.classList.add('hidden');
    container.classList.remove('hidden');
    applyFilters();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}