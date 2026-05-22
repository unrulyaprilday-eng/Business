(function () {
  var rows = [
    {
      sort: 1,
      im: "Telegram",
      enabled: true,
      configs: [
        { name: "dzh", link: "https://t.me/h_l_j_hui", time: "00:00-21:00" }
      ]
    },
    {
      sort: 2,
      im: "WhatsApp",
      enabled: true,
      configs: [
        { name: "11", link: "11", time: "00:00-21:00" },
        { name: "22", link: "22", time: "00:00-21:00" }
      ]
    },
    {
      sort: 3,
      im: "Facebook",
      enabled: true,
      configs: [
        { name: "aa", link: "", time: "00:00-21:00" }
      ]
    },
    {
      sort: 4,
      im: "Line",
      enabled: true,
      configs: []
    }
  ];

  var editingIndex = null;
  var iconText = {
    Telegram: "➤",
    WhatsApp: "☎",
    Facebook: "f",
    Line: "LINE"
  };

  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function $all(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function imClass(im) {
    return "im-" + String(im || "").toLowerCase();
  }

  function imIcon(im, sizeClass) {
    return "<span class=\"" + sizeClass + " " + imClass(im) + "\">" + escapeHtml(iconText[im] || "?") + "</span>";
  }

  function renderOtherRows() {
    var body = $("#otherServiceBody");
    body.innerHTML = rows.map(function (row, index) {
      var configHtml = row.configs.length
        ? row.configs.map(function (item) {
          return "<div class=\"config-item\">"
            + imIcon(row.im, "mini-im")
            + "<span>" + escapeHtml(item.name) + "</span>"
            + (item.link ? "<a class=\"link\" href=\"javascript:void(0)\">" + escapeHtml(item.link) + "</a>" : "")
            + (item.time ? "<em>" + escapeHtml(item.time) + "</em>" : "")
            + "</div>";
        }).join("")
        : "-";

      return "<tr>"
        + "<td>" + (index + 1) + "</td>"
        + "<td>" + row.sort + "</td>"
        + "<td>" + escapeHtml(row.im) + "</td>"
        + "<td class=\"config-cell\">" + configHtml + "</td>"
        + "<td>" + imIcon(row.im, "table-im") + "</td>"
        + "<td><button class=\"switch " + (row.enabled ? "is-on" : "") + "\" data-toggle-row=\"" + index + "\" type=\"button\"><span></span></button></td>"
        + "<td><button class=\"action-link\" data-edit-row=\"" + index + "\" type=\"button\">编辑</button><button class=\"action-link danger\" data-delete-row=\"" + index + "\" type=\"button\">删除</button></td>"
        + "</tr>";
    }).join("");
  }

  function setActiveTab(name) {
    $all(".tab-btn").forEach(function (btn) {
      btn.classList.toggle("is-active", btn.getAttribute("data-tab") === name);
    });
    $all(".tab-panel").forEach(function (panel) {
      panel.classList.toggle("is-active", panel.getAttribute("data-panel") === name);
    });
  }

  function setOnlineEditing(isEditing) {
    var form = $("[data-readonly-form]");
    form.classList.toggle("is-editing", isEditing);
    $all("input, textarea", form).forEach(function (field) {
      field.disabled = !isEditing;
    });
  }

  function openModal(row, index) {
    editingIndex = typeof index === "number" ? index : null;
    $("#otherModalTitle").textContent = editingIndex === null ? "新增其他客服" : "编辑其他客服";
    $("#otherSort").value = row ? row.sort : 5;
    $("#otherIm").value = row ? row.im : "";
    $("#otherEnabled").classList.toggle("is-on", !row || row.enabled);
    renderConfigRows(row && row.configs.length ? row.configs : [{ name: "", link: "", time: "" }]);
    $("[data-modal=\"other\"]").classList.remove("is-hidden");
  }

  function closeModal() {
    $("[data-modal=\"other\"]").classList.add("is-hidden");
  }

  function renderConfigRows(configs) {
    var target = $("#configRows");
    target.innerHTML = configs.map(function (item) {
      return configLineHtml(item);
    }).join("");
  }

  function configLineHtml(item) {
    return "<div class=\"config-line\">"
      + "<input class=\"config-name\" value=\"" + escapeHtml(item.name) + "\" placeholder=\"请输入昵称\"/>"
      + "<input class=\"config-link\" value=\"" + escapeHtml(item.link) + "\" placeholder=\"请输入链接\"/>"
      + "<input class=\"time-input\" value=\"" + escapeHtml(item.time || "") + "\" placeholder=\"如 00:00 - 23:59\"/>"
      + "<span class=\"line-icon\">" + imIcon($("#otherIm").value || "Telegram", "mini-im") + "</span>"
      + "<button class=\"action-link danger\" data-remove-config type=\"button\">删除</button>"
      + "</div>";
  }

  function collectConfigRows() {
    return $all(".config-line").map(function (line) {
      return {
        name: $(".config-name", line).value || "未命名",
        link: $(".config-link", line).value || "",
        time: $(".time-input", line).value || "00:00-21:00"
      };
    });
  }

  function refreshLineIcons() {
    $all(".line-icon").forEach(function (holder) {
      holder.innerHTML = imIcon($("#otherIm").value || "Telegram", "mini-im");
    });
  }

  document.addEventListener("click", function (event) {
    var tab = event.target.closest(".tab-btn");
    var switchBtn = event.target.closest(".switch");
    var editRow = event.target.closest("[data-edit-row]");
    var deleteRow = event.target.closest("[data-delete-row]");

    if (tab) {
      setActiveTab(tab.getAttribute("data-tab"));
      return;
    }

    if (event.target.closest("[data-edit-online]")) {
      setOnlineEditing(true);
      return;
    }

    if (event.target.closest("[data-cancel-online]") || event.target.closest("[data-save-online]")) {
      setOnlineEditing(false);
      return;
    }

    if (event.target.closest("[data-open-other-modal]")) {
      openModal(null, null);
      return;
    }

    if (event.target.closest("[data-close-modal]")) {
      closeModal();
      return;
    }

    if (event.target.closest("[data-add-config]")) {
      $("#configRows").insertAdjacentHTML("beforeend", configLineHtml({ name: "", link: "", time: "" }));
      return;
    }

    if (event.target.closest("[data-remove-config]")) {
      event.target.closest(".config-line").remove();
      if (!$(".config-line")) {
        $("#configRows").insertAdjacentHTML("beforeend", configLineHtml({ name: "", link: "", time: "" }));
      }
      return;
    }

    if (event.target.closest("[data-save-other]")) {
      var row = {
        sort: Number($("#otherSort").value || 0),
        im: $("#otherIm").value || "Telegram",
        enabled: $("#otherEnabled").classList.contains("is-on"),
        configs: collectConfigRows()
      };
      if (editingIndex === null) {
        rows.push(row);
      } else {
        rows[editingIndex] = row;
      }
      renderOtherRows();
      closeModal();
      return;
    }

    if (editRow) {
      var editIndex = Number(editRow.getAttribute("data-edit-row"));
      openModal(rows[editIndex], editIndex);
      return;
    }

    if (deleteRow) {
      rows.splice(Number(deleteRow.getAttribute("data-delete-row")), 1);
      renderOtherRows();
      return;
    }

    if (switchBtn) {
      switchBtn.classList.toggle("is-on");
      if (switchBtn.hasAttribute("data-toggle-row")) {
        rows[Number(switchBtn.getAttribute("data-toggle-row"))].enabled = switchBtn.classList.contains("is-on");
      }
    }
  });

  $("#otherIm").addEventListener("change", refreshLineIcons);

  renderOtherRows();
})();
