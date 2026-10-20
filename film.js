/* Jeeves Robotics · película animada (motion graphic en SVG) */
(function () {
  'use strict';
  var film = document.getElementById('film'); if (!film) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (id) { return document.getElementById(id); };
  var SC = [
    { id: 'fs1', a: 0, b: 3.6, t: 'Hola, soy Jeeves.', s: 'Tu asistente de entregas para restaurantes, oficinas y escuelas.' },
    { id: 'fs2', a: 3.4, b: 8.2, t: 'Elige el destino.', s: 'Desde la app tocas la mesa y Jeeves sale de su base.' },
    { id: 'fs3', a: 8.0, b: 16.4, t: 'Sigue su línea guía.', s: 'Si alguien se cruza, se detiene, espera y continúa.' },
    { id: 'fs4', a: 16.2, b: 19.8, t: 'Entrega y regresa.', s: 'Deja el pedido en la mesa y vuelve solo a su base.' },
    { id: 'fs5', a: 19.6, b: 25, t: 'Entregas que se mueven solas.', s: 'Desde $6,999 MXN. Pide tu cotización.' }
  ];
  var DUR = 25, FADE = .45;
  var els = SC.map(function (s) { return $(s.id); });
  var cap = film.querySelector('.film-cap'), capN = $('filmN'), capT = $('filmT'), capS = $('filmS');
  var segs = Array.prototype.slice.call(film.querySelectorAll('.film-bar i'));
  var btn = film.querySelector('.film-play');
  var route = $('fRoute'), L = route.getTotalLength();
  route.style.strokeDasharray = L;
  var cl = function (x) { return x < 0 ? 0 : x > 1 ? 1 : x; };
  var ease = function (x) { x = cl(x); return 1 - Math.pow(1 - x, 3); };
  var inout = function (x) { x = cl(x); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  var seg = function (u, a, b) { return cl((u - a) / (b - a)); };
  function eyeScale(id, cx, cy, sy, dx) { $(id).setAttribute('transform', 'translate(' + (cx + (dx || 0)) + ' ' + cy + ') scale(1 ' + Math.max(.06, sy).toFixed(3) + ') translate(' + (-cx) + ' ' + (-cy) + ')'); }

  function render(t) {
    var cur = 0;
    SC.forEach(function (s, i) {
      var o = 0;
      if (t >= s.a && t <= s.b) {
        o = Math.min(i === 0 ? 1 : cl((t - s.a) / FADE), i === SC.length - 1 ? 1 : cl((s.b - t) / FADE));
      }
      els[i].style.opacity = o.toFixed(3);
      els[i].style.visibility = o > 0 ? 'visible' : 'hidden';
      if (t >= s.a + (i ? FADE / 2 : 0)) cur = i;
    });
    /* 1 · despierta */
    var u = t - SC[0].a;
    var open = ease(seg(u, .5, 1.1)), blink = (u > 2.7 && u < 2.9) ? .1 : 1, glance = (u > 1.4 && u < 2.6) ? Math.sin((u - 1.4) / 1.2 * Math.PI * 2) * 26 : 0;
    var sy = (.12 + .88 * open) * blink;
    eyeScale('fe1', 697, 426, sy, glance); eyeScale('fe2', 903, 426, sy, glance);
    $('fHead').setAttribute('transform', 'translate(800 425) scale(' + (.92 + .08 * ease(seg(u, 0, 1))).toFixed(3) + ') translate(-800 -425)');
    /* 2 · app */
    u = t - SC[1].a;
    $('fPhone').setAttribute('transform', 'translate(0 ' + (70 * (1 - ease(seg(u, 0, .9)))).toFixed(1) + ')');
    var tap = seg(u, 1.5, 1.9), tapOut = seg(u, 2.3, 2.7);
    $('fTap').setAttribute('opacity', (tap * (1 - tapOut)).toFixed(2));
    $('fTap').setAttribute('r', (30 - 8 * seg(u, 1.9, 2.1) + 8 * seg(u, 2.1, 2.3)).toFixed(1));
    var rip = seg(u, 2.0, 2.8);
    $('fTapR').setAttribute('r', (20 + 70 * ease(rip)).toFixed(1)); $('fTapR').setAttribute('opacity', (rip > 0 && rip < 1 ? 1 - rip : 0).toFixed(2));
    var sel = u > 2.05;
    $('fb2').classList.toggle('sel', sel);
    $('fPhSt').textContent = sel ? 'En camino a Mesa 2' : 'En la base · listo';
    /* 3 · ruta, persona y espera */
    u = t - SC[2].a;
    var d;
    if (u < 2.8) d = 340 * inout(seg(u, .5, 2.8));
    else if (u < 4.6) d = 340;
    else d = 340 + (L - 340) * inout(seg(u, 4.6, 7.4));
    route.style.strokeDashoffset = (L - d).toFixed(1);
    var p = route.getPointAtLength(Math.max(.01, d));
    $('fBot').setAttribute('transform', 'translate(' + p.x.toFixed(1) + ' ' + p.y.toFixed(1) + ')');
    var py = 650 - 360 * inout(seg(u, 2.1, 4.5)), pAlpha = cl(seg(u, 1.9, 2.3)) * (1 - seg(u, 4.4, 4.8));
    $('fPer').setAttribute('transform', 'translate(650 ' + py.toFixed(1) + ')'); $('fPer').setAttribute('opacity', pAlpha.toFixed(2));
    var waiting = u > 2.75 && u < 4.6;
    $('fStop').setAttribute('opacity', waiting ? '1' : '0');
    $('fStop').setAttribute('transform', 'translate(' + p.x.toFixed(1) + ' ' + p.y.toFixed(1) + ')');
    ['fbe1', 'fbe2'].forEach(function (id) { $(id).setAttribute('fill', waiting ? '#F47272' : '#4D8BFF'); });
    var arr = seg(u, 7.4, 8.2);
    $('fPBr').setAttribute('r', (22 + 40 * ease(arr)).toFixed(1)); $('fPBr').setAttribute('opacity', (arr > 0 && arr < 1 ? 1 - arr : 0).toFixed(2));
    $('fPB').setAttribute('fill', u > 7.4 ? '#45EDD1' : '#F5B84B');
    /* 4 · entrega */
    u = t - SC[3].a;
    $('fTable').setAttribute('transform', 'translate(800 610) scale(' + (.9 + .1 * ease(seg(u, 0, .8))).toFixed(3) + ') translate(-800 -610)');
    $('fHappy').setAttribute('transform', 'translate(0 ' + (-10 * Math.abs(Math.sin(u * 3.2))).toFixed(1) + ')');
    var bdg = ease(seg(u, .7, 1.3));
    $('fBadge').setAttribute('opacity', bdg.toFixed(2));
    $('fBadge').setAttribute('transform', 'translate(800 810) scale(' + (.8 + .2 * bdg).toFixed(3) + ') translate(-800 -810)');
    /* 5 · cierre */
    u = t - SC[4].a;
    var ph = ease(seg(u, .2, 1.4));
    $('fPic').setAttribute('transform', 'translate(' + (60 * (1 - ph)).toFixed(1) + ' 0)'); $('fPic').setAttribute('opacity', ph.toFixed(2));
    ['fl1', 'fl2', 'fl3', 'fl4'].forEach(function (id, i) {
      var k = ease(seg(u, .4 + i * .18, 1.3 + i * .18));
      $(id).setAttribute('opacity', k.toFixed(2)); $(id).setAttribute('transform', 'translate(0 ' + (30 * (1 - k)).toFixed(1) + ')');
    });
    /* barra y texto */
    segs.forEach(function (sg, i) {
      var s = SC[i], q = i < cur ? 1 : i > cur ? 0 : cl((t - s.a) / (s.b - s.a));
      sg.style.setProperty('--p', q.toFixed(3));
    });
    if (cur !== shown) {
      shown = cur; capN.textContent = (cur + 1) + ' / ' + SC.length; capT.textContent = SC[cur].t; capS.textContent = SC[cur].s;
      cap.classList.remove('swap'); void cap.offsetWidth; cap.classList.add('swap');
    }
  }

  var shown = -1, t = reduce ? SC[4].a + 3 : 0, playing = false, wantPlay = !reduce, visible = false, last = 0, raf = 0;
  function frame(now) {
    var dt = Math.min((now - last) / 1000, .1); last = now;
    t += dt; if (t >= DUR) t = 0;
    render(t);
    if (playing) raf = requestAnimationFrame(frame);
  }
  function sync() {
    var should = wantPlay && visible && !document.hidden;
    if (should && !playing) { playing = true; last = performance.now(); raf = requestAnimationFrame(frame); }
    else if (!should && playing) { playing = false; cancelAnimationFrame(raf); }
    btn.setAttribute('aria-pressed', String(wantPlay));
    btn.setAttribute('aria-label', wantPlay ? 'Pausar la animación' : 'Reproducir la animación');
  }
  btn.addEventListener('click', function () { wantPlay = !wantPlay; sync(); });
  Array.prototype.forEach.call(film.querySelectorAll('[data-scene]'), function (b) {
    b.addEventListener('click', function () { t = SC[+b.getAttribute('data-scene')].a + .01; render(t); });
  });
  document.addEventListener('visibilitychange', sync);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (e) { visible = e[0].isIntersecting; sync(); }, { threshold: .35 }).observe(film.querySelector('.film-stage'));
  } else { visible = true; sync(); }
  render(t); sync();
})();
