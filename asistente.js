/* Asistente Jeeves: chat + voz. Sin dependencias.
   Cerebro local (respuestas preparadas). Si defines window.JEEVES_AI_URL (un Worker/servidor propio),
   las respuestas salen de ahí y, si falla, vuelve al cerebro local. */
(function () {
  'use strict';
  var WA = '525636422489';
  var LIMITE_MS = 6 * 60 * 1000, LIMITE_MSG = 25, MAX_CHARS = 280;
  var doc = document, root = doc.documentElement;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function $(s, r) { return (r || doc).querySelector(s); }
  function safe(fn, d) { try { return fn(); } catch (e) { return d; } }

  /* ---------- Interfaz ---------- */
  var ICON_BOT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 11a8 8 0 0 1 16 0v5a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3z"/><path d="M9 12.5v1M15 12.5v1"/><path d="M12 3v2"/></svg>';
  var ICON_X = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  var ICON_VOL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 10v4h4l5 4V6L8 10z"/><path d="M16.5 9a4 4 0 0 1 0 6M19 6.5a7.5 7.5 0 0 1 0 11"/></svg>';
  var ICON_MUTE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 10v4h4l5 4V6L8 10z"/><path d="M17 9.5l4 5M21 9.5l-4 5"/></svg>';
  var ICON_SEND = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6"/></svg>';

  var fab = doc.createElement('button');
  fab.className = 'as-fab'; fab.type = 'button'; fab.setAttribute('aria-haspopup', 'dialog');
  fab.innerHTML = ICON_BOT + '<span>Habla con Jeeves</span>';
  var panel = doc.createElement('section');
  panel.className = 'as-panel'; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', 'Asistente Jeeves'); panel.setAttribute('aria-modal', 'false');
  panel.innerHTML =
    '<div class="as-stage"><canvas></canvas><span class="as-brand">JEEVES</span>' +
    '<div class="as-tools"><button class="as-icon as-mute" type="button" aria-label="Silenciar voz">' + ICON_VOL + '</button><button class="as-icon as-close" type="button" aria-label="Cerrar asistente">' + ICON_X + '</button></div>' +
    '<div class="as-status" aria-live="polite">Listo para atenderte</div></div>' +
    '<div class="as-log" role="log" aria-live="polite" aria-label="Conversación"></div>' +
    '<div class="as-chips"></div>' +
    '<form class="as-form" autocomplete="off"><input class="as-in" type="text" maxlength="' + MAX_CHARS + '" placeholder="Escribe tu pregunta" aria-label="Escribe tu pregunta"><button class="as-send" type="submit" aria-label="Enviar">' + ICON_SEND + '</button></form>' +
    '<div class="as-dock"><button class="as-btn" type="button" aria-pressed="false">Empezar a hablar</button></div>' +
    '<p class="as-foot"></p>';
  doc.body.appendChild(fab); doc.body.appendChild(panel);

  var log = $('.as-log', panel), chips = $('.as-chips', panel), form = $('.as-form', panel), input = $('.as-in', panel),
      talk = $('.as-btn', panel), status = $('.as-status', panel), muteBtn = $('.as-mute', panel), foot = $('.as-foot', panel), cv = $('canvas', panel);
  var usaIA = !!window.JEEVES_AI_URL;
  foot.textContent = usaIA ? 'Jeeves es un asistente con inteligencia artificial.' : 'Jeeves es un asistente virtual de Jeeves Robotics.';

  /* ---------- Partículas ---------- */
  var cx = cv.getContext('2d'), P = [], raf = 0, W = 0, H = 0, DPR = 1, estado = 'idle', energia = 0, nivel = 0;
  function rnd(i) { var x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  var N = (window.innerWidth < 520) ? 700 : 1100;
  for (var i = 0; i < N; i++) {
    var r = Math.pow(rnd(i + 1), 1.4), th = rnd(i * 2.3 + 5) * 6.2832, ph = Math.acos(2 * rnd(i * 3.7 + 9) - 1);
    P.push({ r: r, th: th, ph: ph, w: (.25 + .9 * (1 - r)) * (rnd(i * 5.1) < .5 ? 1 : -.6), c: rnd(i * 7.9), s: .7 + rnd(i * 4.1) * 1.3, o: rnd(i * 6.3) * 6.28 });
  }
  function fit() {
    DPR = Math.min(2, window.devicePixelRatio || 1);
    var b = cv.getBoundingClientRect(); W = Math.max(1, b.width); H = Math.max(1, b.height);
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
  }
  function draw(ms) {
    var t = ms / 1000;
    var meta = estado === 'listen' ? .75 : estado === 'speak' ? .9 : estado === 'think' ? .6 : .32;
    energia += (meta - energia) * .06;
    var pulso = estado === 'speak' ? (.5 + .5 * Math.sin(t * 9) * Math.sin(t * 3.1 + 1)) : estado === 'listen' ? (.5 + .5 * Math.sin(t * 4)) : 0;
    nivel += (pulso - nivel) * .2;
    cx.setTransform(DPR, 0, 0, DPR, 0, 0); cx.clearRect(0, 0, W, H);
    var R = Math.min(W, H) * .4 * (1 + nivel * .14 + (estado === 'think' ? .04 * Math.sin(t * 6) : 0)), mx = W / 2, my = H * .46;
    var g = cx.createRadialGradient(mx, my, 0, mx, my, R * 1.6); g.addColorStop(0, 'rgba(37,99,235,' + (.22 * energia + .08) + ')'); g.addColorStop(1, 'rgba(37,99,235,0)');
    cx.fillStyle = g; cx.fillRect(0, 0, W, H);
    cx.globalCompositeOperation = 'lighter';
    var cols = ['rgba(120,170,255,', 'rgba(80,235,215,', 'rgba(235,250,255,'];
    for (var i = 0; i < P.length; i++) {
      var p = P[i], tt = reduce ? 0 : t, ang = p.th + p.w * tt * (.4 + energia), rr = p.r * (1 + .07 * Math.sin(tt * (1 + p.s) + p.o) + nivel * .18 * (1 - p.r));
      var sp = Math.sin(p.ph), x = rr * sp * Math.cos(ang), z = rr * sp * Math.sin(ang), y = rr * Math.cos(p.ph);
      var k = 3 / (3 + z), a = (.25 + .75 * (1 - p.r)) * (.45 + .55 * k) * (.55 + .6 * energia);
      cx.fillStyle = cols[p.c < .55 ? 0 : p.c < .9 ? 1 : 2] + Math.min(1, a) + ')';
      var s = p.s * k * (1 + nivel * .3); cx.fillRect(mx + x * R * k - s / 2, my - y * R * k * .92 - s / 2, s, s);
    }
    cx.globalCompositeOperation = 'source-over';
    raf = reduce ? 0 : requestAnimationFrame(draw);
  }
  function startDraw() { fit(); cancelAnimationFrame(raf); raf = requestAnimationFrame(draw); }
  function stopDraw() { cancelAnimationFrame(raf); raf = 0; }
  window.addEventListener('resize', function () { if (isOpen) fit(); });

  /* ---------- Estado, límites y voz ---------- */
  var isOpen = false, started = false, nMsg = 0, usado = safe(function () { return +sessionStorage.getItem('jv-used') || 0; }, 0), openAt = 0, agotado = false;
  var ctx = { negocio: '', paso: '', dia: '', hora: '', dir: '', nombre: '' };
  var hist = [];
  var voz = { mudo: false, escucha: false, rec: null, v: null, ok: 'speechSynthesis' in window };
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { talk.textContent = 'Voz no disponible en este navegador'; talk.disabled = true; talk.style.opacity = .6; }

  function setStatus(t, e) { status.textContent = t; estado = e || 'idle'; }
  function pickVoice() {
    if (!voz.ok) return;
    var vs = speechSynthesis.getVoices() || [], es = vs.filter(function (v) { return /^es/i.test(v.lang); });
    var pref = ['raul', 'jorge', 'diego', 'juan', 'pablo', 'carlos', 'miguel', 'male', 'hombre'];
    var mx = es.filter(function (v) { return /MX|419|US/i.test(v.lang); });
    var pool = mx.length ? mx.concat(es) : es, hit = null;
    for (var i = 0; i < pref.length && !hit; i++) hit = pool.filter(function (v) { return v.name.toLowerCase().indexOf(pref[i]) > -1; })[0];
    voz.v = hit || pool[0] || null;
  }
  if (voz.ok) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
  function hablar(texto, fin) {
    if (!voz.ok || voz.mudo || !isOpen) { if (fin) fin(); return; }
    speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(texto.replace(/https?:\/\/\S+/g, '').replace(/\s+/g, ' ').trim());
    u.lang = (voz.v && voz.v.lang) || 'es-MX'; if (voz.v) u.voice = voz.v; u.rate = 1.02; u.pitch = .82;
    u.onstart = function () { setStatus('Hablando…', 'speak'); };
    var done = function () { setStatus(voz.escucha ? 'Te escucho…' : 'Listo para atenderte', voz.escucha ? 'listen' : 'idle'); if (fin) fin(); };
    u.onend = done; u.onerror = done; speechSynthesis.speak(u);
  }
  function escuchar() {
    if (!SR || agotado || !isOpen) return;
    if (!voz.rec) {
      var r = new SR(); r.lang = 'es-MX'; r.interimResults = false; r.continuous = false;
      r.onresult = function (e) { var t = e.results[e.results.length - 1][0].transcript; if (t) enviar(t); };
      r.onerror = function (e) { if (e.error === 'not-allowed' || e.error === 'service-not-allowed') { alternarVoz(false); botMsg('No tengo permiso para usar el micrófono. Puedes escribirme aquí abajo.'); } };
      r.onend = function () { if (voz.escucha && !speechSynthesis.speaking && !pensando) setTimeout(function () { if (voz.escucha) safe(function () { r.start(); }); }, 250); };
      voz.rec = r;
    }
    setStatus('Te escucho…', 'listen'); safe(function () { voz.rec.start(); });
  }
  function alternarVoz(on) {
    voz.escucha = on; talk.setAttribute('aria-pressed', on); talk.textContent = on ? 'Dejar de hablar' : 'Empezar a hablar';
    if (on) { if (voz.ok) speechSynthesis.cancel(); escuchar(); } else { safe(function () { voz.rec && voz.rec.abort(); }); setStatus('Listo para atenderte', 'idle'); }
  }

  /* ---------- Mensajes ---------- */
  function msg(txt, who, extra) {
    var d = doc.createElement('div'); d.className = 'as-msg ' + who; d.textContent = txt;
    if (extra) d.appendChild(extra);
    log.appendChild(d); log.scrollTop = log.scrollHeight; return d;
  }
  function botMsg(txt, extra) { msg(txt, 'bot', extra); hablar(txt, null); hist.push({ role: 'assistant', content: txt }); }
  function waLink(texto, label) {
    var a = doc.createElement('a'); a.className = 'as-wa'; a.target = '_blank'; a.rel = 'noopener';
    a.href = 'https://wa.me/' + WA + '?text=' + encodeURIComponent(texto); a.textContent = label; a.addEventListener('click', function (e) { e.stopPropagation(); }); return a;
  }
  function setChips(list) {
    chips.innerHTML = '';
    list.forEach(function (t) { var b = doc.createElement('button'); b.type = 'button'; b.className = 'as-chip'; b.textContent = t; b.addEventListener('click', function () { enviar(t); }); chips.appendChild(b); });
  }
  var pensando = false, dots = null;

  /* ---------- Cerebro local ---------- */
  function norm(s) { return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
  var DIAS = { lunes: 1, martes: 2, miercoles: 3, jueves: 4, viernes: 5, sabado: 6, domingo: 0 };
  var HORARIO = 'Atendemos y hacemos visitas de lunes a viernes, de 9:00 a 18:00.';
  function parseDia(t) {
    for (var k in DIAS) if (t.indexOf(k) > -1) return { n: DIAS[k], txt: k };
    var hoy = new Date(), d = hoy.getDay();
    if (/\bhoy\b/.test(t)) return { n: d, txt: 'hoy' };
    if (/pasado manana/.test(t)) return { n: (d + 2) % 7, txt: 'pasado mañana' };
    if (/\bmanana\b/.test(t) && !/de la manana|en la manana|por la manana/.test(t)) return { n: (d + 1) % 7, txt: 'mañana' };
    return null;
  }
  function parseHora(t) {
    var m = t.match(/(?:a las|las|a la|la)?\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.|de la manana|de la tarde|de la noche|hrs|horas|h)?/);
    if (!m || (!m[3] && !/(a las|a la|\d:\d\d)/.test(t))) return null;
    var h = +m[1], mi = +(m[2] || 0), suf = m[3] || '';
    if (/pm|p\.m|tarde|noche/.test(suf) && h < 12) h += 12;
    if (!/am|a\.m|manana|pm|p\.m|tarde|noche|hrs|horas|h/.test(suf) && h >= 1 && h <= 7) h += 12; /* "a las 4" = 16:00 */
    if (h > 23 || mi > 59) return null; return { h: h, m: mi, txt: (h < 10 ? '0' : '') + h + ':' + (mi < 10 ? '0' : '') + mi };
  }
  function dirCompleta(s) { var n = norm(s); return s.length >= 22 && /\d/.test(s) && s.split(/[ ,]+/).length >= 5 && (/(calle|av\.?|avenida|blvd|boulevard|calzada|privada|cerrada|carretera|paseo|esquina|prolongacion|eje)\b/.test(n) || /colonia|col\./.test(n)) && /colonia|col\.|fracc|barrio|centro|ciudad|cdmx|municipio|edo|estado|,/.test(n); }

  var KB = [
    [/hola|buenas|buen dia|buenos dias|buenas tardes|que tal/, function () { return 'Hola, soy Jeeves. Te cuento de mi robot de entregas o agendo una visita a tu local. ¿Qué tipo de negocio tienes?'; }],
    [/precio|cuesta|costo|cuanto|valor|cotiza/, function () { return 'Jeeves Robot cuesta $6,999 MXN. El Paquete Ruta (diseño de ruta, línea guía para 3 destinos, QR y calibración) cuesta $995 MXN. El kit de rutas extra, $259 MXN, y el Soporte Jeeves, $995 MXN al año. Te damos el precio final después de visitar tu local. ¿Quieres que agende la visita?'; }],
    [/paga|pago|transferencia|efectivo|anticipo|financ/, function () { return 'Se paga por transferencia bancaria o en efectivo, con un anticipo para apartar tu Jeeves.'; }],
    [/que es|quien eres|que hace|como funciona|para que sirve|cuentame|informacion|info/, function () { return 'Jeeves es un robot autónomo de entregas de 1.20 m para restaurantes, oficinas, hospitales y escuelas. Tiene dos charolas: abajo para carga pesada y arriba para lo ligero. Sigue una línea guía en el piso, se ubica con códigos QR si la pierde y se detiene ante personas u obstáculos. Lo controlas desde una app. ¿Qué tipo de negocio tienes?'; }],
    [/linea|guia|qr|perd/, function () { return 'Jeeves sigue una línea guía pegada en el piso. Si la pierde, se ubica con los códigos QR de respaldo que colocamos en tu local y vuelve a su ruta.'; }],
    [/obstacul|choc|persona|seguro|seguridad|cruza|detiene/, function () { return 'La cámara y los sensores de Jeeves detectan objetos y personas, y se detiene para evitar choques.'; }],
    [/app|aplicacion|control|punto|destino|mesa/, function () { return 'Desde la app eliges el Punto A, B o C, ves su estado, la batería y el historial de entregas. Con el kit de rutas extra puedes agregar o cambiar destinos.'; }],
    [/bateria|carga|dura|autonomia|horas/, function () { return 'Jeeves trabaja con batería recargable y en la app ves cuántas horas le quedan. Puede volver a su base a cargarse.'; }],
    [/charola|carga|peso|kilos|capacidad|medida|tamano|alto/, function () { return 'Mide 1.20 m de alto y tiene dos charolas: la de abajo para carga pesada y la de arriba para lo ligero.'; }],
    [/ojos|pantalla|cara|emocion|estado/, function () { return 'Su pantalla muestra ojos animados y luces de estado: dormitando, alerta, sorprendido, feliz o bloqueado. Así sabes qué está haciendo sin abrir la app.'; }],
    [/instal|incluye|paquete|ruta/, function () { return 'El Paquete Ruta incluye el diseño de la ruta, la línea guía para 3 destinos, los códigos QR de respaldo y la calibración del robot en tu local. También te enseñamos a usar la app.'; }],
    [/soporte|garantia|falla|descompon|mantenimiento/, function () { return 'El Soporte Jeeves cuesta $995 MXN al año. Para una falla puntual, escríbenos por WhatsApp y te ayudamos.'; }],
    [/horario|hora atienden|abren|cuando atienden/, function () { return HORARIO; }],
    [/contacto|whatsapp|correo|telefono|llamar|escribir/, function () { return 'Escríbenos por WhatsApp al +52 56 3642 2489. ' + HORARIO; }],
    [/ubicacion|donde estan|donde se ubican|sucursal|ciudad|cobertura|envian/, function () { return 'Visitamos tu local para medir y diseñar la ruta. Dime la dirección completa y vemos si podemos ir.'; }],
    [/gracias|perfecto|excelente|genial|ok gracias/, function () { return 'Con gusto. Si quieres, agendo la visita a tu local o te paso el WhatsApp.'; }]
  ];

  function flujoVisita(t) {
    /* t: texto normalizado; devuelve respuesta o null */
    var dia = parseDia(t), hora = parseHora(t);
    if (ctx.paso === 'dia' || ctx.paso === 'hora' || ctx.paso === 'inicio') {
      if (dia) {
        if (dia.n === 0 || dia.n === 6) return 'Ese día no hacemos visitas. ' + HORARIO + ' ¿Qué día te acomoda?';
        ctx.dia = dia.txt;
      }
      if (hora) {
        if (hora.h < 9 || hora.h > 17 || (hora.h === 17 && hora.m > 30)) return 'Esa hora queda fuera de horario. ' + HORARIO + ' ¿A qué hora te acomoda?';
        ctx.hora = hora.txt;
      }
      if (!ctx.dia) { ctx.paso = 'dia'; return 'Perfecto. ¿Qué día te acomoda? De lunes a viernes.'; }
      if (!ctx.hora) { ctx.paso = 'hora'; return 'Anotado: ' + ctx.dia + '. ¿A qué hora, entre 9:00 y 17:30?'; }
      ctx.paso = 'dir'; return 'Muy bien: ' + ctx.dia + ' a las ' + ctx.hora + '. ¿Cuál es la dirección completa de tu local? Calle, número, colonia y ciudad.';
    }
    if (ctx.paso === 'dir') {
      if (!dirCompleta(t)) return 'Necesito la dirección completa para poder ir: calle, número, colonia y ciudad.';
      ctx.dir = t; ctx.paso = 'nombre'; return 'Listo. ¿A nombre de quién agendo la visita?';
    }
    if (ctx.paso === 'nombre') {
      if (t.length < 2) return '¿Cómo te llamas?';
      ctx.nombre = t.replace(/^(soy|me llamo|mi nombre es)\s+/i, ''); ctx.paso = 'fin'; return null;
    }
    return null;
  }

  function cerebroLocal(raw) {
    var t = norm(raw).trim();
    if (/visita|agendar|agenda|cita|medir|medidas|probar|prueba|demo|ver el robot|conocer/.test(t) && !ctx.paso) {
      ctx.paso = 'inicio';
      var r0 = flujoVisita(t); return { txt: r0 || 'Con gusto agendo una visita a tu local para medir el espacio o hacer una prueba. ' + HORARIO + ' ¿Qué día te acomoda?' };
    }
    if (ctx.paso && ctx.paso !== 'fin') {
      if (/cancel|ya no|olvida|mejor no/.test(t)) { ctx.paso = ''; return { txt: 'Sin problema. Si cambias de opinión, aquí estoy.' }; }
      var r = flujoVisita(ctx.paso === 'dir' || ctx.paso === 'nombre' ? raw.trim() : t);
      if (ctx.paso === 'fin') return resumenVisita();
      if (r) return { txt: r };
    }
    if (!ctx.negocio) {
      var neg = /restaurante|restaurant|cafeteria|cafe|bar\b|taqueria|fonda|comedor/.test(t) ? 'restaurante' : /oficina|corporativo|empresa/.test(t) ? 'oficina' : /escuela|colegio|universidad|instituto|prepa|secundaria/.test(t) ? 'escuela' : /hospital|clinica|consultorio/.test(t) ? 'hospital' : '';
      if (neg) {
        ctx.negocio = neg;
        var ej = { restaurante: 'llevar platillos y bebidas de la cocina a las mesas, y regresar con los platos sucios', oficina: 'llevar documentos, paquetes y café entre áreas sin que nadie deje su lugar', escuela: 'llevar material, paquetes y documentos entre áreas', hospital: 'llevar insumos, muestras y documentos entre áreas' }[neg];
        return { txt: 'Para un ' + neg + ', Jeeves sirve para ' + ej + '. Trabaja sin pausas para que tu gente atienda a los clientes. ¿Quieres que agende una visita para medir tu local?', chips: ['Sí, agendar visita', 'Precios', 'Cómo funciona'] };
      }
    }
    if (/^(si|sii|claro|va|dale|ok|okay|por favor|agendar visita|si agendar visita|si, agendar visita)/.test(t) && ctx.negocio) {
      ctx.paso = 'inicio'; return { txt: 'Perfecto. ' + HORARIO + ' ¿Qué día te acomoda?' };
    }
    for (var i = 0; i < KB.length; i++) if (KB[i][0].test(t)) return { txt: KB[i][1](), chips: (i === 1 || i === 0) ? ['Sí, agendar visita', 'Cómo funciona'] : null };
    return { txt: 'Eso lo ve mejor el equipo. Escríbenos por WhatsApp al +52 56 3642 2489 (' + HORARIO.toLowerCase().replace('atendemos y hacemos visitas de ', '').replace(/\.$/, '') + '). También te puedo contar de precios, cómo funciona o agendar una visita.', chips: ['Precios', 'Cómo funciona', 'Agendar visita'] };
  }
  function resumenVisita() {
    var texto = 'Hola, quiero confirmar una visita de Jeeves.\nNombre: ' + ctx.nombre + '\nNegocio: ' + (ctx.negocio || 'por definir') + '\nDía y hora: ' + ctx.dia + ' a las ' + ctx.hora + '\nDirección: ' + ctx.dir;
    var a = waLink(texto, 'Confirmar por WhatsApp');
    ctx.paso = '';
    return { txt: 'Listo, ' + ctx.nombre + '. Dejé tu solicitud: ' + ctx.dia + ' a las ' + ctx.hora + ' en ' + ctx.dir + '. La visita queda confirmada cuando el equipo responda tu mensaje de WhatsApp. Toca el botón para enviarlo.', extra: a };
  }

  function cerebroRemoto(raw) {
    var ctl = ('AbortController' in window) ? new AbortController() : null, to = setTimeout(function () { ctl && ctl.abort(); }, 12000);
    return fetch(window.JEEVES_AI_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: hist.slice(-12) }), signal: ctl ? ctl.signal : undefined })
      .then(function (r) { clearTimeout(to); if (!r.ok) throw 0; return r.json(); })
      .then(function (j) { if (!j || !j.reply) throw 0; return { txt: String(j.reply).slice(0, 900) }; });
  }

  /* ---------- Envío ---------- */
  function enviar(raw) {
    raw = String(raw || '').trim().slice(0, MAX_CHARS);
    if (!raw || pensando || agotado) return;
    if (nMsg >= LIMITE_MSG) return cerrarSesion('Llegamos al límite de mensajes de esta conversación.');
    nMsg++; input.value = ''; setChips([]);
    msg(raw, 'me'); hist.push({ role: 'user', content: raw });
    pensando = true; safe(function () { voz.rec && voz.rec.abort(); });
    dots = doc.createElement('div'); dots.className = 'as-msg bot'; dots.innerHTML = '<span class="as-dots"><i></i><i></i><i></i></span>'; log.appendChild(dots); log.scrollTop = log.scrollHeight;
    setStatus('Pensando…', 'think');
    var go = usaIA ? cerebroRemoto(raw).catch(function () { return cerebroLocal(raw); }) : Promise.resolve(cerebroLocal(raw));
    go.then(function (r) {
      setTimeout(function () {
        if (dots) { dots.remove(); dots = null; } pensando = false;
        botMsg(r.txt, r.extra); if (r.chips) setChips(r.chips);
        if (voz.escucha) { var wait = function () { if (voz.ok && speechSynthesis.speaking) setTimeout(wait, 300); else escuchar(); }; setTimeout(wait, 400); }
        else setStatus('Listo para atenderte', 'idle');
      }, reduce ? 0 : 450);
    });
  }
  function cerrarSesion(motivo) {
    agotado = true; panel.classList.add('as-off'); alternarVoz(false); input.disabled = true;
    var a = waLink('Hola, quiero información de Jeeves.', 'Seguir por WhatsApp');
    msg(motivo + ' Para seguir, escríbenos por WhatsApp y te atiende una persona.', 'bot', a); setStatus('Sesión terminada', 'idle');
  }

  /* ---------- Abrir / cerrar ---------- */
  var timer = 0;
  function abrir() {
    if (isOpen) return; isOpen = true; root.classList.add('as-open'); openAt = Date.now(); fab.setAttribute('aria-expanded', 'true');
    if (usado >= LIMITE_MS) { agotado = true; panel.classList.add('as-off'); }
    startDraw();
    if (!started) {
      started = true;
      botMsg('Hola, soy Jeeves, el asistente de Jeeves Robotics. Te cuento cómo funciona mi robot, te doy precios o agendo una visita a tu local. ¿Qué tipo de negocio tienes?');
      setChips(['Restaurante', 'Oficina', 'Escuela', 'Precios']);
    }
    if (agotado && !panel.querySelector('.as-wa')) cerrarSesion('Ya usaste el tiempo de asistente de esta visita.');
    timer = setInterval(function () {
      var total = usado + (Date.now() - openAt); safe(function () { sessionStorage.setItem('jv-used', Math.round(total)); });
      if (total >= LIMITE_MS && !agotado) cerrarSesion('Se acabó el tiempo de esta conversación.');
    }, 1000);
    setTimeout(function () { if (!/Mobi|Android/i.test(navigator.userAgent)) input.focus(); }, 300);
  }
  function cerrar() {
    if (!isOpen) return; usado += Date.now() - openAt; safe(function () { sessionStorage.setItem('jv-used', Math.round(usado)); });
    isOpen = false; root.classList.remove('as-open'); fab.setAttribute('aria-expanded', 'false'); clearInterval(timer); stopDraw();
    alternarVoz(false); if (voz.ok) speechSynthesis.cancel(); fab.focus();
  }

  fab.addEventListener('click', abrir);
  $('.as-close', panel).addEventListener('click', cerrar);
  doc.addEventListener('keydown', function (e) { if (e.key === 'Escape' && isOpen) cerrar(); });
  form.addEventListener('submit', function (e) { e.preventDefault(); enviar(input.value); });
  talk.addEventListener('click', function () { if (agotado) return; alternarVoz(!voz.escucha); });
  muteBtn.addEventListener('click', function () {
    voz.mudo = !voz.mudo; muteBtn.innerHTML = voz.mudo ? ICON_MUTE : ICON_VOL; muteBtn.setAttribute('aria-label', voz.mudo ? 'Activar voz' : 'Silenciar voz'); if (voz.mudo && voz.ok) speechSynthesis.cancel();
  });
  window.JeevesAsistente = { abrir: abrir, cerrar: cerrar };
  if (/#asistente/.test(location.hash)) setTimeout(abrir, 400);
})();
