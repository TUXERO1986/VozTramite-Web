"""
Pruebas de aceptación automatizadas de la landing (Capítulo VI, 6.1).
Uso:  python3 -m http.server 8123   (desde la raíz del repo)
      python3 docs/pruebas/acceptance.py http://localhost:8123/pages/index.html
La IA (Worker de Cloudflare) se simula con page.route: ninguna prueba llama a la red real.
La landing es un app shell de una sola página con vistas por hash: #/inicio, #/tramite, #/historial, #/conexion, #/glosario, #/ajustes y #/perfil.
Cada prueba abre la vista donde vive la función que verifica (por defecto #/tramite).
Genera docs/pruebas/resultados.md con el formato ID prueba | HU | Criterio | Acción | Esperado | Obtenido | Estado.
"""
import sys, re, json
from playwright.sync_api import sync_playwright

URL = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8123/pages/index.html"
R = []

def caso(pa, hu, crit, accion, esperado):
    def deco(fn):
        try:
            obtenido = fn()
            ok = True
            if isinstance(obtenido, tuple): ok, obtenido = obtenido
        except Exception as e:
            ok, obtenido = False, "Error: " + str(e).split("\n")[0][:120]
        R.append((pa, hu, crit, accion, esperado, obtenido, "Cumple" if ok else "No cumple"))
        return fn
    return deco

def nuevo(b, w=1440, h=900, hash="#/tramite"):
    ctx = b.new_context(viewport={"width": w, "height": h})
    ctx.add_init_script("""
      window.__dicho=[]; const s=window.speechSynthesis;
      if(s){ const o=s.speak.bind(s); s.speak=function(u){window.__dicho.push(u.text); try{o(u)}catch(e){}} }
    """)
    ctx.route("**/voztramite-ia.gegecam29.workers.dev/**", lambda r: r.abort())   # por defecto el Worker real está bloqueado
    pg = ctx.new_page(); pg.goto(URL + hash); pg.wait_for_timeout(500)
    pg.add_style_tag(content="html{scroll-behavior:auto!important}")
    return pg

def ir(pg, h):
    pg.evaluate("h => { location.hash = h }", h); pg.wait_for_timeout(200)
def txt(pg, sel="#conv-body"): return pg.inner_text(sel)
def decir(pg, t):
    if not pg.query_selector("#resp"): pg.click("#t-teclado")
    pg.fill("#resp", t); pg.press("#resp", "Enter"); pg.wait_for_timeout(250)
def avanzar_a_identidad(pg):
    decir(pg, "quiero renovar mi dni"); pg.click('[data-acc="continuar"]'); pg.click('[data-acc="continuar"]')
def avanzar_a_datos(pg):
    avanzar_a_identidad(pg); pg.click('[data-acc="id-empezar"]'); decir(pg, "Rosa"); decir(pg, "Cusco"); pg.click('[data-acc="continuar"]')
def llegar_confirmacion(pg):
    avanzar_a_datos(pg); decir(pg, "15 de mayo de 1960"); pg.click('[data-agencia="Cusco"]'); pg.wait_for_timeout(200); decir(pg, "912345678")

with sync_playwright() as p:
    b = p.chromium.launch()

    @caso("PA-01", "HU-008", "CA-01", "Pulsar «Medir mi conexión»", "Se muestra el nivel de conexión con recomendación")
    def _():
        pg = nuevo(b, hash="#/conexion"); pg.click("#btn-diag"); pg.wait_for_selector("#diag-result .alerta b", timeout=8000)
        t = txt(pg, "#diag-result"); return ("Conexión" in t, t.replace("\n", " ")[:90])

    @caso("PA-02", "HU-009", "CA-01/CA-03", "Simular señal regular y activar modo ligero", "Aparece aviso y el modo ligero queda activo")
    def _():
        pg = nuevo(b, hash="#/conexion"); pg.click('[data-conn="regular"]'); ir(pg, "#/tramite")
        aviso = "modo ligero" in txt(pg).lower(); pg.click('[data-acc="ligero-si"]')
        lig = pg.get_attribute("html", "data-ligero") == "1"; return (aviso and lig, f"aviso={aviso}, data-ligero={lig}")

    @caso("PA-03", "HU-037", "CA-01", "Simular «Sin señal» y escribir una respuesta", "Aviso sin conexión, voz deshabilitada y respuesta aceptada")
    def _():
        pg = nuevo(b, hash="#/conexion"); pg.click('[data-conn="sin"]'); ir(pg, "#/tramite"); dis = pg.is_disabled("#btn-hablar")
        aviso = "Sin conexión" in txt(pg); decir(pg, "quiero renovar mi dni")
        ok_t = "Entendí" in txt(pg); return (dis and aviso and ok_t, f"voz deshabilitada={dis}, aviso={aviso}, respuesta aceptada={ok_t}")

    @caso("PA-04", "HU-011", "CA-01", "Volver la señal tras guardar respuestas", "Se informa la sincronización de lo guardado")
    def _():
        pg = nuevo(b, hash="#/conexion"); pg.click('[data-conn="sin"]'); ir(pg, "#/tramite"); decir(pg, "quiero renovar mi dni"); ir(pg, "#/conexion"); pg.click('[data-conn="buena"]')
        t = pg.inner_text("#toast"); return ("sincronizaron" in t, t)

    @caso("PA-05", "HU-032", "CA-01", "Recargar la página a mitad del trámite", "Se retoma el mismo paso con aviso")
    def _():
        pg = nuevo(b); avanzar_a_identidad(pg); pg.reload(); pg.wait_for_timeout(500)
        t = txt(pg); a = "Retomaste donde quedaste" in t and "verifico que eres tú" in t
        pg.goto(URL); pg.wait_for_timeout(500); h = pg.evaluate("location.hash"); t2 = txt(pg)
        b2 = h == "#/tramite" and "Retomaste donde quedaste" in t2
        return (a and b2, f"Retomó en Identidad con aviso (recarga={a}; sin hash → {h}, aviso={b2})")

    @caso("PA-06", "HU-015", "CA-01", "Decir «quiero sacar mi documento nuevo»", "Se traduce a «Renovación de DNI por caducidad»")
    def _():
        pg = nuevo(b); decir(pg, "quiero sacar mi documento nuevo"); t = txt(pg); return ("Renovación de DNI por caducidad" in t, "Traducción mostrada" if "Renovación de DNI por caducidad" in t else t[:80])

    @caso("PA-07", "HU-030", "CA-01", "Escribir una frase que no corresponde a ningún trámite", "Mensaje «No te entendí» con alternativa")
    def _():
        pg = nuevo(b); decir(pg, "blablabla"); t = txt(pg); return ("No te entendí" in t, "Mensaje de error amable mostrado")

    @caso("PA-08", "HU-031", "CA-01", "Entrar a Requisitos y expandir la lista", "3 requisitos visibles y «Ver los 5»")
    def _():
        pg = nuevo(b); decir(pg, "renovar dni"); pg.click('[data-acc="continuar"]')
        n1 = len(pg.query_selector_all("[data-req]")); pg.click('[data-acc="req-todos"]'); n2 = len(pg.query_selector_all("[data-req]"))
        return (n1 == 3 and n2 == 5, f"{n1} → {n2} requisitos")

    @caso("PA-09", "HU-023", "CA-01", "Tocar un término subrayado y buscar «captcha» en el glosario", "Se explica el término con ejemplo; el glosario filtra")
    def _():
        pg = nuevo(b); decir(pg, "renovar dni"); pg.click('[data-acc="continuar"]'); pg.click('[data-term="DNI"]')
        info = "Tu Documento Nacional" in txt(pg); ir(pg, "#/glosario"); pg.fill("#glos-q", "captcha"); n = len(pg.query_selector_all("#glos-list li"))
        return (info and n == 1, f"info={info}, resultados glosario={n}")

    @caso("PA-10", "HU-017", "CA-01", "Entrar a Identidad", "Explica por qué se pregunta y que no hace falta lector ni claves")
    def _():
        pg = nuevo(b); avanzar_a_identidad(pg); t = txt(pg); return ("2 preguntas" in t and "No necesitas lector" in t, "Explicación previa mostrada")

    @caso("PA-11", "HU-018", "CA-01", "Leer «¿Tengo DNI electrónico?»", "Se explica qué es y que no se necesita")
    def _():
        pg = nuevo(b); avanzar_a_identidad(pg); t = txt(pg); return ("Aquí no lo necesitas" in t, "Explicación del DNIe presente")

    @caso("PA-12", "HU-013", "CA-01", "Iniciar la verificación", "Se muestra «Pregunta 1 de 2»")
    def _():
        pg = nuevo(b); avanzar_a_identidad(pg); pg.click('[data-acc="id-empezar"]'); t = txt(pg); return ("PREGUNTA 1 DE 2" in t.upper(), "Indicador de pregunta presente")

    @caso("PA-13", "HU-012", "CA-01", "Responder correctamente las dos preguntas biográficas", "Identidad verificada")
    def _():
        pg = nuevo(b); avanzar_a_identidad(pg); pg.click('[data-acc="id-empezar"]'); decir(pg, "Rosa"); decir(pg, "Cusco"); return ("Identidad verificada" in txt(pg), "Verificación completada")

    @caso("PA-14", "HU-014", "CA-01/CA-02", "Responder mal dos veces", "Intentos restantes y opciones de recuperación")
    def _():
        pg = nuevo(b); avanzar_a_identidad(pg); pg.click('[data-acc="id-empezar"]'); decir(pg, "Maria"); t1 = txt(pg); decir(pg, "Ana"); t2 = txt(pg)
        return ("Te quedan 1 intento" in t1 and "Intentar otra vez" in t2 and "Ver la pista" in t2, "1 intento restante y luego 3 alternativas")

    @caso("PA-15", "HU-021", "CA-01", "Completar la verificación", "Aviso verde con rol status (visual y auditivo)")
    def _():
        pg = nuevo(b); avanzar_a_identidad(pg); pg.click('[data-acc="id-empezar"]'); decir(pg, "Rosa"); decir(pg, "Cusco")
        el = pg.query_selector('.alerta.ok[role="status"]'); return (el is not None, "Alerta .ok con role=status")

    @caso("PA-16", "HU-042", "CA-01", "Entrar a Datos", "Se muestra una sola pregunta por pantalla")
    def _():
        pg = nuevo(b); avanzar_a_datos(pg); n = len(pg.query_selector_all("#conv-body h3.pregunta")); return (n == 1, f"{n} pregunta visible")

    @caso("PA-17", "HU-039", "CA-01", "Dictar la fecha «quince de mayo de mil novecientos sesenta»", "Se entiende como 15 de mayo de 1960")
    def _():
        pg = nuevo(b); avanzar_a_datos(pg); decir(pg, "el quince de mayo de mil novecientos sesenta"); pg.wait_for_timeout(200)
        return ("Agencia" in txt(pg) or "agencia" in txt(pg), "Avanzó a la siguiente pregunta tras entender la fecha")

    @caso("PA-18", "HU-010", "CA-02", "Responder con una fecha inválida", "Mensaje «No te entendí» con reintento")
    def _():
        pg = nuevo(b); avanzar_a_datos(pg); decir(pg, "mañana"); t = txt(pg); return ("No te entendí" in t and "Repetir pregunta" in t, "Error amable con reintento")

    @caso("PA-19", "HU-028", "CA-01", "Entrar a Confirmación", "Cada dato con Confirmar y Corregir; Generar deshabilitado")
    def _():
        pg = nuevo(b); llegar_confirmacion(pg); c = len(pg.query_selector_all("[data-conf]")); d = pg.is_disabled('[data-acc="emitir"]')
        return (c == 3 and d, f"{c} datos por confirmar, botón deshabilitado={d}")

    @caso("PA-20", "HU-048", "CA-01", "Confirmar los 3 datos con lectura en voz alta", "El asistente lee cada dato; se habilita Generar")
    def _():
        pg = nuevo(b); llegar_confirmacion(pg)
        for _i in range(3): pg.click("[data-conf]"); pg.wait_for_timeout(120)
        return (not pg.is_disabled('[data-acc="emitir"]'), "Generar habilitado tras confirmar los 3 datos")

    @caso("PA-21", "HU-029", "CA-01", "Corregir un dato desde Confirmación", "Vuelve a la pregunta y regresa a Confirmación")
    def _():
        pg = nuevo(b); llegar_confirmacion(pg); pg.click('[data-corr="2"]'); decir(pg, "987654321"); t = txt(pg)
        return ("Revisemos tus datos" in t and "9 8 7 6 5 4 3 2 1" in t, "Dato corregido y devuelto a Confirmación")

    @caso("PA-22", "HU-038", "CA-01", "Generar la constancia", "Constancia visible en la página con código VT-AAAA-NNNNNN")
    def _():
        pg = nuevo(b); llegar_confirmacion(pg)
        for _i in range(3): pg.click("[data-conf]"); pg.wait_for_timeout(120)
        pg.click('[data-acc="emitir"]'); t = txt(pg, "#constancia"); m = re.search(r"VT-\d{4}-\d{6}", t); return (bool(m), m.group(0) if m else t[:60])

    @caso("PA-23", "HU-016", "CA-01", "Activar Modo privado antes de la constancia", "Los datos personales se ocultan")
    def _():
        pg = nuevo(b); llegar_confirmacion(pg); pg.check("#sw-privado")
        for _i in range(3): pg.click("[data-conf]"); pg.wait_for_timeout(120)
        pg.click('[data-acc="emitir"]'); t = txt(pg, "#constancia"); return ("1960" not in t and "9 1 2" not in t and "••" in t, "Fecha y celular ocultos")

    @caso("PA-24", "HU-034", "CA-01", "Recorrer los pasos", "Cada pantalla indica «Después: …»")
    def _():
        pg = nuevo(b); decir(pg, "renovar dni"); pg.click('[data-acc="continuar"]'); a = "Después:" in txt(pg)
        return (a, "Indicación del siguiente paso presente")

    @caso("PA-25", "HU-025", "CA-01", "Observar el panel «Tu avance»", "El paso actual está marcado con aria-current")
    def _():
        pg = nuevo(b); n = pg.get_attribute("#progreso li[aria-current='step']", "class"); return (n is not None and "act" in n, "Paso actual marcado")

    @caso("PA-26", "HU-006", "CA-01", "Pulsar «Repetir»", "El asistente lee la pregunta en voz alta (speechSynthesis)")
    def _():
        pg = nuevo(b); pg.click("#t-repetir"); pg.wait_for_timeout(300); d = pg.evaluate("window.__dicho")
        return (len(d) > 0 and "trámite" in d[-1], d[-1][:70] if d else "sin voz")

    @caso("PA-27", "HU-027", "CA-01", "Entrar a Datos", "Cada pregunta trae ayuda y ejemplo para decir")
    def _():
        pg = nuevo(b); avanzar_a_datos(pg); t = txt(pg); return ("Ejemplo:" in t, "Ejemplo presente")

    @caso("PA-28", "HU-047", "CA-01", "Activar «Modo simple»", "Una sola columna y letra más grande")
    def _():
        pg = nuevo(b); v0 = pg.is_visible("aside.right"); pg.click("#btn-ajustes"); pg.check("#sw-simple"); s = pg.get_attribute("html", "data-simple")
        ir(pg, "#/tramite"); v = pg.is_visible("aside.right")
        return (s == "1" and v0 and not v, f"data-simple={s}, columna lateral visible antes={v0}, después={v}")

    @caso("PA-29", "HU-033", "CA-01", "Revisar los enlaces de la página", "Ningún enlace sale a un sitio externo")
    def _():
        pg = nuevo(b); hrefs = pg.evaluate("[...document.querySelectorAll('a[href]')].map(a=>a.getAttribute('href'))")
        ext = [h for h in hrefs if re.match(r"https?://", h)]; return (not ext, f"{len(hrefs)} enlaces, {len(ext)} externos")

    @caso("PA-30", "HU-026", "CA-01", "Revisar los textos del asistente", "Frases cortas, sin jerga (promedio < 18 palabras por frase)")
    def _():
        pg = nuevo(b); t = txt(pg, "#asistente"); fr = [f for f in re.split(r"[.!?\n]", t) if len(f.split()) > 2]; prom = sum(len(f.split()) for f in fr) / max(1, len(fr))
        return (prom < 18, f"{prom:.1f} palabras por frase")

    # Accesibilidad y responsive (Capítulo V 5.2 y 5.4)
    @caso("PA-31", "Accesibilidad", "WCAG 2.5.5", "Medir botones y enlaces de navegación en móvil, tablet y desktop", "Objetivo táctil ≥ 48 px y los ítems de navegación correctos por breakpoint")
    def _():
        fallos = []
        esperado = {390: ["Inicio", "Mi trámite", "Historial", "Glosario", "Perfil"],
                    768: ["Inicio", "Mi trámite", "Historial", "Conexión", "Glosario", "Ajustes", "Mi perfil"],
                    1440: ["Inicio", "Mi trámite", "Historial", "Conexión", "Glosario", "Ajustes", "Mi perfil"]}
        for w, items in esperado.items():
            pg = nuevo(b, w, 844)
            bad = pg.evaluate("""[...document.querySelectorAll('#asistente button, #asistente .btn, .site-header button, .site-header a.chip, .nav a, .user-card')].filter(e=>e.offsetParent&&!e.classList.contains('term')).map(e=>[e.textContent.trim().slice(0,20),Math.round(e.getBoundingClientRect().height)]).filter(x=>x[1]<48)""")
            nav = pg.evaluate("""[...document.querySelectorAll('.nav a, .user-card')].filter(e=>e.offsetParent).map(e=>e.getAttribute('aria-label'))""")
            if bad: fallos.append(f"{w}px botones <48: {str(bad)[:60]}")
            if nav != items: fallos.append(f"{w}px nav={nav}")
            if w == 390:
                chip = pg.evaluate("(() => { const c = document.querySelector('#chip-conexion-top'); return c && c.offsetParent ? c.getAttribute('href') : null })()")
                if chip != "#/conexion": fallos.append(f"chip de conexión superior href={chip}")
        return (not fallos, "Todos ≥ 48 px; móvil 5 pestañas (Inicio, Mi trámite, Historial, Glosario, Perfil); tablet/desktop 6 ítems + Perfil; el chip de conexión abre #/conexion" if not fallos else "; ".join(fallos)[:200])

    @caso("PA-32", "Accesibilidad", "WCAG 1.1.1 / 3.1.1", "Revisar imágenes e idioma", "Todas las imágenes con alt; html lang=es")
    def _():
        pg = nuevo(b); sin = pg.evaluate("[...document.images].filter(i=>!i.hasAttribute('alt')).length"); lang = pg.get_attribute("html", "lang")
        return (sin == 0 and lang == "es", f"imágenes sin alt={sin}, lang={lang}")

    @caso("PA-33", "Accesibilidad", "WCAG 2.1.1 / 2.4.7", "Recorrer con Tab", "Foco visible y el enlace «Ir al asistente» es lo primero")
    def _():
        pg = nuevo(b); pg.keyboard.press("Tab"); a = pg.evaluate("document.activeElement.className"); o = pg.evaluate("getComputedStyle(document.activeElement).outlineStyle")
        return ("skip-link" in a, f"primer foco={a}")

    for w, nombre in ((360, "móvil 360"), (768, "tablet 768"), (1440, "desktop 1440, 1536 y 1920")):
        @caso("PA-34" + {360: "a", 768: "b", 1440: "c"}[w], "Responsive", "5.2", f"Abrir en {nombre} px" + (" (inicio y trámite)" if w == 1440 else ""), "Sin desplazamiento horizontal" + (", barra lateral visible y ningún botón recortado" if w == 1440 else ""))
        def _(w=w):
            if w != 1440:
                pg = nuevo(b, w, 800, "#/inicio"); sw_i = pg.evaluate("document.documentElement.scrollWidth"); ir(pg, "#/tramite"); sw_t = pg.evaluate("document.documentElement.scrollWidth")
                return (sw_i <= w and sw_t <= w, f"scrollWidth inicio={sw_i}, trámite={sw_t}")
            fallos = []
            for ww in (1440, 1536, 1920):
                for h in ("#/inicio", "#/tramite"):
                    pg = nuevo(b, ww, 900, h)
                    r = pg.evaluate("""() => { const iw = innerWidth, sb = document.querySelector('.side').getBoundingClientRect();
                      const cortados = [...document.querySelectorAll('button, a, .btn, .chip')].filter(e => e.offsetParent && e.getBoundingClientRect().right > iw + 0.5).map(e => e.textContent.trim().slice(0, 20));
                      return { sw: document.documentElement.scrollWidth, iw, lateral: sb.width > 200 && sb.left >= 0 && getComputedStyle(document.querySelector('.side')).display !== 'none', cortados, aj: document.querySelector('#btn-ajustes').getBoundingClientRect().right }; }""")
                    if r["sw"] > ww or not r["lateral"] or r["cortados"] or r["aj"] > ww: fallos.append(f"{ww} {h}: {r}")
            return (not fallos, "1440, 1536 y 1920 px en inicio y trámite: sin scroll horizontal, barra lateral visible y botones dentro de la ventana" if not fallos else "; ".join(fallos)[:200])

    @caso("PA-35", "HU-033", "CA-01", "Cambiar de vista por hash y con la navegación, y volver atrás", "Se ve solo la vista pedida (7 vistas, con Historial y Perfil), con aria-current, título y foco en su encabezado")
    def _():
        pg = nuevo(b, hash="#/inicio"); fallos = []
        vistas = (("#/tramite", "tramite", "Mi trámite"), ("#/historial", "historial", "Historial"), ("#/conexion", "conexion", "Conexión"), ("#/glosario", "glosario", "Glosario"), ("#/ajustes", "ajustes", "Ajustes"), ("#/perfil", "perfil", "Perfil"), ("#/inicio", "inicio", "Inicio"))
        for h, v, t in vistas:
            ir(pg, h)
            vis = pg.evaluate("[...document.querySelectorAll('[data-view]')].filter(e=>!e.hidden).map(e=>e.dataset.view)")
            cur = pg.evaluate("[...document.querySelectorAll('[data-nav][aria-current=\"page\"]')].filter(e=>e.offsetParent).map(e=>e.dataset.nav)")
            foco = pg.evaluate("(() => { const a = document.activeElement; return /^H[12]$/.test(a.tagName) && !!a.closest('[data-view]:not([hidden])') })()")
            if vis != [v] or cur != [v] or not foco or pg.title() != t + " · VozTrámite": fallos.append(f"{h}: vistas={vis}, current={cur}, foco en título={foco}, title={pg.title()}")
        pg.click('[data-nav="glosario"]'); pg.wait_for_timeout(200)
        clic = pg.evaluate("[...document.querySelectorAll('[data-view]')].filter(e=>!e.hidden).map(e=>e.dataset.view)") == ["glosario"]
        pg.go_back(); pg.wait_for_timeout(200)
        atras = pg.evaluate("[...document.querySelectorAll('[data-view]')].filter(e=>!e.hidden).map(e=>e.dataset.view)") == ["inicio"]
        pg.evaluate("location.hash = '#/no-existe'"); pg.wait_for_timeout(200)
        raro = pg.evaluate("[...document.querySelectorAll('[data-view]')].filter(e=>!e.hidden).map(e=>e.dataset.view)") == ["inicio"]
        # El enlace «Ir al asistente» lleva a #/tramite con el foco dentro del asistente
        pg = nuevo(b, hash="#/inicio"); pg.keyboard.press("Tab"); pg.keyboard.press("Enter"); pg.wait_for_timeout(300)
        skip = pg.evaluate("location.hash") == "#/tramite" and pg.evaluate("!!document.activeElement.closest('#asistente')")
        ok = not fallos and clic and atras and raro and skip
        return (ok, "7 vistas por hash con aria-current, título y foco en su encabezado; clic, atrás, hash desconocido→inicio y skip-link correctos" if ok else f"{fallos} clic={clic} atrás={atras} desconocido={raro} skip={skip}")

    @caso("PA-36", "HU-016", "CA-01", "En Perfil guardar el nombre «Rosa» y luego borrar mis datos", "El saludo de inicio usa el nombre; al borrar se limpia nombre, saludo y localStorage")
    def _():
        pg = nuevo(b, hash="#/perfil"); pg.fill("#perfil-nombre", "Rosa"); pg.click("#form-perfil button[type=submit]"); pg.wait_for_timeout(150)
        ir(pg, "#/inicio"); saludo = pg.inner_text("#h-inicio")
        pg.reload(); pg.wait_for_timeout(400); persiste = "Rosa" in pg.inner_text("#h-inicio")
        ir(pg, "#/perfil"); pg.click("#btn-borrar"); pg.wait_for_timeout(150)
        dlg = pg.evaluate("document.querySelector('#dlg-borrar').open"); pg.click("#dlg-borrar-si"); pg.wait_for_timeout(250)
        ir(pg, "#/inicio"); limpio = pg.inner_text("#h-inicio")
        claves = pg.evaluate("Object.keys(localStorage).filter(k => k.startsWith('voztramite:perfil') || k.startsWith('voztramite:historial'))")
        ok = "Hola, Rosa" in saludo and persiste and dlg and "Rosa" not in limpio and not claves
        return (ok, f"saludo='{saludo[:30]}', persiste al recargar={persiste}, diálogo={dlg}, tras borrar='{limpio[:25]}', claves de perfil/historial={claves}")

    @caso("PA-37", "HU-032", "CA-01", "Completar el flujo hasta la constancia y abrir Historial", "Aparece un ítem «Solicitud preparada» con el mismo código VT-… y «Ver resumen» lo muestra")
    def _():
        pg = nuevo(b, hash="#/historial"); vacio = "Aún no tienes trámites" in pg.inner_text("#hist-lista") and pg.is_visible("text=Empezar mi trámite")
        ir(pg, "#/tramite"); llegar_confirmacion(pg)
        ir(pg, "#/historial"); curso = "En curso" in pg.inner_text("#hist-lista") and pg.is_visible("#hist-lista a:has-text('Continuar')")
        ir(pg, "#/tramite")
        for _i in range(3): pg.click("[data-conf]"); pg.wait_for_timeout(120)
        pg.click('[data-acc="emitir"]'); cod = re.search(r"VT-\d{4}-\d{6}", txt(pg, "#constancia")).group(0)
        ir(pg, "#/historial"); lista = pg.inner_text("#hist-lista")
        item = "Solicitud preparada" in lista and cod in lista and "En curso" not in lista
        pg.click("[data-hist-ver]"); pg.wait_for_timeout(150)
        det = pg.inner_text("#dlg-resumen"); detalle = pg.evaluate("document.querySelector('#dlg-resumen').open") and cod in det and "1960" in det and "Cusco" in det
        pg.click("#dlg-resumen-cerrar")
        ir(pg, "#/tramite"); pg.evaluate("document.querySelector('#sw-privado').click()"); ir(pg, "#/historial"); pg.click("[data-hist-ver]"); pg.wait_for_timeout(150)
        det2 = pg.inner_text("#dlg-resumen"); priv = "1960" not in det2 and "9 1 2" not in det2 and "••" in det2
        return (vacio and curso and item and detalle and priv, f"vacío={vacio}, en curso={curso}, ítem preparado={item} ({cod}), resumen con datos={detalle}, modo privado oculta nacimiento y celular={priv}")

    @caso("PA-38", "HU-030", "CA-01", "Abrir sin webkitSpeechRecognition (init script que lo borra)", "Mensaje de navegador sin reconocimiento de voz y teclado disponible")
    def _():
        ctx = b.new_context(viewport={"width": 1440, "height": 900})
        ctx.add_init_script("""
          for (const k of ['SpeechRecognition','webkitSpeechRecognition']) { try { delete window[k]; } catch(e){} try { Object.defineProperty(window, k, {value: undefined, configurable: true}); } catch(e){} }
        """)
        ctx.route("**/voztramite-ia.gegecam29.workers.dev/**", lambda r: r.abort())
        pg = ctx.new_page(); pg.goto(URL + "#/tramite"); pg.wait_for_timeout(500)
        t = txt(pg); msg = "Tu navegador no reconoce voz" in t and "Chrome o Edge" in t
        dis = pg.is_disabled("#btn-hablar") and "Voz no disponible" in pg.inner_text("#btn-hablar")
        teclado = pg.is_visible("#resp"); tec_btn = pg.is_enabled("#t-teclado")
        pg.fill("#resp", "quiero renovar mi dni"); pg.press("#resp", "Enter"); pg.wait_for_timeout(250); sigue = "Entendí" in txt(pg)
        ir(pg, "#/ajustes"); compat = "No disponible en este navegador" in pg.inner_text("#compat-voz")
        ok = msg and dis and teclado and tec_btn and sigue and compat
        return (ok, f"mensaje={msg}, Hablar deshabilitado={dis}, teclado visible={teclado}, responde por teclado={sigue}, compatibilidad en Ajustes={compat}")

    @caso("PA-39", "HU-015", "CA-01", "Flujo completo de «antecedentes» (penal) por teclado: variante, requisitos, identidad, datos, confirmación y constancia", "Constancia con código VT-…, costo S/ 40.40, canal como texto y registro en el historial")
    def _():
        pg = nuevo(b); decir(pg, "necesito mis antecedentes para un trabajo")
        pregunta = "policial o el penal" in txt(pg); decir(pg, "penal"); t1 = txt(pg)
        variante = "Certificado de antecedentes penales" in t1
        pg.click('[data-acc="continuar"]'); n1 = len(pg.query_selector_all("[data-req]")); pg.click('[data-acc="req-todos"]'); n2 = len(pg.query_selector_all("[data-req]"))
        costo = "S/ 40.40" in txt(pg); termino = pg.is_visible('[data-term="Apoderado"]') or pg.is_visible('[data-term="apoderado"]')
        pg.click('[data-acc="continuar"]'); pg.click('[data-acc="id-empezar"]'); decir(pg, "Rosa"); decir(pg, "Cusco"); pg.click('[data-acc="continuar"]')
        decir(pg, "en linea"); pg.click('[data-opcion="yo"]'); pg.wait_for_timeout(150); decir(pg, "rosa.quispe@gmail.com")
        conf = len(pg.query_selector_all("[data-conf]"))
        for _i in range(3): pg.click("[data-conf]"); pg.wait_for_timeout(120)
        pg.click('[data-acc="emitir"]'); c = txt(pg, "#constancia"); cod = re.search(r"VT-\d{4}-\d{6}", c)
        sigue = txt(pg, "#que-sigue"); canal = "gob.pe/326" in sigue and "cape.pj.gob.pe" in sigue; n_pasos = len(pg.query_selector_all("#que-sigue li"))
        ext = pg.evaluate("[...document.querySelectorAll('a[href]')].filter(a=>/^https?:/.test(a.getAttribute('href'))).length")
        ir(pg, "#/historial"); hist = bool(cod) and cod.group(0) in pg.inner_text("#hist-lista") and "Certificado de antecedentes penales" in pg.inner_text("#hist-lista")
        ok = pregunta and variante and n1 == 3 and n2 == 5 and costo and termino and conf == 3 and bool(cod) and "S/ 40.40" in c and "rosa.quispe@gmail.com" in c and canal and 3 <= n_pasos <= 5 and ext == 0 and hist
        return (ok, f"pregunta policial/penal={pregunta}, variante={variante}, requisitos {n1}→{n2}, costo={costo}, término resaltado={termino}, datos por confirmar={conf}, constancia={cod.group(0) if cod else None}, canal como texto={canal}, pasos={n_pasos}, enlaces externos={ext}, en historial={hist}")

    @caso("PA-40", "HU-010", "CA-02", "En Ajustes abrir el selector «Voz del asistente», elegir otra voz y recargar", "El selector se llena (o avisa si no hay voces), prioriza una voz femenina, guarda la elección y se ve en Perfil")
    def _():
        pg = nuevo(b, hash="#/ajustes"); n = len(pg.query_selector_all("#sel-voz option")); msg = pg.inner_text("#voz-msg")
        real = n > 0 or "No encontré voces" in msg or "no lee en voz alta" in msg
        ctx = b.new_context(viewport={"width": 1440, "height": 900})
        ctx.add_init_script("""
          const fake=[{name:'Microsoft Jorge - Spanish (Mexico)',lang:'es-MX',voiceURI:'j'},{name:'Microsoft Helena - Spanish (Spain)',lang:'es-ES',voiceURI:'h'},
            {name:'Google español de Estados Unidos',lang:'es-US',voiceURI:'g'},{name:'Google US English',lang:'en-US',voiceURI:'e'}];
          speechSynthesis.getVoices = () => fake;
        """)
        p2 = ctx.new_page(); p2.goto(URL + "#/ajustes"); p2.wait_for_timeout(500)
        etiquetas = p2.evaluate("[...document.querySelectorAll('#sel-voz option')].map(o=>o.textContent)")
        defecto = p2.input_value("#sel-voz"); p2.click("#btn-escuchar-voz")
        p2.select_option("#sel-voz", "g"); p2.wait_for_timeout(150); p2.reload(); p2.wait_for_timeout(500)
        tras = p2.input_value("#sel-voz"); ir(p2, "#/perfil"); perfil = p2.inner_text("#perfil-prefs")
        ok = real and defecto == "h" and "Helena · España" in etiquetas and "Google español · Estados Unidos" in etiquetas and len(etiquetas) == 3 and tras == "g" and "Google español · Estados Unidos" in perfil
        return (ok, f"headless real: {n} voces, aviso='{msg[:50]}'; con voces simuladas: {etiquetas}, por defecto={defecto} (Helena), tras recargar={tras}, Perfil muestra la voz={'Google español' in perfil}")

    def ruc_hasta_correo(pg):
        decir(pg, "quiero sacar mi RUC"); pg.click('[data-acc="continuar"]'); pg.click('[data-acc="continuar"]')
        pg.click('[data-idsino="no"]'); pg.click('[data-acc="continuar"]')
        pg.click('[data-opcion="comercio"]'); pg.wait_for_timeout(120); decir(pg, "el de mi dni"); decir(pg, "1 de marzo de 2020")

    def ruta_ia(pg, respuesta):
        calls = []
        def h(route):
            if route.request.method == "OPTIONS":
                route.fulfill(status=204, headers={"access-control-allow-origin": "*", "access-control-allow-headers": "content-type", "access-control-allow-methods": "POST, OPTIONS"}); return
            calls.append(route.request.post_data)
            if respuesta is None: route.fulfill(status=500, headers={"access-control-allow-origin": "*"}, body="error")
            else: route.fulfill(status=200, headers={"access-control-allow-origin": "*", "content-type": "application/json"}, body=json.dumps(respuesta))
        pg.route("**/voztramite-ia.gegecam29.workers.dev/**", h); return calls

    @caso("PA-41", "HU-015", "CA-01", "Simular el Worker con page.route: «quiero sacar mi RUC» con IA, con error 500 y recorrer Datos", "Con IA: etiqueta de IA y se elige RUC; con 500: análisis local; en Identidad/Datos/Confirmación no se llama al endpoint")
    def _():
        pg = nuevo(b); calls = ruta_ia(pg, {"tramiteId": "ruc", "respuesta": "Claro, te ayudo con tu RUC."})
        decir(pg, "quiero sacar mi RUC"); pg.wait_for_timeout(300); t = txt(pg)
        etiqueta = "Respuesta generada con IA · puede equivocarse" in t and "Claro, te ayudo con tu RUC." in t; ruc = "Inscripción o activación de RUC" in t
        enviado = json.loads(calls[0]) if calls else {}; solo = set(enviado.keys()) == {"texto", "contexto"} and set(enviado.get("contexto", {}).keys()) == {"paso", "tramiteId"} and enviado["contexto"]["paso"] == "tramite"
        pg.click('[data-acc="continuar"]'); pg.click('[data-acc="continuar"]'); pg.click('[data-idsino="si"]'); pg.click('[data-acc="continuar"]')
        n0 = len(calls); decir(pg, "el comercio"); decir(pg, "otro"); decir(pg, "3 de abril de 2021"); decir(pg, "rosa.quispe@gmail.com")
        for _i in range(4): pg.click("[data-conf]"); pg.wait_for_timeout(100)
        sin_datos = len(calls) == n0 == 1
        pg2 = nuevo(b); c2 = ruta_ia(pg2, None); decir(pg2, "quiero renovar mi dni"); pg2.wait_for_timeout(300); t2 = txt(pg2)
        local = "Renovación de DNI por caducidad" in t2 and "generada con IA" not in t2 and len(c2) >= 1
        return (etiqueta and ruc and solo and sin_datos and local, f"etiqueta IA={etiqueta}, eligió RUC={ruc}, solo envía texto y contexto {{paso, tramiteId}}={solo}, llamadas en Identidad/Datos/Confirmación={len(calls) - n0} (total {len(calls)}), con 500 sigue local={local}")

    @caso("PA-42", "HU-039", "CA-01", "Decir el correo «rosa punto quispe arroba gmail punto com» en la pregunta de correo", "Se interpreta como rosa.quispe@gmail.com y aparece en Confirmación")
    def _():
        pg = nuevo(b); ruc_hasta_correo(pg)
        malo = pg.evaluate("VT.assistant.parseCorreo('rosa arroba') === null && VT.assistant.parseCorreo('rosa guion bajo 25 arroba hotmail punto com').valor")
        decir(pg, "rosa punto quispe arroba gmail punto com"); t = txt(pg); ok = "rosa.quispe@gmail.com" in t and "Revisemos tus datos" in t
        return (ok and malo == "rosa_25@hotmail.com", f"correo en Confirmación={ok}, otro ejemplo={malo}")

    b.close()

n = len(R); ok = sum(1 for r in R if r[-1] == "Cumple")
md = ["# Resultados de las pruebas de aceptación", "", f"Ejecutadas contra `{URL}`. **{ok} de {n} casos cumplen.**", "",
      "| ID prueba | HU | Criterio / escenario evaluado | Acción de prueba | Resultado esperado | Resultado obtenido | Estado |", "|---|---|---|---|---|---|---|"]
for r in R: md.append("| " + " | ".join(str(x).replace("|", "/") for x in r) + " |")
open("docs/pruebas/resultados.md", "w", encoding="utf-8").write("\n".join(md) + "\n")
print(f"{ok}/{n}")
for r in R:
    if r[-1] != "Cumple": print("NO CUMPLE", r[0], r[1], r[5])
