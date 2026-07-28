/* Bean Diary — a tiny offline coffee journal.
   All data lives in the browser via localStorage, so it stays on the phone. */

const STORE_KEY = 'bean-diary-entries-v1';

/* ---------- data helpers ---------- */
function loadEntries() {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY)) || [];
  } catch {
    return [];
  }
}
function saveEntries(entries) {
  localStorage.setItem(STORE_KEY, JSON.stringify(entries));
}
let entries = loadEntries();

/* ---------- element refs ---------- */
const $ = (id) => document.getElementById(id);
const listEl = $('list');
const emptyEl = $('empty');
const searchEl = $('search');
const filterEl = $('filter-type');
const modalEl = $('modal');
const formEl = $('entry-form');
const starsEl = $('f-stars');
const cafeField = $('cafe-field');

let currentRating = 0;

/* Form fields shared by the populate (openModal) and collect (submit) paths.
   `trim` marks free-text inputs; `fallback` is the value used when empty. */
const FIELDS = [
  { key: 'bean', trim: true },
  { key: 'roaster', trim: true },
  { key: 'cafe', trim: true },
  { key: 'origin', trim: true },
  { key: 'method', fallback: 'Espresso' },
  { key: 'roast' },
  { key: 'price', trim: true },
  { key: 'date' },
  { key: 'notes', trim: true },
];
const fieldEl = (key) => $('f-' + key);
const selectedType = () => document.querySelector('input[name=type]:checked').value;

function fillForm(entry) {
  FIELDS.forEach(({ key, fallback }) => {
    fieldEl(key).value = entry[key] || fallback || '';
  });
}

function readForm() {
  const data = { type: selectedType(), rating: currentRating };
  FIELDS.forEach(({ key, trim }) => {
    const value = fieldEl(key).value;
    data[key] = trim ? value.trim() : value;
  });
  return data;
}

/* ---------- rendering ---------- */
function starString(n) {
  return '★★★★★'.slice(0, n) + '☆☆☆☆☆'.slice(0, 5 - n);
}

function tag(text, cls = '') {
  return text ? `<span class="tag ${cls}">${escapeHtml(text)}</span>` : '';
}

function escapeHtml(s) {
  return (s || '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

function render() {
  const q = searchEl.value.trim().toLowerCase();
  const typeFilter = filterEl.value;

  const visible = entries
    .filter((e) => !typeFilter || e.type === typeFilter)
    .filter((e) => {
      if (!q) return true;
      return [e.bean, e.roaster, e.cafe, e.origin, e.method, e.notes]
        .filter(Boolean).join(' ').toLowerCase().includes(q);
    })
    .sort((a, b) => (b.date || '').localeCompare(a.date || '') || b.created - a.created);

  listEl.innerHTML = visible.map((e) => {
    const place = e.type === 'cafe' ? (e.cafe || 'Café') : 'Home brew';
    const bits = [e.roaster, e.origin, place].filter(Boolean).join(' · ');
    const isHome = e.type === 'home';
    const tags = [
      tag(isHome ? 'Home' : 'Café', isHome ? 'type home' : 'type'),
      tag(e.method),
      tag(e.roast),
      e.price ? tag('$' + e.price) : '',
    ].join('');
    return `
      <li class="entry ${e.type}" data-id="${e.id}">
        <div class="entry-top">
          <span class="entry-bean">${escapeHtml(e.bean)}</span>
          <span class="entry-stars">${starString(e.rating || 0)}</span>
        </div>
        ${bits ? `<div class="entry-meta">${escapeHtml(bits)}</div>` : ''}
        <div class="entry-tags">${tags}</div>
        ${e.notes ? `<div class="entry-notes">${escapeHtml(e.notes)}</div>` : ''}
      </li>`;
  }).join('');

  emptyEl.hidden = entries.length !== 0;
  if (entries.length && !visible.length) {
    emptyEl.hidden = false;
    emptyEl.textContent = 'No entries match your search.';
  } else if (!entries.length) {
    emptyEl.innerHTML = 'No entries yet. Tap <strong>+</strong> to log your first cup.';
  }

  renderStats();
}

function renderStats() {
  $('stat-count').textContent = entries.length;
  const rated = entries.filter((e) => e.rating);
  $('stat-avg').textContent = rated.length
    ? (rated.reduce((s, e) => s + e.rating, 0) / rated.length).toFixed(1)
    : '–';
  const counts = {};
  entries.forEach((e) => { if (e.method) counts[e.method] = (counts[e.method] || 0) + 1; });
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  $('stat-fav').textContent = top ? top[0] : '–';
}

/* ---------- star input ---------- */
function setRating(n) {
  currentRating = n;
  [...starsEl.children].forEach((s) => s.classList.toggle('on', +s.dataset.v <= n));
  starsEl.setAttribute('aria-valuenow', n);
}
starsEl.addEventListener('click', (ev) => {
  const v = ev.target.dataset.v;
  if (v) setRating(+v === currentRating ? +v - 1 : +v);
});

/* ---------- modal open/close ---------- */
function openModal(entry) {
  formEl.reset();
  if (entry) {
    $('form-title').textContent = 'Edit entry';
    $('entry-id').value = entry.id;
    document.querySelector(`input[name=type][value=${entry.type}]`).checked = true;
    fillForm(entry);
    setRating(entry.rating || 0);
    $('delete-btn').hidden = false;
  } else {
    $('form-title').textContent = 'New entry';
    $('entry-id').value = '';
    fieldEl('date').value = new Date().toISOString().slice(0, 10);
    setRating(0);
    $('delete-btn').hidden = true;
  }
  updateTypeFields();
  modalEl.hidden = false;
}
function closeModal() { modalEl.hidden = true; }

function updateTypeFields() {
  cafeField.style.display = selectedType() === 'cafe' ? '' : 'none';
}
document.querySelectorAll('input[name=type]').forEach((r) =>
  r.addEventListener('change', updateTypeFields));

/* ---------- save / delete ---------- */
function commit() {
  saveEntries(entries);
  render();
  closeModal();
}

formEl.addEventListener('submit', (ev) => {
  ev.preventDefault();
  const id = $('entry-id').value;
  const data = readForm();
  if (id) {
    const i = entries.findIndex((e) => e.id === id);
    if (i > -1) entries[i] = { ...entries[i], ...data };
  } else {
    entries.push({ id: 'e' + Date.now().toString(36), created: Date.now(), ...data });
  }
  commit();
});

$('delete-btn').addEventListener('click', () => {
  const id = $('entry-id').value;
  if (id && confirm('Delete this entry?')) {
    entries = entries.filter((e) => e.id !== id);
    commit();
  }
});

/* ---------- wiring ---------- */
$('add-btn').addEventListener('click', () => openModal(null));
$('close-btn').addEventListener('click', closeModal);
modalEl.addEventListener('click', (ev) => { if (ev.target === modalEl) closeModal(); });
listEl.addEventListener('click', (ev) => {
  const li = ev.target.closest('.entry');
  if (li) openModal(entries.find((e) => e.id === li.dataset.id));
});
searchEl.addEventListener('input', render);
filterEl.addEventListener('change', render);

/* ---------- install prompt ---------- */
let deferredPrompt = null;
const installBtn = $('install-btn');
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  installBtn.hidden = false;
});
installBtn.addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  installBtn.hidden = true;
});
window.addEventListener('appinstalled', () => { installBtn.hidden = true; });

/* ---------- service worker ---------- */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}

render();
