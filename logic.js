/* ---------------------------------------------------------------------------
 * logic.js — Ilaaj (pure logic, NO DOM code)
 *
 * Every function below takes plain values in and returns plain values out,
 * so the whole file runs in Node without a browser. Data arrays come from
 * data.js and are PASSED IN as arguments (never reached for as globals),
 * so the same functions run in the browser and under `node test.js`.
 * app.js calls these functions to power the UI; test.js covers them.
 * -------------------------------------------------------------------------*/

/**
 * Format a PKR amount: 180000 → "₨ 180,000". Non-numeric input → "₨ —".
 */
function formatPKR(n) {
  const num = Number(n);
  if (!Number.isFinite(num)) return '₨ —';
  const grouped = String(Math.abs(Math.round(num))).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return (num < 0 ? '-₨ ' : '₨ ') + grouped;
}

/**
 * Filter hospitals by text query, city and the "Sehat Card accepted only"
 * toggle, then sort by distance (nearest first).
 * opts = { query: string, city: string ('All' = no filter), sehatOnly: bool }
 */
function filterHospitals(hospitals, opts) {
  const q = (opts.query || '').trim().toLowerCase();
  const city = opts.city || 'All';
  const sehatOnly = !!opts.sehatOnly;
  return hospitals
    .filter((h) => {
      if (sehatOnly && !h.sehatCardAccepted) return false;
      if (city !== 'All' && h.city !== city) return false;
      if (q) {
        const hay = (h.name + ' ' + h.city + ' ' + h.specialties.join(' ')).toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    })
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

/**
 * Coverage check: pick a treatment → the verdict.
 * Every treatment in the shared list is covered IN FULL at empanelled
 * Sehat Card hospitals, so the patient pays Rs 0 and the family limit drops
 * by the treatment's private cost.
 * Returns { found, name, privateCost, youPay, remaining, pctLeft }.
 */
function coverageCheck(treatments, treatmentId, familyLimit) {
  const t = treatments.find((x) => x.id === treatmentId);
  if (!t) return { found: false };
  const remaining = remainingAfter(familyLimit, t.cost);
  return {
    found: true,
    name: t.name,
    privateCost: t.cost,
    youPay: 0,
    remaining: remaining,
    pctLeft: familyLimit > 0 ? Math.round((remaining / familyLimit) * 100) : 0
  };
}

/**
 * Family-limit maths: limit − spent, never below 0.
 */
function remainingAfter(familyLimit, spent) {
  return Math.max(0, Math.round(familyLimit - spent));
}

/**
 * Look up a hospital by id. Returns the object or null.
 */
function hospitalById(hospitals, id) {
  return hospitals.find((h) => h.id === id) || null;
}

/**
 * Hospitals that cover a given treatment AND accept the Sehat Card,
 * nearest first. (The "where can Gul Bibi actually go" list.)
 */
function hospitalsForTreatment(hospitals, treatmentId) {
  return hospitals
    .filter((h) => h.sehatCardAccepted && h.treatmentsCovered.includes(treatmentId))
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

/**
 * Add a tout report (pure: returns a NEW array, never mutates the input).
 * report = { hospital: string, amount: number }. Empty hospital → null.
 */
function addReport(reports, report) {
  const hospital = String(report.hospital || '').trim();
  const amount = Math.max(0, Math.round(Number(report.amount) || 0));
  if (!hospital) return null;
  return reports.concat([{ hospital: hospital, amount: amount, at: Date.now() }]);
}

/**
 * How many reports name a given hospital (case-insensitive).
 */
function reportsForHospital(reports, hospital) {
  const h = String(hospital).trim().toLowerCase();
  return reports.filter((r) => String(r.hospital).trim().toLowerCase() === h).length;
}

/**
 * Checklist progress: { done, total, pct } from the list of checked ids.
 */
function checklistProgress(docs, checkedIds) {
  const total = docs.length;
  const done = docs.filter((d) => checkedIds.includes(d.id)).length;
  return { done: done, total: total, pct: total ? Math.round((done / total) * 100) : 0 };
}

/* One namespace export: works as a browser global AND a Node module. */
const Ilaaj = {
  formatPKR,
  filterHospitals,
  coverageCheck,
  remainingAfter,
  hospitalById,
  hospitalsForTreatment,
  addReport,
  reportsForHospital,
  checklistProgress
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Ilaaj;
}
