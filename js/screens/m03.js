/**
 * M03 — Requisitos en lenguaje sencillo.
 * Los términos subrayados con línea punteada abren M04 como hoja inferior.
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
    var visibles = T.requisitos.slice(0, 3);
    var ocultos = T.requisitos.slice(3);

    var cuerpo =
      UI.progresoMobile({ actual: 1, total: 4 }) +
      '<h1 class="text-h1">' + UI.esc(T.nombre) + "</h1>" +
      '<p class="text-body">Antes de terminar, te pediremos un <button type="button" class="vt-termino-subrayado" data-termino="Captcha">Captcha</button> para comprobar que no eres un programa.</p>' +

      '<ul class="vt-lista-check" id="m03-requisitos">' + visibles.map(filaRequisito).join("") + "</ul>" +
      (ocultos.length ? '<ul class="vt-lista-check" id="m03-requisitos-ocultos" hidden>' + ocultos.map(filaRequisito).join("") + "</ul>" : "") +
      (ocultos.length ? '<button type="button" class="vt-btn vt-btn--fantasma vt-btn--base" id="m03-ver-todos">Ver todos</button>' : "") +

      UI.tarjeta({
        html: '<p class="text-caption">Costo y lugar de pago</p><p class="text-h3">' + UI.esc(T.costo) + "</p><p class=\"text-body\">" + UI.esc(T.lugarPago) + "</p>"
      }) +

      UI.reproductorAudio({ id: "m03-audio" }) +

      '<div class="vt-acciones vt-acciones--fila">' +
      UI.boton({ texto: "Empezar", variante: "primario", tamano: "lg", id: "m03-empezar" }) +
      UI.boton({ texto: "Tengo una pregunta", variante: "fantasma", tamano: "base", id: "m03-pregunta" }) +
      "</div>" +

      UI.hojaInferior({ id: "m04-hoja", titulo: "Término", cuerpo: '<div id="m04-hoja-cuerpo"></div>' });

    return UI.contenedorPrincipal(cuerpo);
  }

  function abrirTermino(root, nombre, triggerBtn) {
    var glosario = global.VT.data.TRAMITE.glosario;
    var entrada = glosario.find(function (g) { return g.termino.toLowerCase() === nombre.toLowerCase(); }) || glosario[0];
    root.querySelector("#m04-hoja-titulo").textContent = entrada.termino;
    root.querySelector("#m04-hoja-cuerpo").innerHTML =
      '<p class="text-body">' + UI.esc(entrada.significado) + "</p>" +
      '<p class="text-body">' + UI.esc(entrada.ejemplo) + "</p>" +
      '<div class="vt-acciones vt-acciones--fila">' +
      UI.boton({ texto: "Entendido", variante: "primario", tamano: "base", id: "m04-entendido" }) +
      UI.boton({ texto: "Escuchar", variante: "secundario", tamano: "base", id: "m04-escuchar", icono: "reproducir" }) +
      "</div>";
    UI.conectarHoja(root, "m04-hoja", triggerBtn);
    root.querySelector("#m04-entendido").addEventListener("click", function () { global.VT.a11y.closeSheet(document.getElementById("m04-hoja")); });
    root.querySelector("#m04-escuchar").addEventListener("click", function () { voice.speak(entrada.significado); });
  }

  function mount(root, state) {
    var verTodos = root.querySelector("#m03-ver-todos");
    if (verTodos) verTodos.addEventListener("click", function () {
      var ocultos = root.querySelector("#m03-requisitos-ocultos");
      ocultos.hidden = !ocultos.hidden;
      verTodos.textContent = ocultos.hidden ? "Ver todos" : "Ver menos";
    });

    root.querySelectorAll("[data-termino]").forEach(function (btn) {
      btn.addEventListener("click", function () { abrirTermino(root, btn.getAttribute("data-termino"), btn); });
    });

    root.querySelector("#m03-empezar").addEventListener("click", function () { global.VT.navegar("m05"); });
    root.querySelector("#m03-pregunta").addEventListener("click", function (e) { abrirTermino(root, "Captcha", e.currentTarget); });

    var audio = root.querySelector("#m03-audio");
    audio.querySelector("[data-audio-repetir]").addEventListener("click", function () {
      voice.speak("Estos son los requisitos para tu trámite de " + T.nombre, { rate: Number(audio.querySelector("[data-audio-velocidad]").value) });
    });
    audio.querySelector("[data-audio-pausa]").addEventListener("click", function () { voice.cancel(); });
  }

  function unmount() { voice.cancel(); }

  global.VT.screens.m03 = { id: "m03", title: "Requisitos", render: render, mount: mount, unmount: unmount };
})(window);
