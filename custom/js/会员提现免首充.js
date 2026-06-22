(function () {
  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  ready(function () {
    var rows = [
      {
        memberId: "1010010286",
        memberAccount: "luckywin86",
        remark: "高价值会员，临时放开首次提现累计充值限制",
        operator: "Admin",
        operateTime: "2026-06-22 10:15:26"
      },
      {
        memberId: "1010010312",
        memberAccount: "sunnybet312",
        remark: "活动补单用户，按运营申请加入白名单",
        operator: "Bella",
        operateTime: "2026-06-22 09:48:03"
      },
      {
        memberId: "1010010458",
        memberAccount: "aceplayer458",
        remark: "新站迁移老会员，保留原提现资格",
        operator: "Cindy",
        operateTime: "2026-06-21 18:27:41"
      },
      {
        memberId: "1010010520",
        memberAccount: "vipforest520",
        remark: "VIP投诉补偿处理，7日内免首充限制",
        operator: "Admin",
        operateTime: "2026-06-21 14:05:19"
      }
    ];
    var tableBody = document.getElementById("tableBody");
    var memberIdFilter = document.getElementById("memberIdFilter");
    var memberAccountFilter = document.getElementById("memberAccountFilter");
    var formModal = document.getElementById("formModal");
    var memberIdsInput = document.getElementById("memberIdsInput");
    var remarkInput = document.getElementById("remarkInput");
    var createBtn = document.getElementById("createBtn");
    var closeModalBtn = document.getElementById("closeModalBtn");
    var cancelBtn = document.getElementById("cancelBtn");
    var submitBtn = document.getElementById("submitBtn");
    var searchBtn = document.getElementById("searchBtn");
    var resetBtn = document.getElementById("resetBtn");

    if (!tableBody || !memberIdFilter || !memberAccountFilter || !formModal || !memberIdsInput || !remarkInput) {
      return;
    }

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

    function formatDate(date) {
      function pad(value) {
        return value < 10 ? "0" + value : String(value);
      }

      return [
        date.getFullYear(),
        pad(date.getMonth() + 1),
        pad(date.getDate())
      ].join("-") + " " + [
        pad(date.getHours()),
        pad(date.getMinutes()),
        pad(date.getSeconds())
      ].join(":");
    }

    function buildAccount(memberId) {
      return "member_" + String(memberId).slice(-6);
    }

    function getFilteredRows() {
      var memberIdKeyword = memberIdFilter.value.trim();
      var accountKeyword = memberAccountFilter.value.trim().toLowerCase();

      return rows.filter(function (item) {
        var matchesId = !memberIdKeyword || item.memberId.indexOf(memberIdKeyword) > -1;
        var matchesAccount = !accountKeyword || item.memberAccount.toLowerCase().indexOf(accountKeyword) > -1;
        return matchesId && matchesAccount;
      });
    }

    function renderTable() {
      var list = getFilteredRows();

      if (!list.length) {
        tableBody.innerHTML = '<tr class="empty-row"><td colspan="6">暂无数据</td></tr>';
        return;
      }

      tableBody.innerHTML = list.map(function (item) {
        return [
          "<tr>",
          "<td>" + escapeHtml(item.memberId) + "</td>",
          "<td>" + escapeHtml(item.memberAccount) + "</td>",
          "<td title=\"" + escapeHtml(item.remark) + "\">" + escapeHtml(item.remark || "-") + "</td>",
          "<td>" + escapeHtml(item.operator) + "</td>",
          "<td>" + escapeHtml(item.operateTime) + "</td>",
          "<td><button class=\"action-link\" type=\"button\" data-remove=\"" + escapeHtml(item.memberId) + "\">删除</button></td>",
          "</tr>"
        ].join("");
      }).join("");
    }

    function openModal() {
      memberIdsInput.value = "";
      remarkInput.value = "";
      formModal.hidden = false;
      memberIdsInput.focus();
    }

    function closeModal() {
      formModal.hidden = true;
    }

    function submitForm() {
      var rawIds = memberIdsInput.value.trim();
      var remark = remarkInput.value.trim();
      var seen = {};

      if (!rawIds) {
        memberIdsInput.focus();
        return;
      }

      rawIds.split(",").map(function (item) {
        return item.trim();
      }).filter(function (item) {
        return !!item;
      }).forEach(function (memberId) {
        if (seen[memberId]) {
          return;
        }
        seen[memberId] = true;

        rows = rows.filter(function (row) {
          return row.memberId !== memberId;
        });

        rows.unshift({
          memberId: memberId,
          memberAccount: buildAccount(memberId),
          remark: remark,
          operator: "Admin",
          operateTime: formatDate(new Date())
        });
      });

      closeModal();
      renderTable();
    }

    function removeRow(memberId) {
      rows = rows.filter(function (item) {
        return item.memberId !== memberId;
      });
      renderTable();
    }

    if (createBtn) {
      createBtn.addEventListener("click", openModal);
    }
    if (closeModalBtn) {
      closeModalBtn.addEventListener("click", closeModal);
    }
    if (cancelBtn) {
      cancelBtn.addEventListener("click", closeModal);
    }
    if (submitBtn) {
      submitBtn.addEventListener("click", submitForm);
    }
    if (searchBtn) {
      searchBtn.addEventListener("click", renderTable);
    }
    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        memberIdFilter.value = "";
        memberAccountFilter.value = "";
        renderTable();
      });
    }

    formModal.addEventListener("click", function (event) {
      if (event.target === formModal) {
        closeModal();
      }
    });

    document.addEventListener("click", function (event) {
      var removeButton = event.target.closest("[data-remove]");
      if (removeButton) {
        removeRow(removeButton.getAttribute("data-remove"));
      }
    });

    memberIdsInput.addEventListener("keydown", function (event) {
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        submitForm();
      }
    });

    renderTable();
  });
})();
