/* Jeeves Robotics · reel de marca (motion design en canvas 2D + sonido opcional) */
(function () {
  'use strict';
  var box = document.getElementById('reel'); if (!box) return;
  var cv = box.querySelector('canvas'), cx = cv.getContext('2d');
  var btn = box.querySelector('.reel-play'), sbtn = box.querySelector('.reel-sound'), cta = box.querySelector('.reel-cta');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Paleta de marca */
  var INK = '#05070C', WHITE = '#F4F6FA', MINT = '#45EDD1', BLUE = '#4D8BFF', DEEP = '#1238B8', MUTE = 'rgba(244,246,250,.55)';
  var FD = '"Inter Tight","Inter Display",Inter,system-ui,sans-serif', FT = 'Inter,system-ui,sans-serif';

  /* Utilidades */
  var cl = function (x) { return x < 0 ? 0 : x > 1 ? 1 : x; };
  var eo = function (x) { x = cl(x); return 1 - Math.pow(1 - x, 4); };
  var eio = function (x) { x = cl(x); return x < .5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2; };
  var ei = function (x) { x = cl(x); return x * x * x; };
  var seg = function (u, a, b) { return cl((u - a) / (b - a)); };
  var W = 0, H = 0, S = 1;
  function font(w, px, fam) { cx.font = w + ' ' + Math.round(px) + 'px ' + (fam || FD); }
  function rr(x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); cx.beginPath(); cx.moveTo(x + r, y); cx.arcTo(x + w, y, x + w, y + h, r); cx.arcTo(x + w, y + h, x, y + h, r); cx.arcTo(x, y + h, x, y, r); cx.arcTo(x, y, x + w, y, r); cx.closePath(); }
  function bg(c) { cx.fillStyle = c; cx.fillRect(0, 0, W, H); }
  function rnd(n) { var x = Math.sin(n * 127.1 + 1.7) * 43758.5453; return x - Math.floor(x); }
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

  /* ---------- Arte compartido: robot original y diorama (art.js) ---------- */
  var art = window.JeevesArt.create(cv), holo = art.holo, cloudScale = art.cloudScale, PT0 = art.PT0, PD = art.PD, PIECES = art.PIECES, PTS = [], NP = 0;
  var RPATH = art.makePath([[1.2, 2.0], [5, 2.0], [5, 5.55], [6.8, 5.55]]);
  function buildCloud(n) { PTS = art.cloud(n); NP = PTS.length; }
  /* Foto real de Jeeves recortada en 4 capas (cabeza, dos charolas, base) */
  var BASE = ((document.currentScript && document.currentScript.src) || '').replace(/[^\/]*$/, '');
  var CAPA = [1, 2, 3, 4].map(function (n) { var im = new Image(); im.decoding = 'async'; im.onload = function () { if (!playing) render(t); }; im.src = BASE + 'assets/capa-' + n + '.webp'; return im; });
  var CT = [0, .2616, .439, .686], CHH = [.2616, .1773, .247, .314], CDY = [-.22, -.075, .075, .22];
  function robot(ox, oy, h, e, alpha, focus) {
    var w = h * 1280 / 1720, top = oy - h / 2;
    for (var i = 0; i < 4; i++) {
      var im = CAPA[i]; if (!im.complete || !im.naturalWidth) continue;
      cx.globalAlpha = alpha * (focus == null || focus < 0 ? 1 : i === focus ? 1 : .3);
      cx.drawImage(im, ox - w / 2, top + (CT[i] + CDY[i] * e) * h, w, CHH[i] * h);
    }
    cx.globalAlpha = 1; return w;
  }
  var textReady = 0, dotX = 0;
  function buildText() {
    var oc = document.createElement('canvas'), w = 900, h = 260; oc.width = w; oc.height = h;
    var o = oc.getContext('2d'); o.fillStyle = '#fff'; o.font = '700 210px ' + FD; o.textAlign = 'center'; o.textBaseline = 'middle'; o.fillText('JEEVES', w / 2 - 22, h / 2 + 8);
    var mw = o.measureText('JEEVES').width; o.beginPath(); o.arc(w / 2 - 22 + mw / 2 + 30, h / 2 + 66, 20, 0, 7); o.fill(); dotX = (mw / 2 + 30 - 22) / w;
    var d = o.getImageData(0, 0, w, h).data, cand = [];
    for (var y = 0; y < h; y += 3) for (var x = 0; x < w; x += 3) if (d[(y * w + x) * 4 + 3] > 128) cand.push([x / w - .5, y / h - .5, Math.hypot(x - (w / 2 - 22 + mw / 2 + 30), y - (h / 2 + 66)) < 24]);
    PTS.forEach(function (p, i) { var c = cand[Math.floor(rnd(i * 11.3) * cand.length)] || [0, 0]; p.tx = c[0]; p.ty = c[1] * (h / w); p.dot = c[2]; });
    textReady = 1;
  }
  function project(x, y, z, rot, scale, ox, oy) {
    var cr = Math.cos(rot), sr = Math.sin(rot), X = x * cr - z * sr, Z = x * sr + z * cr, k = 3.4 / (3.4 + Z);
    return [ox + X * scale * k, oy - y * scale * k, k];
  }

  /* ---------- Escenas (el corte por compases está más abajo, en CUT) ---------- */
  var SC = [
    { n: 'APERTURA', d: 2.0, dark: true, f: function (u) {
      bg(INK);
      var p = eo(seg(u, .5, 1.5)), y = H * .52;
      var g = cx.createLinearGradient(0, 0, W, 0); g.addColorStop(0, 'rgba(69,237,209,0)'); g.addColorStop(.15, MINT); g.addColorStop(.85, MINT); g.addColorStop(1, 'rgba(69,237,209,0)');
      cx.fillStyle = g; cx.fillRect(W * .5 - W * .5 * p, y - 1.5 * S, W * p, 3 * S);
      cx.shadowColor = MINT; cx.shadowBlur = 30 * S; cx.fillStyle = WHITE;
      cx.beginPath(); cx.arc(W * .5 + (W * .44) * ei(seg(u, 1.2, 2)), y, 7 * S * (1 + .4 * Math.sin(u * 16) * (1 - p)), 0, 7); cx.fill(); cx.shadowBlur = 0;
      var msg = 'JEEVES ROBOTICS PRESENTA', n = Math.floor(msg.length * seg(u, .15, 1.1));
      font('600', 12 * S, FT); cx.fillStyle = MUTE; cx.textAlign = 'center';
      cx.fillText(msg.slice(0, n) + (n < msg.length && Math.floor(u * 8) % 2 ? '_' : ''), W / 2, y - 40 * S);
      cx.fillStyle = 'rgba(244,246,250,' + eo(seg(u, 1.1, 1.6)) * .55 + ')'; cx.fillText('UN PUNTO. UNA LÍNEA. UN DESTINO.', W / 2, y + 48 * S); cx.textAlign = 'left';
    } },
    { n: 'IMPACTO', d: 2.0, dark: true, hit: [0, .25, .5, .75, 1, 1.25], f: function (u) {
      bg(INK);
      var px = Math.min(W * .2, H * .36), txt = 'JEEVES';
      font('700', px); var ws = [], tot = 0, i;
      for (i = 0; i < 6; i++) { ws.push(cx.measureText(txt[i]).width); tot += ws[i] - (i < 5 ? px * .03 : 0); }
      var sx = W / 2 - tot / 2, base = H * .5 + px * .34;
      for (i = 0; i < 6; i++) {
        var a = i * .25, k = seg(u, a, a + .22);
        if (u >= a) {
          var sc = 1 + 2.4 * (1 - eo(k)), lx = sx + ws[i] / 2;
          for (var g = 3; g >= 0; g--) {
            var sg = sc + g * .18 * (1 - k);
            cx.save(); cx.translate(lx, base - px * .35); cx.scale(sg, sg);
            cx.globalAlpha = g ? .12 * (1 - k) : cl(k * 2.5);
            cx.fillStyle = g ? MINT : WHITE; cx.textAlign = 'center'; cx.fillText(txt[i], 0, px * .35); cx.restore();
          }
          cx.globalAlpha = 1;
        }
        sx += ws[i] - px * .03;
      }
      var k2 = eo(seg(u, 1.45, 1.8));
      font('600', 14 * S, FT); cx.fillStyle = 'rgba(69,237,209,' + k2 + ')'; cx.textAlign = 'center';
      cx.fillText('ROBOTICS  ·  2026', W / 2, base + 46 * S); cx.textAlign = 'left';
      if (u > 1.8) bg('rgba(244,246,250,' + (seg(u, 1.8, 2) * .9) + ')');
    } },
    { n: 'SERVICIO', d: 1.5, dark: false, f: function (u) {
      bg(WHITE);
      var px = Math.min(W * .17, H * .3);
      font('700', px); cx.fillStyle = INK; cx.textAlign = 'center'; cx.fillText('SERVICIO', W / 2, H * .5 + px * .35); cx.textAlign = 'left';
      var cell = Math.max(26 * S, W / 30), off = (u * 80 * S) % cell, th = cell * (.55 - .4 * eo(seg(u, .05, 1.1)));
      cx.fillStyle = WHITE;
      for (var x = -cell + off; x < W + cell; x += cell) cx.fillRect(x, 0, th * .5, H);
      for (var y = -cell; y < H + cell; y += cell) cx.fillRect(0, y + off * .5, W, th * .5);
      cx.strokeStyle = 'rgba(5,7,12,.18)'; cx.lineWidth = 1;
      for (x = -cell + off; x < W + cell; x += cell) { cx.beginPath(); cx.moveTo(x, 0); cx.lineTo(x, H); cx.stroke(); }
    } },
    { n: 'PULSO', d: 1.5, dark: true, f: function (u) {
      bg(INK);
      var gap = Math.max(30 * S, W / 26), cxm = W / 2, cym = H / 2;
      for (var y = gap / 2; y < H; y += gap) for (var x = gap / 2; x < W; x += gap) {
        var d = Math.hypot(x - cxm, y - cym) / Math.max(W, H);
        var w = Math.sin(d * 18 - u * 9), a = cl(.15 + .85 * Math.max(0, w)) * eo(seg(u, 0, .3));
        var s = (3 + 8 * Math.max(0, w)) * S;
        cx.fillStyle = d < .12 + .05 * Math.sin(u * 8) ? 'rgba(77,139,255,' + a + ')' : 'rgba(69,237,209,' + a + ')';
        cx.fillRect(x - s, y - 1.2 * S, s * 2, 2.4 * S); cx.fillRect(x - 1.2 * S, y - s, 2.4 * S, s * 2);
      }
      font('700', 18 * S, FT); cx.fillStyle = 'rgba(244,246,250,' + eo(seg(u, .4, .9)) + ')'; cx.textAlign = 'center';
      cx.fillText('SIEMPRE ATENTO', W / 2, H - 50 * S); cx.textAlign = 'left';
    } },
    { n: 'HOLOGRAMA', d: 4.0, dark: true, hit: [3.2], f: function (u) {
      bg(INK);
      var g = cx.createRadialGradient(W / 2, H * .55, 0, W / 2, H * .55, Math.max(W, H) * .6); g.addColorStop(0, 'rgba(37,99,235,.28)'); g.addColorStop(1, 'rgba(37,99,235,0)'); cx.fillStyle = g; cx.fillRect(0, 0, W, H);
      var done = holo(u);
      /* línea de escaneo que sube con el ensamblaje */
      var sy = H * (.84 - .66 * eio(seg(u, .2, 3.0))), sa = u < 3.05 ? .8 : 0;
      var lg = cx.createLinearGradient(0, sy - 30 * S, 0, sy + 2 * S); lg.addColorStop(0, 'rgba(69,237,209,0)'); lg.addColorStop(1, 'rgba(69,237,209,' + sa * .3 + ')');
      cx.fillStyle = lg; cx.fillRect(0, sy - 30 * S, W, 32 * S); cx.fillStyle = 'rgba(69,237,209,' + sa + ')'; cx.fillRect(0, sy, W, 1.5 * S);
      var k = eo(seg(u, 3.2, 3.6));
      font('700', Math.min(W * .05, 40 * S)); cx.fillStyle = 'rgba(244,246,250,' + k + ')'; cx.textAlign = 'center';
      cx.fillText('Esto es Jeeves.', W / 2, H - 46 * S); cx.textAlign = 'left';
      font('600', 10.5 * S, FT); cx.fillStyle = 'rgba(69,237,209,.9)'; cx.textAlign = 'center';
      cx.fillText(done < PIECES.length ? 'ENSAMBLANDO · ' + ('0' + done).slice(-2) + ' / ' + ('0' + PIECES.length).slice(-2) + ' PIEZAS' : 'MODELO ORIGINAL · COMPLETO', W / 2, 20 * S + 14 * S); cx.textAlign = 'left';
    } },
    { n: 'MIRADA', d: 2.0, dark: true, f: function (u) {
      bg(INK);
      var gw = Math.min(W * .62, H * 1.05), gh = gw * .48, gx = (W - gw) / 2, gy = (H - gh) / 2 - 10 * S;
      var sc = .9 + .1 * eo(seg(u, 0, .4));
      cx.save(); cx.translate(W / 2, H / 2); cx.scale(sc, sc); cx.translate(-W / 2, -H / 2);
      rr(gx, gy, gw, gh, gh * .32); cx.fillStyle = '#02040A'; cx.fill(); cx.lineWidth = 3 * S; cx.strokeStyle = '#1C2230'; cx.stroke();
      var ew = gw * .17, eh = gh * .58, blink = (u > .85 && u < 1) ? .08 : 1, lx = 18 * S * Math.sin(seg(u, .25, .8) * Math.PI * 2), happy = u > 1.2;
      cx.shadowColor = BLUE; cx.shadowBlur = 40 * S; cx.fillStyle = BLUE; cx.strokeStyle = BLUE;
      [-1, 1].forEach(function (s) {
        var ex = W / 2 + s * gw * .2 - ew / 2 + lx;
        if (!happy) { var h = eh * blink; rr(ex, gy + gh / 2 - h / 2, ew, h, ew / 2); cx.fill(); }
        else { var hop = -8 * S * Math.abs(Math.sin((u - 1.2) * 8)); cx.lineWidth = ew * .32; cx.lineCap = 'round'; cx.beginPath(); cx.arc(ex + ew / 2, gy + gh * .66 + hop, ew * .62, Math.PI * 1.08, Math.PI * 1.92); cx.stroke(); }
      });
      cx.shadowBlur = 0; cx.restore();
      var k = eo(seg(u, 1.25, 1.7));
      font('700', Math.min(W * .05, 40 * S)); cx.fillStyle = 'rgba(244,246,250,' + k + ')'; cx.textAlign = 'center';
      cx.fillText('Una cara que se entiende.', W / 2, gy + gh + 70 * S * (.6 + .4 * k)); cx.textAlign = 'left';
    } },
    { n: 'RUTA', d: 3.5, dark: false, f: function (u) {
      var bgG = cx.createLinearGradient(0, 0, 0, H); bgG.addColorStop(0, '#F4F6F9'); bgG.addColorStop(1, '#DCE2EA'); cx.fillStyle = bgG; cx.fillRect(0, 0, W, H);
      var port = H > W, cw = Math.min(W * (port ? 1.0 : .84) / 10, H * (port ? .7 : .74) / 6.2) * (1 + .04 * eo(seg(u, 0, 3.5)));
      var s = eio(seg(u, .9, 2.85)), R = art.along(RPATH, s), arrived = u > 2.85;
      art.diorama({ place: 0, cw: cw, ox: W / 2, oy: H * (port ? .45 : .47) - 2.13 * cw, t: u, intro: u, robot: R, path: RPATH, prog: s,
        planA: eo(seg(u, .5, .9)), padK: eo(seg(u, .3, .7)), dest: [3], served: arrived ? [3] : [],
        ring: arrived ? { i: R[0], j: R[1], k: seg(u, 2.85, 3.5) } : null,
        pins: [{ i: 6.8, j: 7.0, label: '4', show: eo(seg(u, .6, 1.0)), done: arrived, doneK: eo(seg(u, 2.85, 3.15)) }] });
      var tk = eo(seg(u, 2.5, 3.0));
      font('600', 11 * S, FT); cx.fillStyle = 'rgba(31,154,134,' + (.4 + .6 * tk) + ')';
      cx.fillText(arrived ? 'MESA 4 · ENTREGADO' : 'MESA 4 · EN CAMINO', 44 * S, H - 46 * S - Math.min(W * .045, 34 * S) - 4 * S);
      font('700', Math.min(W * .045, 34 * S)); cx.fillStyle = 'rgba(5,7,12,' + (.3 + .7 * tk) + ')';
      cx.fillText('De la base a la mesa.', 44 * S, H - 46 * S);
    } },
    { n: 'NÚMEROS', d: 2.5, dark: false, hit: [.75, 1.5], f: function (u) {
      var st = u < .75 ? 0 : u < 1.5 ? 1 : 2, lu = u - [0, .75, 1.5][st];
      var BIG = ['1.20', '03', '$6,999'], L = [['METROS', 'SIN PAUSAS.', 'SIN DESCANSOS.'], ['DESTINOS', 'A · B · C', 'POR RUTA'], ['MXN', 'ROBOT', 'COMPLETO.']];
      var back = [MINT, INK, WHITE][st], ink = [INK, MINT, INK][st];
      bg(back);
      var big = BIG[st], lines = L[st], port = H > W, px = Math.min(H * .78, W * .42);
      if (port) { px = Math.min(px, W * (st === 2 ? .3 : .62)); font('700', px); var bwp = cx.measureText(big).width, room2 = W - 60 * S; if (bwp > room2) px *= room2 / bwp; }
      else {
        font('700', Math.min(W * .045, 38 * S)); var tw = 0; lines.forEach(function (l) { tw = Math.max(tw, cx.measureText(l).width); });
        font('700', px); var bw0 = cx.measureText(big).width, room = W - 100 * S - tw - 50 * S; if (bw0 > room) px *= room / bw0;
      }
      font('700', px);
      var y = (port ? H * .42 : H * .5 + px * .36) + px * (1 - eo(seg(lu, 0, .3)));
      cx.save(); cx.beginPath(); cx.rect(0, 0, W, H); cx.clip(); cx.fillStyle = ink; cx.fillText(big, 30 * S - px * .04, y); var bw = cx.measureText(big).width; cx.restore();
      var tx = port ? 30 * S : bw + 80 * S, ty = port ? H * .66 : H * .36, lh = port ? Math.min(W * .1, 46 * S) : Math.min(W * .055, 46 * S);
      font('700', port ? Math.min(W * .085, 38 * S) : Math.min(W * .045, 38 * S)); cx.fillStyle = ink;
      lines.forEach(function (l, i) { cx.globalAlpha = eo(seg(lu, .15 + i * .06, .45 + i * .06)); cx.fillText(l, tx, ty + i * lh); });
      cx.globalAlpha = 1; cx.fillRect(tx, ty + 3.2 * lh - 30 * S, 120 * S * eo(seg(lu, .2, .5)), 4 * S);
    } },
    { n: 'RITMO', d: 1.5, dark: true, f: function (u) {
      var g = cx.createLinearGradient(0, 0, W, H); g.addColorStop(0, DEEP); g.addColorStop(1, '#0A1A5C'); cx.fillStyle = g; cx.fillRect(0, 0, W, H);
      var px = Math.min(W * .085, H * .17);
      maskWord('CADA ENTREGA,', 50 * S, H * .34, px, u, 0, .02, WHITE, 'left', -.03);
      maskWord('A TIEMPO.', 50 * S, H * .34 + px * 1.02, px, u, .12, .025, MINT, 'left', -.03);
      var pt = H > W, x0 = pt ? W * .1 : W * .52, x1 = pt ? W * .9 : W - 60 * S, y0 = pt ? H * .84 : H * .86, y1 = pt ? H * .58 : H * .56, k = eio(seg(u, .2, 1.3));
      cx.strokeStyle = 'rgba(255,255,255,.25)'; cx.lineWidth = 1; cx.beginPath(); cx.moveTo(x0, y0); cx.lineTo(x1, y0); cx.moveTo(x0, y0); cx.lineTo(x0, y1 - 20 * S); cx.stroke();
      function P(t) { var a = 1 - t; return [a * a * a * x0 + 3 * a * a * t * (x0 + (x1 - x0) * .45) + 3 * a * t * t * (x0 + (x1 - x0) * .55) + t * t * t * x1, a * a * a * y0 + 3 * a * a * t * y1 + 3 * a * t * t * y1 + t * t * t * y0]; }
      cx.strokeStyle = MINT; cx.lineWidth = 3 * S; cx.beginPath();
      for (var i = 0; i <= 60 * k; i++) { var p = P(i / 60); i ? cx.lineTo(p[0], p[1]) : cx.moveTo(p[0], p[1]); } cx.stroke();
      var q = P(k); cx.fillStyle = WHITE; cx.beginPath(); cx.arc(q[0], q[1], 6 * S, 0, 7); cx.fill();
      font('600', 11 * S, FT); cx.fillStyle = 'rgba(255,255,255,.6)';
      cx.fillText('ACELERA', x0 + 6 * S, y0 - 8 * S); cx.fillText('FRENA', x1 - 48 * S, y0 - 8 * S); cx.fillText('VELOCIDAD', x0 + 6 * S, y1 - 26 * S);
    } },
    { n: 'VELOCIDAD LUZ', d: 1.5, dark: true, f: function (u) {
      bg(INK);
      var cxm = W / 2, cym = H / 2, sp = .3 + 3.2 * ei(seg(u, 0, 1.5)), R = Math.max(W, H) * .75;
      for (var i = 0; i < 260; i++) {
        var a = rnd(i) * Math.PI * 2, z = ((rnd(i + 50) + u * sp) % 1), z2 = Math.min(1, z + .02 + .2 * sp * .3);
        var r1 = R * ei(z) , r2 = R * ei(z2);
        cx.strokeStyle = i % 9 === 0 ? 'rgba(77,139,255,' + z + ')' : i % 3 === 0 ? 'rgba(69,237,209,' + z + ')' : 'rgba(244,246,250,' + z * .8 + ')';
        cx.lineWidth = (.6 + 2.4 * z) * S;
        cx.beginPath(); cx.moveTo(cxm + Math.cos(a) * r1, cym + Math.sin(a) * r1 * .62); cx.lineTo(cxm + Math.cos(a) * r2, cym + Math.sin(a) * r2 * .62); cx.stroke();
      }
      var px = Math.min(W * .06, H * .1);
      font('600', 13 * S, FT); cx.textAlign = 'center'; cx.fillStyle = 'rgba(244,246,250,' + eo(seg(u, .1, .5)) * .7 + ')';
      cx.fillText('PRÓXIMA PARADA', cxm, cym - px * .9);
      font('700', px); cx.fillStyle = 'rgba(244,246,250,' + eo(seg(u, .5, .9)) + ')'; cx.fillText('TU NEGOCIO.', cxm, cym + px * .35); cx.textAlign = 'left';
      if (u > 1.3) bg('rgba(244,246,250,' + seg(u, 1.3, 1.5) + ')');
    } },
    { n: 'JEEVES', d: 5.0, dark: true, hit: [0, 2.4], f: function (u) {
      bg(INK);
      var g = cx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * .6); g.addColorStop(0, 'rgba(37,99,235,' + (.3 * eo(seg(u, 2.3, 3))) + ')'); g.addColorStop(1, 'rgba(37,99,235,0)'); cx.fillStyle = g; cx.fillRect(0, 0, W, H);
      if (!textReady) buildText();
      var xl = window.JEEVES_EXPORT && W > H, f = cloudScale(), ox = W / 2, oy = H * (xl ? .42 : .5), tw = Math.min(W * .82, H * 1.9) * (xl ? .72 : 1), rot = -.5 + u * .9;
      var ex = eo(seg(u, .55, 1.3)), as = eio(seg(u, 1.3, 2.4));
      for (var i = 0; i < NP; i++) {
        var p = PTS[i], q = project(p.x, p.y, p.z, rot, f, ox, oy);
        var dx = q[0] - ox, dy = q[1] - oy, dl = Math.hypot(dx, dy) || 1, blast = (180 + 420 * p.d) * S * ex;
        var bx = q[0] + dx / dl * blast + (rnd(i) - .5) * 160 * S * ex, by = q[1] + dy / dl * blast + (rnd(i + 3) - .5) * 160 * S * ex;
        var tx = ox + p.tx * tw, ty = oy + p.ty * tw;
        var x = bx + (tx - bx) * as, y = by + (ty - by) * as;
        var s = (as > .99 ? 2.4 : 2 + 1.4 * ex * (1 - as)) * S;
        cx.globalAlpha = .85; cx.fillStyle = as > .6 ? (p.dot ? MINT : (i % 11 === 0 ? MINT : WHITE)) : p.c;
        cx.fillRect(x - s / 2, y - s / 2, s, s);
      }
      cx.globalAlpha = 1;
      /* el logo se vuelve sólido sobre las partículas */
      var solid = eo(seg(u, 2.45, 3.2));
      if (solid > 0) {
        cx.save(); cx.globalAlpha = solid * .96; cx.shadowColor = 'rgba(77,139,255,.6)'; cx.shadowBlur = 30 * S * solid;
        font('700', tw * 210 / 900); cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillStyle = WHITE;
        cx.fillText('JEEVES', ox - tw * 22 / 900, oy + tw * 8 / 900);
        var mw2 = cx.measureText('JEEVES').width; cx.fillStyle = MINT; cx.beginPath(); cx.arc(ox - tw * 22 / 900 + mw2 / 2 + tw * 30 / 900, oy + tw * 66 / 900, tw * 20 / 900, 0, 7); cx.fill();
        cx.restore(); cx.textBaseline = 'alphabetic';
      }
      /* ondas de choque */
      [2.4, 2.55, 2.75].forEach(function (t0, k) {
        var r = seg(u, t0, t0 + 1.4); if (r <= 0 || r >= 1) return;
        cx.strokeStyle = k === 1 ? 'rgba(77,139,255,' + (1 - r) + ')' : 'rgba(69,237,209,' + (1 - r) + ')'; cx.lineWidth = (3 - 2 * r) * S;
        cx.beginPath(); cx.ellipse(ox, oy, Math.max(W, H) * .7 * eo(r), Math.max(W, H) * .42 * eo(r), 0, 0, 7); cx.stroke();
      });
      var k2 = eo(seg(u, 2.7, 3.3)), ty0 = oy + tw * .17;
      font('600', Math.min(W * .022, 17 * S), FT); cx.textAlign = 'center'; cx.fillStyle = 'rgba(244,246,250,' + k2 * .92 + ')';
      cx.fillText('ENTREGAS QUE SE MUEVEN SOLAS', ox, ty0 + 20 * S);
      font('500', Math.min(W * .018, 13 * S), FT); cx.fillStyle = 'rgba(244,246,250,' + k2 * .55 + ')';
      cx.fillText('ROBOTICS · DESDE $6,999 MXN', ox, ty0 + 46 * S); cx.textAlign = 'left';
      if (window.JEEVES_EXPORT) {
        var ck = eo(seg(u, 3.0, 3.5)), bw = Math.min(W * .7, 420 * S), bh2 = 58 * S, bx2 = ox - bw / 2, by2 = Math.max(H * (H > W ? .8 : .78), ty0 + 74 * S);
        cx.globalAlpha = ck; rr(bx2, by2 + (1 - ck) * 20 * S, bw, bh2, bh2 / 2); cx.fillStyle = MINT; cx.fill();
        font('700', 21 * S, FT); cx.fillStyle = '#0F172A'; cx.textAlign = 'center'; cx.fillText('Cotiza por WhatsApp', ox, by2 + (1 - ck) * 20 * S + bh2 * .64);
        font('600', 17 * S, FT); cx.fillStyle = 'rgba(244,246,250,.85)'; cx.fillText('+52 56 3642 2489', ox, by2 + bh2 + 40 * S); cx.textAlign = 'left'; cx.globalAlpha = 1;
      }
    } },
    { n: 'FOTO', d: 4.0, dark: true, f: function (u) {
      bg(INK);
      var port = H > W, h = Math.min(H * (port ? .58 : .64), W * (port ? 1.0 : .5)), oy = H * (port ? .45 : .44), on = eo(seg(u, .2, 1.6));
      var g = cx.createRadialGradient(W / 2, oy - h * .1, 0, W / 2, oy, h * .95); g.addColorStop(0, 'rgba(37,99,235,' + (.34 * on) + ')'); g.addColorStop(1, 'rgba(37,99,235,0)'); cx.fillStyle = g; cx.fillRect(0, 0, W, H);
      cx.save(); cx.translate(W / 2, oy + h / 2); cx.scale(1, .16); cx.fillStyle = 'rgba(69,237,209,' + (.16 * on) + ')'; cx.beginPath(); cx.arc(0, 0, h * .42, 0, 7); cx.fill(); cx.restore();
      /* se enciende de arriba hacia abajo, siguiendo una línea de luz */
      var hh = h * (1 + .05 * eio(seg(u, 0, 4))), top = oy - hh / 2, sy = top - 10 * S + (hh + 20 * S) * eio(seg(u, .2, 1.6));
      cx.save(); cx.beginPath(); cx.rect(0, 0, W, sy); cx.clip(); robot(W / 2, oy, hh, 0, 1); cx.restore();
      cx.save(); cx.beginPath(); cx.rect(0, sy, W, H); cx.clip(); robot(W / 2, oy, hh, 0, .1); cx.restore();
      if (u < 1.7) { cx.fillStyle = 'rgba(69,237,209,' + (1 - seg(u, 1.4, 1.7)) + ')'; cx.shadowColor = MINT; cx.shadowBlur = 24 * S; cx.fillRect(W / 2 - hh * .5, sy, hh, 2 * S); cx.shadowBlur = 0; }
      var k = eo(seg(u, 1.6, 2.2)), px = Math.min(W * (port ? .085 : .05), 44 * S);
      font('600', 11 * S, FT); cx.textAlign = 'center'; cx.fillStyle = 'rgba(69,237,209,' + k + ')'; cx.fillText('ASÍ SE VE DE VERDAD', W / 2, H - 58 * S - px * 1.2);
      font('700', px); cx.fillStyle = 'rgba(244,246,250,' + k + ')'; cx.fillText('Conoce a Jeeves.', W / 2, H - 58 * S + 14 * S * (1 - k)); cx.textAlign = 'left';
    } },
    { n: 'FRASE', d: 2.0, dark: true, hit: [0, 1], f: function (u) {
      bg(INK);
      var port = H > W, px = Math.min(W * (port ? .1 : .075), H * .13), x = 50 * S, y = H * .45;
      maskWord('Tu equipo atiende.', x, y, px, u, 0, .018, WHITE, 'left', -.035);
      maskWord('Jeeves reparte.', x, y + px * 1.12, px, u, 1, .02, MINT, 'left', -.035);
    } },
    { n: 'CUENTA', d: 2.0, dark: true, hit: [0, .5, 1], f: function (u) {
      bg(INK);
      var k = u < .5 ? 0 : u < 1 ? 1 : u < 1.5 ? 2 : 3, lu = u - k * .5;
      if (k < 3) {
        var px = Math.min(H * .55, W * .62), sc = 1 + .35 * (1 - eo(seg(lu, 0, .22)));
        cx.save(); cx.translate(W / 2, H / 2); cx.scale(sc, sc); font('700', px); cx.textAlign = 'center'; cx.textBaseline = 'middle';
        cx.fillStyle = k === 1 ? MINT : WHITE; cx.globalAlpha = 1 - .5 * seg(lu, .3, .5); cx.fillText(String(3 - k), 0, px * .04); cx.restore(); cx.globalAlpha = 1; cx.textBaseline = 'alphabetic'; cx.textAlign = 'left';
        cx.strokeStyle = 'rgba(69,237,209,' + (1 - eo(seg(lu, 0, .45))) + ')'; cx.lineWidth = 3 * S; cx.beginPath(); cx.arc(W / 2, H / 2, Math.min(W, H) * (.2 + .3 * eo(seg(lu, 0, .45))), 0, 7); cx.stroke();
      } else {
        /* la línea del inicio vuelve y se cierra en un punto antes del golpe */
        var p = 1 - ei(seg(lu, 0, .45)), y = H * .52;
        cx.fillStyle = MINT; cx.fillRect(W / 2 - W * .45 * p, y - 1.5 * S, W * .9 * p, 3 * S);
        cx.shadowColor = MINT; cx.shadowBlur = 30 * S; cx.fillStyle = WHITE; cx.beginPath(); cx.arc(W / 2, y, 7 * S * (1 + 1.5 * (1 - p)), 0, 7); cx.fill(); cx.shadowBlur = 0;
      }
    } },
    { n: 'CAPAS', d: 4.0, dark: true, hit: [1, 1.75, 2.5, 3.25], f: function (u) {
      bg(INK);
      var port = H > W, h = Math.min(H * (port ? .42 : .56), W * (port ? .8 : .42)), ox = port ? W * .3 : W * .36, oy = H * .5;
      var g = cx.createRadialGradient(ox, oy, 0, ox, oy, h * .9); g.addColorStop(0, 'rgba(37,99,235,.26)'); g.addColorStop(1, 'rgba(37,99,235,0)'); cx.fillStyle = g; cx.fillRect(0, 0, W, H);
      var e = eio(seg(u, .05, .95)), k = u < 1 ? -1 : Math.min(3, Math.floor((u - 1) / .75)), w = robot(ox, oy, h, e, 1, k);
      var NAMES = ['Cabeza', 'Charola de arriba', 'Charola de abajo', 'Base con llantas'], SUB = ['OJOS QUE AVISAN', 'BEBIDAS Y POSTRES', 'PLATOS Y PAQUETES', 'LLANTAS SUAVES'];
      var px = Math.min(W * (port ? .05 : .034), 30 * S), lx = ox + w * .5 + 34 * S;
      for (var i = 0; i < 4; i++) {
        var a = seg(u, 1 + i * .75, 1.25 + i * .75); if (a <= 0) continue;
        var y = oy - h / 2 + (CT[i] + CHH[i] / 2 + CDY[i] * e) * h, on = i === k, al = eo(a) * (on ? 1 : .4);
        cx.strokeStyle = 'rgba(69,237,209,' + al + ')'; cx.lineWidth = 1.5 * S; cx.beginPath(); cx.moveTo(ox + w * .3, y); cx.lineTo(ox + w * .3 + (lx - 10 * S - ox - w * .3) * eo(a), y); cx.stroke();
        cx.fillStyle = 'rgba(69,237,209,' + al + ')'; cx.beginPath(); cx.arc(ox + w * .3, y, 3.5 * S, 0, 7); cx.fill();
        font('700', px); cx.fillStyle = 'rgba(244,246,250,' + al + ')'; cx.fillText(NAMES[i], lx + 12 * S * (1 - eo(a)), y + px * .1);
        font('600', 10.5 * S, FT); cx.fillStyle = 'rgba(163,173,191,' + al + ')'; cx.fillText(SUB[i], lx + 12 * S * (1 - eo(a)), y + px * .1 + 18 * S);
      }
      var tk = eo(seg(u, .3, .8)); font('600', 11 * S, FT); cx.fillStyle = 'rgba(69,237,209,' + tk + ')'; cx.fillText('CUATRO PIEZAS · UN SOLO ROBOT', 44 * S, 64 * S);
    } },
    { n: 'LUGARES', d: 4.0, dark: false, hit: [0, 1.5, 3], f: function (u) {
      var j = u < 1.5 ? 0 : u < 3 ? 1 : 2, lu = u - [0, 1.5, 3][j], len = [1.5, 1.5, 1.0][j];
      var bgG = cx.createLinearGradient(0, 0, 0, H); bgG.addColorStop(0, '#F4F6F9'); bgG.addColorStop(1, '#DCE2EA'); cx.fillStyle = bgG; cx.fillRect(0, 0, W, H);
      var port = H > W, cw = Math.min(W * (port ? 1.0 : .84) / 10, H * (port ? .7 : .74) / 6.2) * (1.02 + .04 * eo(seg(lu, 0, len)));
      var sp = eio(seg(lu, .05, len - .05)), R = art.along(RPATH, sp);
      art.diorama({ place: j, cw: cw, ox: W / 2, oy: H * (port ? .45 : .47) - 2.13 * cw, t: u, intro: 9, robot: R, path: RPATH, prog: sp, planA: 1, padK: 1, dest: [3], served: [], pins: [] });
      var px = Math.min(W * .06, 46 * S);
      font('600', 11 * S, FT); cx.fillStyle = 'rgba(31,154,134,.9)'; cx.fillText('LLEGA A TODOS LADOS', 44 * S, H - 46 * S - px - 6 * S);
      maskWord(['Restaurantes.', 'Oficinas.', 'Escuelas.'][j], 44 * S, H - 46 * S, px, lu, 0, .02, '#05070C', 'left', -.03);
    } }
  ];
  var ORDER = ['APERTURA', 'FOTO', 'MIRADA', 'FRASE', 'CUENTA', 'IMPACTO', 'SERVICIO', 'PULSO', 'HOLOGRAMA', 'CAPAS', 'RITMO', 'RUTA', 'LUGARES', 'NÚMEROS', 'VELOCIDAD LUZ', 'JEEVES'];
  SC = ORDER.map(function (n) { for (var i = 0; i < SC.length; i++) if (SC[i].n === n) return SC[i]; });
  var IX = {}; SC.forEach(function (sc, i) { IX[sc.n] = i; });
  /* ---------- Corte al ritmo: 120.98 BPM, 8 compases de subida y drop en "JEEVES" ----------
     [beat inicio, beat fin, escena, u inicio, u fin]  (beats contados desde el drop) */
  var BEAT = 60 / 120.98, PRE = 32, POST = 72;
  var CUT = [[-32, -24, 'APERTURA', 0, 2], [-24, -16, 'FOTO', 0, 4], [-16, -8, 'MIRADA', 0, 2], [-8, -4, 'FRASE', 0, 2], [-4, 0, 'CUENTA', 0, 2],
    [0, 4, 'IMPACTO', 0, 2], [4, 8, 'SERVICIO', 0, 1.5], [8, 12, 'PULSO', 0, 1.5], [12, 16, 'HOLOGRAMA', 0, 3.2], [16, 20, 'HOLOGRAMA', 3.2, 4], [20, 28, 'CAPAS', 0, 4],
    [28, 32, 'RITMO', 0, 1.5], [32, 40, 'RUTA', 0, 3.5], [40, 48, 'LUGARES', 0, 4], [48, 49, 'NÚMEROS', 0, .75], [49, 50, 'NÚMEROS', .75, 1.5], [50, 52, 'NÚMEROS', 1.5, 2.5],
    [52, 56, 'VELOCIDAD LUZ', 0, 1.5], [56, 60, 'JEEVES', 0, 2.4], [60, 60 + 2.6 / BEAT, 'JEEVES', 2.4, 5], [60 + 2.6 / BEAT, POST, 'JEEVES', 4.99, 4.99]]
    .map(function (c) { return [(c[0] + PRE) * BEAT, (c[1] + PRE) * BEAT, IX[c[2]], c[3], c[4]]; });
  var DUR = (PRE + POST) * BEAT;
  SC.forEach(function (sc) { sc.a = 0; }); CUT.forEach(function (c) { if (!SC[c[2]].a && c[2]) SC[c[2]].a = c[0]; });
  function locate(tv) {
    for (var i = 0; i < CUT.length; i++) { var c = CUT[i]; if (tv < c[1] || i === CUT.length - 1) { var k = cl((tv - c[0]) / (c[1] - c[0])); return [c[2], c[3] + (c[4] - c[3]) * k]; } }
  }
  function tvOf(name, u) { for (var i = 0; i < CUT.length; i++) { var c = CUT[i]; if (c[2] === IX[name] && u >= c[3] && u <= c[4] && c[4] > c[3]) return c[0] + (u - c[3]) / (c[4] - c[3]) * (c[1] - c[0]); } return 0; }
  /* golpe de zoom: fuerte en cada corte y suave en cada bombo del drop */
  var CUTB = CUT.map(function (c) { return Math.round(c[0] / BEAT - PRE); });
  function pump(tv) {
    var b = tv / BEAT - PRE, v = 0;
    for (var k = Math.floor(b) - 2; k <= Math.floor(b); k++) { var dt = (b - k) * BEAT; if (dt < 0) continue;
      var a = CUTB.indexOf(k) >= 0 ? (k >= 0 && k <= 60 ? .05 : .02) : (k > 0 && k < 60 ? .013 : 0); v += a * Math.exp(-dt / .17); }
    return v;
  }
  var HITS = [];
  CUT.forEach(function (c) { if (c[4] <= c[3]) return; (SC[c[2]].hit || [0]).forEach(function (h) { if (h >= c[3] && h < c[4]) HITS.push(c[0] + (h - c[3]) / (c[4] - c[3]) * (c[1] - c[0])); }); });

  /* ---------- Postproducción: grano, viñeta, franjas, temblor y choque de color ---------- */
  var grain = document.createElement('canvas'); grain.width = grain.height = 192;
  (function () { var g = grain.getContext('2d'), im = g.createImageData(192, 192); for (var i = 0; i < im.data.length; i += 4) { var v = Math.random() * 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; } g.putImageData(im, 0, 0); })();
  var buf = document.createElement('canvas'), bx = buf.getContext('2d');
  function shakeAmt(t) { var a = 0; HITS.forEach(function (h) { var d = t - h; if (d >= 0 && d < .6) a += Math.exp(-d * 9); }); return Math.min(1.4, a); }
  function bars(i, u) {
    var n = SC[i].n;
    if (n === 'APERTURA') return 1 - eo(seg(u, 1.6, 2.1));
    if (n === 'VELOCIDAD LUZ') return eo(seg(u, 0, .4));
    if (n === 'JEEVES') return 1 - eo(seg(u, .05, .5));
    return 0;
  }

  function hud(i, t, dark) {
    var c = dark ? 'rgba(244,246,250,.6)' : 'rgba(5,7,12,.55)', m = 20 * S, l = 16 * S;
    cx.strokeStyle = c; cx.lineWidth = 1.5 * S;
    [[m, m, 1, 1], [W - m, m, -1, 1], [m, H - m, 1, -1], [W - m, H - m, -1, -1]].forEach(function (p) { cx.beginPath(); cx.moveTo(p[0], p[1] + l * p[3]); cx.lineTo(p[0], p[1]); cx.lineTo(p[0] + l * p[2], p[1]); cx.stroke(); });
    font('600', 10.5 * S, FT); cx.fillStyle = c;
    var fr = Math.floor((t % 1) * 24), tc = '00:' + ('0' + Math.floor(t)).slice(-2) + ':' + ('0' + fr).slice(-2);
    cx.fillText('JEEVES ROBOTICS — REEL', m + 22 * S, m + 14 * S);
    cx.textAlign = 'right'; cx.fillText(tc, W - m - 22 * S, m + 14 * S);
    cx.fillText(('0' + (i + 1)).slice(-2) + ' / ' + ('0' + SC.length).slice(-2), W - m - 122 * S, H - m - 6 * S);
    cx.textAlign = 'left'; cx.fillText(SC[i].n, m + 22 * S, H - m - 6 * S);
  }

  function render(t) {
    var L = locate(t), i = L[0], s = SC[i], u = L[1], sh = reduce ? 0 : shakeAmt(t);
    cx.setTransform(1, 0, 0, 1, 0, 0); cx.textAlign = 'left'; cx.globalAlpha = 1; cx.shadowBlur = 0; cx.globalCompositeOperation = 'source-over';
    var punch = (1 + .05 * (1 - eo(seg(u, 0, .35)))) * (1 + (reduce ? 0 : pump(t)));
    cx.save();
    cx.translate(W / 2 + (rnd(Math.floor(t * 60)) - .5) * 22 * S * sh, H / 2 + (rnd(Math.floor(t * 60) + 7) - .5) * 22 * S * sh);
    cx.scale(punch, punch); cx.translate(-W / 2, -H / 2);
    s.f(u); cx.restore();
    /* choque de color en cada golpe */
    if (sh > .25 && !reduce) {
      if (buf.width !== W || buf.height !== H) { buf.width = W; buf.height = H; }
      bx.clearRect(0, 0, W, H); bx.drawImage(cv, 0, 0);
      var off = 9 * S * sh; cx.globalCompositeOperation = 'lighter'; cx.globalAlpha = .28 * Math.min(1, sh);
      cx.drawImage(buf, off, 0); cx.drawImage(buf, -off, 0); cx.globalAlpha = 1; cx.globalCompositeOperation = 'source-over';
    }
    /* viñeta y grano de película */
    var v = cx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .35, W / 2, H / 2, Math.max(W, H) * .75);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, s.dark ? 'rgba(0,0,0,.55)' : 'rgba(0,0,0,.16)'); cx.fillStyle = v; cx.fillRect(0, 0, W, H);
    cx.globalAlpha = s.dark ? .07 : .05; cx.globalCompositeOperation = 'overlay';
    var gx = Math.floor(rnd(Math.floor(t * 24)) * 192), gy = Math.floor(rnd(Math.floor(t * 24) + 3) * 192);
    cx.fillStyle = cx.createPattern(grain, 'repeat'); cx.save(); cx.translate(-gx, -gy); cx.fillRect(gx, gy, W, H); cx.restore();
    cx.globalAlpha = 1; cx.globalCompositeOperation = 'source-over';
    /* franjas de cine */
    var bh = H * .11 * bars(i, u); if (bh > .5) { cx.fillStyle = '#000'; cx.fillRect(0, 0, W, bh); cx.fillRect(0, H - bh, W, bh); }
    hud(i, t, s.dark);
    if (i > 0 && t - SC[i].a < .03 && t >= SC[i].a) { cx.fillStyle = s.dark ? 'rgba(244,246,250,.45)' : 'rgba(5,7,12,.35)'; cx.fillRect(0, 0, W, H); }
    var on = s.n === 'JEEVES' && u > 3.0; if (on !== ctaOn) { ctaOn = on; box.classList.toggle('cta-on', on); cta.tabIndex = on ? 0 : -1; cta.setAttribute('aria-hidden', String(!on)); }
  }
  var ctaOn = null;

  /* ---------- Sonido: pista original pregrabada, sincronizada con el corte ----------
     El reloj del audio manda: la imagen sigue al sonido para que cada golpe caiga en su lugar. */
  var ac = null, abuf = null, src = null, gain = null, soundOn = false, aStart = 0, loading = false;
  function startSrc() {
    if (!ac || !abuf) return;
    if (src) { try { src.stop(); } catch (e) {} src.disconnect(); }
    src = ac.createBufferSource(); src.buffer = abuf; src.loop = true; src.loopStart = 0; src.loopEnd = Math.min(DUR, abuf.duration);
    src.connect(gain); t = 0; prevT = -1; aStart = ac.currentTime + .06; src.start(aStart, 0);
  }
  function setLabel() {
    sbtn.setAttribute('aria-pressed', String(soundOn)); sbtn.setAttribute('aria-label', soundOn ? 'Silenciar el reel' : 'Activar sonido del reel');
    sbtn.querySelector('span').textContent = loading ? 'Cargando…' : soundOn ? 'Sonido' : 'Activar sonido';
  }
  sbtn.addEventListener('click', function () {
    var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    if (!ac) { ac = new AC(); gain = ac.createGain(); gain.gain.value = .9; gain.connect(ac.destination); }
    soundOn = !soundOn;
    if (soundOn) {
      if (ac.state === 'suspended') ac.resume();
      if (!want) { want = true; sync(); }
      if (abuf) startSrc();
      else if (!loading) {
        loading = true; setLabel();
        fetch(BASE + 'assets/reel-musica.mp3').then(function (r) { return r.arrayBuffer(); }).then(function (data) {
          ac.decodeAudioData(data, function (b) { abuf = b; loading = false; setLabel(); if (soundOn) startSrc(); }, function () { loading = false; soundOn = false; setLabel(); });
        }).catch(function () { loading = false; soundOn = false; setLabel(); });
      }
    } else if (src) { try { src.stop(); } catch (e) {} src = null; }
    setLabel();
  });

  /* ---------- Reproducción ---------- */
  function size() {
    var r = cv.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 2);
    if (!r.width) return;
    cv.width = Math.round(r.width * d); cv.height = Math.round(r.height * d);
    W = cv.width; H = cv.height; S = Math.max(.6, Math.min(W, H * 1.6) / 1100) * (window.JEEVES_SCALE || 1); art.size(W, H, S);
    buildCloud(W < 900 ? 2300 : 3600); textReady = 0;
    render(t);
  }
  var t = reduce ? tvOf('JEEVES', 4.2) : 0, prevT = -1, playing = false, want = !reduce, vis = false, last = 0, raf = 0;
  function frame(now) {
    var dt = Math.min((now - last) / 1000, .1); last = now;
    if (soundOn && src && ac && ac.state === 'running') t = Math.max(0, ac.currentTime - aStart) % DUR; else t += dt;
    if (t >= DUR) { t = 0; prevT = -1; }
    prevT = t;
    render(t); if (playing) raf = requestAnimationFrame(frame);
  }
  function sync() {
    var go = want && vis && !document.hidden;
    if (go && !playing) { playing = true; last = performance.now(); raf = requestAnimationFrame(frame); }
    else if (!go && playing) { playing = false; cancelAnimationFrame(raf); }
    btn.setAttribute('aria-pressed', String(want)); btn.setAttribute('aria-label', want ? 'Pausar el reel' : 'Reproducir el reel');
    if (ac && !go && ac.state === 'running') ac.suspend(); else if (ac && go && soundOn && ac.state === 'suspended') ac.resume();
  }
  btn.addEventListener('click', function () { want = !want; sync(); });
  document.addEventListener('visibilitychange', sync);
  if (window.ResizeObserver) new ResizeObserver(size).observe(cv); window.addEventListener('resize', size);
  if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { vis = e[0].isIntersecting; sync(); }, { threshold: .3 }).observe(cv);
  else { vis = true; }
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(function () { textReady = 0; size(); sync(); });
  size(); sync();
  window.JeevesReel = { seek: function (x) { t = x; prevT = x; render(t); }, dur: DUR, beat: BEAT, pre: PRE, scenes: SC.map(function (s) { return [s.n, s.a]; }), resize: size };
})();
