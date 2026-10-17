import assert from 'node:assert/strict';
import { cairoDateTimeInput, parseCairoDateTime } from '../lib/cairo-datetime.ts';

const cases = [
  ['2026-10-30T19:00', '2026-10-30T17:00:00.000Z'],
  ['2026-10-31T02:00', '2026-10-31T00:00:00.000Z'],
  ['2026-07-01T19:00', '2026-07-01T16:00:00.000Z'],
  ['2026-01-01T02:00', '2026-01-01T00:00:00.000Z'],
];
for (const [local, utc] of cases) {
  assert.equal(parseCairoDateTime(local).toISOString(), utc);
  assert.equal(cairoDateTimeInput(utc), local);
}
for (const invalid of ['bad', '2026-02-30T19:00', '2026-04-24T00:30']) {
  assert.ok(Number.isNaN(parseCairoDateTime(invalid).getTime()), invalid);
}
assert.equal(cairoDateTimeInput(null), '');
assert.equal(cairoDateTimeInput('bad'), '');
assert.equal((parseCairoDateTime(cases[1][0]) - parseCairoDateTime(cases[0][0])) / 3600000, 7);
console.log('Cairo datetime checks passed: winter, summer, overnight, round trip, invalid dates and DST gap.');
