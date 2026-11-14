/**
 * D08 — Avance guardado, pendientes y reanudación (desktop, equivalente a
 * M14+M15+M16). Usa todo el ancho: con una tabla de por medio, flanquear el
 * centro con columnas vacías de 3/12 solo recortaría espacio de lectura.
 */
(function (global) {
  "use strict";
  var UI = global.VT.ui;
  var conn = global.VT.connectivity;

  var ETIQUETA_PASO = { m06: "Identidad", m09: "Datos", m10: "Confirmación", m11: "Constancia" };
  var MOBILE_A_DESKTOP = { m06: "d03", m09: "d04", m10: "d05", m11: "d06" };
  var _tab = "curso";

  function hayTramiteEnCurso(state) {
    return state.tramite.identidadValidada || (state.tramite.datosRecolectados || []).some(Boolean);
  }

  function filaEnCurso(state) {
    var siguiente = global.VT.pantallaDeReanudacion(state);
    return (
      "<tr><td>" + UI.esc(global.VT.data.TRAMITE.nombre) + "</td>" +
      "<td>" + (state.tramite.guardadoEn ? global.VT.formatearFecha(state.tramite.guardadoEn) : "—") + "</td>" +
      "<td>" + UI.chip({ texto: ETIQUETA_PASO[siguiente] || "En curso", variante: "info", icono: "reloj" }) + "</td>" +
      '<td><button type="button" class="vt-btn vt-btn--primario vt-btn--base" id="d08-continuar">Continuar</button></td></tr>'
    );
  }

  function filaPendiente(p, incluirAccion) {
    var estado = conn.estadoPendiente(p);
    return (
      "<tr><td>" + UI.esc(p.tramiteNombre) + "</td>" +
      "<td>" + global.VT.formatearFecha(p.guardadoEn) + "</td>" +
      "<td>" + UI.chip({ texto: estado, variante: estado === "Enviado" ? "success" : "neutral", icono: estado === "Enviado" ? "check" : "reloj" }) + "</td>" +
      "<td>" +
      '<div class="vt-segmento-paquetes" style="max-width:120px;margin-bottom:4px">' +
      p.paquetes.map(function (pk) { return '<span class="vt-segmento-paquetes__seg ' + (pk.estado === "enviado" ? "is-enviado" : pk.estado === "enviando" ? "is-enviando" : pk.estado === "pausado" ? "is-pausado" : "") + '"></span>'; }).join("") +
      "</div>" +
      (incluirAccion ? '<button type="button" class="vt-btn vt-btn--secundario vt-btn--base" data-intentar="' + p.id + '">Intentar ahora</button>' : "") +
      "</td></tr>"
    );
  }

  function tabla(filas) {
    return '<table class="vt-tabla"><thead><tr><th>Trámite</th><th>Fecha</th><th>Estado</th><th>Acción</th></tr></thead><tbody>' + (filas || '<tr><td colspan="4" class="text-caption">Nada por aquí.</td></tr>') + "</tbody></table>";
  }

  function render(state) {
    conn.sembrarDemoSiVacio(state);
    var enCurso = hayTramiteEnCurso(state) ? [state] : [];
    var pendientes = state.cola.filter(function (p) { return conn.estadoPendiente(p) !== "Enviado"; });
    var finalizados = state.cola.filter(function (p) { return conn.estadoPendiente(p) === "Enviado"; });

    var cuerpo =
      '<h1 class="text-h1">Mis trámites</h1>' +
      (enCurso.length
        ? UI.tarjeta({ html: '<p class="text-caption">Continuar donde quedaste</p><p class="text-h3">' + UI.esc(global.VT.data.TRAMITE.nombre) + "</p>" })
        : "") +

      '<div class="vt-acciones vt-acciones--fila" role="tablist" aria-label="Mis trámites">' +
      ["curso", "pendientes", "finalizados"].map(function (t) {
        var etiqueta = { curso: "En curso (" + enCurso.length + ")", pendientes: "Pendientes de envío (" + pendientes.length + ")", finalizados: "Finalizados (" + finalizados.length + ")" }[t];
        return UI.boton({ texto: etiqueta, variante: t === _tab ? "primario" : "secundario", tamano: "base", extraAttrs: 'data-tab="' + t + '" role="tab" aria-selected="' + (t === _tab) + '"' });
      }).join("") +
      "</div>" +

      '<div id="d08-contenido">' +
      (_tab === "curso" ? tabla(enCurso.map(filaEnCurso).join("")) : "") +
      (_tab === "pendientes" ? tabla(pendientes.map(function (p) { return filaPendiente(p, true); }).join("")) : "") +
      (_tab === "finalizados" ? tabla(finalizados.map(function (p) { return filaPendiente(p, false); }).join("")) : "") +
      "</div>";

    return UI.cabeceraApp({ chipConexion: true, statusConexion: state.connectivity.status, mostrarAjustes: true, mostrarAyuda: true }) + UI.contenedorPrincipal(cuerpo, "vt-main--ancho");
  }

  function mount(root, state) {
    UI.conectarCabecera(root, state);
    root.querySelectorAll("[data-tab]").forEach(function (btn) {
      btn.addEventListener("click", function () { _tab = btn.getAttribute("data-tab"); global.VT.render(); });
    });
    var continuarBtn = root.querySelector("#d08-continuar");
    if (continuarBtn) continuarBtn.addEventListener("click", function () { global.VT.navegar(MOBILE_A_DESKTOP[global.VT.pantallaDeReanudacion(state)]); });

    root.querySelectorAll("[data-intentar]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = btn.getAttribute("data-intentar");
        conn.intentarEnvio(state, id, {
          onPaqueteCompletado: function (n) { global.VT.anunciar("Paquete " + n + " enviado."); global.VT.render(); },
          onPausado: function () { global.VT.anunciar("Envío en pausa, esperando señal."); global.VT.render(); },
          onFinalizado: function () { global.VT.render(); }
        });
        global.VT.render();
      });
    });
  }

  global.VT.screens.d08 = { id: "d08", title: "Mis trámites (desktop)", render: render, mount: mount };
})(window);
