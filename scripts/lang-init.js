/**
 * lang-init.js — synchronous, blocking script loaded in <head> BEFORE the
 * deferred main.js module. Sets <html lang> from localStorage / querystring /
 * navigator.language so the correct language renders in the very first paint.
 *
 * CSS rules (pages.css) keyed on html[lang] handle [data-cv-lang] visibility
 * BEFORE body paints — no FOUC, no CLS.
 *
 * Stays tiny (~400 bytes); blocks the parser briefly.
 */
(function () {
  try {
    var stored = localStorage.getItem('lang');
    var lang = stored;
    if (lang !== 'tr' && lang !== 'en') {
      var qs = new URLSearchParams(window.location.search);
      var qsLang = qs.get('lang');
      if (qsLang === 'tr' || qsLang === 'en') {
        lang = qsLang;
      } else {
        var nav = (navigator.language || 'tr').toLowerCase();
        lang = nav.indexOf('tr') === 0 ? 'tr' : 'en';
      }
    }
    document.documentElement.lang = lang;
  } catch (e) {
    /* noop */
  }
})();
