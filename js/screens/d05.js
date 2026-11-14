/**
 * D05 — Confirmación y resumen de datos (desktop, equivalente a M10).
 * La tabla lista todos los datos; se selecciona una fila (clic) y CONFIRMAR
 * o CORREGIR, abajo, actúan solo sobre esa fila, sin reiniciar el formulario.
 */
(function (global) {
  "use strict";
  var UI = global.VT.ui;
  var voice = global.VT.voice;

  var _seleccionado = 0;

  function datosDelGuion() { return global.VT.data.TRAMITE.preguntasDatos; }

  function primeraFilaPendiente(state) {
    var datos = datosDelGuion();
    for (var i = 0; i < datos.length; i++) {
      if (!state.tramite.datosConfirmados[datos[i].campo]) return i;
    }
    return datos.length - 1;
  }

  function filaTabla(state, idx) {
    var datos = datosDelGuion();
    var def = datos[idx];
    var recolectado = state.tramite.datosRecolectados[idx];
    var confirmado = !!state.tramite.datosConfirmados[def.campo];
    var valor = recolectado ? recolectado.valor : "—";
    return (
      '<tr data-fila="' + idx + '" class="' + (idx === _seleccionado ? "vt-fila-flash" : "") + '" style="cursor:pointer;' + (idx === _seleccionado ? "outline:2px solid var(--color-brand-primary)" : "") + '">' +
      "<td>" + UI.esc(def.campo) + "</td>" +
      "<td>" + UI.esc(valor) + "</td>" +
      "<td>" + (confirmado ? UI.chip({ texto: "Confirmado", variante: "success", icono: "check" }) : UI.chip({ texto: "Pendiente", variante: "neutral", icono: "reloj" })) + "</td>" +
      '<td><button type="button" class="vt-btn vt-btn--fantasma vt-btn--base" data-escuchar="' + idx + '">' + global.VT.icon("reproducir") + "Escuchar</button></td>" +
      "</tr>"
    );
  }

  function render(state) {
    var izquierda = UI.progresoMobile({ actual: 4, total: 4 });
    var datos = datosDelGuion();
    if (_seleccionado >= datos.length) _seleccionado = datos.length - 1;

    var todoConfirmado = datos.every(function (d) { return state.tramite.datosConfirmados[d.campo]; });

    var centro =
      '<table class="vt-tabla" id="d05-tabla"><thead><tr><th>Dato</th><th>Valor</th><th>Estado</th><th>Acción</th></tr></thead><tbody>' +
      datos.map(function (_, i) { return filaTabla(state, i); }).join("") +
      "</tbody></table>" +
      (todoConfirmado
        ? '<p class="text-body"><a href="#/d06">Todo confirmado. Continuar a la constancia →</a></p>'
        : '<div class="vt-acciones vt-acciones--fila">' +
          UI.boton({ texto: "CONFIRMAR", variante: "exito", tamano: "xl", id: "d05-confirmar", icono: "check" }) +
          UI.boton({ texto: "CORREGIR", variante: "secundario", tamano: "xl", id: "d05-corregir", icono: "lapiz" }) +
          "</div>");

    var grid =
      '<div class="vt-desktop-grid">' +
      '<div class="vt-desktop-grid__izq">' + izquierda + "</div>" +
      '<div class="vt-desktop-grid__centro vt-acciones" id="d05-centro">' + centro + "</div>" +
      '<div class="vt-desktop-grid__der"></div>' +
      "</div>";

    return UI.cabeceraApp({ chipConexion: true, statusConexion: state.connectivity.status, mostrarAjustes: true, mostrarAyuda: true }) + UI.contenedorPrincipal(grid, "vt-main--escritorio");
  }

  function mount(root, state) {
    UI.conectarCabecera(root, state);
    state.tramite.pasoActual = 3;
    global.VT.saveState(state);
    _seleccionado = primeraFilaPendiente(state);

    function reconectar() {
      global.VT.render();
    }

    root.querySelectorAll("[data-fila]").forEach(function (tr) {
      tr.addEventListener("click", function () { _seleccionado = Number(tr.getAttribute("data-fila")); reconectar(); });
    });
    root.querySelectorAll("[data-escuchar]").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        var idx = Number(btn.getAttribute("data-escuchar"));
        var d = state.tramite.datosRecolectados[idx];
        if (d) voice.speak(d.campo + ": " + d.valor, { rate: state.voiceRate });
      });
    });

    var confirmarBtn = root.querySelector("#d05-confirmar");
    if (confirmarBtn) confirmarBtn.addEventListener("click", function () {
      var def = datosDelGuion()[_seleccionado];
      var recolectado = state.tramite.datosRecolectados[_seleccionado];
      if (!recolectado) return;
      state.tramite.datosConfirmados[def.campo] = recolectado.valor;
      global.VT.saveState(state);
      _seleccionado = primeraFilaPendiente(state);
      reconectar();
    });
    var corregirBtn = root.querySelector("#d05-corregir");
    if (corregirBtn) corregirBtn.addEventListener("click", function () {
      var def = datosDelGuion()[_seleccionado];
      delete state.tramite.datosConfirmados[def.campo];
      state.tramite.preguntaDatosIndex = _seleccionado;
      state.tramite.intentosDatos = 0;
      global.VT.saveState(state);
      global.VT.navegar("d04");
    });
  }

  function unmount() { voice.cancel(); }

  global.VT.screens.d05 = { id: "d05", title: "Confirmación (desktop)", render: render, mount: mount, unmount: unmount };
})(window);
