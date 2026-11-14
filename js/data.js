/**
 * VozTrámite — Datos de ejemplo (maqueta)
 * Todo el contenido de este archivo es de MAQUETA para la demo académica.
 * En una versión real, estos textos y guiones se sustituyen por los
 * contenidos oficiales del trámite y por reconocimiento/síntesis de voz reales.
 */
(function (global) {
  "use strict";

  var TRAMITE = {
    id: "renovacion-dni",
    nombre: "Renovación de DNI por caducidad",
    entidad: "RENIEC",
    costo: "S/ 34.30",
    lugarPago: "Banco de la Nación o agentes autorizados",
    pasos: ["Identidad", "Datos", "Confirmación", "Constancia"],

    // M03 — máximo 3 visibles + "Ver todos"
    requisitos: [
      { icon: "reniec_dni", texto: "Tu DNI azul o amarillo actual, aunque esté vencido" },
      { icon: "documento", texto: "Recibo de pago por derecho de tramitación" },
      { icon: "celular", texto: "Un número de celular para recibir avisos" },
      { icon: "lapiz", texto: "Confirmar que tu dirección sigue siendo la misma" },
      { icon: "info", texto: "Si cambiaste de domicilio, tenlo a la mano para actualizarlo" }
    ],

    // M04 — glosario (hoja inferior, también usado en D02)
    glosario: [
      {
        termino: "Captcha",
        significado: "Una comprobación para saber que eres una persona y no un programa.",
        ejemplo: "Como cuando te piden marcar todas las fotos que tienen un semáforo."
      },
      {
        termino: "Constancia de orientación",
        significado: "Un comprobante de que usaste VozTrámite, no un documento oficial de RENIEC.",
        ejemplo: "Es como la nota que te llevas de una cita informativa, no el trámite ya hecho."
      }
    ],

    // M06 — preguntas biográficas de validación. `intentos` es un guion de
    // resultados simulados por intento (se repite el último si se insiste);
    // la primera pregunta falla una vez a propósito para poder demostrar M08.
    preguntasValidacion: [
      {
        pregunta: "¿Cuál es el primer nombre de tu madre?",
        intentos: [
          { texto: "Roxana", correcta: false },
          { texto: "Rosa", correcta: true }
        ]
      },
      {
        pregunta: "¿En qué distrito naciste?",
        intentos: [{ texto: "Cusco", correcta: true }]
      }
    ],

    // M09 / D04 — preguntas núcleo del trámite (paso Datos). La primera
    // pregunta no se entiende en el primer intento a propósito, para poder
    // demostrar en M09 el aviso "No entendí, ¿la repetimos?".
    preguntasDatos: [
      {
        campo: "Agencia de recojo",
        pregunta: "¿En qué agencia quieres recoger tu nuevo DNI?",
        intentos: [{ entendida: false }, { entendida: true, texto: "Agencia de San Borja" }]
      },
      {
        campo: "Aviso de llegada",
        pregunta: "¿A qué celular te avisamos cuando esté listo?",
        intentos: [{ entendida: true, texto: "999 222 444" }]
      }
    ],

    codigoOrientacionEjemplo: "ORN-2026-048213"
  };

  global.VT = global.VT || {};
  global.VT.data = { TRAMITE: TRAMITE };
})(window);
