/**
 * D01 — Inicio, privacidad y elección del trámite (desktop).
 * Reorganiza M01+M02 en las tres zonas; sin funciones nuevas. Solo la
 * Renovación de DNI tiene flujo real; el resto de atajos avisa que aún no
 * está disponible en esta maqueta.
 */
(function (global) {
  "use strict";
  var UI = global.VT.ui;
  var voice = global.VT.voice;

  var ATAJOS = [
    { id: "dni", texto: "Renovar DNI", icono: "reniec_dni", disponible: true },
    { id: "antecedentes", texto: "Antecedentes", icono: "documento" },
    { id: "ruc", texto: "Activar o extender RUC", icono: "documento" },
    { id: "licencia", texto: "Licencia de conducir", icono: "documento" },
    { id: "partida", texto: "Partida de nacimiento", icono: "documento" },
    { id: "vigencia", texto: "Certificado de vigencia", icono: "documento" }
  ];

  var _onVoiceState = null;

  function render(state) {
    var centro =
      '<h1 class="text-display">¿Qué trámite necesitas hoy?</h1>' +
      UI.botonHablar({ estado: "reposo", id: "btn-hablar", size: "desktop" }) +
      '<div id="d01-resultado"></div>' +
      '<div id="d01-aviso"></div>' +

      '<form id="d01-form-escribir" class="vt-acciones vt-acciones--fila">' +
      '<label class="visually-hidden" for="d01-input">Escribe el trámite que necesitas</label>' +
      '<input type="text" id="d01-input" class="vt-transcript" style="flex:1" placeholder="O escribe aquí, por ejemplo: renovar mi DNI" />' +
      UI.boton({ texto: "Buscar", variante: "primario", tamano: "base", type: "submit" }) +
      "</form>" +

      '<div class="vt-muestra__tiles" id="d01-atajos">' +
      ATAJOS.map(function (a) {
        return '<button type="button" class="vt-tile-tarjeta" style="border:none;background:none;cursor:pointer" data-atajo="' + a.id + '">' + UI.tileIcono({ icono: a.icono, etiqueta: a.texto }) + "</button>";
      }).join("") +
      "</div>";

    var derecha =
      UI.mensajeEstado({ variante: "info", icono: "escudo", texto: "VozTrámite te orienta; no reemplaza a la entidad." }) +
      '<p><button type="button" class="vt-btn vt-btn--fantasma vt-btn--base" id="d01-que-datos">¿Qué datos usamos?</button></p>' +
      UI.hojaInferior({
        id: "d01-hoja-datos",
        titulo: "¿Qué datos usamos?",
        cuerpo: '<p class="text-body">Usamos solo lo necesario para orientarte: el trámite que eliges, las respuestas que nos das y, si lo permites, tu voz. Nada se envía a RENIEC ni a otra entidad real.</p>'
      });

    var grid =
      '<div class="vt-desktop-grid">' +
      '<div class="vt-desktop-grid__izq"></div>' +
      '<div class="vt-desktop-grid__centro vt-acciones">' + centro + "</div>" +
      '<div class="vt-desktop-grid__der vt-acciones">' + derecha + "</div>" +
      "</div>";

    return (
      UI.cabeceraApp({ chipConexion: true, statusConexion: state.connectivity.status, mostrarAjustes: true, mostrarAyuda: true }) +
      UI.contenedorPrincipal(grid, "vt-main--escritorio")
    );
  }

  function mapEstadoVoz(s) {
    return { idle: "reposo", listening: "escucha", processing: "procesando", speaking: "reposo" }[s] || "reposo";
  }

  function mostrarConfirmacion(root, nombreTramite) {
    var cont = root.querySelector("#d01-resultado");
    cont.innerHTML = UI.tarjeta({
      variante: "asistente",
      html:
        '<p class="text-h3">Entendí: ' + UI.esc(nombreTramite) + "</p>" +
        '<p class="text-body">¿Es correcto?</p>' +
        '<div class="vt-acciones vt-acciones--fila">' +
        UI.boton({ texto: "CONFIRMAR", variante: "exito", tamano: "lg", id: "d01-confirmar", icono: "check" }) +
        UI.boton({ texto: "CORREGIR", variante: "secundario", tamano: "lg", id: "d01-corregir", icono: "lapiz" }) +
        "</div>"
    });
    root.querySelector("#d01-confirmar").addEventListener("click", function () { global.VT.navegar("d02"); });
    root.querySelector("#d01-corregir").addEventListener("click", function () { cont.innerHTML = ""; });
  }

  function mount(root, state) {
    UI.conectarCabecera(root, state);

    var btnDatos = root.querySelector("#d01-que-datos");
    btnDatos.addEventListener("click", function () { UI.conectarHoja(root, "d01-hoja-datos", btnDatos); });

    var btn = root.querySelector("#btn-hablar");
    _onVoiceState = function (s) { UI.actualizarEstadoVoz(root, mapEstadoVoz(s)); };
    voice.on("state", _onVoiceState);
    btn.addEventListener("click", function () {
      if (voice.getState() !== "idle") return;
      voice.listen({ timeout: 1400, responses: ["Renovar mi DNI porque ya caducó"] }).then(function () {
        mostrarConfirmacion(root, global.VT.data.TRAMITE.nombre);
      });
    });

    root.querySelector("#d01-form-escribir").addEventListener("submit", function (e) {
      e.preventDefault();
      mostrarConfirmacion(root, global.VT.data.TRAMITE.nombre);
    });

    root.querySelectorAll("[data-atajo]").forEach(function (b) {
      b.addEventListener("click", function () {
        var atajo = ATAJOS.find(function (a) { return a.id === b.getAttribute("data-atajo"); });
        if (atajo.disponible) {
          global.VT.navegar("d02");
        } else {
          root.querySelector("#d01-aviso").innerHTML = UI.mensajeEstado({ variante: "info", texto: "Por ahora esta maqueta solo cubre la Renovación de DNI por caducidad. Prueba con ese trámite." });
        }
      });
    });
  }

  function unmount() {
    if (_onVoiceState) voice.off("state", _onVoiceState);
    _onVoiceState = null;
    voice.cancel();
  }

  global.VT.screens.d01 = { id: "d01", title: "Inicio (desktop)", render: render, mount: mount, unmount: unmount };
})(window);
