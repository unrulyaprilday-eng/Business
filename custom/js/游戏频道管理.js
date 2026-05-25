(function () {
  var channels = [
    { id: "CH001", content: "热门", name: { zh: "热门", en: "Popular", pt: "Popular" }, type: "热门", gameTypes: "-", vendors: "-", icon: "热", selectedIcon: "H", enabled: true, time: "2026-05-18 14:20", hot: true },
    { id: "CH002", content: "收藏", name: { zh: "收藏", en: "Favorites", pt: "Favoritos" }, type: "收藏", gameTypes: "-", vendors: "-", icon: "收", selectedIcon: "F", enabled: true, time: "2026-05-12 10:08", userData: true },
    { id: "CH003", content: "最近", name: { zh: "最近", en: "Recent", pt: "Recentes" }, type: "最近", gameTypes: "-", vendors: "-", icon: "近", selectedIcon: "R", enabled: true, time: "2026-05-12 10:08", userData: true },
    { id: "CH004", content: "电子", name: { zh: "电子", en: "Slots", pt: "Slots" }, type: "游戏", gameTypes: "Slots", vendors: "PG / JILI", icon: "电", selectedIcon: "S", enabled: true, time: "2026-05-10 16:31" },
    { id: "CH005", content: "真人", name: { zh: "真人", en: "Live Casino", pt: "Cassino" }, type: "游戏", gameTypes: "Live Casino", vendors: "EVO", icon: "真", selectedIcon: "L", enabled: false, time: "2026-05-09 11:26" }
  ];

  var channelGameMap = {
    CH001: [
      { id: "100006", name: "Fortune Ox", type: "Slots", vendor: "PG", tag: "热门", sort: 1, status: "开启" },
      { id: "100007", name: "Crazy Hunter", type: "Fishing", vendor: "JILI", tag: "热门", sort: 2, status: "开启" },
      { id: "100008", name: "Dream Catcher", type: "Live Casino", vendor: "EVO", tag: "热门", sort: 3, status: "关闭" }
    ],
    CH004: [
      { id: "100001", name: "Crash Touchdown", type: "Slots", vendor: "PG", tag: "推荐", sort: 1, status: "开启" },
      { id: "100002", name: "Black Myth: Wukong", type: "Slots", vendor: "JILI", tag: "最新", sort: 2, status: "开启" },
      { id: "100003", name: "Wild Bounty", type: "Slots", vendor: "PG", tag: "推荐", sort: 3, status: "关闭" }
    ],
    CH005: [
      { id: "100004", name: "Queen of Bounty", type: "Live Casino", vendor: "EVO", tag: "推荐", sort: 1, status: "开启" }
    ]
  };

  var candidates = [
    { id: "100001", name: "Crash Touchdown", type: "Slots", vendor: "PG", tag: "推荐" },
    { id: "100002", name: "Black Myth: Wukong", type: "Slots", vendor: "JILI", tag: "最新" },
    { id: "100003", name: "Wild Bounty", type: "Slots", vendor: "PG", tag: "推荐" },
    { id: "100004", name: "Queen of Bounty", type: "Live Casino", vendor: "EVO", tag: "推荐" },
    { id: "100005", name: "Fortune Rabbit", type: "Slots", vendor: "PG", tag: "最新" },
    { id: "100006", name: "Fortune Ox", type: "Slots", vendor: "PG", tag: "热门" },
    { id: "100007", name: "Crazy Hunter", type: "Fishing", vendor: "JILI", tag: "热门" },
    { id: "100008", name: "Dream Catcher", type: "Live Casino", vendor: "EVO", tag: "热门" }
  ];

  var currentChannelId = "CH001";
  var channelRows = document.getElementById("channelRows");
  var channelGameRows = document.getElementById("channelGameRows");
  var candidateList = document.getElementById("candidateList");
  var selectedCount = document.getElementById("selectedCount");
  var selectAllChannelGames = document.getElementById("selectAllChannelGames");
  var gameScopeTypeInput = document.getElementById("gameScopeTypeInput");
  var gameScopeVendorInput = document.getElementById("gameScopeVendorInput");
  var channelGamesTypeFilter = document.getElementById("channelGamesTypeFilter");
  var channelGamesVendorFilter = document.getElementById("channelGamesVendorFilter");
  var candidateTypeFilter = document.getElementById("candidateTypeFilter");
  var candidateVendorFilter = document.getElementById("candidateVendorFilter");

  function uniqueValues(items, key) {
    return items.reduce(function (result, item) {
      if (result.indexOf(item[key]) === -1) {
        result.push(item[key]);
      }
      return result;
    }, []);
  }

  var allGameTypes = uniqueValues(candidates, "type");
  var allVendors = uniqueValues(candidates, "vendor");

  function iconCell(text) {
    return "<div class=\"channel-icon\">" + text + "</div>";
  }

  function coverCell() {
    return "<div class=\"cover\"></div>";
  }

  function switchCell(value) {
    return [
      "<label class=\"switch-control compact\">",
      "<input type=\"checkbox\"" + (value ? " checked" : "") + ">",
      "<span aria-hidden=\"true\"></span>",
      "</label>"
    ].join("");
  }

  function getCurrentChannel() {
    return channels.filter(function (channel) {
      return channel.id === currentChannelId;
    })[0];
  }

  function getCurrentRows() {
    if (!channelGameMap[currentChannelId]) {
      channelGameMap[currentChannelId] = [];
    }
    return channelGameMap[currentChannelId];
  }

  function parseScopeText(text, fallback) {
    if (!text || text === "-") {
      return fallback.slice();
    }
    if (text === "全部") {
      return fallback.slice();
    }
    return text.split("/").map(function (item) {
      return item.trim();
    }).filter(Boolean);
  }

  function getChannelScope(channel) {
    if (!channel || channel.type !== "游戏") {
      return {
        types: allGameTypes.slice(),
        vendors: allVendors.slice()
      };
    }
    return {
      types: parseScopeText(channel.gameTypes, allGameTypes),
      vendors: parseScopeText(channel.vendors, allVendors)
    };
  }

  function optionHtml(value) {
    return "<option>" + value + "</option>";
  }

  function fillSelect(select, values, selectedValue) {
    if (!select) {
      return;
    }
    var options = ["全部"].concat(values);
    select.innerHTML = options.map(optionHtml).join("");
    select.value = options.indexOf(selectedValue) === -1 ? "全部" : selectedValue;
  }

  function syncScopeFilters(channel) {
    var scope = getChannelScope(channel);
    fillSelect(channelGamesTypeFilter, scope.types, channelGamesTypeFilter ? channelGamesTypeFilter.value : "全部");
    fillSelect(channelGamesVendorFilter, scope.vendors, channelGamesVendorFilter ? channelGamesVendorFilter.value : "全部");
    fillSelect(candidateTypeFilter, scope.types, candidateTypeFilter ? candidateTypeFilter.value : "全部");
    fillSelect(candidateVendorFilter, scope.vendors, candidateVendorFilter ? candidateVendorFilter.value : "全部");
  }

  function candidateMatchesScope(item, channel) {
    var scope = getChannelScope(channel);
    return scope.types.indexOf(item.type) !== -1 && scope.vendors.indexOf(item.vendor) !== -1;
  }

  function renderChannels() {
    channelRows.innerHTML = channels.map(function (item, index) {
      var manageAction = item.userData
        ? ""
        : "<button class=\"link-btn\" type=\"button\" data-open-modal=\"channelGamesModal\" data-index=\"" + index + "\">游戏配置</button>";
      return [
        "<tr>",
        "<td>" + item.content + "</td>",
        "<td><div>zh:" + item.name.zh + "</div><div>en:" + item.name.en + "</div><div>pt:" + item.name.pt + "</div></td>",
        "<td>" + iconCell(item.icon) + "</td>",
        "<td>" + iconCell(item.selectedIcon) + "</td>",
        "<td>" + item.type + "</td>",
        "<td>" + item.gameTypes + "</td>",
        "<td>" + item.vendors + "</td>",
        "<td>" + switchCell(item.enabled) + "</td>",
        "<td>" + item.time + "</td>",
        "<td>" + manageAction + "</td>",
        "<td><button class=\"link-btn\" type=\"button\" data-open-modal=\"channelModal\" data-mode=\"edit\" data-index=\"" + index + "\">编辑</button> <button class=\"remove-btn\" type=\"button\">删除</button></td>",
        "</tr>"
      ].join("");
    }).join("");
  }

  function renderChannelGames() {
    var channel = getCurrentChannel();
    var isHot = channel && channel.hot;
    document.getElementById("currentChannelName").textContent = "当前频道：" + (channel ? channel.name.zh : "-");
    syncScopeFilters(channel);
    channelGameRows.innerHTML = getCurrentRows().map(function (item, index) {
      return [
        "<tr>",
        "<td><input class=\"channel-game-check\" type=\"checkbox\" data-index=\"" + index + "\"></td>",
        "<td>" + item.id + "</td>",
        "<td>" + item.name + "</td>",
        "<td>" + item.type + "</td>",
        "<td>" + item.vendor + "</td>",
        "<td>" + (isHot ? "<span class=\"hot-badge inline\">热门</span>" : item.tag) + "</td>",
        "<td>" + coverCell() + "</td>",
        "<td><input class=\"sort-input\" type=\"text\" value=\"" + item.sort + "\"></td>",
        "<td><span class=\"status-tag" + (item.status === "关闭" ? " off" : "") + "\">" + item.status + "</span></td>",
        "<td><button class=\"remove-btn\" type=\"button\" data-index=\"" + index + "\">移除</button></td>",
        "</tr>"
      ].join("");
    }).join("");
    selectAllChannelGames.checked = false;
  }

  function renderCandidates() {
    var currentRows = getCurrentRows();
    var channel = getCurrentChannel();
    var isHot = channel && channel.hot;
    syncScopeFilters(channel);
    candidateList.innerHTML = candidates.filter(function (item) {
      return candidateMatchesScope(item, channel);
    }).map(function (item) {
      var added = currentRows.some(function (game) {
        return game.id === item.id;
      });
      var disabled = added || (isHot && item.tag !== "热门");
      var status = added ? "已添加" : (isHot && item.tag !== "热门" ? "非热门" : "");
      return [
        "<label class=\"game-option" + (disabled ? " is-added" : "") + "\">",
        "<input type=\"checkbox\" value=\"" + item.id + "\"" + (disabled ? " disabled" : "") + ">",
        "<span>" + item.id + "</span>",
        "<strong>" + item.name + "</strong>",
        "<span>" + item.type + "</span>",
        "<span>" + item.vendor + "</span>",
        "<span>" + item.tag + "</span>",
        status ? "<em>" + status + "</em>" : "",
        "</label>"
      ].join("");
    }).join("");
    selectedCount.textContent = "0";
  }

  function setChannelTypeMode(modal, type) {
    var isSystem = type === "收藏" || type === "最近";
    var isHot = type === "热门";
    modal.querySelector("#gameScopeFieldset").hidden = isSystem || isHot;
    document.getElementById("systemChannelTip").hidden = !isSystem;
  }

  function openModal(id, trigger) {
    var modal = document.getElementById(id);
    if (!modal) {
      return;
    }
    if (id === "channelModal") {
      var mode = trigger.getAttribute("data-mode");
      var index = Number(trigger.getAttribute("data-index"));
      var channel = !isNaN(index) ? channels[index] : null;
      document.getElementById("channelModalTitle").textContent = mode === "edit" ? "编辑频道" : "添加频道";
      document.getElementById("channelTypeInput").value = channel ? channel.type : "游戏";
      document.getElementById("channelEnabledInput").checked = channel ? channel.enabled : true;
      fillSelect(gameScopeTypeInput, allGameTypes, channel ? channel.gameTypes : "全部");
      fillSelect(gameScopeVendorInput, allVendors, channel ? channel.vendors : "全部");
      document.getElementById("channelNameZhInput").value = channel ? channel.name.zh : "";
      document.getElementById("channelNameEnInput").value = channel ? channel.name.en : "";
      document.getElementById("channelNamePtInput").value = channel ? channel.name.pt : "";
      setChannelTypeMode(modal, channel ? channel.type : "游戏");
    }
    if (id === "channelGamesModal") {
      var channelIndex = Number(trigger.getAttribute("data-index"));
      if (!isNaN(channelIndex)) {
        currentChannelId = channels[channelIndex].id;
      }
      renderChannelGames();
    }
    modal.hidden = false;
  }

  function closeLayer(target) {
    var layer = target.closest(".modal-layer, .drawer-layer");
    if (layer) {
      layer.hidden = true;
    }
  }

  document.addEventListener("click", function (event) {
    var trigger = event.target.closest("[data-open-modal]");
    var removeButton = event.target.closest("#channelGameRows .remove-btn");
    if (trigger) {
      openModal(trigger.getAttribute("data-open-modal"), trigger);
    }
    if (event.target.hasAttribute("data-close-modal") || event.target.hasAttribute("data-close-selector")) {
      closeLayer(event.target);
    }
    if (event.target.id === "openGameSelector") {
      renderCandidates();
      document.getElementById("gameSelectorDrawer").hidden = false;
    }
    if (removeButton) {
      getCurrentRows().splice(Number(removeButton.getAttribute("data-index")), 1);
      renderChannelGames();
    }
  });

  document.getElementById("channelTypeInput").addEventListener("change", function (event) {
    setChannelTypeMode(document.getElementById("channelModal"), event.target.value);
  });

  document.querySelector(".language-tabs").addEventListener("click", function (event) {
    var button = event.target.closest("[data-lang-tab]");
    if (!button) {
      return;
    }
    var lang = button.getAttribute("data-lang-tab");
    Array.prototype.forEach.call(document.querySelectorAll("[data-lang-tab]"), function (tab) {
      tab.classList.toggle("active", tab === button);
    });
    Array.prototype.forEach.call(document.querySelectorAll("[data-lang-panel]"), function (panel) {
      panel.hidden = panel.getAttribute("data-lang-panel") !== lang;
    });
  });

  candidateList.addEventListener("change", function () {
    selectedCount.textContent = candidateList.querySelectorAll("input:checked:not(:disabled)").length;
  });

  document.getElementById("addSelectedGames").addEventListener("click", function () {
    var rows = getCurrentRows();
    var isHot = getCurrentChannel() && getCurrentChannel().hot;
    Array.prototype.forEach.call(candidateList.querySelectorAll("input:checked:not(:disabled)"), function (checkbox) {
      var item = candidates.filter(function (game) {
        return game.id === checkbox.value;
      })[0];
      rows.push({
        id: item.id,
        name: item.name,
        type: item.type,
        vendor: item.vendor,
        tag: isHot ? "热门" : item.tag,
        sort: rows.length + 1,
        status: "开启"
      });
    });
    renderChannelGames();
    document.getElementById("gameSelectorDrawer").hidden = true;
  });

  selectAllChannelGames.addEventListener("change", function () {
    Array.prototype.forEach.call(document.querySelectorAll(".channel-game-check"), function (checkbox) {
      checkbox.checked = selectAllChannelGames.checked;
    });
  });

  document.getElementById("batchRemoveChannelGames").addEventListener("click", function () {
    var indexes = Array.prototype.map.call(document.querySelectorAll(".channel-game-check:checked"), function (checkbox) {
      return Number(checkbox.getAttribute("data-index"));
    });
    channelGameMap[currentChannelId] = getCurrentRows().filter(function (_, index) {
      return indexes.indexOf(index) === -1;
    });
    renderChannelGames();
  });

  renderChannels();
  renderChannelGames();
}());
