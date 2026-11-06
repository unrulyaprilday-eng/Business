(function () {
  'use strict';
  function init() {
    var tabs = Array.prototype.slice.call(document.querySelectorAll('[data-rescue-panel]'));
    if (!tabs.length) { return; }
    var configForm = document.getElementById('reliefFundForm');
    var actions = document.getElementById('rfConfigActions');
    function alignActions() {
      if (!configForm || !actions || !configForm.getClientRects().length) { return; }
      var bounds = configForm.getBoundingClientRect();
      actions.style.setProperty('--rescue-action-left', bounds.left + 'px');
      actions.style.setProperty('--rescue-action-width', bounds.width + 'px');
    }
    alignActions();
    window.addEventListener('resize', alignActions);
    window.addEventListener('scroll', alignActions, { passive: true });
    if (window.ResizeObserver && configForm) { new ResizeObserver(alignActions).observe(configForm); }
    function select(tab) {
      tabs.forEach(function (item) {
        var active = item === tab;
        item.setAttribute('aria-selected', String(active));
        item.tabIndex = active ? 0 : -1;
        var panel = document.getElementById(item.getAttribute('data-rescue-panel'));
        if (panel) { panel.hidden = !active; }
      });
      alignActions();
    }
    tabs.forEach(function (tab, index) {
      tab.addEventListener('click', function () { select(tab); });
      tab.addEventListener('keydown', function (event) {
        var target;
        if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { target = tabs[(index + (event.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length]; }
        if (event.key === 'Home') { target = tabs[0]; }
        if (event.key === 'End') { target = tabs[tabs.length - 1]; }
        if (target) { event.preventDefault(); select(target); target.focus(); }
      });
    });
  }
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); } else { init(); }
})();
