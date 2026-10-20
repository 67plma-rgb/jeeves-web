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

  /* ---------- Nube de partículas: el modelo 3D original de Jeeves ---------- */
  var BOXES = [ /* [ancho, alto, fondo, x, y, z, color] en metros, como el modelo 3D */
    [.62, .1, .52, 0, .17, 0, '#EEF2F8'], [.6, .05, .5, 0, .11, 0, '#3A4458'],
    [.05, .74, .05, -.255, .59, .2, '#F4F6FA'], [.05, .74, .05, .255, .59, .2, '#F4F6FA'],
    [.56, .76, .12, 0, .6, -.17, '#DCE2EC'],
    [.56, .026, .48, 0, .4, 0, '#3E63C9'], [.56, .026, .48, 0, .72, 0, '#3E63C9'],
    [.56, .05, .5, 0, .955, 0, '#3E63C9'],
    [.56, .26, .26, 0, 1.07, 0, '#F4F6FA'], [.46, .21, .01, 0, 1.07, .13, '#0E1626'],
    [.07, .12, .01, -.08, 1.07, .14, '#4D8BFF'], [.07, .12, .01, .08, 1.07, .14, '#4D8BFF'],
    [.01, .1, .1, -.29, 1.07, 0, '#45EDD1'], [.01, .1, .1, .29, 1.07, 0, '#45EDD1'],
    [.63, .012, .53, 0, .128, 0, '#45EDD1']
  ];
  var PTS = [], NP = 0;
  function buildCloud(n) {
    var area = BOXES.map(function (b) { return 2 * (b[0] * b[1] + b[0] * b[2] + b[1] * b[2]); });
    var tot = area.reduce(function (a, b) { return a + b; }, 0), i = 0, out = [];
    BOXES.forEach(function (b, bi) {
      var k = Math.max(b[6] === '#4D8BFF' ? 70 : 12, Math.round(n * area[bi] / tot * (b[6] === '#0E1626' ? .4 : 1)));
      for (var j = 0; j < k; j++, i++) {
        var f = Math.floor(rnd(i * 3.1) * 6), a = rnd(i * 5.7) - .5, c = rnd(i * 9.3) - .5;
        var x = b[3], y = b[4], z = b[5];
        if (f < 2) { x += a * b[0]; y += c * b[1]; z += (f ? .5 : -.5) * b[2]; }
        else if (f < 4) { x += (f === 2 ? .5 : -.5) * b[0]; y += a * b[1]; z += c * b[2]; }
        else { x += a * b[0]; y += (f === 4 ? .5 : -.5) * b[1]; z += c * b[2]; }
        var th = rnd(i * 1.3) * Math.PI * 2, ph = Math.acos(2 * rnd(i * 2.9) - 1), rad = 1.4 + 1.6 * rnd(i * 4.4);
        out.push({ x: x, y: y - .62, z: z, c: b[6], sx: Math.sin(ph) * Math.cos(th) * rad, sy: Math.cos(ph) * rad * .8, sz: Math.sin(ph) * Math.sin(th) * rad, d: rnd(i * 7.7), tx: 0, ty: 0 });
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
  function cloud(u, mode) {
    var f = cloudScale(), ox = W / 2, oy = H * .47;
    for (var i = 0; i < NP; i++) {
      var p = PTS[i], x, y, z, rot, a;
      if (mode === 'build') {
        var k = eio(seg(u, .1 + p.d * .35 + (p.y + .62) * .5, 1.6 + p.d * .35 + (p.y + .62) * .5));
        x = p.sx + (p.x - p.sx) * k; y = p.sy + (p.y - p.sy) * k; z = p.sz + (p.z - p.sz) * k;
        rot = (1 - eo(seg(u, 0, 2.6))) * Math.PI * 2.2 - .5 + u * .25; a = .25 + .75 * k;
      } else {
        rot = -.5 + u * .8; x = p.x; y = p.y; z = p.z; a = 1;
      }
      var q = project(x, y, z, rot, f, ox, oy), s = Math.max(1.2, 2.7 * S * q[2]);
      cx.globalAlpha = a * (.55 + .45 * q[2]);
      cx.fillStyle = p.c; cx.fillRect(q[0] - s / 2, q[1] - s / 2, s, s);
    }
    cx.globalAlpha = 1;
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
    { n: 'HOLOGRAMA', d: 3.0, dark: true, hit: [2.2], f: function (u) {
      bg(INK);
      var g = cx.createRadialGradient(W / 2, H * .55, 0, W / 2, H * .55, Math.max(W, H) * .6); g.addColorStop(0, 'rgba(37,99,235,.28)'); g.addColorStop(1, 'rgba(37,99,235,0)'); cx.fillStyle = g; cx.fillRect(0, 0, W, H);
      /* piso holográfico */
      cx.strokeStyle = 'rgba(69,237,209,.18)'; cx.lineWidth = 1;
      for (var r = 1; r <= 4; r++) { cx.beginPath(); cx.ellipse(W / 2, H * .5 + Math.min(H * .6, W * .5) * .62, r * 70 * S, r * 18 * S, 0, 0, 7); cx.stroke(); }
      cloud(u, 'build');
      /* línea de escaneo */
      var sy = H * (.85 - .7 * seg(u, .2, 2.2)), sa = u < 2.3 ? .9 : 0;
      var lg = cx.createLinearGradient(0, sy - 30 * S, 0, sy + 2 * S); lg.addColorStop(0, 'rgba(69,237,209,0)'); lg.addColorStop(1, 'rgba(69,237,209,' + sa * .35 + ')');
      cx.fillStyle = lg; cx.fillRect(0, sy - 30 * S, W, 32 * S); cx.fillStyle = 'rgba(69,237,209,' + sa + ')'; cx.fillRect(0, sy, W, 1.5 * S);
      var k = eo(seg(u, 2.2, 2.7));
      font('700', Math.min(W * .05, 40 * S)); cx.fillStyle = 'rgba(244,246,250,' + k + ')'; cx.textAlign = 'center';
      cx.fillText('Esto es Jeeves.', W / 2, H - 46 * S); cx.textAlign = 'left';
      font('600', 11 * S, FT); cx.fillStyle = 'rgba(69,237,209,.8)';
      cx.fillText('MODELO 3D · ' + Math.round(NP * eo(seg(u, .1, 2.2))) + ' PUNTOS', 44 * S, 64 * S);
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
    { n: 'RUTA', d: 2.5, dark: false, f: function (u) {
      bg('#E9ECF2');
      var N = 11, cw = Math.min(W / 13, H / 7.2), chh = cw * .58, ox = W / 2, oy = H * .24, i, j;
      var route = []; for (i = 0; i <= 8; i++) route.push([i, 5]); for (j = 4; j >= 1; j--) route.push([8, j]);
      var prog = eio(seg(u, .2, 2.1)) * (route.length - 1), idx = Math.floor(prog);
      var lit = {}; for (i = 0; i <= Math.min(idx, route.length - 1); i++) lit[route[i][0] + ',' + route[i][1]] = 1;
      var tables = { '3,2': 1, '3,8': 1, '6,8': 1, '8,0': 1, '1,8': 1 };
      for (var s2 = 0; s2 <= 2 * (N - 1); s2++) for (i = 0; i < N; i++) {
        j = s2 - i; if (j < 0 || j >= N) continue;
        var d = Math.hypot(i - 5, j - 5), wave = Math.sin(d * .9 - u * 5) * .5 + .5, k = i + ',' + j;
        var hgt = tables[k] ? cw * .9 : cw * (.15 + .35 * wave * eo(seg(u, 0, .5)));
        var x = ox + (i - j) * cw / 2, y = oy + (i + j) * chh / 2;
        var top = lit[k] ? MINT : tables[k] ? '#FFFFFF' : '#F7F8FB', left = lit[k] ? '#2BBFA7' : tables[k] ? '#9AA3B5' : '#C9CFDA', right = lit[k] ? '#1F9A86' : tables[k] ? '#8891A3' : '#B2B9C7';
        cx.fillStyle = left; cx.beginPath(); cx.moveTo(x - cw / 2, y - hgt); cx.lineTo(x, y + chh / 2 - hgt); cx.lineTo(x, y + chh / 2); cx.lineTo(x - cw / 2, y); cx.closePath(); cx.fill();
        cx.fillStyle = right; cx.beginPath(); cx.moveTo(x + cw / 2, y - hgt); cx.lineTo(x, y + chh / 2 - hgt); cx.lineTo(x, y + chh / 2); cx.lineTo(x + cw / 2, y); cx.closePath(); cx.fill();
        cx.fillStyle = top; cx.beginPath(); cx.moveTo(x, y - chh / 2 - hgt); cx.lineTo(x + cw / 2, y - hgt); cx.lineTo(x, y + chh / 2 - hgt); cx.lineTo(x - cw / 2, y - hgt); cx.closePath(); cx.fill();
        var ci = Math.min(route.length - 1, Math.round(prog));
        if (route[ci][0] === i && route[ci][1] === j) {
          var a = route[Math.floor(prog)], b = route[Math.min(route.length - 1, Math.floor(prog) + 1)], f = prog - Math.floor(prog);
          var bi = a[0] + (b[0] - a[0]) * f, bj = a[1] + (b[1] - a[1]) * f, bx = ox + (bi - bj) * cw / 2, by = oy + (bi + bj) * chh / 2 - cw * .7, bh = cw * .95;
          cx.fillStyle = '#E8ECF3'; cx.beginPath(); cx.moveTo(bx - cw * .36, by - bh * .5); cx.lineTo(bx, by - bh * .5 + chh * .36); cx.lineTo(bx, by + chh * .36); cx.lineTo(bx - cw * .36, by); cx.closePath(); cx.fill();
          cx.fillStyle = '#C3CAD6'; cx.beginPath(); cx.moveTo(bx + cw * .36, by - bh * .5); cx.lineTo(bx, by - bh * .5 + chh * .36); cx.lineTo(bx, by + chh * .36); cx.lineTo(bx + cw * .36, by); cx.closePath(); cx.fill();
          cx.fillStyle = '#1E2A4A'; cx.beginPath(); cx.moveTo(bx, by - bh * .5 - chh * .36); cx.lineTo(bx + cw * .36, by - bh * .5); cx.lineTo(bx, by - bh * .5 + chh * .36); cx.lineTo(bx - cw * .36, by - bh * .5); cx.closePath(); cx.fill();
          cx.shadowColor = BLUE; cx.shadowBlur = 14 * S; cx.fillStyle = BLUE;
          cx.fillRect(bx - cw * .2, by - bh * .32, cw * .07, cw * .14); cx.fillRect(bx - cw * .08, by - bh * .26, cw * .07, cw * .14); cx.shadowBlur = 0;
        }
      }
      font('700', Math.min(W * .045, 34 * S)); cx.fillStyle = 'rgba(5,7,12,' + (.3 + .7 * eo(seg(u, 1.8, 2.3))) + ')';
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
    SCORE.push([A[4] + 2.2, 'impact']);
    [0, .75, 1.5].forEach(function (h) { SCORE.push([A[7] + h, 'blip' + h]); });
    SCORE.push([A[9], 'riser1']); SCORE.push([A[10], 'impact']); SCORE.push([A[10] + 2.4, 'impact']);
  })();
  function play(name, t0) {
    if (name === 'kick') kick(t0); else if (name === 'kickbig') { kick(t0); noise(t0, 'highpass', 2500, 1, .2, .12); }
    else if (name === 'hat') noise(t0, 'highpass', 7500, 1, .12, .05);
    else if (name === 'clap') noise(t0, 'bandpass', 1600, 1.2, .35, .14);
    else if (name === 'impact') impact(t0);
    else if (name === 'riser1') riser(t0, 1.45); else if (name === 'riser2') riser(t0, 1.95);
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
