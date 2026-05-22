(function () {
  var rows = [
    {
      sort: 1,
      im: "Telegram",
      name: "dzh",
      link: "https://t.me/h_l_j_hui",
      times: ["全天"],
      enabled: true,
    },
    {
      sort: 2,
      im: "WhatsApp",
      name: "11",
      link: "11",
      times: ["09:00-18:00", "18:00-24:00"],
      enabled: true,
    },
    {
      sort: 3,
      im: "Facebook",
      name: "aa",
      link: "",
      times: ["全天"],
      enabled: true,
    },
    {
      sort: 4,
      im: "Line",
      name: "",
      link: "",
      times: [],
      enabled: true,
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
      var timeHtml = row.times.length
        ? "<div class=\"time-tags\">" + row.times.map(function (time) {
          return "<span>" + escapeHtml(time) + "</span>";
        }).join("") + "</div>"
        : "";
      var configHtml = row.name || row.link
        ? "<div class=\"config-item\">"
          + imIcon(row.im, "mini-im")
          + "<span>" + escapeHtml(row.name || "-") + "</span>"
          + (row.link ? "<a class=\"link\" href=\"javascript:void(0)\">" + escapeHtml(row.link) + "</a>" : "")
          + "</div>" + timeHtml
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
    $("#otherName").value = row ? row.name : "";
    $("#otherLink").value = row ? row.link : "";
    $("#otherEnabled").classList.toggle("is-on", !row || row.enabled);
    renderTimeRows(row && row.times.length ? row.times : ["全天"]);
    $("[data-modal=\"other\"]").classList.remove("is-hidden");
  }

  function closeModal() {
    $("[data-modal=\"other\"]").classList.add("is-hidden");
  }

  function renderTimeRows(times) {
    var target = $("#timeRows");
    target.innerHTML = times.map(function (time) {
      return timeLineHtml([time]);
    }).join("");
  }

  function timeLineHtml(times) {
    var options = ["全天", "09:00-18:00", "18:00-24:00", "周末"].map(function (time) {
      return "<option " + (times.indexOf(time) >= 0 ? "selected" : "") + ">" + time + "</option>";
    }).join("");

    return "<div class=\"config-line\">"
      + "<select class=\"time-select\" multiple>" + options + "</select>"
      + "<button class=\"action-link danger\" data-remove-config type=\"button\">删除</button>"
      + "</div>";
  }

  function collectTimeRows() {
    var values = [];
    $all(".config-line").forEach(function (line) {
      $all(".time-select option", line)
        .filter(function (option) { return option.selected; })
        .forEach(function (option) {
          if (values.indexOf(option.value) < 0) {
            values.push(option.value);
          }
        });
    });
    return values.length ? values : ["全天"];
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

    if (event.target.closest("[data-add-time]")) {
      $("#timeRows").insertAdjacentHTML("beforeend", timeLineHtml(["09:00-18:00"]));
      return;
    }

    if (event.target.closest("[data-remove-config]")) {
      event.target.closest(".config-line").remove();
      if (!$(".config-line")) {
        $("#timeRows").insertAdjacentHTML("beforeend", timeLineHtml(["全天"]));
      }
      return;
    }

    if (event.target.closest("[data-save-other]")) {
      var row = {
        sort: Number($("#otherSort").value || 0),
        im: $("#otherIm").value || "Telegram",
        name: $("#otherName").value || "未命名",
        link: $("#otherLink").value || "",
        enabled: $("#otherEnabled").classList.contains("is-on"),
        times: collectTimeRows()
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

  renderOtherRows();
})();
