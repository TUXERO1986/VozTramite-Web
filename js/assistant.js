/**
 * VozTrámite · asistente (assistant.js)
 * - Voz real con la Web Speech API (reconocimiento y síntesis), con teclado como respaldo.
 * - Comprensión local de lo que dice la persona (intención, fecha, celular, agencia).
 * - Punto de enchufe para un servicio de IA: VT.assistant.endpoint (ver docs/README.md).
 */
(function (global) {
  "use strict";

  var VT = global.VT = global.VT || {};

  /* ----------------------------------------------------------- utilidades */
  function norm(s) {
    return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9ñ\s\/\-]/g, " ").replace(/\s+/g, " ").trim();
  }

  var UNI = { cero: 0, un: 1, uno: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9,
    diez: 10, once: 11, doce: 12, trece: 13, catorce: 14, quince: 15, dieciseis: 16, diecisiete: 17, dieciocho: 18, diecinueve: 19,
    veinte: 20, veintiun: 21, veintiuno: 21, veintidos: 22, veintitres: 23, veinticuatro: 24, veinticinco: 25, veintiseis: 26,
    veintisiete: 27, veintiocho: 28, veintinueve: 29 };
  var DEC = { treinta: 30, cuarenta: 40, cincuenta: 50, sesenta: 60, setenta: 70, ochenta: 80, noventa: 90 };
  var CEN = { cien: 100, ciento: 100, doscientos: 200, trescientos: 300, cuatrocientos: 400, quinientos: 500,
    seiscientos: 600, setecientos: 700, ochocientos: 800, novecientos: 900 };
  var MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  var MESES_LARGO = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

  function esNum(t) { return t in UNI || t in DEC || t in CEN || t === "mil"; }

  /* Convierte una corrida de palabras-número («mil novecientos sesenta y dos») a número */
  function palabrasANumero(tokens) {
    var total = 0, actual = 0;
    tokens.forEach(function (t) {
      if (t === "y") return;
      if (t === "mil") { total += (actual || 1) * 1000; actual = 0; }
      else if (t in CEN) actual += CEN[t];
      else if (t in DEC) actual += DEC[t];
      else if (t in UNI) actual += UNI[t];
    });
    return total + actual;
  }

  /* Reemplaza las corridas de palabras-número por cifras dentro de un texto */
  function numerosADigitos(texto) {
    var tk = norm(texto).split(" "), out = [], i = 0;
    while (i < tk.length) {
      if (esNum(tk[i])) {
        var run = [tk[i]], j = i + 1;
        while (j < tk.length && (esNum(tk[j]) || (tk[j] === "y" && j + 1 < tk.length && esNum(tk[j + 1])))) { run.push(tk[j]); j++; }
        out.push(String(palabrasANumero(run))); i = j;
      } else { out.push(tk[i]); i++; }
    }
    return out.join(" ");
  }

  /* ------------------------------------------------------------ análisis */
  function parseFecha(texto) {
    var t = norm(texto), d, m, y;
    var r = t.match(/(\d{1,2})\s*[\/\-]\s*(\d{1,2})\s*[\/\-]\s*(\d{4})/);
    if (r) { d = +r[1]; m = +r[2]; y = +r[3]; }
    else {
      var conDigitos = numerosADigitos(t);
      var mm = conDigitos.match(/(\d{1,2})\s+(?:de\s+)?([a-z]+)\s+(?:de\s+|del\s+)?(\d{4})/);
      if (mm) { d = +mm[1]; m = MESES.indexOf(mm[2]) + 1; y = +mm[3]; }
    }
    if (!d || !m || !y) return null;
    var f = new Date(y, m - 1, d);
    if (f.getFullYear() !== y || f.getMonth() !== m - 1 || f.getDate() !== d) return null;
    if (y < 1900 || y > new Date().getFullYear()) return null;
    return { iso: y + "-" + String(m).padStart(2, "0") + "-" + String(d).padStart(2, "0"),
      leido: d + " de " + MESES_LARGO[m - 1] + " de " + y };
  }

  var DIG = { cero: "0", uno: "1", un: "1", dos: "2", tres: "3", cuatro: "4", cinco: "5", seis: "6", siete: "7", ocho: "8", nueve: "9" };
  function parseCelular(texto) {
    var s = norm(texto).split(" ").map(function (w) { return w in DIG ? DIG[w] : w; }).join("");
    var digs = s.replace(/\D/g, "");
    if (/^9\d{8}$/.test(digs)) return { valor: digs, leido: digs.split("").join(" ") };
    return null;
  }

  function parseAgencia(texto, opciones) {
    var t = norm(texto);
    for (var i = 0; i < opciones.length; i++) if (t.indexOf(norm(opciones[i])) >= 0) return { valor: opciones[i], leido: "agencia de " + opciones[i] };
    return null;
  }

  function coincide(texto, aceptadas) {
    var t = " " + norm(texto) + " ";
    return aceptadas.some(function (a) { return t.indexOf(" " + norm(a) + " ") >= 0; });
  }

  /* Coincidencia por inicio de palabra: «antecedente» reconoce «antecedentes»; «ruc» no se cuela en «estructura» */
  function tiene(t, clave) { return (" " + t + " ").indexOf(" " + norm(clave)) >= 0; }
  function puntaje(t, o) {
    var p = 0;
    (o.fuertes || []).forEach(function (c) { if (tiene(t, c)) p += 3; });
    (o.claves || []).forEach(function (c) { if (tiene(t, c)) p += 1; });
    return p;
  }
  function interpretarTramite(texto) {
    var t = norm(texto);
    if (!t) return null;
    var mejor = null, puntos = 0;
    VT.TRAMITES.forEach(function (tr) { var p = puntaje(t, tr); if (p > puntos) { puntos = p; mejor = tr; } });
    return mejor;
  }
  /* Variante (p. ej. policial o penal) dicha dentro de la frase; null si no queda clara */
  function interpretarVariante(texto, tramite) {
    if (!tramite || !tramite.variantes) return null;
    var t = norm(texto), mejor = null, puntos = 0, empate = false;
    tramite.variantes.forEach(function (v) {
      var p = 0; (v.sin || []).forEach(function (c) { if (tiene(t, c)) p += norm(c).length; });
      if (p > puntos) { puntos = p; mejor = v; empate = false; } else if (p === puntos && p > 0) empate = true;
    });
    return empate ? null : mejor;
  }

  var SI = ["si", "claro", "correcto", "confirmo", "confirmar", "esta bien", "asi es", "ok", "dale", "acepto", "listo"];
  var NO = ["no", "corregir", "cambiar", "incorrecto", "esta mal", "otra vez"];
  function esSi(t) { return coincide(t, SI); }
  function esNo(t) { return coincide(t, NO) && !esSi(t); }

  /* Opción de una lista con sinónimos: gana la coincidencia más larga. Acepta cadenas u objetos {v, t, sin} */
  function parseOpcion(texto, opciones) {
    var t = norm(texto), mejor = null, puntos = 0, empate = false;
    (opciones || []).forEach(function (o) {
      var op = typeof o === "string" ? { v: o, t: o, sin: [] } : o, p = 0;
      [op.t].concat(op.sin || []).forEach(function (c) {
        var k = norm(c); if (!k) return;
        if (tiene(t, k) && (" " + t + " ").indexOf(" " + k) >= 0) p = Math.max(p, k.length);
      });
      if (p > puntos) { puntos = p; mejor = op; empate = false; } else if (p === puntos && p > 0) empate = true;
    });
    return mejor && !empate ? { valor: mejor.v, leido: mejor.t } : null;
  }

  function parseSiNo(texto) {
    var s = coincide(texto, SI), n = coincide(texto, NO);
    if (n && !s) return { valor: "no", leido: "No" };
    if (s && !n) return { valor: "si", leido: "Sí" };
    if (!s && !n && coincide(texto, ["tengo", "ya tengo", "tuve"])) return { valor: "si", leido: "Sí" };
    return null;
  }

  /* Correo: acepta «rosa@gmail.com» tal cual (teclado) o dictado: «arroba» → @, «punto» → «.», sin espacios */
  function parseCorreo(texto) {
    var t = String(texto || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
    t = t.replace(/^(mi |el )?(correo|email|e-mail)( electronico)?( es| seria)?[:,]?\s+/, "");
    t = t.replace(/\b(guion bajo|guion_bajo|subrayado)\b/g, "_").replace(/\bguion\b/g, "-")
      .replace(/\barroba\b/g, "@").replace(/\bpunto\b/g, ".")
      .replace(/\b(cero|uno|un|dos|tres|cuatro|cinco|seis|siete|ocho|nueve)\b/g, function (w) { return DIG[w]; })
      .replace(/\s+/g, "");
    if (/^[a-z0-9._%+\-]+@[a-z0-9\-]+(\.[a-z0-9\-]+)*\.[a-z]{2,}$/.test(t) && t.indexOf("..") < 0) return { valor: t, leido: t };
    return null;
  }

  /* Un solo punto de entrada: interpreta lo dicho según el tipo de pregunta. Devuelve {valor, leido} o null */
  function parsePregunta(q, texto) {
    switch (q.tipo) {
      case "fecha": var f = parseFecha(texto); return f ? { valor: f.iso, leido: f.leido } : null;
      case "celular": return parseCelular(texto);
      case "agencia": return parseAgencia(texto, q.opciones);
      case "opcion": return parseOpcion(texto, q.opciones);
      case "sino": return parseSiNo(texto);
      case "correo": return parseCorreo(texto);
    }
    return null;
  }
  /* Cómo se lee en voz alta un valor (el correo se deletrea con «arroba» y «punto») */
  function leerValor(q, v) {
    var x = (v && (v.leido || v.valor)) || "";
    if (q.tipo === "correo") return String(x).replace(/@/g, " arroba ").replace(/\./g, " punto ").replace(/_/g, " guion bajo ").replace(/-/g, " guion ");
    return x;
  }

  /* ------------------------------------------------- servicio de IA (opcional) */
  /* Privacidad: la IA SOLO recibe texto en el paso «tramite» y en las preguntas libres («Tengo una duda»).
   * Nunca durante identidad, datos ni confirmación, y nunca con los datos guardados: solo viaja {texto, contexto:{paso, tramiteId}}. */
  var API = { endpoint: (global.VT_CONFIG && global.VT_CONFIG.iaEndpoint) || null, timeoutMs: 6000 };
  var iaEstado = "sin-probar", escuchasIA = [];
  function setEstadoIA(e) { iaEstado = e; escuchasIA.forEach(function (f) { try { f(e); } catch (x) { /* nada */ } }); }
  /** "no-configurado" | "sin-probar" | "conectado" | "sin-respuesta" */
  function estadoIA() { return API.endpoint ? iaEstado : "no-configurado"; }

  /* Llama al servicio. Resuelve {tramiteId, respuesta} o null si no hay endpoint, no es un paso permitido o falló. */
  function llamarIA(texto, contexto, libre) {
    var paso = contexto && contexto.paso;
    if (!API.endpoint || navigator.onLine === false) return Promise.resolve(null);
    if (!(paso === "tramite" || libre === true)) return Promise.resolve(null);
    var ctl = ("AbortController" in global) ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctl) ctl.abort(); }, API.timeoutMs);
    return fetch(API.endpoint, {
      method: "POST", headers: { "Content-Type": "application/json" }, signal: ctl ? ctl.signal : undefined,
      body: JSON.stringify({ texto: String(texto || "").slice(0, 500), contexto: { paso: paso || null, tramiteId: (contexto && contexto.tramiteId) || null } })
    }).then(function (r) { if (!r.ok) throw new Error("http " + r.status); return r.json(); })
      .then(function (j) { clearTimeout(timer); setEstadoIA("conectado"); return { tramiteId: (j && j.tramiteId) || null, respuesta: (j && typeof j.respuesta === "string" && j.respuesta.trim()) ? j.respuesta.trim() : null }; })
      .catch(function () { clearTimeout(timer); setEstadoIA("sin-respuesta"); return null; });
  }

  /** Interpreta lo que dijo la persona al elegir el trámite. Usa la IA si está configurada y hay red;
   *  si falla, siempre responde con el análisis local (tolerancia a fallos). */
  function ask(texto, contexto) {
    var local = { fuente: "local", tramite: interpretarTramite(texto), respuesta: null };
    return llamarIA(texto, contexto, false).then(function (j) {
      if (!j) return local;
      var tr = j.tramiteId ? VT.TRAMITES.filter(function (x) { return x.id === j.tramiteId; })[0] : null;
      return { fuente: "ia", tramite: tr || local.tramite, respuesta: j.respuesta };
    });
  }

  /** Pregunta libre («Tengo una duda»). Resuelve {fuente:"ia"|"local"|"ninguna", respuesta}.
   *  opts.tramite: configuración del trámite activo, para buscar en sus requisitos si no hay IA. */
  function preguntar(texto, contexto, opts) {
    var cfg = opts && opts.tramite;
    // Por privacidad, una pregunta que parece traer datos personales nunca sale del equipo
    var personal = /\d{6,}|@/.test(String(texto || "").replace(/\s+/g, ""));
    var p = personal ? Promise.resolve(null) : llamarIA(texto, contexto, true);
    return p.then(function (j) {
      if (j && j.respuesta) return { fuente: "ia", respuesta: j.respuesta, tramiteId: j.tramiteId };
      var loc = respuestaLocal(texto, cfg);
      if (loc) return { fuente: "local", respuesta: loc };
      return { fuente: "ninguna", respuesta: "No tengo esa respuesta. Puedes confirmarlo en gob.pe.", personal: personal };
    });
  }

  var PARADAS = ["que", "como", "cual", "cuales", "cuanto", "cuanta", "donde", "para", "por", "una", "uno", "los", "las", "del", "con", "mis", "mas", "esta", "este", "eso", "esto", "hay", "tengo", "puedo", "necesito", "quiero", "sobre", "ser", "tiene", "tienen"];
  function claves(t) { return norm(t).split(" ").filter(function (w) { return w.length > 3 && PARADAS.indexOf(w) < 0; }); }
  /* Respuesta sin internet: busca en el glosario y en los datos del trámite activo. null si no encuentra nada */
  function respuestaLocal(texto, cfg) {
    var t = norm(texto); if (!t) return null;
    var ks = claves(texto);
    // 1) Datos del trámite: costo, vigencia, requisitos, canal
    if (cfg) {
      var nom = cfg.formal || cfg.nombre;
      if (/cuest|costo|cuanto (pago|cobr|vale|sale)|precio|pagar|tarifa/.test(t) && cfg.costo)
        return "El costo de «" + nom + "»: " + cfg.costo.t + (cfg.costo.ref ? " (referencial · confírmalo en gob.pe)." : " (según " + (cfg.costo.fuente || "la entidad") + ").");
      if (/vigen|dura|vence|cuanto tiempo|plazo|caduca/.test(t) && cfg.vigencia)
        return cfg.vigencia.t + (cfg.vigencia.ref ? " (referencial · confírmalo en gob.pe)." : ".");
      if (/requisit|necesit|llevar|documento|papeles/.test(t) && cfg.req)
        return "Para «" + nom + "» necesitas: " + cfg.req.slice(0, 3).map(function (r) { return r.t; }).join("; ") + ".";
      if (/donde|canal|presentar|en linea|oficina/.test(t) && cfg.canal) return "Puedes ver el canal oficial en " + cfg.canal + ".";
    }
    // 2) Glosario: el término aparece en la pregunta
    var g = VT.GLOSARIO.filter(function (x) {
      var base = norm(x.t.replace(/\s*\(.*\)\s*/, ""));
      return base && (" " + t + " ").indexOf(" " + base + " ") >= 0;
    }).sort(function (a, b) { return b.t.length - a.t.length; })[0];
    if (g) return g.t.replace(/\s*\(.*\)\s*/, "") + ": " + g.s + " " + g.e;
    // 3) Requisitos del trámite por palabras en común
    if (cfg && cfg.req && ks.length) {
      var mejor = null, pts = 0;
      cfg.req.forEach(function (r) { var rt = norm(r.t), p = ks.filter(function (k) { return rt.indexOf(k) >= 0; }).length; if (p > pts) { pts = p; mejor = r; } });
      if (mejor) return "Sobre eso: " + mejor.t + ".";
    }
    return null;
  }


  /* ----------------------------------------------------------------- voz */
  var SR = global.SpeechRecognition || global.webkitSpeechRecognition;
  var enArchivo = !!(global.location && global.location.protocol === "file:");
  var rec = null, voces = [], vozSilenciada = false, rate = 1;
  var permisoOk = false, cancelPend = false, noSpeech = 0, IDIOMA = "es-PE";

  var KEY_VOZ = "voztramite:voz:v1", escuchasVoces = [];
  function cargarVoces() {
    if (!("speechSynthesis" in global)) return;
    try { voces = global.speechSynthesis.getVoices() || []; } catch (e) { voces = []; }
  }
  function alCambiarVoces(f) { escuchasVoces.push(f); }
  if ("speechSynthesis" in global) {
    cargarVoces();
    global.speechSynthesis.onvoiceschanged = function () { cargarVoces(); escuchasVoces.forEach(function (f) { try { f(); } catch (e) { /* nada */ } }); };
  }

  var REGIONES = { "es-es": "España", "es-us": "Estados Unidos", "es-mx": "México", "es-pe": "Perú", "es-419": "Latinoamérica", "es-ar": "Argentina", "es-co": "Colombia",
    "es-cl": "Chile", "es-ve": "Venezuela", "es-uy": "Uruguay", "es-bo": "Bolivia", "es-ec": "Ecuador", "es-py": "Paraguay", "es-cr": "Costa Rica", "es-gt": "Guatemala",
    "es-cu": "Cuba", "es-do": "República Dominicana", "es-hn": "Honduras", "es-ni": "Nicaragua", "es-pa": "Panamá", "es-pr": "Puerto Rico", "es-sv": "El Salvador", "es": "español" };
  function langNorm(l) { return String(l || "").replace("_", "-").toLowerCase(); }
  function idVoz(v) { return v.voiceURI || (v.name + "|" + v.lang); }
  /* «Microsoft Helena - Spanish (Spain)» → «Helena»; «Google español de Estados Unidos» → «Google español» */
  function nombreLimpio(v) {
    var n = String(v.name || "").replace(/^Microsoft\s+/i, "").replace(/\s+-\s+.*$/, "").replace(/\s+Online\s*\(Natural\)/i, "").replace(/\s*\(.*$/, "")
      .replace(/\s+de\s+(Estados Unidos|España|México|Perú|Argentina|Colombia|Chile|Venezuela)$/i, "").trim();
    return n || v.name;
  }
  function etiquetaVoz(v) { var l = langNorm(v.lang); return nombreLimpio(v) + " · " + (REGIONES[l] || REGIONES[l.slice(0, 2)] || v.lang); }
  /* Voces en español disponibles: [{id, etiqueta, voz}] */
  function vocesEs() {
    cargarVoces();
    return voces.filter(function (v) { return langNorm(v.lang).indexOf("es") === 0; })
      .map(function (v) { return { id: idVoz(v), etiqueta: etiquetaVoz(v), voz: v }; })
      .sort(function (a, b) { return a.etiqueta.localeCompare(b.etiqueta, "es"); });
  }
  var NOMBRES_FEM = ["helena", "laura", "sabina", "dalia", "elvira", "paloma", "camila", "paulina", "monica", "google espanol de estados unidos", "google espanol"];
  /* Voz femenina por defecto: primero por nombre y, a igual nombre, es-PE > es-419/es-US/es-MX > es-ES. Si no hay, vozEs() */
  function vozPorDefecto() {
    var lista = vocesEs().map(function (x) { return x.voz; });
    function rango(v) { var l = langNorm(v.lang); return l.indexOf("es-pe") === 0 ? 0 : (l.indexOf("es-419") === 0 || l.indexOf("es-us") === 0 || l.indexOf("es-mx") === 0) ? 1 : l.indexOf("es-es") === 0 ? 2 : 3; }
    for (var i = 0; i < NOMBRES_FEM.length; i++) {
      var c = lista.filter(function (v) { return norm(v.name).indexOf(NOMBRES_FEM[i]) >= 0; }).sort(function (a, b) { return rango(a) - rango(b); });
      if (c.length) return c[0];
    }
    return vozEs();
  }
  function idVozGuardada() { try { var o = JSON.parse(localStorage.getItem(KEY_VOZ) || "null"); return o && o.id ? o.id : null; } catch (e) { return null; } }
  /* La voz que se usa: la elegida (si sigue disponible) o la femenina por defecto */
  function vozActual() {
    var id = idVozGuardada();
    if (id) { var h = vocesEs().filter(function (x) { return x.id === id; })[0]; if (h) return h.voz; }
    return vozPorDefecto();
  }
  function elegirVoz(id) { try { if (id) localStorage.setItem(KEY_VOZ, JSON.stringify({ id: id })); else localStorage.removeItem(KEY_VOZ); } catch (e) { /* almacenamiento bloqueado */ } }
  function etiquetaActual() { var v = vozActual(); return v ? etiquetaVoz(v) : null; }

  /* Mejor voz en español: es-PE primero y, si no hay, la mejor es-* disponible */
  function vozEs() {
    var pref = ["es-PE", "es-419", "es-MX", "es-US", "es-ES"];
    for (var i = 0; i < pref.length; i++) {
      var v = voces.filter(function (x) { return x.lang && x.lang.replace("_", "-").indexOf(pref[i]) === 0; })[0];
      if (v) return v;
    }
    return voces.filter(function (x) { return x.lang && x.lang.toLowerCase().indexOf("es") === 0; })[0] || null;
  }

  function speak(texto, o) {
    return new Promise(function (resolve) {
      var forzar = !!(o && o.forzar);
      if ((vozSilenciada && !forzar) || !("speechSynthesis" in global) || !texto) { resolve(); return; }
      try {
        global.speechSynthesis.cancel();
        var u = new SpeechSynthesisUtterance(texto);
        var v = vozActual(); if (v) { try { u.voice = v; } catch (e) { /* voz no válida */ } u.lang = v.lang; } else { u.lang = "es-PE"; }
        u.rate = rate;
        var hecho = false;
        function fin() { if (!hecho) { hecho = true; resolve(); } }
        u.onend = fin; u.onerror = fin;
        setTimeout(fin, Math.min(30000, 2500 + texto.length * 90)); // por si el navegador no avisa
        global.speechSynthesis.speak(u);
      } catch (e) { resolve(); }
    });
  }
  function cancelSpeech() { try { global.speechSynthesis && global.speechSynthesis.cancel(); } catch (e) { /* nada */ } }

  /* Mensajes por causa: título, explicación, ícono y si ofrece «Intentar de nuevo» */
  var MSG_VOZ = {
    "archivo": { t: "La voz no funciona desde un archivo", d: "Abre VozTrámite desde un servidor o desde la página publicada para usar la voz.", ic: "alert" },
    "no-soportado": { t: "Tu navegador no reconoce voz", d: "Tu navegador no reconoce voz. Usa Chrome o Edge, o escribe con el teclado.", ic: "x-circle" },
    "sin-permiso": { t: "El micrófono está bloqueado", d: "Toca el ícono del candado junto a la dirección, elige Permitir en Micrófono y vuelve a intentarlo.", ic: "mic-off", reintentar: true },
    "sin-red": { t: "La voz no pudo conectarse", d: "El reconocimiento de voz de tu navegador necesita internet o está bloqueado (por ejemplo en Brave). Usa Chrome o Edge, o el teclado.", ic: "wifi-off" },
    "sin-microfono": { t: "No encontré un micrófono", d: "No encontré un micrófono. Conecta uno y vuelve a intentarlo, o escribe con el teclado.", ic: "mic-off", reintentar: true },
    "no-escuche": { t: "No te escuché", d: "Acércate al micrófono e inténtalo otra vez.", ic: "alert", reintentar: true },
    "no-escuche-2": { t: "Sigo sin escucharte", d: "Prueba con el teclado: escribe tu respuesta y toca Enviar.", ic: "alert" },
    "sin-lectura": { t: "Tu navegador no lee en voz alta", d: "No puedo leerte las preguntas en este navegador. Puedes leerlas en pantalla.", ic: "mute" },
    "error": { t: "No pude usar la voz", d: "La voz falló. Inténtalo de nuevo o escribe con el teclado.", ic: "alert", reintentar: true }
  };
  function mensajeVoz(c) { return MSG_VOZ[c] || MSG_VOZ.error; }

  /* Pide permiso de micrófono de forma explícita y suelta el micrófono enseguida.
   * Resuelve "concedido" (o "omitido" si el navegador no ofrece getUserMedia). Rechaza con {codigo}. */
  function pedirPermiso() {
    return new Promise(function (resolve, reject) {
      var md = navigator.mediaDevices;
      if (!md || !md.getUserMedia) { resolve("omitido"); return; }
      md.getUserMedia({ audio: true }).then(function (stream) {
        try { stream.getTracks().forEach(function (t) { t.stop(); }); } catch (e) { /* nada */ }
        permisoOk = true; resolve("concedido");
      }, function (e) {
        var n = e && e.name;
        reject({ codigo: (n === "NotFoundError" || n === "DevicesNotFoundError" || n === "OverconstrainedError") ? "sin-microfono"
          : (n === "NotAllowedError" || n === "PermissionDeniedError" || n === "SecurityError") ? "sin-permiso" : "error" });
      });
    });
  }
  /* "concedido" | "denegado" | "sin-preguntar" | "desconocido" (la API de permisos no siempre existe) */
  function estadoPermiso() {
    return new Promise(function (resolve) {
      try {
        if (!navigator.permissions || !navigator.permissions.query) { resolve("desconocido"); return; }
        navigator.permissions.query({ name: "microphone" }).then(function (r) {
          resolve(r.state === "granted" ? "concedido" : r.state === "denied" ? "denegado" : "sin-preguntar");
        }, function () { resolve("desconocido"); });
      } catch (e) { resolve("desconocido"); }
    });
  }
  function compat() {
    return { archivo: enArchivo, reconocimiento: !!SR, lectura: ("speechSynthesis" in global) && ("SpeechSynthesisUtterance" in global), seguro: global.isSecureContext !== false };
  }

  /** Escucha una respuesta. Resuelve {texto}. Rechaza con {codigo, veces}.
   *  opts: onParcial(txt), onPidiendo() antes de pedir el permiso, onInicio() cuando ya escucha. */
  function listen(opts) {
    opts = opts || {};
    return new Promise(function (resolve, reject) {
      if (enArchivo) { reject({ codigo: "archivo" }); return; }
      if (!SR) { reject({ codigo: "no-soportado" }); return; }
      if (navigator.onLine === false) { reject({ codigo: "sin-red" }); return; }
      cancelSpeech(); cancelPend = false;
      if (permisoOk) { arrancar(IDIOMA); return; }
      if (opts.onPidiendo) opts.onPidiendo();
      pedirPermiso().then(function () {
        if (cancelPend) { reject({ codigo: "cancelado" }); return; }
        arrancar(IDIOMA);
      }, function (e) { reject({ codigo: e.codigo }); });

      function arrancar(lang) {
        var r, final = "", parcial = "", terminado = false, wd = null, wd2 = null;
        try { r = new SR(); } catch (e) { reject({ codigo: "error" }); return; }
        rec = r;
        r.lang = lang; r.interimResults = true; r.continuous = false; r.maxAlternatives = 1;
        function limpiar() { clearTimeout(wd); clearTimeout(wd2); }
        function sinTexto() { noSpeech++; reject({ codigo: "no-escuche", veces: noSpeech }); }
        r.onresult = function (ev) {
          parcial = "";
          for (var i = ev.resultIndex; i < ev.results.length; i++) {
            var tx = ev.results[i][0].transcript;
            if (ev.results[i].isFinal) final += tx; else parcial += tx;
          }
          if (opts.onParcial) opts.onParcial((final + " " + parcial).trim());
        };
        r.onerror = function (ev) {
          if (terminado) return;
          terminado = true; limpiar(); if (rec === r) rec = null;
          if (ev.error === "language-not-supported" && lang !== "es-ES") { IDIOMA = "es-ES"; arrancar("es-ES"); return; }
          var c = ev.error === "not-allowed" || ev.error === "service-not-allowed" ? "sin-permiso"
            : ev.error === "no-speech" ? "no-escuche" : ev.error === "network" ? "sin-red"
            : ev.error === "audio-capture" ? "sin-microfono" : ev.error === "aborted" ? "cancelado" : "error";
          if (c === "no-escuche") { sinTexto(); return; }
          if (c !== "cancelado") noSpeech = 0;
          reject({ codigo: c });
        };
        r.onend = function () {
          if (terminado) return;
          terminado = true; limpiar(); if (rec === r) rec = null;
          var txt = (final || parcial).trim();
          if (txt) { noSpeech = 0; resolve({ texto: txt }); } else sinTexto();
        };
        try { r.start(); } catch (e) { terminado = true; rec = null; reject({ codigo: "error" }); return; }
        if (opts.onInicio) opts.onInicio();
        // Perro guardián: si en ~10 s no llega onend se detiene; si aun así no responde, se cierra a la fuerza
        wd = setTimeout(function () {
          try { r.stop(); } catch (e) { /* nada */ }
          wd2 = setTimeout(function () {
            if (terminado) return;
            terminado = true; try { r.abort(); } catch (e) { /* nada */ } if (rec === r) rec = null;
            var txt = (final || parcial).trim();
            if (txt) { noSpeech = 0; resolve({ texto: txt }); } else sinTexto();
          }, 3000);
        }, 10000);
      }
    });
  }
  function stopListen() { cancelPend = true; try { rec && rec.stop(); } catch (e) { /* nada */ } }
  function abortListen() { cancelPend = true; try { rec && rec.abort(); } catch (e) { /* nada */ } }

  VT.assistant = {
    endpoint: API,
    soportaVoz: !!SR,
    enArchivo: enArchivo,
    soportaHabla: "speechSynthesis" in global,
    speak: speak, cancelSpeech: cancelSpeech, listen: listen, stopListen: stopListen, abortListen: abortListen,
    pedirPermiso: pedirPermiso, estadoPermiso: estadoPermiso, compat: compat, mensajeVoz: mensajeVoz, vozEs: vozEs,
    silenciar: function (v) { vozSilenciada = !!v; if (v) cancelSpeech(); },
    setRate: function (r) { rate = r; },
    ask: ask, preguntar: preguntar, respuestaLocal: respuestaLocal, estadoIA: estadoIA, alCambiarEstadoIA: function (f) { escuchasIA.push(f); },
    vocesEs: vocesEs, vozActual: vozActual, vozPorDefecto: vozPorDefecto, elegirVoz: elegirVoz, idVozActual: function () { var v = vozActual(); return v ? idVoz(v) : ""; },
    etiquetaVozActual: etiquetaActual, alCambiarVoces: alCambiarVoces,
    interpretarTramite: interpretarTramite, interpretarVariante: interpretarVariante,
    parseOpcion: parseOpcion, parseSiNo: parseSiNo, parseCorreo: parseCorreo, parsePregunta: parsePregunta, leerValor: leerValor,
    parseFecha: parseFecha, parseCelular: parseCelular, parseAgencia: parseAgencia,
    coincide: coincide, esSi: esSi, esNo: esNo, norm: norm
  };
})(window);
