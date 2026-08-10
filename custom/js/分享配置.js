(function () {
  var iconRoot = "custom/assets/share-config/";
  var editingKey = null;
  var iconCycleIndex = 0;
  var defaultRows = [
    {
      sort: 1,
      name: "Telegram",
      key: "telegram",
      icon: "telegram.svg",
      enabled: true
    },
    {
      sort: 2,
      name: "WhatsApp",
      key: "whatsapp",
      icon: "whatsapp.svg",
      enabled: true
    },
    {
      sort: 3,
      name: "Facebook",
      key: "facebook",
      icon: "facebook.svg",
      appId: "",
      enabled: true
    },
    {
      sort: 4,
      name: "X / Twitter",
      key: "x_twitter",
      icon: "x.svg",
      enabled: false
    },
    {
      sort: 5,
      name: "Line",
      key: "line",
      icon: "line.svg",
      enabled: true
    }
  ];
  var rows = defaultRows.map(function (row) {
    return Object.assign({}, row);
  });
  var iconOptions = defaultRows.map(function (row) {
    return row.icon;
  });

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function findRow(key) {
    return rows.find(function (row) {
      return row.key === key;
    });
  }

  function sortedRows() {
    return rows.slice().sort(function (a, b) {
      return a.sort - b.sort;
    });
  }

  function renderRows() {
    var tbody = document.getElementById("shareRows");
    if (!tbody) return;

    tbody.innerHTML = sortedRows().map(function (row) {
      var switchClass = row.enabled ? "switch is-on" : "switch";
      return "<tr>"
        + "<td>" + row.sort + "</td>"
        + "<td><strong>" + escapeHtml(row.name) + "</strong></td>"
        + "<td><img class=\"channel-icon\" src=\"" + iconRoot + row.icon + "\" alt=\"" + escapeHtml(row.name) + "\"/></td>"
        + "<td><code>" + escapeHtml(row.key) + "</code></td>"
        + "<td><button class=\"" + switchClass + "\" data-row-toggle=\"" + escapeHtml(row.key) + "\" type=\"button\" aria-label=\"启用状态\"></button></td>"
        + "<td><button class=\"link-btn\" data-edit=\"" + escapeHtml(row.key) + "\" type=\"button\">编辑</button></td>"
        + "</tr>";
    }).join("");
  }

  function getModal() {
    return document.querySelector("[data-modal='edit']");
  }

  function closeModal() {
    var modal = getModal();
    if (modal) modal.hidden = true;
  }

  function openEdit(key) {
    var row = findRow(key);
    var modal = getModal();
    if (!row || !modal) return;

    editingKey = key;
    document.getElementById("modalTitle").textContent = "编辑分享渠道 - " + row.name;
    document.getElementById("channelName").value = row.name;
    document.getElementById("channelKey").value = row.key;
    var facebookAppIdField = document.getElementById("facebookAppIdField");
    var facebookAppId = document.getElementById("facebookAppId");
    var isFacebook = row.key === "facebook";
    if (facebookAppIdField) facebookAppIdField.hidden = !isFacebook;
    if (facebookAppId) facebookAppId.value = row.appId || "";
    document.getElementById("channelIconPreview").src = iconRoot + row.icon;
    document.getElementById("channelSort").value = row.sort;
    document.getElementById("channelEnabled").classList.toggle("is-on", row.enabled);
    iconCycleIndex = iconOptions.indexOf(row.icon);
    modal.hidden = false;
  }

  function saveChannel() {
    var row = findRow(editingKey);
    if (!row) return;

    var sortInput = document.getElementById("channelSort");
    var preview = document.getElementById("channelIconPreview");
    var enabledButton = document.getElementById("channelEnabled");
    var facebookAppId = document.getElementById("facebookAppId");
    row.sort = Math.max(1, Number(sortInput.value || row.sort));
    row.icon = preview.getAttribute("src").replace(iconRoot, "");
    if (row.key === "facebook" && facebookAppId) row.appId = facebookAppId.value.trim();
    row.enabled = enabledButton.classList.contains("is-on");
    renderRows();
    closeModal();
  }

  function replaceIcon() {
    var preview = document.getElementById("channelIconPreview");
    if (!preview) return;
    iconCycleIndex = (iconCycleIndex + 1) % iconOptions.length;
    preview.src = iconRoot + iconOptions[iconCycleIndex];
  }

  function init() {
    renderRows();

    document.addEventListener("click", function (event) {
      var editButton = event.target.closest("[data-edit]");
      if (editButton) {
        openEdit(editButton.getAttribute("data-edit"));
        return;
      }

      if (event.target.closest("[data-close]")) {
        closeModal();
        return;
      }

      if (event.target.closest("#saveChannel")) {
        saveChannel();
        return;
      }

      if (event.target.closest("#channelEnabled")) {
        event.target.closest("#channelEnabled").classList.toggle("is-on");
        return;
      }

      var rowToggle = event.target.closest("[data-row-toggle]");
      if (rowToggle) {
        var row = findRow(rowToggle.getAttribute("data-row-toggle"));
        if (row) {
          row.enabled = !row.enabled;
          renderRows();
        }
        return;
      }

      if (event.target.closest("#replaceIcon")) {
        replaceIcon();
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
