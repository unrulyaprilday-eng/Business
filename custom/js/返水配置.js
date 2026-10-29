(function () {
  "use strict";

  function ready(callback) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", callback);
    else callback();
  }

  ready(function () {
    var page = document.querySelector(".rebate-page");
    if (!page) return;
    var tabs = Array.prototype.slice.call(document.querySelectorAll("[data-view-tab]"));
    var panels = Array.prototype.slice.call(document.querySelectorAll("[data-view-panel]"));
    var modal = document.querySelector("[data-rules-modal]");
    var toast = document.querySelector("[data-toast]");
    var actions = document.querySelector("[data-table-actions]");
    var editing = false;
    var savedValues = [];
    var toastTimer;
    var editors = Array.prototype.slice.call(page.querySelectorAll("[data-rule-editor]"));
    var saveRulesButton = page.querySelector("[data-save-rules]");
    if (!modal || !toast || !actions || editors.length !== 2 || !saveRulesButton) return;
    var main = page.querySelector(".rebate-main");
    var rulesStorageKey = "business.rebate.rules.v1";
    var savedRules = {};
    var editorRanges = {};
    var modalOpener = null;
    var previousOverflow = "";
    var previousInert = false;

    // Keep only local text formatting; pasted or stored markup never carries scripts/attributes.
    function cleanRuleHtml(html) {
      var source = document.createElement("template");
      var output = document.createElement("div");
      source.innerHTML = html;
      function appendClean(node, target) {
        if (node.nodeType === 3) { target.appendChild(document.createTextNode(node.textContent)); return; }
        if (node.nodeType !== 1) return;
        var tag = node.tagName.toLowerCase();
        if (/^(script|style|iframe|object|embed|svg|math|img|video|audio|link|meta|input|button|select|textarea)$/.test(tag)) return;
        var allowed = /^(p|br|strong|b|em|i|u|ol|ul|li|div|span)$/.test(tag);
        var holder = allowed ? document.createElement(tag) : document.createDocumentFragment();
        var childTarget = holder;
        if (tag === "span") {
          var formatting = [];
          if (/^(bold|[6-9]00)$/.test(node.style.fontWeight)) formatting.push("strong");
          if (node.style.fontStyle === "italic") formatting.push("em");
          if (node.style.textDecoration.indexOf("underline") !== -1) formatting.push("u");
          formatting.forEach(function (formatTag) {
            var wrapper = document.createElement(formatTag);
            childTarget.appendChild(wrapper);
            childTarget = wrapper;
          });
        }
        Array.prototype.forEach.call(node.childNodes, function (child) { appendClean(child, childTarget); });
        target.appendChild(holder);
      }
      Array.prototype.forEach.call(source.content.childNodes, function (node) { appendClean(node, output); });
      return output.innerHTML;
    }

    function containsText(html) {
      var text = document.createElement("div");
      text.innerHTML = html;
      return text.textContent.replace(/[\s\u200B-\u200D\uFEFF]/g, "").length > 0;
    }

    editors.forEach(function (editor) {
      savedRules[editor.dataset.ruleEditor] = cleanRuleHtml(editor.innerHTML);
    });
    try {
      var storedRules = JSON.parse(window.localStorage.getItem(rulesStorageKey));
      if (storedRules && typeof storedRules === "object") {
        editors.forEach(function (editor) {
          var key = editor.dataset.ruleEditor;
          if (typeof storedRules[key] !== "string") return;
          var cleaned = cleanRuleHtml(storedRules[key]);
          if (containsText(cleaned)) savedRules[key] = cleaned;
        });
      }
    } catch (error) {
      // Defaults remain available when browser storage is unavailable or invalid.
    }

    function clearRuleError(editor) {
      var error = page.querySelector('[data-rule-error="' + editor.dataset.ruleEditor + '"]');
      editor.removeAttribute("aria-invalid");
      error.textContent = "";
      error.hidden = true;
    }

    function resetRuleDrafts() {
      editorRanges = {};
      editors.forEach(function (editor) {
        editor.innerHTML = savedRules[editor.dataset.ruleEditor];
        clearRuleError(editor);
      });
      modal.querySelectorAll("[data-rebate-command][aria-pressed]").forEach(function (button) {
        button.setAttribute("aria-pressed", "false");
      });
    }

    function closeRules() {
      if (modal.hidden) return;
      modal.hidden = true;
      resetRuleDrafts();
      document.body.style.overflow = previousOverflow;
      if (main) main.inert = previousInert;
      if (modalOpener) modalOpener.focus();
    }

    function selectionInside(editor, range) {
      return range && editor.contains(range.startContainer) && editor.contains(range.endContainer);
    }

    function rememberSelection(editor) {
      var selection = window.getSelection();
      if (!selection || !selection.rangeCount) return;
      var range = selection.getRangeAt(0);
      if (selectionInside(editor, range)) editorRanges[editor.dataset.ruleEditor] = range.cloneRange();
    }

    function restoreSelection(editor) {
      editor.focus();
      var range = editorRanges[editor.dataset.ruleEditor];
      if (!selectionInside(editor, range)) {
        range = document.createRange();
        range.selectNodeContents(editor);
        range.collapse(false);
      }
      var selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    }

    function updateFormatButtons(editor) {
      editor.closest(".rebate-rich-editor").querySelectorAll("[aria-pressed]").forEach(function (button) {
        var active = false;
        try { active = document.queryCommandState(button.dataset.rebateCommand); } catch (error) { active = false; }
        button.setAttribute("aria-pressed", active ? "true" : "false");
      });
    }

    function insertRuleHtml(editor, html) {
      restoreSelection(editor);
      var inserted = false;
      try { inserted = document.execCommand("insertHTML", false, html); } catch (error) { inserted = false; }
      if (!inserted) {
        var range = window.getSelection().getRangeAt(0);
        var fragment = range.createContextualFragment(html);
        var last = fragment.lastChild;
        range.deleteContents();
        range.insertNode(fragment);
        if (last) range.setStartAfter(last);
        range.collapse(true);
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(range);
      }
      rememberSelection(editor);
      clearRuleError(editor);
    }

    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        var target = tab.getAttribute("data-view-tab");
        tabs.forEach(function (item) {
          var active = item === tab;
          item.classList.toggle("is-active", active);
          item.setAttribute("aria-selected", active ? "true" : "false");
        });
        panels.forEach(function (panel) { panel.hidden = panel.getAttribute("data-view-panel") !== target; });
      });
    });

    document.querySelectorAll("[data-open-rules]").forEach(function (button) {
      button.addEventListener("click", function () {
        resetRuleDrafts();
        modalOpener = button;
        previousOverflow = document.body.style.overflow;
        previousInert = main ? main.inert : false;
        if (main) main.inert = true;
        document.body.style.overflow = "hidden";
        modal.hidden = false;
        editors[0].focus();
      });
    });
    document.querySelectorAll("[data-close-modal]").forEach(function (button) {
      button.addEventListener("click", closeRules);
    });
    modal.addEventListener("click", function (event) { if (event.target === modal) closeRules(); });
    document.addEventListener("keydown", function (event) {
      if (modal.hidden) return;
      if (event.key === "Escape") { event.preventDefault(); closeRules(); return; }
      if (event.key !== "Tab") return;
      var focusable = modal.querySelectorAll('button:not([disabled]), [contenteditable="true"]');
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });

    editors.forEach(function (editor) {
      var toolbar = editor.closest(".rebate-rich-editor").querySelector(".rebate-editor-toolbar");
      editor.addEventListener("input", function () { clearRuleError(editor); rememberSelection(editor); });
      editor.addEventListener("mouseup", function () { rememberSelection(editor); });
      editor.addEventListener("keyup", function () { rememberSelection(editor); });
      editor.addEventListener("paste", function (event) {
        event.preventDefault();
        if (!event.clipboardData) return;
        rememberSelection(editor);
        var html = event.clipboardData.getData("text/html");
        if (html) html = cleanRuleHtml(html);
        else {
          html = event.clipboardData.getData("text/plain").split(/\r?\n/).map(function (line) {
            var container = document.createElement("div");
            container.textContent = line;
            return container.innerHTML;
          }).join("<br>");
        }
        if (html) insertRuleHtml(editor, html);
      });
      // Avoid importing files or unfiltered dragged HTML into the text editor.
      editor.addEventListener("drop", function (event) { event.preventDefault(); });
      toolbar.querySelectorAll("[data-rebate-command]").forEach(function (button) {
        button.addEventListener("mousedown", function (event) {
          rememberSelection(editor);
          event.preventDefault();
        });
        button.addEventListener("click", function () {
          restoreSelection(editor);
          try {
            if (!document.execCommand(button.dataset.rebateCommand, false, null)) {
              showToast("当前浏览器暂不支持此格式操作，请尝试选中文字后重试", true);
            }
          } catch (error) { showToast("当前浏览器暂不支持此格式操作", true); }
          rememberSelection(editor);
          updateFormatButtons(editor);
        });
      });
    });

    document.addEventListener("selectionchange", function () {
      if (modal.hidden) return;
      var selection = window.getSelection();
      if (!selection || !selection.rangeCount) return;
      editors.forEach(function (editor) {
        if (selectionInside(editor, selection.getRangeAt(0))) { rememberSelection(editor); updateFormatButtons(editor); }
      });
    });

    saveRulesButton.addEventListener("click", function () {
      var draft = {};
      var invalidEditor = null;
      editors.forEach(function (editor) {
        var key = editor.dataset.ruleEditor;
        draft[key] = cleanRuleHtml(editor.innerHTML);
        clearRuleError(editor);
        if (!containsText(draft[key])) {
          var error = page.querySelector('[data-rule-error="' + key + '"]');
          error.textContent = "请填写规则内容";
          error.hidden = false;
          editor.setAttribute("aria-invalid", "true");
          if (!invalidEditor) invalidEditor = editor;
        }
      });
      if (invalidEditor) { invalidEditor.focus(); return; }
      try { window.localStorage.setItem(rulesStorageKey, JSON.stringify(draft)); }
      catch (error) { showToast("本浏览器无法保存规则，请允许本地存储后重试；当前内容仍保留在编辑器中", true); return; }
      savedRules = draft;
      closeRules();
      showToast("两段规则已保存至本浏览器");
    });

    function valueNodes() {
      return Array.prototype.slice.call(document.querySelectorAll("[data-game-rows] [data-value], [data-vip-rows] [data-value]"));
    }
    function showToast(message, isError) {
      toast.textContent = message;
      toast.classList.toggle("is-error", !!isError);
      toast.hidden = false;
      window.clearTimeout(toastTimer);
      toastTimer = window.setTimeout(function () { toast.hidden = true; }, isError ? 6000 : 2600);
    }
    function finishEdit(shouldSave) {
      var nodes = valueNodes();
      nodes.forEach(function (node, index) {
        if (!shouldSave) node.textContent = savedValues[index];
        else node.textContent = node.querySelector("input").value;
        node.querySelectorAll("input").forEach(function (input) { input.remove(); });
        node.hidden = false;
      });
      editing = false;
      actions.hidden = true;
      document.querySelectorAll("[data-edit-table]").forEach(function (button) { button.hidden = false; });
      if (shouldSave) showToast("返水配置已保存");
    }
    document.querySelectorAll("[data-edit-table]").forEach(function (button) {
      button.addEventListener("click", function () {
        if (editing) return;
        editing = true;
        savedValues = valueNodes().map(function (node) { return node.textContent.trim(); });
        valueNodes().forEach(function (node) {
          var value = node.textContent.trim();
          node.textContent = "";
          var input = document.createElement("input");
          input.className = "rebate-edit-input";
          input.type = "number";
          input.min = "0";
          input.step = "0.01";
          input.value = value;
          input.setAttribute("aria-label", "返水配置值");
          node.appendChild(input);
        });
        actions.hidden = false;
        document.querySelectorAll("[data-edit-table]").forEach(function (item) { item.hidden = true; });
      });
    });
    document.querySelector("[data-cancel-edit]").addEventListener("click", function () { finishEdit(false); });
    document.querySelector("[data-save-edit]").addEventListener("click", function () {
      var invalid = valueNodes().some(function (node) { return !node.querySelector("input").value || Number(node.querySelector("input").value) < 0; });
      if (invalid) { showToast("请填写有效的非负比例"); return; }
      finishEdit(true);
    });

    var recordRows = Array.prototype.slice.call(document.querySelectorAll("[data-record-rows] tr"));
    var empty = document.querySelector("[data-record-empty]");
    function filterRecords() {
      var account = document.querySelector('[data-record-filter="account"]').value.trim().toLowerCase();
      var status = document.querySelector('[data-record-filter="status"]').value;
      var date = document.querySelector('[data-record-filter="date"]').value;
      var count = 0;
      recordRows.forEach(function (row) {
        var visible = row.getAttribute("data-account").toLowerCase().indexOf(account) !== -1 &&
          (!status || row.getAttribute("data-status") === status) && (!date || row.getAttribute("data-date") === date);
        row.hidden = !visible;
        if (visible) count += 1;
      });
      empty.hidden = count > 0;
    }
    document.querySelector("[data-search-records]").addEventListener("click", filterRecords);
    document.querySelector("[data-reset-records]").addEventListener("click", function () {
      document.querySelectorAll("[data-record-filter]").forEach(function (input) { input.value = ""; });
      filterRecords();
    });
  });
})();
