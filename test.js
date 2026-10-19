/* ---------------------------------------------------------------------------
 * test.js — Node smoke test for Ilaaj's pure logic (logic.js) and data.
 * Run: node test.js
 * Exits non-zero on the first failure so CI/shell scripts catch problems.
 * -------------------------------------------------------------------------*/

const data = require('./data.js');
const I = require('./logic.js');

let passed = 0;
let failed = 0;

function ok(name, actual, expected) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) {
    passed++;
    console.log('  ✓ ' + name);
  } else {
    failed++;
    console.log('  ✗ FAIL: ' + name + ' — got ' + a + ', want ' + e);
  }
}

console.log('\n--- formatPKR ---');
ok('180000 → ₨ 180,000', I.formatPKR(180000), '₨ 180,000');
ok('0 → ₨ 0', I.formatPKR(0), '₨ 0');
ok('NaN → ₨ —', I.formatPKR(NaN), '₨ —');
ok('negative', I.formatPKR(-250), '-₨ 250');
ok('1000000 → ₨ 1,000,000', I.formatPKR(1000000), '₨ 1,000,000');

console.log('\n--- filterHospitals ---');
const H = data.HOSPITALS;
ok('no filters → 12, sorted by distance (nearest 0.9)',
  [I.filterHospitals(H, { query: '', city: 'All', sehatOnly: false }).length,
   I.filterHospitals(H, { query: '', city: 'All', sehatOnly: false })[0].distanceKm],
  [12, 0.9]);
ok('sehatOnly → 10 (drops the 2 non-empanelled)',
  I.filterHospitals(H, { query: '', city: 'All', sehatOnly: true }).length, 10);
ok('city Peshawar + sehatOnly → 4',
  I.filterHospitals(H, { query: '', city: 'Peshawar', sehatOnly: true }).length, 4);
ok('query "cardio" finds cardiology hospitals',
  I.filterHospitals(H, { query: 'cardio', city: 'All', sehatOnly: false }).length, 5);
ok('query "xyz" → none',
  I.filterHospitals(H, { query: 'xyz', city: 'All', sehatOnly: false }).length, 0);
ok('query matches specialty text, not just name',
  I.filterHospitals(H, { query: 'orthopedics', city: 'All', sehatOnly: false })[0].name,
  'Lady Reading Hospital');

console.log('\n--- coverageCheck ---');
const c1 = I.coverageCheck(data.TREATMENTS, 'gallbladder', data.FAMILY_LIMIT);
ok('gallbladder found', c1.found, true);
ok('private cost 180000', c1.privateCost, 180000);
ok('you pay 0', c1.youPay, 0);
ok('remaining 820000', c1.remaining, 820000);
ok('82% left', c1.pctLeft, 82);
const c2 = I.coverageCheck(data.TREATMENTS, 'angioplasty', data.FAMILY_LIMIT);
ok('angioplasty remaining 550000', c2.remaining, 550000);
ok('unknown treatment → not found', I.coverageCheck(data.TREATMENTS, 'nope', data.FAMILY_LIMIT).found, false);

console.log('\n--- remainingAfter ---');
ok('1000000 − 180000 = 820000', I.remainingAfter(1000000, 180000), 820000);
ok('never below 0', I.remainingAfter(1000000, 1500000), 0);

console.log('\n--- hospitalById / hospitalsForTreatment ---');
ok('lrh found', I.hospitalById(H, 'lrh').name, 'Lady Reading Hospital');
ok('unknown → null', I.hospitalById(H, 'xyz'), null);
const gt = I.hospitalsForTreatment(H, 'gallbladder');
ok('gallbladder empanelled list non-empty', gt.length > 0, true);
ok('all accept the card', gt.every((h) => h.sehatCardAccepted), true);
ok('sorted by distance', gt.every((h, i, a) => i === 0 || a[i - 1].distanceKm <= h.distanceKm), true);
ok('non-empanelled hospital excluded from angioplasty list',
  I.hospitalsForTreatment(H, 'angioplasty').every((h) => h.id !== 'shifa-sample'), true);

console.log('\n--- addReport / reportsForHospital ---');
const r0 = [];
const r1 = I.addReport(r0, { hospital: 'DHQ Hospital D.I. Khan', amount: '10000' });
ok('adds one report', r1.length, 1);
ok('amount parsed to number', r1[0].amount, 10000);
ok('input array not mutated', r0.length, 0);
ok('empty hospital → null', I.addReport(r0, { hospital: '  ', amount: 5000 }), null);
const r2 = I.addReport(r1, { hospital: 'dhq hospital d.i. khan', amount: 2000 });
ok('count is case-insensitive', I.reportsForHospital(r2, 'DHQ Hospital D.I. Khan'), 2);
ok('other hospital → 0', I.reportsForHospital(r2, 'Lady Reading Hospital'), 0);

console.log('\n--- checklistProgress ---');
ok('2 of 4 → 50%', I.checklistProgress(data.DOCS_CHECKLIST, ['cnic', 'slip']),
  { done: 2, total: 4, pct: 50 });
ok('all done → 100%', I.checklistProgress(data.DOCS_CHECKLIST,
  ['cnic', 'slip', 'referral', 'reports']).pct, 100);

console.log('\n--- data sanity ---');
ok('12 hospitals', data.HOSPITALS.length, 12);
ok('6 cities', data.CITIES.length, 6);
ok('7 treatments', data.TREATMENTS.length, 7);
ok('every hospital has name/city/type/distanceKm',
  data.HOSPITALS.every((h) => h.name && h.city && h.type && typeof h.distanceKm === 'number'), true);
ok('every hospital has specialties + treatmentsCovered arrays',
  data.HOSPITALS.every((h) => Array.isArray(h.specialties) && Array.isArray(h.treatmentsCovered)), true);
ok('non-empanelled hospitals cover no treatments',
  data.HOSPITALS.filter((h) => !h.sehatCardAccepted).every((h) => h.treatmentsCovered.length === 0), true);
ok('10 empanelled hospitals', data.HOSPITALS.filter((h) => h.sehatCardAccepted).length, 10);
ok('every treatment id is referenced by at least one hospital',
  data.TREATMENTS.every((t) => data.HOSPITALS.some((h) => h.treatmentsCovered.includes(t.id))), true);
ok('checklist has 4 docs', data.DOCS_CHECKLIST.length, 4);
ok('family limit is 1,000,000', data.FAMILY_LIMIT, 1000000);

console.log('\n====================================');
console.log('PASSED: ' + passed + '   FAILED: ' + failed);
console.log('====================================\n');
process.exit(failed === 0 ? 0 : 1);
