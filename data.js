/* ---------------------------------------------------------------------------
 * data.js — Ilaaj (Sehat Card Hospital Finder)
 *
 * All content lives here: the KP city list, the shared treatment list with
 * typical private-hospital costs in PKR, the 12 sample hospitals, and the
 * admission document checklist. Editing a cost or adding a hospital means
 * editing ONLY this file — logic.js and app.js never hard-code facts.
 *
 * Notes on realism (demo data):
 *  - Public hospitals named here (Lady Reading, Hayatabad Medical Complex,
 *    Khyber Teaching, Mardan Medical Complex, Saidu Teaching, Ayub
 *    Teaching, DHQ D.I. Khan, KDA Kohat) are real, well-known KP hospitals.
 *  - Entries suffixed "(sample)" are invented private-style examples so the
 *    finder can also demonstrate the "not empanelled" filter state.
 *  - Treatment costs are realistic PKR estimates for private hospitals in
 *    KP, Oct 2026. A real product would pull empanelment + package rates
 *    from the official Sehat Card panel list; here they are SAMPLE data so
 *    the UI, filters and coverage maths are real.
 *  - Sehat Card Plus: up to Rs 1,000,000 per registered family per year of
 *    free inpatient treatment at empanelled hospitals.
 * -------------------------------------------------------------------------*/

/* Yearly free-treatment limit per registered family (PKR). */
const FAMILY_LIMIT = 1000000;

/* Cities covered by the finder. */
const CITIES = [
  'Peshawar', 'Mardan', 'Swat', 'Abbottabad', 'D.I. Khan', 'Kohat'
];

/* Shared treatment list: id + typical private-hospital cost (PKR). */
const TREATMENTS = [
  { id: 'gallbladder', name: 'Gallbladder surgery',   cost: 180000 },
  { id: 'cataract',    name: 'Cataract surgery',      cost: 60000  },
  { id: 'hernia',      name: 'Hernia repair',         cost: 120000 },
  { id: 'csection',    name: 'C-section delivery',    cost: 150000 },
  { id: 'appendectomy',name: 'Appendectomy',          cost: 140000 },
  { id: 'angioplasty', name: 'Angioplasty / stenting',cost: 450000 },
  { id: 'dialysis',    name: 'Dialysis session',      cost: 8000   }
];

/* Hospitals: distanceKm is from the user's set location (Peshawar demo). */
const HOSPITALS = [
  {
    id: 'lrh', name: 'Lady Reading Hospital', city: 'Peshawar', type: 'Public',
    sehatCardAccepted: true, distanceKm: 1.2,
    specialties: ['Surgery', 'Cardiology', 'Orthopedics', 'Emergency'],
    treatmentsCovered: ['gallbladder', 'cataract', 'hernia', 'appendectomy', 'angioplasty', 'dialysis']
  },
  {
    id: 'hmc', name: 'Hayatabad Medical Complex', city: 'Peshawar', type: 'Public',
    sehatCardAccepted: true, distanceKm: 6.5,
    specialties: ['Surgery', 'Nephrology', 'Cardiology'],
    treatmentsCovered: ['gallbladder', 'hernia', 'appendectomy', 'dialysis']
  },
  {
    id: 'kth', name: 'Khyber Teaching Hospital', city: 'Peshawar', type: 'Public',
    sehatCardAccepted: true, distanceKm: 3.8,
    specialties: ['Surgery', 'Medicine', 'Pediatrics'],
    treatmentsCovered: ['gallbladder', 'cataract', 'hernia', 'csection', 'appendectomy']
  },
  {
    id: 'mmc', name: 'Mardan Medical Complex', city: 'Mardan', type: 'Public',
    sehatCardAccepted: true, distanceKm: 0.9,
    specialties: ['Surgery', 'Gynecology', 'Medicine'],
    treatmentsCovered: ['gallbladder', 'csection', 'hernia', 'appendectomy']
  },
  {
    id: 'sth', name: 'Saidu Teaching Hospital', city: 'Swat', type: 'Public',
    sehatCardAccepted: true, distanceKm: 2.1,
    specialties: ['Surgery', 'Medicine', 'Cardiology'],
    treatmentsCovered: ['gallbladder', 'cataract', 'angioplasty', 'dialysis']
  },
  {
    id: 'ath', name: 'Ayub Teaching Hospital', city: 'Abbottabad', type: 'Public',
    sehatCardAccepted: true, distanceKm: 1.5,
    specialties: ['Surgery', 'Orthopedics', 'Cardiology'],
    treatmentsCovered: ['gallbladder', 'hernia', 'angioplasty']
  },
  {
    id: 'dhq-dik', name: 'DHQ Hospital D.I. Khan', city: 'D.I. Khan', type: 'Public',
    sehatCardAccepted: true, distanceKm: 2.6,
    specialties: ['Surgery', 'Gynecology'],
    treatmentsCovered: ['gallbladder', 'csection', 'cataract', 'appendectomy']
  },
  {
    id: 'kda-kohat', name: 'KDA Teaching Hospital Kohat', city: 'Kohat', type: 'Public',
    sehatCardAccepted: true, distanceKm: 1.1,
    specialties: ['Surgery', 'Medicine'],
    treatmentsCovered: ['gallbladder', 'hernia', 'appendectomy']
  },
  {
    id: 'nwg-sample', name: 'Northwest General (sample)', city: 'Peshawar', type: 'Private',
    sehatCardAccepted: true, distanceKm: 5.2,
    specialties: ['Cardiology', 'Surgery'],
    treatmentsCovered: ['angioplasty', 'gallbladder']
  },
  {
    id: 'prime-sample', name: 'Prime Care Hospital (sample)', city: 'Mardan', type: 'Private',
    sehatCardAccepted: true, distanceKm: 3.3,
    specialties: ['Surgery', 'Orthopedics'],
    treatmentsCovered: ['gallbladder', 'hernia']
  },
  {
    id: 'shifa-sample', name: 'Shifa Care Abbottabad (sample)', city: 'Abbottabad', type: 'Private',
    sehatCardAccepted: false, distanceKm: 2.2,
    specialties: ['Surgery'],
    treatmentsCovered: []
  },
  {
    id: 'valley-sample', name: 'Valley Clinic Swat (sample)', city: 'Swat', type: 'Private',
    sehatCardAccepted: false, distanceKm: 4.4,
    specialties: ['Medicine'],
    treatmentsCovered: []
  }
];

/* Admission document checklist (persisted to localStorage when ticked). */
const DOCS_CHECKLIST = [
  { id: 'cnic',    label: "Patient's CNIC (original)",        hint: 'Required at the admission desk' },
  { id: 'slip',    label: 'Sehat Card eligibility slip',      hint: 'Print from the Sehat Card portal or NADRA e-sahulat' },
  { id: 'referral',label: 'Hospital referral slip',          hint: 'If referred from a BHU / RHC / DHQ' },
  { id: 'reports', label: 'Previous medical reports',        hint: 'Ultrasound, blood tests, old prescriptions' }
];

/* Seed reports shown so the counter is alive on first load (sample data). */
const SEED_REPORTS = [
  { hospital: 'Northwest General (sample)', amount: 15000 },
  { hospital: 'Prime Care Hospital (sample)', amount: 8000 }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { FAMILY_LIMIT, CITIES, TREATMENTS, HOSPITALS, DOCS_CHECKLIST, SEED_REPORTS };
}
