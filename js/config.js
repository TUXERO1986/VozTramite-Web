/**
 * VozTrámite · configuración (config.js)
 * Se carga antes de assistant.js.
 *
 * iaEndpoint: pega aquí la URL de tu Cloudflare Worker (el proxy de IA).
 * Déjalo vacío ("") para usar solo el análisis local, sin enviar nada a internet.
 * La IA solo recibe lo que la persona dice al elegir el trámite y sus preguntas libres
 * («Tengo una duda»); nunca sus datos, ni en Identidad, Datos o Confirmación.
 */
window.VT_CONFIG = { iaEndpoint: "https://voztramite-ia.gegecam29.workers.dev" };
