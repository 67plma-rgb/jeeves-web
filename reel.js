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

  /* ---------- Jeeves original (mismas piezas que jeeves3d.js) ---------- */
  var WHc = '#F2F4F8', DKc = '#141C30', LEDc = '#45EDD1', VISc = '#05070B', EYEc = '#4D8BFF';
  function chamferBox(w, h, d, r) {
    var A = w / 2, B = h / 2, C = d / 2, c = Math.min(r || 0, A * .9, B * .9, C * .9), F = [];
    function P(sx, sy, sz, ax) { return ax === 0 ? [sx * A, sy * (B - c), sz * (C - c)] : ax === 1 ? [sx * (A - c), sy * B, sz * (C - c)] : [sx * (A - c), sy * (B - c), sz * C]; }
    var Q = [[1, 1], [1, -1], [-1, -1], [-1, 1]];
    [-1, 1].forEach(function (s) {
      F.push({ n: [s, 0, 0], key: 'x' + s, main: 1, v: Q.map(function (q) { return P(s, q[0], q[1], 0); }) });
      F.push({ n: [0, s, 0], key: 'y' + s, main: 1, v: Q.map(function (q) { return P(q[0], s, q[1], 1); }) });
      F.push({ n: [0, 0, s], key: 'z' + s, main: 1, v: Q.map(function (q) { return P(q[0], q[1], s, 2); }) });
    });
    if (c > 1e-4) [-1, 1].forEach(function (a) { [-1, 1].forEach(function (b) {
      F.push({ n: [a * .7071, b * .7071, 0], v: [P(a, b, 1, 0), P(a, b, 1, 1), P(a, b, -1, 1), P(a, b, -1, 0)] });
      F.push({ n: [0, a * .7071, b * .7071], v: [P(1, a, b, 1), P(1, a, b, 2), P(-1, a, b, 2), P(-1, a, b, 1)] });
      F.push({ n: [a * .7071, 0, b * .7071], v: [P(a, 1, b, 0), P(a, 1, b, 2), P(a, -1, b, 2), P(a, -1, b, 0)] });
      [-1, 1].forEach(function (z) { F.push({ n: [a * .577, b * .577, z * .577], v: [P(a, b, z, 0), P(a, b, z, 1), P(a, b, z, 2)] }); });
    }); });
    return F;
  }
  function cylX(r, L, n, a0, a1) {
    var F = [], ring = [], full = a1 - a0 > 6.2, i;
    for (i = 0; i <= n; i++) { var t = a0 + (a1 - a0) * i / n; ring.push([Math.sin(t) * r, Math.cos(t) * r, t]); }
    for (i = 0; i < n; i++) { var p = ring[i], q = ring[i + 1], tm = (p[2] + q[2]) / 2; F.push({ n: [0, Math.sin(tm), Math.cos(tm)], v: [[L / 2, p[0], p[1]], [L / 2, q[0], q[1]], [-L / 2, q[0], q[1]], [-L / 2, p[0], p[1]]] }); }
    [-1, 1].forEach(function (s) { F.push({ n: [s, 0, 0], key: 'x' + s, main: 1, v: ring.slice(0, full ? n : n + 1).map(function (p) { return [s * L / 2, p[0], p[1]]; }) }); });
    return F;
  }
  var PARTS = [];
  function part(o) {
    o.F = o.k === 'sph' ? null : o.k === 'cyl' ? cylX(o.r, o.L, o.n || 18, o.a0 || 0, o.a1 == null ? Math.PI * 2 : o.a1) : chamferBox(o.s[0], o.s[1], o.s[2], o.r);
    o.ext = o.k === 'box' ? o.s : o.k === 'cyl' ? [o.L, o.r * 2, o.r * 2] : [o.r * 2, o.r * 2, o.r * 2]; o.ly = o.ly || 0; PARTS.push(o);
  }
  /* pieza 0: base, llantas y ruedas locas */
  part({ k: 'box', s: [.6, .05, .5], r: .02, p: [0, .11, 0], c: DKc, m: 'm', pc: 0 });
  part({ k: 'box', s: [.62, .1, .52], r: .035, p: [0, .17, 0], c: WHc, m: 'g', pc: 0, dec: 'logo' });
  part({ k: 'box', s: [.63, .012, .53], p: [0, .128, 0], c: LEDc, m: 'e', pc: 0, ly: .2, side: 1 });
  [-1, 1].forEach(function (s) {
    part({ k: 'cyl', r: .085, L: .07, p: [s * .355, .085, -.12], c: '#14171C', m: 't', pc: 0, dec: 'hub' });
    part({ k: 'cyl', r: .1, L: .085, n: 10, a0: -.15, a1: Math.PI + .15, p: [s * .355, .085, -.12], c: WHc, m: 'g', pc: 0 });
    part({ k: 'sph', r: .045, p: [s * .22, .045, .2], c: '#2C333D', pc: 0 });
  });
  /* pieza 1: postes, tiras LED y panel trasero */
  [-1, 1].forEach(function (s) {
    part({ k: 'box', s: [.05, .69, .05], r: .02, p: [s * .255, .565, .2], c: WHc, m: 'g', pc: 1 });
    part({ k: 'box', s: [.008, .52, .016], p: [s * .281, .565, .2], c: LEDc, m: 'e', pc: 1, ly: 1, pf: [s, 0, 0] });
    part({ k: 'box', s: [.008, .52, .016], p: [s * .281, .575, -.17], c: LEDc, m: 'e', pc: 1, ly: 1, pf: [s, 0, 0] });
  });
  part({ k: 'box', s: [.56, .69, .12], r: .03, p: [0, .565, -.17], c: WHc, m: 'g', pc: 1 });
  /* piezas 2 y 3: charolas azul marino con luz */
  [[.4, 2], [.72, 3]].forEach(function (t) {
    part({ k: 'box', s: [.56, .026, .36], r: .012, p: [0, t[0], .06], c: DKc, m: 'm', pc: t[1] });
    part({ k: 'box', s: [.575, .008, .375], p: [0, t[0] - .016, .06], c: LEDc, m: 'e', pc: t[1], side: 1 });
  });
  /* piezas 4 a 7: cuello, cabeza, pantalla y luces */
  part({ k: 'box', s: [.56, .03, .5], r: .012, p: [0, .925, 0], c: DKc, m: 'm', pc: 4 });
  part({ k: 'box', s: [.56, .26, .26], r: .06, p: [0, 1.07, 0], c: WHc, m: 'g', pc: 5 });
  part({ k: 'box', s: [.46, .21, .03], r: .03, p: [0, 1.07, .13], c: VISc, m: 'v', pc: 6, ly: 1, pf: [0, 0, 1], dec: 'eyes' });
  [-1, 1].forEach(function (s) { part({ k: 'cyl', r: .058, L: .016, n: 20, p: [s * .283, 1.07, 0], c: DKc, m: 'm', pc: 7, ly: 1, pf: [s, 0, 0], dec: 'ring' }); });
  /* versión en cajas para el mini Jeeves del diorama */
  var BOXES = PARTS.filter(function (p) { return p.k !== 'sph' && !(p.k === 'cyl' && p.a1 != null) && p.m !== 'e'; }).map(function (p) { return [p.ext[0], p.ext[1], p.ext[2], p.p[0], p.p[1], p.p[2], p.c, p.ly]; })
    .concat([[.07, .09, .004, -.05, 1.075, .147, EYEc, 2], [.07, .09, .004, .05, 1.075, .147, EYEc, 2]]);
  var PTS = [], NP = 0;
  function buildCloud(n) {
    var area = PARTS.map(function (b) { var e = b.ext; return 2 * (e[0] * e[1] + e[0] * e[2] + e[1] * e[2]); });
    var tot = area.reduce(function (a, b) { return a + b; }, 0), i = 0, out = [];
    PARTS.forEach(function (pt, bi) {
      var b = pt.ext, k = Math.max(pt.m === 'e' ? 30 : 16, Math.round(n * area[bi] / tot)), col = pt.m === 'e' ? LEDc : pt.c === WHc ? '#EEF2F8' : '#5F7FD8';
      for (var j = 0; j < k; j++, i++) {
        var f = Math.floor(rnd(i * 3.1) * 6), a = rnd(i * 5.7) - .5, c = rnd(i * 9.3) - .5;
        var x = pt.p[0], y = pt.p[1], z = pt.p[2];
        if (f < 2) { x += a * b[0]; y += c * b[1]; z += (f ? .5 : -.5) * b[2]; }
        else if (f < 4) { x += (f === 2 ? .5 : -.5) * b[0]; y += a * b[1]; z += c * b[2]; }
        else { x += a * b[0]; y += (f === 4 ? .5 : -.5) * b[1]; z += c * b[2]; }
        var th = rnd(i * 1.3) * Math.PI * 2, ph = Math.acos(2 * rnd(i * 2.9) - 1), rad = 1.4 + 1.6 * rnd(i * 4.4);
        out.push({ b: bi, x: x, y: y - .62, z: z, c: col, sx: Math.sin(ph) * Math.cos(th) * rad, sy: Math.cos(ph) * rad * .8, sz: Math.sin(ph) * Math.sin(th) * rad, d: rnd(i * 7.7), tx: 0, ty: 0 });
      }
    });
    PTS = out; NP = out.length;
  }
  /* Posiciones para formar la palabra JEEVES. al final */
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
  function cloudScale() { return H > W ? Math.min(H * .6, W * .85) : Math.min(H * .68, W * .55); }

  /* ---------- Holograma: el modelo original se arma pieza por pieza ---------- */
  var PIECES = [0, 1, 2, 3, 4, 5, 6, 7];
  var PT0 = [.25, .62, 1.0, 1.3, 1.6, 1.92, 2.25, 2.52], PD = .55;
  var HEXC = {};
  function rgbOf(h) { if (!HEXC[h]) HEXC[h] = [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; return HEXC[h]; }
  function shade(h, k, a) { var c = rgbOf(h); return 'rgba(' + Math.min(255, Math.round(c[0] * k)) + ',' + Math.min(255, Math.round(c[1] * k)) + ',' + Math.min(255, Math.round(c[2] * k)) + ',' + (a == null ? 1 : a) + ')'; }
  function rgbS(c, k) { k = k || 1; return 'rgb(' + Math.max(0, Math.min(255, Math.round(c[0] * k))) + ',' + Math.max(0, Math.min(255, Math.round(c[1] * k))) + ',' + Math.max(0, Math.min(255, Math.round(c[2] * k))) + ')'; }
  function nrm(v) { var l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; }
  var PITCH = .3, KEY = nrm([.55, .8, -.6]), RIM = nrm([-.8, .3, .5]);
  /* cámara con giro, inclinación y orientación de mano derecha */
  function cam(x, y, z, rot) { var cr = Math.cos(rot), sr = Math.sin(rot), X = -(x * cr - z * sr), Z = x * sr + z * cr, cp = Math.cos(PITCH), sp = Math.sin(PITCH); return [X, y * cp + Z * sp, Z * cp - y * sp]; }
  function lit(col, m, n, C) {
    var c = rgbOf(col); if (m === 'e') return c;
    var V = nrm([-C[0], -C[1], -3.4 - C[2]]), d = Math.max(0, n[0] * KEY[0] + n[1] * KEY[1] + n[2] * KEY[2]);
    var Hh = nrm([KEY[0] + V[0], KEY[1] + V[1], KEY[2] + V[2]]), sp = Math.max(0, n[0] * Hh[0] + n[1] * Hh[1] + n[2] * Hh[2]);
    var rim = Math.max(0, n[0] * RIM[0] + n[1] * RIM[1] + n[2] * RIM[2]), up = Math.max(0, n[1]);
    var k = (m === 'g' ? .6 : m === 't' ? .45 : .5) + (m === 't' ? .35 : .5) * d;
    var ks = m === 'g' ? .5 * Math.pow(sp, 40) + .1 * Math.pow(sp, 6) : m === 'm' ? .3 * Math.pow(sp, 16) : m === 'v' ? .7 * Math.pow(sp, 70) : 0;
    var env = m === 'm' ? .2 * up + .07 : m === 'v' ? .1 * up + .03 : m === 'g' ? .04 * up : 0;
    return [c[0] * k + 255 * ks + 77 * env + 70 * rim * .3, c[1] * k + 255 * ks + 139 * env + 140 * rim * .3, c[2] * k + 255 * ks + 255 * env + 255 * rim * .32];
  }
  var rfx = document.createElement('canvas'), rg = rfx.getContext('2d');
  function shapePath(g, s) { g.beginPath(); g.moveTo(s[0][0], s[0][1]); for (var q = 1; q < s.length; q++) g.lineTo(s[q][0], s[q][1]); g.closePath(); }
  function faceMap(g, s, wmm, hmm) { var o = s[3]; g.save(); g.transform((s[0][0] - o[0]) / wmm, (s[0][1] - o[1]) / wmm, (s[2][0] - o[0]) / hmm, (s[2][1] - o[1]) / hmm, o[0], o[1]); }
  function inner(s, k) { var cxm = 0, cym = 0; s.forEach(function (p) { cxm += p[0] / s.length; cym += p[1] / s.length; }); return s.map(function (p) { return [cxm + (p[0] - cxm) * k, cym + (p[1] - cym) * k]; }); }
  function decorate(g, pt, fc, a, u) {
    var s = fc.s;
    if (pt.dec === 'logo' && fc.fc.key === 'z1') {
      faceMap(g, s, 550, 30); g.globalAlpha = a; g.fillStyle = '#0F172A'; g.font = '800 30px ' + FD; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText('JEEVES', 275, 13); g.restore(); g.globalAlpha = 1; g.textBaseline = 'alphabetic'; g.textAlign = 'left';
    } else if (pt.dec === 'eyes' && fc.fc.key === 'z1') {
      faceMap(g, s, 400, 150);
      var gl = g.createLinearGradient(0, 0, 400, 150); gl.addColorStop(0, 'rgba(255,255,255,0)'); gl.addColorStop(.3, 'rgba(255,255,255,0)'); gl.addColorStop(.37, 'rgba(255,255,255,.1)'); gl.addColorStop(.46, 'rgba(255,255,255,0)');
      g.globalAlpha = a; g.fillStyle = gl; g.fillRect(0, 0, 400, 150);
      var on = eo(seg(u, PT0[6] + PD + .05, PT0[6] + PD + .3));
      if (on > 0) {
        g.fillStyle = g.strokeStyle = EYEc; g.shadowColor = EYEc; g.shadowBlur = 14 * S; g.lineCap = 'round';
        var happy = u > 3.2, dx = happy ? 0 : 14 * Math.sin(Math.max(0, u - 2.9) * 5);
        [150, 250].forEach(function (x) {
          if (!happy) { var h = 90 * on; rr2(g, x + dx - 36, 69 - h / 2, 72, h, Math.min(32, h / 2)); g.fill(); }
          else { var hop = -9 * Math.abs(Math.sin((u - 3.2) * 6)); g.lineWidth = 15; g.beginPath(); g.arc(x, 92 + hop, 33, Math.PI, Math.PI * 2); g.stroke(); }
        });
        g.shadowBlur = 0;
      }
      g.restore(); g.globalAlpha = 1;
    } else if (pt.dec === 'hub' && fc.fc.main) {
      var c = lit(WHc, 'g', fc.n, fc.C); g.globalAlpha = a; g.fillStyle = rgbS(c); shapePath(g, inner(s, .61)); g.fill();
      g.fillStyle = '#0D1118'; shapePath(g, inner(s, .26)); g.fill(); g.globalAlpha = 1;
    } else if (pt.dec === 'ring' && fc.fc.main) {
      var ri = inner(s, .78), w = Math.hypot(s[0][0] - s[10][0], s[0][1] - s[10][1]);
      g.globalAlpha = a; g.strokeStyle = LEDc; g.lineWidth = Math.max(1, w * .13); g.shadowColor = LEDc; g.shadowBlur = 10 * S; shapePath(g, ri); g.stroke(); g.shadowBlur = 0; g.globalAlpha = 1;
    }
  }
  function rr2(g, x, y, w, h, r) { r = Math.max(0, Math.min(r, w / 2, h / 2)); g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  function renderBot(g, list, mir, rot, P, flash, u, simple) {
    var items = [];
    list.forEach(function (it) {
      var pt = it.pt, yo = pt.p[1] - .62 + it.drop;
      var tf = function (v) { var y = yo + v[1]; return cam(pt.p[0] + v[0], mir ? -1.24 - y : y, pt.p[2] + v[2], rot); };
      var ctr = tf([0, 0, 0]);
      if (pt.k === 'sph') { items.push({ z: ctr[2], sph: 1, pt: pt, c: ctr, it: it }); return; }
      var faces = [], pfOK = !pt.pf;
      for (var fi = 0; fi < pt.F.length; fi++) {
        var fc = pt.F[fi]; if (pt.side && Math.abs(fc.n[1]) > .9) continue;
        var n = cam(fc.n[0], mir ? -fc.n[1] : fc.n[1], fc.n[2], rot), vs = fc.v.map(tf), C = [0, 0, 0];
        for (var q = 0; q < vs.length; q++) { C[0] += vs[q][0] / vs.length; C[1] += vs[q][1] / vs.length; C[2] += vs[q][2] / vs.length; }
        if (n[0] * C[0] + n[1] * C[1] + n[2] * (C[2] + 3.4) >= 0) continue;
        if (pt.pf && fc.n[0] === pt.pf[0] && fc.n[1] === pt.pf[1] && fc.n[2] === pt.pf[2]) pfOK = true;
        faces.push({ n: n, C: C, s: vs.map(P), fc: fc });
      }
      if (pfOK && faces.length) items.push({ z: ctr[2] - pt.ly * .3, pt: pt, faces: faces, it: it });
    });
    items.sort(function (a, b) { return b.z - a.z; });
    g.lineJoin = 'round';
    items.forEach(function (item) {
      var it = item.it, pt = item.pt, a = it.fill;
      if (item.sph) {
        if (a <= 0) return; var p = P(item.c), r = pt.r * p[3];
        var sg = g.createRadialGradient(p[0] - r * .35, p[1] - r * .4, r * .1, p[0], p[1], r); sg.addColorStop(0, '#6B7686'); sg.addColorStop(1, '#14181F');
        g.globalAlpha = a; g.fillStyle = sg; g.beginPath(); g.arc(p[0], p[1], r, 0, 7); g.fill(); g.globalAlpha = 1; return;
      }
      item.faces.forEach(function (fc) {
        shapePath(g, fc.s);
        if (a > 0) {
          var c = lit(pt.c, pt.m, fc.n, fc.C), st;
          if (!simple && fc.fc.main && pt.m !== 'e' && pt.ext[1] > .05) {
            var y0 = Infinity, y1 = -Infinity; fc.s.forEach(function (p) { y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); });
            if (y1 - y0 > 2) { st = g.createLinearGradient(0, y0, 0, y1); st.addColorStop(0, rgbS(c, 1.06)); st.addColorStop(1, rgbS(c, .84)); } else st = rgbS(c);
          } else st = rgbS(c);
          g.globalAlpha = a; g.fillStyle = st; g.fill(); g.strokeStyle = st; g.lineWidth = .9; g.stroke();
          if (pt.m === 'e' && !simple) { g.shadowColor = LEDc; g.shadowBlur = 12 * S; g.fill(); g.shadowBlur = 0; }
        }
        if (!simple && fc.fc.main) {
          var ea = cl((1 - a) * .9 * it.k + .75 * flash);
          if (ea > .02) { g.globalAlpha = ea; g.strokeStyle = LEDc; g.lineWidth = Math.max(1, 1.1 * S); g.stroke(); }
        }
        g.globalAlpha = 1;
        if (!simple && a > .2 && pt.dec) decorate(g, pt, fc, a, u);
      });
    });
  }
  function holo(u) {
    var f = cloudScale() * (H > W ? .9 : .84), ox = W / 2, oy = H * (H > W ? .5 : .47), rot = Math.PI - .5 - 2.4 * (1 - eo(seg(u, 0, 3.3))) + u * .1;
    var P = function (p) { var k = 3.4 / (3.4 + p[2]); return [ox + p[0] * f * k, oy - p[1] * f * k, k, f * k]; };
    var flash = u > 3.2 ? 1 - eo(seg(u, 3.2, 3.9)) : 0, done = 0, i, list = [];
    for (i = 0; i < PT0.length; i++) if (u >= PT0[i] + PD) done++;
    PARTS.forEach(function (pt) {
      var st = PT0[pt.pc], k = seg(u, st, st + PD); if (k <= 0) return;
      list.push({ pt: pt, k: k, drop: (1 - eo(k)) * .5, fill: eo(seg(u, st + PD * .3, st + PD + .2)) });
    });
    /* base luminosa y anillos */
    var gp = P(cam(0, -.62, 0, rot)), gr = f * .55;
    cx.save(); cx.translate(gp[0], gp[1]); cx.scale(1, .3);
    var gg = cx.createRadialGradient(0, 0, 0, 0, 0, gr); gg.addColorStop(0, 'rgba(69,237,209,' + (.3 + .4 * flash) + ')'); gg.addColorStop(1, 'rgba(69,237,209,0)');
    cx.fillStyle = gg; cx.beginPath(); cx.arc(0, 0, gr, 0, 7); cx.fill();
    cx.strokeStyle = 'rgba(69,237,209,.18)'; cx.lineWidth = 1.5 * S; for (var r2 = 1; r2 <= 3; r2++) { cx.beginPath(); cx.arc(0, 0, gr * (.45 + r2 * .32 + .05 * Math.sin(u * 3 + r2)), 0, 7); cx.stroke(); }
    cx.restore();
    /* reflejo en el piso brillante */
    if (rfx.width !== W || rfx.height !== H) { rfx.width = W; rfx.height = H; }
    rg.setTransform(1, 0, 0, 1, 0, 0); rg.globalCompositeOperation = 'source-over'; rg.clearRect(0, 0, W, H);
    renderBot(rg, list, true, rot, P, 0, u, true);
    rg.globalCompositeOperation = 'destination-in';
    var mg = rg.createLinearGradient(0, gp[1], 0, gp[1] + f * .5); mg.addColorStop(0, 'rgba(0,0,0,.3)'); mg.addColorStop(1, 'rgba(0,0,0,0)');
    rg.fillStyle = mg; rg.fillRect(0, 0, W, H); rg.globalCompositeOperation = 'source-over';
    cx.drawImage(rfx, 0, 0);
    /* sombra de contacto */
    cx.save(); cx.translate(gp[0], gp[1]); cx.scale(1, .28);
    var cs = cx.createRadialGradient(0, 0, 0, 0, 0, f * .4); cs.addColorStop(0, 'rgba(0,0,0,' + .55 * eo(seg(u, PT0[0], PT0[0] + PD)) + ')'); cs.addColorStop(1, 'rgba(0,0,0,0)');
    cx.fillStyle = cs; cx.beginPath(); cx.arc(0, 0, f * .4, 0, 7); cx.fill(); cx.restore();
    renderBot(cx, list, false, rot, P, flash, u, false);
    /* partículas que vuelan a su pieza y se funden en ella */
    for (i = 0; i < NP; i++) {
      var p = PTS[i], s0 = PT0[PARTS[p.b].pc], kk = eio(seg(u, s0 - .5 + p.d * .2, s0 + .3 + p.d * .2));
      var fade = 1 - eo(seg(u, s0 + .35, s0 + PD + .25)); if (fade <= 0) continue;
      var orb = (1 - kk) * (u * .9 + p.d * 6);
      var x = p.sx * Math.cos(orb) - p.sz * Math.sin(orb), z = p.sx * Math.sin(orb) + p.sz * Math.cos(orb);
      var q2 = P(cam(x + (p.x - x) * kk, p.sy + (p.y - p.sy) * kk, z + (p.z - z) * kk, rot)), s = Math.max(1.2, 2.4 * S * q2[2]);
      cx.globalAlpha = fade * (.3 + .7 * kk) * (.55 + .45 * q2[2]); cx.fillStyle = kk > .6 ? p.c : (i % 3 ? MINT : '#9FB8FF');
      cx.fillRect(q2[0] - s / 2, q2[1] - s / 2, s, s);
    }
    cx.globalAlpha = 1;
    return done;
  }

  /* ---------- Diorama isométrico de la escena RUTA ---------- */
  var RT = { cw: 0, ox: 0, oy: 0 };
  function iso(i, j, z) { return [RT.ox + (i - j) * RT.cw / 2, RT.oy + (i + j) * RT.cw / 4 - z * RT.cw * .62]; }
  function poly(pts) { cx.beginPath(); cx.moveTo(pts[0][0], pts[0][1]); for (var n = 1; n < pts.length; n++) cx.lineTo(pts[n][0], pts[n][1]); cx.closePath(); }
  /* caja con base centrada en (ci,cj); ang gira el eje del ancho */
  function ibox(ci, cj, w, d, z0, h, col, ang, hl) {
    var ca = Math.cos(ang || 0), sa = Math.sin(ang || 0), hw = w / 2, hd = d / 2;
    var F = [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd]].map(function (q) { return [ci + q[0] * ca - q[1] * sa, cj + q[0] * sa + q[1] * ca]; });
    var vis = [];
    for (var e = 0; e < 4; e++) {
      var p0 = F[e], p1 = F[(e + 1) % 4], ni = p1[1] - p0[1], nj = -(p1[0] - p0[0]), L = Math.hypot(ni, nj) || 1; ni /= L; nj /= L;
      if (ni + nj <= 1e-3) continue; vis.push(e);
      var k = .84 + .08 * (nj - ni), A = iso(p0[0], p0[1], z0 + h), B = iso(p1[0], p1[1], z0 + h), C = iso(p1[0], p1[1], z0), D = iso(p0[0], p0[1], z0);
      if (h * RT.cw > 3) { var g = cx.createLinearGradient(0, Math.min(A[1], B[1]), 0, Math.max(C[1], D[1])); g.addColorStop(0, shade(col, k)); g.addColorStop(1, shade(col, k * .86)); cx.fillStyle = g; }
      else cx.fillStyle = shade(col, k);
      poly([A, B, C, D]); cx.fill();
    }
    var T = F.map(function (q) { return iso(q[0], q[1], z0 + h); });
    cx.fillStyle = shade(col, 1.05); poly(T); cx.fill();
    cx.strokeStyle = 'rgba(255,255,255,' + (hl == null ? .55 : hl) + ')'; cx.lineWidth = Math.max(.6, .8 * S); cx.beginPath();
    vis.forEach(function (e) { cx.moveTo(T[e][0], T[e][1]); cx.lineTo(T[(e + 1) % 4][0], T[(e + 1) % 4][1]); }); cx.stroke();
  }
  function softShadow(ci, cj, r, a) {
    var p = iso(ci + r * .22, cj - r * .02, 0), R = r * RT.cw * .85;
    cx.save(); cx.translate(p[0], p[1]); cx.scale(1, .5);
    var g = cx.createRadialGradient(0, 0, 0, 0, 0, R); g.addColorStop(0, 'rgba(15,23,42,' + a + ')'); g.addColorStop(.55, 'rgba(15,23,42,' + a * .45 + ')'); g.addColorStop(1, 'rgba(15,23,42,0)');
    cx.fillStyle = g; cx.beginPath(); cx.arc(0, 0, R, 0, 7); cx.fill(); cx.restore();
  }
  var RPATH = (function () {
    var p = [[1.2, 2.0], [5, 2.0], [5, 5.55], [6.8, 5.55]], n;
    for (var it = 0; it < 4; it++) { var q = [p[0]]; for (n = 0; n < p.length - 1; n++) { var a = p[n], b = p[n + 1]; q.push([a[0] * .75 + b[0] * .25, a[1] * .75 + b[1] * .25], [a[0] * .25 + b[0] * .75, a[1] * .25 + b[1] * .75]); } q.push(p[p.length - 1]); p = q; }
    var L = [0]; for (n = 1; n < p.length; n++) L.push(L[n - 1] + Math.hypot(p[n][0] - p[n - 1][0], p[n][1] - p[n - 1][1]));
    return { p: p, L: L };
  })();
  function along(s) {
    var P = RPATH.p, L = RPATH.L, d = s * L[L.length - 1], n = 1; while (n < L.length - 1 && L[n] < d) n++;
    var a = P[n - 1], b = P[n], f = cl((d - L[n - 1]) / ((L[n] - L[n - 1]) || 1));
    return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, Math.atan2(b[1] - a[1], b[0] - a[0]), n];
  }
  var RB = 1.4; /* escala del robot en el diorama */
  function miniJeeves(ri, rj, ang, z0) {
    var fi = Math.cos(ang), fj = Math.sin(ang), li = fj, lj = -fi, list = [];
    BOXES.forEach(function (b) {
      var ci = ri + (b[3] * li + b[5] * fi) * RB, cj = rj + (b[3] * lj + b[5] * fj) * RB;
      list.push({ k: (ci + cj) * 10 + b[4] + (b[7] || 0) * .3, f: function () { ibox(ci, cj, b[0] * RB, b[2] * RB, z0 + (b[4] - b[1] / 2) * RB, b[1] * RB, b[6], ang - Math.PI / 2, b[6] === WHc ? .7 : .2); } });
    });
    list.sort(function (a, b) { return a.k - b.k; }).forEach(function (o) { o.f(); });
  }
  function leaf(ci, cj, z) {
    var base = iso(ci, cj, z), r = RT.cw * .2;
    [[-.1, .1, '#2F7A5A', 1], [.12, .08, '#2F7A5A', .95], [0, .28, '#3F9A70', .9], [-.16, .22, '#4BAA7C', .7], [.15, .25, '#5BB98A', .7], [0, .1, '#5BB98A', .6]].forEach(function (l) {
      var x = base[0] + l[0] * RT.cw, y = base[1] - l[1] * RT.cw, g = cx.createRadialGradient(x - r * .3, y - r * .4, r * .1, x, y, r * l[3]);
      g.addColorStop(0, shade(l[2], 1.35)); g.addColorStop(1, l[2]); cx.fillStyle = g; cx.beginPath(); cx.arc(x, y, r * l[3], 0, 7); cx.fill();
    });
  }

  /* ---------- Escenas (120 BPM: cada corte cae en un tiempo) ---------- */
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
      var N = 10, port = H > W;
      RT.cw = Math.min(W * (port ? 1.0 : .84) / N, H * (port ? .7 : .74) / 6.2) * (1 + .04 * eo(seg(u, 0, 3.5)));
      RT.ox = W / 2; RT.oy = H * (port ? .45 : .47) - 2.13 * RT.cw;
      var drop = function (d) { var k = eo(seg(u, d, d + .38)); return [(1 - k) * 2.4, k]; };
      /* sombra y losa */
      var sp = iso(5.6, 5.6, -.3), SR = RT.cw * 6.4;
      cx.save(); cx.translate(sp[0], sp[1] + RT.cw * .15); cx.scale(1, .5);
      var sg = cx.createRadialGradient(0, 0, SR * .2, 0, 0, SR); sg.addColorStop(0, 'rgba(15,23,42,.22)'); sg.addColorStop(1, 'rgba(15,23,42,0)'); cx.fillStyle = sg; cx.beginPath(); cx.arc(0, 0, SR, 0, 7); cx.fill(); cx.restore();
      ibox(5, 5, 10, 10, -.3, .3, '#E4E8EF', 0, .9);
      var fg = cx.createLinearGradient(iso(0, 0, 0)[0], iso(0, 0, 0)[1], iso(10, 10, 0)[0], iso(10, 10, 0)[1]); fg.addColorStop(0, '#FDFDFE'); fg.addColorStop(1, '#EDF0F5');
      cx.fillStyle = fg; poly([iso(0, 0, 0), iso(10, 0, 0), iso(10, 10, 0), iso(0, 10, 0)]); cx.fill();
      cx.strokeStyle = 'rgba(15,23,42,.05)'; cx.lineWidth = 1; cx.beginPath();
      for (var g = 1; g < N; g++) { var a1 = iso(g, 0, 0), a2 = iso(g, 10, 0), b1 = iso(0, g, 0), b2 = iso(10, g, 0); cx.moveTo(a1[0], a1[1]); cx.lineTo(a2[0], a2[1]); cx.moveTo(b1[0], b1[1]); cx.lineTo(b2[0], b2[1]); }
      cx.stroke();
      /* paredes con ventana y menú */
      var wk = eo(seg(u, 0, .4)), wh = 1.5 * wk;
      if (wh > .02) {
        ibox(5, .09, 10, .18, 0, wh, '#FFFFFF', 0, .9); ibox(.09, 5, .18, 10, 0, wh, '#FFFFFF', 0, .9);
        cx.globalAlpha = wk;
        var wn = [iso(5.6, .18, .5), iso(8.8, .18, .5), iso(8.8, .18, 1.2), iso(5.6, .18, 1.2)], wg = cx.createLinearGradient(0, wn[2][1], 0, wn[0][1]);
        wg.addColorStop(0, '#BFD6F2'); wg.addColorStop(1, '#EAF2FB'); cx.fillStyle = wg; poly(wn); cx.fill();
        cx.strokeStyle = '#FFFFFF'; cx.lineWidth = 2 * S; cx.stroke();
        cx.beginPath(); [6.67, 7.73].forEach(function (m) { var t1 = iso(m, .18, .5), t2 = iso(m, .18, 1.2); cx.moveTo(t1[0], t1[1]); cx.lineTo(t2[0], t2[1]); }); cx.stroke();
        cx.fillStyle = 'rgba(255,255,255,.35)'; poly([iso(5.9, .18, .55), iso(6.3, .18, .55), iso(6.9, .18, 1.15), iso(6.5, .18, 1.15)]); cx.fill();
        cx.fillStyle = '#0F172A'; poly([iso(.18, 3.4, .62), iso(.18, 5.0, .62), iso(.18, 5.0, 1.22), iso(.18, 3.4, 1.22)]); cx.fill();
        cx.strokeStyle = MINT; cx.lineWidth = 1.4 * S; cx.beginPath();
        [.82, .95, 1.08].forEach(function (z, n) { var t1 = iso(.18, 3.65, z), t2 = iso(.18, 4.75 - n * .25, z); cx.moveTo(t1[0], t1[1]); cx.lineTo(t2[0], t2[1]); }); cx.stroke();
        cx.strokeStyle = 'rgba(15,23,42,.08)'; cx.lineWidth = 1.5 * S; cx.beginPath();
        var q1 = iso(10, .18, .08), q2 = iso(.18, .18, .08), q3 = iso(.18, 10, .08); cx.moveTo(q1[0], q1[1]); cx.lineTo(q2[0], q2[1]); cx.lineTo(q3[0], q3[1]); cx.stroke();
        cx.globalAlpha = 1;
      }
      /* fondo: cocina, base de carga y plantas junto a la pared */
      var d1 = drop(.12);
      cx.globalAlpha = d1[1]; softShadow(4.3, .7, 1.6, .16);
      ibox(4.3, .55, 3.4, .74, d1[0], .9, '#EDEFF3'); ibox(4.3, .56, 3.5, .8, .9 + d1[0], .05, '#1E2638', 0, .3); ibox(4.3, .935, 3.2, .02, .4 + d1[0], .035, '#45EDD1', 0, 0);
      [[3.4, .5], [4.1, .55], [5.2, .5]].forEach(function (pl) { var c = iso(pl[0], pl[1], .955 + d1[0]); cx.fillStyle = '#FFFFFF'; cx.beginPath(); cx.ellipse(c[0], c[1], RT.cw * .17, RT.cw * .085, 0, 0, 7); cx.fill(); cx.fillStyle = '#E5A15A'; cx.beginPath(); cx.ellipse(c[0], c[1] - RT.cw * .02, RT.cw * .09, RT.cw * .045, 0, 0, 7); cx.fill(); });
      var d2 = drop(.22); cx.globalAlpha = d2[1];
      softShadow(1.2, 1.35, .5, .2); ibox(1.2, 1.3, .7, .32, d2[0], .62, '#F4F6FA'); ibox(1.2, 1.47, .34, .02, .32 + d2[0], .14, '#45EDD1', 0, 0);
      [[9.3, .75, .3], [.75, 9.3, .4]].forEach(function (pl) { var dd = drop(pl[2]); cx.globalAlpha = dd[1]; softShadow(pl[0], pl[1], .35, .2); ibox(pl[0], pl[1], .38, .38, dd[0], .42, '#E9E4DC'); leaf(pl[0], pl[1], .5 + dd[0]); });
      cx.globalAlpha = 1;
      /* almohadilla de carga y ruta */
      var s = eio(seg(u, .9, 2.85)), R = along(s), arrived = u > 2.85, pulse = .5 + .5 * Math.sin(u * 7);
      var pad = iso(1.2, 2.0, 0); cx.save(); cx.translate(pad[0], pad[1]); cx.scale(1, .5);
      var pg = cx.createRadialGradient(0, 0, 0, 0, 0, RT.cw * .7); pg.addColorStop(0, 'rgba(69,237,209,' + (.35 + .2 * pulse) * eo(seg(u, .3, .7)) + ')'); pg.addColorStop(1, 'rgba(69,237,209,0)');
      cx.fillStyle = pg; cx.beginPath(); cx.arc(0, 0, RT.cw * .7, 0, 7); cx.fill(); cx.restore();
      var P = RPATH.p, pa = eo(seg(u, .5, .9));
      cx.lineCap = 'round'; cx.lineJoin = 'round';
      cx.setLineDash([4 * S, 6 * S]); cx.strokeStyle = 'rgba(15,23,42,' + .25 * pa + ')'; cx.lineWidth = 1.6 * S; cx.beginPath();
      P.forEach(function (pt, n) { var q = iso(pt[0], pt[1], .01); if (n) cx.lineTo(q[0], q[1]); else cx.moveTo(q[0], q[1]); }); cx.stroke(); cx.setLineDash([]);
      if (s > 0) {
        cx.shadowColor = 'rgba(69,237,209,.8)'; cx.shadowBlur = 12 * S; cx.strokeStyle = MINT; cx.lineWidth = 4 * S; cx.beginPath();
        for (var n = 0; n < R[3]; n++) { var q = iso(P[n][0], P[n][1], .01); if (n) cx.lineTo(q[0], q[1]); else cx.moveTo(q[0], q[1]); }
        var qe = iso(R[0], R[1], .01); cx.lineTo(qe[0], qe[1]); cx.stroke(); cx.shadowBlur = 0;
      }
      if (arrived) {
        var rk = seg(u, 2.85, 3.5), rp = iso(R[0], R[1], 0);
        cx.save(); cx.translate(rp[0], rp[1]); cx.scale(1, .5); cx.strokeStyle = 'rgba(69,237,209,' + (1 - rk) + ')'; cx.lineWidth = 3 * S;
        cx.beginPath(); cx.arc(0, 0, RT.cw * (.4 + 1.2 * eo(rk)), 0, 7); cx.stroke(); cx.restore();
      }
      /* objetos ordenados por profundidad */
      var objs = [], T4 = [6.8, 7.0];
      [[3.2, 3.4], [3.2, 7.0], [6.8, 3.4], T4].forEach(function (t, ti) {
        var dd = drop(.18 + (t[0] + t[1]) * .022), dest = ti === 3;
        objs.push({ b: [t[0] - .55, t[0] + .55, t[1] - .55, t[1] + .55], f: function () {
          cx.globalAlpha = dd[1]; softShadow(t[0], t[1], .75, .22);
          ibox(t[0], t[1], .12, .12, dd[0], .72, '#2A3245', 0, .2); ibox(t[0], t[1], .5, .5, dd[0], .03, '#2A3245', 0, .2);
          ibox(t[0], t[1], 1.1, 1.1, .72 + dd[0], .06, '#D9B48C', 0, .7);
          var plates = dest ? (arrived ? [[0, 0]] : []) : [[-.22, .2], [.22, -.2]];
          plates.forEach(function (pl) { var c = iso(t[0] + pl[0], t[1] + pl[1], .785 + dd[0]); cx.fillStyle = 'rgba(15,23,42,.12)'; cx.beginPath(); cx.ellipse(c[0] + 1.5 * S, c[1] + 1.5 * S, RT.cw * .19, RT.cw * .095, 0, 0, 7); cx.fill(); cx.fillStyle = '#FFFFFF'; cx.beginPath(); cx.ellipse(c[0], c[1], RT.cw * .19, RT.cw * .095, 0, 0, 7); cx.fill(); cx.fillStyle = dest ? '#E5A15A' : '#EEF1F5'; cx.beginPath(); cx.ellipse(c[0], c[1], RT.cw * .11, RT.cw * .055, 0, 0, 7); cx.fill(); });
          cx.globalAlpha = 1;
        } });
        [-1, 1].forEach(function (sd) {
          var ci = t[0] + sd * .9, cj = t[1], de = drop(.2 + (ci + cj) * .022);
          objs.push({ b: [ci - .25, ci + .25, cj - .25, cj + .25], f: function () {
            cx.globalAlpha = de[1]; softShadow(ci, cj, .38, .2);
            if (sd > 0) { ibox(ci, cj, .44, .44, de[0], .45, '#E3E7EE'); ibox(ci + .19, cj, .06, .44, .45 + de[0], .45, '#E3E7EE'); }
            else { ibox(ci - .19, cj, .06, .44, .45 + de[0], .45, '#E3E7EE'); ibox(ci, cj, .44, .44, de[0], .45, '#E3E7EE'); }
            cx.globalAlpha = 1;
          } });
        });
      });
      var dp = drop(.5);
      objs.push({ b: [9.0, 9.4, 9.0, 9.4], f: function () { cx.globalAlpha = dp[1]; softShadow(9.2, 9.2, .35, .2); ibox(9.2, 9.2, .38, .38, dp[0], .42, '#E9E4DC'); leaf(9.2, 9.2, .5 + dp[0]); cx.globalAlpha = 1; } });
      var dr = drop(.5);
      objs.push({ b: [R[0] - .42, R[0] + .42, R[1] - .42, R[1] + .42], f: function () { cx.globalAlpha = dr[1]; softShadow(R[0], R[1], .5, .28); miniJeeves(R[0], R[1], R[2], dr[0]); cx.globalAlpha = 1; } });
      var before = function (a, b) { if (a.b[1] <= b.b[0] || a.b[3] <= b.b[2]) return -1; if (b.b[1] <= a.b[0] || b.b[3] <= a.b[2]) return 1; return (a.b[0] + a.b[1] + a.b[2] + a.b[3]) - (b.b[0] + b.b[1] + b.b[2] + b.b[3]); };
      for (var x = 1; x < objs.length; x++) { var o = objs[x], y = x - 1; while (y >= 0 && before(objs[y], o) > 0) { objs[y + 1] = objs[y]; y--; } objs[y + 1] = o; }
      objs.forEach(function (o) { o.f(); });
      /* marcador de la mesa */
      var mk = eo(seg(u, .6, 1.0)); if (mk > 0) {
        var bob = Math.sin(u * 4) * .06, mp = iso(T4[0], T4[1], 1.55 + bob + (1 - mk) * .6), mr = RT.cw * .22;
        cx.globalAlpha = mk; cx.strokeStyle = 'rgba(15,23,42,.18)'; cx.lineWidth = 1.2 * S; cx.setLineDash([2 * S, 3 * S]); cx.beginPath();
        var mb = iso(T4[0], T4[1], .82); cx.moveTo(mp[0], mp[1] + mr); cx.lineTo(mb[0], mb[1]); cx.stroke(); cx.setLineDash([]);
        cx.shadowColor = 'rgba(15,23,42,.25)'; cx.shadowBlur = 10 * S; cx.shadowOffsetY = 3 * S;
        cx.fillStyle = arrived ? MINT : '#0F172A'; cx.beginPath(); cx.arc(mp[0], mp[1], mr, 0, 7); cx.fill();
        cx.shadowBlur = 0; cx.shadowOffsetY = 0;
        if (arrived) { var ck = eo(seg(u, 2.85, 3.15)); cx.strokeStyle = '#0F172A'; cx.lineWidth = 2.4 * S; cx.beginPath(); cx.moveTo(mp[0] - mr * .4, mp[1]); cx.lineTo(mp[0] - mr * .4 + mr * .3 * Math.min(1, ck * 2), mp[1] + mr * .3 * Math.min(1, ck * 2)); if (ck > .5) cx.lineTo(mp[0] - mr * .1 + mr * .55 * (ck - .5) * 2, mp[1] + mr * .3 - mr * .65 * (ck - .5) * 2); cx.stroke(); }
        else { font('700', mr * 1.05, FT); cx.fillStyle = MINT; cx.textAlign = 'center'; cx.fillText('4', mp[0], mp[1] + mr * .37); cx.textAlign = 'left'; }
        cx.globalAlpha = 1;
      }
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
      if (port) px = Math.min(px, W * (st === 2 ? .3 : .62));
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
      var f = cloudScale(), ox = W / 2, oy = H * .5, tw = Math.min(W * .82, H * 1.9), rot = -.5 + u * .9;
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
    } }
  ];
  var DUR = 0; SC.forEach(function (s) { s.a = DUR; DUR += s.d; });
  var HITS = [];
  SC.forEach(function (s) { (s.hit || [0]).forEach(function (h) { HITS.push(s.a + h); }); });

  /* ---------- Postproducción: grano, viñeta, franjas, temblor y choque de color ---------- */
  var grain = document.createElement('canvas'); grain.width = grain.height = 192;
  (function () { var g = grain.getContext('2d'), im = g.createImageData(192, 192); for (var i = 0; i < im.data.length; i += 4) { var v = Math.random() * 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; } g.putImageData(im, 0, 0); })();
  var buf = document.createElement('canvas'), bx = buf.getContext('2d');
  function shakeAmt(t) { var a = 0; HITS.forEach(function (h) { var d = t - h; if (d >= 0 && d < .6) a += Math.exp(-d * 9); }); return Math.min(1.4, a); }
  function bars(t) { var o = 1 - eo(seg(t, 1.6, 2.1)), w = SC[9].a, inW = eo(seg(t, w, w + .4)) * (1 - eo(seg(t, SC[10].a + .05, SC[10].a + .5))); return Math.max(o, inW); }

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
    var i = 0; while (i < SC.length - 1 && t >= SC[i + 1].a) i++;
    var s = SC[i], u = t - s.a, sh = reduce ? 0 : shakeAmt(t);
    cx.setTransform(1, 0, 0, 1, 0, 0); cx.textAlign = 'left'; cx.globalAlpha = 1; cx.shadowBlur = 0; cx.globalCompositeOperation = 'source-over';
    var punch = 1 + .05 * (1 - eo(seg(u, 0, .35)));
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
    var bh = H * .11 * bars(t); if (bh > .5) { cx.fillStyle = '#000'; cx.fillRect(0, 0, W, bh); cx.fillRect(0, H - bh, W, bh); }
    hud(i, t, s.dark);
    if (u < .05 && i > 0) { cx.fillStyle = s.dark ? 'rgba(244,246,250,.45)' : 'rgba(5,7,12,.35)'; cx.fillRect(0, 0, W, H); }
    var on = t > SC[10].a + 3.0; if (on !== ctaOn) { ctaOn = on; box.classList.toggle('cta-on', on); cta.tabIndex = on ? 0 : -1; cta.setAttribute('aria-hidden', String(!on)); }
  }
  var ctaOn = null;

  /* ---------- Sonido sintetizado (opcional, al ritmo de 120 BPM) ---------- */
  var ac = null, master = null, noiseBuf = null, soundOn = false;
  function initAudio() {
    var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
    ac = new AC(); var comp = ac.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4;
    master = ac.createGain(); master.gain.value = .75; master.connect(comp); comp.connect(ac.destination);
    noiseBuf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate); var d = noiseBuf.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return true;
  }
  function env(g, t0, peak, a, dcy) { g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(peak, t0 + a); g.gain.exponentialRampToValueAtTime(0.0001, t0 + a + dcy); }
  function kick(t0, big) {
    var o = ac.createOscillator(), g = ac.createGain(); o.type = 'sine';
    o.frequency.setValueAtTime(big ? 120 : 150, t0); o.frequency.exponentialRampToValueAtTime(big ? 32 : 45, t0 + (big ? .5 : .14));
    env(g, t0, big ? 1 : .8, .004, big ? 1.1 : .32); o.connect(g); g.connect(master); o.start(t0); o.stop(t0 + 1.3);
  }
  function noise(t0, type, freq, q, peak, dcy) {
    var s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(); s.buffer = noiseBuf;
    f.type = type; f.frequency.value = freq; f.Q.value = q || 1; env(g, t0, peak, .003, dcy);
    s.connect(f); f.connect(g); g.connect(master); s.start(t0); s.stop(t0 + dcy + .1);
  }
  function impact(t0) { kick(t0, true); noise(t0, 'lowpass', 500, .7, .9, 1.4); noise(t0, 'highpass', 3000, .7, .25, .25); }
  function riser(t0, dur) {
    var s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(); s.buffer = noiseBuf; s.loop = true;
    f.type = 'bandpass'; f.Q.value = 6; f.frequency.setValueAtTime(300, t0); f.frequency.exponentialRampToValueAtTime(7000, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(.45, t0 + dur); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur + .05);
    s.connect(f); f.connect(g); g.connect(master); s.start(t0); s.stop(t0 + dur + .1);
  }
  function blip(t0, fr) { var o = ac.createOscillator(), g = ac.createGain(); o.type = 'triangle'; o.frequency.value = fr; env(g, t0, .18, .005, .18); o.connect(g); g.connect(master); o.start(t0); o.stop(t0 + .3); }
  /* Partitura: [tiempo, sonido] */
  var SCORE = [];
  (function () {
    var A = SC.map(function (s) { return s.a; });
    SCORE.push([0, 'riser2']);
    for (var b = 0; b < 6; b++) SCORE.push([A[1] + b * .25, b === 0 ? 'impact' : 'kickbig']);
    for (var t = A[2]; t < A[9] - .01; t += .5) { SCORE.push([t, 'kick']); if (t >= A[3]) SCORE.push([t + .25, 'hat']); if (Math.round((t - A[2]) / .5) % 2 === 1) SCORE.push([t, 'clap']); }
    SCORE.push([A[4] + 3.2, 'impact']); PT0.forEach(function (p0, n) { SCORE.push([A[4] + p0 + PD * .8, 'tick' + n]); });
    SCORE.push([A[6] + 2.85, 'blip1.5']);
    [0, .75, 1.5].forEach(function (h) { SCORE.push([A[7] + h, 'blip' + h]); });
    SCORE.push([A[9], 'riser1']); SCORE.push([A[10], 'impact']); SCORE.push([A[10] + 2.4, 'impact']);
  })();
  function play(name, t0) {
    if (name === 'kick') kick(t0); else if (name === 'kickbig') { kick(t0); noise(t0, 'highpass', 2500, 1, .2, .12); }
    else if (name === 'hat') noise(t0, 'highpass', 7500, 1, .12, .05);
    else if (name === 'clap') noise(t0, 'bandpass', 1600, 1.2, .35, .14);
    else if (name === 'impact') impact(t0);
    else if (name === 'riser1') riser(t0, 1.45); else if (name === 'riser2') riser(t0, 1.95);
    else if (name.indexOf('tick') === 0) { noise(t0, 'highpass', 4200, 2, .22, .04); blip(t0, 440 * Math.pow(2, (+name.slice(4)) / 7)); }
    else if (name.indexOf('blip') === 0) blip(t0, [880, 1175, 1568][[0, .75, 1.5].indexOf(+name.slice(4))] || 880);
  }
  function audioStep(t0, t1) {
    if (!soundOn || !ac) return;
    var now = ac.currentTime + .03;
    SCORE.forEach(function (e) { if (e[0] > t0 && e[0] <= t1) play(e[1], now); });
  }
  sbtn.addEventListener('click', function () {
    if (!ac && !initAudio()) return;
    soundOn = !soundOn; if (soundOn && ac.state === 'suspended') ac.resume();
    sbtn.setAttribute('aria-pressed', String(soundOn)); sbtn.setAttribute('aria-label', soundOn ? 'Silenciar el reel' : 'Activar sonido del reel');
    sbtn.querySelector('span').textContent = soundOn ? 'Sonido' : 'Activar sonido';
    if (soundOn && !want) { want = true; sync(); }
    if (soundOn) { t = 0; prevT = -1; }
  });

  /* ---------- Reproducción ---------- */
  function size() {
    var r = cv.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 2);
    if (!r.width) return;
    cv.width = Math.round(r.width * d); cv.height = Math.round(r.height * d);
    W = cv.width; H = cv.height; S = Math.max(.6, Math.min(W, H * 1.6) / 1100);
    buildCloud(W < 900 ? 2300 : 3600); textReady = 0;
    render(t);
  }
  var t = reduce ? SC[10].a + 4 : 0, prevT = -1, playing = false, want = !reduce, vis = false, last = 0, raf = 0;
  function frame(now) {
    var dt = Math.min((now - last) / 1000, .1); last = now; t += dt;
    if (t >= DUR) { t = 0; prevT = -1; }
    audioStep(prevT, t); prevT = t;
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
  window.JeevesReel = { seek: function (x) { t = x; prevT = x; render(t); }, dur: DUR, scenes: SC.map(function (s) { return [s.n, s.a]; }) };
})();
