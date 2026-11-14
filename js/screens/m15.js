/**
 * M15 — Pendientes de envío por paquetes. Paquete 1 = texto (viaja primero),
 * paquete 2 = adjuntos comprimidos. Se anuncia cada paquete completado, no
 * el porcentaje de avance.
 */
(function (global) {
  "use strict";
  var UI = global.VT.ui;
  var conn = global.VT.connectivity;

  function segmentoClase(estado) {
    if (estado === "enviado") return "is-enviado";
    if (estado === "enviando") return "is-enviando";
    if (estado === "pausado") return "is-pausado";
    return "";
  }

  function tarjetaPendiente(p) {
    var estado = conn.estadoPendiente(p);
    var variante = estado === "Enviado" ? "success" : estado.indexOf("pausa") > -1 ? "warning" : "neutral";
    return (
      '<div class="vt-card" data-pendiente="' + p.id + '">' +
      '<div class="vt-chips-fila" style="justify-content:space-between">' +
      '<span class="text-h3">' + UI.esc(p.tramiteNombre) + "</span>" +
      UI.chip({ texto: estado, variante: variante, icono: estado === "Enviado" ? "check" : "reloj" }) +
      "</div>" +
      '<p class="text-caption">Guardado: ' + global.VT.formatearFecha(p.guardadoEn) + "</p>" +
      '<div class="vt-segmento-paquetes" aria-hidden="true">' +
      p.paquetes.map(function (pk) { return '<span class="vt-segmento-paquetes__seg ' + segmentoClase(pk.estado) + '"></span>'; }).join("") +
      "</div>" +
      '<p class="text-caption">Paquete 1: datos de texto · Paquete 2: adjuntos comprimidos</p>' +
      (p.ultimoIntento ? '<p class="text-caption">Último intento: ' + global.VT.formatearFecha(p.ultimoIntento) + "</p>" : "") +
      UI.boton({ texto: "Intentar ahora", variante: "primario", tamano: "lg", extraAttrs: 'data-intentar="' + p.id + '"' }) +
      "</div>"
    );
  }

  function render(state) {
    conn.sembrarDemoSiVacio(state);
    var cuerpo =
      '<h1 class="text-h1">Pendientes de envío</h1>' +
      UI.interruptor({ id: "m15-wifi", texto: "Enviar archivos solo con wifi", activo: state.connectivity.wifiOnly }) +
      '<div class="vt-acciones" id="m15-lista">' + state.cola.map(tarjetaPendiente).join("") + "</div>";
    return UI.contenedorPrincipal(cuerpo);
  }

  function reRenderLista(root, state) {
    root.querySelector("#m15-lista").innerHTML = state.cola.map(tarjetaPendiente).join("");
    conectarBotones(root, state);
  }

  function conectarBotones(root, state) {
    root.querySelectorAll("[data-intentar]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = btn.getAttribute("data-intentar");
        conn.intentarEnvio(state, id, {
          onPaqueteCompletado: function (numero) {
            global.VT.anunciar("Paquete " + numero + " enviado.");
            reRenderLista(root, state);
          },
          onPausado: function () {
            global.VT.anunciar("Envío en pausa, esperando señal.");
            reRenderLista(root, state);
          },
          onFinalizado: function () { reRenderLista(root, state); }
        });
        reRenderLista(root, state);
      });
    });
  }

  function mount(root, state) {
    conectarBotones(root, state);
    UI.conectarInterruptor(root, "m15-wifi", function (nuevo) { conn.setWifiOnly(state, nuevo); });
  }

  global.VT.screens.m15 = { id: "m15", title: "Pendientes de envío", render: render, mount: mount };
})(window);
