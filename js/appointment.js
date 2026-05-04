// 4-step appointment flow with calendar + slots, persisted in localStorage

(function () {
  'use strict';

  const utils = window.SiteUtils;

  const AREAS = [
    { key: 'ticaret',   label: 'Ticaret Hukuku',       icon: '🏢' },
    { key: 'aile',      label: 'Aile Hukuku',          icon: '👨‍👩‍👧' },
    { key: 'gayrimenkul', label: 'Gayrimenkul Hukuku', icon: '🏠' },
    { key: 'ceza',      label: 'Ceza Hukuku',          icon: '⚖️' },
    { key: 'is',        label: 'İş Hukuku',            icon: '📋' },
    { key: 'icra',      label: 'İcra & İflas Hukuku',  icon: '💼' },
    { key: 'idare',     label: 'İdare Hukuku',         icon: '🛡️' },
    { key: 'miras',     label: 'Miras Hukuku',         icon: '🌍' },
    { key: 'fikri',     label: 'Fikri Mülkiyet',       icon: '💡' }
  ];
  const TIME_SLOTS = ['10:00', '11:00', '14:00', '15:00', '16:00'];
  const STORAGE_KEY = 'sy_booked';
  const DOW = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
  const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
                  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

  const state = {
    step: 1,
    area: null,
    date: null,
    time: null,
    info: null,
    calYear: 0,
    calMonth: 0
  };

  function getBooked() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  }
  function saveBooking(b) {
    const list = getBooked();
    list.push(b);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }
  function isSlotTaken(dateIso, time) {
    return getBooked().some(function (b) { return b.date === dateIso && b.time === time; });
  }
  function isDayFull(dateIso) {
    const taken = getBooked().filter(function (b) { return b.date === dateIso; });
    return taken.length >= TIME_SLOTS.length;
  }

  function isoDate(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
  }
  function startOfToday() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }

  // === Step navigation ===
  function goStep(n) {
    state.step = n;
    document.querySelectorAll('.step-panel').forEach(function (p) {
      p.classList.toggle('active', Number(p.getAttribute('data-step')) === n);
    });
    document.querySelectorAll('.steps .step').forEach(function (s) {
      const sn = Number(s.getAttribute('data-step'));
      s.classList.toggle('active', sn === n);
      s.classList.toggle('done', sn < n);
    });
    window.scrollTo({ top: document.querySelector('.appointment-wrap').offsetTop - 80, behavior: 'smooth' });
  }

  // === Step 1: Areas ===
  function renderAreas() {
    const grid = document.getElementById('area-grid');
    if (!grid) return;
    grid.innerHTML = AREAS.map(function (a) {
      const sel = state.area && state.area.key === a.key ? ' selected' : '';
      return '<button type="button" class="area-btn' + sel + '" data-key="' + a.key + '">'
        + '<span class="area-icon">' + a.icon + '</span><span>' + a.label + '</span></button>';
    }).join('');
    grid.addEventListener('click', function (e) {
      const btn = e.target.closest('.area-btn');
      if (!btn) return;
      const key = btn.getAttribute('data-key');
      state.area = AREAS.find(function (x) { return x.key === key; });
      grid.querySelectorAll('.area-btn').forEach(function (b) {
        b.classList.toggle('selected', b === btn);
      });
      updateNextButton(1);
    });
    updateNextButton(1);
  }

  // === Step 2: Calendar ===
  function renderCalendar() {
    const wrap = document.getElementById('calendar-wrap');
    if (!wrap) return;
    const y = state.calYear, m = state.calMonth;
    const first = new Date(y, m, 1);
    const last = new Date(y, m + 1, 0);
    const dowFirst = (first.getDay() + 6) % 7; // make Monday=0
    const today = startOfToday();
    const maxDate = new Date(today);
    maxDate.setMonth(maxDate.getMonth() + 2);

    const headerY = today.getFullYear();
    const headerM = today.getMonth();
    const prevDisabled = (y === headerY && m === headerM);
    const nextDisabled = (y === maxDate.getFullYear() && m === maxDate.getMonth());

    let html = ''
      + '<div class="cal-header">'
      +   '<h4>' + MONTHS[m] + ' ' + y + '</h4>'
      +   '<div class="cal-nav">'
      +     '<button type="button" id="cal-prev"' + (prevDisabled ? ' disabled' : '') + '>‹</button>'
      +     '<button type="button" id="cal-next"' + (nextDisabled ? ' disabled' : '') + '>›</button>'
      +   '</div>'
      + '</div>'
      + '<div class="cal-grid">';
    DOW.forEach(function (d) { html += '<div class="cal-dow">' + d + '</div>'; });
    for (let i = 0; i < dowFirst; i++) html += '<div class="cal-day empty"></div>';
    for (let d = 1; d <= last.getDate(); d++) {
      const dt = new Date(y, m, d);
      const iso = isoDate(dt);
      const isPast = dt < today;
      const dow = dt.getDay();
      const isWeekend = (dow === 0 || dow === 6);
      const isFull = isDayFull(iso);
      const isToday = iso === isoDate(today);
      const isSel = state.date === iso;
      const disabled = isPast || isWeekend || isFull;
      const cls = ['cal-day'];
      if (isToday) cls.push('today');
      if (isSel) cls.push('selected');
      if (disabled) cls.push('disabled');
      html += '<button type="button" class="' + cls.join(' ') + '" data-iso="' + iso + '"'
        + (disabled ? ' disabled' : '') + '>' + d + '</button>';
    }
    html += '</div>'
      + '<div class="cal-legend">'
      +   '<span><i class="lg-avail"></i> Müsait</span>'
      +   '<span><i class="lg-sel"></i> Seçili</span>'
      +   '<span><i class="lg-disabled"></i> Kapalı (geçmiş / hafta sonu / dolu)</span>'
      + '</div>';
    wrap.innerHTML = html;

    const prev = document.getElementById('cal-prev');
    const next = document.getElementById('cal-next');
    if (prev) prev.addEventListener('click', function () {
      state.calMonth--;
      if (state.calMonth < 0) { state.calMonth = 11; state.calYear--; }
      renderCalendar();
    });
    if (next) next.addEventListener('click', function () {
      state.calMonth++;
      if (state.calMonth > 11) { state.calMonth = 0; state.calYear++; }
      renderCalendar();
    });

    wrap.querySelectorAll('.cal-day:not(.empty):not(.disabled):not(:disabled)').forEach(function (b) {
      b.addEventListener('click', function () {
        state.date = b.getAttribute('data-iso');
        wrap.querySelectorAll('.cal-day').forEach(function (x) { x.classList.remove('selected'); });
        b.classList.add('selected');
        updateNextButton(2);
      });
    });

    updateNextButton(2);
  }

  // === Step 3: Slots ===
  function renderSlots() {
    const wrap = document.getElementById('slots-wrap');
    const dateLbl = document.getElementById('slots-date');
    if (!wrap) return;
    if (dateLbl) dateLbl.textContent = utils.formatDate(state.date);
    wrap.innerHTML = TIME_SLOTS.map(function (t) {
      const taken = isSlotTaken(state.date, t);
      const sel = state.time === t ? ' selected' : '';
      return '<button type="button" class="slot' + sel + '" data-time="' + t + '"'
        + (taken ? ' disabled' : '') + '>' + t + '</button>';
    }).join('');
    wrap.querySelectorAll('.slot:not(:disabled)').forEach(function (b) {
      b.addEventListener('click', function () {
        state.time = b.getAttribute('data-time');
        wrap.querySelectorAll('.slot').forEach(function (x) { x.classList.remove('selected'); });
        b.classList.add('selected');
        updateNextButton(3);
      });
    });
    updateNextButton(3);
  }

  // === Step 4: Info form & confirm ===
  function bindInfoForm() {
    const form = document.getElementById('info-form');
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const fd = new FormData(form);
      state.info = {
        name: (fd.get('name') || '').toString().trim(),
        surname: (fd.get('surname') || '').toString().trim(),
        email: (fd.get('email') || '').toString().trim(),
        phone: (fd.get('phone') || '').toString().trim(),
        note: (fd.get('note') || '').toString().trim()
      };
      // Race-check: someone may have booked the slot in another tab between steps
      if (isSlotTaken(state.date, state.time)) {
        alert('Üzgünüz, bu saat dilimi az önce dolduruldu. Lütfen başka bir saat seçin.');
        goStep(3);
        renderSlots();
        return;
      }
      const booking = {
        date: state.date,
        time: state.time,
        area: state.area.label,
        areaKey: state.area.key,
        name: state.info.name,
        surname: state.info.surname,
        email: state.info.email,
        phone: state.info.phone,
        note: state.info.note,
        createdAt: new Date().toISOString()
      };
      saveBooking(booking);
      renderSummary(booking);
    });
  }

  function renderSummary(b) {
    const wrap = document.getElementById('summary-wrap');
    if (!wrap) return;
    wrap.innerHTML =
      '<div class="summary-card">'
      + '<div class="check-circle">✓</div>'
      + '<h3>Randevu Talebiniz Alındı</h3>'
      + '<p class="summary-sub">Aşağıdaki bilgilerle talebinizi kaydettik. En geç 24 saat içinde sizinle iletişime geçeceğiz.</p>'
      + '<div class="summary-list"><dl>'
      +   '<dt>Hukuki Alan</dt><dd>' + utils.escapeHtml(b.area) + '</dd>'
      +   '<dt>Tarih</dt><dd>' + utils.formatDate(b.date) + '</dd>'
      +   '<dt>Saat</dt><dd>' + utils.escapeHtml(b.time) + '</dd>'
      +   '<dt>Ad Soyad</dt><dd>' + utils.escapeHtml(b.name + ' ' + b.surname) + '</dd>'
      +   '<dt>E-posta</dt><dd>' + utils.escapeHtml(b.email) + '</dd>'
      + '</dl></div>'
      + '<div class="actions">'
      +   '<a class="btn btn-ghost" href="randevu.html">Yeni Randevu</a>'
      +   '<a class="btn btn-gold" href="index.html">Anasayfa</a>'
      + '</div></div>';
    document.querySelectorAll('.step-panel').forEach(function (p) { p.classList.remove('active'); });
    document.getElementById('panel-summary').classList.add('active');
    document.querySelectorAll('.steps .step').forEach(function (s) {
      s.classList.add('done'); s.classList.remove('active');
    });
    window.scrollTo({ top: document.querySelector('.appointment-wrap').offsetTop - 80, behavior: 'smooth' });
  }

  // === Next/Prev buttons enable/disable ===
  function updateNextButton(stepNum) {
    const nextBtn = document.querySelector('.step-panel[data-step="' + stepNum + '"] .next-btn');
    if (!nextBtn) return;
    let ok = false;
    if (stepNum === 1) ok = !!state.area;
    else if (stepNum === 2) ok = !!state.date;
    else if (stepNum === 3) ok = !!state.time;
    nextBtn.disabled = !ok;
  }

  function bindStepActions() {
    document.querySelectorAll('.next-btn').forEach(function (b) {
      b.addEventListener('click', function () {
        const cur = Number(b.closest('.step-panel').getAttribute('data-step'));
        if (cur === 2) renderSlots();
        goStep(cur + 1);
      });
    });
    document.querySelectorAll('.prev-btn').forEach(function (b) {
      b.addEventListener('click', function () {
        const cur = Number(b.closest('.step-panel').getAttribute('data-step'));
        goStep(cur - 1);
      });
    });
  }

  function init() {
    const wrap = document.querySelector('.appointment-wrap');
    if (!wrap) return;

    const today = startOfToday();
    state.calYear = today.getFullYear();
    state.calMonth = today.getMonth();

    renderAreas();
    renderCalendar();
    bindStepActions();
    bindInfoForm();

    // ?alan= preselect
    const preAlan = utils.qs('alan');
    if (preAlan) {
      const match = AREAS.find(function (a) { return a.key === preAlan; });
      if (match) {
        state.area = match;
        const grid = document.getElementById('area-grid');
        if (grid) {
          const btn = grid.querySelector('[data-key="' + preAlan + '"]');
          if (btn) btn.classList.add('selected');
        }
        goStep(2);
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
