(function () {
  var recommended = [
    { id: "100001", name: "Crash Touchdown", sort: 1 },
    { id: "100002", name: "Black Myth: Wukong", sort: 2 },
    { id: "100003", name: "Wild Bounty", sort: 3 },
    { id: "100004", name: "Queen of Bounty", sort: 4 },
    { id: "100005", name: "Fortune Rabbit", sort: 5 },
    { id: "100006", name: "Fortune Ox", sort: 6 }
  ];

  var candidates = [
    { name: "ALL" },
    { name: "Game1" },
    { name: "Game2" },
    { name: "Game3", added: true },
    { name: "Game4" },
    { name: "Game5" },
    { name: "Game6" },
    { name: "Game7" },
    { name: "Game8" },
    { name: "Game9" }
  ];

  var recommendedRows = document.getElementById("recommendedRows");
  var candidateList = document.getElementById("candidateList");
  var selectAll = document.getElementById("selectAllRecommended");
  var batchRemove = document.getElementById("batchRemove");
  var selectedCount = document.getElementById("selectedCount");
  var moreFilterButton = document.querySelector(".js-more-filter");
  var moreFilterRow = document.getElementById("moreFilterRow");
  var openSelector = document.getElementById("openSelector");
  var selectorDrawer = document.getElementById("selectorDrawer");
  var addSelected = document.getElementById("addSelected");

  function renderRecommended() {
    recommendedRows.innerHTML = recommended.map(function (item, index) {
      return [
        "<tr>",
        "<td><input class=\"row-check\" type=\"checkbox\" data-index=\"" + index + "\"></td>",
        "<td>" + item.id + "</td>",
        "<td>" + item.name + "</td>",
        "<td><div class=\"cover\"></div></td>",
        "<td><input class=\"sort-input\" type=\"text\" value=\"" + item.sort + "\"></td>",
        "<td><button class=\"remove-btn\" type=\"button\" data-index=\"" + index + "\">删除</button></td>",
        "</tr>"
      ].join("");
    }).join("");
  }

  function renderCandidates() {
    candidateList.innerHTML = candidates.map(function (item, index) {
      var checked = index > 0 && index < 4 ? " checked" : "";
      var disabled = item.added ? " disabled" : "";
      var status = item.added ? "<em>已添加</em>" : "";
      return "<label class=\"game-option" + (item.added ? " is-added" : "") + "\"><input type=\"checkbox\"" + checked + disabled + "> " + item.name + status + "</label>";
    }).join("");
  }

  recommendedRows.addEventListener("click", function (event) {
    var target = event.target;
    if (target.className === "remove-btn") {
      recommended.splice(Number(target.getAttribute("data-index")), 1);
      renderRecommended();
    }
  });

  selectAll.addEventListener("change", function () {
    Array.prototype.forEach.call(document.querySelectorAll(".row-check"), function (checkbox) {
      checkbox.checked = selectAll.checked;
    });
  });

  batchRemove.addEventListener("click", function () {
    var checkedIds = Array.prototype.map.call(document.querySelectorAll(".row-check:checked"), function (checkbox) {
      return Number(checkbox.getAttribute("data-index"));
    });
    recommended = recommended.filter(function (_, index) {
      return checkedIds.indexOf(index) === -1;
    });
    selectAll.checked = false;
    renderRecommended();
  });

  moreFilterButton.addEventListener("click", function () {
    moreFilterRow.classList.toggle("is-open");
  });

  openSelector.addEventListener("click", function () {
    selectorDrawer.hidden = false;
  });

  selectorDrawer.addEventListener("click", function (event) {
    if (event.target.hasAttribute("data-close-selector")) {
      selectorDrawer.hidden = true;
    }
  });

  candidateList.addEventListener("change", function () {
    var count = candidateList.querySelectorAll("input:checked:not(:disabled)").length;
    selectedCount.textContent = count;
  });

  addSelected.addEventListener("click", function () {
    Array.prototype.forEach.call(candidateList.querySelectorAll("input:checked:not(:disabled)"), function (checkbox) {
      var name = checkbox.parentNode.textContent.trim();
      var nextSort = recommended.length + 1;
      recommended.push({
        id: String(100000 + nextSort),
        name: name,
        sort: nextSort
      });
      checkbox.disabled = true;
      checkbox.parentNode.classList.add("is-added");
      if (!checkbox.parentNode.querySelector("em")) {
        checkbox.parentNode.insertAdjacentHTML("beforeend", "<em>已添加</em>");
      }
    });
    selectedCount.textContent = "0";
    renderRecommended();
    selectorDrawer.hidden = true;
  });

  renderRecommended();
  renderCandidates();
}());
