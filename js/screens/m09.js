/**
 * M09 — Paso único: pregunta y escucha (núcleo del producto, mobile).
 * Se reutiliza para cada pregunta del paso "Datos" (state.tramite.preguntaDatosIndex).
 */
(function (global) {
  "use strict";
  var UI = global.VT.ui;
  var voice = global.VT.voice;
  var conn = global.VT.connectivity;

  var _onVoiceState = null;

  function preguntaActual(state) {
    return global.VT.data.TRAMITE.preguntasDatos[state.tramite.preguntaDatosIndex];
  }

  function render(state) {
    var pregunta = preguntaActual(state);
    if (!pregunta) {
      // Ya se respondieron todas las preguntas de Datos: seguimos a Confirmación.
      return UI.contenedorPrincipal('<p class="text-body">Redirigiendo a la confirmación…</p>');
    }
    var yaRespondida = state.tramite.datosRecolectados[state.tramite.preguntaDatosIndex];

    var cuerpo =
      '<div class="vt-chips-fila">' +
      UI.chipConexion(state.connectivity.status) +
      UI.chip({ icono: "celular-check", texto: "Guardado en tu celular", variante: "neutral" }) +
      "</div>" +
      UI.progresoMobile({ actual: 3, total: 4, etiqueta: "Datos" }) +
      UI.tarjeta({
        variante: "asistente",
        html: UI.subtitulo({ id: "m09-subtitulo", texto: pregunta.pregunta })
      }) +
      UI.campoTranscripcion({ id: "m09-transcripcion", texto: yaRespondida ? yaRespondida.valor : "Toca HABLAR y responde cuando quieras.", privado: state.privacyMode && !!yaRespondida }) +
      '<div id="m09-aviso-no-entendido"></div>' +
      '<div class="vt-zona-pulgar">' +
      UI.botonHablar({ estado: "reposo", id: "btn-hablar" }) +
      '<div class="vt-acciones vt-acciones--fila">' +
      UI.boton({ texto: "Repetir pregunta", variante: "fantasma", tamano: "base", id: "m09-repetir", icono: "repetir" }) +
      UI.boton({ texto: "Ayuda", variante: "fantasma", tamano: "base", href: "#/m04", icono: "ayuda" }) +
      UI.boton({ texto: "Atrás", variante: "fantasma", tamano: "base", id: "m09-atras", icono: "flecha_atras" }) +
      "</div>" +
      '<p class="text-caption" id="m09-siguiente">Después: confirmar tus datos</p>' +
      "</div>";

    return UI.contenedorPrincipal(cuerpo);
  }

  function mapEstadoVoz(s) {
    return { idle: "reposo", listening: "escucha", processing: "procesando", speaking: "deshabilitado" }[s] || "reposo";
  }

  function mount(root, state) {
    var pregunta = preguntaActual(state);
    if (!pregunta) { global.VT.navegar("m10"); return; }

    state.tramite.pasoActual = 2; // canónico: Identidad=1, Datos=2, Confirmación=3, Constancia=4
    global.VT.saveState(state);

    var subtituloEl = root.querySelector("#m09-subtitulo");
    var transcripcionEl = root.querySelector("#m09-transcripcion");
    var avisoEl = root.querySelector("#m09-aviso-no-entendido");
    var btn = root.querySelector("#btn-hablar");

    _onVoiceState = function (s) {
      UI.actualizarEstadoVoz(root, mapEstadoVoz(s), { razonDeshabilitado: "El asistente está leyendo la pregunta" });
    };
    voice.on("state", _onVoiceState);

    voice.speak(pregunta.pregunta, { rate: state.voiceRate, target: subtituloEl });

    function pedirRespuesta() {
      var intento = pregunta.intentos[Math.min(state.tramite.intentosDatos, pregunta.intentos.length - 1)];
      voice.listen({ timeout: 1400 }).then(function () {
        if (intento.entendida) {
          if (transcripcionEl) {
            transcripcionEl.textContent = state.privacyMode ? "• • • • • •" : intento.texto;
          }
          avisoEl.innerHTML = "";
          global.VT.anunciar("Entendimos: " + intento.texto);
          state.tramite.datosRecolectados[state.tramite.preguntaDatosIndex] = { campo: pregunta.campo, valor: intento.texto };
          state.tramite.intentosDatos = 0;
          state.tramite.preguntaDatosIndex++;
          global.VT.saveState(state);
          conn.encolarAvance(state, "Datos");
          global.setTimeout(function () {
            if (preguntaActual(state)) { global.VT.render(); } else { global.VT.navegar("m10"); }
          }, 650);
        } else {
          state.tramite.intentosDatos++;
          global.VT.saveState(state);
          avisoEl.innerHTML = UI.mensajeEstado({ variante: "advertencia", icono: "alerta", texto: "No entendí, ¿la repetimos?", role: "status" });
          global.VT.anunciar("No entendimos tu respuesta. ¿La repetimos?");
          if (btn) btn.focus();
        }
      });
    }

    if (btn) btn.addEventListener("click", function () {
      if (voice.getState() !== "idle") return;
      pedirRespuesta();
    });

    var repetirBtn = root.querySelector("#m09-repetir");
    if (repetirBtn) repetirBtn.addEventListener("click", function () {
      voice.speak(pregunta.pregunta, { rate: state.voiceRate, target: subtituloEl });
    });

    var atrasBtn = root.querySelector("#m09-atras");
    if (atrasBtn) atrasBtn.addEventListener("click", function () {
      if (state.tramite.preguntaDatosIndex > 0) {
        state.tramite.preguntaDatosIndex--;
        state.tramite.intentosDatos = 0;
        global.VT.saveState(state);
        global.VT.render();
      } else {
        global.VT.navegar("m07");
      }
    });
  }

  function unmount() {
    if (_onVoiceState) voice.off("state", _onVoiceState);
    _onVoiceState = null;
    voice.cancel();
  }

  global.VT.screens.m09 = { id: "m09", title: "Pregunta y escucha", render: render, mount: mount, unmount: unmount };
})(window);
