/* Bean Diary — a tiny offline coffee journal.
   All data lives in the browser via localStorage, so it stays on the phone. */

const STORE_KEY = 'bean-diary-entries-v1';
const BACKUP_KEY_PREFIX = 'bean-diary-unreadable-';

/* ---------- user-visible errors ---------- */
let toastTimer = null;
function reportError(message, error) {
  console.error(message, error);
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.hidden = true; }, 6000);
}

window.addEventListener('error', (ev) => {
  reportError('Something went wrong. Your last action may not have been saved.', ev.error || ev.message);
});
window.addEventListener('unhandledrejection', (ev) => {
  reportError('Something went wrong. Your last action may not have been saved.', ev.reason);
});

/* ---------- data helpers ---------- */
function loadEntries() {
  let raw;
  try {
    raw = localStorage.getItem(STORE_KEY);
  } catch (err) {
    reportError('Cannot read your saved entries — browser storage is unavailable.', err);
    return [];
  }
  if (raw === null) return [];

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    quarantine(raw, err);
    return [];
  }
  if (!Array.isArray(parsed)) {
    quarantine(raw, new TypeError(`expected an array, got ${typeof parsed}`));
    return [];
  }
  return parsed;
}

/* Keep unreadable data around instead of letting the next save overwrite it. */
function quarantine(raw, err) {
  let kept = false;
  try {
    localStorage.setItem(BACKUP_KEY_PREFIX + Date.now(), raw);
    kept = true;
  } catch (backupErr) {
    console.error('Could not back up unreadable entries', backupErr);
  }
  reportError(
    kept
      ? 'Your saved entries could not be read; a copy was kept in browser storage.'
      : 'Your saved entries could not be read and could not be backed up.',
    err
  );
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
function starString(n) {
  return '★★★★★'.slice(0, n) + '☆☆☆☆☆'.slice(0, 5 - n);
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
    const typeRadio = document.querySelector(`input[name=type][value="${CSS.escape(entry.type || '')}"]`)
      || $('type-cafe');
    typeRadio.checked = true;
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
  const previous = entries;
  if (id) {
    const i = entries.findIndex((e) => e.id === id);
    if (i < 0) {
      reportError('That entry no longer exists, so it could not be saved.');
      return;
    }
    entries = entries.map((e, idx) => (idx === i ? { ...e, ...data } : e));
  } else {
    entries = [...entries, { id: 'e' + Date.now().toString(36), created: Date.now(), ...data }];
  }
  try {
    saveEntries(entries);
  } catch (err) {
    entries = previous;
    reportError('Could not save your entry — browser storage is full or unavailable.', err);
    return;
  }
  render();
  closeModal();
});

$('delete-btn').addEventListener('click', () => {
  const id = $('entry-id').value;
  if (!id || !confirm('Delete this entry?')) return;
  const previous = entries;
  entries = entries.filter((e) => e.id !== id);
  try {
    saveEntries(entries);
  } catch (err) {
    entries = previous;
    reportError('Could not delete your entry — browser storage is unavailable.', err);
    return;
  }
  render();
  closeModal();
});

/* ---------- wiring ---------- */
$('add-btn').addEventListener('click', () => openModal(null));
$('close-btn').addEventListener('click', closeModal);
modalEl.addEventListener('click', (ev) => { if (ev.target === modalEl) closeModal(); });
listEl.addEventListener('click', (ev) => {
  const li = ev.target.closest('.entry');
  if (!li) return;
  const entry = entries.find((e) => e.id === li.dataset.id);
  if (!entry) {
    reportError('That entry could not be found. Refreshing the list.');
    render();
    return;
  }
  openModal(entry);
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
  try {
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    installBtn.hidden = true;
  } catch (err) {
    reportError('The install prompt could not be shown. Use your browser menu to install.', err);
  } finally {
    deferredPrompt = null;
  }
});
window.addEventListener('appinstalled', () => { installBtn.hidden = true; });

/* ---------- service worker ---------- */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch((err) => {
      reportError('Offline mode is unavailable — the service worker failed to register.', err);
    });
  });
}

render();
