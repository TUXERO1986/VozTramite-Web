# VozTrámite — Maqueta de trámites por voz

Prototipo de interfaz de trámites estatales peruanos guiada por voz. Es un
trabajo académico de HCI/UX: una **maqueta navegable de alta fidelidad**,
no un producto con backend. La app orienta; no tramita.

## Cómo abrir

Abre [`index.html`](index.html) directamente con doble clic (sin servidor,
sin build step, sin dependencias de `npm`). Funciona en cualquier navegador
moderno, en mobile (desde 320px de ancho) y en desktop (≥1024px).

## Cómo navegar

- **`#/`** abre un índice con las 26 pantallas del guion, agrupadas por
  Mobile Flujo 1, Mobile Flujo 2 y Desktop — pensado para revisión.
- Cada pantalla es una ruta por hash: `#/m01` … `#/m17`, `#/d01` … `#/d09`.
- `#/componentes` muestra los 13 componentes del sistema de diseño sueltos
  (no es una de las 26 pantallas del guion, es una ayuda de revisión).
- `?debug=1` (por ejemplo `index.html?debug=1#/m15`) muestra un panel fijo
  para forzar el estado de conexión (buena/regular/débil/sin conexión) y
  probar los flujos offline sin esperar una red real.

## Estructura

```
index.html              router/shell + índice de pantallas
css/
  tokens.css             design tokens (paleta 60-30-10, tipografía, espaciado)
  base.css                reset, utilidades, foco visible, movimiento reducido
  components.css          los 13 componentes del sistema de diseño
  layout.css              flujo mobile + grid de 12 columnas / 3 zonas en desktop
js/
  app.js                  router por hash, estado global (localStorage)
  voice.js                voz SIMULADA (ver más abajo)
  connectivity.js         simulador de conexión, modo ligero, cola offline
  a11y.js                 ajustes de lectura/movimiento, hojas inferiores, teclado
  ui.js                   funciones que renderizan los 13 componentes
  icons.js                librería de iconos SVG en línea
  data.js                 guion de ejemplo: "Renovación de DNI por caducidad"
  screens/
    m01.js … m17.js        Mobile — Flujo 1 (voz) y Flujo 2 (offline)
    d01.js … d09.js         Desktop
    componentes.js          página de muestra de componentes
assets/icons/            (los iconos se generan en línea vía icons.js)
```

Cada pantalla se registra como `window.VT.screens['id'] = { id, title,
render(state), mount(root, state), unmount() }`. El router lee
`location.hash`, pinta `render()` dentro de `#app-root` y llama a `mount()`;
`unmount()` limpia temporizadores y suscripciones a `voice`/`connectivity`
antes de montar la siguiente pantalla.

## Qué está simulado (y por qué)

- **Voz**: `js/voice.js` no usa reconocimiento ni síntesis reales. `speak()`
  resalta el subtítulo palabra por palabra con un temporizador; `listen()`
  resuelve con respuestas de un guion fijo (`js/data.js`), incluyendo a
  propósito un intento fallido para poder demostrar M08/D03 y el aviso "No
  entendí" de M09/D04. Cada función deja un comentario `// TODO` marcando
  dónde se enchufaría `SpeechSynthesisUtterance` / `webkitSpeechRecognition`.
- **Conectividad**: el estado de conexión y el envío por paquetes son
  simulados con temporizadores (`js/connectivity.js`); el panel `?debug=1`
  los fuerza manualmente.
- **DNI electrónico**: la opción aparece en M05/D03 pero solo se explica
  (no hay lectura NFC real posible desde un navegador).
- **Constancia y envío**: el "visor de constancia" es un bloque de maqueta
  (no genera un PDF real) y "Enviar por WhatsApp o SMS" usa `navigator.share`
  si el navegador lo soporta; si no, muestra un aviso de qué pasaría en la
  versión real. Nunca se afirma que el trámite quedó "registrado ante RENIEC".
- **Trámite de ejemplo único**: solo "Renovación de DNI por caducidad" tiene
  flujo completo. Los demás atajos (Antecedentes, RUC, etc. en M02/D01)
  muestran un aviso honesto de que esa maqueta no los cubre todavía, en vez
  de simular un flujo inexistente.

## Qué falta / decisiones donde el guion era ambiguo

- **Color del botón HABLAR**: el guion se contradice (4.1.1 dice Cian Vocal
  `#0284C7`; la matriz de accesibilidad dice Cian Profundo `#0369A1`). Se
  resolvió a favor del contraste: el relleno siempre es `#0369A1` (5.93:1
  con blanco); `#0284C7` queda solo para iconos, bordes y ondas. Ver el
  comentario en `css/tokens.css`.
- **Numeración de "Paso X de 4" (mobile) vs. panel de 4 pasos (desktop)**:
  el guion numera el badge mobile de forma distinta a los cuatro pasos
  canónicos del panel vertical de escritorio (p. ej. M05/Identidad dice
  "Paso 2 de 4" pero el panel de escritorio pone a Identidad en el puesto
  1). Se tratan como dos indicadores independientes: el badge mobile usa el
  texto literal de cada pantalla; el panel de escritorio usa siempre
  Identidad → Datos → Confirmación → Constancia.
- **Zonas de escritorio no descritas por el guion**: algunas pantallas D0x
  solo describen dos de las tres zonas (p. ej. D06 solo habla de un visor y
  un código). Se mantuvo la rejilla de 3 zonas en todas las pantallas por
  consistencia visual, dejando vacía la zona no descrita; D08 es la
  excepción deliberada (usa el ancho completo porque aloja una tabla).
- **M04 como ruta propia**: el guion especifica M04 como hoja inferior
  contextual (así la abre M03, sobre el término que se tocó). Para que
  también sea navegable directamente por hash (`#/m04`), esa ruta muestra
  el mismo contenido como página completa con un selector de término.
- **Seis atajos de D01 / M02**: el guion solo nombra 2–3 atajos de ejemplo
  (DNI, antecedentes, RUC). Se completaron hasta seis con trámites
  plausibles (licencia de conducir, partida de nacimiento, certificado de
  vigencia) solo para poblar la rejilla de 3 columnas que pide D01; ninguno
  tiene flujo real.
- **Reconocimiento y síntesis de voz reales**: no implementados (ver
  "Qué está simulado"). La API de `js/voice.js` ya está pensada para no
  tener que tocar ninguna pantalla al enchufar la Web Speech API real.
- **Persistencia**: todo el estado vive en `localStorage` en este navegador;
  no hay cuenta de usuario real ni sincronización entre dispositivos.
