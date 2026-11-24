(function () {
  "use strict";

  const defaultSkin = "rs";
  const storageKey = "business.site-skin-settings.active";
  const layouts = new Map([
    ...["ct", "ct2", "ct3", "ct4", "ct5"].map((code) => [code, "landscape"]),
    ...["cm8", "cm7", "cm2", "cm1", "cm3", "cm4", "cm5", "cm6", "bg", "bg2", "as", "rs"]
      .map((code) => [code, "portrait"])
  ]);

  function readActive() {
    try {
      const code = window.localStorage.getItem(storageKey)?.trim().toLowerCase();
      if (layouts.has(code)) return code;
    } catch {
      // Fall back to the default when local storage is unavailable.
    }
    return defaultSkin;
  }

  window.businessSiteSkin = Object.freeze({
    defaultSkin,
    storageKey,
    readActive,
    hasSkin: (code) => layouts.has(code),
    isLandscape: (code) => layouts.get(code) === "landscape"
  });
})();
