/**
 * M02 — Inicio por voz y elección del trámite.
 * La maqueta solo implementa un trámite de ejemplo (Renovación de DNI); los
 * demás atajos muestran un aviso honesto en vez de simular un flujo que no existe.
 */
(function (global) {
  "use strict";
  var UI = global.VT.ui;
  var voice = global.VT.voice;

  var _onVoiceState = null;

  function render(state) {
    var cuerpo =
      '<h2 class="text-h2">¿Qué trámite necesitas hoy?</h2>' +
      UI.botonHablar({ estado: "reposo", id: "btn-hablar", size: "mobile" }) +
      '<div id="m02-resultado"></div>' +
      '<div id="m02-aviso"></div>' +

      '<div class="vt-acciones">' +
      UI.boton({ texto: "Renovar DNI", variante: "secundario", tamano: "base", id: "m02-atajo-dni", icono: "reniec_dni" }) +
      UI.boton({ texto: "Antecedentes", variante: "secundario", tamano: "base", id: "m02-atajo-antecedentes", icono: "documento" }) +
      UI.boton({ texto: "Activar o extender RUC", variante: "secundario", tamano: "base", id: "m02-atajo-ruc", icono: "documento" }) +
      "</div>" +

      '<p><button type="button" class="vt-btn vt-btn--fantasma vt-btn--base" id="m02-escribir-toggle">Prefiero escribir</button></p>' +
      '<form id="m02-form-escribir" class="vt-acciones" hidden>' +
      '<label class="visually-hidden" for="m02-input-escribir">Escribe el trámite que necesitas</label>' +
      '<input type="text" id="m02-input-escribir" class="vt-transcript" placeholder="Por ejemplo: renovar mi DNI" />' +
      UI.boton({ texto: "Buscar", variante: "primario", tamano: "base", type: "submit" }) +
      "</form>" +

      UI.navInferior("inicio");

    return UI.contenedorPrincipal(cuerpo);
  }

  function mapEstadoVoz(s) {
    return { idle: "reposo", listening: "escucha", processing: "procesando", speaking: "reposo" }[s] || "reposo";
  }

  function mostrarConfirmacion(root, state, nombreTramite) {
    var cont = root.querySelector("#m02-resultado");
    cont.innerHTML = UI.tarjeta({
      variante: "asistente",
      html:
        '<p class="text-h3">Entendí: ' + UI.esc(nombreTramite) + "</p>" +
        '<p class="text-body">¿Es correcto?</p>' +
        '<div class="vt-acciones vt-acciones--fila">' +
        UI.boton({ texto: "CONFIRMAR", variante: "exito", tamano: "lg", id: "m02-confirmar", icono: "check" }) +
        UI.boton({ texto: "CORREGIR", variante: "secundario", tamano: "lg", id: "m02-corregir", icono: "lapiz" }) +
        "</div>"
    });
    root.querySelector("#m02-confirmar").addEventListener("click", function () { global.VT.navegar("m03"); });
    root.querySelector("#m02-corregir").addEventListener("click", function () { cont.innerHTML = ""; });
  }

  function avisoNoDisponible(root) {
    var aviso = root.querySelector("#m02-aviso");
    aviso.innerHTML = UI.mensajeEstado({ variante: "info", texto: "Por ahora esta maqueta solo cubre la Renovación de DNI por caducidad. Prueba con ese trámite." });
    global.VT.anunciar("Ese trámite todavía no está disponible en esta maqueta.");
  }

  function mount(root, state) {
    var btn = root.querySelector("#btn-hablar");
    _onVoiceState = function (s) { UI.actualizarEstadoVoz(root, mapEstadoVoz(s)); };
    voice.on("state", _onVoiceState);

    if (btn) btn.addEventListener("click", function () {
      if (voice.getState() !== "idle") return;
      voice.listen({ timeout: 1400, responses: ["Renovar mi DNI porque ya caducó"] }).then(function () {
        mostrarConfirmacion(root, state, global.VT.data.TRAMITE.nombre);
      });
    });

    root.querySelector("#m02-atajo-dni").addEventListener("click", function () { global.VT.navegar("m03"); });
    root.querySelector("#m02-atajo-antecedentes").addEventListener("click", function () { avisoNoDisponible(root); });
    root.querySelector("#m02-atajo-ruc").addEventListener("click", function () { avisoNoDisponible(root); });

    var toggle = root.querySelector("#m02-escribir-toggle");
    var form = root.querySelector("#m02-form-escribir");
    toggle.addEventListener("click", function () {
      form.hidden = !form.hidden;
      if (!form.hidden) root.querySelector("#m02-input-escribir").focus();
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      mostrarConfirmacion(root, state, global.VT.data.TRAMITE.nombre);
    });
  }

  function unmount() {
    if (_onVoiceState) voice.off("state", _onVoiceState);
    _onVoiceState = null;
    voice.cancel();
  }

  global.VT.screens.m02 = { id: "m02", title: "Inicio por voz", render: render, mount: mount, unmount: unmount };
})(window);
