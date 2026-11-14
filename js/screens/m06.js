/**
 * M06 — Validación por preguntas biográficas.
 * HABLAR transcribe la respuesta; CONFIRMAR la envía a validar (→ M07 o M08).
 * CORREGIR, antes de confirmar, solo descarta la transcripción para repetirla.
 */
(function (global) {
  "use strict";
  var UI = global.VT.ui;
  var voice = global.VT.voice;

  var _onVoiceState = null;

  function preguntaActual(state) {
    return global.VT.data.TRAMITE.preguntasValidacion[state.tramite.preguntaValidacionIndex];
  }

  function render(state) {
    var pregunta = preguntaActual(state);
    if (!pregunta) { return UI.contenedorPrincipal('<p class="text-body"><a href="#/m07">Continuar →</a></p>'); }

    var cuerpo =
      UI.progresoMobile({ actual: 2, total: 4 }) +
      UI.tarjeta({ variante: "asistente", html: UI.subtitulo({ id: "m06-subtitulo", texto: pregunta.pregunta }) }) +
      '<div id="m06-voz">' + UI.botonHablar({ estado: "reposo", id: "btn-hablar" }) + "</div>" +
      UI.campoTranscripcion({ id: "m06-transcripcion", texto: "Toca HABLAR y responde.", privado: false }) +
      '<div id="m06-acciones-confirmar" hidden>' +
      '<div class="vt-acciones vt-acciones--fila">' +
      UI.boton({ texto: "CONFIRMAR", variante: "exito", tamano: "lg", id: "m06-confirmar", icono: "check" }) +
      UI.boton({ texto: "CORREGIR", variante: "secundario", tamano: "lg", id: "m06-corregir", icono: "lapiz" }) +
      "</div>" +
      "</div>" +
      UI.boton({ texto: "Repetir pregunta", variante: "fantasma", tamano: "base", id: "m06-repetir", icono: "repetir" }) +
      UI.contadorIntentos(Math.min(state.tramite.intentosValidacion + 1, 3), 3);

    return UI.contenedorPrincipal(cuerpo);
  }

  function mapEstadoVoz(s) {
    return { idle: "reposo", listening: "escucha", processing: "procesando", speaking: "deshabilitado" }[s] || "reposo";
  }

  function mount(root, state) {
    state.tramite.pasoActual = 1; // canónico: Identidad
    global.VT.saveState(state);

    var pregunta = preguntaActual(state);
    if (!pregunta) return;

    var subtituloEl = root.querySelector("#m06-subtitulo");
    var transcripcionEl = root.querySelector("#m06-transcripcion");
    var accionesEl = root.querySelector("#m06-acciones-confirmar");
    var btn = root.querySelector("#btn-hablar");

    voice.speak(pregunta.pregunta, { rate: state.voiceRate, target: subtituloEl });

    _onVoiceState = function (s) { UI.actualizarEstadoVoz(root, mapEstadoVoz(s), { razonDeshabilitado: "El asistente está leyendo la pregunta" }); };
    voice.on("state", _onVoiceState);

    var intentoActual = null;

    function escuchar() {
      if (voice.getState() !== "idle") return;
      accionesEl.hidden = true;
      voice.listen({ timeout: 1400 }).then(function () {
        intentoActual = pregunta.intentos[Math.min(state.tramite.intentosValidacion, pregunta.intentos.length - 1)];
        var texto = intentoActual.texto;
        transcripcionEl.textContent = state.privacyMode ? "• • • • • •" : texto;
        global.VT.anunciar("Escuchamos: " + texto);
        accionesEl.hidden = false;
      });
    }

    if (btn) btn.addEventListener("click", escuchar);

    root.querySelector("#m06-repetir").addEventListener("click", function () {
      voice.speak(pregunta.pregunta, { rate: state.voiceRate, target: subtituloEl });
    });

    root.querySelector("#m06-corregir").addEventListener("click", function () {
      intentoActual = null;
      accionesEl.hidden = true;
      transcripcionEl.textContent = "Toca HABLAR y responde.";
    });

    root.querySelector("#m06-confirmar").addEventListener("click", function () {
      if (!intentoActual) return;
      if (intentoActual.correcta) {
        state.tramite.identidadValidada = true;
        state.tramite.intentosValidacion = 0;
        global.VT.saveState(state);
        global.VT.navegar("m07");
      } else {
        global.VT.saveState(state);
        global.VT.navegar("m08");
      }
    });
  }

  function unmount() {
    if (_onVoiceState) voice.off("state", _onVoiceState);
    _onVoiceState = null;
    voice.cancel();
  }

  global.VT.screens.m06 = { id: "m06", title: "Validación por preguntas", render: render, mount: mount, unmount: unmount };
})(window);
