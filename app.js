/* ---------------------------------------------------------------------------
 * app.js — Ilaaj (DOM wiring; all maths live in logic.js, all facts in
 * data.js). Runs in the browser only.
 * -------------------------------------------------------------------------*/
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };

  /* ---------- storage (guarded: some webviews block localStorage) ---------- */
  var store = {
    get: function (key, fallback) {
      try {
        var raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
      } catch (e) { return fallback; }
    },
    set: function (key, val) {
      try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { /* ignore */ }
    }
  };

  /* ---------- tabs ---------- */
  function showView(name) {
    document.querySelectorAll('.view').forEach(function (v) {
      v.classList.toggle('active', v.id === name);
    });
    document.querySelectorAll('.tab').forEach(function (t) {
      t.classList.toggle('active', t.getAttribute('data-view') === name);
    });
    window.scrollTo(0, 0);
  }
  document.querySelectorAll('.tab').forEach(function (t) {
    t.addEventListener('click', function () { showView(t.getAttribute('data-view')); });
  });
  document.querySelectorAll('[data-goto]').forEach(function (b) {
    b.addEventListener('click', function () { showView(b.getAttribute('data-goto')); });
  });

  /* ---------- finder ---------- */
  var finderState = { query: '', city: 'All', sehatOnly: true };

  function renderCityChips() {
    var box = $('finder-cities');
    box.innerHTML = '';
    ['All'].concat(CITIES).forEach(function (c) {
      var b = document.createElement('button');
      b.className = 'chip' + (finderState.city === c ? ' on' : '');
      b.textContent = c;
      b.addEventListener('click', function () {
        finderState.city = c;
        renderCityChips();
        renderFinder();
      });
      box.appendChild(b);
    });
  }

  function renderFinder() {
    var list = Ilaaj.filterHospitals(HOSPITALS, finderState);
    $('finder-count').textContent = list.length + ' hospital' + (list.length === 1 ? '' : 's') + ' near you';
    var box = $('finder-list');
    box.innerHTML = '';
    if (!list.length) {
      box.innerHTML = '<div class="empty">No hospitals match — try clearing the search or switching the city.</div>';
      return;
    }
    list.forEach(function (h) {
      var card = document.createElement('div');
      card.className = 'card hosp';
      var sample = h.name.indexOf('(sample)') !== -1
        ? ' <span class="sample-tag">sample entry</span>' : '';
      card.innerHTML =
        '<div class="hosp-top"><div><div class="hosp-name">' + h.name + sample + '</div>' +
        '<div class="hosp-meta">' + h.city + ' · ' + h.type + '</div></div>' +
        '<div class="dist">📍 ' + h.distanceKm + ' km</div></div>' +
        '<span class="badge ' + (h.sehatCardAccepted ? 'ok' : 'no') + '">' +
        (h.sehatCardAccepted ? '✓ Sehat Card accepted' : '✗ Not empanelled') + '</span>' +
        '<div class="specs">' + h.specialties.map(function (s) {
          return '<span class="spec">' + s + '</span>';
        }).join('') + '</div>';
      box.appendChild(card);
    });
  }

  $('finder-search').addEventListener('input', function (e) {
    finderState.query = e.target.value;
    renderFinder();
  });
  $('finder-sehat').addEventListener('change', function (e) {
    finderState.sehatOnly = e.target.checked;
    renderFinder();
  });

  /* ---------- coverage checker ---------- */
  function renderTreatmentOptions() {
    var sel = $('coverage-treatment');
    TREATMENTS.forEach(function (t) {
      var o = document.createElement('option');
      o.value = t.id;
      o.textContent = t.name + ' — ' + Ilaaj.formatPKR(t.cost);
      sel.appendChild(o);
    });
  }

  function renderCoverage() {
    var r = Ilaaj.coverageCheck(TREATMENTS, $('coverage-treatment').value, FAMILY_LIMIT);
    var box = $('coverage-result');
    if (!r.found) {
      box.innerHTML = '<div class="empty">Pick a treatment to check its coverage.</div>';
      $('coverage-hospitals').innerHTML = '';
      return;
    }
    box.innerHTML =
      '<div class="verdict"><div class="big">✓ COVERED</div>' +
      '<p>Fully free at any empanelled Sehat Card hospital in KP.</p></div>' +
      '<div class="card"><h2>What it costs</h2>' +
      '<div class="kv"><span>Private hospital quote</span><span class="v">' + Ilaaj.formatPKR(r.privateCost) + '</span></div>' +
      '<div class="kv"><span>Sehat Card pays</span><span class="v" style="color:var(--good)">' + Ilaaj.formatPKR(r.privateCost) + '</span></div>' +
      '<div class="kv total"><span>You pay</span><span class="v">Rs 0</span></div></div>' +
      '<div class="card"><h2>Family yearly limit</h2>' +
      '<p class="muted">' + Ilaaj.formatPKR(FAMILY_LIMIT) + ' per registered family</p>' +
      '<div style="font-size:22px;font-weight:800;color:var(--cyan-dk)">' +
      Ilaaj.formatPKR(r.remaining) + ' left after this</div>' +
      '<div class="bar"><div style="width:' + r.pctLeft + '%"></div></div>' +
      '<p class="muted">' + r.pctLeft + '% of limit remaining</p></div>';

    var hs = Ilaaj.hospitalsForTreatment(HOSPITALS, $('coverage-treatment').value);
    var hb = $('coverage-hospitals');
    hb.innerHTML = '<div class="section-title">Where you can get it (' + hs.length + ')</div>';
    if (!hs.length) {
      hb.innerHTML += '<div class="empty">No empanelled hospital in the sample list covers this yet.</div>';
      return;
    }
    hs.forEach(function (h) {
      var card = document.createElement('div');
      card.className = 'card hosp';
      card.innerHTML =
        '<div class="hosp-top"><div><div class="hosp-name">' + h.name + '</div>' +
        '<div class="hosp-meta">' + h.city + ' · ' + h.type + '</div></div>' +
        '<div class="dist">📍 ' + h.distanceKm + ' km</div></div>' +
        '<span class="badge ok">✓ Sehat Card accepted</span>';
      hb.appendChild(card);
    });
  }

  $('coverage-check').addEventListener('click', renderCoverage);

  /* ---------- guide: checklist ---------- */
  function checkedDocs() { return store.get('ilaaj-docs', ['cnic', 'slip']); }

  function renderChecklist() {
    var checked = checkedDocs();
    var p = Ilaaj.checklistProgress(DOCS_CHECKLIST, checked);
    $('guide-progress').textContent = p.done + ' of ' + p.total + ' documents ready';
    var box = $('guide-checklist');
    box.innerHTML = '';
    DOCS_CHECKLIST.forEach(function (d) {
      var row = document.createElement('div');
      row.className = 'doc-row';
      var done = checked.indexOf(d.id) !== -1;
      row.innerHTML =
        '<span class="checkbox' + (done ? ' done' : '') + '">' + (done ? '✓' : '') + '</span>' +
        '<span><span class="doc-label' + (done ? ' done' : '') + '">' + d.label + '</span><br>' +
        '<span class="doc-hint">' + d.hint + '</span></span>';
      row.addEventListener('click', function () {
        var c = checkedDocs();
        var i = c.indexOf(d.id);
        if (i === -1) c.push(d.id); else c.splice(i, 1);
        store.set('ilaaj-docs', c);
        renderChecklist();
      });
      box.appendChild(row);
    });
  }

  /* ---------- guide: tout reports ---------- */
  function allReports() {
    var saved = store.get('ilaaj-reports', null);
    if (saved) return saved;
    return SEED_REPORTS.map(function (r) {
      return { hospital: r.hospital, amount: r.amount, at: Date.now() };
    });
  }

  function renderReports() {
    var reports = allReports();
    $('report-count').textContent = '🚩 ' + reports.length + ' reports filed';
    var box = $('report-list');
    box.innerHTML = '';
    var sorted = reports.slice().sort(function (a, b) { return b.at - a.at; });
    sorted.forEach(function (r) {
      var card = document.createElement('div');
      card.className = 'card report';
      card.innerHTML =
        '<div class="hosp-name">' + r.hospital + '</div>' +
        '<div class="hosp-meta">Asked ' + Ilaaj.formatPKR(r.amount) + ' · reported anonymously</div>';
      box.appendChild(card);
    });
  }

  $('report-submit').addEventListener('click', function () {
    var err = $('report-error');
    err.style.display = 'none';
    var next = Ilaaj.addReport(allReports(), {
      hospital: $('report-hospital').value,
      amount: $('report-amount').value
    });
    if (!next) {
      err.textContent = 'Please enter the hospital name.';
      err.style.display = 'block';
      return;
    }
    store.set('ilaaj-reports', next);
    $('report-hospital').value = '';
    $('report-amount').value = '';
    renderReports();
  });

  /* ---------- init ---------- */
  renderCityChips();
  renderFinder();
  renderTreatmentOptions();
  renderChecklist();
  renderReports();
})();
