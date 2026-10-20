/* Jeeves Robotics · reel de marca (motion design en canvas 2D) */
(function () {
  'use strict';
  var box = document.getElementById('reel'); if (!box) return;
  var cv = box.querySelector('canvas'), cx = cv.getContext('2d');
  var btn = box.querySelector('.reel-play');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Paleta de marca */
  var INK = '#05070C', WHITE = '#F4F6FA', MINT = '#45EDD1', BLUE = '#4D8BFF', DEEP = '#1238B8', MUTE = 'rgba(244,246,250,.55)';
  var FD = '"Inter Tight","Inter Display",Inter,system-ui,sans-serif', FT = 'Inter,system-ui,sans-serif';

  /* Utilidades */
  var cl = function (x) { return x < 0 ? 0 : x > 1 ? 1 : x; };
  var eo = function (x) { x = cl(x); return 1 - Math.pow(1 - x, 4); };
  var eio = function (x) { x = cl(x); return x < .5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2; };
  var seg = function (u, a, b) { return cl((u - a) / (b - a)); };
  var W = 0, H = 0, S = 1;
  function font(w, px, fam) { cx.font = w + ' ' + Math.round(px) + 'px ' + (fam || FD); }
  function rr(x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); cx.beginPath(); cx.moveTo(x + r, y); cx.arcTo(x + w, y, x + w, y + h, r); cx.arcTo(x + w, y + h, x, y + h, r); cx.arcTo(x, y + h, x, y, r); cx.arcTo(x, y, x + w, y, r); cx.closePath(); }
  function bg(c) { cx.fillStyle = c; cx.fillRect(0, 0, W, H); }
  /* Palabra que entra letra por letra con máscara */
  function maskWord(txt, x, y, px, u, a, stagger, color, align, track) {
    font('700', px); cx.textBaseline = 'alphabetic';
    var t = track || -.04, ws = [], total = 0, i;
    for (i = 0; i < txt.length; i++) { ws.push(cx.measureText(txt[i]).width); total += ws[i] + (i < txt.length - 1 ? px * t : 0); }
    var sx = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
    cx.save(); cx.beginPath(); cx.rect(0, y - px * .95, W, px * 1.18); cx.clip();
    for (i = 0; i < txt.length; i++) {
      var k = eo(seg(u, a + i * stagger, a + i * stagger + .45));
      cx.fillStyle = color; cx.fillText(txt[i], sx, y + px * 1.1 * (1 - k));
      sx += ws[i] + px * t;
    }
    cx.restore(); return total;
  }
  /* Generador pseudoaleatorio estable */
  function rnd(n) { var x = Math.sin(n * 127.1) * 43758.5453; return x - Math.floor(x); }

  /* ---------- Escenas (duración en segundos) ---------- */
  var SC = [
    { n: 'GUÍA', d: 1.6, dark: true, f: function (u) {
      bg(INK);
      var p = eo(seg(u, .35, 1.2)), y = H * .52;
      var g = cx.createLinearGradient(0, 0, W, 0); g.addColorStop(0, 'rgba(69,237,209,0)'); g.addColorStop(.15, MINT); g.addColorStop(.85, MINT); g.addColorStop(1, 'rgba(69,237,209,0)');
      cx.fillStyle = g; cx.fillRect(W * .5 - W * .5 * p, y - 1.5 * S, W * p, 3 * S);
      var pulse = 1 + .35 * Math.sin(u * 14) * (1 - p);
      cx.shadowColor = MINT; cx.shadowBlur = 30 * S; cx.fillStyle = WHITE;
      cx.beginPath(); cx.arc(W * .5 + (W * .42) * eo(seg(u, .9, 1.6)), y, 7 * S * pulse, 0, 7); cx.fill(); cx.shadowBlur = 0;
      font('500', 13 * S, FT); cx.fillStyle = MUTE; cx.textAlign = 'center'; cx.fillText('UN PUNTO. UNA LÍNEA. UN DESTINO.', W / 2, y + 48 * S); cx.textAlign = 'left';
    } },
    { n: 'NOMBRE', d: 1.7, dark: true, f: function (u) {
      bg(INK);
      var px = Math.min(W * .2, H * .36);
      maskWord('JEEVES', W / 2, H * .5 + px * .34, px, u, .05, .06, WHITE, 'center', -.03);
      var k = eo(seg(u, .7, 1.2));
      font('600', 14 * S, FT); cx.fillStyle = 'rgba(69,237,209,' + k + ')'; cx.textAlign = 'center';
      cx.fillText('ROBOTICS  ·  2026', W / 2, H * .5 + px * .34 + 46 * S); cx.textAlign = 'left';
      if (u > 1.5) { bg('rgba(244,246,250,' + (seg(u, 1.5, 1.7) * .9) + ')'); }
    } },
    { n: 'SERVICIO', d: 1.7, dark: false, f: function (u) {
      bg(WHITE);
      var px = Math.min(W * .17, H * .3);
      font('700', px); cx.fillStyle = INK; cx.textAlign = 'center'; cx.fillText('SERVICIO', W / 2, H * .5 + px * .35); cx.textAlign = 'left';
      var cell = Math.max(26 * S, W / 30), off = (u * 60 * S) % cell, th = cell * (.55 - .4 * eo(seg(u, .1, 1.2)));
      cx.fillStyle = WHITE;
      for (var x = -cell + off; x < W + cell; x += cell) cx.fillRect(x, 0, th * .5, H);
      for (var y = -cell; y < H + cell; y += cell) cx.fillRect(0, y + off * .5, W, th * .5);
      cx.strokeStyle = 'rgba(5,7,12,.18)'; cx.lineWidth = 1;
      for (x = -cell + off; x < W + cell; x += cell) { cx.beginPath(); cx.moveTo(x, 0); cx.lineTo(x, H); cx.stroke(); }
    } },
    { n: 'PULSO', d: 1.9, dark: true, f: function (u) {
      bg(INK);
      var gap = Math.max(30 * S, W / 26), cxm = W / 2, cym = H / 2;
      for (var y = gap / 2; y < H; y += gap) for (var x = gap / 2; x < W; x += gap) {
        var d = Math.hypot(x - cxm, y - cym) / Math.max(W, H);
        var w = Math.sin(d * 18 - u * 7), a = cl(.15 + .85 * Math.max(0, w)) * eo(seg(u, 0, .4));
        var s = (3 + 7 * Math.max(0, w)) * S;
        cx.fillStyle = d < .12 + .05 * Math.sin(u * 6) ? 'rgba(77,139,255,' + a + ')' : 'rgba(69,237,209,' + a + ')';
        cx.fillRect(x - s, y - 1.2 * S, s * 2, 2.4 * S); cx.fillRect(x - 1.2 * S, y - s, 2.4 * S, s * 2);
      }
      var k = eo(seg(u, .5, 1.1));
      font('700', 18 * S, FT); cx.fillStyle = 'rgba(244,246,250,' + k + ')'; cx.textAlign = 'center';
      cx.fillText('SIEMPRE ATENTO', W / 2, H - 50 * S); cx.textAlign = 'left';
    } },
    { n: 'MIRADA', d: 2.2, dark: true, f: function (u) {
      bg(INK);
      var gw = Math.min(W * .62, H * 1.05), gh = gw * .48, gx = (W - gw) / 2, gy = (H - gh) / 2 - 10 * S;
      var sc = .9 + .1 * eo(seg(u, 0, .5));
      cx.save(); cx.translate(W / 2, H / 2); cx.scale(sc, sc); cx.translate(-W / 2, -H / 2);
      rr(gx, gy, gw, gh, gh * .32); cx.fillStyle = '#02040A'; cx.fill(); cx.lineWidth = 3 * S; cx.strokeStyle = '#1C2230'; cx.stroke();
      var ew = gw * .17, eh = gh * .58, blink = (u > .95 && u < 1.1) ? .08 : 1, lx = 18 * S * Math.sin(seg(u, .3, .9) * Math.PI * 2);
      var happy = u > 1.35;
      cx.shadowColor = BLUE; cx.shadowBlur = 40 * S; cx.fillStyle = BLUE; cx.strokeStyle = BLUE;
      [-1, 1].forEach(function (s) {
        var ex = W / 2 + s * gw * .2 - ew / 2 + lx, ey = gy + gh / 2 - eh / 2;
        if (!happy) { var h = eh * blink; rr(ex, gy + gh / 2 - h / 2, ew, h, ew / 2); cx.fill(); }
        else { var hop = -8 * S * Math.abs(Math.sin((u - 1.35) * 7)); cx.lineWidth = ew * .32; cx.lineCap = 'round'; cx.beginPath(); cx.arc(ex + ew / 2, gy + gh * .66 + hop, ew * .62, Math.PI * 1.08, Math.PI * 1.92); cx.stroke(); }
      });
      cx.shadowBlur = 0; cx.restore();
      var k = eo(seg(u, 1.4, 1.9));
      font('700', Math.min(W * .05, 40 * S)); cx.fillStyle = 'rgba(244,246,250,' + k + ')'; cx.textAlign = 'center';
      cx.fillText('Una cara que se entiende.', W / 2, gy + gh + 70 * S * (.6 + .4 * k)); cx.textAlign = 'left';
    } },
    { n: 'RUTA', d: 2.6, dark: false, f: function (u) {
      bg('#E9ECF2');
      var N = 11, cw = Math.min(W / 13, H / 7.2), chh = cw * .58, ox = W / 2, oy = H * .24;
      var route = []; for (var i = 0; i <= 8; i++) route.push([i, 5]); for (var j = 4; j >= 1; j--) route.push([8, j]);
      var prog = eio(seg(u, .25, 2.2)) * (route.length - 1), idx = Math.floor(prog);
      function key(i, j) { return i + ',' + j; }
      var lit = {}; for (i = 0; i <= Math.min(idx, route.length - 1); i++) lit[key(route[i][0], route[i][1])] = 1;
      var tables = { '3,2': 1, '3,8': 1, '6,8': 1, '8,0': 1, '1,8': 1 };
      for (var s2 = 0; s2 <= 2 * (N - 1); s2++) for (i = 0; i < N; i++) {
        j = s2 - i; if (j < 0 || j >= N) continue;
        var d = Math.hypot(i - 5, j - 5), wave = Math.sin(d * .9 - u * 5) * .5 + .5;
        var hgt = cw * (.15 + .35 * wave * eo(seg(u, 0, .6)));
        var k = key(i, j);
        if (tables[k]) hgt = cw * .9;
        var x = ox + (i - j) * cw / 2, y = oy + (i + j) * chh / 2;
        var top = lit[k] ? MINT : tables[k] ? '#FFFFFF' : '#F7F8FB', left = lit[k] ? '#2BBFA7' : '#C9CFDA', right = lit[k] ? '#1F9A86' : '#B2B9C7';
        if (tables[k]) { left = '#9AA3B5'; right = '#8891A3'; }
        cx.fillStyle = left; cx.beginPath(); cx.moveTo(x - cw / 2, y - hgt); cx.lineTo(x, y + chh / 2 - hgt); cx.lineTo(x, y + chh / 2); cx.lineTo(x - cw / 2, y); cx.closePath(); cx.fill();
        cx.fillStyle = right; cx.beginPath(); cx.moveTo(x + cw / 2, y - hgt); cx.lineTo(x, y + chh / 2 - hgt); cx.lineTo(x, y + chh / 2); cx.lineTo(x + cw / 2, y); cx.closePath(); cx.fill();
        cx.fillStyle = top; cx.beginPath(); cx.moveTo(x, y - chh / 2 - hgt); cx.lineTo(x + cw / 2, y - hgt); cx.lineTo(x, y + chh / 2 - hgt); cx.lineTo(x - cw / 2, y - hgt); cx.closePath(); cx.fill();
        /* Jeeves: cubo azul marino con ojos que recorre la ruta */
        var ci = Math.min(route.length - 1, Math.round(prog));
        if (route[ci][0] === i && route[ci][1] === j) {
          var a = route[Math.floor(prog)], b = route[Math.min(route.length - 1, Math.floor(prog) + 1)], f = prog - Math.floor(prog);
          var bi = a[0] + (b[0] - a[0]) * f, bj = a[1] + (b[1] - a[1]) * f, bx = ox + (bi - bj) * cw / 2, by = oy + (bi + bj) * chh / 2 - cw * .7;
          var bh = cw * .95;
          cx.fillStyle = '#E8ECF3'; cx.beginPath(); cx.moveTo(bx - cw * .36, by - bh * .5); cx.lineTo(bx, by - bh * .5 + chh * .36); cx.lineTo(bx, by + chh * .36); cx.lineTo(bx - cw * .36, by); cx.closePath(); cx.fill();
          cx.fillStyle = '#C3CAD6'; cx.beginPath(); cx.moveTo(bx + cw * .36, by - bh * .5); cx.lineTo(bx, by - bh * .5 + chh * .36); cx.lineTo(bx, by + chh * .36); cx.lineTo(bx + cw * .36, by); cx.closePath(); cx.fill();
          cx.fillStyle = '#1E2A4A'; cx.beginPath(); cx.moveTo(bx, by - bh * .5 - chh * .36); cx.lineTo(bx + cw * .36, by - bh * .5); cx.lineTo(bx, by - bh * .5 + chh * .36); cx.lineTo(bx - cw * .36, by - bh * .5); cx.closePath(); cx.fill();
          cx.shadowColor = BLUE; cx.shadowBlur = 14 * S; cx.fillStyle = BLUE;
          cx.fillRect(bx - cw * .2, by - bh * .32, cw * .07, cw * .14); cx.fillRect(bx - cw * .08, by - bh * .26, cw * .07, cw * .14); cx.shadowBlur = 0;
        }
      }
      var k2 = eo(seg(u, 1.9, 2.4));
      font('700', Math.min(W * .045, 34 * S)); cx.fillStyle = 'rgba(5,7,12,' + (.3 + .7 * k2) + ')';
      cx.fillText('De la base a la mesa.', 44 * S, H - 46 * S);
    } },
    { n: 'NÚMEROS', d: 2.0, dark: false, f: function (u) {
      var second = u > 1.0;
      bg(second ? INK : MINT);
      var ink = second ? MINT : INK, px = Math.min(H * .78, W * .42);
      var big = second ? '03' : '1.20', lu = second ? u - 1.0 : u;
      font('700', px); cx.textBaseline = 'alphabetic';
      cx.save(); cx.beginPath(); cx.rect(0, 0, W, H); cx.clip();
      if (H > W) px = Math.min(px, W * .62);
      else {
        font('700', Math.min(W * .045, 38 * S)); var tw = 0;
        (second ? ['DESTINOS', 'A · B · C', 'POR RUTA'] : ['METROS', 'SIN PAUSAS.', 'SIN DESCANSOS.']).forEach(function (l) { tw = Math.max(tw, cx.measureText(l).width); });
        font('700', px); var bw0 = cx.measureText(big).width, room = W - 30 * S - 70 * S - tw - 50 * S;
        if (bw0 > room) px *= room / bw0;
      }
      font('700', px);
      var y = (H > W ? H * .42 : H * .5 + px * .36) + px * (1 - eo(seg(lu, 0, .35)));
      cx.fillStyle = ink; cx.fillText(big, 30 * S - px * .04, y);
      var bw = cx.measureText(big).width;
      cx.restore();
      var port = H > W, tx = port ? 30 * S : bw + 30 * S + 50 * S, ty = port ? H * .66 : H * .36, k = eo(seg(lu, .25, .6));
      font('700', Math.min(W * .045, 38 * S)); cx.fillStyle = ink;
      var lines = second ? ['DESTINOS', 'A · B · C', 'POR RUTA'] : ['METROS', 'SIN PAUSAS.', 'SIN DESCANSOS.'];
      var lh = port ? Math.min(W * .1, 46 * S) : Math.min(W * .055, 46 * S);
      if (port) font('700', Math.min(W * .085, 38 * S));
      lines.forEach(function (l, i) { cx.globalAlpha = eo(seg(lu, .25 + i * .08, .6 + i * .08)); cx.fillText(l, tx, ty + i * lh); });
      cx.globalAlpha = 1;
      cx.fillStyle = ink; cx.fillRect(tx, ty + 3.2 * lh - 30 * S, 120 * S * k, 4 * S);
    } },
    { n: 'RITMO', d: 1.9, dark: true, f: function (u) {
      var g = cx.createLinearGradient(0, 0, W, H); g.addColorStop(0, DEEP); g.addColorStop(1, '#0A1A5C'); cx.fillStyle = g; cx.fillRect(0, 0, W, H);
      var px = Math.min(W * .085, H * .17);
      maskWord('CADA ENTREGA,', 50 * S, H * .34, px, u, 0, .025, WHITE, 'left', -.03);
      maskWord('A TIEMPO.', 50 * S, H * .34 + px * 1.02, px, u, .15, .03, MINT, 'left', -.03);
      /* curva de velocidad: acelera, avanza y frena */
      var pt = H > W, x0 = pt ? W * .1 : W * .52, x1 = pt ? W * .9 : W - 60 * S, y0 = pt ? H * .84 : H * .86, y1 = pt ? H * .58 : H * .56, k = eio(seg(u, .3, 1.5));
      cx.strokeStyle = 'rgba(255,255,255,.25)'; cx.lineWidth = 1; cx.beginPath(); cx.moveTo(x0, y0); cx.lineTo(x1, y0); cx.moveTo(x0, y0); cx.lineTo(x0, y1 - 20 * S); cx.stroke();
      function P(t) { var a = 1 - t; return [a * a * a * x0 + 3 * a * a * t * (x0 + (x1 - x0) * .45) + 3 * a * t * t * (x0 + (x1 - x0) * .55) + t * t * t * x1, a * a * a * y0 + 3 * a * a * t * y1 + 3 * a * t * t * y1 + t * t * t * y0]; }
      cx.strokeStyle = MINT; cx.lineWidth = 3 * S; cx.beginPath();
      for (var i = 0; i <= 60 * k; i++) { var p = P(i / 60); i ? cx.lineTo(p[0], p[1]) : cx.moveTo(p[0], p[1]); } cx.stroke();
      var q = P(k); cx.fillStyle = WHITE; cx.beginPath(); cx.arc(q[0], q[1], 6 * S, 0, 7); cx.fill();
      font('600', 11 * S, FT); cx.fillStyle = 'rgba(255,255,255,.6)';
      cx.fillText('ACELERA', x0 + 6 * S, y0 - 8 * S); cx.fillText('FRENA', x1 - 48 * S, y0 - 8 * S); cx.fillText('VELOCIDAD', x0 + 6 * S, y1 - 26 * S);
    } },
    { n: 'JEEVES', d: 3.0, dark: true, f: function (u) {
      bg(INK);
      var cxm = W / 2, cym = H / 2, k = eo(seg(u, 0, .9));
      for (var i = 0; i < 90; i++) {
        var a = rnd(i) * Math.PI * 2, r0 = (60 + 260 * rnd(i + 9)) * S * k, len = (40 + 240 * rnd(i + 3)) * S * (1 - .6 * seg(u, .6, 2.4));
        var r1 = r0 + len * k;
        cx.strokeStyle = i % 7 === 0 ? 'rgba(77,139,255,' + (.8 * (1 - seg(u, 1.6, 3))) + ')' : 'rgba(69,237,209,' + (.75 * (1 - seg(u, 1.6, 3))) + ')';
        cx.lineWidth = (1 + 2 * rnd(i + 5)) * S;
        cx.beginPath(); cx.moveTo(cxm + Math.cos(a) * r0, cym + Math.sin(a) * r0 * .7); cx.lineTo(cxm + Math.cos(a) * r1, cym + Math.sin(a) * r1 * .7); cx.stroke();
      }
      var flash = 1 - seg(u, 0, .25); if (flash > 0) bg('rgba(244,246,250,' + flash * .85 + ')');
      var px = Math.min(W * .16, H * .3), sc = 1.12 - .12 * eo(seg(u, .05, .7));
      cx.save(); cx.translate(cxm, cym); cx.scale(sc, sc);
      font('700', px); cx.textAlign = 'center'; cx.fillStyle = WHITE; cx.fillText('JEEVES', 0, px * .32);
      var dw = cx.measureText('JEEVES').width; cx.fillStyle = MINT; cx.beginPath(); cx.arc(dw / 2 + px * .13, px * .26, px * .065, 0, 7); cx.fill();
      cx.restore();
      var k2 = eo(seg(u, .7, 1.3));
      font('600', Math.min(W * .022, 17 * S), FT); cx.textAlign = 'center'; cx.fillStyle = 'rgba(244,246,250,' + k2 * .9 + ')';
      cx.fillText('ENTREGAS QUE SE MUEVEN SOLAS', cxm, cym + px * .32 + 50 * S);
      cx.fillStyle = 'rgba(244,246,250,' + k2 * .5 + ')'; font('500', Math.min(W * .018, 13 * S), FT);
      cx.fillText('ROBOTICS · DESDE $6,999 MXN', cxm, cym + px * .32 + 78 * S); cx.textAlign = 'left';
    } }
  ];
  var DUR = 0; SC.forEach(function (s) { s.a = DUR; DUR += s.d; });

  /* HUD de showreel */
  function hud(i, t, dark) {
    var c = dark ? 'rgba(244,246,250,.6)' : 'rgba(5,7,12,.55)', m = 20 * S, l = 16 * S;
    cx.strokeStyle = c; cx.lineWidth = 1.5 * S;
    [[m, m, 1, 1], [W - m, m, -1, 1], [m, H - m, 1, -1], [W - m, H - m, -1, -1]].forEach(function (p) { cx.beginPath(); cx.moveTo(p[0], p[1] + l * p[3]); cx.lineTo(p[0], p[1]); cx.lineTo(p[0] + l * p[2], p[1]); cx.stroke(); });
    font('600', 10.5 * S, FT); cx.fillStyle = c;
    var fr = Math.floor((t % 1) * 24), tc = '00:' + ('0' + Math.floor(t)).slice(-2) + ':' + ('0' + fr).slice(-2);
    cx.fillText('JEEVES ROBOTICS — REEL', m + 22 * S, m + 14 * S);
    cx.textAlign = 'right'; cx.fillText(tc, W - m - 22 * S, m + 14 * S);
    cx.fillText(('0' + (i + 1)).slice(-2) + ' / ' + ('0' + SC.length).slice(-2), W - m - 72 * S, H - m - 6 * S);
    cx.textAlign = 'left'; cx.fillText(SC[i].n, m + 22 * S, H - m - 6 * S);
  }

  function render(t) {
    var i = 0; while (i < SC.length - 1 && t >= SC[i + 1].a) i++;
    var s = SC[i], u = t - s.a;
    cx.setTransform(1, 0, 0, 1, 0, 0); cx.textAlign = 'left'; cx.globalAlpha = 1; cx.shadowBlur = 0;
    var punch = 1 + .045 * (1 - eo(seg(u, 0, .35)));
    cx.save(); cx.translate(W / 2, H / 2); cx.scale(punch, punch); cx.translate(-W / 2, -H / 2);
    s.f(u); cx.restore();
    hud(i, t, s.dark);
    if (u < .06 && i > 0) { cx.fillStyle = s.dark ? 'rgba(244,246,250,.5)' : 'rgba(5,7,12,.4)'; cx.fillRect(0, 0, W, H); }
  }

  function size() {
    var r = cv.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 2);
    if (!r.width) return;
    cv.width = Math.round(r.width * d); cv.height = Math.round(r.height * d);
    W = cv.width; H = cv.height; S = Math.max(.6, Math.min(W, H * 1.6) / 1100);
    render(t);
  }

  var t = reduce ? SC[SC.length - 1].a + 2.2 : 0, playing = false, want = !reduce, vis = false, last = 0, raf = 0;
  function frame(now) { var dt = Math.min((now - last) / 1000, .1); last = now; t += dt; if (t >= DUR) t = 0; render(t); if (playing) raf = requestAnimationFrame(frame); }
  function sync() {
    var go = want && vis && !document.hidden;
    if (go && !playing) { playing = true; last = performance.now(); raf = requestAnimationFrame(frame); }
    else if (!go && playing) { playing = false; cancelAnimationFrame(raf); }
    btn.setAttribute('aria-pressed', String(want)); btn.setAttribute('aria-label', want ? 'Pausar el reel' : 'Reproducir el reel');
  }
  btn.addEventListener('click', function () { want = !want; sync(); });
  document.addEventListener('visibilitychange', sync);
  if (window.ResizeObserver) new ResizeObserver(size).observe(cv); window.addEventListener('resize', size);
  if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { vis = e[0].isIntersecting; sync(); }, { threshold: .3 }).observe(cv);
  else { vis = true; }
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(function () { size(); sync(); });
  size(); sync();
  window.JeevesReel = { seek: function (x) { t = x; render(t); }, dur: DUR };
})();
