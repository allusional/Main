/* Bean Diary — pure, DOM-free logic.
   Shared between the browser app (app.js) and the unit tests. Kept side-effect
   free so it can run in a plain Node process without a DOM or localStorage. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api; // Node / test runner
  } else {
    root.BeanDiaryCore = api; // browser (classic script)
  }
})(typeof self !== 'undefined' ? self : this, function () {
  /* Render a 1–5 star rating as filled/empty star glyphs. Out-of-range values
     are clamped to 0–5 so the output always has exactly five characters. */
  function starString(n) {
    const filled = Math.max(0, Math.min(5, n | 0));
    return '★★★★★'.slice(0, filled) + '☆☆☆☆☆'.slice(0, 5 - filled);
  }

  /* Escape the five HTML-significant characters so user text is safe to inject
     into innerHTML. Nullish input becomes an empty string. */
  function escapeHtml(s) {
    return (s || '').replace(/[&<>"']/g, (c) => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
  }

  /* Parse the raw localStorage string into an array of entries, tolerating
     missing/corrupt data by falling back to an empty list. */
  function parseEntries(raw) {
    try {
      return JSON.parse(raw) || [];
    } catch {
      return [];
    }
  }

  /* Filter entries by type and a free-text query, then sort newest-first
     (by date, breaking ties with the creation timestamp). Never mutates the
     input array. */
  function filterEntries(entries, { query = '', type = '' } = {}) {
    const q = (query || '').trim().toLowerCase();
    return (entries || [])
      .filter((e) => !type || e.type === type)
      .filter((e) => {
        if (!q) return true;
        return [e.bean, e.roaster, e.cafe, e.origin, e.method, e.notes]
          .filter(Boolean).join(' ').toLowerCase().includes(q);
      })
      .slice()
      .sort((a, b) => (b.date || '').localeCompare(a.date || '') || b.created - a.created);
  }

  /* Summary statistics for the stats bar: total count, average rating
     (one decimal, or '–' when nothing is rated) and the most-used brew method
     (or '–' when none). */
  function computeStats(entries) {
    const list = entries || [];
    const rated = list.filter((e) => e.rating);
    const avg = rated.length
      ? (rated.reduce((s, e) => s + e.rating, 0) / rated.length).toFixed(1)
      : '–';
    const counts = {};
    list.forEach((e) => { if (e.method) counts[e.method] = (counts[e.method] || 0) + 1; });
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    return { count: list.length, avg, favMethod: top ? top[0] : '–' };
  }

  return { starString, escapeHtml, parseEntries, filterEntries, computeStats };
});
