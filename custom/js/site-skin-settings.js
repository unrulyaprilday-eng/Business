(function () {
  "use strict";

  const siteSkin = window.businessSiteSkin;
  const tokens = ["bg", "panel", "ink", "muted", "accent", "on-accent", "art", "art-alt"];
  const themes = {
    cm8: ["101b25", "1c2e3d", "edf7ff", "adc3d6", "6cd6ff", "122b3b", "1e5d88", "55539a"],
    cm7: ["18142a", "2c2342", "fbf4ff", "cec0df", "d5a2ff", "311d47", "644298", "922e71"],
    cm2: ["101f1d", "1b3630", "eefaf5", "abcfc1", "66e1a6", "11352c", "27654e", "346b78"],
    cm1: ["251819", "382527", "fff4eb", "e0bcb6", "ffa174", "411f19", "924533", "79512c"],
    cm3: ["242018", "3a3122", "fff9e8", "dbcea6", "efd07e", "3e3214", "79551c", "8f4b35"],
    cm4: ["eef4fc", "ffffff", "243453", "506785", "326bc2", "ffffff", "3565ab", "6655aa"],
    cm5: ["faf0f6", "ffffff", "49233b", "765369", "a62e67", "ffffff", "9c386e", "7455a3"],
    cm6: ["eaf6ef", "ffffff", "183828", "4a6859", "167653", "ffffff", "2c7551", "326b80"],
    ct: ["150e1b", "2b1b31", "fff1fd", "d5b8cf", "f99dd4", "411935", "8b3a73", "623ca0"],
    ct2: ["101e36", "222f4b", "f3f7ff", "b8c9e9", "a7beff", "232e59", "3556a8", "703da0"],
    ct3: ["221b13", "372c1f", "fff6e7", "e0d0b7", "ffc188", "4a2e17", "93542d", "634c34"],
    ct4: ["f0eefb", "ffffff", "34254e", "655779", "6446ad", "ffffff", "6649ae", "924482"],
    ct5: ["fff5e9", "ffffff", "462b20", "72554a", "aa4534", "ffffff", "a44a31", "886028"],
    bg: ["152120", "233735", "eefbf9", "b8d3cf", "8adecf", "163a35", "286d6a", "387a60"],
    bg2: ["edf6f8", "ffffff", "1d3c49", "4d6876", "196f85", "ffffff", "2b718a", "3a7380"],
    as: ["211926", "352a3e", "fcf5ff", "d5c5de", "ffacb5", "46252c", "904666", "67518b"],
    rs: ["101a2b", "1b2b40", "f1f7ff", "b4c5d9", "62e8c6", "142535", "24537d", "523e81"]
  };

  function init() {
    const page = document.getElementById("siteSkin");
    if (!page || !siteSkin) return;

    const byId = (id) => page.querySelector("#ss-" + id);
    const fields = Object.fromEntries([
      "current", "viewing", "edit", "edit-bar", "cancel", "save", "draft-summary",
      "save-error", "status", "preview-help", "preview-caption", "dialog", "dialog-title", "dialog-image"
    ].map((id) => [id, byId(id)]));
    const options = [...page.querySelectorAll("button[data-skin]")];
    const previews = [...page.querySelectorAll("button[data-preview]")];
    if (Object.values(fields).some((field) => !field) || !options.length || !previews.length) return;

    const available = new Set(options.map((button) => button.dataset.skin).filter(
      (code) => siteSkin.hasSkin(code) && Object.prototype.hasOwnProperty.call(themes, code)
    ));
    const stored = siteSkin.readActive();
    let active = available.has(stored) ? stored : siteSkin.defaultSkin;

    let selected = active;
    let editing = false;

    function render() {
      fields.current.textContent = active;
      fields.viewing.textContent = selected;
      options.forEach((button) => {
        const code = button.dataset.skin;
        const isCurrent = code === active;
        button.setAttribute("aria-pressed", String(code === selected));
        button.toggleAttribute("data-current", isCurrent);
        button.setAttribute("aria-label", code + (isCurrent ? "（当前使用）" : ""));
      });
      tokens.forEach((token, i) => {
        page.style.setProperty("--theme-" + token, "#" + themes[selected][i]);
      });
      const landscape = siteSkin.isLandscape(selected);
      page.classList.toggle("has-landscape-preview", landscape);
      fields["preview-caption"].textContent = landscape ? "横版示意 · 点击图片可放大" : "移动端示意 · 点击图片可放大";
      page.classList.toggle("is-editing", editing);
      fields.edit.hidden = editing;
      fields["edit-bar"].hidden = !editing;
      fields["preview-help"].hidden = editing || selected === active;
      fields.save.disabled = !editing || selected === active;
      fields["draft-summary"].textContent = selected === active
        ? "当前皮肤：" + active
        : "待切换：" + active + " → " + selected;
    }

    function clearMessages() {
      fields.status.textContent = "";
      fields["save-error"].hidden = true;
      fields["save-error"].textContent = "";
    }

    options.forEach((button) => {
      button.addEventListener("click", () => {
        if (!available.has(button.dataset.skin)) return;
        selected = button.dataset.skin;
        clearMessages();
        render();
      });
    });

    fields.edit.addEventListener("click", () => {
      editing = true;
      clearMessages();
      render();
      options.find((button) => button.dataset.skin === selected)?.focus();
    });

    fields.cancel.addEventListener("click", () => {
      editing = false;
      selected = active;
      clearMessages();
      render();
      fields.edit.focus();
    });

    fields.save.addEventListener("click", () => {
      if (!editing || selected === active || !available.has(selected)) return;
      try {
        window.localStorage.setItem(siteSkin.storageKey, selected);
      } catch {
        fields["save-error"].textContent = "无法保存皮肤。请检查浏览器是否允许本地存储后重试。";
        fields["save-error"].hidden = false;
        return;
      }
      active = selected;
      editing = false;
      clearMessages();
      render();
      fields.status.textContent = "已切换当前皮肤为 " + active + "。";
      fields.edit.focus();
    });

    previews.forEach((button) => {
      button.addEventListener("click", () => {
        const screen = button.querySelector(".ss-screen");
        if (!screen || fields.dialog.open) return;
        fields["dialog-title"].textContent = selected + " · " + button.dataset.preview;
        const image = screen.cloneNode(true);
        image.setAttribute("role", "img");
        image.setAttribute("aria-label", selected + " 皮肤的" + button.dataset.preview + "示意图");
        image.removeAttribute("aria-hidden");
        fields["dialog-image"].replaceChildren(image);
        fields.dialog.showModal();
      });
    });

    render();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
