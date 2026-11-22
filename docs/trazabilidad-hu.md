# Trazabilidad de las 30 historias de usuario core

Cadena: **HU → Arquitectura → User Flow → Wireframe → Mockup → Landing → Prueba de aceptación**.

## Criterio de selección

Se eligieron las HU que responden al problema (completar un trámite por voz, con baja conectividad y lenguaje claro) y se descartaron las accesorias o repetidas:

- **HU-001, 002 y 003** son borradores que reaparecen refinados como **HU-009, 010 y 011**; se implementan las versiones refinadas.
- **HU-022** repite el nombre de HU-014 (recuperación ante errores de autenticación) y se cubre con ella.
- Se dejaron fuera preferencias y refuerzos que no cambian el núcleo (HU-004, 005, 007, 019, 020, 024, 035, 036, 040, 041, 043, 044, 045, 046).

## Las 30 HU implementadas

| HU | Historia | Dónde se prueba | CA | Escenarios |
|---|---|---|---|---|
| HU-008 | Diagnóstico rápido del estado de la conexión antes de iniciar | Vista `#/conexion` · «Medir mi conexión» y chip de conexión (barra lateral o superior) | 3 | 3 |
| HU-009 | Modo de baja conectividad para optimización de recursos | Vista `#/conexion` · Modo ligero; el aviso de señal regular/débil aparece en `#/tramite` | 3 | 2 |
| HU-011 | Recuperación y almacenamiento local ante cortes de señal | Vista `#/tramite` y tarjeta «Continúa donde quedaste» en `#/inicio` · avance guardado | 3 | 2 |
| HU-037 | Tolerancia y retención de datos ante latencia de conexión | Asistente · respuestas en cola cuando no hay señal | 3 | 2 |
| HU-010 | Asistencia por voz para evitar la escritura manual | Asistente · botón Hablar con transcripción; Ajustes · selector «Voz del asistente» (PA-40) | 3 | 2 |
| HU-039 | Sustitución de escritura en pantalla por dictado guiado | Asistente · pregunta de datos dictada; correo dictado con «arroba» y «punto» (PA-42) | 3 | 2 |
| HU-027 | Guía por voz durante el trámite | Asistente · el asistente lee cada pregunta y da un ejemplo | 3 | 2 |
| HU-006 | Lectura de instrucciones en audio para baja alfabetización digital | Asistente · botón Repetir y voz del asistente | 3 | 3 |
| HU-012 | Autenticación por preguntas biográficas | Asistente · paso Identidad | 3 | 2 |
| HU-013 | Autenticación guiada paso a paso | Asistente · «Pregunta 1 de 2» con progreso | 3 | 2 |
| HU-014 | Recuperación ante errores de autenticación | Asistente · respuesta incorrecta: intentos y alternativas | 3 | 2 |
| HU-017 | Guía para la validación de identidad | Asistente · explicación previa de por qué se pregunta | 3 | 2 |
| HU-018 | Explicación del uso del DNI electrónico | Asistente · «¿Tengo DNI electrónico?» | 3 | 2 |
| HU-021 | Confirmación de identidad validada | Asistente · aviso verde visual y auditivo | 3 | 2 |
| HU-015 | Traducción de lenguaje administrativo | Asistente · «Quiero sacar mi DNI nuevo» se traduce al trámite oficial; los 4 trámites se reconocen con frases naturales, con o sin IA (PA-39 y PA-41) | 3 | 2 |
| HU-023 | Explicación de términos técnicos | Vista `#/glosario` y términos subrayados en `#/tramite` | 3 | 2 |
| HU-026 | Información en lenguaje sencillo | Todo el asistente: frases cortas y ejemplos | 3 | 2 |
| HU-016 | Privacidad y constancia del trámite | Modo privado (en la tarjeta de conversación de `#/tramite`) y constancia con código | 3 | 2 |
| HU-025 | Orientación durante el trámite | Panel «Tu avance» de `#/tramite` y encabezado «Paso X de Y» | 3 | 2 |
| HU-028 | Confirmación de información ingresada | Asistente · paso Confirmación con Confirmar/Corregir | 3 | 2 |
| HU-029 | Realización autónoma del trámite | Asistente · flujo completo sin ayuda externa | 3 | 2 |
| HU-030 | Recuperación ante errores | Asistente · «No te entendí» con reintento y teclado; «Tengo una duda» responde con IA o, sin ella, con el glosario (PA-41) | 3 | 2 |
| HU-031 | Consulta previa de requisitos | Asistente · paso Requisitos con lista marcable | 3 | 2 |
| HU-032 | Continuación después de una dificultad | Asistente · «Retomar donde quedaste» | 3 | 2 |
| HU-033 | Flujo continuo sin redirecciones externas | App shell de una sola página: las vistas cambian por hash sin recargar ni redirigir (PA-29 y PA-35) | 3 | 2 |
| HU-034 | Indicación clara del siguiente paso a seguir | Asistente · «Después:» y pantalla Qué sigue | 3 | 2 |
| HU-038 | Visualización integrada de constancias sin descargas complejas | Asistente · constancia visible en la misma página | 3 | 2 |
| HU-042 | Guía atómica de paso único (one-step-at-a-time) | Asistente · una sola pregunta por pantalla | 3 | 2 |
| HU-047 | Modo de interacción accesible para personas no familiarizadas con lo digital | Vista `#/ajustes` · Modo simple (PA-28 comprueba que el panel lateral de `#/tramite` se oculta) | 3 | 2 |
| HU-048 | Validación auditiva y confirmación progresiva de avance seguro | Asistente · lectura en voz alta de cada dato | 3 | 2 |
