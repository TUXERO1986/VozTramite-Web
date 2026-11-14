/**
 * D09 — Ajustes de lectura y accesibilidad (desktop, equivalente a M17).
 * Mismos controles; vista previa grande a la derecha y aviso "Guardado"
 * tras cada cambio.
 */
(function (global) {
  "use strict";
  var UI = global.VT.ui;
  var voice = global.VT.voice;

  var NIVELES_TEXTO = [["normal", "Normal"], ["grande", "Grande"], ["muy-grande", "Muy grande"]];
  var VELOCIDADES = [["0.75", "0.75×"], ["1", "1×"], ["1.25", "1.25×"]];
  var GRUPOS = [["d09-lectura", "Lectura"], ["d09-voz", "Voz"], ["d09-datos", "Datos"], ["d09-movimiento", "Movimiento"]];

  function segmentado(nombre, opciones, valorActual) {
    return (
      '<div class="vt-acciones vt-acciones--fila" role="group" aria-label="' + UI.esc(nombre) + '">' +
      opciones.map(function (o) { return UI.boton({ texto: o[1], variante: o[0] === valorActual ? "primario" : "secundario", tamano: "base", extraAttrs: 'data-valor="' + o[0] + '" data-grupo="' + nombre + '" aria-pressed="' + (o[0] === valorActual) + '"' }); }).join("") +
      "</div>"
    );
  }

  function render(state) {
    var izquierda = '<ul class="vt-acciones">' + GRUPOS.map(function (g) { return '<li><a href="#' + g[0] + '">' + g[1] + "</a></li>"; }).join("") + "</ul>";

    var centro =
      '<section id="d09-lectura"><h2 class="text-h2">Lectura</h2>' +
      '<p class="text-body">Tamaño de letra</p>' + segmentado("tamano-letra", NIVELES_TEXTO, state.textSize) +
      UI.interruptor({ id: "d09-contraste", texto: "Alto contraste", activo: state.highContrast }) +
      "</section>" +
      '<section id="d09-voz"><h2 class="text-h2">Voz</h2>' +
      '<p class="text-body">Velocidad de lectura</p>' + segmentado("velocidad", VELOCIDADES, String(state.voiceRate)) +
      UI.interruptor({ id: "d09-repetir-confirmaciones", texto: "Repetir siempre las confirmaciones", activo: state.siempreLeerConfirmaciones }) +
      UI.interruptor({ id: "d09-vibracion", texto: "Vibración", activo: state.vibracion }) +
      "</section>" +
      '<section id="d09-datos"><h2 class="text-h2">Datos</h2>' +
      UI.interruptor({ id: "d09-ahorro-auto", texto: "Ahorro de datos automático", activo: state.connectivity.ahorroAutomatico }) +
      UI.interruptor({ id: "d09-wifi", texto: "Archivos solo con wifi", activo: state.connectivity.wifiOnly }) +
      "</section>" +
      '<section id="d09-movimiento"><h2 class="text-h2">Movimiento</h2>' +
      UI.interruptor({ id: "d09-reducir-movimiento", texto: "Reducir animaciones", activo: state.reducedMotionForced }) +
      "</section>" +
      '<p class="text-caption" id="d09-guardado" aria-live="polite"></p>';

    var derecha = UI.tarjeta({ variante: "asistente", html: '<p class="text-caption">Vista previa</p><p class="text-h3" id="d09-preview">Así se verá el texto del asistente.</p>' });

    var grid =
      '<div class="vt-desktop-grid">' +
      '<div class="vt-desktop-grid__izq">' + izquierda + "</div>" +
      '<div class="vt-desktop-grid__centro vt-acciones">' + centro + "</div>" +
      '<div class="vt-desktop-grid__der">' + derecha + "</div>" +
      "</div>";

    return UI.cabeceraApp({ chipConexion: true, statusConexion: state.connectivity.status, mostrarAjustes: false, mostrarAyuda: true }) + UI.contenedorPrincipal(grid, "vt-main--escritorio");
  }

  function avisarGuardado(root) {
    var el = root.querySelector("#d09-guardado");
    el.textContent = "";
    global.setTimeout(function () { el.textContent = "Guardado."; }, 20);
  }

  function actualizarPreview(root, state) {
    voice.speak("Así se verá y escuchará el texto del asistente.", { rate: state.voiceRate, target: root.querySelector("#d09-preview") });
  }

  function mount(root, state) {
    UI.conectarCabecera(root, state);

    root.querySelectorAll("[data-grupo]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var grupo = btn.getAttribute("data-grupo");
        var valor = btn.getAttribute("data-valor");
        if (grupo === "tamano-letra") { state.textSize = valor; global.VT.a11y.aplicarAjustes(state); }
        if (grupo === "velocidad") { state.voiceRate = Number(valor); }
        global.VT.saveState(state);
        avisarGuardado(root);
        global.VT.render();
      });
    });

    UI.conectarInterruptor(root, "d09-contraste", function (v) { state.highContrast = v; global.VT.a11y.aplicarAjustes(state); global.VT.saveState(state); avisarGuardado(root); });
    UI.conectarInterruptor(root, "d09-repetir-confirmaciones", function (v) { state.siempreLeerConfirmaciones = v; global.VT.saveState(state); avisarGuardado(root); });
    UI.conectarInterruptor(root, "d09-vibracion", function (v) { state.vibracion = v; global.VT.saveState(state); avisarGuardado(root); });
    UI.conectarInterruptor(root, "d09-ahorro-auto", function (v) { global.VT.connectivity.setAhorroAutomatico(state, v); avisarGuardado(root); });
    UI.conectarInterruptor(root, "d09-wifi", function (v) { global.VT.connectivity.setWifiOnly(state, v); avisarGuardado(root); });
    UI.conectarInterruptor(root, "d09-reducir-movimiento", function (v) { state.reducedMotionForced = v; global.VT.a11y.aplicarAjustes(state); global.VT.saveState(state); avisarGuardado(root); });

    actualizarPreview(root, state);
  }

  function unmount() { voice.cancel(); }

  global.VT.screens.d09 = { id: "d09", title: "Ajustes de accesibilidad (desktop)", render: render, mount: mount, unmount: unmount };
})(window);
