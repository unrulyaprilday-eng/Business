(function () {
  var editingIndex = null;
  var deletingIndex = null;
  var rows = [
    { sort: 1, name: "TG", icon: "tg", url: "http://tg.com", enabled: true },
    { sort: 1, name: "facebook", icon: "fb", url: "http://facebook.com", enabled: true }
  ];

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderRows() {
    var tbody = document.getElementById("shareRows");
    tbody.innerHTML = rows.map(function (row, index) {
      var switchClass = row.enabled ? "switch" : "switch off";
      return "<tr>"
        + "<td>" + row.sort + "</td>"
        + "<td>" + escapeHtml(row.name) + "</td>"
        + "<td><span class=\"share-icon " + row.icon + "\"></span></td>"
        + "<td>" + escapeHtml(row.url) + "</td>"
        + "<td><button class=\"" + switchClass + "\" data-toggle=\"" + index + "\" type=\"button\" aria-label=\"展示开关\"></button></td>"
        + "<td><button class=\"share-link\" data-edit=\"" + index + "\" type=\"button\">修改</button>"
        + "<button class=\"share-link danger\" data-delete=\"" + index + "\" type=\"button\">删除</button></td>"
        + "</tr>";
    }).join("");
  }

  function openModal(name) {
    document.querySelector("[data-modal='" + name + "']").classList.remove("is-hidden");
  }

  function closeModals() {
    Array.prototype.forEach.call(document.querySelectorAll(".modal-mask"), function (modal) {
      modal.classList.add("is-hidden");
    });
  }

  function setPreview(visible) {
    document.querySelector(".upload-empty").classList.toggle("is-hidden", visible);
    document.getElementById("uploadPreview").classList.toggle("is-hidden", !visible);
  }

  function openAdd() {
    editingIndex = null;
    document.getElementById("formTitle").textContent = "新增";
    document.getElementById("shareName").value = "";
    document.getElementById("shareUrl").value = "";
    document.getElementById("shareSort").value = "1";
    setPreview(false);
    openModal("form");
  }

  function openEdit(index) {
    var row = rows[index];
    editingIndex = index;
    document.getElementById("formTitle").textContent = "编辑分享配置";
    document.getElementById("shareName").value = row.name;
    document.getElementById("shareUrl").value = row.url;
    document.getElementById("shareSort").value = row.sort;
    setPreview(true);
    openModal("form");
  }

  function submitForm() {
    var name = document.getElementById("shareName").value || "TG";
    var url = document.getElementById("shareUrl").value || "http://tg.com";
    var sort = Number(document.getElementById("shareSort").value || 1);
    if (editingIndex === null) {
      rows.push({ sort: sort, name: name, icon: "tg", url: url, enabled: true });
    } else {
      rows[editingIndex].sort = sort;
      rows[editingIndex].name = name;
      rows[editingIndex].url = url;
    }
    renderRows();
    closeModals();
  }

  function openDelete(index) {
    deletingIndex = index;
    document.getElementById("deleteName").textContent = rows[index].name;
    openModal("delete");
  }

  function confirmDelete() {
    if (deletingIndex !== null) {
      rows.splice(deletingIndex, 1);
      deletingIndex = null;
      renderRows();
    }
    closeModals();
  }

  document.addEventListener("click", function (event) {
    var target = event.target;
    if (target.matches("[data-open-add]")) openAdd();
    if (target.matches("[data-close]")) closeModals();
    if (target.matches("[data-edit]")) openEdit(Number(target.getAttribute("data-edit")));
    if (target.matches("[data-delete]")) openDelete(Number(target.getAttribute("data-delete")));
    if (target.matches("[data-toggle]")) {
      var toggleIndex = Number(target.getAttribute("data-toggle"));
      rows[toggleIndex].enabled = !rows[toggleIndex].enabled;
      renderRows();
    }
    if (target.matches("#submitShare")) submitForm();
    if (target.matches("#confirmDelete")) confirmDelete();
    if (target.closest("#uploadControl")) setPreview(true);
    if (target.matches(".remove-icon")) {
      event.stopPropagation();
      setPreview(false);
    }
  });

  renderRows();
})();
