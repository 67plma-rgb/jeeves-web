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
  var RB = {};
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


  /* ---------- Mente de Jeeves: nube de partículas de luz azul ----------
     Puntos que orbitan un centro denso; cada uno es una función del tiempo (exacto al exportar cuadro a cuadro). */
  var NEURO = (function () {
    var out = [];
    for (var i = 0; i < 2600; i++) {
      var r = Math.pow(rnd(i * 1.7 + 1), 1.35) * 1.05, th = rnd(i * 2.9 + 2) * 6.2832, ph = Math.acos(2 * rnd(i * 4.3 + 3) - 1);
      out.push({ r: r, th: th, ph: ph, w: (.35 + 1.1 * (1 - Math.min(1, r))) * (rnd(i * 6.1) < .5 ? 1 : -.6), c: rnd(i * 9.1 + 5), sz: .8 + rnd(i * 7.7) * 1.4, d: rnd(i * 3.3 + 9), w2: 1 + rnd(i * 5.5) * 2 });
    }
    return out;
  })();
  var glowCv = document.createElement('canvas'), glowCx = glowCv.getContext('2d');
  var BP = 0; /* posición en beats (desde el drop) del cuadro actual */
  /* plantilla de beneficio: dibujo arriba (o a la derecha), título grande y una línea de apoyo */
  function benefit(u, back, ink, sub, title, line, motif) {
    bg(back);
    var port = H > W, r = port ? Math.min(W * .3, H * .17) : Math.min(H * .27, W * .17), mx = port ? W / 2 : W * .7, my = port ? H * .36 : H * .5;
    cx.save(); motif(mx, my, r); cx.restore();
    var px = Math.min(W * (port ? .1 : .065), H * (port ? .07 : .12)), tx = port ? W / 2 : 60 * S, ty = port ? H * .66 : H * .5, al = port ? 'center' : 'left';
    maskWord(title, tx, ty, px, u, .15, .022, ink, al, -.035);
    var k = eo(seg(u, .7, 1.2)); font('600', Math.min(W * (port ? .05 : .024), 26 * S), FT); cx.textAlign = al; cx.fillStyle = sub; cx.globalAlpha = k;
    cx.fillText(line, tx, ty + px * .55 + 34 * S + 10 * S * (1 - k)); cx.globalAlpha = 1; cx.textAlign = 'left';
  }
  /* ráfaga: una palabra enorme por golpe, cada una con su color */
  function rafaga(u, words) {
    var k = Math.min(3, Math.floor(u / .5)), lu = u - k * .5;
    var BGS = [INK, MINT, DEEP, WHITE], INKS = [WHITE, '#05070C', WHITE, '#05070C'];
    bg(BGS[k]);
    var w = words[k], px = Math.min(H * .3, W * .3); font('700', px); var tw = cx.measureText(w).width; if (tw > W * .88) px *= W * .88 / tw;
    var sc = 1 + .28 * (1 - eo(seg(lu, 0, .14)));
    cx.save(); cx.translate(W / 2, H / 2); cx.scale(sc, sc); font('700', px); cx.textAlign = 'center'; cx.textBaseline = 'middle';
    cx.globalAlpha = .18 * (1 - seg(lu, 0, .2)); cx.fillStyle = INKS[k]; cx.fillText(w, 0, -px * .06); cx.save(); cx.scale(1.08, 1.08); cx.fillText(w, 0, 0); cx.restore();
    cx.globalAlpha = 1; cx.fillText(w, 0, px * .04); cx.restore(); cx.textAlign = 'left'; cx.textBaseline = 'alphabetic';
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
      /* Revelado de producto: estudio oscuro, haz de luz cenital, cámara que avanza, brillo que recorre el robot y reflejo en el piso. */
      bg('#04060B');
      var port = H > W, k0 = eo(seg(u, 0, 1.2)), dolly = 1 + .07 * eio(seg(u, 0, 4)), h = Math.min(H * (port ? .56 : .66), W * (port ? .98 : .5)) * dolly;
      var cxm = W / 2, oy = H * (port ? .43 : .44) - h * .02 * eio(seg(u, 0, 4)), floorY = oy + h / 2;
      /* piso: degradado y charco de luz */
      var fg = cx.createLinearGradient(0, floorY - h * .06, 0, H); fg.addColorStop(0, 'rgba(24,36,64,' + .55 * k0 + ')'); fg.addColorStop(1, 'rgba(4,6,11,0)'); cx.fillStyle = fg; cx.fillRect(0, floorY - h * .06, W, H - floorY + h * .06);
      cx.save(); cx.translate(cxm, floorY); cx.scale(1, .15); var pg = cx.createRadialGradient(0, 0, 0, 0, 0, h * .62); pg.addColorStop(0, 'rgba(190,215,255,' + .34 * k0 + ')'); pg.addColorStop(.5, 'rgba(77,139,255,' + .12 * k0 + ')'); pg.addColorStop(1, 'rgba(77,139,255,0)'); cx.fillStyle = pg; cx.beginPath(); cx.arc(0, 0, h * .62, 0, 7); cx.fill(); cx.restore();
      /* haz cenital (capas suaves) */
      cx.globalCompositeOperation = 'lighter';
      for (var L = 0; L < 12; L++) {
        var wTop = h * (.08 + L * .02), wBot = h * (.4 + L * .07), gr = cx.createLinearGradient(0, 0, 0, floorY);
        gr.addColorStop(0, 'rgba(170,200,255,' + (.04 * k0 * (1 - L * .07)) + ')'); gr.addColorStop(1, 'rgba(120,160,255,0)');
        cx.fillStyle = gr; cx.beginPath(); cx.moveTo(cxm - wTop, 0); cx.lineTo(cxm + wTop, 0); cx.lineTo(cxm + wBot, floorY); cx.lineTo(cxm - wBot, floorY); cx.closePath(); cx.fill();
      }
      /* polvo en el haz */
      for (var d = 0; d < 46; d++) {
        var dx = (rnd(d * 3.1) - .5) * h * .9, dy = (((rnd(d * 7.7) + u * (.012 + rnd(d) * .02)) % 1)) * floorY, inb = 1 - Math.abs(dx) / (h * (.2 + dy / floorY * .45));
        if (inb <= 0) continue; cx.fillStyle = 'rgba(210,230,255,' + (inb * .5 * k0) + ')'; cx.beginPath(); cx.arc(cxm + dx, dy, (.6 + rnd(d * 5.3) * 1.2) * S, 0, 7); cx.fill();
      }
      cx.globalCompositeOperation = 'source-over';
      /* robot en un lienzo aparte para poder iluminarlo */
      var rw = Math.round(h * 1280 / 1720), rh = Math.round(h);
      if (!RB.c) { RB.c = document.createElement('canvas'); RB.x = RB.c.getContext('2d'); RB.r = document.createElement('canvas'); RB.rx = RB.r.getContext('2d'); }
      if (RB.c.width !== rw || RB.c.height !== rh) { RB.c.width = RB.r.width = rw; RB.c.height = RB.r.height = rh; }
      var o = RB.x; o.setTransform(1, 0, 0, 1, 0, 0); o.clearRect(0, 0, rw, rh);
      for (var i = 0; i < 4; i++) { var im = CAPA[i]; if (!im.complete || !im.naturalWidth) continue; o.drawImage(im, 0, CT[i] * rh, rw, CHH[i] * rh); }
      var expo = eo(seg(u, .35, 1.7));
      o.globalCompositeOperation = 'source-atop';
      /* luz de estudio: arriba más clara, abajo cae a sombra */
      var lg = o.createLinearGradient(0, 0, 0, rh); lg.addColorStop(0, 'rgba(0,0,0,0)'); lg.addColorStop(.7, 'rgba(0,4,16,.18)'); lg.addColorStop(1, 'rgba(0,4,16,.55)'); o.fillStyle = lg; o.fillRect(0, 0, rw, rh);
      /* brillo que recorre el cuerpo */
      var sp = -.4 + 1.8 * eio(seg(u, 1.0, 2.7)), sg = o.createLinearGradient(rw * (sp - .22), 0, rw * (sp + .22), rh * .5); sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(.5, 'rgba(235,248,255,' + .5 * (1 - seg(u, 2.4, 2.9)) + ')'); sg.addColorStop(1, 'rgba(255,255,255,0)'); o.fillStyle = sg; o.fillRect(0, 0, rw, rh);
      /* luz de contorno turquesa por el costado derecho */
      var rg = o.createLinearGradient(rw * .62, 0, rw, 0); rg.addColorStop(0, 'rgba(69,237,209,0)'); rg.addColorStop(1, 'rgba(69,237,209,' + .38 * expo + ')'); o.fillStyle = rg; o.fillRect(0, 0, rw, rh);
      /* exposición: sale de la oscuridad */
      o.fillStyle = 'rgba(4,6,11,' + (1 - expo) * .92 + ')'; o.fillRect(0, 0, rw, rh); o.globalCompositeOperation = 'source-over';
      /* reflejo: espejo vertical que se desvanece */
      var q = RB.rx; q.setTransform(1, 0, 0, 1, 0, 0); q.clearRect(0, 0, rw, rh); q.save(); q.translate(0, rh); q.scale(1, -1); q.drawImage(RB.c, 0, 0); q.restore();
      q.globalCompositeOperation = 'destination-out'; var fg2 = q.createLinearGradient(0, 0, 0, rh * .42); fg2.addColorStop(0, 'rgba(0,0,0,.62)'); fg2.addColorStop(1, 'rgba(0,0,0,1)'); q.fillStyle = fg2; q.fillRect(0, 0, rw, rh); q.globalCompositeOperation = 'source-over';
      cx.drawImage(RB.r, 0, 0, rw, rh * .45, cxm - rw / 2, floorY - rh * .015, rw, rh * .45);
      cx.drawImage(RB.c, cxm - rw / 2, oy - rh / 2, rw, rh);
      /* titular */
      var px = Math.min(W * (port ? .1 : .055), 50 * S), ty = H - 64 * S;
      maskWord('Conoce a', cxm - (W * .0), ty - px * 1.05, px, u, 2.0, .02, WHITE, 'center', -.035);
      maskWord('Jeeves.', cxm, ty, px, u, 2.25, .03, MINT, 'center', -.035);
      var vg = cx.createRadialGradient(W / 2, H * .45, Math.min(W, H) * .35, W / 2, H * .5, Math.max(W, H) * .8); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.55)'); cx.fillStyle = vg; cx.fillRect(0, 0, W, H);
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
,
    { n: 'PREGUNTA', d: 4.0, dark: true, hit: [0, 1], f: function (u) {
      bg(INK);
      var port = H > W, px = Math.min(W * (port ? .15 : .1), H * .16), y = H * .46;
      maskWord('¿Por qué', W / 2, y, px, u, .1, .03, WHITE, 'center', -.04);
      maskWord('Jeeves?', W / 2, y + px * 1.05, px, u, 1, .035, MINT, 'center', -.04);
      var k = eo(seg(u, 2, 2.6)); font('600', Math.min(W * .045, 24 * S), FT); cx.textAlign = 'center'; cx.fillStyle = 'rgba(244,246,250,' + k * .7 + ')';
      cx.fillText('Mira lo que hace por tu negocio.', W / 2, y + px * 1.05 + 60 * S); cx.textAlign = 'left';
    } },
    { n: 'TIEMPO', d: 4.0, dark: true, hit: [0, 1.6], f: function (u) {
      benefit(u, INK, WHITE, 'rgba(163,173,191,.95)', 'Ahorra tiempo.', 'Tu equipo deja de ir y venir.', function (mx, my, r) {
        var sp = eo(seg(u, 0, 1.6)), sweep = eo(seg(u, 1.6, 2.5));
        if (sweep > 0) { cx.fillStyle = 'rgba(69,237,209,.18)'; cx.beginPath(); cx.moveTo(mx, my); cx.arc(mx, my, r * .92, -Math.PI / 2, -Math.PI / 2 + Math.PI * .75 * sweep); cx.closePath(); cx.fill(); }
        cx.strokeStyle = 'rgba(244,246,250,.9)'; cx.lineWidth = 3 * S; cx.beginPath(); cx.arc(mx, my, r, 0, 7); cx.stroke();
        for (var i = 0; i < 60; i++) { var a = i / 60 * Math.PI * 2, l = i % 5 ? .06 : .13; cx.lineWidth = (i % 5 ? 1 : 2.5) * S; cx.strokeStyle = i % 5 ? 'rgba(244,246,250,.35)' : 'rgba(244,246,250,.85)';
          cx.beginPath(); cx.moveTo(mx + Math.cos(a) * r * (1 - l - .04), my + Math.sin(a) * r * (1 - l - .04)); cx.lineTo(mx + Math.cos(a) * r * .96, my + Math.sin(a) * r * .96); cx.stroke(); }
        var am = -Math.PI / 2 + Math.PI * 2 * 6 * sp, ah = -Math.PI / 2 + Math.PI * 2 * .5 * sp;
        cx.lineCap = 'round'; cx.strokeStyle = WHITE; cx.lineWidth = 6 * S; cx.beginPath(); cx.moveTo(mx, my); cx.lineTo(mx + Math.cos(ah) * r * .5, my + Math.sin(ah) * r * .5); cx.stroke();
        cx.strokeStyle = MINT; cx.lineWidth = 4 * S; cx.beginPath(); cx.moveTo(mx, my); cx.lineTo(mx + Math.cos(am) * r * .78, my + Math.sin(am) * r * .78); cx.stroke(); cx.lineCap = 'butt';
        cx.fillStyle = MINT; cx.beginPath(); cx.arc(mx, my, 7 * S, 0, 7); cx.fill();
      });
    } },
    { n: 'DINERO', d: 4.0, dark: false, hit: [0], f: function (u) {
      benefit(u, MINT, '#05070C', 'rgba(5,7,12,.72)', 'Ahorra dinero.', 'Menos vueltas, menos costos.', function (mx, my, r) {
        var cw = r * 1.15, chh = cw * .24, base = my + r * .75;
        for (var k = 0; k < 8; k++) {
          var t0 = .1 + k * .17, d = eo(seg(u, t0, t0 + .3)); if (d <= 0) continue;
          var y = base - k * chh * .62 - (1 - d) * H * .5 + Math.sin(seg(u, t0 + .3, t0 + .5) * Math.PI) * -6 * S;
          cx.fillStyle = '#05070C'; cx.beginPath(); cx.ellipse(mx, y + chh * .18, cw / 2, chh / 2, 0, 0, 7); cx.fill();
          cx.fillStyle = '#F4F6FA'; cx.beginPath(); cx.ellipse(mx, y, cw / 2, chh / 2, 0, 0, 7); cx.fill();
          cx.strokeStyle = '#05070C'; cx.lineWidth = 2.5 * S; cx.stroke();
          if (k === 7) { font('700', chh * .85); cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillStyle = '#05070C'; cx.fillText('$', mx, y + chh * .04); cx.textAlign = 'left'; cx.textBaseline = 'alphabetic'; }
        }
      });
    } },
    { n: 'SIN PAUSAS', d: 4.0, dark: true, hit: [0, 2.7], f: function (u) {
      benefit(u, DEEP, WHITE, 'rgba(244,246,250,.82)', 'Sin descansos.', 'Trabaja todo tu turno.', function (mx, my, r) {
        var x0 = mx - r * 1.25, x1 = mx + r * 1.25, k = eio(seg(u, .25, 2.6)), xr = x0 + (x1 - x0) * k;
        cx.strokeStyle = 'rgba(255,255,255,.25)'; cx.lineWidth = 3 * S; cx.beginPath(); cx.moveTo(x0, my); cx.lineTo(x1, my); cx.stroke();
        for (var i = 0; i <= 12; i++) { var x = x0 + (x1 - x0) * i / 12; cx.fillStyle = x <= xr ? MINT : 'rgba(255,255,255,.35)'; cx.fillRect(x - 1 * S, my - (i % 3 ? 6 : 12) * S, 2 * S, (i % 3 ? 12 : 24) * S); }
        cx.strokeStyle = MINT; cx.lineWidth = 4 * S; cx.beginPath(); cx.moveTo(x0, my); cx.lineTo(xr, my); cx.stroke();
        cx.shadowColor = MINT; cx.shadowBlur = 24 * S; cx.fillStyle = WHITE; cx.beginPath(); cx.arc(xr, my, 9 * S, 0, 7); cx.fill(); cx.shadowBlur = 0;
        font('600', 12 * S, FT); cx.fillStyle = 'rgba(244,246,250,.75)'; cx.fillText('ABRES', x0, my + 40 * S); cx.textAlign = 'right'; cx.fillText('CIERRAS', x1, my + 40 * S); cx.textAlign = 'left';
        var ck = eo(seg(u, 2.6, 2.9)); if (ck > 0) { cx.strokeStyle = MINT; cx.lineWidth = 5 * S; cx.lineCap = 'round'; cx.beginPath(); cx.moveTo(x1 - 10 * S, my - 46 * S); cx.lineTo(x1 - 10 * S + 10 * S * Math.min(1, ck * 2), my - 46 * S + 10 * S * Math.min(1, ck * 2)); if (ck > .5) cx.lineTo(x1 - 10 * S + 10 * S + 18 * S * (ck - .5) * 2, my - 36 * S - 22 * S * (ck - .5) * 2); cx.stroke(); cx.lineCap = 'butt'; }
      });
    } },
    { n: 'FÁCIL', d: 4.0, dark: false, hit: [0, 1.2], f: function (u) {
      benefit(u, '#EEEDEC', '#05070C', 'rgba(59,68,87,.95)', 'Fácil de usar.', 'Eliges el destino desde tu celular.', function (mx, my, r) {
        var pw = r * 1.05, ph = pw * 2.0, px0 = mx - pw / 2, py0 = my - ph / 2 + (1 - eo(seg(u, 0, .5))) * 60 * S;
        cx.save(); cx.shadowColor = 'rgba(15,23,42,.25)'; cx.shadowBlur = 40 * S; cx.shadowOffsetY = 18 * S; rr(px0, py0, pw, ph, pw * .16); cx.fillStyle = '#0F172A'; cx.fill(); cx.restore();
        rr(px0 + pw * .05, py0 + pw * .05, pw * .9, ph - pw * .1, pw * .12); cx.fillStyle = '#FFFFFF'; cx.fill();
        var sx = px0 + pw * .12, sw = pw * .76;
        font('700', pw * .085); cx.fillStyle = '#0F172A'; cx.fillText('¿A dónde voy?', sx, py0 + ph * .16);
        var opts = ['Mesa 2', 'Mesa 5', 'Cocina'], tap = seg(u, 1.2, 1.35), chosen = u > 1.25;
        opts.forEach(function (o, i) {
          var by = py0 + ph * (.24 + i * .13), on = chosen && i === 1;
          rr(sx, by, sw, ph * .1, ph * .05); cx.fillStyle = on ? MINT : '#F1F3F7'; cx.fill();
          font('600', pw * .07, FT); cx.fillStyle = '#0F172A'; cx.fillText(o, sx + pw * .07, by + ph * .064);
        });
        if (u > .8 && u < 1.8) { var tx = sx + sw * .7, ty = py0 + ph * (.24 + .13) + ph * .05, rk = seg(u, 1.2, 1.7);
          cx.fillStyle = 'rgba(15,23,42,' + (.35 * (1 - rk)) + ')'; cx.beginPath(); cx.arc(tx, ty, (14 + 30 * rk) * S, 0, 7); cx.fill();
          cx.fillStyle = 'rgba(15,23,42,' + (1 - seg(u, 1.4, 1.8)) * .7 + ')'; cx.beginPath(); cx.arc(tx, ty, (12 - 3 * tap) * S, 0, 7); cx.fill(); }
        if (chosen) { var pk = eio(seg(u, 1.5, 3.4)), yy = py0 + ph * .7;
          font('600', pw * .06, FT); cx.fillStyle = '#1F9A86'; cx.fillText(pk < 1 ? 'En camino a Mesa 5' : 'Entregado en Mesa 5', sx, yy);
          rr(sx, yy + ph * .03, sw, ph * .018, ph * .01); cx.fillStyle = '#E3E7EE'; cx.fill(); rr(sx, yy + ph * .03, sw * Math.max(.04, pk), ph * .018, ph * .01); cx.fillStyle = MINT; cx.fill(); }
      });
    } },
    { n: 'IMAGEN', d: 4.0, dark: true, hit: [.3, .55, .9, 1.4, 1.7], f: function (u) {
      bg(INK);
      var port = H > W, h = Math.min(H * (port ? .5 : .62), W * (port ? .85 : .45)), ox = port ? W / 2 : W * .7, oy = port ? H * .38 : H * .5;
      var g = cx.createRadialGradient(ox, oy, 0, ox, oy, h * .8); g.addColorStop(0, 'rgba(37,99,235,.3)'); g.addColorStop(1, 'rgba(37,99,235,0)'); cx.fillStyle = g; cx.fillRect(0, 0, W, H);
      robot(ox, oy, h * (1 + .04 * eo(seg(u, 0, 4))), 0, 1);
      [.3, .55, .9, 1.4, 1.7].forEach(function (f0, k) {
        var d = u - f0; if (d < 0 || d > .35) return; var a = Math.exp(-d * 14);
        cx.fillStyle = 'rgba(255,255,255,' + a * .55 + ')'; cx.fillRect(0, 0, W, H);
        var sx2 = ox + (rnd(k * 3) - .5) * h * .9, sy2 = oy + (rnd(k * 3 + 1) - .5) * h * .9, sl = (30 + 40 * rnd(k)) * S * a;
        cx.strokeStyle = 'rgba(255,255,255,' + a + ')'; cx.lineWidth = 2 * S; cx.beginPath(); cx.moveTo(sx2 - sl, sy2); cx.lineTo(sx2 + sl, sy2); cx.moveTo(sx2, sy2 - sl); cx.lineTo(sx2, sy2 + sl); cx.stroke();
      });
      var px = Math.min(W * (port ? .095 : .055), 52 * S), tx = port ? W / 2 : 60 * S, ty = port ? H * .76 : H * .48, al = port ? 'center' : 'left';
      maskWord('Se roba', tx, ty, px, u, 1.9, .02, WHITE, al, -.035);
      maskWord('las miradas.', tx, ty + px * 1.08, px, u, 2.1, .02, MINT, al, -.035);
      var k2 = eo(seg(u, 2.6, 3.1)); font('600', Math.min(W * .05, 26 * S), FT); cx.textAlign = al; cx.fillStyle = 'rgba(163,173,191,' + k2 + ')'; cx.fillText('Tu negocio se ve moderno.', tx, ty + px * 1.08 + 44 * S); cx.textAlign = 'left';
    } },
    { n: 'CEREBRO', d: 3.0, dark: true, hit: [], f: function (u) {
      bg(INK);
      var port = H > W, R = port ? Math.min(W * .4, H * .22) : Math.min(H * .38, W * .26), mx = port ? W / 2 : W * .62, my = port ? H * .4 : H * .48;
      var last = BP >= -4 && BP < 0, fr = BP - Math.floor(BP), beatK = last ? (.6 + (BP + 4) * .3) * Math.exp(-fr * 5) : 0;
      var flick = .88 + .12 * Math.sin(u * 23) * Math.sin(u * 7.3), energy = (.5 + .5 * eo(seg(u, .4, 1.4))) * flick + beatK * .6;
      var g = cx.createRadialGradient(mx, my, 0, mx, my, R * 1.9); g.addColorStop(0, 'rgba(37,99,235,' + (.2 * energy) + ')'); g.addColorStop(1, 'rgba(37,99,235,0)'); cx.fillStyle = g; cx.fillRect(0, 0, W, H);
      var sc = R * 1.3 * (1 + beatK * .06) * (.92 + .08 * eo(seg(u, 0, 1.5)));
      cx.globalCompositeOperation = 'lighter'; cx.lineCap = 'round';
      var place = function (p, t) {
        var ang = p.th + p.w * t, rr = p.r * (1 + .06 * Math.sin(t * p.w2 + p.c * 9)), sp = Math.sin(p.ph);
        var x = rr * sp * Math.cos(ang), z = rr * sp * Math.sin(ang), y = rr * Math.cos(p.ph) + .04 * Math.sin(t * 1.3 + p.c * 6);
        var k = 3 / (3 + z); return [mx + x * sc * k, my - y * sc * k * .92, k];
      };
      for (var i = 0; i < NEURO.length; i++) {
        var p = NEURO[i], a = eo(seg(u, p.d * .7, .5 + p.d * .7)); if (a <= 0) continue;
        var e = 1 - a, q0 = place(p, u), q1 = place(p, u - .012);
        var X = q0[0] + (mx - q0[0]) * 0 + Math.cos(p.th * 3) * e * R * 1.6, Y = q0[1] + Math.sin(p.th * 5) * e * R * 1.2;
        var dx = q1[0] - q0[0], dy = q1[1] - q0[1];
        var col = p.c < .55 ? '120,170,255' : p.c < .9 ? '80,235,215' : '235,250,255', al = Math.min(1, a * energy * (.35 + .65 * (1 - p.r / 1.1)) * (.6 + .4 * q0[2]) * 1.15);
        if (al <= .01) continue;
        cx.strokeStyle = 'rgba(' + col + ',' + al + ')'; cx.lineWidth = p.sz * S * q0[2]; cx.beginPath(); cx.moveTo(X, Y); cx.lineTo(X + dx, Y + dy); cx.stroke();
      }
      cx.globalCompositeOperation = 'source-over'; cx.lineCap = 'butt';
      var px = Math.min(W * (port ? .085 : .05), 50 * S), tx = port ? W / 2 : 60 * S, ty = port ? H * .73 : H * .44, al3 = port ? 'center' : 'left';
      maskWord('El cerebro', tx, ty, px, u, .5, .018, WHITE, al3, -.035);
      maskWord('de Jeeves.', tx, ty + px * 1.06, px, u, .7, .018, MINT, al3, -.035);
      if (BP > -.35 && BP < 0) { cx.fillStyle = 'rgba(244,246,250,' + .6 * eio(seg(BP, -.35, 0)) + ')'; cx.fillRect(0, 0, W, H); }
    } },
    { n: 'ESTRELLA', d: 4.0, dark: true, hit: [0, 1, 2, 3], f: function (u) {
      var k = Math.min(3, Math.floor(u)), lu = u - k, port = H > W;
      var BGS = [INK, DEEP, INK, DEEP], WORDS = ['INCANSABLE.', 'PUNTUAL.', 'MODERNO.', 'TUYO.'];
      bg(BGS[k]);
      var w = WORDS[k], px = Math.min(H * .34, W * .34); font('700', px); var tw = cx.measureText(w).width; if (tw > W * 1.15) px *= W * 1.15 / tw;
      var drift = (lu - .5) * W * .06 * (k % 2 ? -1 : 1);
      cx.save(); font('700', px); cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.lineWidth = 2 * S;
      cx.strokeStyle = 'rgba(69,237,209,' + (.55 * (1 - seg(lu, .7, 1))) + ')'; cx.strokeText(w, W / 2 + drift, H * (port ? .3 : .5));
      cx.fillStyle = 'rgba(244,246,250,.07)'; cx.fillText(w, W / 2 + drift, H * (port ? .7 : .5)); cx.restore();
      var h = Math.min(H * (port ? .62 : .68), W * (port ? 1.0 : .5)), sc2 = 1 + .06 * (1 - eo(seg(lu, 0, .18))), ry = H * (port ? .5 : .45);
      var g = cx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, h * .7); g.addColorStop(0, 'rgba(77,139,255,.28)'); g.addColorStop(1, 'rgba(77,139,255,0)'); cx.fillStyle = g; cx.fillRect(0, 0, W, H);
      cx.save(); cx.translate(W / 2, ry); cx.scale(sc2, sc2); cx.translate(-W / 2, -ry); robot(W / 2, ry, h, 0, 1); cx.restore();
      var ty = port ? H - 70 * S : H - 56 * S; font('700', Math.min(W * .07, 40 * S)); cx.textAlign = 'center'; cx.fillStyle = WHITE; cx.globalAlpha = eo(seg(lu, 0, .2));
      cx.fillText(WORDS[k].replace('.', '').charAt(0) + WORDS[k].replace('.', '').slice(1).toLowerCase() + '.', W / 2, ty); cx.globalAlpha = 1; cx.textAlign = 'left';
    } },
    { n: 'RÁFAGA', d: 2.0, dark: true, hit: [0, .5, 1, 1.5], f: function (u) { rafaga(u, ['AHORRA', 'TIEMPO.', 'AHORRA', 'DINERO.']); } },
    { n: 'BENEFICIOS', d: 2.0, dark: true, hit: [0, .5, 1, 1.5], f: function (u) { rafaga(u, ['MENOS VUELTAS.', 'MÁS TIEMPO.', 'CERO PAUSAS.', 'JEEVES.']); } }
  ];
  var ORDER = ['APERTURA', 'FOTO', 'MIRADA', 'PREGUNTA', 'TIEMPO', 'DINERO', 'SIN PAUSAS', 'FRASE', 'FÁCIL', 'CEREBRO', 'ESTRELLA', 'IMAGEN', 'CUENTA', 'IMPACTO', 'SERVICIO', 'RÁFAGA', 'PULSO', 'HOLOGRAMA', 'CAPAS', 'RITMO', 'RUTA', 'LUGARES', 'BENEFICIOS', 'NÚMEROS', 'VELOCIDAD LUZ', 'JEEVES'];
  SC = ORDER.map(function (n) { for (var i = 0; i < SC.length; i++) if (SC[i].n === n) return SC[i]; });
  var IX = {}; SC.forEach(function (sc, i) { IX[sc.n] = i; });
  /* ---------- Corte al ritmo: 120.98 BPM, 8 compases de subida y drop en "JEEVES" ----------
     [beat inicio, beat fin, escena, u inicio, u fin]  (beats contados desde el drop) */
  var BEAT = 60 / 120.98, POST = 72;
  var TAIL = [[48, 49, 'NÚMEROS', 0, .75], [49, 50, 'NÚMEROS', .75, 1.5], [50, 52, 'NÚMEROS', 1.5, 2.5], [52, 56, 'VELOCIDAD LUZ', 0, 1.5],
    [56, 60, 'JEEVES', 0, 2.4], [60, 60 + 2.6 / BEAT, 'JEEVES', 2.4, 5], [60 + 2.6 / BEAT, POST, 'JEEVES', 4.99, 4.99]];
  var CUTS = {
    /* web: 52 s con la pista original (8 compases de subida) */
    web: [[-32, -24, 'APERTURA', 0, 2], [-24, -16, 'FOTO', 0, 4], [-16, -12, 'TIEMPO', 0, 4], [-12, -6, 'DINERO', 0, 4], [-6, 0, 'CEREBRO', 0, 3],
      [0, 4, 'IMPACTO', 0, 2], [4, 8, 'SERVICIO', 0, 1.5], [8, 12, 'RÁFAGA', 0, 2], [12, 16, 'HOLOGRAMA', 0, 3.2], [16, 20, 'HOLOGRAMA', 3.2, 4], [20, 28, 'LUGARES', 0, 4],
      [28, 32, 'RITMO', 0, 1.5], [32, 40, 'RUTA', 0, 3.5], [40, 44, 'PULSO', 0, 1.5], [44, 48, 'BENEFICIOS', 0, 2]].concat(TAIL),
    /* video: 83 s con la canción desde el inicio (24 compases de subida, drop en "JEEVES") */
    video: [[-96, -84, 'APERTURA', 0, 2], [-84, -76, 'FOTO', 0, 4], [-76, -68, 'MIRADA', 0, 2], [-68, -60, 'PREGUNTA', 0, 4], [-60, -52, 'TIEMPO', 0, 4], [-52, -44, 'DINERO', 0, 4],
      [-44, -36, 'SIN PAUSAS', 0, 4], [-36, -28, 'FRASE', 0, 2], [-28, -20, 'FÁCIL', 0, 4], [-20, -6, 'LUGARES', 0, 4.5], [-6, 0, 'CEREBRO', 0, 3],
      [0, 4, 'IMPACTO', 0, 2], [4, 8, 'SERVICIO', 0, 1.5], [8, 12, 'RÁFAGA', 0, 2], [12, 16, 'HOLOGRAMA', 0, 3.2], [16, 20, 'HOLOGRAMA', 3.2, 4], [20, 28, 'ESTRELLA', 0, 4],
      [28, 32, 'RITMO', 0, 1.5], [32, 40, 'RUTA', 0, 3.5], [40, 44, 'PULSO', 0, 1.5], [44, 48, 'BENEFICIOS', 0, 2]].concat(TAIL)
  };
  var RAW = CUTS[window.JEEVES_CUT] || CUTS.video, PRE = -RAW[0][0];
  var CUT = RAW
    .map(function (c) { return [(c[0] + PRE) * BEAT, (c[1] + PRE) * BEAT, IX[c[2]], c[3], c[4]]; });
  var DUR = (PRE + POST) * BEAT;
  var NUM = {}, NSC = 0; CUT.forEach(function (c) { if (NUM[c[2]] == null) NUM[c[2]] = ++NSC; });
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
    cx.fillText(('0' + (NUM[i] || i + 1)).slice(-2) + ' / ' + ('0' + NSC).slice(-2), W - m - 122 * S, H - m - 6 * S);
    cx.textAlign = 'left'; cx.fillText(SC[i].n, m + 22 * S, H - m - 6 * S);
  }

  var XF = .5;
  function segOf(tv) { for (var i = 0; i < CUT.length; i++) if (tv < CUT[i][1] || i === CUT.length - 1) return i; return 0; }
  function drawScene(si, u) {
    var sc = SC[si], push = 1 + .022 * eio(seg(u, 0, Math.max(1.5, sc.d || 3)));
    cx.save(); cx.translate(W / 2, H / 2); cx.scale(push, push); cx.translate(-W / 2, -H / 2); sc.f(u); cx.restore();
  }
  function render(t) {
    var L = locate(t), i = L[0], s = SC[i], u = L[1], sh = 0; BP = t / BEAT - PRE;
    cx.setTransform(1, 0, 0, 1, 0, 0); cx.textAlign = 'left'; cx.globalAlpha = 1; cx.shadowBlur = 0; cx.globalCompositeOperation = 'source-over';
    /* transición: disolvencia suave desde la escena anterior (sin golpes ni destellos) */
    var sg = segOf(t), c0 = CUT[sg], xk = 1, prev = sg > 0 ? CUT[sg - 1] : null;
    if (prev && prev[2] !== c0[2] && c0[2] !== 0 && !reduce) xk = eio(seg(t - c0[0], 0, XF)); else prev = null;
    if (xk < 1) {
      var uo = prev[4] + (t - c0[0]), BPs = BP;
      if (buf.width !== W || buf.height !== H) { buf.width = W; buf.height = H; }
      drawScene(prev[2], uo); bx.setTransform(1, 0, 0, 1, 0, 0); bx.clearRect(0, 0, W, H); bx.drawImage(cv, 0, 0);
      cx.setTransform(1, 0, 0, 1, 0, 0); cx.globalAlpha = 1; cx.globalCompositeOperation = 'source-over'; cx.shadowBlur = 0; cx.textAlign = 'left';
      drawScene(i, u); cx.setTransform(1, 0, 0, 1, 0, 0); cx.globalAlpha = 1 - xk; cx.drawImage(buf, 0, 0); cx.globalAlpha = 1;
    } else drawScene(i, u);
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
        fetch(BASE + 'assets/reel-musica.mp3?v=5').then(function (r) { return r.arrayBuffer(); }).then(function (data) {
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
