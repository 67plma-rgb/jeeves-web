/* Jeeves Robotics · arte compartido: el robot original (jeeves3d.js) y el diorama isométrico, en canvas 2D */
(function () {
  'use strict';
  var cl = function (x) { return x < 0 ? 0 : x > 1 ? 1 : x; };
  var eo = function (x) { x = cl(x); return 1 - Math.pow(1 - x, 4); };
  var eio = function (x) { x = cl(x); return x < .5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2; };
  var seg = function (u, a, b) { return cl((u - a) / (b - a)); };
  function rnd(n) { var x = Math.sin(n * 127.1 + 1.7) * 43758.5453; return x - Math.floor(x); }
  var MINT = '#45EDD1', FD = '"Inter Tight","Inter Display",Inter,system-ui,sans-serif', FT = 'Inter,system-ui,sans-serif';

  function create(cv) {
    var cx = cv.getContext('2d'), W = 0, H = 0, S = 1;
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
    function holo(u, rotOv) {
      var f = cloudScale() * (H > W ? .9 : .84), ox = W / 2, oy = H * (H > W ? .5 : .47), rot = rotOv != null ? rotOv : Math.PI - .5 - 2.4 * (1 - eo(seg(u, 0, 3.3))) + u * .1;
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

    /* ---------- Rutas: suavizado y posición a lo largo ---------- */
    function makePath(pts) {
      var p = pts.slice(), n;
      for (var it = 0; it < 4; it++) { var q = [p[0]]; for (n = 0; n < p.length - 1; n++) { var a = p[n], b = p[n + 1]; q.push([a[0] * .75 + b[0] * .25, a[1] * .75 + b[1] * .25], [a[0] * .25 + b[0] * .75, a[1] * .25 + b[1] * .75]); } q.push(p[p.length - 1]); p = q; }
      var L = [0]; for (n = 1; n < p.length; n++) L.push(L[n - 1] + Math.hypot(p[n][0] - p[n - 1][0], p[n][1] - p[n - 1][1]));
      return { p: p, L: L, tot: L[L.length - 1] };
    }
    function along(path, s) {
      var P = path.p, L = path.L, d = cl(s) * path.tot, n = 1; while (n < L.length - 1 && L[n] < d) n++;
      var a = P[n - 1], b = P[n], f = cl((d - L[n - 1]) / ((L[n] - L[n - 1]) || 1));
      return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, Math.atan2(b[1] - a[1], b[0] - a[0]), n];
    }
    function stopAt(path, pt) { var best = 0, bd = 1e9; path.p.forEach(function (q, n) { var d = Math.hypot(q[0] - pt[0], q[1] - pt[1]); if (d < bd) { bd = d; best = n; } }); return path.L[best] / path.tot; }

    /* ---------- Piezas del diorama ---------- */
    function plate(ci, cj, z, food) {
      var c = iso(ci, cj, z); cx.fillStyle = 'rgba(15,23,42,.12)'; cx.beginPath(); cx.ellipse(c[0] + 1.5 * S, c[1] + 1.5 * S, RT.cw * .19, RT.cw * .095, 0, 0, 7); cx.fill();
      cx.fillStyle = '#FFFFFF'; cx.beginPath(); cx.ellipse(c[0], c[1], RT.cw * .19, RT.cw * .095, 0, 0, 7); cx.fill();
      cx.fillStyle = food ? '#E5A15A' : '#EEF1F5'; cx.beginPath(); cx.ellipse(c[0], c[1], RT.cw * .11, RT.cw * .055, 0, 0, 7); cx.fill();
      if (food) { cx.fillStyle = '#7DBA6A'; cx.beginPath(); cx.ellipse(c[0] + RT.cw * .04, c[1] - RT.cw * .015, RT.cw * .035, RT.cw * .018, 0, 0, 7); cx.fill(); }
    }
    function chair(ci, cj, z, side, col) {
      col = col || '#E3E7EE';
      if (side > 0) { ibox(ci, cj, .44, .44, z, .45, col); ibox(ci + .19, cj, .06, .44, .45 + z, .45, col); }
      else if (side < 0) { ibox(ci - .19, cj, .06, .44, .45 + z, .45, col); ibox(ci, cj, .44, .44, z, .45, col); }
      else if (side === 2) { ibox(ci, cj, .44, .44, z, .45, col); ibox(ci, cj + .19, .44, .06, .45 + z, .45, col); }
    }
    function ochair(ci, cj, z) { /* silla de oficina con respaldo hacia +j */
      ibox(ci, cj, .1, .1, z, .4, '#3A4458', 0, .15); ibox(ci, cj, .48, .48, .4 + z, .08, '#2A3245', 0, .2); ibox(ci, cj + .2, .46, .08, .48 + z, .48, '#2A3245', 0, .2);
    }
    function plantObj(ci, cj, z, big) {
      ibox(ci, cj, .38, .38, z, .42, '#E9E4DC'); leaf(ci, cj, .5 + z, big);
    }
    var PLACES = ['restaurante', 'oficina', 'escuela'];
    var TPOS = [[3.2, 3.4], [6.8, 3.4], [3.2, 7.0], [6.8, 7.0]];
    var NAMES = [['Mesa 1', 'Mesa 2', 'Mesa 3'], ['Oficina 1', 'Oficina 2', 'Oficina 3'], ['Dirección', 'Salón 1', 'Salón 2']];
    /* objeto principal en cada posición según el lugar */
    function unit(place, ti, z, o) {
      var t = TPOS[ti], served = o.served && o.served.indexOf(ti) >= 0, isDest = o.dest && o.dest.indexOf(ti) >= 0;
      if (place === 0) {
        ibox(t[0], t[1], .12, .12, z, .72, '#2A3245', 0, .2); ibox(t[0], t[1], .5, .5, z, .03, '#2A3245', 0, .2);
        ibox(t[0], t[1], 1.1, 1.1, .72 + z, .06, '#D9B48C', 0, .7);
        (isDest ? (served ? [[0, 0, 1]] : []) : [[-.22, .2], [.22, -.2]]).forEach(function (pl) { plate(t[0] + pl[0], t[1] + pl[1], .785 + z, pl[2]); });
      } else if (place === 1) {
        ibox(t[0] - .62, t[1], .05, .66, z, .72, '#C9CFDA', 0, .5); ibox(t[0] + .62, t[1], .05, .66, z, .72, '#C9CFDA', 0, .5);
        ibox(t[0], t[1], 1.36, .7, .72 + z, .04, '#F4F6FA', 0, .9);
        ibox(t[0] - .05, t[1] - .18, .14, .1, .76 + z, .02, '#2A3245', 0, .2); ibox(t[0] - .05, t[1] - .2, .04, .04, .78 + z, .2, '#2A3245', 0, .2);
        ibox(t[0] - .05, t[1] - .19, .62, .03, .92 + z, .36, '#0F172A', 0, .25);
        var sc = iso(t[0] - .05, t[1] - .175, 1.1 + z); cx.fillStyle = 'rgba(77,139,255,.55)'; cx.beginPath(); cx.ellipse(sc[0], sc[1], RT.cw * .1, RT.cw * .05, 0, 0, 7); cx.fill();
        ibox(t[0] + .4, t[1] + .1, .22, .3, .76 + z, .015, '#FFFFFF', .2, .2);
        if (served) { ibox(t[0] + .38, t[1] + .1, .14, .14, .78 + z, .12, '#E5A15A', 0, .4); }
      } else {
        if (ti === 0) {
          ibox(t[0], t[1], 1.3, .7, z, .74, '#C79A6B', 0, .6);
          ibox(t[0] - .35, t[1] - .05, .3, .22, .74 + z, .06, '#4D8BFF', 0, .3); ibox(t[0] - .35, t[1] - .05, .28, .2, .8 + z, .05, '#45EDD1', 0, .3); ibox(t[0] + .3, t[1], .26, .2, .74 + z, .02, '#FFFFFF', .3, .2);
          if (served) ibox(t[0] + .1, t[1] - .12, .2, .2, .76 + z, .1, '#E5A15A', 0, .4);
        } else {
          [[-.38, -.32], [.38, -.32], [-.38, .32], [.38, .32]].forEach(function (q, n) {
            var ci = t[0] + q[0], cj = t[1] + q[1];
            ibox(ci, cj, .62, .44, z, .62, '#E3E7EE', 0, .7); ibox(ci, cj, .64, .46, .62 + z, .04, '#D9B48C', 0, .6);
            if (served && n === 0) ibox(ci, cj, .16, .16, .66 + z, .1, '#E5A15A', 0, .4);
            else ibox(ci + .1, cj - .05, .2, .14, .66 + z, .015, '#FFFFFF', 0, .2);
          });
        }
      }
    }
    function unitChairs(place, ti) {
      var t = TPOS[ti], out = [];
      if (place === 0) [-1, 1].forEach(function (sd) { out.push({ c: [t[0] + sd * .9, t[1]], side: sd, r: .25 }); });
      else if (place === 1) out.push({ c: [t[0] + .05, t[1] + .75], office: 1, r: .26 });
      else if (ti === 0) out.push({ c: [t[0], t[1] + .72], side: 2, r: .25, col: '#C9CFDA' });
      return out;
    }

    /* ---------- Diorama completo ---------- */
    function diorama(o) {
      var place = o.place || 0, N = 10, intro = o.intro == null ? 99 : o.intro, tt = o.t || 0;
      if (o.cw) { RT.cw = o.cw; RT.ox = o.ox; RT.oy = o.oy; }
      else { var f = o.fit, cw = Math.min(f[2] / N, f[3] / 6.25) * (o.zoom || 1); RT.cw = cw; RT.ox = f[0] + f[2] / 2; RT.oy = f[1] + (f[3] - 6.12 * cw) / 2 + .95 * cw; }
      var drop = function (d) { var k = eo(seg(intro, d, d + .38)); return [(1 - k) * 2.4, k]; };
      /* sombra y losa */
      var sp = iso(5.6, 5.6, -.3), SR = RT.cw * 6.4;
      cx.save(); cx.translate(sp[0], sp[1] + RT.cw * .15); cx.scale(1, .5);
      var sg = cx.createRadialGradient(0, 0, SR * .2, 0, 0, SR);
      if (o.onDark) { sg.addColorStop(0, 'rgba(69,237,209,.16)'); sg.addColorStop(.5, 'rgba(37,99,235,.10)'); sg.addColorStop(1, 'rgba(37,99,235,0)'); }
      else { sg.addColorStop(0, 'rgba(15,23,42,.22)'); sg.addColorStop(1, 'rgba(15,23,42,0)'); }
      cx.fillStyle = sg; cx.beginPath(); cx.arc(0, 0, SR, 0, 7); cx.fill(); cx.restore();
      ibox(5, 5, 10, 10, -.3, .3, '#E4E8EF', 0, .9);
      var fg = cx.createLinearGradient(iso(0, 0, 0)[0], iso(0, 0, 0)[1], iso(10, 10, 0)[0], iso(10, 10, 0)[1]); fg.addColorStop(0, '#FDFDFE'); fg.addColorStop(1, '#EDF0F5');
      cx.fillStyle = fg; poly([iso(0, 0, 0), iso(10, 0, 0), iso(10, 10, 0), iso(0, 10, 0)]); cx.fill();
      if (place === 1) { cx.fillStyle = 'rgba(77,139,255,.06)'; poly([iso(2.2, 2.6, 0), iso(8.0, 2.6, 0), iso(8.0, 8.0, 0), iso(2.2, 8.0, 0)]); cx.fill(); }
      if (place === 2) { cx.fillStyle = 'rgba(217,180,140,.16)'; poly([iso(5.6, 2.5, 0), iso(8.2, 2.5, 0), iso(8.2, 8.2, 0), iso(5.6, 8.2, 0)]); cx.fill(); }
      cx.strokeStyle = 'rgba(15,23,42,.05)'; cx.lineWidth = 1; cx.beginPath();
      for (var g = 1; g < N; g++) { var a1 = iso(g, 0, 0), a2 = iso(g, 10, 0), b1 = iso(0, g, 0), b2 = iso(10, g, 0); cx.moveTo(a1[0], a1[1]); cx.lineTo(a2[0], a2[1]); cx.moveTo(b1[0], b1[1]); cx.lineTo(b2[0], b2[1]); }
      cx.stroke();
      /* paredes */
      var wk = eo(seg(intro, 0, .4)), wh = 1.5 * wk;
      if (wh > .02) {
        ibox(5, .09, 10, .18, 0, wh, '#FFFFFF', 0, .9); ibox(.09, 5, .18, 10, 0, wh, '#FFFFFF', 0, .9);
        cx.globalAlpha = wk;
        var wn = [iso(5.6, .18, .5), iso(8.8, .18, .5), iso(8.8, .18, 1.2), iso(5.6, .18, 1.2)], wg = cx.createLinearGradient(0, wn[2][1], 0, wn[0][1]);
        wg.addColorStop(0, '#BFD6F2'); wg.addColorStop(1, '#EAF2FB'); cx.fillStyle = wg; poly(wn); cx.fill();
        cx.strokeStyle = '#FFFFFF'; cx.lineWidth = 2 * S; cx.stroke();
        cx.beginPath(); [6.67, 7.73].forEach(function (m) { var t1 = iso(m, .18, .5), t2 = iso(m, .18, 1.2); cx.moveTo(t1[0], t1[1]); cx.lineTo(t2[0], t2[1]); }); cx.stroke();
        cx.fillStyle = 'rgba(255,255,255,.35)'; poly([iso(5.9, .18, .55), iso(6.3, .18, .55), iso(6.9, .18, 1.15), iso(6.5, .18, 1.15)]); cx.fill();
        /* cuadro en la pared lateral: menú, pizarrón blanco o pizarrón verde */
        var bc = ['#0F172A', '#FFFFFF', '#1F4D3A'][place], lc = [MINT, '#4D8BFF', 'rgba(255,255,255,.75)'][place], j0 = place === 2 ? 2.8 : 3.4, j1 = place === 2 ? 6.4 : 5.0;
        cx.fillStyle = bc; poly([iso(.18, j0, .62), iso(.18, j1, .62), iso(.18, j1, 1.22), iso(.18, j0, 1.22)]); cx.fill();
        if (place > 0) { cx.strokeStyle = place === 1 ? '#C9CFDA' : '#C79A6B'; cx.lineWidth = 2 * S; cx.stroke(); }
        cx.strokeStyle = lc; cx.lineWidth = 1.4 * S; cx.beginPath();
        [.82, .95, 1.08].forEach(function (z, n) { var t1 = iso(.18, j0 + .25, z), t2 = iso(.18, j1 - .25 - n * .25 * (j1 - j0) / 1.6, z); cx.moveTo(t1[0], t1[1]); cx.lineTo(t2[0], t2[1]); }); cx.stroke();
        cx.strokeStyle = 'rgba(15,23,42,.08)'; cx.lineWidth = 1.5 * S; cx.beginPath();
        var q1 = iso(10, .18, .08), q2 = iso(.18, .18, .08), q3 = iso(.18, 10, .08); cx.moveTo(q1[0], q1[1]); cx.lineTo(q2[0], q2[1]); cx.lineTo(q3[0], q3[1]); cx.stroke();
        cx.globalAlpha = 1;
      }
      /* fondo junto a la pared */
      var d1 = drop(.12); cx.globalAlpha = d1[1]; softShadow(4.3, .7, 1.6, .16);
      if (place === 0) {
        ibox(4.3, .55, 3.4, .74, d1[0], .9, '#EDEFF3'); ibox(4.3, .56, 3.5, .8, .9 + d1[0], .05, '#1E2638', 0, .3); ibox(4.3, .935, 3.2, .02, .4 + d1[0], .035, '#45EDD1', 0, 0);
        [[3.4, .5], [4.1, .55], [5.2, .5]].forEach(function (pl) { plate(pl[0], pl[1], .955 + d1[0], 1); });
      } else if (place === 1) {
        ibox(4.3, .5, 3.4, .6, d1[0], .9, '#F4F6FA'); ibox(4.3, .5, 3.4, .62, .9 + d1[0], .04, '#D9B48C', 0, .6);
        [3.15, 4.3, 5.45].forEach(function (x) { var a = iso(x - .5, .81, .45 + d1[0]), b = iso(x + .5, .81, .45 + d1[0]); cx.strokeStyle = 'rgba(15,23,42,.12)'; cx.lineWidth = 1.2 * S; cx.beginPath(); cx.moveTo(a[0], a[1]); cx.lineTo(b[0], b[1]); cx.stroke(); });
        ibox(3.4, .5, .6, .46, .94 + d1[0], .28, '#E3E7EE'); ibox(3.4, .5, .5, .3, 1.22 + d1[0], .02, '#2A3245', 0, .2);
        ibox(5.4, .45, .3, .3, .94 + d1[0], .12, '#FFFFFF'); ibox(5.4, .45, .24, .24, 1.06 + d1[0], .2, '#45EDD1', 0, .4);
      } else {
        ibox(4.3, .42, 3.4, .45, d1[0], 1.25, '#C79A6B', 0, .5);
        [.2, .62, 1.02].forEach(function (z, r) { for (var b = 0; b < 12; b++) { var bi = 2.75 + b * .27, colB = ['#4D8BFF', '#45EDD1', '#E5A15A', '#E5533D', '#1E2638', '#F4F6FA'][(b * 7 + r * 3) % 6]; ibox(bi, .5, .16, .3, z + d1[0], .28 - ((b + r) % 3) * .04, colB, 0, .2); } });
      }
      var d2 = drop(.22), pad = o.pad || [1.2, 2.0]; cx.globalAlpha = d2[1];
      softShadow(pad[0], pad[1] - .7, .5, .2); ibox(pad[0], pad[1] - .7, .7, .32, d2[0], .62, '#F4F6FA'); ibox(pad[0], pad[1] - .53, .34, .02, .32 + d2[0], .14, '#45EDD1', 0, 0);
      [[9.3, .75, .3], [.75, 9.3, .4]].forEach(function (pl) { var dd = drop(pl[2]); cx.globalAlpha = dd[1]; softShadow(pl[0], pl[1], .35, .2); plantObj(pl[0], pl[1], dd[0]); });
      cx.globalAlpha = 1;
      /* base de carga y ruta */
      var pulse = .5 + .5 * Math.sin(tt * 7), pk = o.padK == null ? 1 : o.padK, pp = iso(pad[0], pad[1], 0);
      cx.save(); cx.translate(pp[0], pp[1]); cx.scale(1, .5);
      var pg = cx.createRadialGradient(0, 0, 0, 0, 0, RT.cw * .7); pg.addColorStop(0, 'rgba(69,237,209,' + (.35 + .2 * pulse) * pk + ')'); pg.addColorStop(1, 'rgba(69,237,209,0)');
      cx.fillStyle = pg; cx.beginPath(); cx.arc(0, 0, RT.cw * .7, 0, 7); cx.fill(); cx.restore();
      var R = o.robot, P = o.path;
      if (P) {
        var pa = o.planA == null ? 1 : o.planA; cx.lineCap = 'round'; cx.lineJoin = 'round';
        cx.setLineDash([4 * S, 6 * S]); cx.strokeStyle = 'rgba(15,23,42,' + .25 * pa + ')'; cx.lineWidth = 1.6 * S; cx.beginPath();
        P.p.forEach(function (pt, n) { var q = iso(pt[0], pt[1], .01); if (n) cx.lineTo(q[0], q[1]); else cx.moveTo(q[0], q[1]); }); cx.stroke(); cx.setLineDash([]);
        if (o.prog > 0 && R) {
          cx.shadowColor = 'rgba(69,237,209,.8)'; cx.shadowBlur = 12 * S; cx.strokeStyle = MINT; cx.lineWidth = 4 * S; cx.beginPath();
          for (var n = 0; n < R[3]; n++) { var q = iso(P.p[n][0], P.p[n][1], .01); if (n) cx.lineTo(q[0], q[1]); else cx.moveTo(q[0], q[1]); }
          var qe = iso(R[0], R[1], .01); cx.lineTo(qe[0], qe[1]); cx.stroke(); cx.shadowBlur = 0;
        }
      }
      if (o.lines) {
        cx.lineCap = 'round'; cx.lineJoin = 'round'; cx.setLineDash([4 * S, 6 * S]); cx.strokeStyle = 'rgba(15,23,42,.22)'; cx.lineWidth = 1.6 * S; cx.beginPath();
        o.lines.forEach(function (ln) { ln.forEach(function (pt, n) { var q = iso(pt[0], pt[1], .01); if (n) cx.lineTo(q[0], q[1]); else cx.moveTo(q[0], q[1]); }); }); cx.stroke(); cx.setLineDash([]);
      }
      if (o.live && o.live.length > 1) {
        cx.lineCap = 'round'; cx.lineJoin = 'round'; cx.shadowColor = 'rgba(69,237,209,.8)'; cx.shadowBlur = 12 * S; cx.strokeStyle = MINT; cx.lineWidth = 4 * S; cx.beginPath();
        o.live.forEach(function (pt, n) { var q = iso(pt[0], pt[1], .01); if (n) cx.lineTo(q[0], q[1]); else cx.moveTo(q[0], q[1]); }); cx.stroke(); cx.shadowBlur = 0;
        var le = o.live[o.live.length - 1], lq = iso(le[0], le[1], .01); cx.fillStyle = MINT; cx.beginPath(); cx.ellipse(lq[0], lq[1], 5 * S, 2.5 * S, 0, 0, 7); cx.fill();
      }
      if (o.ring) {
        var rp = iso(o.ring.i, o.ring.j, 0), rk = o.ring.k;
        cx.save(); cx.translate(rp[0], rp[1]); cx.scale(1, .5); cx.strokeStyle = 'rgba(69,237,209,' + (1 - rk) + ')'; cx.lineWidth = 3 * S;
        cx.beginPath(); cx.arc(0, 0, RT.cw * (.4 + 1.2 * eo(rk)), 0, 7); cx.stroke(); cx.restore();
      }
      /* objetos ordenados por profundidad */
      var objs = [];
      TPOS.forEach(function (t, ti) {
        var dd = drop(.18 + (t[0] + t[1]) * .022), wd = place === 1 ? [.7, .4] : place === 2 && ti > 0 ? [.75, .6] : [.6, .6];
        objs.push({ b: [t[0] - wd[0], t[0] + wd[0], t[1] - wd[1], t[1] + wd[1]], f: function () { cx.globalAlpha = dd[1]; softShadow(t[0], t[1], place === 2 && ti > 0 ? .95 : .75, .22); unit(place, ti, dd[0], o); cx.globalAlpha = 1; } });
        unitChairs(place, ti).forEach(function (c) {
          var de = drop(.2 + (c.c[0] + c.c[1]) * .022);
          objs.push({ b: [c.c[0] - c.r, c.c[0] + c.r, c.c[1] - c.r, c.c[1] + c.r], f: function () { cx.globalAlpha = de[1]; softShadow(c.c[0], c.c[1], .38, .2); if (c.office) ochair(c.c[0], c.c[1], de[0]); else chair(c.c[0], c.c[1], de[0], c.side, c.col); cx.globalAlpha = 1; } });
        });
      });
      var dp = drop(.5);
      objs.push({ b: [9.0, 9.4, 9.0, 9.4], f: function () { cx.globalAlpha = dp[1]; softShadow(9.2, 9.2, .35, .2); plantObj(9.2, 9.2, dp[0]); cx.globalAlpha = 1; } });
      if (R) {
        var dr = drop(.5);
        objs.push({ b: [R[0] - .42, R[0] + .42, R[1] - .42, R[1] + .42], f: function () { cx.globalAlpha = dr[1]; softShadow(R[0], R[1], .5, .28); miniJeeves(R[0], R[1], R[2], dr[0]); cx.globalAlpha = 1; } });
      }
      var before = function (a, b) { if (a.b[1] <= b.b[0] || a.b[3] <= b.b[2]) return -1; if (b.b[1] <= a.b[0] || b.b[3] <= a.b[2]) return 1; return (a.b[0] + a.b[1] + a.b[2] + a.b[3]) - (b.b[0] + b.b[1] + b.b[2] + b.b[3]); };
      for (var x = 1; x < objs.length; x++) { var ob = objs[x], y = x - 1; while (y >= 0 && before(objs[y], ob) > 0) { objs[y + 1] = objs[y]; y--; } objs[y + 1] = ob; }
      objs.forEach(function (ob) { ob.f(); });
      /* marcadores */
      (o.pins || []).forEach(function (pn, k) {
        var mk = pn.show == null ? 1 : pn.show; if (mk <= 0) return;
        var bob = Math.sin(tt * 4 + k) * .06, mp = iso(pn.i, pn.j, (pn.z || 1.55) + bob + (1 - mk) * .6), mr = RT.cw * .22 * (pn.big || 1);
        cx.globalAlpha = mk; cx.strokeStyle = 'rgba(15,23,42,.18)'; cx.lineWidth = 1.2 * S; cx.setLineDash([2 * S, 3 * S]); cx.beginPath();
        var mb = iso(pn.i, pn.j, .82); cx.moveTo(mp[0], mp[1] + mr); cx.lineTo(mb[0], mb[1]); cx.stroke(); cx.setLineDash([]);
        cx.shadowColor = 'rgba(15,23,42,.25)'; cx.shadowBlur = 10 * S; cx.shadowOffsetY = 3 * S;
        cx.fillStyle = pn.done ? MINT : pn.col || (pn.active ? '#2563EB' : '#0F172A'); cx.beginPath(); cx.arc(mp[0], mp[1], mr, 0, 7); cx.fill();
        cx.shadowBlur = 0; cx.shadowOffsetY = 0;
        if (pn.col && pn.active && !pn.done) { cx.strokeStyle = '#FFFFFF'; cx.lineWidth = Math.max(1.5, mr * .16); cx.stroke(); }
        if (pn.done) {
          var ck = pn.doneK == null ? 1 : pn.doneK; cx.strokeStyle = '#0F172A'; cx.lineWidth = Math.max(1.6, mr * .2); cx.lineCap = 'round'; cx.beginPath();
          cx.moveTo(mp[0] - mr * .4, mp[1]); cx.lineTo(mp[0] - mr * .4 + mr * .3 * Math.min(1, ck * 2), mp[1] + mr * .3 * Math.min(1, ck * 2));
          if (ck > .5) cx.lineTo(mp[0] - mr * .1 + mr * .55 * (ck - .5) * 2, mp[1] + mr * .3 - mr * .65 * (ck - .5) * 2); cx.stroke();
        } else { cx.font = '700 ' + Math.round(mr * 1.05) + 'px ' + FT; cx.fillStyle = pn.col ? '#0B0F17' : pn.active ? '#FFFFFF' : MINT; cx.textAlign = 'center'; cx.fillText(pn.label, mp[0], mp[1] + mr * .37); cx.textAlign = 'left'; }
        if (pn.name) {
          cx.font = '600 ' + Math.round(Math.max(10 * S, RT.cw * .2)) + 'px ' + FT; var tw = cx.measureText(pn.name).width, ph = Math.max(18 * S, RT.cw * .34), px2 = mp[0] - tw / 2 - ph * .45, py2 = mp[1] - mr - ph - 6 * S;
          cx.fillStyle = 'rgba(255,255,255,.94)'; rrc(px2, py2, tw + ph * .9, ph, ph / 2); cx.fill(); cx.strokeStyle = 'rgba(15,23,42,.08)'; cx.lineWidth = 1; cx.stroke();
          cx.fillStyle = '#0F172A'; cx.textAlign = 'center'; cx.fillText(pn.name, mp[0], py2 + ph * .68); cx.textAlign = 'left';
        }
        cx.globalAlpha = 1;
      });
    }
    function rrc(x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); cx.beginPath(); cx.moveTo(x + r, y); cx.arcTo(x + w, y, x + w, y + h, r); cx.arcTo(x + w, y + h, x, y + h, r); cx.arcTo(x, y + h, x, y, r); cx.arcTo(x, y, x + w, y, r); cx.closePath(); }

    return {
      size: function (w, h, s) { W = w; H = h; S = s; },
      cloud: function (n) { buildCloud(n); return PTS; },
      holo: holo, cloudScale: cloudScale, PT0: PT0, PD: PD, PIECES: PIECES,
      makePath: makePath, along: along, stopAt: stopAt, diorama: diorama, NAMES: NAMES, TPOS: TPOS
    };
  }
  window.JeevesArt = { create: create };
})();
