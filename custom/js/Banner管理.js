(function () {
  var promotions = [
    { id: 1, sort: 0, type: "大厅Banner", link: "返水", time: "2026-05-21T18:11:45.22...", theme: "blue" },
    { id: 2, sort: 0, type: "大厅Banner", link: "外部链接", time: "2026-05-21T18:05:34.18...", theme: "light" },
    { id: 3, sort: 0, type: "大厅Banner", link: "红包发发发", time: "2026-05-21T17:45:09.26...", theme: "blue" },
    { id: 4, sort: 0, type: "大厅Banner", link: "无", time: "2026-05-21T17:40:00.88...", theme: "purple" }
  ];

  var currentRows = promotions.slice();
  var editingId = null;
  var hasImage = false;
  var selectedActivity = "";
  var activities = [
    "拉新抽豪礼",
    "打码返水",
    "拉新送金",
    "救济金",
    "红包发发发",
    "充值送金",
    "充值排行榜",
    "排行榜",
    "快乐砸金蛋",
    "幸运转盘",
    "签到送好礼",
    "首充活动"
  ];

  var typeFilter = document.getElementById("typeFilter");
  var rows = document.getElementById("promoRows");
  var emptyState = document.getElementById("emptyState");
  var totalCount = document.getElementById("totalCount");
  var modal = document.getElementById("promoModal");
  var modalTitle = document.getElementById("modalTitle");
  var modalType = document.getElementById("modalType");
  var jumpType = document.getElementById("jumpType");
  var sortInput = document.getElementById("sortInput");
  var activityRow = document.getElementById("activityRow");
  var externalRow = document.getElementById("externalRow");
  var externalLink = document.getElementById("externalLink");
  var activityTrigger = document.getElementById("activityTrigger");
  var activityMenu = document.getElementById("activityMenu");
  var activitySearch = document.getElementById("activitySearch");
  var activityOptions = document.getElementById("activityOptions");
  var typeTip = document.getElementById("typeTip");
  var uploadTip = document.getElementById("uploadTip");
  var uploadBox = document.getElementById("uploadBox");
  var uploadPlaceholder = document.getElementById("uploadPlaceholder");
  var imagePreview = document.getElementById("imagePreview");
  var removeImage = document.getElementById("removeImage");

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (char) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "\"": "&quot;",
        "'": "&#39;"
      }[char];
    });
  }

  function render(list) {
    currentRows = list;
    rows.innerHTML = list.map(function (item) {
      return [
        '<tr data-id="' + item.id + '">',
        "<td>" + item.sort + "</td>",
        "<td>" + escapeHtml(item.type) + "</td>",
        '<td><div class="banner-thumb ' + item.theme + '"></div></td>',
        "<td>" + escapeHtml(item.link) + "</td>",
        "<td>" + escapeHtml(item.time) + "</td>",
        '<td><button class="action-link" type="button" data-edit="' + item.id + '">修改</button>',
        '<button class="action-link danger" type="button" data-delete="' + item.id + '">删除</button></td>',
        "</tr>"
      ].join("");
    }).join("");
    emptyState.hidden = list.length > 0;
    totalCount.textContent = "共 " + list.length + " 条记录";
  }

  function applyFilters() {
    var typeValue = typeFilter.value;
    render(promotions.filter(function (item) {
      return !typeValue || item.type === typeValue;
    }));
  }

  function findPromotion(id) {
    return promotions.filter(function (item) {
      return item.id === id;
    })[0];
  }

  function setImageState(visible) {
    hasImage = visible;
    imagePreview.hidden = !visible;
    removeImage.hidden = !visible;
    uploadPlaceholder.hidden = visible;
  }

  function renderActivities(keyword) {
    var value = (keyword || "").trim();
    activityOptions.innerHTML = activities.filter(function (name) {
      return !value || name.indexOf(value) !== -1;
    }).map(function (name, index) {
      return '<button class="activity-option' + (index === 0 ? " active" : "") + '" type="button" data-activity="' + escapeHtml(name) + '">' + escapeHtml(name) + "</button>";
    }).join("");
  }

  function syncJumpFields() {
    activityRow.hidden = jumpType.value !== "活动";
    externalRow.hidden = jumpType.value !== "外部链接";
    if (jumpType.value !== "活动") {
      activityMenu.hidden = true;
    }
  }

  function openModal(item) {
    editingId = item ? item.id : null;
    modalTitle.textContent = item ? "编辑" : "新增";
    modalType.value = item ? item.type : "";
    jumpType.value = item ? item.link : "无";
    sortInput.value = item ? item.sort : 0;
    typeTip.hidden = !!item;
    uploadTip.hidden = !item;
    modalType.disabled = !!item;
    jumpType.disabled = false;
    externalLink.value = item && item.link === "外部链接" ? "https://example.com/promo" : "";
    selectedActivity = item && activities.indexOf(item.link) !== -1 ? item.link : "";
    activityTrigger.textContent = selectedActivity || "请选择活动";
    renderActivities("");
    syncJumpFields();
    setImageState(!!item);
    modal.hidden = false;
  }

  function closeModal() {
    modal.hidden = true;
  }

  document.getElementById("searchBtn").addEventListener("click", applyFilters);

  document.getElementById("resetBtn").addEventListener("click", function () {
    typeFilter.value = "";
    render(promotions);
  });

  document.getElementById("addBtn").addEventListener("click", function () {
    openModal(null);
  });

  rows.addEventListener("click", function (event) {
    var editButton = event.target.closest("[data-edit]");
    var deleteButton = event.target.closest("[data-delete]");
    if (editButton) {
      openModal(findPromotion(Number(editButton.getAttribute("data-edit"))));
      return;
    }
    if (deleteButton) {
      var id = Number(deleteButton.getAttribute("data-delete"));
      promotions = promotions.filter(function (item) {
        return item.id !== id;
      });
      applyFilters();
    }
  });

  modalType.addEventListener("change", function () {
    typeTip.hidden = !modalType.value;
  });

  jumpType.addEventListener("change", syncJumpFields);

  activityTrigger.addEventListener("click", function () {
    activityMenu.hidden = !activityMenu.hidden;
    if (!activityMenu.hidden) {
      activitySearch.focus();
    }
  });

  activitySearch.addEventListener("input", function () {
    renderActivities(activitySearch.value);
  });

  activityOptions.addEventListener("click", function (event) {
    var option = event.target.closest("[data-activity]");
    if (!option) {
      return;
    }
    selectedActivity = option.getAttribute("data-activity");
    activityTrigger.textContent = selectedActivity;
    activityMenu.hidden = true;
  });

  uploadBox.addEventListener("click", function () {
    setImageState(true);
  });

  removeImage.addEventListener("click", function (event) {
    event.stopPropagation();
    setImageState(false);
  });

  document.addEventListener("click", function (event) {
    if (event.target.matches("[data-close], .modal-mask")) {
      closeModal();
    }
  });

  document.getElementById("confirmBtn").addEventListener("click", function () {
    if (editingId) {
      var item = findPromotion(editingId);
      if (item) {
        item.sort = Number(sortInput.value || 0);
      }
    } else {
      var linkValue = jumpType.value;
      if (jumpType.value === "活动") {
        linkValue = selectedActivity || "拉新抽豪礼";
      }
      if (jumpType.value === "外部链接") {
        linkValue = externalLink.value.trim() || "外部链接";
      }
      promotions.unshift({
        id: Date.now(),
        sort: Number(sortInput.value || 0),
        type: modalType.value || "大厅Banner",
        link: linkValue,
        time: "2026-05-23T10:18:30.00...",
        theme: hasImage ? "purple" : "blue"
      });
      typeFilter.value = "";
    }
    applyFilters();
    closeModal();
  });

  render(promotions);
}());
