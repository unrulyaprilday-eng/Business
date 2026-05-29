(function () {
  var rows = [
    ["1010010309", "123ppp", "2026-05-28 14:40:17"],
    ["1010010309", "123ppp", "2026-05-28 14:40:05"],
    ["1010010309", "123ppp", "2026-05-28 14:39:26"],
    ["1010010307", "123ooo", "2026-05-27 19:04:32"],
    ["1010010186", "123jjj", "2026-05-27 19:04:17"],
    ["1010010186", "123jjj", "2026-05-27 19:04:08"],
    ["1010010307", "123ooo", "2026-05-27 19:04:05"],
    ["1010010185", "123hhh", "2026-05-27 19:04:05"],
    ["1010010185", "123hhh", "2026-05-27 19:04:02"],
    ["1010010186", "123jjj", "2026-05-27 19:04:02"],
    ["1010010307", "123ooo", "2026-05-27 19:03:50"],
    ["1010010307", "123ooo", "2026-05-27 19:03:47"],
    ["1010010186", "123jjj", "2026-05-27 19:03:44"],
    ["1010010185", "123hhh", "2026-05-27 19:03:41"]
  ];

  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function $all(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function renderRows() {
    $("#profitRows").innerHTML = rows.map(function (row) {
      return [
        "<tr>",
        "<td>" + row[0] + "</td>",
        "<td>" + row[1] + "</td>",
        '<td><span class="status-wait">待处理</span></td>',
        '<td><span class="type-tag">大额中奖</span></td>',
        "<td></td>",
        '<td><button class="link-btn" data-detail type="button">查看数据</button></td>',
        "<td></td>",
        "<td>" + row[2] + "</td>",
        '<td><button class="link-btn" data-audit type="button">审核</button></td>',
        "</tr>"
      ].join("");
    }).join("");
  }

  function closeAll() {
    $all(".modal-mask").forEach(function (modal) {
      modal.hidden = true;
    });
  }

  function syncLinkedParams(name, className) {
    var isOn = $('input[name="' + name + '"]:checked').value === "on";
    $all("." + className).forEach(function (item) {
      item.hidden = !isOn;
    });
  }

  function syncAllParams() {
    syncLinkedParams("burstSwitch", "burst-linked");
    syncLinkedParams("profitSwitch", "profit-linked");
    syncLinkedParams("remindSwitch", "remind-linked");
  }

  function bindEvents() {
    $("#openParams").addEventListener("click", function () {
      $("#paramsModal").hidden = false;
      syncAllParams();
    });

    document.addEventListener("click", function (event) {
      if (event.target.matches("[data-detail]")) {
        $("#detailModal").hidden = false;
      }
      if (event.target.matches("[data-audit]")) {
        $("#auditModal").hidden = false;
        $("#auditMenu").hidden = true;
        $("#auditSelect").classList.remove("open");
      }
      if (event.target.matches("[data-close-modal], [data-close-detail], [data-close-audit]")) {
        closeAll();
      }
      if (event.target === $("#paramsModal") || event.target === $("#detailModal") || event.target === $("#auditModal")) {
        closeAll();
      }
    });

    $all('input[name="burstSwitch"], input[name="profitSwitch"], input[name="remindSwitch"]').forEach(function (radio) {
      radio.addEventListener("change", syncAllParams);
    });

    $("#auditSelect").addEventListener("click", function () {
      var menu = $("#auditMenu");
      menu.hidden = !menu.hidden;
      this.classList.toggle("open", !menu.hidden);
    });

    $all("#auditMenu button").forEach(function (button) {
      button.addEventListener("click", function () {
        $("#auditSelect").firstChild.nodeValue = this.textContent;
        $("#auditSelect").style.color = "#4e5d70";
        $("#auditMenu").hidden = true;
        $("#auditSelect").classList.remove("open");
      });
    });
  }

  renderRows();
  bindEvents();
  syncAllParams();
})();
