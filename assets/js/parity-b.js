/* Parity area B. Figma overlays have background interaction NONE: a click outside the panel must not close them.
   Esc, the Close button, focus trap and focus return (main.js) are kept. */
(function () {
  'use strict';
  document.querySelectorAll('dialog.modal').forEach(function (dlg) {
    dlg.addEventListener('click', function (e) {
      if (e.target === dlg) e.stopImmediatePropagation();
    }, true);
  });
})();
