/**
 * VozTrámite — Módulo de voz SIMULADA (js/voice.js)
 *
 * Esta es una maqueta: no hay reconocimiento ni síntesis de voz reales.
 * La API está pensada para poder enchufar la Web Speech API real sin tocar
 * ninguna pantalla — cada punto de reemplazo queda marcado con // TODO.
 *
 * API pública (window.VT.voice):
 *   voice.speak(text, { rate, target }) -> Promise<void>
 *   voice.listen({ timeout, responses, index }) -> Promise<string>
 *   voice.cancel()
 *   voice.on('state', cb)   // cb(estado): 'idle' | 'listening' | 'processing' | 'speaking'
 *   voice.off('state', cb)
 */
(function (global) {
  "use strict";

  var listeners = [];
  var currentState = "idle";
  var timer = null;
  var cancelled = false;
  var silenciado = false;

  function setState(next) {
    currentState = next;
    listeners.forEach(function (cb) {
      try { cb(next); } catch (e) { /* no interrumpir a otros oyentes */ }
    });
  }

  function on(event, cb) {
    if (event === "state") listeners.push(cb);
  }
  function off(event, cb) {
    if (event === "state") {
      var i = listeners.indexOf(cb);
      if (i >= 0) listeners.splice(i, 1);
    }
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function cancel() {
    cancelled = true;
    if (timer) { clearTimeout(timer); timer = null; }
    setState("idle");
    // TODO (voz real): window.speechSynthesis.cancel() y recognition.stop()
  }

  /**
   * Simula la locución del asistente resaltando la frase palabra por palabra
   * en `target` (si se provee) y resolviendo la Promise cuando termina.
   */
  function speak(text, opts) {
    opts = opts || {};
    var rate = opts.rate || 1;
    var target = opts.target || null;
    cancel();
    cancelled = false;

    var words = String(text).trim().split(/\s+/).filter(Boolean);
    if (target) {
      target.innerHTML = words
        .map(function (w, i) { return '<span class="vt-word" data-i="' + i + '">' + escapeHtml(w) + "</span>"; })
        .join(" ");
    }

    // Con el asistente silenciado, el texto aparece igual (equivalente visual
    // del audio) pero sin resaltado progresivo ni estado "speaking".
    if (silenciado) { return Promise.resolve(); }

    setState("speaking");

    // TODO (voz real): reemplazar este temporizador por
    // const u = new SpeechSynthesisUtterance(text); u.rate = rate;
    // u.onboundary = (e) => resaltar palabra en `target`;
    // u.onend = () => resolve(); window.speechSynthesis.speak(u);

    return new Promise(function (resolve) {
      var i = 0;
      var msPerWord = 300 / rate;

      function clearActive() {
        if (!target) return;
        var prev = target.querySelector(".vt-word.is-active");
        if (prev) prev.classList.remove("is-active");
      }

      function step() {
        if (cancelled) { resolve(); return; }
        clearActive();
        if (target) {
          var cur = target.querySelector('[data-i="' + i + '"]');
          if (cur) cur.classList.add("is-active");
        }
        i++;
        if (i >= words.length) {
          timer = setTimeout(function () {
            clearActive();
            setState("idle");
            resolve();
          }, msPerWord);
        } else {
          timer = setTimeout(step, msPerWord);
        }
      }

      if (words.length === 0) { setState("idle"); resolve(); return; }
      step();
    });
  }

  /**
   * Simula la escucha: tras un retardo, resuelve con una respuesta de un
   * guion predefinido (ver js/data.js para los guiones por pantalla).
   */
  function listen(opts) {
    opts = opts || {};
    var timeout = opts.timeout != null ? opts.timeout : 1500;
    var responses = opts.responses && opts.responses.length ? opts.responses : ["No entendí, ¿la repetimos?"];
    var index = opts.index || 0;
    cancel();
    cancelled = false;
    setState("listening");

    // TODO (voz real): reemplazar por
    // const recognition = new webkitSpeechRecognition(); recognition.onresult = ...

    return new Promise(function (resolve) {
      timer = setTimeout(function () {
        if (cancelled) { resolve(""); return; }
        setState("processing");
        timer = setTimeout(function () {
          if (cancelled) { resolve(""); return; }
          setState("idle");
          resolve(responses[index % responses.length]);
        }, 500);
      }, timeout);
    });
  }

  function getState() { return currentState; }
  function setSilenciado(valor) { silenciado = !!valor; }
  function isSilenciado() { return silenciado; }

  global.VT = global.VT || {};
  global.VT.voice = {
    speak: speak,
    listen: listen,
    cancel: cancel,
    on: on,
    off: off,
    getState: getState,
    setSilenciado: setSilenciado,
    isSilenciado: isSilenciado
  };
})(window);
