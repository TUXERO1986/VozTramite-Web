/**
 * M05 — Cómo validar tu identidad.
 * Solo la opción "Responder preguntas sobre mí" tiene un flujo implementado
 * (M06); el DNI electrónico es un método real pero esta maqueta no lee
 * chips NFC, así que "Explícame cómo" solo explica, sin simular una lectura.
 */
(function (global) {
  "use strict";
  var UI = global.VT.ui;

  function render(state) {
    var cuerpo =
      UI.progresoMobile({ actual: 2, total: 4 }) +
      '<h2 class="text-h2">Cómo validar tu identidad</h2>' +

      '<div class="vt-acciones">' +
      '<button type="button" class="vt-opcion vt-opcion--recomendada" id="m05-preguntas">' +
      global.VT.icon("ayuda", { className: "vt-opcion__glifo" }) +
      '<span class="vt-opcion__texto"><span class="text-h3">Responder preguntas sobre mí</span><span class="text-body">Te hacemos una o dos preguntas que solo tú sabrías responder.</span></span>' +
      "</button>" +

      '<div class="vt-opcion" id="m05-dnie">' +
      global.VT.icon("reniec_dni", { className: "vt-opcion__glifo" }) +
      '<span class="vt-opcion__texto"><span class="text-h3">Usar mi DNI electrónico</span><span class="text-body">Acercas tu DNI electrónico al celular para confirmar que eres tú.</span>' +
      '<button type="button" class="vt-btn vt-btn--fantasma vt-btn--base" id="m05-dnie-explicar">Explícame cómo</button>' +
      '<p class="text-body" id="m05-dnie-texto" hidden>Esta maqueta no puede leer chips NFC reales, así que esta opción es solo informativa aquí: en la versión real, acercarías tu DNI electrónico a la parte de atrás del celular durante unos segundos.</p>' +
      "</span>" +
      "</div>" +
      "</div>" +

      UI.mensajeEstado({ variante: "info", texto: "Esta verificación es una simulación del prototipo y no valida tu identidad ante RENIEC." });

    return UI.contenedorPrincipal(cuerpo);
  }

  function mount(root, state) {
    root.querySelector("#m05-preguntas").addEventListener("click", function () { global.VT.navegar("m06"); });
    root.querySelector("#m05-dnie-explicar").addEventListener("click", function (e) {
      e.stopPropagation();
      var texto = root.querySelector("#m05-dnie-texto");
      texto.hidden = !texto.hidden;
    });
  }

  global.VT.screens.m05 = { id: "m05", title: "Validar identidad", render: render, mount: mount };
})(window);
