/**
 * M11 — Solicitud preparada y constancia. El visor es un bloque simulado
 * (no hay documento real que generar); no hay descarga obligatoria.
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
    var cuerpo =
      UI.mensajeEstado({ variante: "exito", titulo: "Tu solicitud está lista", texto: "Guardamos un registro de orientación para " + T.nombre + "." }) +

      '<div>' +
      '<p class="text-caption">Tu código de orientación</p>' +
      '<p class="vt-codigo-orientacion" id="m11-codigo"></p>' +
      "</div>" +

      '<div class="vt-visor">' +
      global.VT.icon("documento") +
      '<p class="text-body">Vista previa de tu constancia de orientación</p>' +
      '<p class="text-caption">' + UI.esc(T.nombre) + "</p>" +
      "</div>" +

      '<div class="vt-acciones">' +
      UI.boton({ texto: "Escuchar resumen", variante: "secundario", tamano: "lg", id: "m11-escuchar", icono: "reproducir" }) +
      UI.boton({ texto: "Enviar por WhatsApp o SMS", variante: "primario", tamano: "lg", id: "m11-enviar", icono: "mensaje" }) +
      UI.boton({ texto: "Volver al inicio", variante: "fantasma", tamano: "lg", id: "m11-inicio", icono: "hogar" }) +
      "</div>" +

      '<div id="m11-aviso-envio"></div>' +

      UI.mensajeEstado({ variante: "info", texto: "Esta constancia es de orientación; presenta tu solicitud en el portal de la entidad." });

    return UI.contenedorPrincipal(cuerpo);
  }

  function mount(root, state) {
    if (!state.tramite.codigoOrientacion) {
      state.tramite.codigoOrientacion = global.VT.data.TRAMITE.codigoOrientacionEjemplo;
      global.VT.saveState(state);
    }
    root.querySelector("#m11-codigo").textContent = state.tramite.codigoOrientacion;

    root.querySelector("#m11-escuchar").addEventListener("click", function () {
      voice.speak(resumenTexto(state), { rate: state.voiceRate });
    });

    root.querySelector("#m11-enviar").addEventListener("click", function () {
      var aviso = root.querySelector("#m11-aviso-envio");
      var texto = resumenTexto(state);
      if (global.navigator.share) {
        global.navigator.share({ title: "VozTrámite", text: texto }).catch(function () {});
      } else {
        aviso.innerHTML = UI.mensajeEstado({ variante: "info", texto: "En la versión real esto abriría WhatsApp o SMS con tu código: " + state.tramite.codigoOrientacion + "." });
      }
    });

    root.querySelector("#m11-inicio").addEventListener("click", function () {
      global.VT.reiniciarTramite(state);
      global.VT.navegar("m02");
    });
  }

  function unmount() { voice.cancel(); }

  global.VT.screens.m11 = { id: "m11", title: "Solicitud preparada", render: render, mount: mount, unmount: unmount };
})(window);
