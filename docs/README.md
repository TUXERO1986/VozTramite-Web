# VozTrámite · Landing page responsive (Capítulo V)

Landing page de **VozTrámite**, un asistente conversacional por voz que orienta a las personas para preparar trámites del Estado peruano. Es un proyecto académico (HCI for UX Design, UPC); la constancia que genera es solo de orientación y no reemplaza a ninguna entidad.

## Cómo ejecutarla

```bash
python3 -m http.server 8123
# abrir http://localhost:8123/pages/index.html  (vistas: #/inicio, #/tramite, #/historial, #/conexion, #/glosario, #/ajustes, #/perfil)
```

En GitHub Pages se publica desde la raíz de la rama principal; `index.html` de la raíz redirige a `pages/index.html`.

## Estructura (según el Handbook)

```
assets/            imágenes, íconos y fuentes (Instrument Sans, SIL OFL 1.1)
css/styles.css     identidad Onda: tokens, componentes y responsive
js/data.js         trámites (data-driven), requisitos, preguntas y glosario
js/config.js       configuración: URL del Worker de IA (`window.VT_CONFIG.iaEndpoint`)
js/assistant.js    voz (Web Speech API), comprensión local y punto de enchufe de IA
js/main.js         flujo del asistente y componentes
pages/index.html   app shell de una sola página con vistas por hash
docs/              documentación, wireframes, historias de usuario y pruebas
favicon.ico
```

## Qué implementa

Una sola página responsive (Desktop, Tablet y Mobile con el mismo HTML/CSS/JS) con forma de **app shell**:
se muestra una vista a la vez y se cambia por hash, sin recargar ni redirigir (HU-033). Implementa **30 historias de usuario core**; la trazabilidad vive en `docs/` y en
los atributos `data-hu` del marcado (no visibles); el detalle está en [`docs/trazabilidad-hu.md`](trazabilidad-hu.md).

### Vistas (enrutado por hash)

| Hash | Vista | Pantallas |
|---|---|---|
| `#/inicio` (por defecto y para hash desconocido) | Saludo, «Continúa donde quedaste», 4 trámites activos con «Empezar» (DNI, antecedentes, RUC y licencia) y 2 «Próximamente», franja de beneficios, 4 pasos y nota de alcance | D01 |
| `#/tramite` | Asistente: «Tu avance», conversación (Hablar, Repetir, Teclado, Ayuda) y panel «Lo que voy entendiendo» / ejemplo / privacidad / conexión (se oculta en modo simple) | D02–D06 (layout D04) |
| `#/historial` | Trámites «En curso» (paso actual, barra de avance y «Continuar») y «Preparados» (código VT-…, fecha, «Ver resumen» y «Escuchar resumen»), con filtros Todos / En curso / Preparados y estado vacío | — |
| `#/conexion` | Diagnóstico, modo ligero, simular señal, avance guardado y pendientes | D07, D08 |
| `#/glosario` | Buscador y lista de términos | — |
| `#/ajustes` | Tamaño de texto, contraste, modo simple y voz (`#btn-ajustes` lleva aquí) el bloque «Probar voz» (probar micrófono, probar cómo te hablo, selector «Voz del asistente» y compatibilidad del navegador) y «Asistente con IA» (estado y «Probar IA») | D09 |
| `#/perfil` | Avatar con iniciales, «¿Cómo quieres que te llame?» (se usa en el saludo de inicio), resumen de preferencias (incluida la voz elegida) con enlace a Ajustes, accesos a Historial y Conexión, y bloque de privacidad con «Borrar mis datos y mi historial» (confirmación en un `<dialog>`) | — |

Al cambiar de vista se actualiza `document.title` («Mi trámite · VozTrámite»), `aria-current="page"` en la navegación, el foco pasa al encabezado de la vista y se anuncia en `#live`. Si se recarga a mitad del trámite sin hash, se retoma en `#/tramite` con el aviso «Retomaste donde quedaste». «Ir al asistente» es el primer foco y lleva a `#/tramite` con el foco dentro del asistente.

### Shell por breakpoint

| Ancho | Navegación | Detalle |
|---|---|---|
| ≥ 1100 px | Barra lateral fija de 248 px | Logo y, con ícono + texto: Inicio, Mi trámite, Historial, Conexión, Glosario y Ajustes. Al pie, el chip de conexión, la tarjeta de usuario (avatar + nombre o «Mi perfil», lleva a `#/perfil`) y «Proyecto académico · UPC · HCI for UX Design · Grupo 1». Barra superior fina con el título de la vista. El asistente usa 3 columnas desde 1280 px; entre 1100 y 1279 px «Tu avance» pasa a una fila horizontal sobre 2 columnas |
| 768–1099 px | Riel lateral de íconos (72 px, objetivos de 56 px) | Los mismos 6 ítems y, abajo, el avatar de Perfil; cada uno con `aria-label` y tooltip. El chip de conexión de la barra superior es un enlace a `#/conexion` |
| < 768 px | Barra superior simple + 5 pestañas inferiores (≥ 48 px, con safe-area) | Inicio, Mi trámite, Historial, Glosario y Perfil. Conexión se abre desde el chip de la barra superior y Ajustes desde el botón `#btn-ajustes` o desde Perfil. HABLAR de 64 px |

El cambio entre vistas hace un fade corto, desactivado con `prefers-reduced-motion` y en modo ligero.

| Área | Qué se puede probar |
|---|---|
| Voz | Botón **Hablar** con reconocimiento real (Web Speech API, `es-PE`), transcripción en vivo, lectura en voz alta de cada pregunta y de cada dato; el teclado siempre está disponible |
| Baja conectividad | Diagnóstico de red, **modo ligero**, estado «sin señal» con avance guardado en `localStorage` y sincronización al volver |
| Accesibilidad | Contraste AA/AAA, objetivos táctiles ≥ 44 px, foco visible, navegación por teclado, `aria-live`, ajustes de tamaño y contraste, modo simple |
| Lenguaje claro | Traducción de lo que dice la persona al nombre oficial del trámite, glosario con ejemplos |
| Privacidad | Modo privado que oculta los datos, constancia de orientación con código |

### Perfil e historial

Todo se guarda **solo en `localStorage` de este equipo** (con `try/catch`); nada sale del navegador.

| Clave | Contenido |
|---|---|
| `voztramite:landing:v1` | Avance del trámite y ajustes (ya existía) |
| `voztramite:perfil:v1` | `{ nombre }` para el saludo de inicio («Hola, Rosa…») |
| `voztramite:historial:v1` | Lista de trámites preparados: `{ id, tramite, entidad, codigo, fecha, estado: "Solicitud preparada", campos: [{ k, v, p }] }` |
| `voztramite:voz:v1` | `{ id }` de la voz elegida en Ajustes |

- **Cómo funciona el historial.** Cada vez que se genera la constancia (`emitir()` / `codigo()` en `js/main.js`) se registra un ítem, una sola vez por código VT-…. El trámite actual aparece en «En curso» mientras haya progreso y no se haya emitido la constancia; al emitirla pasa a «Preparados». No se siembran datos falsos: sin trámites se ve «Aún no tienes trámites» y el botón «Empezar mi trámite».
- **Ver resumen** abre un `<dialog>` con los datos confirmados; con el modo privado activo se ocultan la fecha de nacimiento y el celular. **Escuchar resumen** usa `speechSynthesis`.
- **Borrar mis datos y mi historial** (en Perfil) pide confirmación en un `<dialog>` y elimina las claves de arriba y reinicia el estado.

## Accesibilidad (verificable)

- Contraste: Tinta/blanco 18.72:1, Gris Texto/blanco 7.60:1, blanco/Cobalto 7.81:1 (WCAG 2.1 AAA).
- Botones y campos de al menos 48 px (HABLAR 64 px); verificado por la prueba PA-31.
- Todo estado usa **ícono + texto + color**, nunca solo color.
- `<html lang="es">`, enlace «Ir al asistente», regiones `aria-live`, formularios con etiquetas.
- Respeta `prefers-reduced-motion`.
- Navegación por vistas con foco en el encabezado y `aria-current="page"` (PA-35); objetivos de 48 px en la navegación de cada breakpoint (PA-31).

## Trámites (motor data-driven)

El asistente tiene 6 pasos fijos por trámite: Trámite → Requisitos → Identidad → Datos → Confirmación → Constancia. Todo lo propio de cada trámite vive en `VT.TRAMITES` (`js/data.js`): nombre formal, explicación simple, entidad, requisitos (3 visibles + «Ver todos»), costo y vigencia (con la marca «referencial · confírmalo en gob.pe» cuando no está verificado), modo de identidad, preguntas de datos, «Qué hacer después» y canal oficial (siempre como texto, sin enlaces externos). `js/main.js` solo dibuja lo que dice esa configuración. Las fuentes y la fecha de consulta están en [`fuentes-tramites.md`](fuentes-tramites.md).

| Trámite | Flujo en una línea |
|---|---|
| Renovación de DNI (RENIEC) | 5 requisitos → 2 preguntas biográficas (demo) → fecha de nacimiento, agencia y celular → constancia |
| Certificado de antecedentes | Pregunta si es **policial** o **penal** → requisitos y costo de cada uno (penal S/ 40.40, verificado en pj.gob.pe) → 2 preguntas biográficas → uso o modalidad, quién lo pide y correo → constancia |
| Inscripción o activación de RUC (SUNAT) | 5 requisitos → «Cómo valida SUNAT quién eres» y «¿Ya tienes Clave SOL?» (sí/no, y orienta) → actividad, domicilio fiscal, inicio de actividades y correo → constancia |
| Revalidación de licencia A-I (MTC) | 5 requisitos y costos referenciales → 2 preguntas biográficas → categoría, fecha del examen médico y ¿papeletas? (sí/no) → constancia |

Tipos de pregunta (parser en `assistant.js`, todos devuelven `{valor, leido}`): `fecha`, `celular`, `agencia`, `opcion` (lista con sinónimos, por voz o botones), `sino` y `correo` («arroba» → @, «punto» → «.», sin espacios; si falla 2 veces se ofrece el teclado). La constancia lleva el código VT-AAAA-NNNNNN, el resumen, 3 a 5 pasos y el canal oficial (p. ej. «gob.pe/309»), y queda en el historial. Los términos del glosario del trámite activo se resaltan en los requisitos con `[data-term]`.

## Asistente con IA (opcional)

La IA es un Cloudflare Worker (código en `voztramite-ia-proxy/worker.js`). Para conectarla, pega su URL en `js/config.js`:

```js
window.VT_CONFIG = { iaEndpoint: "https://voztramite-ia.gegecam29.workers.dev" };  // "" = solo análisis local
// POST { texto, contexto: { paso, tramiteId } }  →  { tramiteId | null, respuesta | null }
```

`assistant.js` toma `VT.assistant.endpoint.endpoint` de ahí. **Qué se envía y cuándo:** solo el texto que la persona dice en el paso «tramite» y sus preguntas libres («Tengo una duda» y «Pregúntame» en `#/tramite`), junto con el paso y el id del trámite. **Nunca** se envía nada en Identidad, Datos ni Confirmación, ni los datos guardados; una pregunta libre que parece traer datos personales (6 o más dígitos o «@») no sale del equipo. La respuesta de IA se muestra como burbuja del asistente con la etiqueta «Respuesta generada con IA · puede equivocarse» y se lee en voz alta si la voz está activa. Si la IA devuelve `tramiteId`, se elige ese trámite.

Sin endpoint, con error o pasados 6 s, la app **siempre cae al análisis local**: el trámite se reconoce por palabras clave y las dudas se responden buscando en el glosario y en los requisitos del trámite («No tengo esa respuesta. Puedes confirmarlo en gob.pe.» si no hay nada). Mientras espera se muestra «Pensando…» (`aria-live`). En `#/ajustes`, «Asistente con IA» indica el estado (conectado / no configurado / sin respuesta) y «Probar IA» lanza una pregunta de prueba. Las pruebas simulan el Worker con `page.route` y bloquean la URL real por defecto.

## Voz del asistente (selector)

En `#/ajustes`, «Voz del asistente» lista las voces `es-*` de `speechSynthesis` (p. ej. «Helena · España», «Google español · Estados Unidos») y se recarga en `onvoiceschanged`. Por defecto se usa una voz femenina (por nombre: Helena, Laura, Sabina, Dalia, Elvira, Paloma, Camila, Paulina, Mónica, Google español; a igual nombre, es-PE > es-419/es-US/es-MX > es-ES) y, si no hay ninguna, la mejor `es-*`. «Escuchar esta voz» la prueba; la elección se guarda en `localStorage` (`voztramite:voz:v1`) y la usa `speak()`. Sin voces o sin `speechSynthesis` se muestra un aviso con ícono y texto. La voz elegida aparece en el resumen de `#/perfil`.

## Requisitos para la voz

El reconocimiento de voz usa la Web Speech API del navegador, así que depende de dónde y con qué se abra la página:

| Requisito | Detalle |
|---|---|
| Navegador | **Chrome o Edge** (escritorio y Android). Firefox no tiene reconocimiento de voz; en Brave suele fallar con el error `network` porque bloquea el servicio de reconocimiento. Safari tiene soporte parcial |
| Origen | `http://localhost` o `https` (por ejemplo GitHub Pages). **No funciona abriendo el archivo como `file://`**: usa `py -m http.server 8123` o la página publicada |
| Permiso del micrófono | Antes del primer reconocimiento se pide el permiso con `getUserMedia` y se suelta el micrófono enseguida. Si se denegó: ícono del candado junto a la dirección → Micrófono → Permitir → «Intentar de nuevo» |
| Internet | Chrome y Edge envían el audio a su servicio de reconocimiento, por lo que necesitan conexión |
| Teclado | Siempre disponible como alternativa; la lectura en voz alta (`speechSynthesis`) funciona sin internet con las voces del sistema |

Mensajes según la causa (ícono + texto + color y salida por teclado):

| Causa | Mensaje |
|---|---|
| Abierto como `file://` | «Abre VozTrámite desde un servidor o desde la página publicada para usar la voz.» |
| Sin `SpeechRecognition` | «Tu navegador no reconoce voz. Usa Chrome o Edge, o escribe con el teclado.» |
| Permiso denegado | Cómo activar el micrófono con el candado y botón «Intentar de nuevo» |
| Error `network` | «El reconocimiento de voz de tu navegador necesita internet o está bloqueado (por ejemplo en Brave). Usa Chrome o Edge, o el teclado.» |
| Sin micrófono | «No encontré un micrófono.» |
| Dos silencios seguidos | «Sigo sin escucharte. Prueba con el teclado.» |

Robustez: el idioma es `es-PE` y, si el navegador responde `language-not-supported`, se reintenta con `es-ES`; un temporizador de ~10 s llama a `stop()` si no llega `onend`. En `#/ajustes`, «Probar voz» permite comprobar el micrófono, escuchar la voz del asistente y ver la compatibilidad del navegador. Dentro del navegador integrado de algunas aplicaciones el micrófono está bloqueado (`not-allowed`): abre la página en Chrome o Edge.

## Pruebas

```bash
py -m http.server 8123 &
py docs/pruebas/acceptance.py   # 44/44: PA-36 perfil, PA-37 historial, PA-38 voz sin soporte, PA-39 antecedentes, PA-40 selector de voz, PA-41 IA simulada y PA-42 correo dictado
```

Genera [`docs/pruebas/resultados.md`](docs/pruebas/resultados.md) con el formato ID prueba · HU · criterio · acción · esperado · obtenido · estado.

## Créditos

Equipo VozTrámite, Grupo 1 · UPC. Tipografía Instrument Sans (Rodrigo Fuenzalida y Jordan Egstad, SIL OFL 1.1). Íconos propios de trazo de 2 px.
