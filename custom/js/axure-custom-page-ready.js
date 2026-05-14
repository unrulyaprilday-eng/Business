(function () {
  function notifyPlayer() {
    try {
      if (window.parent && window.parent !== window && window.parent.$axure && window.parent.$axure.player) {
        window.parent.$axure.player.resizeContent(true);
        window.parent.$axure.player.refreshViewPort();
      }
    } catch (error) {
      // Local file security can block parent access in some browsers.
    }
  }

  if (document.readyState === "complete") {
    notifyPlayer();
  } else {
    window.addEventListener("load", notifyPlayer);
  }

  window.setTimeout(notifyPlayer, 80);
  window.setTimeout(notifyPlayer, 240);
})();
