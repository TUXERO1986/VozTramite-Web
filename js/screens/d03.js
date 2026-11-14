/**
 * D03 — Validación de identidad (desktop). Un solo marco que reproduce los
 * cuatro estados de M05–M08 sin cambiar de pantalla.
 */
(function (global) {
  "use strict";
  var UI = global.VT.ui;
  var voice = global.VT.voice;

  var _onVoiceState = null;

  function preguntaActual(state) { return global.VT.data.TRAMITE.preguntasValidacion[state.tramite.preguntaValidacionIndex]; }

  function render(state) {
    var izquierda = "";
    var centro = '<div id="d03-marco"></div>';
    var derecha =
      '<h2 class="text-h2">DNI electrónico</h2>' +
      '<p class="text-body">En la versión real, acercarías tu DNI electrónico a la parte de atrás del celular o a un lector durante unos segundos. Esta maqueta no puede leer chips NFC reales.</p>' +
      UI.mensajeEstado({ variante: "info", texto: "Esta verificación es una simulación del prototipo y no valida tu identidad ante RENIEC." });

    var grid =
      '<div class="vt-desktop-grid">' +
      '<div class="vt-desktop-grid__izq">' + izquierda + "</div>" +
      '<div class="vt-desktop-grid__centro vt-acciones">' + centro + "</div>" +
      '<div class="vt-desktop-grid__der vt-acciones">' + derecha + "</div>" +
      "</div>";

    return UI.cabeceraApp({ chipConexion: true, statusConexion: state.connectivity.status, mostrarAjustes: true, mostrarAyuda: true }) + UI.contenedorPrincipal(grid, "vt-main--escritorio");
  }

  function vistaMetodo(root, state) {
    var marco = root.querySelector("#d03-marco");
    marco.innerHTML =
      '<h2 class="text-h2">Cómo validar tu identidad</h2>' +
      '<div class="vt-acciones">' +
      '<button type="button" class="vt-opcion vt-opcion--recomendada" id="d03-preguntas">' +
      global.VT.icon("ayuda", { className: "vt-opcion__glifo" }) +
      '<span class="vt-opcion__texto"><span class="text-h3">Responder preguntas sobre mí</span><span class="text-body">Te hacemos una pregunta que solo tú sabrías responder.</span></span>' +
      "</button>" +
      '<div class="vt-opcion"><span class="vt-opcion__glifo">' + global.VT.icon("reniec_dni") + "</span>" +
      '<span class="vt-opcion__texto"><span class="text-h3">Usar mi DNI electrónico</span><span class="text-body">Mira el panel de la derecha para ver cómo funciona.</span></span></div>' +
      "</div>";
    marco.querySelector("#d03-preguntas").addEventListener("click", function () { vistaPregunta(root, state); });
  }

  function vistaPregunta(root, state) {
    var marco = root.querySelector("#d03-marco");
    var pregunta = preguntaActual(state);
    marco.innerHTML =
      UI.tarjeta({ variante: "asistente", html: UI.subtitulo({ id: "d03-subtitulo", texto: pregunta.pregunta }) }) +
      UI.botonHablar({ estado: "reposo", id: "btn-hablar", size: "desktop" }) +
      UI.campoTranscripcion({ id: "d03-transcripcion", texto: "Toca HABLAR y responde." }) +
      '<div id="d03-acciones-confirmar" hidden><div class="vt-acciones vt-acciones--fila">' +
      UI.boton({ texto: "CONFIRMAR", variante: "exito", tamano: "lg", id: "d03-confirmar", icono: "check" }) +
      UI.boton({ texto: "CORREGIR", variante: "secundario", tamano: "lg", id: "d03-corregir", icono: "lapiz" }) +
      "</div></div>" +
      UI.contadorIntentos(Math.min(state.tramite.intentosValidacion + 1, 3), 3);

    var subtituloEl = marco.querySelector("#d03-subtitulo");
    var transcripcionEl = marco.querySelector("#d03-transcripcion");
    var accionesEl = marco.querySelector("#d03-acciones-confirmar");
    var btn = marco.querySelector("#btn-hablar");
    var intentoActual = null;

    voice.speak(pregunta.pregunta, { rate: state.voiceRate, target: subtituloEl });

    if (_onVoiceState) voice.off("state", _onVoiceState);
    _onVoiceState = function (s) {
      UI.actualizarEstadoVoz(root, { idle: "reposo", listening: "escucha", processing: "procesando", speaking: "deshabilitado" }[s] || "reposo", { razonDeshabilitado: "El asistente está leyendo la pregunta" });
    };
    voice.on("state", _onVoiceState);

    btn.addEventListener("click", function () {
      if (voice.getState() !== "idle") return;
      accionesEl.hidden = true;
      voice.listen({ timeout: 1400 }).then(function () {
        intentoActual = pregunta.intentos[Math.min(state.tramite.intentosValidacion, pregunta.intentos.length - 1)];
        transcripcionEl.textContent = state.privacyMode ? "• • • • • •" : intentoActual.texto;
        accionesEl.hidden = false;
      });
    });
    marco.querySelector("#d03-corregir").addEventListener("click", function () {
      intentoActual = null;
      accionesEl.hidden = true;
      transcripcionEl.textContent = "Toca HABLAR y responde.";
    });
    marco.querySelector("#d03-confirmar").addEventListener("click", function () {
      if (!intentoActual) return;
      if (intentoActual.correcta) {
        state.tramite.identidadValidada = true;
        state.tramite.intentosValidacion = 0;
        global.VT.saveState(state);
        vistaExito(root, state);
      } else {
        global.VT.saveState(state);
        vistaError(root, state);
      }
    });
  }

  function vistaExito(root, state) {
    voice.cancel();
    var marco = root.querySelector("#d03-marco");
    marco.innerHTML =
      UI.mensajeEstado({ variante: "exito", icono: "check-circulo", titulo: "Identidad validada en esta simulación", texto: "Esto no reemplaza una validación oficial ante RENIEC." }) +
      '<div class="vt-acciones vt-acciones--fila">' +
      UI.boton({ texto: "Continuar con mi trámite", variante: "primario", tamano: "lg", id: "d03-continuar" }) +
      "</div>";
    marco.querySelector("#d03-continuar").focus();
    marco.querySelector("#d03-continuar").addEventListener("click", function () { global.VT.navegar("d04"); });
  }

  function vistaError(root, state) {
    voice.cancel();
    var marco = root.querySelector("#d03-marco");
    marco.innerHTML =
      UI.mensajeEstado({ variante: "error", titulo: "No pudimos validar tu respuesta", texto: "Puede que no te hayamos escuchado bien." }) +
      UI.contadorIntentos(Math.min(state.tramite.intentosValidacion + 1, 3), 3) +
      '<div class="vt-acciones">' +
      UI.boton({ texto: "Intentar otra vez", variante: "primario", tamano: "lg", id: "d03-reintentar" }) +
      UI.boton({ texto: "Probar otra pregunta", variante: "secundario", tamano: "lg", id: "d03-otra" }) +
      "</div>";
    marco.querySelector("#d03-reintentar").addEventListener("click", function () {
      state.tramite.intentosValidacion = Math.min(state.tramite.intentosValidacion + 1, 2);
      global.VT.saveState(state);
      vistaPregunta(root, state);
    });
    marco.querySelector("#d03-otra").addEventListener("click", function () {
      state.tramite.preguntaValidacionIndex++;
      state.tramite.intentosValidacion = 0;
      global.VT.saveState(state);
      vistaPregunta(root, state);
    });
  }

  function mount(root, state) {
    UI.conectarCabecera(root, state);
    state.tramite.pasoActual = 1;
    global.VT.saveState(state);
    if (state.tramite.identidadValidada) { vistaExito(root, state); } else { vistaMetodo(root, state); }
  }

  function unmount() {
    if (_onVoiceState) voice.off("state", _onVoiceState);
    _onVoiceState = null;
    voice.cancel();
  }

  global.VT.screens.d03 = { id: "d03", title: "Validar identidad (desktop)", render: render, mount: mount, unmount: unmount };
})(window);
