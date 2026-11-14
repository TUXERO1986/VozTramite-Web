/**
 * VozTrámite — Componentes de interfaz reutilizables (js/ui.js)
 *
 * Funciones puras que devuelven fragmentos HTML (no hay framework ni DOM
 * virtual) más un par de ayudantes para actualizar el botón HABLAR en vivo
 * sin volver a pintar toda la pantalla. Los 13 componentes del sistema de
 * diseño viven aquí; su estilo está en css/components.css.
 */
(function (global) {
  "use strict";

  var icon = global.VT.icon;

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  // ---- 1. Botón HABLAR ---------------------------------------------------
  // estado: 'reposo' | 'escucha' | 'procesando' | 'deshabilitado'
  function botonHablar(opts) {
    opts = opts || {};
    var estado = opts.estado || "reposo";
    var size = opts.size === "desktop" ? "vt-voice-btn--desktop" : "vt-voice-btn--mobile";
    var id = opts.id || "btn-hablar";
    var disabled = estado === "deshabilitado";
    var etiqueta = {
      reposo: "HABLAR",
      escucha: "Escuchando…",
      procesando: "Procesando…",
      deshabilitado: "HABLAR"
    }[estado];

    var html =
      '<div class="vt-voice-wrap">' +
      '<button type="button" id="' + esc(id) + '" class="vt-voice-btn ' + size + '" ' +
      'data-mic-button data-state="' + estado + '" aria-pressed="' + (estado === "escucha") + '"' +
      (disabled ? " disabled" : "") + ">" +
      '<span class="vt-voice-btn__waves" aria-hidden="true"><span></span><span></span><span></span></span>' +
      icon(estado === "escucha" ? "microfono" : "microfono") +
      '<span class="vt-voice-btn__label">' + esc(etiqueta) + "</span>" +
      "</button>";

    if (estado === "escucha") {
      html += '<p class="vt-chip vt-chip--escucha" data-voice-chip>' + icon("microfono") + '<span>Escuchando…</span></p>';
    } else if (estado === "procesando") {
      html += '<p class="vt-chip vt-chip--neutral" data-voice-chip>' + icon("reloj") + '<span>Procesando lo que dijiste…</span></p>';
    } else if (estado === "deshabilitado" && opts.razonDeshabilitado) {
      html += '<p class="text-caption vt-voice-razon" data-voice-chip>' + esc(opts.razonDeshabilitado) + "</p>";
    }
    html += "</div>";
    return html;
  }

  /** Actualiza en vivo un botón HABLAR ya montado, sin re-renderizar la pantalla. */
  function actualizarEstadoVoz(root, estado, opts) {
    opts = opts || {};
    var btn = root.querySelector("[data-mic-button]");
    if (!btn) return;
    btn.setAttribute("data-state", estado);
    btn.setAttribute("aria-pressed", String(estado === "escucha"));
    btn.disabled = estado === "deshabilitado";
    var label = btn.querySelector(".vt-voice-btn__label");
    if (label) {
      label.textContent = { reposo: "HABLAR", escucha: "Escuchando…", procesando: "Procesando…", deshabilitado: "HABLAR" }[estado];
    }
    var wrap = btn.closest(".vt-voice-wrap");
    var chip = wrap ? wrap.querySelector("[data-voice-chip]") : null;
    if (chip) chip.remove();
    if (!wrap) return;
    if (estado === "escucha") {
      wrap.insertAdjacentHTML("beforeend", '<p class="vt-chip vt-chip--escucha" data-voice-chip>' + icon("microfono") + '<span>Escuchando…</span></p>');
    } else if (estado === "procesando") {
      wrap.insertAdjacentHTML("beforeend", '<p class="vt-chip vt-chip--neutral" data-voice-chip>' + icon("reloj") + '<span>Procesando lo que dijiste…</span></p>');
    } else if (estado === "deshabilitado" && opts.razonDeshabilitado) {
      wrap.insertAdjacentHTML("beforeend", '<p class="text-caption vt-voice-razon" data-voice-chip>' + esc(opts.razonDeshabilitado) + "</p>");
    }
  }

  // ---- 2 / 3. Botones CONFIRMAR / CORREGIR / genéricos -------------------
  function boton(opts) {
    opts = opts || {};
    var variante = opts.variante || "primario"; // primario | exito | secundario | fantasma
    var tamano = opts.tamano || "lg"; // lg(56) | xl(64) | base(48)
    var tag = opts.href ? "a" : "button";
    var attrs = opts.href ? ' href="' + esc(opts.href) + '"' : ' type="' + (opts.type || "button") + '"';
    if (opts.id) attrs += ' id="' + esc(opts.id) + '"';
    if (opts.extraAttrs) attrs += " " + opts.extraAttrs;
    if (opts.disabled) attrs += " disabled";
    var iconoHtml = opts.icono ? icon(opts.icono) : "";
    return (
      "<" + tag + ' class="vt-btn vt-btn--' + variante + " vt-btn--" + tamano + (opts.className ? " " + opts.className : "") + '"' + attrs + ">" +
      iconoHtml +
      '<span>' + esc(opts.texto) + "</span>" +
      "</" + tag + ">"
    );
  }

  // ---- 4. Tarjeta conversacional -----------------------------------------
  function tarjeta(opts) {
    opts = opts || {};
    var variante = opts.variante === "usuario" ? "vt-card--usuario" : "vt-card--asistente";
    return '<div class="vt-card ' + variante + (opts.className ? " " + opts.className : "") + '"' + (opts.id ? ' id="' + esc(opts.id) + '"' : "") + ">" + (opts.html || "") + "</div>";
  }

  /** Contenedor para el subtítulo que voice.speak() resalta palabra a palabra. */
  function subtitulo(opts) {
    opts = opts || {};
    return '<p class="vt-subtitulo text-h3" id="' + esc(opts.id || "vt-subtitulo") + '">' + esc(opts.texto || "") + "</p>";
  }

  // ---- 5. Campo de transcripción (eco) -----------------------------------
  function campoTranscripcion(opts) {
    opts = opts || {};
    var privado = !!opts.privado;
    var texto = privado ? "• • • • • •" : opts.texto || "";
    return (
      '<div class="vt-transcript' + (privado ? " vt-transcript--privado" : "") + '">' +
      '<span class="text-caption vt-transcript__etiqueta">Lo que entendí</span>' +
      '<p class="text-body-lg vt-transcript__texto" id="' + esc(opts.id || "vt-transcripcion") + '" aria-live="polite">' + esc(texto) + "</p>" +
      "</div>"
    );
  }

  // ---- 6. Indicador de progreso -------------------------------------------
  // Nota de decisión: el guion da al indicador mobile una numeración propia
  // por pantalla (M03 "Paso 1 de 4" Requisitos … M10 "Paso 4 de 4" Confirmar),
  // distinta de los cuatro pasos canónicos Identidad/Datos/Confirmación/
  // Constancia que pide el panel vertical de escritorio (componente 6). Se
  // tratan como dos indicadores independientes: éste es literal por pantalla.
  function progresoMobile(opts) {
    opts = opts || {};
    var actual = opts.actual || 1;
    var total = opts.total || 4;
    var segs = "";
    for (var i = 0; i < total; i++) {
      segs += '<span class="vt-progreso-mobile__seg' + (i < actual ? " is-completo" : "") + '"></span>';
    }
    return (
      '<div class="vt-progreso-mobile" role="group" aria-label="Progreso del trámite">' +
      '<p class="text-caption">Paso ' + actual + " de " + total + (opts.etiqueta ? ": " + esc(opts.etiqueta) : "") + "</p>" +
      '<div class="vt-progreso-mobile__barra">' + segs + "</div>" +
      "</div>"
    );
  }

  // Panel vertical de 4 pasos para desktop (zona izquierda)
  function progresoDesktopPanel(opts) {
    opts = opts || {};
    var pasos = opts.pasos || [];
    var actual = opts.actual || 1;
    var items = pasos
      .map(function (p, i) {
        var n = i + 1;
        var estado = n < actual ? "is-completo" : n === actual ? "is-actual" : "is-pendiente";
        return (
          '<li class="vt-progreso-desktop__item ' + estado + '"' + (n === actual ? ' aria-current="step"' : "") + ">" +
          '<span class="vt-progreso-desktop__marca">' + (n < actual ? icon("check") : n) + "</span>" +
          '<span class="vt-progreso-desktop__texto">' + esc(p) + "</span>" +
          "</li>"
        );
      })
      .join("");
    return '<ol class="vt-progreso-desktop" aria-label="Progreso del trámite">' + items + "</ol>";
  }

  // ---- 7. Mensaje de estado ------------------------------------------------
  var ICONOS_MENSAJE = { exito: "check-circulo", error: "alerta", advertencia: "alerta", info: "info" };
  function mensajeEstado(opts) {
    opts = opts || {};
    var variante = opts.variante || "info";
    var role = opts.role || (variante === "error" ? "alert" : "status");
    return (
      '<div class="vt-mensaje vt-mensaje--' + variante + (opts.className ? " " + opts.className : "") + '" role="' + role + '">' +
      icon(opts.icono || ICONOS_MENSAJE[variante]) +
      '<div class="vt-mensaje__texto">' +
      (opts.titulo ? '<p class="text-h3">' + esc(opts.titulo) + "</p>" : "") +
      '<p class="text-body">' + esc(opts.texto) + "</p>" +
      "</div>" +
      "</div>"
    );
  }

  // ---- 8. Chips de estado ---------------------------------------------------
  function chip(opts) {
    opts = opts || {};
    var variante = opts.variante || "neutral";
    return '<span class="vt-chip vt-chip--' + variante + (opts.className ? " " + opts.className : "") + '">' + icon(opts.icono) + "<span>" + esc(opts.texto) + "</span></span>";
  }

  function chipConexion(status) {
    var info = global.VT.connectivity.chipInfo(status);
    return chip({ icono: info.icon, texto: info.text, variante: info.variant });
  }

  // ---- 9. Barra de navegación inferior (mobile) -----------------------------
  var NAV_ITEMS = [
    { id: "inicio", texto: "Inicio", icono: "hogar", ruta: "m02" },
    { id: "tramites", texto: "Mis trámites", icono: "lista", ruta: "m16" },
    { id: "ayuda", texto: "Ayuda", icono: "ayuda", ruta: "m04" },
    { id: "perfil", texto: "Perfil", icono: "perfil", ruta: "m17" }
  ];
  function navInferior(activo) {
    return (
      '<nav class="vt-bottom-nav" aria-label="Navegación principal">' +
      NAV_ITEMS.map(function (it) {
        return (
          '<a class="vt-bottom-nav__item" href="#/' + it.ruta + '"' + (it.id === activo ? ' aria-current="page"' : "") + ">" +
          icon(it.icono) + "<span>" + it.texto + "</span>" +
          "</a>"
        );
      }).join("") +
      "</nav>"
    );
  }

  // ---- 10. Hoja inferior (bottom sheet) ---------------------------------------
  function hojaInferior(opts) {
    opts = opts || {};
    return (
      '<div class="vt-sheet-backdrop" id="' + esc(opts.id) + '-backdrop" hidden></div>' +
      '<section class="vt-sheet" id="' + esc(opts.id) + '" role="dialog" aria-modal="true" aria-labelledby="' + esc(opts.id) + '-titulo" hidden aria-hidden="true">' +
      '<header class="vt-sheet__header">' +
      '<h2 class="text-h3" id="' + esc(opts.id) + '-titulo">' + esc(opts.titulo) + "</h2>" +
      '<button type="button" class="vt-sheet__cerrar" data-cerrar-hoja="' + esc(opts.id) + '" aria-label="Cerrar">' + icon("cerrar") + "</button>" +
      "</header>" +
      '<div class="vt-sheet__cuerpo">' + (opts.cuerpo || "") + "</div>" +
      "</section>"
    );
  }

  function conectarHoja(root, id, triggerBtn) {
    var sheet = root.querySelector("#" + id);
    var backdrop = root.querySelector("#" + id + "-backdrop");
    if (!sheet) return;
    global.VT.a11y.openSheet(sheet, triggerBtn);
    if (backdrop) {
      backdrop.hidden = false;
      backdrop.addEventListener("click", function cerrar() {
        global.VT.a11y.closeSheet(sheet);
        backdrop.hidden = true;
      });
    }
    sheet.querySelectorAll("[data-cerrar-hoja]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        global.VT.a11y.closeSheet(sheet);
        if (backdrop) backdrop.hidden = true;
      });
    });
  }

  // ---- 11. Baldosa de icono squircle -----------------------------------------
  function tileIcono(opts) {
    opts = opts || {};
    return (
      '<span class="vt-tile">' +
      '<span class="vt-tile__destello" aria-hidden="true"></span>' +
      '<span class="vt-tile__glifo">' + icon(opts.icono) + "</span>" +
      "</span>" +
      '<span class="vt-tile__etiqueta">' + esc(opts.etiqueta) + "</span>"
    );
  }

  // ---- 12. Reproductor de audio del asistente ---------------------------------
  function reproductorAudio(opts) {
    opts = opts || {};
    var id = opts.id || "vt-audio";
    return (
      '<div class="vt-audio" id="' + esc(id) + '">' +
      '<button type="button" class="vt-audio__btn" data-audio-repetir aria-label="Repetir audio">' + icon("repetir") + "<span>Repetir</span></button>" +
      '<button type="button" class="vt-audio__btn" data-audio-pausa aria-label="Pausar">' + icon("pausa") + "<span>Pausa</span></button>" +
      '<label class="vt-audio__velocidad">' +
      '<span class="visually-hidden">Velocidad de lectura</span>' +
      '<select data-audio-velocidad>' +
      '<option value="0.75">0.75×</option>' +
      '<option value="1" selected>1×</option>' +
      '<option value="1.25">1.25×</option>' +
      "</select>" +
      "</label>" +
      "</div>"
    );
  }

  // Interruptor con etiqueta a la izquierda y estado escrito ("Activado").
  function interruptor(opts) {
    opts = opts || {};
    var activo = !!opts.activo;
    return (
      '<div class="vt-interruptor">' +
      '<span>' + esc(opts.texto) + "</span>" +
      '<span class="u-flex u-items-center u-gap-2">' +
      '<span class="text-caption" data-interruptor-estado="' + esc(opts.id) + '">' + (activo ? "Activado" : "Desactivado") + "</span>" +
      '<button type="button" class="vt-interruptor__control" id="' + esc(opts.id) + '" role="switch" aria-checked="' + activo + '" aria-label="' + esc(opts.texto) + '"></button>' +
      "</span>" +
      "</div>"
    );
  }

  function conectarInterruptor(root, id, onCambio) {
    var btn = root.querySelector("#" + id);
    if (!btn) return;
    var estadoEl = root.querySelector('[data-interruptor-estado="' + id + '"]');
    btn.addEventListener("click", function () {
      var nuevo = btn.getAttribute("aria-checked") !== "true";
      btn.setAttribute("aria-checked", String(nuevo));
      if (estadoEl) estadoEl.textContent = nuevo ? "Activado" : "Desactivado";
      onCambio(nuevo);
    });
  }

  // ---- 13. Contador de intentos -------------------------------------------------
  function contadorIntentos(actual, max) {
    return '<p class="vt-intentos text-caption">Intento ' + actual + " de " + max + ". Puedes pedir ayuda cuando quieras.</p>";
  }

  // ---- Estructura de página -------------------------------------------------------
  function contenedorPrincipal(innerHtml, className) {
    return '<main id="main-content" tabindex="-1" class="vt-main' + (className ? " " + className : "") + '">' + innerHtml + "</main>";
  }

  function cabeceraApp(opts) {
    opts = opts || {};
    return (
      '<header class="vt-header">' +
      '<span class="vt-header__logo"><span class="vt-header__logo-glifo">' + icon("microfono") + '</span> VozTrámite</span>' +
      '<div class="vt-header__acciones">' +
      (opts.chipConexion ? chipConexion(opts.statusConexion || "buena") : "") +
      (opts.mostrarSilenciar ? '<button type="button" class="vt-header__btn" data-accion="silenciar">' + icon("microfono-off") + "<span>Silenciar</span></button>" : "") +
      (opts.mostrarAjustes ? '<a class="vt-header__btn" href="#/m17">' + icon("ajustes") + "<span>Ajustes</span></a>" : "") +
      (opts.mostrarAyuda ? '<a class="vt-header__btn" href="#/m04">' + icon("ayuda") + "<span>Ayuda</span></a>" : "") +
      "</div>" +
      "</header>"
    );
  }

  /** Conecta el botón "Silenciar" de la cabecera, si la pantalla lo incluyó. */
  function conectarCabecera(root, state) {
    var btn = root.querySelector('[data-accion="silenciar"]');
    if (!btn) return;
    function pintar() {
      btn.innerHTML = state.vozSilenciada
        ? icon("microfono") + "<span>Activar voz</span>"
        : icon("microfono-off") + "<span>Silenciar</span>";
      btn.setAttribute("aria-pressed", String(!!state.vozSilenciada));
    }
    pintar();
    btn.addEventListener("click", function () {
      state.vozSilenciada = !state.vozSilenciada;
      global.VT.voice.setSilenciado(state.vozSilenciada);
      global.VT.saveState(state);
      pintar();
      global.VT.anunciar(state.vozSilenciada ? "Voz del asistente silenciada." : "Voz del asistente activada.");
    });
  }

  global.VT = global.VT || {};
  global.VT.ui = {
    botonHablar: botonHablar,
    actualizarEstadoVoz: actualizarEstadoVoz,
    boton: boton,
    tarjeta: tarjeta,
    subtitulo: subtitulo,
    campoTranscripcion: campoTranscripcion,
    progresoMobile: progresoMobile,
    progresoDesktopPanel: progresoDesktopPanel,
    mensajeEstado: mensajeEstado,
    chip: chip,
    chipConexion: chipConexion,
    navInferior: navInferior,
    hojaInferior: hojaInferior,
    conectarHoja: conectarHoja,
    tileIcono: tileIcono,
    reproductorAudio: reproductorAudio,
    contadorIntentos: contadorIntentos,
    interruptor: interruptor,
    conectarInterruptor: conectarInterruptor,
    contenedorPrincipal: contenedorPrincipal,
    cabeceraApp: cabeceraApp,
    conectarCabecera: conectarCabecera,
    esc: esc
  };
})(window);
