/**
 * VozTrámite · lógica de la landing (main.js)
 * Flujo del asistente: Trámite → Requisitos → Identidad → Datos → Confirmación → Constancia.
 * La trazabilidad con las historias de usuario vive en los atributos data-hu y en docs/trazabilidad-hu.md.
 */
(function (global) {
  "use strict";

  var VT = global.VT, A = VT.assistant;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function ic(n, w) { return '<svg width="' + (w || 22) + '" height="' + (w || 22) + '" aria-hidden="true" focusable="false"><use href="#i-' + n + '"/></svg>'; }

  var PASOS = [
    { id: "tramite", t: "Trámite" }, { id: "requisitos", t: "Requisitos" }, { id: "identidad", t: "Identidad" },
    { id: "datos", t: "Datos" }, { id: "confirmacion", t: "Confirmación" }, { id: "constancia", t: "Constancia" }
  ];
  var SIGUIENTE = { tramite: "revisar requisitos", requisitos: "verificar tu identidad", identidad: "responder tus datos", datos: "confirmar tus datos", confirmacion: "recibir tu constancia", constancia: "llevar tu constancia a la agencia" };

  /* ------------------------------------------------------------- estado */
  var KEY = "voztramite:landing:v1";
  function inicial() {
    return { step: "tramite", tramiteId: null, traducido: false, req: [], reqTodos: false,
      idFase: "intro", idIdx: 0, idIntentos: 0, idOrden: [0, 1],
      variante: null, idInfo: null, datoIdx: 0, datos: {}, datoIntentos: 0, conf: {}, confIdx: 0, corrigiendo: null,
      codigo: null, emitido: null, cola: [], retomado: false,
      privado: false, simple: false, texto: "normal", contraste: "normal", ligero: false, voz: true, teclado: false };
  }
  var S;
  try { S = Object.assign(inicial(), JSON.parse(localStorage.getItem(KEY) || "{}")); } catch (e) { S = inicial(); }
  function guardar() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* almacenamiento lleno o bloqueado */ } }

  /* Perfil e historial: solo en localStorage de este equipo, nada sale del navegador */
  var KEY_P = "voztramite:perfil:v1", KEY_H = "voztramite:historial:v1";
  function leer(k, def) { try { var v = JSON.parse(localStorage.getItem(k) || "null"); return v == null ? def : v; } catch (e) { return def; } }
  function escribir(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* almacenamiento lleno o bloqueado */ } }
  var PERFIL = leer(KEY_P, { nombre: "" }); if (!PERFIL || typeof PERFIL.nombre !== "string") PERFIL = { nombre: "" };
  var HIST = leer(KEY_H, []); if (!Array.isArray(HIST)) HIST = [];
  var FILTRO = "todos", vozFallo = null;

  /* ---------------------------------------------------------- conexión */
  var CONN = { nivel: "buena", origen: "auto", ligeroRechazado: false };
  var CONN_TXT = {
    buena: { chip: "ok", ic: "wifi", t: "Conexión buena", d: "Todo funciona con normalidad." },
    regular: { chip: "warn", ic: "wifi", t: "Conexión regular", d: "Puede tardar un poco. El modo ligero ayuda." },
    debil: { chip: "err", ic: "wifi", t: "Conexión débil", d: "La voz puede fallar. Puedes escribir y seguir." },
    sin: { chip: "err", ic: "wifi-off", t: "Sin conexión", d: "Tu avance está guardado en este equipo." }
  };
  function nivelAuto() {
    if (navigator.onLine === false) return "sin";
    var c = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (c) {
      if (c.saveData) return "regular";
      if (c.effectiveType === "slow-2g" || c.effectiveType === "2g") return "debil";
      if (c.effectiveType === "3g") return "regular";
    }
    return "buena";
  }
  function setConn(nivel, origen) {
    var cambio = CONN.nivel !== nivel;
    CONN.nivel = nivel; CONN.origen = origen || CONN.origen;
    var m = CONN_TXT[nivel];
    $$(".js-chip-conn").forEach(function (chip) {
      chip.classList.remove("ok", "warn", "err"); if (m.chip) chip.classList.add(m.chip);
      chip.innerHTML = ic(m.ic, 18) + '<span class="ct">' + m.t + "</span>";
      if (chip.tagName === "A") chip.setAttribute("aria-label", m.t + ". Abrir Conexión");
    });
    $("#conn-lado").innerHTML = '<span class="chip ' + m.chip + '">' + ic(m.ic, 18) + m.t + "</span><br><span class='muted'>" + m.d + "</span>";
    $$("[data-conn]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-conn") === nivel)); });
    $("#conn-auto").textContent = origen === "manual" ? "Estás probando una señal simulada." : "Detección automática de tu navegador.";
    if (cambio) {
      if (nivel === "sin") toast("Sin señal. Tu avance queda guardado en este equipo.");
      else if (CONN.prev === "sin") sincronizar();
      CONN.ligeroRechazado = false;
    }
    CONN.prev = nivel;
    if (S && $("#conv-body")) render(true);
    pintarGuardado();
  }
  function sincronizar() {
    var n = S.cola.length;
    if (n) { S.cola = []; guardar(); toast("Volvió la señal: se sincronizaron " + n + " respuestas guardadas."); }
    else toast("Volvió la señal.");
  }
  window.addEventListener("online", function () { if (CONN.origen === "auto") setConn(nivelAuto(), "auto"); });
  window.addEventListener("offline", function () { if (CONN.origen === "auto") setConn("sin", "auto"); });
  var nc = navigator.connection; if (nc && nc.addEventListener) nc.addEventListener("change", function () { if (CONN.origen === "auto") setConn(nivelAuto(), "auto"); });

  function bannerConexion() {
    var r = retomadoAviso();
    return r + bannerRed() + (S.step === "constancia" ? "" : bannerVoz());
  }
  /* Problema de voz (navegador sin reconocimiento, archivo local o fallo reciente): ícono + texto + color y salida por teclado */
  function alertaVoz(m, acciones) {
    return '<div class="alerta err" role="alert" data-hu="HU-030" data-voz="1">' + ic(m.ic) + "<div><b class=t>" + esc(m.t) + "</b>" + esc(m.d) +
      (acciones ? '<div class="acciones">' + (m.reintentar ? '<button class="btn btn-primary" data-acc="voz-reintentar">Intentar de nuevo</button>' : "") +
        '<button class="btn btn-outline" data-acc="teclado">' + ic("keyboard", 20) + "Escribir con el teclado</button></div>" : "") + "</div></div>";
  }
  function causaVoz() { return vozFallo || (!A.soportaVoz ? "no-soportado" : A.enArchivo ? "archivo" : null); }
  function bannerVoz() { var c = causaVoz(); return c ? alertaVoz(A.mensajeVoz(c), true) : ""; }
  function bannerRed() {
    if (CONN.nivel === "sin")
      return '<div class="alerta err" data-hu="HU-037">' + ic("wifi-off") + '<div><b class=t>Sin conexión</b>Tu avance está guardado. Puedes seguir escribiendo con el teclado; lo que respondas se sincroniza cuando vuelva la señal.</div></div>';
    if ((CONN.nivel === "regular" || CONN.nivel === "debil") && !S.ligero && !CONN.ligeroRechazado)
      return '<div class="alerta warn" data-hu="HU-009">' + ic("alert") + '<div><b class=t>Tu conexión está ' + (CONN.nivel === "debil" ? "débil" : "regular") + '</b>¿Quieres activar el modo ligero? Quita imágenes pesadas y animaciones.<div class="acciones"><button class="btn btn-primary" data-acc="ligero-si">Activar modo ligero</button><button class="btn btn-ghost" data-acc="ligero-no">Ahora no</button></div></div></div>';
    if (S.ligero && CONN.nivel !== "buena")
      return '<div class="alerta" data-hu="HU-009">' + ic("info") + "<div><b class=t>Modo ligero activado</b>Estás usando la versión liviana por tu señal.</div></div>";
    return "";
  }

  /* -------------------------------------------------------------- utilidades UI */
  var tToast;
  function toast(msg) {
    var t = $("#toast"); t.textContent = msg; t.hidden = false;
    clearTimeout(tToast); tToast = setTimeout(function () { t.hidden = true; }, 4500);
  }
  var interactuo = false;
  function hablar(texto) { if (interactuo && S.voz) return A.speak(texto); return Promise.resolve(); }
  function estado(tipo, txt) {
    var c = $("#chip-estado"), m = { listo: ["", "mic"], escuchando: ["warn", "mic"], procesando: ["", "repeat"], ok: ["ok", "check-circle"], error: ["err", "alert"], sin: ["err", "wifi-off"] }[tipo];
    c.className = "chip " + m[0]; c.innerHTML = ic(m[1], 18) + "<span>" + esc(txt) + "</span>";
  }
  function ondas(modo) { var o = $("#onda-hero"); if (o) o.className = "onda" + (modo ? "" : " quieta"); }
  function tr() { return VT.TRAMITES.filter(function (t) { return t.id === S.tramiteId; })[0]; }
  /* Configuración efectiva del trámite elegido: la base más su variante (p. ej. policial o penal) */
  function cf() {
    var t = tr(); if (!t) return null;
    var v = (t.variantes || []).filter(function (x) { return x.id === S.variante; })[0];
    return v ? Object.assign({}, t, v, { nombre: t.nombre }) : t;
  }
  function actual() { return cf() || VT.TRAMITES[0]; }
  function DAT() { return actual().datos; }
  function REQ() { return actual().req; }
  function nombrePaso(i) { var t = cf(); return ((t && t.pasos) || VT.PASOS_BASE)[i]; }
  function irA(paso) { S.step = paso; modoDuda = false; RESP = null; guardar(); render(); var b = $("#conv-body"); if (b) b.focus({ preventScroll: true }); }
  function enmascarar(v) { return S.privado ? '<span class="privado-mask" aria-label="dato oculto">••••••</span>' : esc(v); }

  /* --------------------------------------------------- progreso y lateral */
  function pintarProgreso() {
    var idx = PASOS.map(function (p) { return p.id; }).indexOf(S.step);
    $("#progreso").innerHTML = PASOS.map(function (p, i) {
      var cl = i < idx ? "ok" : i === idx ? "act" : "";
      return '<li class="' + cl + '"' + (i === idx ? ' aria-current="step"' : "") + '><span class="dot">' + (i < idx ? ic("check", 16) : i + 1) + '</span><span class="lbl">' + nombrePaso(i) + "</span></li>";
    }).join("");
    var h1 = $("#h-asist"); if (h1) h1.textContent = (tr() && tr().titulo) || "Prepara tu trámite";
    $("#barra").style.width = Math.round((idx / (PASOS.length - 1)) * 100) + "%";
    $("#conv-title").textContent = "Paso " + (idx + 1) + " de " + PASOS.length + ": " + nombrePaso(idx);
  }
  function ejemplo(txt) { $("#ejemplo").innerHTML = txt; }

  function hayAvance() { return S.step !== "tramite" || !!S.tramiteId; }
  function pasoTxt() {
    var idx = PASOS.map(function (p) { return p.id; }).indexOf(S.step);
    return "Paso " + (idx + 1) + " de " + PASOS.length + ": " + nombrePaso(idx);
  }
  /* «Lo que voy entendiendo»: resumen de lo que la persona ya dijo (respeta el modo privado) */
  function pintarEntendiendo() {
    var el = $("#entendiendo"); if (!el) return;
    var t = cf(), f = [];
    if (t) f.push(["Trámite", esc(t.formal || t.nombre)]);
    if (t && t.datos) t.datos.forEach(function (q) {
      var v = S.datos[q.id]; if (!v || !(v.leido || v.valor)) return;
      var x = txtDato(q, v);
      f.push([q.etEnt || q.etiqueta, q.privado ? enmascarar(x) : esc(x)]);
    });
    el.innerHTML = f.length ? '<ul class="entiende">' + f.map(function (x) { return '<li><span class="k">' + x[0] + '</span><span class="v">' + x[1] + "</span></li>"; }).join("") + "</ul>"
      : '<p class="muted" style="margin:6px 0 0">Cuando me respondas, lo verás aquí.</p>';
  }
  /* Inicio: tarjeta «Continúa donde quedaste» (D08/M16) */
  function pintarContinuar() {
    var c = $("#card-continuar"); if (!c) return;
    c.hidden = !hayAvance();
    if (hayAvance()) $("#continuar-txt").textContent = pasoTxt() + ". Tu avance está guardado en este equipo.";
  }
  /* Conexión: avance guardado y pendientes (D07/D08) */
  function pintarGuardado() {
    var el = $("#conn-guardado"); if (!el) return;
    var n = S.cola.length;
    el.innerHTML = '<ul class="side-list"><li>' + ic("save") + "<span>" + (hayAvance() ? "Avance guardado: <b>" + esc(pasoTxt()) + "</b>." : "Aún no empiezas un trámite.") + "</span></li>" +
      "<li>" + ic(n ? "clock" : "check-circle") + "<span>" + (n ? "<b>" + n + "</b> respuesta" + (n > 1 ? "s" : "") + " por sincronizar cuando vuelva la señal." : "No tienes respuestas pendientes de sincronizar.") + "</span></li></ul>" +
      (hayAvance() ? '<a class="btn btn-outline" href="#/tramite" style="margin-top:12px">Continuar mi trámite</a>' : "");
  }

  /* ------------------------------------------------------ términos (glosario) */
  function conTerminos(html) {
    return html.replace(/\[\[(.+?)\]\]/g, function (_, t) { return '<button class="term" data-term="' + esc(t) + '">' + esc(t) + "</button>"; });
  }
  function terminoInfo(t) {
    var g = VT.GLOSARIO.filter(function (x) { return A.norm(x.t) === A.norm(t); })[0];
    if (!g) return "";
    return '<div class="alerta" data-hu="HU-023" id="info-termino">' + ic("info") + "<div><b class=t>" + esc(g.t) + "</b>" + esc(g.s) + " <i>" + esc(g.e) + '</i><div class="acciones"><button class="btn btn-outline" data-acc="cerrar-termino">Entendido</button></div></div></div>';
  }

  /* ------------------------------------------------------------ campo de texto */
  function vozPosible() { return A.soportaVoz && !A.enArchivo; }
  function mostrarTeclado() { return S.teclado || !vozPosible() || CONN.nivel === "sin" || CONN.nivel === "debil"; }
  function formRespuesta(etiqueta, ph, tipo, forzar) {
    if (!forzar && !mostrarTeclado()) return "";
    return '<form class="inline-form" id="form-resp" novalidate data-hu="HU-039"><div class="campo"><label for="resp">' + esc(etiqueta) + '</label><input id="resp" name="resp" type="' + (tipo || "text") + '" autocomplete="off" placeholder="' + esc(ph || "") + '" aria-describedby="resp-err" /><span class="error" id="resp-err" role="alert"></span></div><button class="btn btn-primary" type="submit" style="margin-top:34px">Enviar</button></form>';
  }
  function errorCampo(msg) { var e = $("#resp-err"); if (e) { e.textContent = msg; var i = $("#resp"); if (i) { i.setAttribute("aria-invalid", "true"); i.focus(); } } }
  function eco(txt) {
    return '<div class="eco" id="eco" data-hu="HU-010"><span class="lab">Lo que escuché</span><div class="txt" id="eco-txt">' + (txt ? esc(txt) : '<span class="muted">Toca Hablar y responde cuando quieras.</span>') + "</div></div>";
  }
  function setEco(t) { var e = $("#eco-txt"); if (e) e.textContent = t; }

  /* ---------------------------------------- respuesta del asistente (burbuja) */
  var RESP = null, modoDuda = false;   // RESP: {paso, pendiente, texto, ia}
  function bloqueRespuesta() {
    if (!RESP || RESP.paso !== S.step) return "";
    if (RESP.pendiente) return '<div class="alerta" role="status" aria-live="polite" id="pensando" data-hu="HU-030">' + ic("repeat") + "<div><b class=t>Pensando…</b>Un momento, estoy buscando la respuesta.</div></div>";
    return '<div class="burbuja' + (RESP.ia ? " ia" : "") + '" id="burbuja" data-hu="HU-026"><span class="b-ico" aria-hidden="true">' + ic("message") + "</span><div><p class=\"b-txt\">" + esc(RESP.texto) + "</p>" +
      (RESP.ia ? '<small class="ia-tag" id="ia-tag">' + ic("sparkles", 16) + "Respuesta generada con IA · puede equivocarse</small>" : "") + "</div></div>";
  }
  function costoTxt(c) { return esc(c.t) + (c.ref ? ' <span class="ref">referencial · confírmalo en gob.pe</span>' : (c.fuente ? " <span class=\"ref\">según " + esc(c.fuente) + "</span>" : "")); }

  /* ----------------------------------------------------------- pasos (render) */
  var VISTAS = {};

  function bloqueVariante() {
    var t = tr(); if (!t || !t.variantes || S.variante) return "";
    return '<div class="alerta" role="group" aria-label="Tipo de certificado" data-hu="HU-015">' + ic("help") + "<div><b class=t>" + esc(t.variantePregunta) + "</b>" + esc(t.varianteAyuda) +
      '<div class="acciones">' + t.variantes.map(function (v) { return '<button class="btn btn-primary" type="button" data-variante="' + v.id + '">' + esc(v.nombre) + " · " + esc(v.detalle) + "</button>"; }).join("") + "</div></div></div>";
  }
  VISTAS.tramite = function () {
    ejemplo("«Quiero renovar mi DNI», «necesito mis antecedentes» o «quiero sacar mi RUC».");
    var h = bannerConexion();
    h += '<h3 class="pregunta">¿Qué trámite quieres hacer?</h3><p class="ayuda">Dímelo con tus palabras o elige uno de la lista.</p>';
    h += eco(S.ultimoDicho);
    h += bloqueRespuesta();
    h += '<ul class="opciones" data-hu="HU-015">' + VT.TRAMITES.map(function (t) {
      var sel = S.tramiteId === t.id;
      return '<li><button class="opcion' + (sel ? " sel" : "") + '" data-tramite="' + t.id + '" aria-pressed="' + sel + '"><span class="ico">' + ic(t.icono) + "</span><span><b>" + esc(t.nombre) + "</b><small>" + esc(t.entidad) + (t.activo ? "" : " · Próximamente") + "</small></span></button></li>";
    }).join("") + "</ul>";
    if (S.msgTramite) h += S.msgTramite;
    h += bloqueVariante();
    h += formRespuesta("O escribe aquí lo que necesitas", "Por ejemplo: quiero renovar mi DNI");
    return h;
  };
  VISTAS.tramite.hablar = "¿Qué trámite quieres hacer? Dímelo con tus palabras o elige uno de la lista.";

  function retomadoAviso() {
    if (!S.retomado) return "";
    return '<div class="alerta ok" data-hu="HU-032">' + ic("check-circle") + '<div><b class=t>Retomaste donde quedaste</b>Tu avance estaba guardado en este equipo.</div></div>';
  }

  /* Un requisito con su término del glosario resaltado (botón [data-term]) */
  function reqHtml(r) {
    var s = esc(r.t);
    if (r.g) s = s.replace(esc(r.g), '<button class="term" data-term="' + esc(r.gt || r.g) + '">' + esc(r.g) + "</button>");
    return s;
  }
  VISTAS.requisitos = function () {
    var t = actual(), req = REQ();
    ejemplo("Marca lo que ya tienes. Puedes seguir aunque te falte algo y volver después.");
    var lista = S.reqTodos ? req : req.slice(0, 3);
    var h = bannerConexion();
    h += '<h3 class="pregunta">Para «' + esc(t.formal || t.nombre) + '», ten a la mano:</h3><p class="ayuda">Es una lista corta. ¿Qué ya tienes?</p>';
    h += '<ul class="checklist" data-hu="HU-031">' + lista.map(function (r, i) {
      return '<li><label><input type="checkbox" data-req="' + i + '"' + (S.req.indexOf(i) >= 0 ? " checked" : "") + " /><span>" + reqHtml(r) + "</span></label></li>";
    }).join("") + "</ul>";
    if (!S.reqTodos && req.length > 3) h += '<button class="btn btn-ghost" data-acc="req-todos" style="margin-top:8px">Ver los ' + req.length + " requisitos</button>";
    h += '<div id="slot-termino"></div>';
    if (t.costo || t.vigencia) {
      h += '<div class="alerta" data-hu="HU-031" id="costo-vig">' + ic("info") + "<div>" + (t.costo ? "<b class=t>Costo</b>" + costoTxt(t.costo) : "") +
        (t.vigencia ? "<b class=t" + (t.costo ? ' style="margin-top:8px"' : "") + ">Vigencia</b>" + esc(t.vigencia.t) + (t.vigencia.ref ? ' <span class="ref">referencial · confírmalo en gob.pe</span>' : "") : "") + "</div></div>";
    }
    var info = (t.identidad || {}).modo === "info";
    h += '<div class="alerta" data-hu="HU-034">' + ic("arrow-r") + "<div><b class=t>Después: " + (info ? "validar tu identidad" : "verificar tu identidad") + "</b>" + (info ? "Te explico cómo la valida la entidad y te hago una pregunta." : "Te haré dos preguntas sencillas para protegerte.") + "</div></div>";
    h += '<div style="margin-top:20px;display:flex;gap:10px;flex-wrap:wrap"><button class="btn btn-primary" data-acc="continuar">Continuar</button><button class="btn btn-outline" data-acc="atras">Atrás</button></div>';
    return h;
  };
  VISTAS.requisitos.hablar = function () {
    var t = actual();
    if (t.hablarReq) return t.hablarReq;
    return "Para este trámite necesitas: " + REQ().slice(0, 3).map(function (r) { return r.t; }).join(", ") + ". Marca lo que ya tienes y di continuar.";
  };

  function vistaIdentidadInfo(t, idc) {
    var h = bannerConexion();
    var expl = esc(idc.explica);
    if (idc.term) expl = expl.replace(esc(idc.term), '<button class="term" data-term="' + esc(idc.term) + '">' + esc(idc.term) + "</button>");
    if (S.idFase === "ok") {
      var si = S.idInfo === "si";
      ejemplo("Ya puedes continuar con tus datos.");
      h += '<div class="alerta ok" role="status" data-hu="HU-021">' + ic("check-circle") + "<div><b class=t>" + (si ? "Anotado: ya tienes Clave SOL" : "Anotado: aún no tienes Clave SOL") + "</b>" + esc(si ? idc.si : idc.no) + "</div></div>";
      h += '<div id="slot-termino"></div>';
      h += '<div class="alerta" data-hu="HU-034">' + ic("arrow-r") + "<div><b class=t>Después: responder tus datos</b>Son " + DAT().length + " preguntas, una por una.</div></div>";
      h += '<div style="margin-top:20px;display:flex;gap:10px;flex-wrap:wrap"><button class="btn btn-primary" data-acc="continuar">Continuar</button><button class="btn btn-outline" data-acc="id-cambiar">Cambiar mi respuesta</button></div>';
      return h;
    }
    ejemplo("Responde " + esc(idc.ejemplo) + ".");
    h += '<h3 class="pregunta" data-hu="HU-017">' + esc(idc.titulo) + '</h3><p class="ayuda" data-hu="HU-018">' + expl + "</p>";
    h += '<div id="slot-termino"></div>';
    h += '<p class="eyebrow" style="margin:20px 0 0" data-hu="HU-013">Una pregunta</p><h3 class="pregunta" data-hu="HU-012">' + esc(idc.pregunta) + "</h3>";
    h += eco(S.ultimoDicho);
    h += '<div class="opciones" style="grid-template-columns:repeat(auto-fill,minmax(130px,1fr))"><button class="opcion" data-idsino="si"><span><b>Sí</b></span></button><button class="opcion" data-idsino="no"><span><b>No</b></span></button></div>';
    h += formRespuesta("Tu respuesta", "Sí o no");
    h += '<div style="margin-top:20px"><button class="btn btn-outline" data-acc="atras">Atrás</button></div>';
    return h;
  }
  VISTAS.identidad = function () {
    var t = actual(), idc = t.identidad || { modo: "biograficas" };
    if (idc.modo === "info") return vistaIdentidadInfo(t, idc);
    var h = bannerConexion();
    if (S.idFase === "intro") {
      ejemplo("Responde con los datos que te voy mostrando.");
      h += '<h3 class="pregunta">Primero, verifico que eres tú</h3><p class="ayuda" data-hu="HU-017">Te haré <b>2 preguntas</b> que solo tú sabrías. No necesitas lector de tarjeta ni claves. Si te equivocas, puedes intentar de nuevo.</p>';
      h += '<div class="alerta" data-hu="HU-018">' + ic("id") + "<div><b class=t>¿Tengo DNI electrónico?</b>El <button class='term' data-term='DNI electrónico (DNIe)'>DNI electrónico</button> tiene un chip y sirve para comprobar quién eres por internet. <b>Aquí no lo necesitas</b>: basta con responder tus preguntas.</div></div>";
      h += '<div id="slot-termino"></div>';
      h += '<div style="margin-top:20px;display:flex;gap:10px;flex-wrap:wrap"><button class="btn btn-primary" data-acc="id-empezar">Empezar</button><button class="btn btn-outline" data-acc="atras">Atrás</button></div>';
      return h;
    }
    if (S.idFase === "ok") {
      ejemplo("Ya puedes continuar con tus datos.");
      h += '<div class="alerta ok" role="status" data-hu="HU-021">' + ic("check-circle") + "<div><b class=t>Identidad verificada</b>Listo, ya sé que eres tú. Sigamos con tus datos.</div></div>";
      h += '<div class="alerta" data-hu="HU-034">' + ic("arrow-r") + "<div><b class=t>Después: responder tus datos</b>Son " + DAT().length + " preguntas, una por una.</div></div>";
      h += '<div style="margin-top:20px"><button class="btn btn-primary" data-acc="continuar">Continuar</button></div>';
      return h;
    }
    var q = VT.PREGUNTAS_ID[S.idOrden[S.idIdx]];
    ejemplo(esc(q.pista));
    var restan = 2 - S.idIntentos;
    h += '<p class="eyebrow" style="margin:0" data-hu="HU-013">Pregunta ' + (S.idIdx + 1) + " de 2</p>";
    h += '<h3 class="pregunta" data-hu="HU-012">' + esc(q.pregunta) + '</h3><p class="ayuda">Responde con la voz o escribe. Ejemplo: ' + esc(q.ejemplo) + "</p>";
    h += eco(S.ultimoDicho);
    if (S.idFase === "error") {
      h += '<div class="alerta err" role="alert" data-hu="HU-014">' + ic("x-circle") + "<div><b class=t>Esa respuesta no coincide</b>" + (restan > 0 ? "Te quedan " + restan + " intento" + (restan > 1 ? "s" : "") + ". Tómate tu tiempo." : "Probemos otra forma.") +
        '<div class="acciones"><button class="btn btn-outline" data-acc="repetir">Repetir pregunta</button><button class="btn btn-outline" data-acc="teclado">Escribir en vez de hablar</button></div></div></div>';
    }
    if (S.idFase === "bloqueo") {
      h += '<div class="alerta warn" role="alert" data-hu="HU-014">' + ic("alert") + "<div><b class=t>No pude verificar esa respuesta</b>No pasa nada. Elige cómo seguir:" +
        '<div class="acciones"><button class="btn btn-primary" data-acc="id-reintentar">Intentar otra vez</button><button class="btn btn-outline" data-acc="id-pista">Ver la pista</button><button class="btn btn-outline" data-acc="atras">Salir y guardar mi avance</button></div></div></div>';
    }
    h += formRespuesta("Tu respuesta", "Escribe aquí");
    return h;
  };
  VISTAS.identidad.hablar = function () {
    var idc = actual().identidad || {};
    if (idc.modo === "info") return S.idFase === "ok" ? (S.idInfo === "si" ? idc.si : idc.no) : idc.explica + " " + idc.pregunta;
    if (S.idFase === "intro") return "Primero verifico que eres tú. Te haré dos preguntas sencillas. No necesitas lector de tarjeta ni claves.";
    if (S.idFase === "ok") return "Listo, tu identidad quedó verificada. Sigamos con tus datos.";
    return VT.PREGUNTAS_ID[S.idOrden[S.idIdx]].pregunta;
  };

  var SINO = [{ v: "si", t: "Sí" }, { v: "no", t: "No" }];
  function opcionesDe(q) {
    if (q.tipo === "sino") return SINO;
    return (q.opciones || []).map(function (o) { return typeof o === "string" ? { v: o, t: o } : o; });
  }
  function txtDato(q, v) { v = v || {}; return q.tipo === "agencia" ? (v.valor || "") : (v.leido || v.valor || ""); }

  VISTAS.datos = function () {
    var D = DAT(), q = D[S.datoIdx];
    ejemplo("Puedes decir: " + esc(q.ejemplo));
    var h = bannerConexion();
    h += '<p class="eyebrow" style="margin:0">Dato ' + (S.datoIdx + 1) + " de " + D.length + "</p>";
    h += '<h3 class="pregunta" data-hu="HU-042">' + esc(q.pregunta) + '</h3><p class="ayuda" data-hu="HU-027">' + esc(q.ayuda) + " Ejemplo: " + esc(q.ejemplo) + ".</p>";
    h += eco(S.ultimoDicho);
    if (q.tipo === "agencia") h += '<div class="opciones" style="grid-template-columns:repeat(auto-fill,minmax(130px,1fr))">' + q.opciones.map(function (o) { return '<button class="opcion" data-agencia="' + esc(o) + '"><span><b>' + esc(o) + "</b></span></button>"; }).join("") + "</div>";
    else if (q.tipo === "opcion" || q.tipo === "sino") h += '<div class="opciones" role="group" aria-label="' + esc(q.etiqueta) + '" style="grid-template-columns:repeat(auto-fill,minmax(150px,1fr))">' + opcionesDe(q).map(function (o) { return '<button class="opcion" data-opcion="' + esc(o.v) + '"><span><b>' + esc(o.t) + "</b></span></button>"; }).join("") + "</div>";
    if (S.msgDato) h += S.msgDato;
    h += formRespuesta("Tu respuesta", q.tipo === "celular" ? "9 números" : q.tipo === "correo" ? "nombre@correo.com" : "Escribe aquí", q.tipo === "celular" ? "tel" : q.tipo === "correo" ? "email" : "text");
    h += '<div class="alerta" data-hu="HU-034" style="margin-top:20px">' + ic("arrow-r") + "<div><b class=t>Después: " + (S.datoIdx < D.length - 1 ? "tu siguiente dato" : "confirmar tus datos") + "</b>Yo te leeré cada dato antes de continuar.</div></div>";
    return h;
  };
  VISTAS.datos.hablar = function () { var q = DAT()[S.datoIdx]; return q.pregunta + " " + q.ayuda; };

  var NUM = ["cero", "un", "dos", "tres", "cuatro", "cinco", "seis"];
  VISTAS.confirmacion = function () {
    var D = DAT();
    ejemplo("Di «sí» para confirmar el dato que te leí, o «corregir» para cambiarlo.");
    var todos = D.every(function (q) { return S.conf[q.id]; });
    var h = bannerConexion();
    h += '<h3 class="pregunta">Revisemos tus datos</h3><p class="ayuda">Confirma cada dato. Si algo está mal, corrígelo.</p>';
    h += '<ul class="resumen" data-hu="HU-028">' + D.map(function (q, i) {
      var ok = !!S.conf[q.id], v = S.datos[q.id] || {};
      var foco = !ok && i === D.map(function (x) { return !!S.conf[x.id]; }).indexOf(false);
      return '<li class="' + (ok ? "ok" : "") + '"><div><span class="k">' + esc(q.etiqueta) + '</span><span class="v">' + enmascarar(v.leido || v.valor || "—") + '</span></div><div class="acc">' +
        (ok ? '<span class="chip ok">' + ic("check", 18) + "Confirmado</span>" : '<button class="btn ' + (foco ? "btn-primary" : "btn-outline") + '" data-conf="' + q.id + '">Confirmar</button>') +
        '<button class="btn btn-outline" data-corr="' + i + '">Corregir</button></div></li>';
    }).join("") + "</ul>";
    h += '<div class="alerta" data-hu="HU-048">' + ic("speaker") + "<div><b class=t>Te leo cada dato en voz alta</b>Así confirmas sin tener que leer. Usa <b>Repetir</b> para escucharlos otra vez.</div></div>";
    h += '<div class="alerta" data-hu="HU-034">' + ic("arrow-r") + "<div><b class=t>Después: tu constancia</b>Se genera cuando confirmes los " + (NUM[D.length] || D.length) + " datos.</div></div>";
    h += '<div style="margin-top:20px"><button class="btn btn-primary" data-acc="emitir"' + (todos ? "" : " disabled") + ">Generar mi constancia</button></div>";
    return h;
  };
  VISTAS.confirmacion.hablar = function () {
    var q = DAT().filter(function (x) { return !S.conf[x.id]; })[0];
    if (!q) return "Todo confirmado. Ya puedes generar tu constancia.";
    var v = S.datos[q.id] || {};
    return q.etiqueta + ": " + (S.privado ? "dato oculto en pantalla. " : "") + A.leerValor(q, v) + ". ¿Es correcto?";
  };

  function codigo() {
    if (!S.codigo) { S.codigo = "VT-" + new Date().getFullYear() + "-" + String(Math.floor(Math.random() * 900000) + 100000); S.emitido = new Date().toISOString(); guardar(); }
    return S.codigo;
  }
  /* Historial: cada constancia generada queda guardada una sola vez (por código) en este equipo */
  function registrarHistorial() {
    if (!S.codigo || HIST.some(function (h) { return h.codigo === S.codigo; })) return;
    var t = actual(), d = S.datos || {};
    HIST.unshift({ id: "h" + Date.now().toString(36) + Math.floor(Math.random() * 1000).toString(36), tramite: t.formal || t.nombre, tramiteId: t.id, entidad: t.entidad,
      codigo: S.codigo, fecha: S.emitido, estado: "Solicitud preparada",
      campos: DAT().map(function (q) { return { k: q.etCons || q.etiqueta, v: txtDato(q, d[q.id]), p: !!q.privado }; }) });
    escribir(KEY_H, HIST);
  }
  VISTAS.constancia = function () {
    var t = actual(), c = codigo(), f = new Date(S.emitido);
    registrarHistorial();
    ejemplo("Guarda tu código. Lo necesitas para recordar lo que preparaste.");
    var h = bannerConexion();
    h += '<div class="alerta ok" role="status">' + ic("check-circle") + "<div><b class=t>¡Listo! Preparé tu solicitud</b>Esta constancia es solo de orientación.</div></div>";
    h += '<div class="constancia" id="constancia" data-hu="HU-038"><header><img src="../assets/images/voztramite-horizontal-fondo-claro.svg" alt="VozTrámite" width="130" height="28" /><span class="codigo" data-hu="HU-016">' + esc(c) + "</span></header><dl>" +
      "<dt>Trámite</dt><dd>" + esc(t.formal || t.nombre) + "</dd>" +
      "<dt>Entidad</dt><dd>" + esc(t.entidad) + "</dd>" +
      DAT().map(function (q) { var v = txtDato(q, S.datos[q.id]); return "<dt>" + esc(q.etCons || q.etiqueta) + "</dt><dd>" + (q.privado ? enmascarar(v) : esc(v)) + "</dd>"; }).join("") +
      (t.costo ? "<dt>Costo</dt><dd>" + costoTxt(t.costo) + "</dd>" : "") +
      (t.vigencia ? "<dt>Vigencia</dt><dd>" + esc(t.vigencia.t) + (t.vigencia.ref ? ' <span class="ref">referencial · confírmalo en gob.pe</span>' : "") + "</dd>" : "") +
      "<dt>Emitida</dt><dd>" + f.toLocaleDateString("es-PE", { day: "numeric", month: "long", year: "numeric" }) + "</dd></dl>" +
      '<p class="legal">Constancia de orientación de VozTrámite. No es un documento oficial ni indica que el trámite esté registrado ante ' + esc(t.entidad) + ".</p></div>";
    h += '<div class="alerta" data-hu="HU-034" id="que-sigue"><div style="display:flex;gap:12px">' + ic("arrow-r") + "<div><b class=t>" + (t.id === "renovar-dni" ? "Qué sigue" : "Qué llevar y qué hacer después") + "</b><ol style='margin:6px 0 0;padding-left:1.2rem'>" +
      t.que(S.datos).map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ol>" +
      '<p style="margin:10px 0 0">Canal oficial: <b>' + esc(t.canal) + "</b> (escríbelo en tu navegador).</p></div></div></div>";
    h += '<div class="no-print" style="margin-top:16px;display:flex;gap:10px;flex-wrap:wrap"><button class="btn btn-primary" data-acc="imprimir">' + ic("print") + 'Imprimir</button><button class="btn btn-outline" data-acc="copiar">Copiar código</button><button class="btn btn-ghost" data-acc="reiniciar">Hacer otro trámite</button></div>';
    return h;
  };
  VISTAS.constancia.hablar = function () {
    return "Listo. Preparé tu solicitud. Tu código es " + codigo().split("").join(" ") + ". " + actual().hablarQue(S.datos);
  };

  /* Modo «Tengo una duda»: pregunta libre, con voz o teclado */
  function vistaDuda() {
    ejemplo("Por ejemplo: «¿Cuánto cuesta?» o «¿Qué es la vigencia?».");
    var h = bannerConexion();
    h += '<p class="eyebrow" style="margin:0">Tengo una duda</p><h3 class="pregunta" data-hu="HU-030">¿Cuál es tu duda?</h3>';
    h += '<p class="ayuda">Escríbela o toca Hablar. No digas tus datos personales aquí.</p>';
    h += eco(S.ultimoDicho);
    h += bloqueRespuesta();
    h += formRespuesta("Tu pregunta", "Por ejemplo: ¿cuánto cuesta?", "text", true);
    h += '<div style="margin-top:20px"><button class="btn btn-outline" data-acc="duda-cerrar">Volver a mi trámite</button></div>';
    return h;
  }
  function abrirDuda() {
    interactuo = true; modoDuda = true; RESP = null; A.cancelSpeech(); render(true);
    var r = $("#resp"); if (r) r.focus();
  }
  function cerrarDuda() { modoDuda = false; RESP = null; S.ultimoDicho = ""; render(true); }
  function preguntarLibre(texto) {
    var paso = S.step;
    RESP = { paso: paso, pendiente: true }; estado("procesando", "Pensando…"); render(true);
    A.preguntar(texto, { paso: paso, tramiteId: S.tramiteId || null }, { tramite: cf() }).then(function (r) {
      RESP = { paso: paso, texto: r.respuesta, ia: r.fuente === "ia" };
      estado("ok", "Respuesta lista"); render(true); hablar(r.respuesta);
    });
  }

  /* -------------------------------------------------------------- render */
  function render(sinVoz) {
    pintarProgreso();
    var v = VISTAS[S.step];
    $("#conv-body").innerHTML = modoDuda ? vistaDuda() : v();
    var btn = $("#btn-hablar"), txt = $("#btn-hablar-txt");
    btn.hidden = false;
    if (S.step === "constancia") { txt.textContent = "Escuchar resumen"; btn.setAttribute("aria-pressed", "false"); }
    else if (S.step === "requisitos" || (S.step === "identidad" && (S.idFase === "intro" || S.idFase === "ok"))) { txt.textContent = "Hablar"; }
    else txt.textContent = "Hablar";
    var sinVozPosible = !vozPosible() || CONN.nivel === "sin";
    btn.disabled = sinVozPosible && S.step !== "constancia";
    if (btn.disabled) { txt.textContent = "Voz no disponible"; estado("sin", !A.soportaVoz ? "Tu navegador no tiene voz: usa el teclado" : A.enArchivo ? "Abre desde un servidor para usar la voz: usa el teclado" : "Sin señal: usa el teclado"); }
    else estado("listo", "Listo para escucharte");
    $("#t-teclado").setAttribute("aria-pressed", String(!!S.teclado));
    $("#sw-privado").checked = S.privado;
    pintarEntendiendo(); pintarContinuar(); pintarGuardado();
    if (!sinVoz && !modoDuda) { var h = v.hablar; hablar(typeof h === "function" ? h() : h); }
  }

  /* ----------------------------------------------------- manejo de respuestas */
  function procesar(texto) {
    S.ultimoDicho = texto; setEco(texto); vozFallo = null;
    if (CONN.nivel === "sin") { S.cola.push({ paso: S.step, t: Date.now() }); toast("Guardado. Se sincroniza cuando vuelva la señal."); }
    if (modoDuda) { preguntarLibre(texto); return; }
    estado("procesando", "Procesando tu respuesta");
    var fn = MANEJA[S.step];
    if (fn) fn(texto);
  }

  var MANEJA = {};
  /* Paso «tramite»: la IA (si está conectada) solo ve esta frase y el id del trámite ya elegido; nada más */
  MANEJA.tramite = function (texto) {
    var t0 = tr();
    if (t0 && t0.variantes && !S.variante) {
      var vv = A.interpretarVariante(texto, t0);
      if (vv) { elegirVariante(vv.id, texto); return; }
    }
    RESP = null;
    A.ask(texto, { paso: "tramite", tramiteId: S.tramiteId || null }).then(function (r) {
      var t = r.tramite, ia = r.fuente === "ia" && r.respuesta;
      if (ia) RESP = { paso: "tramite", texto: r.respuesta, ia: true };
      if (!t) {
        if (ia) { S.msgTramite = ""; estado("ok", "Respuesta lista"); guardar(); render(true); hablar(r.respuesta); return; }
        S.msgTramite = '<div class="alerta err" role="alert" data-hu="HU-030">' + ic("x-circle") + "<div><b class=t>No te entendí</b>Prueba diciendo «quiero renovar mi DNI» o elige uno de la lista.</div></div>";
        estado("error", "No te entendí"); guardar(); render(true); hablar("No te entendí. Prueba diciendo: quiero renovar mi DNI."); return;
      }
      elegirTramite(t, texto, { hablar: ia ? r.respuesta : null });
    });
  };

  /* Reinicia el avance cuando se cambia de trámite */
  function limpiarFlujo() {
    S.variante = null; S.req = []; S.reqTodos = false; S.idFase = "intro"; S.idIdx = 0; S.idIntentos = 0; S.idInfo = null;
    S.datoIdx = 0; S.datos = {}; S.datoIntentos = 0; S.conf = {}; S.confIdx = 0; S.corrigiendo = null; S.codigo = null; S.emitido = null; S.msgDato = ""; S.ultimoDicho = "";
  }
  function msgEntendi() {
    var t = tr(), c = cf(), falta = t.variantes && !S.variante;
    return '<div class="alerta ok" role="status" data-hu="HU-015">' + ic("check-circle") + "<div><b class=t>Entendí: «" + esc(falta ? t.nombre : c.formal) + "»</b>" + esc(falta ? t.simple : c.simple) +
      (falta ? "" : ' <div class="acciones"><button class="btn btn-primary" data-acc="continuar">Es correcto, continuar</button></div>') + "</div></div>";
  }
  function elegirTramite(t, dicho, o) {
    o = o || {};
    if (!t.activo) {
      S.msgTramite = '<div class="alerta warn" role="alert">' + ic("info") + "<div><b class=t>Entendí: «" + esc(t.nombre) + "»</b>" + esc(t.simple) + " Por ahora están listos: DNI, antecedentes, RUC y licencia.</div></div>";
      S.tramiteId = null; estado("ok", "Entendí tu pedido"); guardar(); render(true); hablar("Entendí: " + t.nombre + ". Por ahora están listos: DNI, antecedentes, RUC y licencia."); return;
    }
    if (o.desdeInicio && S.tramiteId === t.id) return;      // ya estaba en este trámite: se conserva el avance
    if (S.tramiteId !== t.id) { limpiarFlujo(); S.step = "tramite"; }
    S.tramiteId = t.id;
    if (t.variantes && dicho) { var v = A.interpretarVariante(dicho, t); if (v) S.variante = v.id; }
    S.msgTramite = msgEntendi();
    estado("ok", "Entendí tu pedido"); guardar(); render(true);
    if (o.silencio) return;
    var c = cf();
    if (o.hablar) hablar(o.hablar);
    else if (t.variantes && !S.variante) hablar("Entendí: " + t.nombre + ". " + t.variantePregunta);
    else hablar("Entendí: " + c.formal + ". " + c.simple + " ¿Continuamos?");
  }
  function elegirVariante(id, dicho) {
    S.variante = id; S.msgTramite = msgEntendi(); estado("ok", "Entendí tu pedido"); guardar(); render(true);
    var c = cf(); hablar("Entendí: " + c.formal + ". " + c.simple + " ¿Continuamos?");
  }

  MANEJA.requisitos = function (texto) {
    if (A.esSi(texto) || /continu|siguiente|listo/.test(A.norm(texto))) irA("identidad"); else { estado("error", "No te entendí"); hablar("Di continuar cuando estés listo."); }
  };

  MANEJA.identidad = function (texto) {
    var idc = actual().identidad || {};
    if (idc.modo === "info") {
      if (S.idFase === "ok") { irA("datos"); return; }
      var rs = A.parseSiNo(texto);
      if (!rs) { estado("error", "No te entendí"); toast("Responde «sí» o «no»."); hablar("Responde sí o no."); return; }
      S.idInfo = rs.valor; S.idFase = "ok"; S.ultimoDicho = ""; guardar(); render(true); estado("ok", "Respuesta entendida"); hablar(rs.valor === "si" ? idc.si : idc.no);
      return;
    }
    if (S.idFase === "intro") { if (A.esSi(texto) || /empez|continu|vamos/.test(A.norm(texto))) { S.idFase = "preg"; guardar(); render(); } return; }
    if (S.idFase === "ok") { irA("datos"); return; }
    var q = VT.PREGUNTAS_ID[S.idOrden[S.idIdx]];
    if (A.coincide(texto, q.ok)) {
      S.idIntentos = 0; S.ultimoDicho = "";
      if (S.idIdx >= 1) { S.idFase = "ok"; guardar(); render(true); estado("ok", "Identidad verificada"); hablar("Listo, tu identidad quedó verificada."); }
      else { S.idIdx++; S.idFase = "preg"; guardar(); render(); }
    } else {
      S.idIntentos++;
      S.idFase = S.idIntentos >= 2 ? "bloqueo" : "error";
      guardar(); render(true); estado("error", "No coincide");
      hablar(S.idFase === "bloqueo" ? "No pude verificar esa respuesta. Elige cómo seguir." : "Esa respuesta no coincide. Te queda un intento.");
    }
  };

  /* Datos: cada tipo de pregunta (fecha, celular, agencia, opcion, sino, correo) se interpreta con su parser */
  MANEJA.datos = function (texto) {
    var q = DAT()[S.datoIdx], r = A.parsePregunta(q, texto);
    if (!r) {
      S.datoIntentos++;
      var msg = { fecha: "Dime día, mes y año, por ejemplo «15 de mayo de 1960».", celular: "Necesito 9 números que empiecen con 9.",
        correo: "Dime tu correo así: «rosa punto quispe arroba gmail punto com».", sino: "Responde sí o no." }[q.tipo] || "Prueba con una de las opciones.";
      S.msgDato = '<div class="alerta err" role="alert" data-hu="HU-030">' + ic("x-circle") + "<div><b class=t>No te entendí</b>" + esc(msg) + (S.datoIntentos >= 2 ? " Si prefieres, usa el teclado." : "") + '<div class="acciones"><button class="btn btn-outline" data-acc="repetir">Repetir pregunta</button><button class="btn btn-outline" data-acc="teclado">Escribir en vez de hablar</button></div></div></div>';
      if (S.datoIntentos >= 2) S.teclado = true;
      guardar(); render(true); estado("error", "No te entendí"); hablar("No te entendí. " + msg); return;
    }
    guardarDato(q, r);
  };
  function guardarDato(q, r) {
    var D = DAT();
    S.datos[q.id] = r; S.datoIntentos = 0; S.msgDato = ""; S.ultimoDicho = ""; delete S.conf[q.id];
    var volver = S.corrigiendo != null;
    if (volver) { S.corrigiendo = null; guardar(); irA("confirmacion"); hablar("Entendí: " + A.leerValor(q, r) + ". Corregido."); return; }
    if (S.datoIdx < D.length - 1) { S.datoIdx++; guardar(); render(); estado("ok", "Respuesta entendida"); }
    else { guardar(); irA("confirmacion"); }
  }

  MANEJA.confirmacion = function (texto) {
    var q = DAT().filter(function (x) { return !S.conf[x.id]; })[0];
    if (!q) { if (A.esSi(texto)) emitir(); return; }
    if (A.esSi(texto)) confirmarDato(q.id);
    else if (A.esNo(texto)) corregir(DAT().indexOf(q));
    else { estado("error", "No te entendí"); hablar("Di sí para confirmar o corregir para cambiarlo."); }
  };
  function confirmarDato(id) { S.conf[id] = true; guardar(); render(false); }
  function corregir(i) { S.corrigiendo = i; S.datoIdx = i; S.ultimoDicho = ""; S.msgDato = ""; irA("datos"); }
  function emitir() { codigo(); registrarHistorial(); irA("constancia"); }

  /* ----------------------------------------------------------------- voz */
  var escuchando = false, probando = false;
  function alternarEscucha() {
    interactuo = true;
    if (S.step === "constancia") { A.speak(VISTAS.constancia.hablar()); return; }
    var btn = $("#btn-hablar"), txt = $("#btn-hablar-txt");
    if (escuchando) { A.stopListen(); return; }
    if (probando) A.abortListen();
    vozFallo = null; quitarAvisoVoz();
    escuchando = true; btn.setAttribute("aria-pressed", "true"); txt.textContent = "Terminar de hablar";
    ondas(true);
    A.listen({
      onParcial: setEco,
      onPidiendo: function () {
        // Antes de que el navegador pregunte, se explica para qué se usa el micrófono
        estado("procesando", "Esperando tu permiso");
        var slot = $("#conv-body"), div = document.createElement("div");
        div.className = "alerta"; div.id = "aviso-permiso"; div.setAttribute("role", "status"); div.setAttribute("data-hu", "HU-016");
        div.innerHTML = ic("mic") + "<div><b class=t>Necesito tu micrófono solo mientras tocas Hablar</b>Tu navegador te lo va a preguntar: elige Permitir. No guardo ningún audio.</div>";
        slot.insertBefore(div, slot.firstChild);
      },
      onInicio: function () { quitarAvisoVoz(); estado("escuchando", "Escuchando"); }
    }).then(function (r) { fin(); procesar(r.texto); })
      .catch(function (e) { fin(); falloVoz(e && e.codigo, e && e.veces); });
    function fin() { escuchando = false; quitarAvisoVoz(); btn.setAttribute("aria-pressed", "false"); txt.textContent = "Hablar"; ondas(false); }
  }
  function quitarAvisoVoz() { var a = $("#aviso-permiso"); if (a) a.remove(); }
  function falloVoz(c, veces) {
    if (c === "cancelado") { estado("listo", "Listo para escucharte"); return; }
    if (c === "no-escuche" && veces >= 2) c = "no-escuche-2";   // dos silencios seguidos: se sugiere el teclado
    var m = A.mensajeVoz(c);
    vozFallo = c;
    if (c !== "no-escuche") S.teclado = true;
    guardar(); render(true);
    estado("error", c === "no-escuche" || c === "no-escuche-2" ? m.t : "Voz no disponible");
    hablar(m.d);
  }

  /* --------------------------------------------------------- eventos (delegados) */
  document.addEventListener("click", function (ev) {
    var el = ev.target.closest("[data-acc],[data-tramite],[data-agencia],[data-conf],[data-corr],[data-term],[data-conn],[data-req],[data-variante],[data-opcion],[data-idsino],[data-empezar]");
    if (!el) return;
    interactuo = true;
    if (el.hasAttribute("data-tramite")) { elegirTramite(VT.TRAMITES.filter(function (t) { return t.id === el.getAttribute("data-tramite"); })[0]); return; }
    if (el.hasAttribute("data-empezar")) { elegirTramite(VT.TRAMITES.filter(function (t) { return t.id === el.getAttribute("data-empezar"); })[0], null, { silencio: true, desdeInicio: true }); return; }
    if (el.hasAttribute("data-variante")) { elegirVariante(el.getAttribute("data-variante")); return; }
    if (el.hasAttribute("data-idsino")) { MANEJA.identidad(el.getAttribute("data-idsino")); return; }
    if (el.hasAttribute("data-opcion")) {
      var qd = DAT()[S.datoIdx], ov = el.getAttribute("data-opcion"), op = opcionesDe(qd).filter(function (o) { return o.v === ov; })[0];
      if (op) guardarDato(qd, { valor: op.v, leido: op.t });
      return;
    }
    if (el.hasAttribute("data-agencia")) { MANEJA.datos(el.getAttribute("data-agencia")); return; }
    if (el.hasAttribute("data-conf")) { confirmarDato(el.getAttribute("data-conf")); return; }
    if (el.hasAttribute("data-corr")) { corregir(+el.getAttribute("data-corr")); return; }
    if (el.hasAttribute("data-conn")) { var n = el.getAttribute("data-conn"); CONN.origen = "manual"; setConn(n, "manual"); return; }
    if (el.hasAttribute("data-term")) {
      var slot = $("#slot-termino"); if (slot) { slot.innerHTML = terminoInfo(el.getAttribute("data-term")); var info = $("#info-termino"); if (info) { info.setAttribute("tabindex", "-1"); info.focus(); } hablar($("#info-termino") ? $("#info-termino").textContent : ""); }
      return;
    }
    if (el.hasAttribute("data-req")) return; // lo maneja "change"
    var a = el.getAttribute("data-acc");
    var acciones = {
      "ligero-si": function () { setLigero(true); toast("Modo ligero activado."); render(true); },
      "ligero-no": function () { CONN.ligeroRechazado = true; render(true); },
      "req-todos": function () { S.reqTodos = true; guardar(); render(true); },
      "cerrar-termino": function () { var s = $("#slot-termino"); if (s) s.innerHTML = ""; },
      "continuar": function () { var i = PASOS.map(function (p) { return p.id; }).indexOf(S.step); if (S.step === "tramite" && (!S.tramiteId || (tr().variantes && !S.variante))) return; S.msgTramite = ""; irA(PASOS[Math.min(i + 1, PASOS.length - 1)].id); },
      "atras": function () { var i = PASOS.map(function (p) { return p.id; }).indexOf(S.step); if (i > 0) irA(PASOS[i - 1].id); },
      "id-cambiar": function () { S.idFase = "intro"; S.idInfo = null; guardar(); render(true); },
      "duda-cerrar": cerrarDuda,
      "id-empezar": function () { S.idFase = "preg"; guardar(); render(); },
      "id-reintentar": function () { S.idIntentos = 0; S.idFase = "preg"; guardar(); render(); },
      "id-pista": function () { var q = VT.PREGUNTAS_ID[S.idOrden[S.idIdx]]; toast(q.pista); },
      "repetir": function () { var v = VISTAS[S.step].hablar; A.speak(typeof v === "function" ? v() : v); },
      "teclado": function () { S.teclado = true; guardar(); render(true); var r = $("#resp"); if (r) r.focus(); },
      "voz-reintentar": function () { vozFallo = null; render(true); alternarEscucha(); },
      "emitir": emitir,
      "imprimir": function () { global.print(); },
      "copiar": function () { var c = S.codigo; (navigator.clipboard ? navigator.clipboard.writeText(c) : Promise.reject()).then(function () { toast("Código copiado: " + c); }, function () { toast("Tu código es " + c); }); },
      "reiniciar": function () { reiniciar(false); },
      "reiniciar-ir": function () { reiniciar(true); }
    };
    if (acciones[a]) acciones[a]();
  });

  document.addEventListener("change", function (ev) {
    var t = ev.target;
    if (t.matches("[data-req]")) { var i = +t.getAttribute("data-req"), k = S.req.indexOf(i); if (t.checked && k < 0) S.req.push(i); if (!t.checked && k >= 0) S.req.splice(k, 1); guardar(); }
  });

  document.addEventListener("submit", function (ev) {
    if (ev.target.id !== "form-resp") return;
    ev.preventDefault(); interactuo = true;
    var v = $("#resp").value.trim();
    if (!v) { errorCampo("Escribe tu respuesta para continuar."); return; }
    procesar(v);
  });

  $("#btn-hablar").addEventListener("click", alternarEscucha);
  $("#t-repetir").addEventListener("click", function () { interactuo = true; var v = VISTAS[S.step].hablar; A.speak(typeof v === "function" ? v() : v); });
  $("#t-duda").addEventListener("click", abrirDuda);
  $("#btn-preguntame").addEventListener("click", abrirDuda);
  $("#t-teclado").addEventListener("click", function () { S.teclado = !S.teclado; guardar(); render(true); var r = $("#resp"); if (r) r.focus(); });
  $("#t-ayuda").addEventListener("click", function () {
    var ayudas = { tramite: "Dime qué trámite necesitas, por ejemplo: quiero renovar mi DNI.", requisitos: "Marca lo que ya tienes y toca Continuar.", identidad: "Responde la pregunta con la voz o con el teclado.", datos: "Responde la pregunta que ves. Puedes escribir si prefieres.", confirmacion: "Confirma o corrige cada dato.", constancia: "Esta es tu constancia. Puedes imprimirla o copiar el código." };
    toast(ayudas[S.step]); hablar(ayudas[S.step]); interactuo = true;
  });
  $("#btn-reiniciar").addEventListener("click", function () { reiniciar(false); });
  function reiniciar(ir) {
    A.cancelSpeech(); A.abortListen(); vozFallo = null; modoDuda = false; RESP = null;
    var keep = { privado: S.privado, simple: S.simple, texto: S.texto, contraste: S.contraste, ligero: S.ligero, voz: S.voz };
    S = Object.assign(inicial(), keep); guardar(); render(true);
    if (ir === true) { location.hash = "#/tramite"; } else { window.scrollTo(0, 0); var b = $("#conv-body"); if (b) b.focus({ preventScroll: true }); }
  }

  /* ------------------------------------------------------------- ajustes (vista #/ajustes) */
  $("#btn-ajustes").addEventListener("click", function () { location.hash = "#/ajustes"; });
  $$("button[data-texto]").forEach(function (b) { b.addEventListener("click", function () { S.texto = b.getAttribute("data-texto"); aplicarPrefs(); guardar(); }); });
  $$("button[data-contraste]").forEach(function (b) { b.addEventListener("click", function () { S.contraste = b.getAttribute("data-contraste"); aplicarPrefs(); guardar(); }); });
  $("#sw-simple").addEventListener("change", function (e) { S.simple = e.target.checked; aplicarPrefs(); guardar(); });
  $("#sw-voz").addEventListener("change", function (e) { S.voz = e.target.checked; A.silenciar(!S.voz); guardar(); });
  $("#sw-privado").addEventListener("change", function (e) { S.privado = e.target.checked; guardar(); render(true); });
  $("#sw-ligero").addEventListener("change", function (e) { setLigero(e.target.checked); });
  function setLigero(v) { S.ligero = !!v; aplicarPrefs(); guardar(); }
  function aplicarPrefs() {
    var h = document.documentElement;
    h.setAttribute("data-texto", S.texto); h.setAttribute("data-contraste", S.contraste);
    h.setAttribute("data-simple", S.simple ? "1" : "0"); h.setAttribute("data-ligero", S.ligero ? "1" : "0");
    $$("button[data-texto]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-texto") === S.texto)); });
    $$("button[data-contraste]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-contraste") === S.contraste)); });
    pintarPrefsPerfil();
    $("#sw-simple").checked = S.simple; $("#sw-voz").checked = S.voz; $("#sw-ligero").checked = S.ligero;
    A.silenciar(!S.voz);
  }

  /* ---------------------------------------------------- diagnóstico (HU-008) */
  $("#btn-diag").addEventListener("click", function () {
    var out = $("#diag-result"), btn = this;
    out.innerHTML = '<div class="alerta">' + ic("repeat") + "<div><b class=t>Midiendo…</b>Un momento.</div></div>";
    btn.disabled = true;
    var url = "../assets/images/mockups/M15.jpg?x=" + Date.now(), t0 = performance.now();
    var medir = (location.protocol === "file:") ? Promise.reject() : fetch(url, { cache: "no-store" }).then(function (r) { return r.blob(); });
    medir.then(function (b) {
      var ms = Math.max(1, performance.now() - t0), kbps = Math.round((b.size * 8) / ms);
      var nivel = (ms < 700 || kbps > 1500) ? "buena" : (kbps > 400 ? "regular" : "debil");
      mostrarDiag(nivel, ms, kbps);
    }).catch(function () {
      var n = nivelAuto(); mostrarDiag(n, null, null, true);
    }).then(function () { btn.disabled = false; });
    function mostrarDiag(nivel, ms, kbps, estimado) {
      var m = CONN_TXT[nivel];
      var cl = nivel === "buena" ? "ok" : nivel === "regular" ? "warn" : "err";
      var rec = nivel === "buena" ? "Puedes usar voz sin problema." : nivel === "regular" ? "Te recomiendo activar el modo ligero." : nivel === "debil" ? "Usa el teclado y activa el modo ligero." : "No hay señal: tu avance queda guardado.";
      out.innerHTML = '<div class="alerta ' + cl + '">' + ic(m.ic) + "<div><b class=t>" + m.t + "</b>" + (ms ? "Una imagen pequeña tardó " + Math.round(ms) + " ms (≈ " + kbps + " kbps). " : (estimado ? "Estimado por tu navegador. " : "")) + rec +
        (nivel !== "buena" && !S.ligero ? '<div class="acciones"><button class="btn btn-primary" data-acc="ligero-si">Activar modo ligero</button></div>' : "") + "</div></div>";
      CONN.origen = "diag"; setConn(nivel, "auto");
    }
  });

  /* ------------------------------------------------------------ glosario */
  function pintarGlosario(q) {
    var n = A.norm(q || ""), l = VT.GLOSARIO.filter(function (g) { return !n || A.norm(g.t + " " + g.s).indexOf(n) >= 0; });
    $("#glos-list").innerHTML = l.length ? l.map(function (g) { return "<li><details><summary>" + esc(g.t) + '</summary><div class="cuerpo"><p>' + esc(g.s) + '</p><p class="ej">Ejemplo: ' + esc(g.e) + "</p></div></details></li>"; }).join("")
      : '<li class="sin" role="status">No encontré ese término. Prueba con otra palabra.</li>';
  }
  $("#glos-q").addEventListener("input", function (e) { pintarGlosario(e.target.value); });

  /* ---------------------------------------------- trámites disponibles */
  function pintarTramites() {
    var ul = $("#lista-tramites"); if (!ul) return;
    ul.innerHTML = VT.TRAMITES.map(function (t) {
      if (t.activo) return '<li class="tramite" data-hu="HU-015"><span class="ico" aria-hidden="true">' + ic(t.icono) + "</span><h3>" + esc(t.nombre) + '</h3><p class="entidad">' + esc(t.entidad) + '</p><span class="chip ok estado">' + ic("check-circle", 18) + 'Disponible</span><a class="btn btn-primary" href="#/tramite" data-empezar="' + t.id + '" data-hu="HU-029" aria-label="Empezar: ' + esc(t.nombre) + '">Empezar</a></li>';
      return '<li class="tramite prox"><span class="ico" aria-hidden="true">' + ic(t.icono) + "</span><h3>" + esc(t.nombre) + '</h3><p class="entidad">' + esc(t.entidad) + '</p><span class="chip estado">' + ic("clock", 18) + "Próximamente</span></li>";
    }).join("");
  }
  pintarTramites();

  /* ------------------------------------------------------ perfil (#/perfil) */
  function nombreLimpio(v) { return String(v || "").replace(/[<>]/g, "").replace(/\s+/g, " ").trim().slice(0, 30); }
  function iniciales(n) { var w = n.split(" ").filter(Boolean); return w.length ? (w[0].charAt(0) + (w[1] ? w[1].charAt(0) : "")).toUpperCase() : ""; }
  function pintarPerfilUI() {
    var n = PERFIL.nombre, ini = iniciales(n);
    ["#avatar-side", "#avatar-perfil"].forEach(function (sel) { var e = $(sel); if (e) e.innerHTML = ini ? esc(ini) : ic("user", 22); });
    $("#uc-nombre").textContent = n || "Mi perfil";
    var uc = $("#user-card"); uc.setAttribute("aria-label", n ? "Mi perfil, " + n : "Mi perfil"); uc.setAttribute("data-tip", n || "Mi perfil"); uc.title = n || "Mi perfil";
    $("#h-inicio").textContent = n ? "Hola, " + n + ". ¿Qué trámite quieres preparar hoy?" : "Hola, ¿qué trámite quieres preparar hoy?";
    var inp = $("#perfil-nombre"); if (inp && document.activeElement !== inp) inp.value = n;
    pintarPrefsPerfil();
  }
  function pintarPrefsPerfil() {
    var el = $("#perfil-prefs"); if (!el) return;
    function f(k, v) { return "<dt>" + k + "</dt><dd>" + v + "</dd>"; }
    el.innerHTML = f("Tamaño del texto", { normal: "Normal", grande: "Grande", muygrande: "Muy grande" }[S.texto] || "Normal") +
      f("Contraste", S.contraste === "alto" ? "Alto" : "Normal") + f("Modo simple", S.simple ? "Activado" : "Desactivado") + f("Voz del asistente", S.voz ? "Activada" : "Desactivada") + f("Voz elegida", esc(A.etiquetaVozActual() || "La predeterminada de tu navegador"));
  }
  $("#form-perfil").addEventListener("submit", function (ev) {
    ev.preventDefault();
    PERFIL.nombre = nombreLimpio($("#perfil-nombre").value); escribir(KEY_P, PERFIL);
    $("#perfil-nombre").value = PERFIL.nombre; pintarPerfilUI();
    $("#perfil-msg").textContent = PERFIL.nombre ? "Listo, te llamaré " + PERFIL.nombre + "." : "Listo, ya no uso tu nombre en el saludo.";
  });
  function abrirDlg(d) { if (d.showModal) d.showModal(); else d.setAttribute("open", ""); }
  function cerrarDlg(d) { if (d.close) d.close(); else d.removeAttribute("open"); }
  $("#btn-borrar").addEventListener("click", function () { abrirDlg($("#dlg-borrar")); });
  $("#dlg-borrar-no").addEventListener("click", function () { cerrarDlg($("#dlg-borrar")); });
  $("#dlg-borrar-si").addEventListener("click", function () { cerrarDlg($("#dlg-borrar")); borrarTodo(); });
  /* Borra nombre, avance, ajustes e historial de este equipo y vuelve al estado inicial */
  function borrarTodo() {
    A.cancelSpeech(); A.abortListen();
    try { localStorage.removeItem(KEY); localStorage.removeItem(KEY_P); localStorage.removeItem(KEY_H); localStorage.removeItem("voztramite:voz:v1"); } catch (e) { /* bloqueado */ }
    S = inicial(); PERFIL = { nombre: "" }; HIST = []; FILTRO = "todos"; vozFallo = null;
    aplicarPrefs(); render(true); pintarPerfilUI(); pintarHistorial();
    $("#perfil-msg").textContent = "Listo: borré tu nombre, tu avance y tu historial de este equipo.";
    toast("Borré tus datos y tu historial.");
  }

  /* --------------------------------------------------- historial (#/historial) */
  function fechaLegible(iso, conHora) {
    try {
      var d = new Date(iso); if (isNaN(d)) return "";
      var f = d.toLocaleDateString("es-PE", { day: "numeric", month: "long", year: "numeric" });
      return conHora ? f + ", " + d.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" }) : f;
    } catch (e) { return ""; }
  }
  function itemCurso() {
    var t = actual(), idx = PASOS.map(function (p) { return p.id; }).indexOf(S.step), pct = Math.round((idx / (PASOS.length - 1)) * 100);
    return '<li class="hist-item" data-hu="HU-032"><div class="hist-top"><span class="ico" aria-hidden="true">' + ic("message") + '</span><div class="hist-tit"><h3>' + esc(t.formal || t.nombre) + "</h3><p>Tu avance está guardado en este equipo.</p></div>" +
      '<span class="chip warn">' + ic("clock", 18) + "En curso</span></div>" +
      '<p class="paso">' + esc(pasoTxt()) + '</p><div class="barra" role="progressbar" aria-label="Avance de tu trámite" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + pct + '" data-hu="HU-025"><i style="width:' + pct + '%"></i></div>' +
      '<div class="hist-acc"><a class="btn btn-primary" href="#/tramite">Continuar</a></div></li>';
  }
  function itemListo(h) {
    return '<li class="hist-item" data-id="' + esc(h.id) + '"><div class="hist-top"><span class="ico" aria-hidden="true">' + ic("doc") + '</span><div class="hist-tit"><h3>' + esc(h.tramite) + "</h3><p>" + esc(fechaLegible(h.fecha, true)) + "</p></div>" +
      '<span class="chip ok">' + ic("check-circle", 18) + esc(h.estado || "Solicitud preparada") + "</span></div>" +
      '<p class="hist-cod">Código <b>' + esc(h.codigo) + '</b></p><div class="hist-acc"><button class="btn btn-outline" type="button" data-hist-ver="' + esc(h.id) + '">' + ic("doc", 20) + 'Ver resumen</button>' +
      '<button class="btn btn-outline" type="button" data-hist-oir="' + esc(h.id) + '">' + ic("speaker", 20) + "Escuchar resumen</button></div></li>";
  }
  function pintarHistorial() {
    var el = $("#hist-lista"); if (!el) return;
    var enCurso = hayAvance() && S.step !== "constancia", total = (enCurso ? 1 : 0) + HIST.length;
    $("#hist-filtros").hidden = total === 0;
    $$("[data-filtro]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-filtro") === FILTRO)); });
    if (!total) {
      el.innerHTML = '<div class="vacio"><span class="ico" aria-hidden="true">' + ic("history", 36) + "</span><h2>Aún no tienes trámites</h2><p>Cuando empieces uno, lo verás aquí. Lo que prepares se guarda solo en este equipo.</p>" +
        '<a class="btn btn-primary" href="#/tramite">Empezar mi trámite</a></div>';
      return;
    }
    var h = "", verCurso = enCurso && FILTRO !== "preparados", verListos = HIST.length && FILTRO !== "curso";
    if (verCurso) h += '<section class="hist-grupo" aria-labelledby="hg-curso"><h2 id="hg-curso">En curso</h2><ul class="hist-lista">' + itemCurso() + "</ul></section>";
    if (verListos) h += '<section class="hist-grupo" aria-labelledby="hg-listos"><h2 id="hg-listos">Preparados</h2><ul class="hist-lista">' + HIST.map(itemListo).join("") + "</ul></section>";
    if (!h) h = '<p class="muted" role="status" style="margin-top:20px">No hay trámites en esta categoría.</p>';
    el.innerHTML = h;
  }
  function buscarHist(id) { return HIST.filter(function (x) { return x.id === id; })[0]; }
  /* Campos del resumen; los ítems antiguos (solo DNI) guardaban {nacimiento, agencia, celular} */
  function camposDe(h) {
    if (h.campos) return h.campos;
    var d = h.datos || {};
    return [{ k: "Fecha de nacimiento", v: d.nacimiento, p: true }, { k: "Agencia de recojo", v: d.agencia }, { k: "Celular para avisos", v: d.celular, p: true }];
  }
  function resumenHablado(h) {
    return "Solicitud preparada. " + h.tramite + ". Tu código es " + h.codigo.split("").join(" ") + ". " + (camposDe(h).filter(function (c) { return c.k === "Agencia de recojo" && c.v; }).map(function (c) { return "Agencia de recojo: " + c.v + ". "; })[0] || "") + "Preparada el " + fechaLegible(h.fecha, false) + ". Esta constancia es solo de orientación.";
  }
  var histAbierto = null;
  function verResumen(h) {
    histAbierto = h.id;
    var d = h.datos || {};
    function f(k, v) { return "<dt>" + k + "</dt><dd>" + v + "</dd>"; }
    $("#dlg-resumen-dl").innerHTML = f("Trámite", esc(h.tramite)) + f("Entidad", esc(h.entidad || "")) + f("Estado", esc(h.estado || "Solicitud preparada")) + f("Código", esc(h.codigo)) +
      f("Preparada", esc(fechaLegible(h.fecha, true))) + camposDe(h).map(function (c) { return f(esc(c.k), c.p ? enmascarar(c.v || "—") : esc(c.v || "—")); }).join("");
    $("#dlg-resumen-nota").textContent = S.privado ? "Modo privado activado: tus datos personales están ocultos." : "Constancia de orientación; no es un documento oficial.";
    abrirDlg($("#dlg-resumen"));
  }
  $("#vista-historial").addEventListener("click", function (ev) {
    var b = ev.target.closest("[data-filtro],[data-hist-ver],[data-hist-oir]"); if (!b) return;
    interactuo = true;
    if (b.hasAttribute("data-filtro")) { FILTRO = b.getAttribute("data-filtro"); pintarHistorial(); return; }
    var h = buscarHist(b.getAttribute("data-hist-ver") || b.getAttribute("data-hist-oir")); if (!h) return;
    if (b.hasAttribute("data-hist-ver")) verResumen(h); else A.speak(resumenHablado(h), { forzar: true });
  });
  $("#dlg-resumen-cerrar").addEventListener("click", function () { A.cancelSpeech(); cerrarDlg($("#dlg-resumen")); });
  $("#dlg-resumen-oir").addEventListener("click", function () { var h = buscarHist(histAbierto); if (h) A.speak(resumenHablado(h), { forzar: true }); });
  $("#dlg-resumen").addEventListener("close", function () { A.cancelSpeech(); });

  /* ------------------------------------------------ probar voz (#/ajustes) */
  function pintarCompat() {
    var c = A.compat(), ul = $("#compat-voz"); if (!ul) return;
    A.estadoPermiso().then(function (p) {
      function fila(k, tipo, icono, txt) { return "<li><span>" + k + '</span><span class="chip ' + tipo + '">' + ic(icono, 18) + esc(txt) + "</span></li>"; }
      var v = A.vozActual();
      ul.innerHTML =
        fila("Reconocimiento de voz", c.reconocimiento ? "ok" : "err", c.reconocimiento ? "check-circle" : "x-circle", c.reconocimiento ? "Sí, disponible" : "No disponible en este navegador") +
        fila("Cómo abriste la página", c.archivo ? "err" : c.seguro ? "ok" : "warn", c.archivo ? "x-circle" : c.seguro ? "check-circle" : "alert", c.archivo ? "Como archivo: la voz no funciona" : c.seguro ? "Servidor o https: correcto" : "Conexión no segura: el micrófono puede bloquearse") +
        fila("Lectura en voz alta", c.lectura ? "ok" : "err", c.lectura ? "check-circle" : "x-circle", c.lectura ? "Sí, disponible" + (v ? " (" + v.lang + ")" : "") : "No disponible en este navegador") +
        fila("Permiso del micrófono", p === "concedido" ? "ok" : p === "denegado" ? "err" : "warn", p === "concedido" ? "check-circle" : p === "denegado" ? "x-circle" : "alert",
          p === "concedido" ? "Concedido" : p === "denegado" ? "Denegado: actívalo en el candado junto a la dirección" : p === "sin-preguntar" ? "Sin preguntar todavía" : "No se pudo comprobar");
    });
  }
  function resultadoPrueba(html) { $("#prueba-res").innerHTML = html; }
  $("#btn-probar-mic").addEventListener("click", function () {
    interactuo = true;
    var txt = $("#btn-probar-mic-txt");
    if (probando) { A.stopListen(); return; }
    if (escuchando) A.abortListen();
    probando = true; txt.textContent = "Terminar de probar";
    A.listen({
      onPidiendo: function () { resultadoPrueba('<div class="alerta" role="status">' + ic("mic") + "<div><b class=t>Necesito tu micrófono solo mientras tocas Hablar</b>Tu navegador te lo va a preguntar: elige Permitir.</div></div>"); },
      onInicio: function () { resultadoPrueba('<div class="alerta warn" role="status">' + ic("mic") + '<div><b class=t>Te escucho</b>Di una frase corta, por ejemplo «Quiero renovar mi DNI». <span id="prueba-parcial"></span></div></div>'); },
      onParcial: function (t) { var p = $("#prueba-parcial"); if (p) p.textContent = t; }
    }).then(function (r) {
      fin(); resultadoPrueba('<div class="alerta ok" role="status">' + ic("check-circle") + "<div><b class=t>Esto fue lo que entendí</b>«" + esc(r.texto) + "»</div></div>");
    }).catch(function (e) {
      fin(); var c = e && e.codigo; if (c === "cancelado") { resultadoPrueba(""); return; }
      if (c === "no-escuche" && e.veces >= 2) c = "no-escuche-2";
      resultadoPrueba(alertaVoz(A.mensajeVoz(c), false));
    });
    function fin() { probando = false; txt.textContent = "Probar micrófono"; pintarCompat(); }
  });
  $("#btn-probar-voz").addEventListener("click", function () {
    interactuo = true;
    if (!A.compat().lectura) { resultadoPrueba(alertaVoz(A.mensajeVoz("sin-lectura"), false)); return; }
    var v = A.vozActual();
    resultadoPrueba('<div class="alerta" role="status">' + ic("speaker") + "<div><b class=t>Te estoy hablando</b>Si no oyes nada, sube el volumen. Voz: " + esc(v ? v.name + " (" + v.lang + ")" : "la predeterminada de tu navegador") + ".</div></div>");
    A.speak("Hola, soy VozTrámite. Así te voy a hablar cuando te haga una pregunta.", { forzar: true });
  });

  /* ------------------------------------------- voz del asistente (selector) */
  function pintarVoces() {
    var sel = $("#sel-voz"), msg = $("#voz-msg"), btn = $("#btn-escuchar-voz"); if (!sel) return;
    var lista = A.soportaHabla ? A.vocesEs() : [];
    if (!lista.length) {
      sel.innerHTML = ""; sel.disabled = true; btn.disabled = true;
      msg.innerHTML = A.soportaHabla
        ? '<div class="alerta warn" data-hu="HU-010">' + ic("info") + "<div><b class=t>No encontré voces en español</b>Te hablaré con la voz predeterminada de tu navegador.</div></div>"
        : '<div class="alerta err" data-hu="HU-010">' + ic("mute") + "<div><b class=t>Tu navegador no lee en voz alta</b>Puedes leer las preguntas en pantalla.</div></div>";
      return;
    }
    var act = A.idVozActual();
    sel.disabled = false; btn.disabled = false; msg.innerHTML = "";
    sel.innerHTML = lista.map(function (x) { return '<option value="' + esc(x.id) + '"' + (x.id === act ? " selected" : "") + ">" + esc(x.etiqueta) + "</option>"; }).join("");
    if (!lista.some(function (x) { return x.id === act; })) sel.selectedIndex = 0;
  }
  $("#sel-voz").addEventListener("change", function (e) {
    A.elegirVoz(e.target.value); pintarPrefsPerfil();
    $("#voz-msg").innerHTML = '<div class="alerta ok" role="status">' + ic("check-circle") + "<div><b class=t>Voz elegida</b>" + esc(A.etiquetaVozActual() || "") + ". Quedó guardada en este equipo.</div></div>";
  });
  $("#btn-escuchar-voz").addEventListener("click", function () {
    interactuo = true;
    A.speak("Hola, soy VozTrámite. Así te voy a hablar cuando te haga una pregunta.", { forzar: true });
  });
  A.alCambiarVoces(function () { pintarVoces(); pintarPrefsPerfil(); pintarCompat(); });

  /* ------------------------------------------------ asistente con IA (#/ajustes) */
  var IA_TXT = {
    "conectado": ["ok", "check-circle", "conectado"], "no-configurado": ["warn", "info", "no configurado"],
    "sin-respuesta": ["err", "x-circle", "sin respuesta"], "sin-probar": ["", "info", "configurado, sin probar"]
  };
  function pintarIA() {
    var el = $("#ia-estado"); if (!el) return;
    var m = IA_TXT[A.estadoIA()];
    el.className = "chip " + m[0]; el.innerHTML = ic(m[1], 18) + "<span>Asistente con IA: " + m[2] + "</span>";
    $("#btn-probar-ia").disabled = A.estadoIA() === "no-configurado";
  }
  A.alCambiarEstadoIA(pintarIA);
  $("#btn-probar-ia").addEventListener("click", function () {
    interactuo = true;
    var out = $("#ia-res");
    if (A.estadoIA() === "no-configurado") { out.innerHTML = '<div class="alerta warn">' + ic("info") + "<div><b class=t>No hay un servicio de IA</b>Pega la URL en js/config.js.</div></div>"; return; }
    out.innerHTML = '<div class="alerta" role="status" aria-live="polite">' + ic("repeat") + "<div><b class=t>Pensando…</b>Un momento.</div></div>";
    A.preguntar("¿Qué es un trámite?", { paso: "ajustes", tramiteId: null }).then(function (r) {
      pintarIA();
      out.innerHTML = r.fuente === "ia"
        ? '<div class="burbuja ia"><span class="b-ico" aria-hidden="true">' + ic("message") + "</span><div><p class=\"b-txt\">" + esc(r.respuesta) + '</p><small class="ia-tag">' + ic("sparkles", 16) + "Respuesta generada con IA · puede equivocarse</small></div></div>"
        : '<div class="alerta err" role="alert">' + ic("x-circle") + "<div><b class=t>El asistente con IA no respondió</b>Sigo con el análisis local: la app funciona igual.</div></div>";
    });
  });

  /* ------------------------------------------------ enrutado por hash (app shell) */
  var RUTAS = { inicio: "Inicio", tramite: "Mi trámite", historial: "Historial", conexion: "Conexión", glosario: "Glosario", ajustes: "Ajustes", perfil: "Perfil" };
  var vistaActual = null, focoAsistente = false;
  function rutaDeHash() { var m = /^#\/([a-z]+)/.exec(location.hash); return m && RUTAS[m[1]] ? m[1] : null; }
  function mostrarVista(id, inicial) {
    if (vistaActual === "tramite" && id !== "tramite") { A.cancelSpeech(); A.abortListen(); }
    $$("[data-view]").forEach(function (v) { v.hidden = v.getAttribute("data-view") !== id; });
    $$("[data-nav]").forEach(function (a) { if (a.getAttribute("data-nav") === id) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
    document.title = RUTAS[id] + " · VozTrámite";
    $("#top-title").textContent = RUTAS[id];
    if (id === "inicio") pintarContinuar();
    if (id === "conexion") pintarGuardado();
    if (id === "historial") pintarHistorial();
    if (id === "perfil") pintarPerfilUI();
    if (id === "ajustes") { pintarCompat(); pintarVoces(); pintarIA(); }
    vistaActual = id;
    if (inicial) { focoAsistente = false; return; }
    window.scrollTo(0, 0);
    var vista = $('[data-view="' + id + '"]'), h = vista.querySelector("h1, h2");
    var destino = focoAsistente && id === "tramite" ? $("#conv-body") : h;
    focoAsistente = false;
    if (destino) { if (!destino.hasAttribute("tabindex")) destino.setAttribute("tabindex", "-1"); destino.focus({ preventScroll: true }); }
    var live = $("#live"); live.textContent = "";
    setTimeout(function () { live.textContent = "Ahora estás en " + RUTAS[id]; }, 60);
  }
  function enrutar(inicial) {
    var id = rutaDeHash();
    if (!id) {
      // Sin hash: si había un trámite a medias se retoma ahí; si no, inicio. Un hash desconocido también cae en inicio.
      id = (inicial && !location.hash && S.retomado) ? "tramite" : "inicio";
      try { history.replaceState(null, "", "#/" + id); } catch (e) { location.hash = "#/" + id; }
    }
    mostrarVista(id, inicial);
  }
  window.addEventListener("hashchange", function () { enrutar(false); });
  $("#skip-asistente").addEventListener("click", function () {
    focoAsistente = true;
    if (rutaDeHash() === "tramite") { var e = $("#conv-body"); focoAsistente = false; if (e) e.focus(); }
  });

  /* --------------------------------------------------------------- inicio */
  aplicarPrefs();
  pintarPerfilUI();
  pintarHistorial();
  pintarGlosario("");
  pintarVoces(); pintarIA();
  S.retomado = S.step !== "tramite";
  setConn(nivelAuto(), "auto");
  render(true);
  enrutar(true);
  S.retomado = false;

  // Para pruebas de aceptación automáticas
  global.VT.__estado = function () { return S; };
})(window);
