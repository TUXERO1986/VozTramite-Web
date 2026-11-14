/**
 * M12 — Diagnóstico de conexión. Nunca aparece la palabra "error": una señal
 * débil o nula se explica siempre en tono de ayuda ("puedes seguir sin perder nada").
 */
(function (global) {
  "use strict";
  var UI = global.VT.ui;

  function render(state) {
    var cuerpo =
      '<h1 class="text-h1" id="m12-titulo">Revisando tu señal…</h1>' +
      '<div class="vt-progreso-mobile" role="progressbar" aria-label="Revisando tu señal" aria-valuetext="Revisando">' +
      '<div class="vt-progreso-mobile__barra" id="m12-barra"><span class="vt-progreso-mobile__seg"></span><span class="vt-progreso-mobile__seg"></span><span class="vt-progreso-mobile__seg"></span></div>' +
      "</div>" +
      '<div id="m12-resultado" hidden>' +
      '<div class="vt-chips-fila">' + UI.chipConexion(state.connectivity.status) + "</div>" +
      '<div id="m12-recomendacion"></div>' +
      '<div class="vt-acciones vt-acciones--fila">' +
      UI.boton({ texto: "Activar modo ligero", variante: "primario", tamano: "lg", id: "m12-ligero" }) +
      UI.boton({ texto: "Seguir normal", variante: "fantasma", tamano: "lg", id: "m12-normal" }) +
      "</div>" +
      "</div>";

    return UI.contenedorPrincipal(cuerpo);
  }

  var _intervalo = null;
  var _timeout = null;

  function mount(root, state) {
    var barra = root.querySelector("#m12-barra");
    var segs = barra.querySelectorAll(".vt-progreso-mobile__seg");
    var i = 0;
    _intervalo = global.setInterval(function () {
      if (i < segs.length) { segs[i].classList.add("is-completo"); i++; }
    }, 350);

    _timeout = global.setTimeout(function () {
      global.clearInterval(_intervalo);
      segs.forEach(function (s) { s.classList.add("is-completo"); });
      var titulo = root.querySelector("#m12-titulo");
      if (!titulo) return; // la pantalla cambió antes de que terminara el diagnóstico
      titulo.textContent = "Así está tu señal";
      var resultado = root.querySelector("#m12-resultado");
      resultado.hidden = false;

      var recEl = root.querySelector("#m12-recomendacion");
      if (state.connectivity.status === "debil" || state.connectivity.status === "sin-conexion") {
        recEl.innerHTML = UI.mensajeEstado({ variante: "advertencia", texto: "Tu señal está débil. Puedes seguir sin perder nada." });
      } else if (state.connectivity.status === "regular") {
        recEl.innerHTML = UI.mensajeEstado({ variante: "info", texto: "Con señal regular, el modo ligero hace que todo cargue más rápido." });
      } else {
        recEl.innerHTML = UI.mensajeEstado({ variante: "exito", texto: "Tu conexión va bien. Puedes seguir normalmente." });
      }
      global.VT.anunciar("Revisamos tu señal: " + global.VT.connectivity.chipInfo(state.connectivity.status).text);
    }, 1300);

    root.querySelector("#m12-ligero").addEventListener("click", function () {
      global.VT.connectivity.setLightMode(state, true);
      global.VT.navegar("m13");
    });
    root.querySelector("#m12-normal").addEventListener("click", function () {
      if (global.history.length > 1) { global.history.back(); } else { global.VT.navegar("m02"); }
    });
  }

  function unmount() {
    if (_intervalo) global.clearInterval(_intervalo);
    if (_timeout) global.clearTimeout(_timeout);
  }

  global.VT.screens.m12 = { id: "m12", title: "Diagnóstico de conexión", render: render, mount: mount, unmount: unmount };
})(window);
