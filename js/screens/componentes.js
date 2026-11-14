/**
 * Página de muestra de componentes — no es una de las 26 pantallas del
 * guion, es una ayuda para revisar visualmente el sistema de diseño.
 */
(function (global) {
  "use strict";
  var UI = global.VT.ui;

  function render(state) {
    var cuerpo =
      '<h1 class="text-display">Muestra de componentes</h1>' +
      '<p class="text-body">Los 13 componentes del sistema de diseño, para revisar tokens, contraste y estados sin navegar todo el guion. <a href="#/">← Volver al índice</a></p>' +

      '<section class="vt-muestra__seccion"><h2 class="text-h2">1. Botón HABLAR</h2>' +
      '<div class="vt-muestra__fila">' +
      UI.botonHablar({ estado: "reposo", id: "muestra-voz-1" }) +
      UI.botonHablar({ estado: "escucha", id: "muestra-voz-2" }) +
      UI.botonHablar({ estado: "procesando", id: "muestra-voz-3" }) +
      UI.botonHablar({ estado: "deshabilitado", id: "muestra-voz-4", razonDeshabilitado: "Activa el micrófono del navegador para hablar" }) +
      "</div></section>" +

      '<section class="vt-muestra__seccion"><h2 class="text-h2">2 / 3. CONFIRMAR y CORREGIR</h2>' +
      '<div class="vt-acciones vt-acciones--fila">' +
      UI.boton({ texto: "CONFIRMAR", variante: "exito", tamano: "xl", icono: "check" }) +
      UI.boton({ texto: "CORREGIR", variante: "secundario", tamano: "xl", icono: "lapiz" }) +
      "</div></section>" +

      '<section class="vt-muestra__seccion"><h2 class="text-h2">4. Tarjeta conversacional</h2>' +
      UI.tarjeta({ variante: "asistente", html: UI.subtitulo({ id: "muestra-subtitulo", texto: "¿En qué agencia quieres recoger tu nuevo DNI?" }) }) +
      UI.tarjeta({ variante: "usuario", html: '<p class="text-body-lg">Agencia de San Borja</p>' }) +
      "</section>" +

      '<section class="vt-muestra__seccion"><h2 class="text-h2">5. Campo de transcripción</h2>' +
      UI.campoTranscripcion({ texto: "Agencia de San Borja" }) +
      UI.campoTranscripcion({ texto: "Agencia de San Borja", privado: true }) +
      "</section>" +

      '<section class="vt-muestra__seccion"><h2 class="text-h2">6. Indicador de progreso</h2>' +
      UI.progresoMobile({ actual: 2, total: 4, etiqueta: "Identidad" }) +
      UI.progresoDesktopPanel({ pasos: global.VT.data.TRAMITE.pasos, actual: 2 }) +
      "</section>" +

      '<section class="vt-muestra__seccion"><h2 class="text-h2">7. Mensajes de estado</h2>' +
      UI.mensajeEstado({ variante: "exito", titulo: "Identidad validada", texto: "Identidad validada en esta simulación." }) +
      UI.mensajeEstado({ variante: "error", titulo: "No pudimos validar tu respuesta", texto: "Puede que no te hayamos escuchado bien." }) +
      UI.mensajeEstado({ variante: "advertencia", texto: "Tu señal está débil. Puedes seguir sin perder nada." }) +
      UI.mensajeEstado({ variante: "info", texto: "Esta verificación es una simulación del prototipo." }) +
      "</section>" +

      '<section class="vt-muestra__seccion"><h2 class="text-h2">8. Chips de estado</h2>' +
      '<div class="vt-chips-fila">' +
      UI.chipConexion("buena") + UI.chipConexion("regular") + UI.chipConexion("debil") + UI.chipConexion("sin-conexion") +
      UI.chip({ icono: "celular-check", texto: "Guardado en tu celular", variante: "neutral" }) +
      UI.chip({ icono: "check", texto: "Sincronizado", variante: "success" }) +
      UI.chip({ icono: "wifi", texto: "Ahorro de datos activado", variante: "info" }) +
      "</div></section>" +

      '<section class="vt-muestra__seccion"><h2 class="text-h2">9. Barra de navegación inferior</h2>' +
      UI.navInferior("inicio") +
      "</section>" +

      '<section class="vt-muestra__seccion"><h2 class="text-h2">10. Hoja inferior</h2>' +
      UI.boton({ texto: "Abrir hoja de ejemplo", variante: "secundario", tamano: "base", id: "muestra-abrir-hoja" }) +
      UI.hojaInferior({ id: "muestra-hoja", titulo: "Captcha", cuerpo: '<p class="text-body">Una comprobación para saber que eres una persona y no un programa.</p>' }) +
      "</section>" +

      '<section class="vt-muestra__seccion"><h2 class="text-h2">11. Baldosas squircle</h2>' +
      '<div class="vt-muestra__tiles">' +
      '<div class="vt-tile-tarjeta">' + UI.tileIcono({ icono: "reniec_dni", etiqueta: "Renovar DNI" }) + "</div>" +
      '<div class="vt-tile-tarjeta">' + UI.tileIcono({ icono: "documento", etiqueta: "Antecedentes" }) + "</div>" +
      "</div></section>" +

      '<section class="vt-muestra__seccion"><h2 class="text-h2">12. Reproductor de audio</h2>' +
      UI.reproductorAudio({ id: "muestra-audio" }) +
      "</section>" +

      '<section class="vt-muestra__seccion"><h2 class="text-h2">13. Contador de intentos</h2>' +
      UI.contadorIntentos(1, 3) +
      "</section>";

    return UI.contenedorPrincipal(cuerpo, "vt-main--ancho");
  }

  function mount(root) {
    var trigger = root.querySelector("#muestra-abrir-hoja");
    if (trigger) trigger.addEventListener("click", function () { UI.conectarHoja(root, "muestra-hoja", trigger); });
  }

  global.VT.screens.componentes = { id: "componentes", title: "Muestra de componentes", render: render, mount: mount };
})(window);
