/**
 * D07 — Conexión y modo ligero (desktop, equivalente a M12+M13).
 * Vista previa lado a lado de la interfaz normal y la ligera: mismas
 * posiciones y etiquetas, solo cambian imágenes/animaciones.
 */
(function (global) {
  "use strict";
  var UI = global.VT.ui;
  var T = global.VT.data.TRAMITE;

  function previa(ligero) {
    return (
      '<div class="vt-card" style="flex:1;min-width:220px">' +
      '<p class="text-caption">' + (ligero ? "Modo ligero" : "Modo normal") + "</p>" +
      '<p class="text-h3">' + UI.esc(T.nombre) + "</p>" +
      '<ul class="vt-lista-check">' +
      T.requisitos.slice(0, 2).map(function (r) { return "<li>" + global.VT.icon(r.icon) + "<span>" + UI.esc(r.texto) + "</span></li>"; }).join("") +
      "</ul>" +
      UI.boton({ texto: "Empezar", variante: "primario", tamano: "base" }) +
      (ligero ? "" : '<p class="text-caption">Incluye animación suave en el botón HABLAR.</p>')
      + "</div>"
    );
  }

  function render(state) {
    var cuerpo =
      '<h1 class="text-h1">Conexión y modo ligero</h1>' +
      '<div class="vt-chips-fila">' + UI.chipConexion(state.connectivity.status) + "</div>" +
      '<div id="d07-recomendacion"></div>' +

      UI.interruptor({ id: "d07-ligero", texto: "Modo ligero", activo: state.connectivity.lightMode }) +

      '<h2 class="text-h2">Vista previa lado a lado</h2>' +
      '<div class="vt-muestra__fila">' + previa(false) + previa(true) + "</div>" +

      '<p class="text-caption" id="d07-datos-usados">' + UI.esc(global.VT.connectivity.datosUsadosTexto(state)) + "</p>";

    return UI.cabeceraApp({ chipConexion: false, mostrarAjustes: true, mostrarAyuda: true }) + UI.contenedorPrincipal(cuerpo, "vt-main--ancho");
  }

  function pintarRecomendacion(root, state) {
    var el = root.querySelector("#d07-recomendacion");
    if (state.connectivity.status === "debil" || state.connectivity.status === "sin-conexion") {
      el.innerHTML = UI.mensajeEstado({ variante: "advertencia", texto: "Tu señal está débil. Puedes seguir sin perder nada." });
    } else if (state.connectivity.status === "regular") {
      el.innerHTML = UI.mensajeEstado({ variante: "info", texto: "Con señal regular, el modo ligero hace que todo cargue más rápido." });
    } else {
      el.innerHTML = UI.mensajeEstado({ variante: "exito", texto: "Tu conexión va bien. Puedes seguir normalmente." });
    }
  }

  function mount(root, state) {
    UI.conectarCabecera(root, state);
    pintarRecomendacion(root, state);
    UI.conectarInterruptor(root, "d07-ligero", function (v) {
      global.VT.connectivity.setLightMode(state, v);
      root.querySelector("#d07-datos-usados").textContent = global.VT.connectivity.datosUsadosTexto(state);
    });
  }

  global.VT.screens.d07 = { id: "d07", title: "Conexión y modo ligero (desktop)", render: render, mount: mount };
})(window);
