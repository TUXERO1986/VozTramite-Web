/**
 * M16 — Reanudar donde quedaste. "Empezar de nuevo" pide confirmación antes
 * de borrar el avance (acción difícil de revertir).
 */
(function (global) {
  "use strict";
  var UI = global.VT.ui;

  var ETIQUETA_PASO = { m06: "Paso 2 de 4: Identidad", m09: "Paso 3 de 4: Datos", m10: "Paso 4 de 4: Confirmar", m11: "Paso 4 de 4: Confirmar" };

  function listaConfirmados(state) {
    var items = [];
    if (state.tramite.identidadValidada) items.push("Identidad validada");
    (state.tramite.datosRecolectados || []).forEach(function (d) { if (d) items.push(d.campo + ": " + d.valor); });
    return items;
  }

  function render(state) {
    var siguiente = global.VT.pantallaDeReanudacion(state);
    var items = listaConfirmados(state);
    var sinTramiteEnCurso = !state.tramite.guardadoEn && items.length === 0;

    if (sinTramiteEnCurso) {
      return UI.contenedorPrincipal(
        '<h1 class="text-h1">Mis trámites</h1>' +
        UI.mensajeEstado({ variante: "info", texto: "No tienes ningún trámite sin terminar en este momento." }) +
        '<p><a href="#/m02">Empezar un trámite →</a></p>'
      );
    }

    var cuerpo =
      '<h1 class="text-h1">Mis trámites</h1>' +
      UI.tarjeta({
        html:
          '<p class="text-caption">Tienes un trámite sin terminar</p>' +
          '<p class="text-h3">' + UI.esc(global.VT.data.TRAMITE.nombre) + "</p>" +
          '<p class="text-body">' + (ETIQUETA_PASO[siguiente] || "") + "</p>" +
          (state.tramite.guardadoEn ? '<p class="text-caption">Guardado: ' + global.VT.formatearFecha(state.tramite.guardadoEn) + "</p>" : "")
      }) +
      (items.length
        ? '<ul class="vt-lista-check">' + items.map(function (t) { return "<li>" + global.VT.icon("check") + "<span>" + UI.esc(t) + "</span></li>"; }).join("") + "</ul>"
        : "") +
      '<div class="vt-acciones">' +
      UI.boton({ texto: "Continuar donde quedé", variante: "primario", tamano: "lg", id: "m16-continuar" }) +
      UI.boton({ texto: "Empezar de nuevo", variante: "secundario", tamano: "lg", id: "m16-reiniciar" }) +
      "</div>" +
      '<div id="m16-confirmacion"></div>';

    return UI.contenedorPrincipal(cuerpo);
  }

  function mount(root, state) {
    var btnContinuar = root.querySelector("#m16-continuar");
    if (btnContinuar) btnContinuar.addEventListener("click", function () { global.VT.navegar(global.VT.pantallaDeReanudacion(state)); });

    var btnReiniciar = root.querySelector("#m16-reiniciar");
    if (btnReiniciar) btnReiniciar.addEventListener("click", function () {
      var cont = root.querySelector("#m16-confirmacion");
      cont.innerHTML =
        UI.mensajeEstado({ variante: "advertencia", texto: "¿Seguro? Perderás el avance de este trámite." }) +
        '<div class="vt-acciones vt-acciones--fila">' +
        UI.boton({ texto: "Sí, empezar de nuevo", variante: "peligro", tamano: "base", id: "m16-confirmar-reinicio" }) +
        UI.boton({ texto: "Cancelar", variante: "fantasma", tamano: "base", id: "m16-cancelar-reinicio" }) +
        "</div>";
      cont.querySelector("#m16-confirmar-reinicio").addEventListener("click", function () {
        global.VT.reiniciarTramite(state);
        global.VT.navegar("m02");
      });
      cont.querySelector("#m16-cancelar-reinicio").addEventListener("click", function () { cont.innerHTML = ""; });
    });
  }

  global.VT.screens.m16 = { id: "m16", title: "Mis trámites", render: render, mount: mount };
})(window);
