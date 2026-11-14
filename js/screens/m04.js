/**
 * M04 — Explicación de un término.
 * El guion la especifica como hoja inferior: M03 la abre así, en contexto,
 * sobre el término que el usuario tocó. Esta ruta (#/m04) es la versión de
 * página completa para poder llegar a ella directamente por hash (revisión).
 * "Cerrar" vuelve exactamente a donde estaba el usuario (atrás del historial).
 */
(function (global) {
  "use strict";
  var UI = global.VT.ui;
  var voice = global.VT.voice;

  function render(state) {
    var glosario = global.VT.data.TRAMITE.glosario;
    var idx = state._m04Index || 0;
    var entrada = glosario[idx];

    var selector = glosario
      .map(function (g, i) {
        return UI.boton({ texto: g.termino, variante: i === idx ? "primario" : "secundario", tamano: "base", extraAttrs: 'data-termino-idx="' + i + '"' });
      })
      .join("");

    var cuerpo =
      '<p class="text-caption">Explicación de un término</p>' +
      '<div class="vt-acciones vt-acciones--fila" id="m04-selector">' + selector + "</div>" +
      UI.tarjeta({
        html:
          '<h3 class="text-h3">' + UI.esc(entrada.termino) + "</h3>" +
          '<p class="text-body">' + UI.esc(entrada.significado) + "</p>" +
          '<p class="text-body">' + UI.esc(entrada.ejemplo) + "</p>"
      }) +
      '<div class="vt-acciones vt-acciones--fila">' +
      UI.boton({ texto: "Entendido", variante: "primario", tamano: "base", id: "m04-entendido", icono: "check" }) +
      UI.boton({ texto: "Escuchar", variante: "secundario", tamano: "base", id: "m04-escuchar", icono: "reproducir" }) +
      "</div>";

    return UI.contenedorPrincipal(cuerpo);
  }

  function volver() {
    if (global.history.length > 1) { global.history.back(); } else { global.VT.navegar("m03"); }
  }

  function mount(root, state) {
    root.querySelectorAll("[data-termino-idx]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        state._m04Index = Number(btn.getAttribute("data-termino-idx"));
        global.VT.render();
      });
    });
    root.querySelector("#m04-entendido").addEventListener("click", volver);
    root.querySelector("#m04-escuchar").addEventListener("click", function () {
      var entrada = global.VT.data.TRAMITE.glosario[state._m04Index || 0];
      voice.speak(entrada.significado, { rate: state.voiceRate });
    });
  }

  function unmount() { voice.cancel(); }

  global.VT.screens.m04 = { id: "m04", title: "Explicación de un término", render: render, mount: mount, unmount: unmount };
})(window);
