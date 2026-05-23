(function () {
  var notices = [
    {
      id: 1,
      type: "平台公告",
      title: "平台结算规则升级公告",
      time: "2026-05-22 10:30",
      status: "未读",
      content: "自 2026-05-25 起，平台将升级商户结算规则展示逻辑，结算单新增渠道维度汇总和异常标识。请各商户关注结算中心数据变化。"
    },
    {
      id: 2,
      type: "通知",
      title: "钱包服务例行维护通知",
      time: "2026-05-21 22:00",
      status: "未读",
      content: "平台将于 2026-05-23 02:00-04:00 进行钱包服务例行维护，维护期间充值、提现和余额刷新可能出现短暂延迟。"
    },
    {
      id: 3,
      type: "风控预警",
      title: "商户余额不足预警",
      time: "2026-05-20 16:18",
      status: "已读",
      content: "系统检测到当前商户可用余额低于预警阈值，可能影响会员提现、活动奖励发放和渠道结算。请及时充值或调整资金安排。"
    },
    {
      id: 4,
      type: "站内信",
      title: "运营顾问站内信提醒",
      time: "2026-05-18 09:45",
      status: "未读",
      content: "您的专属运营顾问已发送本周运营建议，包含留存活动配置、充值转化优化和渠道投放复盘内容，请进入消息中心查看。"
    },
    {
      id: 5,
      type: "平台公告",
      title: "后台权限菜单调整公告",
      time: "2026-05-15 17:51",
      status: "已读",
      content: "为提升后台操作效率，平台已调整部分权限菜单归属。原有角色权限保持不变，管理员可在权限管理中查看最新菜单结构。"
    },
    {
      id: 6,
      type: "平台公告",
      title: "商户后台版本发布公告",
      time: "2026-05-15 17:51",
      status: "已读",
      content: "商户后台已发布 2026.05.15 版本，本次更新优化了报表查询速度、公告查看体验和部分表格字段展示。"
    },
    {
      id: 7,
      type: "短信",
      title: "短信签名审核结果通知",
      time: "2026-05-14 11:20",
      status: "未读",
      content: "您提交的短信签名已审核通过，可用于验证码、营销触达和系统通知场景。请确认发送模板内容符合平台规范。"
    }
  ];

  var currentRows = notices.slice();
  var typeFilter = document.getElementById("typeFilter");
  var titleFilter = document.getElementById("titleFilter");
  var statusFilter = document.getElementById("statusFilter");
  var rows = document.getElementById("noticeRows");
  var emptyState = document.getElementById("emptyState");
  var totalCount = document.getElementById("totalCount");
  var modal = document.getElementById("noticeModal");
  var detailTitle = document.getElementById("detailTitle");
  var detailType = document.getElementById("detailType");
  var detailContent = document.getElementById("detailContent");

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
      var unread = item.status === "未读";
      return [
        '<tr class="' + (unread ? "unread" : "") + '" data-id="' + item.id + '">',
        "<td>" + escapeHtml(item.type) + "</td>",
        "<td>" + escapeHtml(item.title) + "</td>",
        "<td>" + escapeHtml(item.time) + "</td>",
        '<td><span class="status ' + (unread ? "unread" : "") + '">' + escapeHtml(item.status) + "</span></td>",
        '<td><button class="action-link" type="button" data-view="' + item.id + '">查看</button></td>',
        "</tr>"
      ].join("");
    }).join("");
    emptyState.hidden = list.length > 0;
    totalCount.textContent = "共 " + list.length + " 条记录";
  }

  function applyFilters() {
    var typeValue = typeFilter.value;
    var titleValue = titleFilter.value.trim();
    var statusValue = statusFilter.value;
    render(notices.filter(function (item) {
      return (!typeValue || item.type === typeValue) &&
        (!titleValue || item.title.indexOf(titleValue) !== -1) &&
        (!statusValue || item.status === statusValue);
    }));
  }

  function findNotice(id) {
    return notices.filter(function (item) {
      return item.id === id;
    })[0];
  }

  function openDetail(item) {
    detailTitle.textContent = item.title;
    detailType.textContent = item.type;
    detailContent.textContent = item.content;
    modal.hidden = false;
    if (item.status === "未读") {
      item.status = "已读";
      applyFilters();
    }
  }

  document.getElementById("searchBtn").addEventListener("click", applyFilters);

  document.getElementById("resetBtn").addEventListener("click", function () {
    typeFilter.value = "";
    titleFilter.value = "";
    statusFilter.value = "";
    render(notices);
  });

  document.getElementById("readAllBtn").addEventListener("click", function () {
    notices.forEach(function (item) {
      item.status = "已读";
    });
    applyFilters();
  });

  document.addEventListener("click", function (event) {
    var viewButton = event.target.closest("[data-view]");
    if (viewButton) {
      var item = findNotice(Number(viewButton.getAttribute("data-view")));
      if (item) {
        openDetail(item);
      }
      return;
    }
    if (event.target.matches("[data-close], .notice-modal-mask")) {
      modal.hidden = true;
    }
  });

  titleFilter.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      applyFilters();
    }
  });

  render(notices);
})();
