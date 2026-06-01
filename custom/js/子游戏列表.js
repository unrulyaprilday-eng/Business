(function () {
  var fallbackIcon = "data:image/svg+xml;utf8," + encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop stop-color='#13243d'/><stop offset='1' stop-color='#efb64a'/></linearGradient></defs><rect width='180' height='180' rx='16' fill='url(#g)'/><text x='90' y='76' text-anchor='middle' font-size='20' font-family='Arial' font-weight='700' fill='#ffd45d'>BLACK MYTH</text><text x='90' y='104' text-anchor='middle' font-size='24' font-family='Arial' font-weight='700' fill='#fff'>WUKONG</text><circle cx='90' cy='126' r='22' fill='#47301f'/></svg>");
  var fallbackActiveIcon = "data:image/svg+xml;utf8," + encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' width='320' height='427'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop stop-color='#0f1b2d'/><stop offset='1' stop-color='#b35b32'/></linearGradient></defs><rect width='320' height='427' fill='url(#g)'/><text x='160' y='76' text-anchor='middle' font-size='34' font-family='Arial' font-weight='700' fill='#ffd45d'>BLACK MYTH</text><text x='160' y='120' text-anchor='middle' font-size='46' font-family='Arial' font-weight='700' fill='#fff'>WUKONG</text><circle cx='160' cy='245' r='76' fill='#573320'/></svg>");

  var games = [
    { sort: 999, id: "slot-yellowbat::tigerboom", name: "Tiger Boom", supplier: "GX-INR", vendor: "GXgame", type: "电子", hot: true, enabled: true, icon: fallbackIcon, activeIcon: "" },
    { sort: 3, id: "60096", name: "Crash Touchdown", supplier: "GB-USD", vendor: "JL", type: "区块链", hot: false, enabled: true, icon: "", activeIcon: "" },
    { sort: 1, id: "wg_3025", name: "Black Myth: Wukong", supplier: "HG-USD", vendor: "WG", type: "电子", hot: false, enabled: true, icon: fallbackIcon, activeIcon: fallbackActiveIcon },
    { sort: 0, id: "wg_3032", name: "Mahjong Ways 2", supplier: "HG-USD", vendor: "WG", type: "电子", hot: false, enabled: true, icon: "", activeIcon: "" },
    { sort: 0, id: "wg_3031", name: "Fortune Tiger", supplier: "HG-USD", vendor: "WG", type: "电子", hot: false, enabled: true, icon: "", activeIcon: "" },
    { sort: 0, id: "wg_3029", name: "Mahjong Ways", supplier: "HG-USD", vendor: "WG", type: "电子", hot: false, enabled: true, icon: "", activeIcon: "" },
    { sort: 0, id: "wg_3028", name: "Dragon's Treasure2", supplier: "HG-USD", vendor: "WG", type: "电子", hot: true, enabled: true, icon: "", activeIcon: "" }
  ];

  var rows = document.getElementById("gameRows");
  var selectAllRows = document.getElementById("selectAllRows");
  var batchToggle = document.getElementById("batchToggle");
  var batchMenu = document.getElementById("batchMenu");
  var modal = document.getElementById("editModal");
  var modalIcon = document.getElementById("modalIcon");
  var modalActiveIcon = document.getElementById("modalActiveIcon");
  var modalSort = document.getElementById("modalSort");
  var modalHot = document.getElementById("modalHot");
  var modalStatus = document.getElementById("modalStatus");

  function switchCell(value) {
    return "<span class=\"switch" + (value ? " on" : "") + "\"></span>";
  }

  function imageCell(src, active) {
    return src ? "<img class=\"thumb" + (active ? " active" : "") + "\" src=\"" + src + "\" alt=\"\">" : "-";
  }

  function renderRows() {
    rows.innerHTML = games.map(function (game, index) {
      return "<tr" + (game.selected ? " class=\"is-selected\"" : "") + ">" +
        "<td><input class=\"row-check\" type=\"checkbox\" data-index=\"" + index + "\"" + (game.selected ? " checked" : "") + "></td>" +
        "<td>" + game.sort + "</td>" +
        "<td>" + game.id + "</td>" +
        "<td>" + game.name + "</td>" +
        "<td>" + game.supplier + "</td>" +
        "<td>" + game.vendor + "</td>" +
        "<td>" + game.type + "</td>" +
        "<td>" + switchCell(game.hot) + "</td>" +
        "<td>" + switchCell(game.enabled) + "</td>" +
        "<td>" + imageCell(game.icon, false) + "</td>" +
        "<td>" + imageCell(game.activeIcon, true) + "</td>" +
        "<td><button class=\"edit-link\" type=\"button\" data-index=\"" + index + "\">修改</button></td>" +
      "</tr>";
    }).join("");
    updateSelectAllState();
  }

  function getSelectedGames() {
    return games.filter(function (game) {
      return game.selected;
    });
  }

  function updateSelectAllState() {
    var selectedCount = getSelectedGames().length;
    selectAllRows.checked = games.length > 0 && selectedCount === games.length;
    selectAllRows.indeterminate = selectedCount > 0 && selectedCount < games.length;
  }

  function closeBatchMenu() {
    batchMenu.hidden = true;
    batchToggle.setAttribute("aria-expanded", "false");
  }

  function applyBatch(action) {
    var parts = action.split(":");
    var key = parts[0];
    var value = parts[1] === "on";
    games.forEach(function (game) {
      if (game.selected) {
        game[key] = value;
      }
    });
    renderRows();
  }

  function openModal(game) {
    modalIcon.src = game.icon || fallbackIcon;
    modalActiveIcon.src = game.activeIcon || fallbackActiveIcon;
    modalSort.value = game.sort;
    modalHot.checked = game.hot;
    modalStatus.checked = game.enabled;
    modal.hidden = false;
  }

  rows.addEventListener("click", function (event) {
    var target = event.target;
    if (target && target.matches(".edit-link")) {
      openModal(games[Number(target.getAttribute("data-index"))]);
    }
  });

  rows.addEventListener("change", function (event) {
    var target = event.target;
    if (target && target.matches(".row-check")) {
      games[Number(target.getAttribute("data-index"))].selected = target.checked;
      renderRows();
    }
  });

  selectAllRows.addEventListener("change", function () {
    games.forEach(function (game) {
      game.selected = selectAllRows.checked;
    });
    renderRows();
  });

  batchToggle.addEventListener("click", function (event) {
    event.stopPropagation();
    batchMenu.hidden = !batchMenu.hidden;
    batchToggle.setAttribute("aria-expanded", String(!batchMenu.hidden));
  });

  batchMenu.addEventListener("click", function (event) {
    var target = event.target;
    if (target && target.hasAttribute("data-batch")) {
      applyBatch(target.getAttribute("data-batch"));
      closeBatchMenu();
    }
  });

  document.addEventListener("click", function (event) {
    if (!batchMenu.hidden && !event.target.closest(".batch-dropdown")) {
      closeBatchMenu();
    }
  });

  modal.addEventListener("click", function (event) {
    if (event.target === modal || event.target.hasAttribute("data-close")) {
      modal.hidden = true;
    }
  });

  renderRows();
})();
