/**
 * D06 — Solicitud preparada, constancia y visor (desktop, equivalente a M11).
 * El guion describe esta pantalla solo con dos bloques (visor / código); se
 * ubican en las zonas centro y derecha para mantener la misma rejilla que
 * el resto de pantallas D0x, dejando la izquierda vacía.
 */
(function (global) {
  "use strict";
  var UI = global.VT.ui;
  var voice = global.VT.voice;

  function resumenTexto(state) {
    var T = global.VT.data.TRAMITE;
    return "Listo. Tu " + T.nombre + " quedó registrada como orientación con el código " + state.tramite.codigoOrientacion + ".";
  }

  function render(state) {
    var T = global.VT.data.TRAMITE;
    var centro =
      '<div class="vt-visor">' +
      global.VT.icon("documento") +
      '<p class="text-body">Vista previa de tu constancia de orientación</p>' +
      '<p class="text-caption">' + UI.esc(T.nombre) + "</p>" +
      "</div>";

    var derecha =
      '<p class="text-caption">Tu código de orientación</p>' +
      '<p class="vt-codigo-orientacion" id="d06-codigo"></p>' +
      '<div class="vt-acciones">' +
      UI.boton({ texto: "Escuchar resumen", variante: "secundario", tamano: "lg", id: "d06-escuchar", icono: "reproducir" }) +
      UI.boton({ texto: "Enviar por WhatsApp o SMS", variante: "primario", tamano: "lg", id: "d06-enviar", icono: "mensaje" }) +
      UI.boton({ texto: "Volver al inicio", variante: "fantasma", tamano: "lg", id: "d06-inicio", icono: "hogar" }) +
      "</div>" +
      '<div id="d06-aviso-envio"></div>';

    var grid =
      '<div class="vt-desktop-grid">' +
      '<div class="vt-desktop-grid__izq"></div>' +
      '<div class="vt-desktop-grid__centro vt-acciones">' + centro + "</div>" +
      '<div class="vt-desktop-grid__der vt-acciones">' + derecha + "</div>" +
      "</div>";

    return (
      UI.cabeceraApp({ chipConexion: true, statusConexion: state.connectivity.status, mostrarAjustes: true, mostrarAyuda: true }) +
      UI.contenedorPrincipal(
        UI.mensajeEstado({ variante: "exito", titulo: "Tu solicitud está lista", texto: "Guardamos un registro de orientación para " + T.nombre + "." }) + grid,
        "vt-main--escritorio"
      )
    );
  }

  function mount(root, state) {
    UI.conectarCabecera(root, state);
    state.tramite.pasoActual = 4;
    if (!state.tramite.codigoOrientacion) state.tramite.codigoOrientacion = global.VT.data.TRAMITE.codigoOrientacionEjemplo;
    global.VT.saveState(state);
    root.querySelector("#d06-codigo").textContent = state.tramite.codigoOrientacion;

    root.querySelector("#d06-escuchar").addEventListener("click", function () { voice.speak(resumenTexto(state), { rate: state.voiceRate }); });
    root.querySelector("#d06-enviar").addEventListener("click", function () {
      var aviso = root.querySelector("#d06-aviso-envio");
      if (global.navigator.share) {
        global.navigator.share({ title: "VozTrámite", text: resumenTexto(state) }).catch(function () {});
      } else {
        aviso.innerHTML = UI.mensajeEstado({ variante: "info", texto: "En la versión real esto abriría WhatsApp o SMS con tu código: " + state.tramite.codigoOrientacion + "." });
      }
    });
    root.querySelector("#d06-inicio").addEventListener("click", function () {
      global.VT.reiniciarTramite(state);
      global.VT.navegar("d01");
    });
  }

  function unmount() { voice.cancel(); }

  global.VT.screens.d06 = { id: "d06", title: "Solicitud preparada (desktop)", render: render, mount: mount, unmount: unmount };
})(window);
