/* Parity area D. Case study dialog: shows the template for the chosen case (hidden blocks inside #case-dialog).
   main.js still opens the dialog, sets chip, title, lead and cover, and handles focus trap, Esc and focus return. */
(function () {
  'use strict';
  var dlg = document.getElementById('case-dialog');
  if (!dlg) return;
  var panel = dlg.querySelector('.modal__panel');
  document.addEventListener('click', function (e) {
    var btn = e.target.closest ? e.target.closest('[data-case-open]') : null;
    if (!btn) return;
    var key = btn.getAttribute('data-case-open');
    dlg.querySelectorAll('.case-content').forEach(function (c) { c.hidden = c.id !== 'case-content-' + key; });
    if (panel) panel.scrollTop = 0;
  }, true);
  dlg.addEventListener('close', function () { if (panel) panel.scrollTop = 0; });
})();
