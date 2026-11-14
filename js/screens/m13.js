/**
 * M13 — Modo ligero de ahorro de datos. Misma estructura que M03 (mismos
 * botones, mismas posiciones) pero sin animaciones y con el aviso de ahorro.
 */
(function (global) {
  "use strict";
  var UI = global.VT.ui;
  var T = global.VT.data.TRAMITE;

  function filaRequisito(r) {
    return '<li class="vt-requisito">' + global.VT.icon(r.icon) + "<span class=\"text-body\">" + UI.esc(r.texto) + "</span></li>";
  }

  function render(state) {
    var cuerpo =
      '<div class="vt-chips-fila">' +
      UI.chip({ icono: "wifi", texto: "Ahorro de datos activado", variante: "info" }) +
      UI.boton({ texto: "Desactivar", variante: "fantasma", tamano: "base", id: "m13-desactivar" }) +
      "</div>" +

      UI.progresoMobile({ actual: 1, total: 4 }) +
      '<h1 class="text-h1">' + UI.esc(T.nombre) + "</h1>" +
      '<p class="text-body">Para gastar menos megas, quitamos las imágenes. Solo verás iconos y texto.</p>' +

      '<ul class="vt-lista-check">' + T.requisitos.slice(0, 3).map(filaRequisito).join("") + "</ul>" +

      UI.tarjeta({ html: '<p class="text-caption">Costo y lugar de pago</p><p class="text-h3">' + UI.esc(T.costo) + "</p><p class=\"text-body\">" + UI.esc(T.lugarPago) + "</p>" }) +

      '<div class="vt-acciones vt-acciones--fila">' +
      UI.boton({ texto: "Empezar", variante: "primario", tamano: "lg", id: "m13-empezar" }) +
      UI.boton({ texto: "Tengo una pregunta", variante: "fantasma", tamano: "base", id: "m13-pregunta" }) +
      "</div>" +

      '<p class="text-caption" id="m13-datos-usados">' + UI.esc(global.VT.connectivity.datosUsadosTexto(state)) + "</p>";

    return UI.contenedorPrincipal(cuerpo);
  }

  function mount(root, state) {
    root.querySelector("#m13-desactivar").addEventListener("click", function () {
      global.VT.connectivity.setLightMode(state, false);
      global.VT.navegar("m03");
    });
    root.querySelector("#m13-empezar").addEventListener("click", function () { global.VT.navegar("m05"); });
    root.querySelector("#m13-pregunta").addEventListener("click", function () { global.VT.navegar("m04"); });
  }

  global.VT.screens.m13 = { id: "m13", title: "Modo ligero", render: render, mount: mount };
})(window);
