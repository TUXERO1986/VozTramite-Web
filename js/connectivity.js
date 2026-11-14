/**
 * VozTrámite — Simulador de conectividad (js/connectivity.js)
 *
 * Maneja el estado de conexión ('buena'|'regular'|'debil'|'sin-conexion'),
 * el modo ligero y la cola offline (dos paquetes por trámite: texto primero,
 * adjuntos comprimidos después). Los cambios se propagan a todas las
 * pantallas mediante un emisor de eventos, y se persisten junto al resto
 * del estado global (ver js/app.js).
 *
 * El panel de depuración (?debug=1) permite forzar cualquier estado de
 * conexión para probar los flujos M12–M17 / D07–D08 sin esperar una red real.
 */
(function (global) {
  "use strict";

  var listeners = [];
  function emit(state) {
    listeners.forEach(function (cb) { try { cb(state); } catch (e) {} });
  }
  function on(cb) { listeners.push(cb); }
  function off(cb) {
    var i = listeners.indexOf(cb);
    if (i >= 0) listeners.splice(i, 1);
  }

  var CHIP_INFO = {
    buena: { icon: "antena", text: "Conexión buena", variant: "success" },
    regular: { icon: "antena-regular", text: "Conexión regular", variant: "warning" },
    debil: { icon: "antena-debil", text: "Conexión débil", variant: "warning" },
    "sin-conexion": { icon: "antena-off", text: "Sin conexión", variant: "neutral" }
  };

  function chipInfo(status) { return CHIP_INFO[status] || CHIP_INFO.buena; }

  function setStatus(state, status) {
    if (!CHIP_INFO[status]) return;
    state.connectivity.status = status;
    global.VT.saveState(state);
    emit(state);
  }

  function setLightMode(state, enabled) {
    state.connectivity.lightMode = !!enabled;
    global.VT.saveState(state);
    emit(state);
  }

  function setWifiOnly(state, enabled) {
    state.connectivity.wifiOnly = !!enabled;
    global.VT.saveState(state);
    emit(state);
  }

  function setAhorroAutomatico(state, enabled) {
    state.connectivity.ahorroAutomatico = !!enabled;
    global.VT.saveState(state);
    emit(state);
  }

  function datosUsadosTexto(state) {
    return state.connectivity.lightMode ? "0.8 MB usados en este trámite" : "3.6 MB usados en este trámite";
  }

  // ---- Cola offline ----------------------------------------------------

  function nuevoPendiente(tramiteId, tramiteNombre, paso) {
    return {
      id: "p_" + tramiteId + "_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
      tramiteId: tramiteId,
      tramiteNombre: tramiteNombre,
      paso: paso,
      guardadoEn: Date.now(),
      ultimoIntento: null,
      paquetes: [
        { numero: 1, nombre: "Datos de texto", estado: "esperando" },
        { numero: 2, nombre: "Adjuntos comprimidos", estado: "esperando" }
      ]
    };
  }

  function encolarAvance(state, paso) {
    var t = global.VT.data.TRAMITE;
    var existente = state.cola.find(function (p) { return p.tramiteId === t.id; });
    if (!existente) {
      existente = nuevoPendiente(t.id, t.nombre, paso);
      state.cola.unshift(existente);
    } else {
      existente.paso = paso;
      existente.guardadoEn = Date.now();
    }
    global.VT.saveState(state);
    emit(state);
    return existente;
  }

  /** Datos de maqueta: un segundo pendiente "de otra sesión" para que
   * M15/D08 puedan mostrar varios estados a la vez en la lista. */
  function sembrarDemoSiVacio(state) {
    if (state.cola.length > 0) return;
    var t = global.VT.data.TRAMITE;
    var propio = nuevoPendiente(t.id, t.nombre, "Datos");
    propio.paquetes[0].estado = "enviando";
    propio.ultimoIntento = Date.now();
    var antiguo = nuevoPendiente("antecedentes-demo", "Certificado de antecedentes policiales", "Constancia");
    antiguo.paquetes[0].estado = "enviado";
    antiguo.paquetes[1].estado = "enviado";
    antiguo.guardadoEn = Date.now() - 1000 * 60 * 60 * 20;
    state.cola = [propio, antiguo];
    global.VT.saveState(state);
    emit(state);
  }

  function estadoPendiente(p) {
    if (p.paquetes.every(function (pk) { return pk.estado === "enviado"; })) return "Enviado";
    if (p.paquetes.some(function (pk) { return pk.estado === "pausado"; })) return "En pausa, esperando señal";
    var enviando = p.paquetes.find(function (pk) { return pk.estado === "enviando"; });
    if (enviando) return "Enviando " + enviando.numero + " de " + p.paquetes.length;
    return "Esperando señal";
  }

  function marcarPausado(p) {
    var pk = p.paquetes.find(function (pk) { return pk.estado === "enviando" || pk.estado === "esperando"; });
    if (pk) pk.estado = "pausado";
  }

  /**
   * Intenta enviar el siguiente paquete pendiente. Si la señal se marca
   * "sin-conexion", el envío queda en pausa y se reanuda desde el último
   * paquete completo la próxima vez que se llame con señal disponible.
   */
  function intentarEnvio(state, pendienteId, callbacks) {
    callbacks = callbacks || {};
    var p = state.cola.find(function (x) { return x.id === pendienteId; });
    if (!p) return;

    if (state.connectivity.status === "sin-conexion") {
      marcarPausado(p);
      global.VT.saveState(state);
      emit(state);
      callbacks.onPausado && callbacks.onPausado();
      return;
    }

    var siguiente = p.paquetes.find(function (pk) { return pk.estado !== "enviado"; });
    if (!siguiente) { callbacks.onFinalizado && callbacks.onFinalizado(); return; }

    siguiente.estado = "enviando";
    p.ultimoIntento = Date.now();
    global.VT.saveState(state);
    emit(state);

    setTimeout(function () {
      if (state.connectivity.status === "sin-conexion") {
        marcarPausado(p);
        global.VT.saveState(state);
        emit(state);
        callbacks.onPausado && callbacks.onPausado();
        return;
      }
      siguiente.estado = "enviado";
      global.VT.saveState(state);
      emit(state);
      callbacks.onPaqueteCompletado && callbacks.onPaqueteCompletado(siguiente.numero);
      intentarEnvio(state, pendienteId, callbacks);
    }, 1400);
  }

  // ---- Panel de depuración (?debug=1) -----------------------------------

  function debugHabilitado() {
    return /(^\?|[&])debug=1(&|$)/.test(global.location.search);
  }

  function montarPanelDebug(state) {
    if (!debugHabilitado()) return;
    if (document.getElementById("vt-debug-panel")) return;
    var panel = document.createElement("div");
    panel.id = "vt-debug-panel";
    panel.className = "vt-debug-panel";
    panel.innerHTML =
      '<strong class="text-caption">Depuración</strong>' +
      '<div class="vt-debug-row">' +
      ["buena", "regular", "debil", "sin-conexion"]
        .map(function (s) { return '<button type="button" data-status="' + s + '" class="vt-debug-btn">' + chipInfo(s).text + "</button>"; })
        .join("") +
      "</div>";
    document.body.appendChild(panel);
    panel.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-status]");
      if (!btn) return;
      setStatus(state, btn.getAttribute("data-status"));
    });
  }

  global.VT = global.VT || {};
  global.VT.connectivity = {
    on: on,
    off: off,
    chipInfo: chipInfo,
    setStatus: setStatus,
    setLightMode: setLightMode,
    setWifiOnly: setWifiOnly,
    setAhorroAutomatico: setAhorroAutomatico,
    datosUsadosTexto: datosUsadosTexto,
    encolarAvance: encolarAvance,
    sembrarDemoSiVacio: sembrarDemoSiVacio,
    estadoPendiente: estadoPendiente,
    intentarEnvio: intentarEnvio,
    montarPanelDebug: montarPanelDebug,
    debugHabilitado: debugHabilitado
  };
})(window);
