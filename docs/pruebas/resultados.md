# Resultados de las pruebas de aceptación

Ejecutadas contra `http://localhost:8123/pages/index.html`. **44 de 44 casos cumplen.**

| ID prueba | HU | Criterio / escenario evaluado | Acción de prueba | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|---|---|
| PA-01 | HU-008 | CA-01 | Pulsar «Medir mi conexión» | Se muestra el nivel de conexión con recomendación | Conexión buena Una imagen pequeña tardó 10 ms (≈ 28331 kbps). Puedes usar voz sin problema | Cumple |
| PA-02 | HU-009 | CA-01/CA-03 | Simular señal regular y activar modo ligero | Aparece aviso y el modo ligero queda activo | aviso=True, data-ligero=True | Cumple |
| PA-03 | HU-037 | CA-01 | Simular «Sin señal» y escribir una respuesta | Aviso sin conexión, voz deshabilitada y respuesta aceptada | voz deshabilitada=True, aviso=True, respuesta aceptada=True | Cumple |
| PA-04 | HU-011 | CA-01 | Volver la señal tras guardar respuestas | Se informa la sincronización de lo guardado | Volvió la señal: se sincronizaron 1 respuestas guardadas. | Cumple |
| PA-05 | HU-032 | CA-01 | Recargar la página a mitad del trámite | Se retoma el mismo paso con aviso | Retomó en Identidad con aviso (recarga=True; sin hash → #/tramite, aviso=True) | Cumple |
| PA-06 | HU-015 | CA-01 | Decir «quiero sacar mi documento nuevo» | Se traduce a «Renovación de DNI por caducidad» | Traducción mostrada | Cumple |
| PA-07 | HU-030 | CA-01 | Escribir una frase que no corresponde a ningún trámite | Mensaje «No te entendí» con alternativa | Mensaje de error amable mostrado | Cumple |
| PA-08 | HU-031 | CA-01 | Entrar a Requisitos y expandir la lista | 3 requisitos visibles y «Ver los 5» | 3 → 5 requisitos | Cumple |
| PA-09 | HU-023 | CA-01 | Tocar un término subrayado y buscar «captcha» en el glosario | Se explica el término con ejemplo; el glosario filtra | info=True, resultados glosario=1 | Cumple |
| PA-10 | HU-017 | CA-01 | Entrar a Identidad | Explica por qué se pregunta y que no hace falta lector ni claves | Explicación previa mostrada | Cumple |
| PA-11 | HU-018 | CA-01 | Leer «¿Tengo DNI electrónico?» | Se explica qué es y que no se necesita | Explicación del DNIe presente | Cumple |
| PA-12 | HU-013 | CA-01 | Iniciar la verificación | Se muestra «Pregunta 1 de 2» | Indicador de pregunta presente | Cumple |
| PA-13 | HU-012 | CA-01 | Responder correctamente las dos preguntas biográficas | Identidad verificada | Verificación completada | Cumple |
| PA-14 | HU-014 | CA-01/CA-02 | Responder mal dos veces | Intentos restantes y opciones de recuperación | 1 intento restante y luego 3 alternativas | Cumple |
| PA-15 | HU-021 | CA-01 | Completar la verificación | Aviso verde con rol status (visual y auditivo) | Alerta .ok con role=status | Cumple |
| PA-16 | HU-042 | CA-01 | Entrar a Datos | Se muestra una sola pregunta por pantalla | 1 pregunta visible | Cumple |
| PA-17 | HU-039 | CA-01 | Dictar la fecha «quince de mayo de mil novecientos sesenta» | Se entiende como 15 de mayo de 1960 | Avanzó a la siguiente pregunta tras entender la fecha | Cumple |
| PA-18 | HU-010 | CA-02 | Responder con una fecha inválida | Mensaje «No te entendí» con reintento | Error amable con reintento | Cumple |
| PA-19 | HU-028 | CA-01 | Entrar a Confirmación | Cada dato con Confirmar y Corregir; Generar deshabilitado | 3 datos por confirmar, botón deshabilitado=True | Cumple |
| PA-20 | HU-048 | CA-01 | Confirmar los 3 datos con lectura en voz alta | El asistente lee cada dato; se habilita Generar | Generar habilitado tras confirmar los 3 datos | Cumple |
| PA-21 | HU-029 | CA-01 | Corregir un dato desde Confirmación | Vuelve a la pregunta y regresa a Confirmación | Dato corregido y devuelto a Confirmación | Cumple |
| PA-22 | HU-038 | CA-01 | Generar la constancia | Constancia visible en la página con código VT-AAAA-NNNNNN | VT-2026-712762 | Cumple |
| PA-23 | HU-016 | CA-01 | Activar Modo privado antes de la constancia | Los datos personales se ocultan | Fecha y celular ocultos | Cumple |
| PA-24 | HU-034 | CA-01 | Recorrer los pasos | Cada pantalla indica «Después: …» | Indicación del siguiente paso presente | Cumple |
| PA-25 | HU-025 | CA-01 | Observar el panel «Tu avance» | El paso actual está marcado con aria-current | Paso actual marcado | Cumple |
| PA-26 | HU-006 | CA-01 | Pulsar «Repetir» | El asistente lee la pregunta en voz alta (speechSynthesis) | ¿Qué trámite quieres hacer? Dímelo con tus palabras o elige uno de la  | Cumple |
| PA-27 | HU-027 | CA-01 | Entrar a Datos | Cada pregunta trae ayuda y ejemplo para decir | Ejemplo presente | Cumple |
| PA-28 | HU-047 | CA-01 | Activar «Modo simple» | Una sola columna y letra más grande | data-simple=1, columna lateral visible antes=True, después=False | Cumple |
| PA-29 | HU-033 | CA-01 | Revisar los enlaces de la página | Ningún enlace sale a un sitio externo | 22 enlaces, 0 externos | Cumple |
| PA-30 | HU-026 | CA-01 | Revisar los textos del asistente | Frases cortas, sin jerga (promedio < 18 palabras por frase) | 4.7 palabras por frase | Cumple |
| PA-31 | Accesibilidad | WCAG 2.5.5 | Medir botones y enlaces de navegación en móvil, tablet y desktop | Objetivo táctil ≥ 48 px y los ítems de navegación correctos por breakpoint | Todos ≥ 48 px; móvil 5 pestañas (Inicio, Mi trámite, Historial, Glosario, Perfil); tablet/desktop 6 ítems + Perfil; el chip de conexión abre #/conexion | Cumple |
| PA-32 | Accesibilidad | WCAG 1.1.1 / 3.1.1 | Revisar imágenes e idioma | Todas las imágenes con alt; html lang=es | imágenes sin alt=0, lang=es | Cumple |
| PA-33 | Accesibilidad | WCAG 2.1.1 / 2.4.7 | Recorrer con Tab | Foco visible y el enlace «Ir al asistente» es lo primero | primer foco=skip-link | Cumple |
| PA-34a | Responsive | 5.2 | Abrir en móvil 360 px | Sin desplazamiento horizontal | scrollWidth inicio=360, trámite=360 | Cumple |
| PA-34b | Responsive | 5.2 | Abrir en tablet 768 px | Sin desplazamiento horizontal | scrollWidth inicio=768, trámite=768 | Cumple |
| PA-34c | Responsive | 5.2 | Abrir en desktop 1440, 1536 y 1920 px (inicio y trámite) | Sin desplazamiento horizontal, barra lateral visible y ningún botón recortado | 1440, 1536 y 1920 px en inicio y trámite: sin scroll horizontal, barra lateral visible y botones dentro de la ventana | Cumple |
| PA-35 | HU-033 | CA-01 | Cambiar de vista por hash y con la navegación, y volver atrás | Se ve solo la vista pedida (7 vistas, con Historial y Perfil), con aria-current, título y foco en su encabezado | 7 vistas por hash con aria-current, título y foco en su encabezado; clic, atrás, hash desconocido→inicio y skip-link correctos | Cumple |
| PA-36 | HU-016 | CA-01 | En Perfil guardar el nombre «Rosa» y luego borrar mis datos | El saludo de inicio usa el nombre; al borrar se limpia nombre, saludo y localStorage | saludo='Hola, Rosa. ¿Qué trámite quier', persiste al recargar=True, diálogo=True, tras borrar='Hola, ¿qué trámite quiere', claves de perfil/historial=[] | Cumple |
| PA-37 | HU-032 | CA-01 | Completar el flujo hasta la constancia y abrir Historial | Aparece un ítem «Solicitud preparada» con el mismo código VT-… y «Ver resumen» lo muestra | vacío=True, en curso=True, ítem preparado=True (VT-2026-725714), resumen con datos=True, modo privado oculta nacimiento y celular=True | Cumple |
| PA-38 | HU-030 | CA-01 | Abrir sin webkitSpeechRecognition (init script que lo borra) | Mensaje de navegador sin reconocimiento de voz y teclado disponible | mensaje=True, Hablar deshabilitado=True, teclado visible=True, responde por teclado=True, compatibilidad en Ajustes=True | Cumple |
| PA-39 | HU-015 | CA-01 | Flujo completo de «antecedentes» (penal) por teclado: variante, requisitos, identidad, datos, confirmación y constancia | Constancia con código VT-…, costo S/ 40.40, canal como texto y registro en el historial | pregunta policial/penal=True, variante=True, requisitos 3→5, costo=True, término resaltado=True, datos por confirmar=3, constancia=VT-2026-700053, canal como texto=True, pasos=4, enlaces externos=0, en historial=True | Cumple |
| PA-40 | HU-010 | CA-02 | En Ajustes abrir el selector «Voz del asistente», elegir otra voz y recargar | El selector se llena (o avisa si no hay voces), prioriza una voz femenina, guarda la elección y se ve en Perfil | headless real: 3 voces, aviso=''; con voces simuladas: ['Google español · Estados Unidos', 'Helena · España', 'Jorge · México'], por defecto=h (Helena), tras recargar=g, Perfil muestra la voz=True | Cumple |
| PA-41 | HU-015 | CA-01 | Simular el Worker con page.route: «quiero sacar mi RUC» con IA, con error 500 y recorrer Datos | Con IA: etiqueta de IA y se elige RUC; con 500: análisis local; en Identidad/Datos/Confirmación no se llama al endpoint | etiqueta IA=True, eligió RUC=True, solo envía texto y contexto {paso, tramiteId}=True, llamadas en Identidad/Datos/Confirmación=0 (total 1), con 500 sigue local=True | Cumple |
| PA-42 | HU-039 | CA-01 | Decir el correo «rosa punto quispe arroba gmail punto com» en la pregunta de correo | Se interpreta como rosa.quispe@gmail.com y aparece en Confirmación | correo en Confirmación=True, otro ejemplo=rosa_25@hotmail.com | Cumple |
