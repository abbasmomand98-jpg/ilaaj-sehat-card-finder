# Ilaaj — Sehat Card Hospital Finder

**Live demo:** https://abbasmomand98-jpg.github.io/ilaaj-sehat-card-finder/
**Repo:** https://github.com/abbasmomand98-jpg/ilaaj-sehat-card-finder

Sehat Card Plus gives every registered family in Khyber Pakhtunkhwa up to **Rs 1,000,000 per year of FREE inpatient treatment** — but patients can't find *which* hospital accepts the card for *which* treatment. They arrive at the wrong hospital and get turned away, they don't know their coverage balance, and touts outside hospitals charge "facilitation fees" for treatment that is supposed to be free.

**Ilaaj** is a mobile-first web app (pure HTML/CSS/JS, no frameworks) that fixes exactly that.

## Features

1. **Hospital finder** — search hospitals by name, city or specialty; filter by city (Peshawar, Mardan, Swat, Abbottabad, D.I. Khan, Kohat); a "Sehat Card accepted only" toggle; results sorted by distance with green "✓ Sehat Card accepted" badges.
2. **Coverage checker** — pick a treatment (gallbladder surgery, cataract, hernia, C-section, appendectomy, angioplasty, dialysis) and get an instant verdict: covered in full, the private quote vs. what you pay (**Rs 0**), and the family-limit maths (Rs 1,000,000 − cost = what's left), plus the empanelled hospitals that offer it, nearest first.
3. **Admission guide** — a document checklist (CNIC, Sehat Card eligibility slip, referral slip, previous reports) saved in `localStorage` so it survives a refresh.
4. **Report a tout** — an anonymous "facilitation fee" report form; reports persist in `localStorage` and a public counter shows how many have been filed.

## How it works

The app is split into three layers on purpose:

- **`data.js`** — every fact lives here: the 6 cities, the 7 treatments with typical private costs in PKR, the 12 hospitals (name, city, type, empanelment flag, specialties, distance, treatments covered), the document checklist, and seed reports. Change a price or add a hospital and you edit only this file.
- **`logic.js`** — pure functions, zero DOM code: `filterHospitals()` (search + city + toggle, sorted by distance), `coverageCheck()` (verdict + family-limit maths), `remainingAfter()`, `hospitalsForTreatment()`, `addReport()` / `reportsForHospital()`, `checklistProgress()`, `formatPKR()`. Because they take values in and return values out, they run identically in the browser and under Node.
- **`app.js`** — thin DOM wiring: tabs, chips, the finder list, the coverage verdict card, the checklist (persisted to `localStorage`), and the report form. It calls `logic.js` for every decision.
- **`test.js`** — 44 assertions over `logic.js` and the data. Run `node test.js`; it exits non-zero on the first failure.

## What you can learn from this project

- **Separation of concerns without a framework.** Data, logic and presentation are three files that never reach into each other — the same architecture frameworks enforce, built with plain script tags.
- **Pure functions are testable functions.** `logic.js` has no `document`, no `localStorage`, no globals from `data.js` — arguments in, results out — so the whole business layer runs under `node test.js` with zero browser needed.
- **localStorage as a tiny database.** The checklist and the tout reports persist across visits with a guarded `store` wrapper (some webviews block storage — the app degrades gracefully instead of crashing).
- **Search + filter UX patterns.** One `filterHospitals()` pipeline composes text search, a city filter and a boolean toggle, then sorts by distance — the same pattern behind most listing apps.
- **Designing for trust.** Money and health are high-stakes: the verdict screen leads with "You pay Rs 0", the family-limit bar makes the abstract Rs 10 lakh concrete, and sample data is labelled as sample everywhere it appears.

## A note on the data (please read)

The public hospitals named here (Lady Reading, Hayatabad Medical Complex, Khyber Teaching, Mardan Medical Complex, Saidu Teaching, Ayub Teaching, DHQ D.I. Khan, KDA Kohat) are real KP hospitals. Entries marked **(sample)** are invented examples included so the finder can also show the "not empanelled" state. Treatment costs are realistic PKR estimates, not official Sehat Card package rates. **A production version must use the official Sehat Card empanelled-hospital list and package rates** — this demo is a UX concept that proves the interaction model.

## Try it

Open the [live demo](https://abbasmomand98-jpg.github.io/ilaaj-sehat-card-finder/), search for "cardiology", flip the Sehat Card toggle, then check what gallbladder surgery really costs a cardholder. **Fork it** — swap in your own province's hospitals, your own treatment list, your own language — and adapt the pattern to whatever local problem you see around you.
