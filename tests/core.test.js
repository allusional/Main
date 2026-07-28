'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  starString,
  escapeHtml,
  parseEntries,
  filterEntries,
  computeStats,
} = require('../core.js');

test('starString', async (t) => {
  await t.test('renders the given number of filled stars', () => {
    assert.equal(starString(0), '☆☆☆☆☆');
    assert.equal(starString(3), '★★★☆☆');
    assert.equal(starString(5), '★★★★★');
  });

  await t.test('always returns exactly five glyphs', () => {
    for (let n = 0; n <= 5; n += 1) {
      assert.equal([...starString(n)].length, 5);
    }
  });

  await t.test('clamps out-of-range and non-integer input', () => {
    assert.equal(starString(-2), '☆☆☆☆☆');
    assert.equal(starString(9), '★★★★★');
    assert.equal(starString(3.9), '★★★☆☆');
  });
});

test('escapeHtml', async (t) => {
  await t.test('escapes all five HTML-significant characters', () => {
    assert.equal(escapeHtml(`<a href="x">&'`), '&lt;a href=&quot;x&quot;&gt;&amp;&#39;');
  });

  await t.test('leaves plain text untouched', () => {
    assert.equal(escapeHtml('Ethiopia Guji'), 'Ethiopia Guji');
  });

  await t.test('treats nullish/empty input as an empty string', () => {
    assert.equal(escapeHtml(undefined), '');
    assert.equal(escapeHtml(null), '');
    assert.equal(escapeHtml(''), '');
  });

  await t.test('neutralises a script-injection attempt', () => {
    assert.equal(
      escapeHtml('<script>alert(1)</script>'),
      '&lt;script&gt;alert(1)&lt;/script&gt;',
    );
  });
});

test('parseEntries', async (t) => {
  await t.test('parses a valid JSON array', () => {
    assert.deepEqual(parseEntries('[{"id":"e1"}]'), [{ id: 'e1' }]);
  });

  await t.test('returns [] for null / missing storage', () => {
    assert.deepEqual(parseEntries(null), []);
    assert.deepEqual(parseEntries(undefined), []);
  });

  await t.test('returns [] for corrupt JSON instead of throwing', () => {
    assert.deepEqual(parseEntries('{not json'), []);
  });

  await t.test('returns [] when the stored value is JSON null', () => {
    assert.deepEqual(parseEntries('null'), []);
  });
});

const SAMPLE = [
  { id: 'a', type: 'cafe', bean: 'Ethiopia Guji', roaster: 'Onyx', cafe: 'Blue Bottle', method: 'Espresso', rating: 5, date: '2024-01-03', created: 3 },
  { id: 'b', type: 'home', bean: 'Colombia', roaster: 'Onyx', method: 'Pour over', rating: 4, date: '2024-01-05', created: 5 },
  { id: 'c', type: 'home', bean: 'Kenya', method: 'Espresso', notes: 'fruity', rating: 3, date: '2024-01-05', created: 9 },
];

test('filterEntries', async (t) => {
  await t.test('returns everything (newest-first) with no filters', () => {
    const ids = filterEntries(SAMPLE, {}).map((e) => e.id);
    assert.deepEqual(ids, ['c', 'b', 'a']);
  });

  await t.test('breaks date ties by created timestamp (desc)', () => {
    // b and c share date 2024-01-05; c.created (9) > b.created (5)
    const ids = filterEntries(SAMPLE, {}).map((e) => e.id);
    assert.ok(ids.indexOf('c') < ids.indexOf('b'));
  });

  await t.test('filters by type', () => {
    const ids = filterEntries(SAMPLE, { type: 'home' }).map((e) => e.id);
    assert.deepEqual(ids, ['c', 'b']);
  });

  await t.test('matches the query across multiple fields, case-insensitively', () => {
    assert.deepEqual(filterEntries(SAMPLE, { query: 'onyx' }).map((e) => e.id), ['b', 'a']);
    assert.deepEqual(filterEntries(SAMPLE, { query: 'FRUITY' }).map((e) => e.id), ['c']);
    assert.deepEqual(filterEntries(SAMPLE, { query: 'blue bottle' }).map((e) => e.id), ['a']);
  });

  await t.test('trims whitespace-only queries to a no-op', () => {
    assert.equal(filterEntries(SAMPLE, { query: '   ' }).length, SAMPLE.length);
  });

  await t.test('combines type and query filters', () => {
    assert.deepEqual(filterEntries(SAMPLE, { type: 'home', query: 'espresso' }).map((e) => e.id), ['c']);
  });

  await t.test('returns [] when nothing matches', () => {
    assert.deepEqual(filterEntries(SAMPLE, { query: 'nope' }), []);
  });

  await t.test('does not mutate the input array', () => {
    const input = SAMPLE.slice();
    const snapshot = JSON.stringify(input);
    filterEntries(input, { query: 'onyx' });
    assert.equal(JSON.stringify(input), snapshot);
  });

  await t.test('tolerates a nullish entries argument', () => {
    assert.deepEqual(filterEntries(undefined, {}), []);
    assert.deepEqual(filterEntries(null), []);
  });
});

test('computeStats', async (t) => {
  await t.test('counts entries and averages ratings to one decimal', () => {
    const stats = computeStats(SAMPLE);
    assert.equal(stats.count, 3);
    assert.equal(stats.avg, '4.0'); // (5+4+3)/3
  });

  await t.test('picks the most-used brew method', () => {
    // Espresso appears twice, Pour over once
    assert.equal(computeStats(SAMPLE).favMethod, 'Espresso');
  });

  await t.test('uses en-dashes when there is nothing to summarise', () => {
    const stats = computeStats([]);
    assert.deepEqual(stats, { count: 0, avg: '–', favMethod: '–' });
  });

  await t.test('ignores unrated entries when averaging', () => {
    const stats = computeStats([
      { rating: 4, method: 'Drip' },
      { rating: 0, method: 'Drip' },
      { method: 'Drip' },
    ]);
    assert.equal(stats.avg, '4.0');
    assert.equal(stats.count, 3);
  });

  await t.test('reports no favourite method when none is set', () => {
    assert.equal(computeStats([{ rating: 5 }]).favMethod, '–');
  });

  await t.test('tolerates a nullish entries argument', () => {
    assert.deepEqual(computeStats(undefined), { count: 0, avg: '–', favMethod: '–' });
  });
});
