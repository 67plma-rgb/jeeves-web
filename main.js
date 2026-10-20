/* Jeeves Robotics · interacciones del sitio */
(function () {
  'use strict';
  var doc = document.documentElement;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var WHATSAPP = '525636422489';

  /* ---------- Intro "Jeeves despierta" (una vez por visita) ---------- */
  function ready() { doc.classList.add('ready'); }
  (function intro() {
    var el = $('#intro');
    var force = /[?&]intro\b/.test(location.search), seen = false;
    try { seen = !!sessionStorage.getItem('jv-intro'); } catch (e) {}
    if (!el || (seen && !force)) { if (el) el.remove(); ready(); return; }
    try { sessionStorage.setItem('jv-intro', '1'); } catch (e) {}
    doc.classList.add('intro');
    var lts = $$('.lt', el), word = $('.i-word', el), fx = $('.i-fx', el), timers = [], done = false;
    function at(fn, ms) { timers.push(setTimeout(fn, ms)); }
    function add(c) { el.classList.add(c); }
    function finish() {
      if (done) return; done = true; timers.forEach(clearTimeout);
      document.removeEventListener('keydown', onKey);
      doc.classList.remove('intro'); ready(); window.dispatchEvent(new Event('resize'));
      requestAnimationFrame(function () { add('open'); });
      setTimeout(function () { el.remove(); }, 1400);
    }
    function onKey(e) { if (e.key === 'Escape') finish(); }
    document.addEventListener('keydown', onKey);
    $('.i-skip', el).addEventListener('click', finish);
    function pum() {
      add('hit');
      for (var i = 0; i < 18; i++) {
        var s = document.createElement('i'), a = Math.PI * 2 * i / 18 + Math.random() * .25, d = 90 + Math.random() * 200;
        s.style.setProperty('--x', Math.cos(a) * d + 'px'); s.style.setProperty('--y', Math.sin(a) * d * .65 + 'px'); fx.appendChild(s);
      }
    }
    if (reduce) {
      add('static'); add('f-on'); add('f-open'); add('f-happy'); lts.forEach(function (l) { l.classList.add('on'); });
      at(finish, 1600); return;
    }
    function start() {
      /* La línea guía cruza la pantalla y cada letra aparece cuando el punto pasa por ella */
      var RUN = 2600, T0 = 250, vw = window.innerWidth;
      at(function () { add('run'); }, T0);
      lts.forEach(function (l) {
        var r = l.getBoundingClientRect(), x = (r.left + r.width * .5) / vw;
        var k = Math.max(0, Math.min(1, x)), t = 0, lo = 0, hi = 1;
        /* invertir la curva del recorrido (aprox. cubic-bezier .45,0,.25,1) */
        for (var j = 0; j < 18; j++) { t = (lo + hi) / 2; var e = 3 * (1 - t) * t * t * 1 + t * t * t; if (e < k) lo = t; else hi = t; }
        at(function () { l.classList.add('on'); }, T0 + t * RUN - 60);
      });
      at(function () { word.classList.add('slam'); }, 3250);
      at(pum, 3870);
      at(function () { add('f-on'); }, 4250);
      at(function () { add('f-open'); }, 4850);
      at(function () { add('f-blink'); }, 6050);
      at(function () { el.classList.remove('f-blink'); add('f-happy'); }, 6180);
      at(finish, 7250);
    }
    (document.fonts && document.fonts.ready ? Promise.race([document.fonts.ready, new Promise(function (r) { setTimeout(r, 900); })]) : Promise.resolve()).then(function () { requestAnimationFrame(start); });
  })();

  /* ---------- Navegación ---------- */
  var nav = $('#nav'), menuBtn = $('.menu-btn'), menu = $('#menu');
  var themed = $$('[data-theme]'), lastY = window.scrollY, ticking = false;
  function onScroll() {
    var y = window.scrollY;
    nav.classList.toggle('scrolled', y > 8);
    if (!doc.classList.contains('menu-open')) nav.classList.toggle('hide', y > 480 && y > lastY + 2);
    if (y < lastY - 2) nav.classList.remove('hide');
    lastY = y;
    var probe = 32, dark = false;
    for (var i = 0; i < themed.length; i++) {
      var r = themed[i].getBoundingClientRect();
      if (r.top <= probe && r.bottom > probe) { dark = themed[i].getAttribute('data-theme') === 'dark'; break; }
    }
    nav.classList.toggle('on-dark', dark && !doc.classList.contains('menu-open'));
    heroParallax(y); howProgress();
    ticking = false;
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  window.addEventListener('resize', function () { requestAnimationFrame(onScroll); });

  function setMenu(open) {
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    menu.hidden = !open; doc.classList.toggle('menu-open', open);
    nav.classList.remove('hide'); onScroll();
    if (open) { var f = $('a', menu); if (f) f.focus(); } else { menuBtn.focus(); }
  }
  menuBtn.addEventListener('click', function () { setMenu(menu.hidden); });
  menu.addEventListener('click', function (e) { if (e.target.closest('a')) { menuBtn.setAttribute('aria-expanded', 'false'); menu.hidden = true; doc.classList.remove('menu-open'); } });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !menu.hidden) setMenu(false); });
  window.matchMedia('(min-width: 861px)').addEventListener('change', function (m) { if (m.matches && !menu.hidden) { menu.hidden = true; doc.classList.remove('menu-open'); menuBtn.setAttribute('aria-expanded', 'false'); } });

  /* ---------- Revelado al bajar ---------- */
  var rv = $$('.rv');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: .08 });
    rv.forEach(function (el, i) {
      var sib = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
      el.style.transitionDelay = Math.min(sib, 4) * 70 + 'ms'; io.observe(el);
    });
  } else rv.forEach(function (el) { el.classList.add('in'); });

  /* ---------- Portada: parallax suave del robot ---------- */
  var heroImg = $('.hero-media img');
  function heroParallax(y) {
    if (reduce || !heroImg || y > window.innerHeight * 1.2) return;
    heroImg.style.transform = 'translate3d(0,' + (y * .12).toFixed(1) + 'px,0) scale(' + (1 + y * .00008).toFixed(4) + ')';
  }

  /* ---------- Cara de Jeeves (canvas 2D) ---------- */
  var COL = { dormitando: '#2f9e5f', alerta: '#2f86e8', sorprendido: '#e8962a', feliz: '#3ecf6a', bloqueado: '#e5533d' };
  var NAME = { dormitando: 'Dormitando', alerta: 'Alerta', sorprendido: 'Sorprendido', feliz: 'Feliz', bloqueado: 'Bloqueado' };
  function drawEyes(cx, state, t, blink) {
    var c = COL[state];
    cx.setTransform(1, 0, 0, 1, 0, 0); cx.globalAlpha = 1; cx.fillStyle = '#05070b'; cx.fillRect(0, 0, 512, 256);
    cx.fillStyle = cx.strokeStyle = c; cx.shadowColor = c; cx.shadowBlur = 22; cx.lineCap = 'round'; cx.lineJoin = 'round';
    function rr(x, y, w, h, r) { cx.beginPath(); cx.moveTo(x + r, y); cx.arcTo(x + w, y, x + w, y + h, r); cx.arcTo(x + w, y + h, x, y + h, r); cx.arcTo(x, y + h, x, y, r); cx.arcTo(x, y, x + w, y, r); cx.closePath(); }
    [187, 327].forEach(function (x) {
      var h, dx, dy, k, w;
      if (state === 'dormitando') { h = 24 + 10 * Math.sin(t * 1.4); dy = 4 * Math.sin(t * .7); rr(x - 64, 128 + dy - h / 2, 128, h, h / 2); cx.fill(); }
      else if (state === 'alerta') { dx = 18 * Math.sin(t * 1.3); h = 125 * (1 - blink * .9); rr(x + dx - 50, 120 - h / 2, 100, h, Math.min(45, h / 2)); cx.fill(); }
      else if (state === 'sorprendido') { k = 1 + .07 * Math.sin(t * 7); w = 115 * k; h = Math.max(8, 160 * k * (1 - blink * .9)); cx.lineWidth = 13; rr(x - w / 2, 131 - h / 2, w, h, Math.min(w / 2, h / 2)); cx.stroke(); }
      else if (state === 'feliz') { dy = -10 * Math.abs(Math.sin(t * 3)); cx.lineWidth = 20; cx.beginPath(); cx.arc(x, 150 + dy, 46, Math.PI, 2 * Math.PI); cx.stroke(); }
      else { dx = Math.sin(t * 2) > 0 ? 5 * Math.sin(t * 34) : 0; cx.globalAlpha = Math.sin(t * 5) > 0 ? 1 : .35; cx.lineWidth = 20; cx.beginPath(); cx.moveTo(x + dx - 50, 76); cx.lineTo(x + dx + 50, 180); cx.moveTo(x + dx + 50, 76); cx.lineTo(x + dx - 50, 180); cx.stroke(); }
    });
    cx.globalAlpha = 1;
  }
  window.JeevesEyes = { draw: drawEyes, COL: COL };
  (function face() {
    var cv = $('#faceCv'); if (!cv) return;
    var cx = cv.getContext('2d'), state = 'alerta', vis = false, raf = 0, t0 = performance.now();
    function frame(now) {
      var t = (now - t0) / 1000, ph = t % 4.2, blink = ph > 4 ? Math.sin((ph - 4) / .2 * Math.PI) : 0;
      drawEyes(cx, state, reduce ? 0 : t, reduce ? 0 : blink);
      if (vis && !reduce) raf = requestAnimationFrame(frame);
    }
    $$('[data-face]').forEach(function (b) {
      b.addEventListener('click', function () {
        state = b.getAttribute('data-face');
        $$('[data-face]').forEach(function (o) { o.setAttribute('aria-pressed', String(o === b)); });
        cv.setAttribute('aria-label', 'Pantalla de Jeeves mostrando el estado ' + NAME[state]);
        if (!vis || reduce) frame(performance.now());
      });
    });
    frame(t0);
    if ('IntersectionObserver' in window) new IntersectionObserver(function (e) {
      vis = e[0].isIntersecting; cancelAnimationFrame(raf); if (vis && !reduce) raf = requestAnimationFrame(frame);
    }).observe(cv);
  })();

  /* ---------- Cómo funciona: plano + recorrido con el scroll ---------- */
  var VENUES = [
    { label: ['Mesa 1', 'Mesa 2', 'Mesa 3'], shape: 'round' },
    { label: ['Oficina 1', 'Oficina 2', 'Oficina 3'], shape: 'desk' },
    { label: ['Salón 1', 'Salón 2', 'Salón 3'], shape: 'room' }
  ];
  var PTS = [[330, 140], [560, 140], [690, 380]], LEN = [360, 830, 1200];
  var TARGET = [[330, 70], [560, 70], [690, 455]], EXTRA = [[190, 120], [190, 400], [445, 400], [445, 120], [690, 120], [560, 400]];
  var plan = $('#plan'), route = $('#route'), bot = $('#bot'), steps = $$('.step'), routeLen = 0, venue = 0;
  var SVGNS = 'http://www.w3.org/2000/svg';
  function svg(tag, attrs, txt) { var e = document.createElementNS(SVGNS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); if (txt) e.textContent = txt; return e; }
  function shape(g, x, y, kind, big) {
    if (kind === 'round') g.appendChild(svg('circle', { cx: x, cy: y, r: big ? 36 : 30 }));
    else if (kind === 'desk') g.appendChild(svg('rect', { x: x - 48, y: y - 26, width: 96, height: 52, rx: 10 }));
    else g.appendChild(svg('rect', { x: x - 62, y: y - 44, width: 124, height: 88, rx: 14 }));
  }
  function buildPlan() {
    if (!plan) return;
    var spots = $('.spots', plan), pts = $('.pts', plan), v = VENUES[venue];
    spots.textContent = ''; pts.textContent = '';
    EXTRA.forEach(function (p) { shape(spots, p[0], p[1], v.shape); });
    TARGET.forEach(function (p, i) {
      shape(spots, p[0], p[1], v.shape, true);
      spots.appendChild(svg('text', { x: p[0], y: p[1] + 5 }, v.label[i]));
    });
    PTS.forEach(function (p, i) {
      pts.appendChild(svg('circle', { cx: p[0], cy: p[1], r: 17 }));
      pts.appendChild(svg('text', { x: p[0], y: p[1] }, 'ABC'[i]));
    });
    plan.setAttribute('aria-label', 'Plano con la ruta de Jeeves desde la base hasta ' + v.label.join(', '));
    howProgress(true);
  }
  function howProgress() {
    if (!plan) return;
    if (!routeLen) { routeLen = route.getTotalLength(); route.style.strokeDasharray = routeLen; }
    var list = $('.steps'), r = list.getBoundingClientRect(), vh = window.innerHeight;
    var p = reduce ? 1 : Math.max(0, Math.min(1, (vh * .62 - r.top) / (r.height - vh * .25)));
    var d = routeLen * p;
    route.style.strokeDashoffset = (routeLen - d).toFixed(1);
    var pt = route.getPointAtLength(Math.max(.01, d));
    bot.setAttribute('transform', 'translate(' + pt.x.toFixed(1) + ',' + pt.y.toFixed(1) + ')');
    var circles = $$('.pts circle', plan);
    LEN.forEach(function (L, i) { if (circles[i]) circles[i].classList.toggle('done', d >= L - 2); });
    var idx = Math.min(2, Math.floor(p * 3 + .15));
    steps.forEach(function (s, i) { s.classList.toggle('on', i === idx); });
  }
  $$('[data-venue]').forEach(function (b) {
    b.addEventListener('click', function () {
      venue = +b.getAttribute('data-venue');
      $$('[data-venue]').forEach(function (o) { o.setAttribute('aria-pressed', String(o === b)); });
      buildPlan();
    });
  });
  buildPlan();

  /* ---------- Vista previa de la app ---------- */
  (function phone() {
    var btns = $$('[data-go]'); if (!btns.length) return;
    var botEl = $('#phBot'), status = $('#phStatus'), ring = $('#phRing'), pctEl = $('#phPct'), hrs = $('#phHrs'), cnt = $('#phCount');
    var pct = 87, count = 18, busy = false, NAMES = ['', 'Mesa 1', 'Mesa 2', 'Mesa 3'];
    function bat() {
      ring.style.strokeDashoffset = (326.7 * (1 - pct / 100)).toFixed(1);
      pctEl.textContent = pct + '%';
      var h = pct / 9, a = Math.floor(h); hrs.textContent = a + ' h ' + ('0' + Math.round((h - a) * 60)).slice(-2) + ' min';
    }
    function move(k) { botEl.style.left = (k * 33.33) + '%'; }
    var wait = reduce ? 300 : 1700;
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        if (busy) return; busy = true;
        var k = +b.getAttribute('data-go');
        btns.forEach(function (o) { o.disabled = o !== b; o.setAttribute('aria-pressed', String(o === b)); });
        status.textContent = 'En ruta a Punto ' + 'ABC'[k - 1] + ' · ' + NAMES[k]; move(k);
        setTimeout(function () {
          count++; cnt.textContent = count; pct = Math.max(5, pct - 1); bat();
          status.textContent = 'Entregado en ' + NAMES[k];
          setTimeout(function () {
            status.textContent = 'Regresando a la base'; move(0);
            setTimeout(function () {
              status.textContent = 'En la base · listo'; busy = false;
              btns.forEach(function (o) { o.disabled = false; o.setAttribute('aria-pressed', 'false'); });
            }, wait);
          }, wait * .8);
        }, wait);
      });
    });
    bat();
  })();

  /* ---------- Precios → formulario ---------- */
  $$('[data-p]').forEach(function (a) {
    a.addEventListener('click', function () { var s = $('#f-p'); if (s) s.value = a.getAttribute('data-p'); });
  });

  /* ---------- Formulario → WhatsApp ---------- */
  (function form() {
    var f = $('#form'); if (!f) return;
    var msg = $('#formMsg');
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var n = $('#f-n'), c = $('#f-c'), bad = null;
      [n, c].forEach(function (i) { var ok = i.checkValidity() && i.value.trim(); i.setAttribute('aria-invalid', ok ? 'false' : 'true'); if (!ok && !bad) bad = i; });
      if (bad) { msg.textContent = bad === n ? 'Escribe tu nombre para continuar.' : 'Revisa tu correo electrónico.'; bad.focus(); return; }
      var t = 'Hola, soy ' + n.value.trim() + ' (' + c.value.trim() + '). Me interesa: ' + $('#f-p').value + ' para mi ' + $('#f-l').value.toLowerCase() + '.';
      var m = $('#f-m').value.trim(); if (m) t += ' ' + m;
      msg.textContent = 'Abriendo WhatsApp con tu mensaje…';
      window.open('https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(t), '_blank', 'noopener');
    });
  })();

  /* ---------- Visor 3D: se carga solo cuando te acercas ---------- */
  (function lazy3D() {
    var box = $('#viewer'); if (!box) return;
    var started = false;
    function load(src) { return new Promise(function (ok, ko) { var s = document.createElement('script'); s.src = src; s.async = true; s.onload = ok; s.onerror = ko; document.head.appendChild(s); }); }
    function start() {
      if (started) return; started = true;
      var three = window.THREE ? Promise.resolve() : load('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js');
      three.then(function () { return load('jeeves3d.js'); })
        .then(function () { if (window.Jeeves3D) window.Jeeves3D.mount(box); })
        .catch(function () { /* se queda la imagen de respaldo */ });
    }
    if ('IntersectionObserver' in window) {
      var o = new IntersectionObserver(function (e) { if (e[0].isIntersecting) { o.disconnect(); start(); } }, { rootMargin: '500px 0px' });
      o.observe(box);
    } else start();
  })();

  onScroll();
})();
