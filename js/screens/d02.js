/**
 * D02 — Requisitos y glosario lateral (desktop). El glosario de la derecha
 * es fijo: enfocar un término subrayado muestra su significado sin salir de la pantalla.
 */
(function (global) {
  "use strict";
  var UI = global.VT.ui;
  var voice = global.VT.voice;
  var T = global.VT.data.TRAMITE;

  function filaRequisito(r) {
    return '<li class="vt-requisito">' + global.VT.icon(r.icon) + "<span class=\"text-body\">" + UI.esc(r.texto) + "</span></li>";
  }

  function render(state) {
    var izquierda = UI.progresoMobile({ actual: 1, total: 4 });

    var centro =
      '<h1 class="text-h1">' + UI.esc(T.nombre) + "</h1>" +
      '<p class="text-body" id="d02-parrafo">Antes de terminar, te pediremos un <button type="button" class="vt-termino-subrayado" data-termino="Captcha">Captcha</button> para comprobar que no eres un programa.</p>' +
      '<ul class="vt-lista-check">' + T.requisitos.slice(0, 3).map(filaRequisito).join("") + "</ul>" +
      UI.tarjeta({ html: '<p class="text-caption">Costo y lugar de pago</p><p class="text-h3">' + UI.esc(T.costo) + "</p><p class=\"text-body\">" + UI.esc(T.lugarPago) + "</p>" }) +
      UI.reproductorAudio({ id: "d02-audio" }) +
      '<div class="vt-acciones vt-acciones--fila">' +
      UI.boton({ texto: "Empezar", variante: "primario", tamano: "lg", id: "d02-empezar" }) +
      "</div>";

    var derecha =
      '<h2 class="text-h2">Glosario</h2>' +
      '<p class="text-caption">Enfoca o toca un término subrayado para ver su significado aquí.</p>' +
      '<div id="d02-glosario-resultado"></div>';

    var grid =
      '<div class="vt-desktop-grid">' +
      '<div class="vt-desktop-grid__izq">' + izquierda + "</div>" +
      '<div class="vt-desktop-grid__centro vt-acciones">' + centro + "</div>" +
      '<div class="vt-desktop-grid__der vt-acciones">' + derecha + "</div>" +
      "</div>";

    return UI.cabeceraApp({ chipConexion: true, statusConexion: state.connectivity.status, mostrarAjustes: true, mostrarAyuda: true }) + UI.contenedorPrincipal(grid, "vt-main--escritorio");
  }

  function mostrarTermino(root, nombre) {
    var entrada = T.glosario.find(function (g) { return g.termino.toLowerCase() === nombre.toLowerCase(); }) || T.glosario[0];
    root.querySelector("#d02-glosario-resultado").innerHTML = UI.tarjeta({
      html: '<h3 class="text-h3">' + UI.esc(entrada.termino) + "</h3><p class=\"text-body\">" + UI.esc(entrada.significado) + "</p><p class=\"text-body\">" + UI.esc(entrada.ejemplo) + "</p>"
    });
  }

  function mount(root, state) {
    UI.conectarCabecera(root, state);
    root.querySelectorAll("[data-termino]").forEach(function (btn) {
      btn.addEventListener("focus", function () { mostrarTermino(root, btn.getAttribute("data-termino")); });
      btn.addEventListener("click", function () { mostrarTermino(root, btn.getAttribute("data-termino")); });
    });

    root.querySelector("#d02-empezar").addEventListener("click", function () { global.VT.navegar("d03"); });

    var audio = root.querySelector("#d02-audio");
    audio.querySelector("[data-audio-repetir]").addEventListener("click", function () {
      voice.speak("Estos son los requisitos para tu trámite de " + T.nombre, { rate: Number(audio.querySelector("[data-audio-velocidad]").value), target: root.querySelector("#d02-parrafo") });
    });
    audio.querySelector("[data-audio-pausa]").addEventListener("click", function () { voice.cancel(); });
  }

  function unmount() { voice.cancel(); }

  global.VT.screens.d02 = { id: "d02", title: "Requisitos (desktop)", render: render, mount: mount, unmount: unmount };
})(window);
