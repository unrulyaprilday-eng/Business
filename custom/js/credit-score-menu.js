(function () {
  const credit = window.CreditScore;
  if (!credit || credit.session().permissions.configure) return;

  const hidden = "data-credit-score-menu-hidden";
  const style = document.createElement("style");
  style.textContent = "[" + hidden + "] { display: none !important; }";
  document.head.appendChild(style);

  function sync() {
    const link = document.querySelector('#sitemapTreeContainer .sitemapPageLink[nodeUrl="玩家信誉分.html"]');
    const node = link && link.closest(".sitemapNode");
    if (node) node.toggleAttribute(hidden, !credit.canAccessPage());
  }

  // The Axure viewer adds its sitemap asynchronously and can rebuild it.
  new MutationObserver(sync).observe(document.body, { childList: true, subtree: true });
  credit.subscribe(sync);
  window.addEventListener("focus", sync);
  window.addEventListener("pageshow", sync);
  sync();
})();
