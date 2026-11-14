/**
 * M17 — Ajustes de lectura y accesibilidad. Cuatro grupos: Lectura, Voz,
 * Datos, Movimiento. La vista previa se actualiza en vivo con cada cambio.
 */
(function (global) {
  "use strict";
  var UI = global.VT.ui;
  var voice = global.VT.voice;

  var NIVELES_TEXTO = [["normal", "Normal"], ["grande", "Grande"], ["muy-grande", "Muy grande"]];
  var VELOCIDADES = [["0.75", "0.75×"], ["1", "1×"], ["1.25", "1.25×"]];

  function segmentado(nombre, opciones, valorActual) {
    return (
      '<div class="vt-acciones vt-acciones--fila" role="group" aria-label="' + UI.esc(nombre) + '">' +
      opciones
        .map(function (o) {
          return UI.boton({ texto: o[1], variante: o[0] === valorActual ? "primario" : "secundario", tamano: "base", extraAttrs: 'data-valor="' + o[0] + '" data-grupo="' + nombre + '" aria-pressed="' + (o[0] === valorActual) + '"' });
        })
        .join("") +
      "</div>"
    );
  }

  function render(state) {
    var cuerpo =
      '<h1 class="text-h1">Ajustes de lectura y accesibilidad</h1>' +

      UI.tarjeta({ variante: "asistente", html: '<p class="text-h3" id="m17-preview">Así se verá el texto del asistente.</p>' }) +

      "<section><h2 class=\"text-h2\">Lectura</h2>" +
      '<p class="text-body">Tamaño de letra</p>' +
      segmentado("tamano-letra", NIVELES_TEXTO, state.textSize) +
      UI.interruptor({ id: "m17-contraste", texto: "Alto contraste", activo: state.highContrast }) +
      "</section>" +

      "<section><h2 class=\"text-h2\">Voz</h2>" +
      '<p class="text-body">Velocidad de lectura</p>' +
      segmentado("velocidad", VELOCIDADES, String(state.voiceRate)) +
      UI.interruptor({ id: "m17-repetir-confirmaciones", texto: "Repetir siempre las confirmaciones", activo: state.siempreLeerConfirmaciones }) +
      UI.interruptor({ id: "m17-vibracion", texto: "Vibración", activo: state.vibracion }) +
      "</section>" +

      "<section><h2 class=\"text-h2\">Datos</h2>" +
      UI.interruptor({ id: "m17-ahorro-auto", texto: "Ahorro de datos automático", activo: state.connectivity.ahorroAutomatico }) +
      UI.interruptor({ id: "m17-wifi", texto: "Archivos solo con wifi", activo: state.connectivity.wifiOnly }) +
      "</section>" +

      "<section><h2 class=\"text-h2\">Movimiento</h2>" +
      UI.interruptor({ id: "m17-reducir-movimiento", texto: "Reducir animaciones", activo: state.reducedMotionForced }) +
      "</section>" +

      '<p class="text-caption" id="m17-guardado" aria-live="polite"></p>' +

      UI.navInferior("perfil");

    return UI.contenedorPrincipal(cuerpo);
  }

  function avisarGuardado(root) {
    var el = root.querySelector("#m17-guardado");
    el.textContent = "";
    global.setTimeout(function () { el.textContent = "Guardado."; }, 20);
  }

  function actualizarPreview(root, state) {
    var preview = root.querySelector("#m17-preview");
    voice.speak("Así se verá y escuchará el texto del asistente.", { rate: state.voiceRate, target: preview });
  }

  function mount(root, state) {
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

    UI.conectarInterruptor(root, "m17-contraste", function (v) { state.highContrast = v; global.VT.a11y.aplicarAjustes(state); global.VT.saveState(state); avisarGuardado(root); });
    UI.conectarInterruptor(root, "m17-repetir-confirmaciones", function (v) { state.siempreLeerConfirmaciones = v; global.VT.saveState(state); avisarGuardado(root); });
    UI.conectarInterruptor(root, "m17-vibracion", function (v) { state.vibracion = v; global.VT.saveState(state); avisarGuardado(root); });
    UI.conectarInterruptor(root, "m17-ahorro-auto", function (v) { global.VT.connectivity.setAhorroAutomatico(state, v); avisarGuardado(root); });
    UI.conectarInterruptor(root, "m17-wifi", function (v) { global.VT.connectivity.setWifiOnly(state, v); avisarGuardado(root); });
    UI.conectarInterruptor(root, "m17-reducir-movimiento", function (v) { state.reducedMotionForced = v; global.VT.a11y.aplicarAjustes(state); global.VT.saveState(state); avisarGuardado(root); });

    actualizarPreview(root, state);
  }

  function unmount() { voice.cancel(); }

  global.VT.screens.m17 = { id: "m17", title: "Ajustes de accesibilidad", render: render, mount: mount, unmount: unmount };
})(window);
