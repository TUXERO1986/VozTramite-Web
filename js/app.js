/**
 * VozTrámite — Router por hash, estado global e inicio de la app (js/app.js)
 *
 * Cada pantalla se registra en window.VT.screens['id'] = { id, title, render(state), mount(root,state) }.
 * app.js lee location.hash (#/m09, #/d04) y monta la pantalla correspondiente
 * dentro de #app-root. El estado vive en un único objeto persistido en
 * localStorage para que M16/D08 puedan "reanudar donde quedaste".
 */
(function (global) {
  "use strict";

  var STORAGE_KEY = "voztramite:estado";
  var ui, data; // se resuelven en init(), cuando todos los scripts ya cargaron

  function estadoInicial() {
    var t = global.VT.data.TRAMITE;
    return {
      onboarded: false,
      modo: null, // 'hablar' | 'leer'
      vozSilenciada: false,
      privacyMode: false,
      textSize: "normal",
      highContrast: false,
      reducedMotionForced: false,
      voiceRate: 1,
      siempreLeerConfirmaciones: true,
      vibracion: false,
      connectivity: { status: "buena", lightMode: false, wifiOnly: false, ahorroAutomatico: true },
      cola: [],
      tramite: {
        id: t.id,
        nombre: t.nombre,
        pasoActual: 1,
        datosRecolectados: [],
        datosConfirmados: {},
        confirmacionIndex: 0,
        intentosValidacion: 0,
        intentosDatos: 0,
        identidadValidada: false,
        preguntaValidacionIndex: 0,
        preguntaDatosIndex: 0,
        codigoOrientacion: null,
        enCurso: false,
        guardadoEn: null
      }
    };
  }

  function fusionar(base, guardado) {
    if (!guardado) return base;
    var out = Object.assign({}, base, guardado);
    out.connectivity = Object.assign({}, base.connectivity, guardado.connectivity || {});
    out.tramite = Object.assign({}, base.tramite, guardado.tramite || {});
    out.cola = Array.isArray(guardado.cola) ? guardado.cola : base.cola;
    return out;
  }

  var _state = null;

  function getState() {
    if (_state) return _state;
    try {
      var raw = global.localStorage.getItem(STORAGE_KEY);
      _state = fusionar(estadoInicial(), raw ? JSON.parse(raw) : null);
    } catch (e) {
      _state = estadoInicial();
    }
    return _state;
  }

  function saveState(state) {
    _state = state;
    try { global.localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* almacenamiento no disponible: se sigue en memoria */ }
  }

  function reiniciarTramite(state) {
    var inicial = estadoInicial();
    state.tramite = inicial.tramite;
    state.cola = [];
    saveState(state);
  }

  function navegar(id) {
    global.location.hash = id ? "#/" + id : "#/";
  }

  function anunciar(mensaje, opts) {
    opts = opts || {};
    var region = document.getElementById(opts.assertive ? "vt-live-alert" : "vt-live-polite");
    global.VT.a11y.anunciar(region, mensaje);
  }

  /** A qué pantalla volver para continuar exactamente donde quedó el trámite.
   * Se basa en `datosConfirmados` (no en `confirmacionIndex`, que solo lleva
   * la cuenta interna de M10) porque tanto M10 como D05 escriben ahí. */
  function pantallaDeReanudacion(state) {
    var t = state.tramite;
    if (!t.identidadValidada) return "m06";
    var datos = global.VT.data.TRAMITE.preguntasDatos;
    var todoConfirmado = datos.every(function (d) { return !!t.datosConfirmados[d.campo]; });
    if (todoConfirmado) return "m11";
    var faltaCapturar = t.preguntaDatosIndex < datos.length;
    return faltaCapturar ? "m09" : "m10";
  }

  function formatearFecha(ts) {
    if (!ts) return "";
    var d = new Date(ts);
    return d.toLocaleDateString("es-PE", { day: "2-digit", month: "short" }) + ", " + d.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });
  }

  // ---- Índice de pantallas (ruta especial "#/") --------------------------
  var GRUPOS_INDICE = [
    {
      titulo: "Mobile — Flujo 1: asistencia por voz",
      items: [
        ["m01", "Bienvenida, privacidad y modo de uso"],
        ["m02", "Inicio por voz y elección del trámite"],
        ["m03", "Requisitos en lenguaje sencillo"],
        ["m04", "Explicación de un término (hoja inferior)"],
        ["m05", "Cómo validar tu identidad"],
        ["m06", "Validación por preguntas biográficas"],
        ["m07", "Identidad validada"],
        ["m08", "Error de validación y recuperación"],
        ["m09", "Paso único: pregunta y escucha (núcleo)"],
        ["m10", "Confirmación en voz alta"],
        ["m11", "Solicitud preparada y constancia"]
      ]
    },
    {
      titulo: "Mobile — Flujo 2: offline y conectividad intermitente",
      items: [
        ["m12", "Diagnóstico de conexión"],
        ["m13", "Modo ligero de ahorro de datos"],
        ["m14", "Avance guardado en el celular"],
        ["m15", "Pendientes de envío por paquetes"],
        ["m16", "Reanudar donde quedaste"],
        ["m17", "Ajustes de lectura y accesibilidad"]
      ]
    },
    {
      titulo: "Desktop",
      items: [
        ["d01", "Inicio, privacidad y elección del trámite"],
        ["d02", "Requisitos y glosario lateral"],
        ["d03", "Validación de identidad"],
        ["d04", "Conversación con panel de progreso (núcleo)"],
        ["d05", "Confirmación y resumen de datos"],
        ["d06", "Solicitud preparada, constancia y visor"],
        ["d07", "Conexión y modo ligero"],
        ["d08", "Avance guardado, pendientes y reanudación"],
        ["d09", "Ajustes de lectura y accesibilidad"]
      ]
    }
  ];

  function renderIndice() {
    var grupos = GRUPOS_INDICE.map(function (g) {
      var filas = g.items
        .map(function (it) {
          return '<li><a href="#/' + it[0] + '"><span class="vt-indice__id">' + it[0].toUpperCase() + "</span>" + it[1] + "</a></li>";
        })
        .join("");
      return '<section class="vt-indice__grupo"><h2 class="text-h2">' + g.titulo + '</h2><ul class="vt-indice__lista">' + filas + "</ul></section>";
    }).join("");

    return (
      '<main id="main-content" tabindex="-1" class="vt-main vt-indice">' +
      '<h1 class="text-display">VozTrámite</h1>' +
      '<p class="text-body">Índice de las 26 pantallas de la maqueta, agrupadas por flujo. Pensado para la revisión del profesor — no es parte del guion del usuario final.</p>' +
      '<p class="text-body"><a href="#/m01">Empezar desde el inicio (M01) →</a> · <a href="#/componentes">Ver muestra de componentes →</a></p>' +
      grupos +
      "</main>"
    );
  }

  // ---- Router --------------------------------------------------------------
  function idActual() {
    var h = global.location.hash || "";
    var m = h.match(/^#\/(.+)$/);
    return m ? m[1] : "";
  }

  var _pantallaMontada = null;
  var _esPrimeraCarga = true;

  function render() {
    var state = getState();
    global.VT.a11y.aplicarAjustes(state);
    global.VT.connectivity.montarPanelDebug(state);
    global.VT.voice.setSilenciado(state.vozSilenciada);

    if (_pantallaMontada && typeof _pantallaMontada.unmount === "function") {
      try { _pantallaMontada.unmount(); } catch (e) { /* no bloquear la navegación por una limpieza fallida */ }
    }
    _pantallaMontada = null;

    var root = document.getElementById("app-root");
    var id = idActual();

    if (!id) {
      root.innerHTML = renderIndice();
      document.title = "VozTrámite — Índice de pantallas";
    } else if (global.VT.screens[id]) {
      var screen = global.VT.screens[id];
      root.innerHTML = screen.render(state);
      document.title = "VozTrámite — " + screen.title;
      if (typeof screen.mount === "function") screen.mount(root, state);
      _pantallaMontada = screen;
    } else {
      root.innerHTML =
        '<main id="main-content" tabindex="-1" class="vt-main"><h1 class="text-h2">No encontramos esa pantalla</h1>' +
        '<p class="text-body"><a href="#/">Volver al índice</a></p></main>';
      document.title = "VozTrámite";
    }

    // En la primera carga de la página no se roba el foco: así el enlace
    // "Ir al asistente" sigue siendo la primera parada real al tabular (2.4.1).
    if (!_esPrimeraCarga) {
      var main = root.querySelector("#main-content");
      if (main && (!root.contains(document.activeElement) || document.activeElement === document.body)) {
        main.focus({ preventScroll: true });
      }
    }
    _esPrimeraCarga = false;
  }

  function init() {
    var state = getState();
    global.VT.a11y.aplicarAjustes(state);
    global.VT.a11y.initTeclasGlobales(state);
    global.addEventListener("hashchange", render);
    global.VT.connectivity.on(function () { /* las pantallas se suscriben por su cuenta si lo necesitan */ });
    render();
  }

  global.VT = global.VT || {};
  global.VT.screens = global.VT.screens || {};
  global.VT.getState = getState;
  global.VT.saveState = saveState;
  global.VT.reiniciarTramite = reiniciarTramite;
  global.VT.navegar = navegar;
  global.VT.anunciar = anunciar;
  global.VT.formatearFecha = formatearFecha;
  global.VT.pantallaDeReanudacion = pantallaDeReanudacion;
  global.VT.render = render;

  document.addEventListener("DOMContentLoaded", init);
})(window);
