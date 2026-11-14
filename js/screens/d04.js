/**
 * D04 — Conversación con panel de progreso (núcleo desktop, equivalente a M09).
 * Al responder una pregunta, su dato aparece en el panel derecho (fila que
 * se ilumina 300ms) con un enlace "Corregir" para volver a preguntarlo.
 */
(function (global) {
  "use strict";
  var UI = global.VT.ui;
  var voice = global.VT.voice;
  var conn = global.VT.connectivity;

  var _onVoiceState = null;

  function preguntaActual(state) { return global.VT.data.TRAMITE.preguntasDatos[state.tramite.preguntaDatosIndex]; }

  function listaDerecha(state, destacarIdx) {
    var datos = state.tramite.datosRecolectados || [];
    var filas = datos
      .map(function (d, i) {
        if (!d) return "";
        return (
          '<li class="' + (i === destacarIdx ? "vt-fila-flash" : "") + '" style="display:flex;justify-content:space-between;align-items:center;gap:8px;padding:4px 0">' +
          "<span>" + global.VT.icon("check") + " " + UI.esc(d.campo) + ": " + UI.esc(d.valor) + "</span>" +
          '<button type="button" class="vt-btn vt-btn--fantasma vt-btn--base" data-corregir-idx="' + i + '">Corregir</button>' +
          "</li>"
        );
      })
      .join("");
    return '<ul class="vt-lista-check" id="d04-confirmados">' + (filas || '<li class="text-caption">Aún no confirmas ningún dato.</li>') + "</ul>";
  }

  function render(state) {
    // Se fija aquí (no en mount) porque el panel izquierdo se calcula con
    // este valor en la misma llamada a render().
    state.tramite.pasoActual = 2;
    var izquierda = UI.progresoDesktopPanel({ pasos: global.VT.data.TRAMITE.pasos, actual: state.tramite.pasoActual });
    var pregunta = preguntaActual(state);

    var centro;
    if (!pregunta) {
      centro = '<p class="text-body">Ya respondiste todas las preguntas de datos. <a href="#/d05">Continuar a la confirmación →</a></p>';
    } else {
      var yaRespondida = state.tramite.datosRecolectados[state.tramite.preguntaDatosIndex];
      centro =
        UI.tarjeta({ variante: "asistente", html: UI.subtitulo({ id: "d04-subtitulo", texto: pregunta.pregunta }) }) +
        UI.campoTranscripcion({ id: "d04-transcripcion", texto: yaRespondida ? yaRespondida.valor : "Toca HABLAR y responde cuando quieras.", privado: state.privacyMode && !!yaRespondida }) +
        '<div id="d04-aviso-no-entendido"></div>' +
        UI.botonHablar({ estado: "reposo", id: "btn-hablar", size: "desktop" }) +
        '<div class="vt-acciones vt-acciones--fila">' +
        UI.boton({ texto: "Repetir pregunta", variante: "fantasma", tamano: "base", id: "d04-repetir", icono: "repetir" }) +
        UI.boton({ texto: "Ayuda", variante: "fantasma", tamano: "base", href: "#/m04", icono: "ayuda" }) +
        UI.boton({ texto: "Atrás", variante: "fantasma", tamano: "base", id: "d04-atras", icono: "flecha_atras" }) +
        "</div>";
    }

    var derecha =
      '<div class="vt-chips-fila">' + UI.chipConexion(state.connectivity.status) + UI.chip({ icono: "celular-check", texto: "Guardado en tu celular", variante: "neutral" }) + "</div>" +
      '<h2 class="text-h2">Datos confirmados</h2>' +
      listaDerecha(state, -1);

    var grid =
      '<div class="vt-desktop-grid">' +
      '<div class="vt-desktop-grid__izq">' + izquierda + "</div>" +
      '<div class="vt-desktop-grid__centro vt-acciones" id="d04-centro">' + centro + "</div>" +
      '<div class="vt-desktop-grid__der vt-acciones" id="d04-derecha">' + derecha + "</div>" +
      "</div>";

    return UI.cabeceraApp({ chipConexion: true, statusConexion: state.connectivity.status, mostrarAjustes: true, mostrarAyuda: true }) + UI.contenedorPrincipal(grid, "vt-main--escritorio");
  }

  function conectarCorregir(root, state) {
    root.querySelectorAll("[data-corregir-idx]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var idx = Number(btn.getAttribute("data-corregir-idx"));
        state.tramite.preguntaDatosIndex = idx;
        state.tramite.intentosDatos = 0;
        global.VT.saveState(state);
        global.VT.render();
      });
    });
  }

  function mount(root, state) {
    UI.conectarCabecera(root, state);
    global.VT.saveState(state);

    conectarCorregir(root, state);

    var pregunta = preguntaActual(state);
    if (!pregunta) return;

    var subtituloEl = root.querySelector("#d04-subtitulo");
    var transcripcionEl = root.querySelector("#d04-transcripcion");
    var avisoEl = root.querySelector("#d04-aviso-no-entendido");
    var btn = root.querySelector("#btn-hablar");

    voice.speak(pregunta.pregunta, { rate: state.voiceRate, target: subtituloEl });

    _onVoiceState = function (s) {
      UI.actualizarEstadoVoz(root, { idle: "reposo", listening: "escucha", processing: "procesando", speaking: "deshabilitado" }[s] || "reposo", { razonDeshabilitado: "El asistente está leyendo la pregunta" });
    };
    voice.on("state", _onVoiceState);

    btn.addEventListener("click", function () {
      if (voice.getState() !== "idle") return;
      var intento = pregunta.intentos[Math.min(state.tramite.intentosDatos, pregunta.intentos.length - 1)];
      voice.listen({ timeout: 1400 }).then(function () {
        if (intento.entendida) {
          transcripcionEl.textContent = state.privacyMode ? "• • • • • •" : intento.texto;
          avisoEl.innerHTML = "";
          var idx = state.tramite.preguntaDatosIndex;
          state.tramite.datosRecolectados[idx] = { campo: pregunta.campo, valor: intento.texto };
          state.tramite.intentosDatos = 0;
          state.tramite.preguntaDatosIndex++;
          global.VT.saveState(state);
          conn.encolarAvance(state, "Datos");
          root.querySelector("#d04-confirmados").outerHTML = listaDerecha(state, idx);
          conectarCorregir(root, state);
          global.VT.anunciar("Entendimos: " + intento.texto);
          global.setTimeout(function () { global.VT.render(); }, 650);
        } else {
          state.tramite.intentosDatos++;
          global.VT.saveState(state);
          avisoEl.innerHTML = UI.mensajeEstado({ variante: "advertencia", icono: "alerta", texto: "No entendí, ¿la repetimos?", role: "status" });
          global.VT.anunciar("No entendimos tu respuesta. ¿La repetimos?");
        }
      });
    });

    var repetirBtn = root.querySelector("#d04-repetir");
    if (repetirBtn) repetirBtn.addEventListener("click", function () { voice.speak(pregunta.pregunta, { rate: state.voiceRate, target: subtituloEl }); });

    var atrasBtn = root.querySelector("#d04-atras");
    if (atrasBtn) atrasBtn.addEventListener("click", function () {
      if (state.tramite.preguntaDatosIndex > 0) {
        state.tramite.preguntaDatosIndex--;
        state.tramite.intentosDatos = 0;
        global.VT.saveState(state);
        global.VT.render();
      } else {
        global.VT.navegar("d03");
      }
    });
  }

  function unmount() {
    if (_onVoiceState) voice.off("state", _onVoiceState);
    _onVoiceState = null;
    voice.cancel();
  }

  global.VT.screens.d04 = { id: "d04", title: "Conversación (desktop)", render: render, mount: mount, unmount: unmount };
})(window);
