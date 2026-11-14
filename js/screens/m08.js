/**
 * M08 — Error de validación y recuperación. Tono de ayuda, nunca de falla;
 * nunca bloquea la cuenta.
 */
(function (global) {
  "use strict";
  var UI = global.VT.ui;

  function render(state) {
    var cuerpo =
      UI.mensajeEstado({
        variante: "error",
        titulo: "No pudimos validar tu respuesta",
        texto: "Puede que no te hayamos escuchado bien, o que la respuesta no coincida con lo que tenemos registrado."
      }) +
      UI.contadorIntentos(Math.min(state.tramite.intentosValidacion + 1, 3), 3) +
      '<div class="vt-acciones">' +
      UI.boton({ texto: "Intentar otra vez", variante: "primario", tamano: "lg", id: "m08-reintentar" }) +
      UI.boton({ texto: "Probar otra pregunta", variante: "secundario", tamano: "lg", id: "m08-otra" }) +
      UI.boton({ texto: "Seguir más tarde (guardamos tu avance)", variante: "fantasma", tamano: "lg", id: "m08-despues" }) +
      "</div>";
    return UI.contenedorPrincipal(cuerpo);
  }

  function mount(root, state) {
    root.querySelector("#m08-reintentar").addEventListener("click", function () {
      state.tramite.intentosValidacion = Math.min(state.tramite.intentosValidacion + 1, 2);
      global.VT.saveState(state);
      global.VT.navegar("m06");
    });
    root.querySelector("#m08-otra").addEventListener("click", function () {
      state.tramite.preguntaValidacionIndex++;
      state.tramite.intentosValidacion = 0;
      global.VT.saveState(state);
      global.VT.navegar("m06");
    });
    root.querySelector("#m08-despues").addEventListener("click", function () {
      state.tramite.enCurso = true;
      state.tramite.guardadoEn = Date.now();
      global.VT.saveState(state);
      global.VT.navegar("m14");
    });
  }

  global.VT.screens.m08 = { id: "m08", title: "Error de validación", render: render, mount: mount };
})(window);
