/**
 * M14 — Avance guardado en el celular. Los checks de la lista aparecen en
 * secuencia (salvo con movimiento reducido, donde aparecen todos de una vez).
 */
(function (global) {
  "use strict";
  var UI = global.VT.ui;

  function itemsGuardados(state) {
    var items = [];
    if (state.tramite.identidadValidada) items.push("Identidad validada");
    (state.tramite.datosRecolectados || []).forEach(function (d) { if (d) items.push(d.campo + ": " + d.valor); });
    if (items.length === 0) items.push("Tu progreso hasta este punto");
    return items;
  }

  function render(state) {
    var items = itemsGuardados(state);
    var cuerpo =
      '<div class="vt-chips-fila">' + UI.chip({ icono: "antena-off", texto: "Sin conexión", variante: "neutral" }) + "</div>" +

      UI.tarjeta({
        html:
          '<span style="color:var(--color-status-success)">' + global.VT.icon("celular-check") + "</span>" +
          '<p class="text-h3">Guardamos tu avance en este celular</p>'
      }) +

      '<ul class="vt-lista-check" id="m14-lista">' +
      items.map(function (texto, i) { return '<li class="vt-m14-item" data-idx="' + i + '" hidden>' + global.VT.icon("check") + "<span>" + UI.esc(texto) + "</span></li>"; }).join("") +
      "</ul>" +

      '<div class="vt-chips-fila">' +
      UI.chip({ icono: "celular-check", texto: "Guardado en el celular", variante: "neutral" }) +
      UI.chip({ icono: "check", texto: "Sincronizado", variante: "success" }) +
      "</div>" +

      UI.mensajeEstado({ variante: "info", texto: "Se enviará solo cuando vuelva la señal. No tienes que hacer nada." }) +

      '<div class="vt-acciones vt-acciones--fila">' +
      UI.boton({ texto: "Seguir llenando", variante: "primario", tamano: "lg", id: "m14-seguir" }) +
      UI.boton({ texto: "Ver pendientes", variante: "secundario", tamano: "lg", id: "m14-pendientes" }) +
      "</div>";

    return UI.contenedorPrincipal(cuerpo);
  }

  var _timers = [];

  function mount(root, state) {
    global.VT.connectivity.encolarAvance(state, global.VT.data.TRAMITE.pasos[Math.max(state.tramite.pasoActual - 1, 0)]);

    var filas = root.querySelectorAll(".vt-m14-item");
    var reducido = global.matchMedia("(prefers-reduced-motion: reduce)").matches || state.reducedMotionForced;
    filas.forEach(function (fila, i) {
      var mostrar = function () { fila.hidden = false; };
      if (reducido) { mostrar(); } else { _timers.push(global.setTimeout(mostrar, i * 350)); }
    });

    root.querySelector("#m14-seguir").addEventListener("click", function () {
      global.VT.navegar(global.VT.pantallaDeReanudacion(state));
    });
    root.querySelector("#m14-pendientes").addEventListener("click", function () { global.VT.navegar("m15"); });
  }

  function unmount() { _timers.forEach(global.clearTimeout); _timers = []; }

  global.VT.screens.m14 = { id: "m14", title: "Avance guardado", render: render, mount: mount, unmount: unmount };
})(window);
