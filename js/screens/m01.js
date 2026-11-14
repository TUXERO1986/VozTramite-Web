/**
 * M01 — Bienvenida, privacidad y modo de uso.
 * La elección de modo y el Modo privado se guardan y no se vuelven a preguntar.
 */
(function (global) {
  "use strict";
  var UI = global.VT.ui;

  function render(state) {
    var cuerpo =
      '<h1 class="text-display">Hola, soy VozTrámite</h1>' +
      '<p class="text-body">Te ayudo a entender y preparar tu trámite hablando o tocando, como prefieras.</p>' +
      UI.mensajeEstado({ variante: "info", icono: "escudo", texto: "VozTrámite te orienta; no reemplaza a la entidad." }) +

      '<div class="vt-acciones">' +
      '<button type="button" class="vt-opcion vt-opcion--recomendada" id="m01-modo-hablar">' +
      global.VT.icon("microfono", { className: "vt-opcion__glifo" }) +
      '<span class="vt-opcion__texto"><span class="text-h3">Quiero hablar</span><span class="text-body">El asistente te hace una pregunta a la vez y tú respondes en voz alta.</span></span>' +
      "</button>" +
      '<button type="button" class="vt-opcion" id="m01-modo-leer">' +
      global.VT.icon("lista", { className: "vt-opcion__glifo" }) +
      '<span class="vt-opcion__texto"><span class="text-h3">Prefiero leer y tocar</span><span class="text-body">Lees cada pregunta y respondes tocando la pantalla.</span></span>' +
      "</button>" +
      "</div>" +

      '<p><button type="button" class="vt-btn vt-btn--fantasma vt-btn--base" id="m01-que-datos">¿Qué datos usamos?</button></p>' +

      '<label class="vt-checkbox">' +
      '<input type="checkbox" id="m01-privado"' + (state.privacyMode ? " checked" : "") + " />" +
      '<span>Modo privado: no repetir mis datos en voz alta</span>' +
      "</label>" +

      '<p class="text-caption">Tu elección se guarda en este celular y no te la volveremos a preguntar.</p>' +

      UI.hojaInferior({
        id: "m01-hoja-datos",
        titulo: "¿Qué datos usamos?",
        cuerpo:
          '<p class="text-body">Usamos solo lo necesario para orientarte: el trámite que eliges, las respuestas que nos das y, si lo permites, tu voz para entenderte mejor.</p>' +
          '<p class="text-body">No compartimos tus datos con nadie más que la propia simulación de este prototipo. Nada se envía a RENIEC ni a otra entidad real.</p>'
      });

    return UI.cabeceraApp({ mostrarSilenciar: true }) + UI.contenedorPrincipal(cuerpo);
  }

  function elegirModo(state, modo) {
    state.modo = modo;
    state.onboarded = true;
    global.VT.saveState(state);
    global.VT.navegar("m02");
  }

  function mount(root, state) {
    UI.conectarCabecera(root, state);

    var btnDatos = root.querySelector("#m01-que-datos");
    if (btnDatos) btnDatos.addEventListener("click", function () { UI.conectarHoja(root, "m01-hoja-datos", btnDatos); });

    var chkPrivado = root.querySelector("#m01-privado");
    if (chkPrivado) chkPrivado.addEventListener("change", function () {
      state.privacyMode = chkPrivado.checked;
      global.VT.saveState(state);
    });

    var btnHablar = root.querySelector("#m01-modo-hablar");
    if (btnHablar) btnHablar.addEventListener("click", function () { elegirModo(state, "hablar"); });
    var btnLeer = root.querySelector("#m01-modo-leer");
    if (btnLeer) btnLeer.addEventListener("click", function () { elegirModo(state, "leer"); });
  }

  global.VT.screens.m01 = { id: "m01", title: "Bienvenida", render: render, mount: mount };
})(window);
