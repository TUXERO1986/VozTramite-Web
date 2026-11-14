/**
 * M10 — Confirmación en voz alta. Confirma, de a uno, cada dato recolectado
 * en M09. CORREGIR vuelve a preguntar solo ese dato (sin reiniciar el resto).
 */
(function (global) {
  "use strict";
  var UI = global.VT.ui;
  var voice = global.VT.voice;

  function datosDelGuion() { return global.VT.data.TRAMITE.preguntasDatos; }

  function agruparSiEsNumero(texto) {
    var soloDigitos = texto.replace(/\D/g, "");
    if (soloDigitos.length >= 6 && soloDigitos.length === texto.replace(/\s/g, "").length) {
      return soloDigitos.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
    }
    return texto;
  }

  function listaConfirmados(state) {
    var confirmados = datosDelGuion()
      .map(function (p) { return state.tramite.datosConfirmados[p.campo]; })
      .filter(Boolean);
    if (confirmados.length === 0) return "";
    return (
      '<div><p class="text-caption">Ya confirmaste</p><ul class="vt-lista-check">' +
      datosDelGuion()
        .filter(function (p) { return state.tramite.datosConfirmados[p.campo]; })
        .map(function (p) {
          return "<li>" + global.VT.icon("check") + "<span>" + UI.esc(p.campo) + ": " + UI.esc(state.tramite.datosConfirmados[p.campo]) + "</span></li>";
        })
        .join("") +
      "</ul></div>"
    );
  }

  function render(state) {
    var datos = datosDelGuion();
    var recolectados = state.tramite.datosRecolectados || [];
    var idx = state.tramite.confirmacionIndex;

    if (idx >= datos.length || !recolectados[idx]) {
      return UI.contenedorPrincipal('<p class="text-body">Ya confirmaste todos tus datos. <a href="#/m11">Continuar →</a></p>');
    }

    var actual = recolectados[idx];
    var cuerpo =
      UI.progresoMobile({ actual: 4, total: 4, etiqueta: "Confirmar" }) +
      '<div>' +
      '<p class="text-caption">' + UI.esc(actual.campo) + '</p>' +
      '<h2 class="text-h2 vt-dato-grupo" id="m10-dato">' + UI.esc(agruparSiEsNumero(actual.valor)) + "</h2>" +
      "</div>" +
      '<p class="text-h3">¿Es correcto?</p>' +
      UI.boton({ texto: "Escuchar de nuevo", variante: "fantasma", tamano: "base", id: "m10-escuchar", icono: "reproducir" }) +
      '<div class="vt-acciones vt-acciones--fila">' +
      UI.boton({ texto: "CONFIRMAR", variante: "exito", tamano: "xl", id: "m10-confirmar", icono: "check" }) +
      UI.boton({ texto: "CORREGIR", variante: "secundario", tamano: "xl", id: "m10-corregir", icono: "lapiz" }) +
      "</div>" +
      listaConfirmados(state);

    return UI.contenedorPrincipal(cuerpo);
  }

  function mount(root, state) {
    state.tramite.pasoActual = 3; // canónico: Confirmación
    global.VT.saveState(state);

    var datos = datosDelGuion();
    var recolectados = state.tramite.datosRecolectados || [];
    var idx = state.tramite.confirmacionIndex;
    var actual = recolectados[idx];
    if (!actual) return;

    var escucharBtn = root.querySelector("#m10-escuchar");
    if (escucharBtn) escucharBtn.addEventListener("click", function () {
      voice.speak(actual.campo + ": " + actual.valor, { rate: state.voiceRate });
    });

    var confirmarBtn = root.querySelector("#m10-confirmar");
    if (confirmarBtn) confirmarBtn.addEventListener("click", function () {
      state.tramite.datosConfirmados[actual.campo] = actual.valor;
      state.tramite.confirmacionIndex++;
      global.VT.saveState(state);
      global.VT.anunciar(actual.campo + " confirmado.");
      if (state.tramite.confirmacionIndex >= datos.length) {
        global.VT.navegar("m11");
      } else {
        global.VT.render();
      }
    });

    var corregirBtn = root.querySelector("#m10-corregir");
    if (corregirBtn) corregirBtn.addEventListener("click", function () {
      delete state.tramite.datosConfirmados[actual.campo];
      state.tramite.preguntaDatosIndex = idx;
      state.tramite.intentosDatos = 0;
      global.VT.saveState(state);
      global.VT.navegar("m09");
    });
  }

  function unmount() { voice.cancel(); }

  global.VT.screens.m10 = { id: "m10", title: "Confirmación en voz alta", render: render, mount: mount, unmount: unmount };
})(window);
