(function () {
  var gameTypes = [
    { sort: 0, name: "热门", activeIcon: "🔥", inactiveIcon: "◖", enabled: true, updatedAt: "2026-02-26 15:04:55" },
    { sort: 1, name: "区块链", activeIcon: "💠", inactiveIcon: "❖", enabled: true, updatedAt: "2026-02-26 15:05:17" },
    { sort: 2, name: "彩票", activeIcon: "🌈", inactiveIcon: "✤", enabled: false, updatedAt: "2026-02-26 15:05:48" },
    { sort: 3, name: "电子", activeIcon: "🎰", inactiveIcon: "▥", enabled: true, updatedAt: "2026-02-26 15:06:18" },
    { sort: 4, name: "棋牌", activeIcon: "🃏", inactiveIcon: "◒", enabled: false, updatedAt: "2026-02-26 15:19:48" },
    { sort: 5, name: "捕鱼", activeIcon: "🐬", inactiveIcon: "⌁", enabled: false, updatedAt: "2026-02-26 15:06:45" },
    { sort: 6, name: "视讯", activeIcon: "👩🏻‍💼", inactiveIcon: "◔", enabled: true, updatedAt: "2026-02-26 15:07:02" },
    { sort: 7, name: "体育", activeIcon: "⚽", inactiveIcon: "⚽", enabled: false, updatedAt: "2026-02-26 15:07:46" },
    { sort: 8, name: "收藏游戏", activeIcon: "🕘", inactiveIcon: "↺", enabled: true, updatedAt: "2026-02-26 15:07:17" },
    { sort: 9, name: "最近游戏", activeIcon: "⭐", inactiveIcon: "★", enabled: true, updatedAt: "2026-02-26 15:07:36" }
  ];

  var tableBody = document.getElementById("typeTableBody");
  var modal = document.getElementById("editModal");
  var editName = document.getElementById("editName");
  var editActiveIcon = document.getElementById("editActiveIcon");
  var editInactiveIcon = document.getElementById("editInactiveIcon");
  var editSort = document.getElementById("editSort");
  var editEnabled = document.getElementById("editEnabled");
  var saveEdit = document.getElementById("saveEdit");
  var editingIndex = -1;

  function renderTable() {
    tableBody.innerHTML = gameTypes.map(function (item, index) {
      return [
        "<tr>",
        "<td>" + item.sort + "</td>",
        "<td>" + item.name + "</td>",
        "<td><span class=\"game-icon\">" + item.activeIcon + "</span></td>",
        "<td><span class=\"game-icon muted\">" + item.inactiveIcon + "</span></td>",
        "<td><span class=\"switch" + (item.enabled ? " is-on" : "") + "\" aria-label=\"" + (item.enabled ? "已启用" : "未启用") + "\"></span></td>",
        "<td>" + item.updatedAt + "</td>",
        "<td><button class=\"edit-link\" type=\"button\" data-index=\"" + index + "\">编辑</button></td>",
        "</tr>"
      ].join("");
    }).join("");
  }

  function openModal(index) {
    var item = gameTypes[index];
    editingIndex = index;
    editName.value = item.name;
    editActiveIcon.textContent = item.activeIcon;
    editInactiveIcon.textContent = item.inactiveIcon;
    editSort.value = item.sort;
    editEnabled.checked = item.enabled;
    modal.hidden = false;
  }

  function closeModal() {
    modal.hidden = true;
    editingIndex = -1;
  }

  tableBody.addEventListener("click", function (event) {
    var target = event.target;
    if (target.classList.contains("edit-link")) {
      openModal(Number(target.getAttribute("data-index")));
    }
  });

  modal.addEventListener("click", function (event) {
    if (event.target.hasAttribute("data-close-modal")) {
      closeModal();
    }
  });

  document.querySelector(".number-field").addEventListener("click", function (event) {
    if (!event.target.hasAttribute("data-step")) {
      return;
    }
    var step = Number(event.target.getAttribute("data-step"));
    var nextValue = Math.max(0, Number(editSort.value || 0) + step);
    editSort.value = nextValue;
  });

  saveEdit.addEventListener("click", function () {
    if (editingIndex < 0) {
      return;
    }
    gameTypes[editingIndex].sort = Number(editSort.value || 0);
    gameTypes[editingIndex].enabled = editEnabled.checked;
    renderTable();
    closeModal();
  });

  renderTable();
}());
