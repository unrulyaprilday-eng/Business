(function () {
  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  function closest(target, selector) {
    return target && target.closest ? target.closest(selector) : null;
  }

  function setModalOpen(id, open) {
    var modal = document.querySelector('[data-cl-modal="' + id + '"]');
    if (!modal) return;
    modal.hidden = !open;
    document.body.classList.toggle("cl-modal-open", open);
  }

  function initTabs(root) {
    var tabs = Array.prototype.slice.call(root.querySelectorAll("[data-cl-tab]"));
    if (!tabs.length) return;

    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        var targetId = tab.getAttribute("data-cl-tab");
        var group = tab.getAttribute("data-cl-tab-group") || "";
        tabs.forEach(function (item) {
          if ((item.getAttribute("data-cl-tab-group") || "") === group) {
            item.classList.toggle("is-active", item === tab);
          }
        });

        Array.prototype.forEach.call(root.querySelectorAll("[data-cl-tab-panel]"), function (panel) {
          if ((panel.getAttribute("data-cl-tab-group") || "") === group) {
            panel.hidden = panel.getAttribute("data-cl-tab-panel") !== targetId;
          }
        });
      });
    });
  }

  function initReset(root) {
    Array.prototype.forEach.call(root.querySelectorAll("[data-cl-reset]"), function (button) {
      button.addEventListener("click", function () {
        var selector = button.getAttribute("data-cl-reset");
        var scope = selector ? document.querySelector(selector) : closest(button, "form");
        if (!scope) return;

        Array.prototype.forEach.call(scope.querySelectorAll("input, select, textarea"), function (field) {
          if (field.type === "checkbox" || field.type === "radio") {
            field.checked = false;
          } else if (field.tagName === "SELECT") {
            field.selectedIndex = 0;
          } else {
            field.value = "";
          }
        });
      });
    });
  }

  function initBatch(root) {
    Array.prototype.forEach.call(root.querySelectorAll("[data-cl-check-all]"), function (master) {
      var target = master.getAttribute("data-cl-check-all");
      var batchBar = document.querySelector(master.getAttribute("data-cl-batch-target") || "");
      var countNode = batchBar ? batchBar.querySelector("[data-cl-selected-count]") : null;

      function update() {
        var boxes = Array.prototype.slice.call(document.querySelectorAll(target));
        var checked = boxes.filter(function (box) { return box.checked; });
        master.checked = boxes.length > 0 && checked.length === boxes.length;
        if (countNode) countNode.textContent = String(checked.length);
        if (batchBar) batchBar.hidden = checked.length === 0;
      }

      master.addEventListener("change", function () {
        Array.prototype.forEach.call(document.querySelectorAll(target), function (box) {
          box.checked = master.checked;
        });
        update();
      });

      Array.prototype.forEach.call(document.querySelectorAll(target), function (box) {
        box.addEventListener("change", update);
      });

      update();
    });
  }

  ready(function () {
    initTabs(document);
    initReset(document);
    initBatch(document);

    document.addEventListener("click", function (event) {
      var opener = closest(event.target, "[data-cl-modal-open]");
      if (opener) {
        setModalOpen(opener.getAttribute("data-cl-modal-open"), true);
        return;
      }

      var closer = closest(event.target, "[data-cl-modal-close]");
      if (closer) {
        setModalOpen(closer.getAttribute("data-cl-modal-close"), false);
        return;
      }

      var layer = closest(event.target, "[data-cl-modal]");
      if (layer && event.target.classList.contains("cl-modal-mask")) {
        setModalOpen(layer.getAttribute("data-cl-modal"), false);
      }
    });
  });
})();
