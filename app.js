/* Bean Diary — a tiny offline coffee journal.
   All data lives in the browser via localStorage, so it stays on the phone. */

const STORE_KEY = 'bean-diary-entries-v1';
const { starString, escapeHtml, parseEntries, filterEntries, computeStats } = window.BeanDiaryCore;

/* ---------- data helpers ---------- */
function loadEntries() {
  return parseEntries(localStorage.getItem(STORE_KEY));
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

/* ---------- rendering ---------- */
function render() {
  const visible = filterEntries(entries, { query: searchEl.value, type: filterEl.value });

  listEl.innerHTML = visible.map((e) => {
    const place = e.type === 'cafe' ? (e.cafe || 'Café') : 'Home brew';
    const bits = [e.roaster, e.origin, place].filter(Boolean).join(' · ');
    const tags = [
      `<span class="tag type ${e.type === 'home' ? 'home' : ''}">${e.type === 'home' ? 'Home' : 'Café'}</span>`,
      e.method ? `<span class="tag">${escapeHtml(e.method)}</span>` : '',
      e.roast ? `<span class="tag">${escapeHtml(e.roast)}</span>` : '',
      e.price ? `<span class="tag">$${escapeHtml(e.price)}</span>` : '',
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
  const stats = computeStats(entries);
  $('stat-count').textContent = stats.count;
  $('stat-avg').textContent = stats.avg;
  $('stat-fav').textContent = stats.favMethod;
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
    $('f-bean').value = entry.bean || '';
    $('f-roaster').value = entry.roaster || '';
    $('f-cafe').value = entry.cafe || '';
    $('f-origin').value = entry.origin || '';
    $('f-method').value = entry.method || 'Espresso';
    $('f-roast').value = entry.roast || '';
    $('f-price').value = entry.price || '';
    $('f-date').value = entry.date || '';
    $('f-notes').value = entry.notes || '';
    setRating(entry.rating || 0);
    $('delete-btn').hidden = false;
  } else {
    $('form-title').textContent = 'New entry';
    $('entry-id').value = '';
    $('f-date').value = new Date().toISOString().slice(0, 10);
    setRating(0);
    $('delete-btn').hidden = true;
  }
  updateTypeFields();
  modalEl.hidden = false;
}
function closeModal() { modalEl.hidden = true; }

function updateTypeFields() {
  const isCafe = document.querySelector('input[name=type]:checked').value === 'cafe';
  cafeField.style.display = isCafe ? '' : 'none';
}
document.querySelectorAll('input[name=type]').forEach((r) =>
  r.addEventListener('change', updateTypeFields));

/* ---------- save / delete ---------- */
formEl.addEventListener('submit', (ev) => {
  ev.preventDefault();
  const id = $('entry-id').value;
  const data = {
    type: document.querySelector('input[name=type]:checked').value,
    bean: $('f-bean').value.trim(),
    roaster: $('f-roaster').value.trim(),
    cafe: $('f-cafe').value.trim(),
    origin: $('f-origin').value.trim(),
    method: $('f-method').value,
    roast: $('f-roast').value,
    price: $('f-price').value.trim(),
    date: $('f-date').value,
    notes: $('f-notes').value.trim(),
    rating: currentRating,
  };
  if (id) {
    const i = entries.findIndex((e) => e.id === id);
    if (i > -1) entries[i] = { ...entries[i], ...data };
  } else {
    entries.push({ id: 'e' + Date.now().toString(36), created: Date.now(), ...data });
  }
  saveEntries(entries);
  render();
  closeModal();
});

$('delete-btn').addEventListener('click', () => {
  const id = $('entry-id').value;
  if (id && confirm('Delete this entry?')) {
    entries = entries.filter((e) => e.id !== id);
    saveEntries(entries);
    render();
    closeModal();
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
