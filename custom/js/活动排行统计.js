(function () {
  var rows = [
    { rank: 1, account: "vip_880126", reward: "8,888.00" },
    { rank: 2, account: "user_918273", reward: "6,660.00" },
    { rank: 3, account: "jackpot2026", reward: "5,200.00" },
    { rank: 4, account: "mango_5566", reward: "3,880.00" },
    { rank: 5, account: "alice8821", reward: "2,980.00" },
    { rank: 6, account: "bravo777", reward: "1,888.00" },
    { rank: 7, account: "cn_player09", reward: "1,280.00" },
    { rank: 8, account: "sunny_1008", reward: "888.00" },
    { rank: 9, account: "member6021", reward: "588.00" }
  ];

  function renderRows() {
    var tbody = document.getElementById("rankRows");
    var total = document.getElementById("totalRows");
    if (!tbody || !total) return;

    tbody.innerHTML = rows.map(function (item) {
      var topClass = item.rank <= 3 ? " top" + item.rank : "";
      return [
        "<tr>",
        '<td><span class="rank-badge' + topClass + '">' + item.rank + "</span></td>",
        "<td>" + item.account + "</td>",
        '<td class="reward">' + item.reward + "</td>",
        "</tr>"
      ].join("");
    }).join("");

    total.textContent = rows.length;
  }

  function closeSelects(except) {
    Array.prototype.forEach.call(document.querySelectorAll(".select-control"), function (select) {
      if (select !== except) {
        select.classList.remove("open");
        var menu = select.querySelector(".select-menu");
        if (menu) menu.hidden = true;
      }
    });
  }

  function bindSelects() {
    Array.prototype.forEach.call(document.querySelectorAll(".select-control"), function (select) {
      var trigger = select.querySelector(".select-trigger");
      var label = select.querySelector(".select-trigger span");
      var menu = select.querySelector(".select-menu");
      if (!trigger || !label || !menu) return;

      trigger.addEventListener("click", function () {
        var opening = menu.hidden;
        closeSelects(select);
        menu.hidden = !opening;
        select.classList.toggle("open", opening);
      });

      Array.prototype.forEach.call(menu.querySelectorAll("li"), function (item) {
        item.addEventListener("click", function () {
          Array.prototype.forEach.call(menu.querySelectorAll("li"), function (li) {
            li.classList.remove("active");
          });
          item.classList.add("active");
          label.textContent = item.getAttribute("data-value") || item.textContent;
          label.style.color = "#303133";
          menu.hidden = true;
          select.classList.remove("open");
        });
      });
    });

    document.addEventListener("click", function (event) {
      if (!event.target.closest(".select-control")) closeSelects();
    });
  }

  function bindForm() {
    var form = document.getElementById("rankFilter");
    if (!form) return;

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      renderRows();
    });

    form.addEventListener("reset", function () {
      window.setTimeout(function () {
        Array.prototype.forEach.call(document.querySelectorAll(".select-trigger span"), function (label) {
          label.style.color = "#a8b2c0";
        });
        document.querySelector('[data-select="rankType"] .select-trigger span').textContent = "请选择排行榜";
        document.querySelector('[data-select="activity"] .select-trigger span').textContent = "请选择活动";
        Array.prototype.forEach.call(document.querySelectorAll(".select-menu li"), function (li) {
          li.classList.remove("active");
        });
        renderRows();
      }, 0);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      renderRows();
      bindSelects();
      bindForm();
    });
  } else {
    renderRows();
    bindSelects();
    bindForm();
  }
})();
