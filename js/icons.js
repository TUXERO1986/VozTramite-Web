/**
 * VozTrámite — Librería de iconos SVG en línea.
 * Rejilla 24×24, trazo 2px, remates y uniones redondeadas, plano (sin sombras/degradados).
 * Los iconos son SIEMPRE decorativos (aria-hidden): la etiqueta de texto visible que
 * los acompaña es la que da significado accesible (regla de doble codificación sensorial).
 */
(function (global) {
  "use strict";

  var PATHS = {
    microfono: '<path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Z"/><path d="M19 11a7 7 0 0 1-14 0"/><path d="M12 18v3"/><path d="M9 21h6"/>',
    "microfono-off": '<path d="M12 15a3 3 0 0 0 3-3V9.5M9 6.2V6a3 3 0 0 1 5.6-1.5"/><path d="M19 11a7 7 0 0 1-9.5 6.6"/><path d="M5 11a7 7 0 0 0 .4 2.3"/><path d="M12 18v3"/><path d="M9 21h6"/><path d="M3 3l18 18"/>',
    check: '<path d="M4 12.5 9.5 18 20 6"/>',
    "check-circulo": '<circle cx="12" cy="12" r="9"/><path d="M8 12.5 11 15.5 16 9"/>',
    alerta: '<path d="M12 3 2 20h20L12 3Z"/><path d="M12 10v4"/><path d="M12 17h.01"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 8h.01"/>',
    escudo: '<path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z"/><path d="M9 12l2 2 4-4"/>',
    antena: '<path d="M12 21v-7"/><path d="M8 14a4 4 0 0 1 8 0"/><path d="M5 11a7 7 0 0 1 14 0"/>',
    "antena-regular": '<path d="M12 21v-7"/><path d="M8 14a4 4 0 0 1 8 0"/>',
    "antena-debil": '<path d="M12 21v-7"/>',
    "antena-off": '<path d="M12 21v-7"/><path d="M8 14a4 4 0 0 1 8 0"/><path d="M5 11a7 7 0 0 1 14 0"/><path d="M3 3l18 18"/>',
    wifi: '<path d="M5 12.5a10 10 0 0 1 14 0"/><path d="M8 15.5a6 6 0 0 1 8 0"/><path d="M12 19h.01"/>',
    hogar: '<path d="M4 11.5 12 4l8 7.5"/><path d="M6 10v9h12v-9"/><path d="M10 19v-5h4v5"/>',
    lista: '<path d="M9 6h11"/><path d="M9 12h11"/><path d="M9 18h11"/><path d="M4.5 6h.01"/><path d="M4.5 12h.01"/><path d="M4.5 18h.01"/>',
    ayuda: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.3a2.5 2.5 0 0 1 4.9.7c0 1.7-2.4 2-2.4 3.5"/><path d="M12 17h.01"/>',
    perfil: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20c0-3.5 3.1-6 7-6s7 2.5 7 6"/>',
    ajustes: '<circle cx="12" cy="12" r="3"/><path d="M19.4 13.5a1.8 1.8 0 0 0 .3-1.5 1.8 1.8 0 0 0-.3-1.5l1.3-1.8-1.9-1.9-1.8 1.3a1.8 1.8 0 0 0-1.5-.3 1.8 1.8 0 0 0-1.5.3L12.2 3H9.8l-1.8 2.3a1.8 1.8 0 0 0-1.5.3 1.8 1.8 0 0 0-1.5-.3l-1.9 1.9 1.3 1.8a1.8 1.8 0 0 0-.3 1.5c0 .5.1 1 .3 1.5l-1.3 1.8 1.9 1.9 1.8-1.3c.5.2 1 .3 1.5.3s1-.1 1.5-.3L9.8 21h2.4l1.8-2.3c.5 0 1-.1 1.5-.3l1.8 1.3 1.9-1.9-1.3-1.8Z" opacity="0"/><path d="M4.6 9.5A8 8 0 0 0 4 12c0 .8.1 1.6.4 2.3M19.4 14.3c.3-.7.4-1.5.4-2.3s-.1-1.6-.4-2.3M9.5 4.6a8 8 0 0 1 5 0M9.5 19.4a8 8 0 0 0 5 0"/>',
    celular: '<rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M10 19.5h4"/>',
    "celular-check": '<rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M9.3 11.5 11 13.2l4-4"/>',
    candado: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    reloj: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
    repetir: '<path d="M4 12a8 8 0 0 1 14-5.3L20 8"/><path d="M20 4v4h-4"/><path d="M20 12a8 8 0 0 1-14 5.3L4 16"/><path d="M4 20v-4h4"/>',
    pausa: '<rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/>',
    reproducir: '<path d="M7 4.5v15l13-7.5-13-7.5Z"/>',
    velocidad: '<circle cx="12" cy="13" r="8"/><path d="M12 13 15.5 9"/><path d="M9 4.5 9 2.5"/><path d="M15 4.5 15 2.5"/>',
    mensaje: '<path d="M4 5h16v11H9l-4 4V5Z"/><path d="M8 9h8"/><path d="M8 12.5h5"/>',
    sobre: '<rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="M3.5 6.5 12 13 20.5 6.5"/>',
    lapiz: '<path d="M4 20h4l11-11-4-4L4 16v4Z"/><path d="M14 6l4 4"/>',
    flecha_atras: '<path d="M19 12H6"/><path d="M11 6l-6 6 6 6"/>',
    cerrar: '<path d="M6 6l12 12"/><path d="M18 6 6 18"/>',
    chevron_abajo: '<path d="M6 9l6 6 6-6"/>',
    descarga: '<path d="M12 4v11"/><path d="M7 11l5 5 5-5"/><path d="M5 20h14"/>',
    documento: '<path d="M7 3h7l3 3v15H7V3Z"/><path d="M14 3v3h3"/><path d="M9.5 12h5"/><path d="M9.5 15.5h5"/>',
    reniec_dni: '<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="8.5" cy="12" r="2"/><path d="M13 10h5"/><path d="M13 14h5"/>',
    caja_pendiente: '<rect x="3.5" y="8" width="17" height="12" rx="1.5"/><path d="M3.5 8 7 4h10l3.5 4"/><path d="M3.5 8h17"/>',
    paquete: '<path d="M3.5 7.5 12 3l8.5 4.5V17L12 21.5 3.5 17V7.5Z"/><path d="M3.5 7.5 12 12l8.5-4.5"/><path d="M12 12v9.5"/>'
  };

  function icon(name, opts) {
    opts = opts || {};
    var size = opts.size || 24;
    var cls = opts.className ? " " + opts.className : "";
    var body = PATHS[name];
    if (!body) { body = PATHS.info; }
    return (
      '<svg class="vt-icon' + cls + '" width="' + size + '" height="' + size +
      '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
      body + "</svg>"
    );
  }

  global.VT = global.VT || {};
  global.VT.icon = icon;
})(window);
