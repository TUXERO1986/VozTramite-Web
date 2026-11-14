/**
 * M07 — Identidad validada. Sin avance automático: el foco va al botón
 * principal y es el usuario quien decide continuar.
 */
(function (global) {
  "use strict";
  var UI = global.VT.ui;

  function render(state) {
    var cuerpo =
      UI.mensajeEstado({
        variante: "exito",
        icono: "check-circulo",
        titulo: "Identidad validada en esta simulación",
        texto: "Respondiste correctamente la pregunta de seguridad. Esto no reemplaza una validación oficial ante RENIEC."
      }) +
      '<div class="vt-acciones vt-acciones--fila">' +
      UI.boton({ texto: "Continuar con mi trámite", variante: "primario", tamano: "lg", id: "m07-continuar" }) +
      UI.boton({ texto: "Volver atrás", variante: "fantasma", tamano: "base", id: "m07-atras" }) +
      "</div>";
    return UI.contenedorPrincipal(cuerpo);
  }

  function mount(root) {
    var continuar = root.querySelector("#m07-continuar");
    continuar.focus();
    continuar.addEventListener("click", function () { global.VT.navegar("m09"); });
    root.querySelector("#m07-atras").addEventListener("click", function () {
      if (global.history.length > 1) { global.history.back(); } else { global.VT.navegar("m05"); }
    });
  }

  global.VT.screens.m07 = { id: "m07", title: "Identidad validada", render: render, mount: mount };
})(window);
