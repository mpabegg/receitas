const recipesUrl = 'recipes.json';
const elements = {
  search: document.querySelector('#busca'),
  list: document.querySelector('#lista'),
  empty: document.querySelector('#empty'),
  error: document.querySelector('#erro'),
  status: document.querySelector('#status'),
  template: document.querySelector('#recipe-template'),
  installCard: document.querySelector('#install-card'),
  installButton: document.querySelector('#install-button'),
  installHelp: document.querySelector('#install-help'),
};

let allRecipes = [];
let filteredRecipes = [];
let deferredInstallPrompt = null;

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

function isIos() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

function showInstallCard(message, buttonText = 'Instalar') {
  if (isStandalone()) return;

  elements.installHelp.textContent = message;
  elements.installButton.textContent = buttonText;
  elements.installCard.hidden = false;
}

function hideInstallCard() {
  elements.installCard.hidden = true;
}

function setupInstallPrompt() {
  if (isStandalone()) {
    hideInstallCard();
    return;
  }

  if (isIos()) {
    showInstallCard('No iPhone/iPad: toque em Compartilhar e depois em “Adicionar à Tela de Início”.', 'Como adicionar');
  }

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    showInstallCard('Instale este catálogo na tela inicial para abrir como app.', 'Adicionar');
  });

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    hideInstallCard();
  });

  elements.installButton.addEventListener('click', async () => {
    if (!deferredInstallPrompt) {
      showInstallCard('No iPhone/iPad: toque em Compartilhar e depois em “Adicionar à Tela de Início”.', 'Entendi');
      return;
    }

    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
  });
}

function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function searchableText(recipe) {
  return normalize([
    recipe.name,
    ...(recipe.ingredients || []),
  ].join(' '));
}

function matches(recipe, query) {
  if (!query) return true;
  const haystack = searchableText(recipe);
  return query.split(/\s+/).every((part) => haystack.includes(part));
}

function renderRecipe(recipe) {
  const node = elements.template.content.firstElementChild.cloneNode(true);
  const title = node.querySelector('.recipe-title');
  const meta = node.querySelector('.recipe-meta');
  const ingredients = node.querySelector('.ingredients');
  const toggle = node.querySelector('.toggle');
  const body = node.querySelector('.recipe-body');

  const bodyId = `details-${recipe.id}`;
  body.id = bodyId;
  toggle.setAttribute('aria-controls', bodyId);

  title.textContent = recipe.name;
  const count = recipe.ingredients?.length || 0;
  meta.textContent = `${count} ingrediente${count === 1 ? '' : 's'}`;

  ingredients.replaceChildren(...(recipe.ingredients || []).map((item) => {
    const li = document.createElement('li');
    li.textContent = item;
    return li;
  }));

  toggle.addEventListener('click', () => {
    const isOpen = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!isOpen));
    toggle.textContent = isOpen ? 'Detalhes' : 'Ocultar';
    body.hidden = isOpen;
  });

  return node;
}

function renderList() {
  elements.list.replaceChildren(...filteredRecipes.map(renderRecipe));
  elements.empty.hidden = filteredRecipes.length !== 0;
  elements.status.textContent = `${filteredRecipes.length} receita${filteredRecipes.length === 1 ? '' : 's'}`;
}

function applyFilter() {
  const query = normalize(elements.search.value).trim();
  filteredRecipes = allRecipes.filter((recipe) => matches(recipe, query));
  renderList();
}

function showError(message) {
  elements.error.textContent = message;
  elements.error.hidden = false;
  elements.status.textContent = 'Não foi possível carregar as receitas.';
}

async function loadRecipes() {
  elements.status.textContent = 'Carregando receitas…';
  elements.error.hidden = true;
  try {
    const response = await fetch(recipesUrl, { cache: 'no-cache' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    allRecipes = Array.isArray(data) ? data : [];
    filteredRecipes = allRecipes;
    renderList();
  } catch (error) {
    allRecipes = [];
    filteredRecipes = [];
    renderList();
    showError('Erro ao carregar recipes.json. Verifique o arquivo e recarregue a página.');
    console.error(error);
  }
}

elements.search.addEventListener('input', applyFilter);

setupInstallPrompt();
loadRecipes();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((error) => {
      console.warn('Service worker não registrado.', error);
    });
  });
}
