/**
 * VozTrámite · datos del asistente (data.js)
 * Trámites (data-driven), requisitos, preguntas y glosario. Fuentes y fecha de consulta en docs/fuentes-tramites.md.
 * Los costos marcados ref:true son referenciales: se muestran con «referencial · confírmalo en gob.pe».
 * Los datos de verificación de identidad son de ejemplo (demo).
 */
(function (global) {
  "use strict";

  var VT = global.VT = global.VT || {};

  VT.PASOS_BASE = ["Trámite", "Requisitos", "Identidad", "Datos", "Confirmación", "Constancia"];

  /* Persona de ejemplo para la verificación de identidad (datos de ejemplo) */
  VT.PERSONA = { madre: "Rosa", distrito: "Cusco", altMadre: ["rosa"], altDistrito: ["cusco", "cuzco"] };

  VT.PREGUNTAS_ID = [
    { id: "madre", pregunta: "¿Cuál es el primer nombre de tu madre?", ejemplo: "«Rosa»", ok: ["rosa"], pista: "Prueba con «Rosa»." },
    { id: "distrito", pregunta: "¿En qué distrito naciste?", ejemplo: "«Cusco»", ok: ["cusco", "cuzco"], pista: "Prueba con «Cusco»." }
  ];

  VT.REQUISITOS = [
    { t: "Tu DNI actual, aunque esté vencido", g: "DNI" },
    { t: "El recibo de pago por derecho de tramitación", g: "Derecho de tramitación" },
    { t: "Un número de celular para recibir avisos" },
    { t: "Confirmar que tu dirección sigue siendo la misma" },
    { t: "Si cambiaste de domicilio, tenlo a la mano para actualizarlo" }
  ];

  VT.PREGUNTAS_DATOS = [
    { id: "nacimiento", etiqueta: "Fecha de nacimiento", pregunta: "¿Cuál es tu fecha de nacimiento?", ayuda: "Dila como la dirías normalmente.", ejemplo: "«15 de mayo de 1960»", tipo: "fecha", privado: true },
    { id: "agencia", etiqueta: "Agencia para recoger tu DNI", etCons: "Agencia de recojo", etEnt: "Agencia de recojo", pregunta: "¿En qué agencia quieres recoger tu nuevo DNI?", ayuda: "Elige o di el nombre de una ciudad.", ejemplo: "«Cusco»", tipo: "agencia",
      opciones: ["Lima", "Cusco", "Arequipa", "Piura", "Huancayo"] },
    { id: "celular", etiqueta: "Celular para avisos", pregunta: "¿A qué número de celular te avisamos?", ayuda: "Son 9 números y empiezan con 9. Dilos de uno en uno.", ejemplo: "«nueve uno dos tres cuatro cinco seis siete ocho»", tipo: "celular", privado: true }
  ];

  /* Preguntas reutilizables */
  var P_CORREO = { id: "correo", etiqueta: "Correo para avisos", pregunta: "¿Cuál es tu correo electrónico?", ayuda: "Di «arroba» para @ y «punto» para el punto. No hace falta decir espacios.", ejemplo: "«rosa punto quispe arroba gmail punto com»", tipo: "correo", privado: true };
  var P_MODALIDAD = { id: "modalidad", etiqueta: "Cómo lo harás", pregunta: "¿Lo harás en línea o presencial?", ayuda: "Elige una opción o dila con tu voz.", ejemplo: "«En línea»", tipo: "opcion",
    opciones: [{ v: "en-linea", t: "En línea", sin: ["linea", "en linea", "internet", "virtual", "digital", "online", "computadora"] },
               { v: "presencial", t: "Presencial", sin: ["presencial", "en persona", "oficina", "ir", "personalmente"] }] };

  VT.TRAMITES = [
    { id: "renovar-dni", nombre: "Renovar mi DNI", entidad: "RENIEC", icono: "id", activo: true,
      formal: "Renovación de DNI por caducidad", titulo: "Prepara tu renovación de DNI",
      fuertes: ["dni", "documento nacional", "documento de identidad", "carnet de identidad"],
      claves: ["documento", "renovar", "renovacion", "caduc", "venci", "carnet", "carné", "identidad"],
      simple: "«Renovar el DNI» es pedir un DNI nuevo porque el que tienes ya venció.",
      pasos: VT.PASOS_BASE,
      req: VT.REQUISITOS,
      identidad: { modo: "biograficas" },
      datos: VT.PREGUNTAS_DATOS,
      canal: "gob.pe, en la sección de RENIEC",
      que: function () { return [
        "Paga el derecho de tramitación en el Banco de la Nación o con un agente autorizado.",
        "Lleva tu DNI actual a la agencia que elegiste.",
        "Muestra este código para recordar lo que preparaste."]; },
      hablarQue: function (d) { return "Paga el derecho de tramitación, lleva tu DNI a la agencia " + ((d.agencia || {}).valor || "") + " y muestra este código."; } },

    { id: "antecedentes", nombre: "Certificado de antecedentes", entidad: "Policía / Poder Judicial", icono: "doc", activo: true,
      formal: "Certificado de antecedentes", titulo: "Prepara tu certificado de antecedentes",
      fuertes: ["antecedente", "policial", "penal", "judicial", "buena conducta", "pnp"],
      claves: ["certificado", "policia", "condena"],
      simple: "Es un papel que dice si tienes registros policiales o condenas por delitos.",
      pasos: ["Certificado", "Requisitos", "Identidad", "Datos", "Confirmación", "Constancia"],
      identidad: { modo: "biograficas" },
      variantePregunta: "¿Necesitas el certificado policial o el penal?",
      varianteAyuda: "El policial dice si la policía tiene registros a tu nombre. El penal dice si tienes condenas.",
      variantes: [
        { id: "policial", nombre: "Policial", detalle: "Policía Nacional (PNP)", sin: ["policial", "policiales", "policia", "pnp", "buena conducta"],
          formal: "Certificado de antecedentes policiales", entidad: "Policía Nacional (PNP)",
          simple: "Es un documento que dice si la policía tiene registros a tu nombre.",
          req: [
            { t: "Ser peruano y mayor de edad" },
            { t: "Tu DNI vigente", g: "DNI" },
            { t: "Hacer el trámite en persona; un tercero solo con tu autorización" },
            { t: "Pagar en Págalo.pe o en el Banco de la Nación", g: "Págalo.pe" },
            { t: "Recoger el certificado en la CERAP o descargarlo en PDF", g: "CERAP" }],
          costo: { t: "S/ 5.40 en línea · S/ 8.50 presencial", ref: true },
          vigencia: { t: "Vale 90 días desde que se emite", ref: true },
          datos: [
            { id: "uso", etiqueta: "Para qué lo usarás", pregunta: "¿Para qué usarás el certificado?", ayuda: "Elige una opción o dila con tu voz.", ejemplo: "«Para un trabajo»", tipo: "opcion",
              opciones: [{ v: "trabajo", t: "Trabajo", sin: ["trabajo", "empleo", "laboral", "chamba"] }, { v: "tramite", t: "Trámite", sin: ["tramite", "gestion"] },
                         { v: "viaje", t: "Viaje", sin: ["viaje", "viajar", "visa"] }, { v: "otro", t: "Otro", sin: ["otro", "otra cosa"] }] },
            P_MODALIDAD, P_CORREO],
          canal: "gob.pe/309",
          que: function (d) { return [
            ((d.modalidad || {}).valor === "presencial" ? "Ve a una CERAP con tu DNI vigente." : "Entra a certificados.policia.gob.pe desde tu navegador."),
            "Paga en Págalo.pe o en el Banco de la Nación (referencial: S/ 5.40 en línea, S/ 8.50 presencial).",
            "Descarga el PDF o recoge el certificado. Vale 90 días.",
            "Si lo hace un tercero, necesita tu autorización."]; },
          hablarQue: function () { return "Paga en Págalo punto pe o en el Banco de la Nación, y recoge o descarga tu certificado. Vale 90 días."; } },
        { id: "penal", nombre: "Penal", detalle: "Poder Judicial", sin: ["penal", "penales", "judicial", "poder judicial", "condena", "condenas"],
          formal: "Certificado de antecedentes penales", entidad: "Poder Judicial",
          simple: "Es un documento que dice si tienes condenas por delitos.",
          req: [
            { t: "El comprobante de pago de la tasa", g: "tasa" },
            { t: "Tu DNI (o pasaporte o carné de extranjería)", g: "DNI" },
            { t: "Si lo hace otra persona: poder notarial y DNI del apoderado", g: "apoderado" },
            { t: "Hacerlo en línea desde una computadora, o ir a la sede" },
            { t: "Pagar solo en canales oficiales: hay sitios falsos que cobran S/ 120 a 140" }],
          costo: { t: "S/ 40.40", ref: false, fuente: "pj.gob.pe" },
          vigencia: { t: "Vale 90 días desde que se emite", ref: true },
          datos: [
            P_MODALIDAD,
            { id: "quien", etiqueta: "Quién lo pide", pregunta: "¿Lo pides tú o lo hará un apoderado?", ayuda: "Elige una opción o dila con tu voz.", ejemplo: "«Yo mismo»", tipo: "opcion",
              opciones: [{ v: "yo", t: "Yo mismo", sin: ["yo mismo", "yo", "personalmente", "mismo"] },
                         { v: "apoderado", t: "Por apoderado", sin: ["apoderado", "representante", "otra persona", "mi hijo", "mi hija", "un tercero"] }] },
            P_CORREO],
          canal: "gob.pe/326",
          que: function (d) { return [
            ((d.modalidad || {}).valor === "presencial" ? "Ve a la sede del Poder Judicial con tu DNI y tu comprobante." : "Entra a cape.pj.gob.pe desde una computadora."),
            "Paga S/ 40.40 solo en canales oficiales: hay sitios falsos que cobran S/ 120 a 140.",
            ((d.quien || {}).valor === "apoderado" ? "Tu apoderado lleva su DNI y el poder notarial." : "Ten tu DNI a la mano."),
            "El certificado vale 90 días (referencial)."]; },
          hablarQue: function () { return "Paga 40 soles con 40 céntimos solo en canales oficiales y haz el trámite en el Poder Judicial. Vale 90 días."; } }
      ] },

    { id: "ruc", nombre: "Activar o inscribir RUC", entidad: "SUNAT", icono: "building", activo: true,
      formal: "Inscripción o activación de RUC", titulo: "Prepara tu inscripción de RUC",
      fuertes: ["ruc", "sunat", "clave sol"],
      claves: ["negocio", "emprend", "factura", "boleta", "contribuyente", "vender", "tributari"],
      simple: "Es tu número para SUNAT. Se forma con tu DNI: 10, tu DNI y un dígito más.",
      pasos: ["Inscripción", "Requisitos", "Validación", "Datos", "Confirmación", "Constancia"],
      req: [
        { t: "Tu DNI vigente", g: "DNI" },
        { t: "Celular y correo para tus avisos" },
        { t: "Tu Clave SOL, la contraseña de SUNAT", g: "Clave SOL" },
        { t: "Tu actividad económica y la fecha en que empiezas" },
        { t: "Tu domicilio fiscal; si no es el del DNI, un recibo de luz o agua", g: "domicilio fiscal", gt: "Domicilio fiscal" }],
      costo: { t: "Gratuito", ref: true },
      vigencia: null,
      identidad: { modo: "info", titulo: "Cómo valida SUNAT quién eres",
        explica: "SUNAT valida tu DNI al inscribirte. Para enviar el trámite en línea usas tu Clave SOL. VozTrámite no te pide claves.",
        term: "Clave SOL",
        pregunta: "¿Ya tienes Clave SOL?", ejemplo: "«Sí» o «No»",
        si: "Perfecto. La usarás al enviar tu inscripción en SUNAT Virtual.",
        no: "No hay problema. Puedes pedirla en gob.pe/393 o en un Centro de Servicios al Contribuyente. Hoy seguimos preparando tus datos." },
      datos: [
        { id: "actividad", etiqueta: "Actividad", pregunta: "¿Qué actividad harás?", ayuda: "Elige una opción o dila con tu voz.", ejemplo: "«Comercio»", tipo: "opcion",
          opciones: [{ v: "sin-negocio", t: "Sin negocio", sin: ["sin negocio", "ninguna", "no tengo negocio", "solo empleo"] },
                     { v: "comercio", t: "Comercio", sin: ["comercio", "vender", "venta", "tienda", "bodega"] },
                     { v: "servicios", t: "Servicios", sin: ["servicio", "servicios", "taller", "consultoria"] },
                     { v: "otro", t: "Otro", sin: ["otro", "otra"] }] },
        { id: "domicilio", etiqueta: "Domicilio fiscal", pregunta: "¿Tu domicilio fiscal es el de tu DNI?", ayuda: "Elige una opción o dila con tu voz.", ejemplo: "«El de mi DNI»", tipo: "opcion",
          opciones: [{ v: "dni", t: "El de mi DNI", sin: ["el de mi dni", "mi dni", "dni", "igual", "el mismo", "mismo", "si"] },
                     { v: "otro", t: "Otro", sin: ["otro", "no", "distinto", "diferente", "otra direccion", "cambio"] }] },
        { id: "inicio", etiqueta: "Inicio de actividades", etCons: "Inicio de actividades", pregunta: "¿Desde qué fecha empiezas tu actividad?", ayuda: "Dila como la dirías normalmente.", ejemplo: "«1 de marzo de 2026»", tipo: "fecha" },
        P_CORREO],
      canal: "gob.pe/284",
      que: function (d) { return [
        "Ten lista tu Clave SOL. Si no la tienes, pídela en gob.pe/393.",
        "Entra a SUNAT Virtual o a la App Personas, o ve a un Centro de Servicios al Contribuyente.",
        ((d.domicilio || {}).valor === "otro" ? "Lleva un recibo de luz o agua de tu domicilio fiscal." : "Usa el domicilio de tu DNI."),
        "Pregunta qué régimen tributario te conviene.",
        "La inscripción es gratuita (referencial): confírmalo en gob.pe."]; },
      hablarQue: function () { return "Ten lista tu Clave SOL y entra a SUNAT Virtual o a un Centro de Servicios al Contribuyente. Es gratuito, confírmalo en gob.pe."; } },

    { id: "licencia", nombre: "Revalidar licencia de conducir", entidad: "MTC", icono: "id", activo: true,
      formal: "Revalidación de licencia de conducir A-I", titulo: "Prepara tu revalidación de licencia",
      fuertes: ["licencia", "brevete", "conducir", "manejar", "revalid"],
      claves: ["carro", "auto", "papeleta"],
      simple: "Es volver a validar tu brevete con un examen médico y un pago.",
      pasos: ["Revalidación", "Requisitos", "Identidad", "Datos", "Confirmación", "Constancia"],
      identidad: { modo: "biograficas" },
      req: [
        { t: "Examen médico aprobado en un centro autorizado por el MTC" },
        { t: "El pago del derecho de trámite" },
        { t: "No tener multas, papeletas ni sanciones pendientes", g: "papeletas", gt: "Papeleta" },
        { t: "Tu DNI vigente", g: "DNI" },
        { t: "Tu licencia actual, para revalidarla", g: "revalidarla", gt: "Revalidación" }],
      costo: { t: "S/ 6.70 electrónica · S/ 14.70 física (el examen médico lo cobra cada centro)", ref: true },
      vigencia: { t: "El examen médico vale 6 meses. La licencia vale 10 años si no tienes sanciones.", ref: true },
      datos: [
        { id: "categoria", etiqueta: "Categoría", pregunta: "¿Tu licencia es A-I particular o profesional?", ayuda: "Elige una opción o dila con tu voz.", ejemplo: "«Particular»", tipo: "opcion",
          opciones: [{ v: "particular", t: "A-I particular", sin: ["particular", "a-i", "a i", "a1", "normal", "carro", "auto"] },
                     { v: "profesional", t: "Profesional", sin: ["profesional", "taxi", "trabajo", "transporte"] }] },
        { id: "examen", etiqueta: "Examen médico", pregunta: "¿Qué día te hiciste el examen médico?", ayuda: "Dila como la dirías normalmente.", ejemplo: "«10 de noviembre de 2026»", tipo: "fecha" },
        { id: "papeletas", etiqueta: "Papeletas o sanciones", pregunta: "¿Tienes papeletas o sanciones pendientes?", ayuda: "Responde sí o no.", ejemplo: "«No»", tipo: "sino" }],
      canal: "gob.pe/191",
      que: function (d) { return [
        "Haz tu examen médico en un centro autorizado por el MTC. Vale 6 meses (referencial).",
        "Paga el derecho de trámite: S/ 6.70 electrónica o S/ 14.70 física (referencial).",
        ((d.papeletas || {}).valor === "si" ? "Primero regulariza tus papeletas o sanciones: sin eso no se revalida." : "Verifica que no tengas papeletas ni sanciones."),
        "Presenta tu solicitud en licencias.mtc.gob.pe o en la oficina que corresponda."]; },
      hablarQue: function () { return "Haz tu examen médico, paga el derecho de trámite y presenta tu solicitud. Confirma los costos en gob.pe."; } },

    { id: "partida", nombre: "Partida de nacimiento", entidad: "RENIEC", icono: "doc", activo: false,
      fuertes: ["partida", "acta de nacimiento"], claves: ["nacimiento"], simple: "Es el papel que prueba cuándo y dónde naciste." },
    { id: "pension65", nombre: "Pensión 65", entidad: "MIDIS", icono: "landmark", activo: false,
      fuertes: ["pension 65", "pension65"], claves: ["pension", "jubilacion", "adulto mayor"], simple: "Es un apoyo económico del Estado para adultos mayores en pobreza." }
  ];

  VT.GLOSARIO = [
    { t: "Captcha", s: "Una comprobación para saber que eres una persona y no un programa.", e: "Como cuando te piden marcar las fotos que tienen un semáforo." },
    { t: "Constancia de orientación", s: "Un comprobante de que usaste VozTrámite. No es un documento oficial de la entidad.", e: "Es como la nota que te llevas de una cita informativa; el trámite aún no está hecho." },
    { t: "DNI electrónico (DNIe)", s: "Un DNI con un chip que permite comprobar quién eres por internet.", e: "Es como una llave digital que va dentro de tu documento." },
    { t: "DNI", s: "Tu Documento Nacional de Identidad. Con él compruebas quién eres ante el Estado.", e: "Lo muestras cuando abres una cuenta o votas." },
    { t: "Derecho de tramitación", s: "El pago que se hace a la entidad por atender tu trámite.", e: "Como pagar el pasaje antes de subir al bus." },
    { t: "Autenticación", s: "Demostrar que tú eres tú antes de seguir con el trámite.", e: "Como cuando el banco te pide tu clave antes de entregarte dinero." },
    { t: "Trámite", s: "Una gestión que haces ante una oficina del Estado para obtener un papel o un permiso.", e: "Pedir una partida de nacimiento es un trámite." },
    { t: "RUC", s: "Número que identifica tu negocio ante la SUNAT.", e: "Es como el DNI, pero de tu negocio." },
    { t: "Agencia", s: "La oficina donde puedes recoger o presentar tu documento.", e: "La sucursal más cercana a tu casa." },
    { t: "CERAP", s: "La oficina de la policía que emite el certificado de antecedentes.", e: "Es la ventanilla donde recoges tu certificado policial." },
    { t: "Vigencia", s: "El tiempo en que tu papel sirve.", e: "Un certificado con vigencia de 90 días vale hasta tres meses." },
    { t: "Págalo.pe", s: "La página del Estado para pagar trámites.", e: "Como una caja virtual donde pagas con tarjeta." },
    { t: "Apoderado", s: "La persona a la que das permiso para hacer un trámite por ti.", e: "Tu hijo, con un poder notarial, puede recoger tu certificado." },
    { t: "Tasa", s: "El pago que se hace al Estado por un servicio.", e: "Como la tarifa que pagas por sacar un certificado." },
    { t: "Clave SOL", s: "La contraseña de SUNAT para hacer trámites en línea.", e: "Es como la clave de tu banca por internet, pero para SUNAT." },
    { t: "Domicilio fiscal", s: "La dirección que tienes registrada en SUNAT.", e: "Donde SUNAT te envía sus avisos." },
    { t: "Régimen tributario", s: "La forma en que pagas tus impuestos.", e: "Algunos negocios pequeños pagan una cuota fija cada mes." },
    { t: "Revalidación", s: "Renovar tu licencia sin volver a rendir todo.", e: "Como renovar el carné de la biblioteca: solo actualizas lo necesario." },
    { t: "Papeleta", s: "Una multa de tránsito.", e: "Por ejemplo, la que te ponen por estacionar donde no se puede." },
    { t: "SNC", s: "El registro nacional de conductores.", e: "Ahí figuran tu licencia y tus sanciones." }
  ];

})(window);
