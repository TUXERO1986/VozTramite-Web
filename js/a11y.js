/**
 * VozTrámite — Accesibilidad transversal (js/a11y.js)
 *
 * Aplica los ajustes de lectura/movimiento al documento, gestiona las hojas
 * inferiores (bottom sheets) sin trampas de teclado y expone los atajos de
 * teclado globales: barra espaciadora abre el micrófono en desktop, Esc
 * cierra hojas/modales.
 */
(function (global) {
  "use strict";

  var sheetStack = [];

  function aplicarAjustes(state) {
    var root = document.documentElement;
    root.setAttribute("data-text-size", state.textSize || "normal");
    root.setAttribute("data-contrast", state.highContrast ? "alto" : "normal");
    root.setAttribute("data-motion", state.reducedMotionForced ? "reducido" : "normal");
  }

  function esDesktop() {
    return global.innerWidth >= 1024;
  }

  function esCampoDeTexto(el) {
    if (!el) return false;
    var tag = el.tagName ? el.tagName.toLowerCase() : "";
    return tag === "input" || tag === "textarea" || tag === "select" || el.isContentEditable;
  }

  /** Abre una hoja inferior / modal: mueve el foco dentro y recuerda quién la abrió. */
  function openSheet(sheetEl, triggerEl) {
    if (!sheetEl) return;
    sheetEl.hidden = false;
    sheetEl.setAttribute("aria-hidden", "false");
    sheetStack.push({ el: sheetEl, trigger: triggerEl || document.activeElement });
    var focusable = sheetEl.querySelector("[data-autofocus]") || sheetEl.querySelector("button, a, input, [tabindex]");
    if (focusable) focusable.focus();
    document.body.classList.add("vt-sheet-open");
  }

  /** Cierra la hoja inferior activa y devuelve el foco al control que la abrió. */
  function closeSheet(sheetEl) {
    var idx = sheetStack.findIndex(function (s) { return s.el === sheetEl; });
    if (idx === -1) return;
    var entry = sheetStack[idx];
    sheetStack.splice(idx, 1);
    entry.el.hidden = true;
    entry.el.setAttribute("aria-hidden", "true");
    if (sheetStack.length === 0) document.body.classList.remove("vt-sheet-open");
    if (entry.trigger && typeof entry.trigger.focus === "function") entry.trigger.focus();
  }

  function closeTopSheet() {
    if (sheetStack.length === 0) return false;
    closeSheet(sheetStack[sheetStack.length - 1].el);
    return true;
  }

  function initTeclasGlobales(state) {
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        if (closeTopSheet()) e.preventDefault();
        return;
      }
      if (e.code === "Space" || e.key === " ") {
        if (sheetStack.length > 0) return;
        if (esCampoDeTexto(e.target)) return;
        if (!esDesktop()) return;
        var btn = document.querySelector("[data-mic-button]");
        if (btn && !btn.disabled) {
          e.preventDefault();
          btn.click();
        }
      }
    });
  }

  function anunciar(regionEl, mensaje) {
    if (!regionEl) return;
    regionEl.textContent = "";
    window.setTimeout(function () { regionEl.textContent = mensaje; }, 30);
  }

  global.VT = global.VT || {};
  global.VT.a11y = {
    aplicarAjustes: aplicarAjustes,
    openSheet: openSheet,
    closeSheet: closeSheet,
    closeTopSheet: closeTopSheet,
    initTeclasGlobales: initTeclasGlobales,
    anunciar: anunciar,
    esDesktop: esDesktop
  };
})(window);
