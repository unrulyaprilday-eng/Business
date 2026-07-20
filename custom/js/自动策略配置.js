(function () {
  function ready(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }
  ready(function () {
    var previewButton = document.getElementById("refreshAudiencePreview");
    var previewValue = document.getElementById("audiencePreviewValue");
    var previewTime = document.getElementById("audiencePreviewTime");
    if (previewButton && previewValue && previewTime) {
      previewButton.addEventListener("click", function () {
        previewValue.textContent = "947";
        previewTime.textContent = "刚刚更新";
      });
    }
    var publish = document.getElementById("submitStrategyReview");
    if (publish) {
      publish.addEventListener("click", function () {
        var modal = document.querySelector('[data-cl-modal="publishConfirmModal"]');
        if (modal) modal.hidden = false;
      });
    }
  });
})();
