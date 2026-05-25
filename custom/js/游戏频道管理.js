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
    // 检查是否为自定义多选组件
    var customContainer = document.querySelector('[data-multiselect="' + select.id + '"]');
    if (customContainer) {
      var checkboxes = customContainer.querySelectorAll('.multiselect-option input[type="checkbox"]');
      var selectedValues = Array.isArray(selectedValue) ? selectedValue : [];
      checkboxes.forEach(function(checkbox) {
        checkbox.checked = selectedValues.indexOf(checkbox.value) !== -1;
      });
      // 更新标签显示
      var updateTags = function(container) {
        var tagsContainer = container.querySelector('.multiselect-tags');
        var input = container.querySelector('.multiselect-input');
        var options = container.querySelectorAll('.multiselect-option input[type="checkbox"]');
        tagsContainer.innerHTML = '';
        var displayValues = [];
        options.forEach(function(option) {
          if (option.checked) {
            displayValues.push(option.value);
            var tag = document.createElement('span');
            tag.className = 'multiselect-tag';
            tag.innerHTML = option.value + '<span class="tag-remove" data-value="' + option.value + '">×</span>';
            tagsContainer.appendChild(tag);
          }
        });
        input.value = displayValues.length > 0 ? '已选 ' + displayValues.length + ' 项' : '';
      };
      updateTags(customContainer);
      return;
    }
    var isMultiple = select.hasAttribute("multiple");
    if (isMultiple) {
      select.innerHTML = values.map(optionHtml).join("");
      var selectedValues = Array.isArray(selectedValue) ? selectedValue : [];
      Array.from(select.options).forEach(function (option) {
        option.selected = selectedValues.indexOf(option.value) !== -1;
      });
    } else {
      var options = ["全部"].concat(values);
      select.innerHTML = options.map(optionHtml).join("");
      select.value = options.indexOf(selectedValue) === -1 ? "全部" : selectedValue;
    }
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
      var manageAction = (item.userData || item.hot)
        ? ""
        : "<button class=\"link-btn\" type=\"button\" data-open-modal=\"channelGamesModal\" data-index=\"" + index + "\">游戏配置</button>";
      var channelName = (item.userData || item.hot) ? item.name.zh : ("<div>zh:" + item.name.zh + "</div><div>en:" + item.name.en + "</div><div>pt:" + item.name.pt + "</div>");
      var gameTypes = Array.isArray(item.gameTypes) ? item.gameTypes.join(" / ") : item.gameTypes;
      var vendors = Array.isArray(item.vendors) ? item.vendors.join(" / ") : item.vendors;
      return [
        "<tr>",
        "<td>" + item.content + "</td>",
        "<td>" + channelName + "</td>",
        "<td>" + iconCell(item.icon) + "</td>",
        "<td>" + iconCell(item.selectedIcon) + "</td>",
        "<td>" + gameTypes + "</td>",
        "<td>" + vendors + "</td>",
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
      document.getElementById("channelNameInput").value = channel ? channel.name.zh : "";
      document.getElementById("channelNameInput").disabled = channel && (channel.userData || channel.hot);
      document.getElementById("channelEnabledInput").checked = channel ? channel.enabled : true;
      var gameTypes = channel && channel.gameTypes !== "-" ? channel.gameTypes.split(" / ") : [];
      var vendors = channel && channel.vendors !== "-" ? channel.vendors.split(" / ") : [];
      fillSelect(gameScopeTypeInput, allGameTypes, gameTypes);
      fillSelect(gameScopeVendorInput, allVendors, vendors);
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

  // 事件绑定 - 使用事件委托处理动态生成的元素
  document.addEventListener("click", function (e) {
    var openModalBtn = e.target.closest("[data-open-modal]");
    if (openModalBtn) {
      var modalId = openModalBtn.getAttribute("data-open-modal");
      openModal(modalId, openModalBtn);
      return;
    }

    var closeModalBtn = e.target.closest("[data-close-modal]");
    if (closeModalBtn) {
      closeLayer(closeModalBtn);
      return;
    }

    var closeSelectorBtn = e.target.closest("[data-close-selector]");
    if (closeSelectorBtn) {
      closeLayer(closeSelectorBtn);
      return;
    }

    var mask = e.target.closest(".modal-mask, .drawer-mask");
    if (mask) {
      closeLayer(mask);
    }
  });

  document.querySelectorAll("[data-lang-tab]").forEach(function (tab) {
    tab.addEventListener("click", function () {
      var lang = tab.getAttribute("data-lang-tab");
      var form = tab.closest(".channel-form");
      form.querySelectorAll(".language-tabs button").forEach(function (t) {
        t.classList.remove("active");
      });
      tab.classList.add("active");
      form.querySelectorAll(".language-inputs label").forEach(function (label) {
        label.hidden = label.getAttribute("data-lang-panel") !== lang;
      });
    });
  });

  function updateSelectedCount() {
    var count = candidateList.querySelectorAll("input:checked:not(:disabled)").length;
    selectedCount.textContent = count;
  }

  document.getElementById("openGameSelector").addEventListener("click", function () {
    renderCandidates();
    document.getElementById("gameSelectorDrawer").hidden = false;
  });

  document.getElementById("addSelectedGames").addEventListener("click", function () {
    var channel = getCurrentChannel();
    var rows = getCurrentRows();
    var checked = candidateList.querySelectorAll("input:checked:not(:disabled)");
    checked.forEach(function (input) {
      var id = input.value;
      var exists = rows.some(function (game) {
        return game.id === id;
      });
      if (!exists) {
        var candidate = candidates.find(function (c) {
          return c.id === id;
        });
        if (candidate) {
          rows.push({
            id: candidate.id,
            name: candidate.name,
            type: candidate.type,
            vendor: candidate.vendor,
            tag: candidate.tag,
            sort: rows.length + 1,
            status: "开启"
          });
        }
      }
    });
    renderChannelGames();
    renderCandidates();
    updateSelectedCount();
  });

  document.getElementById("batchRemoveChannelGames").addEventListener("click", function () {
    var checked = channelGameRows.querySelectorAll(".channel-game-check:checked");
    if (checked.length === 0) {
      alert("请先选择要移除的游戏");
      return;
    }
    var rows = getCurrentRows();
    var indices = [];
    checked.forEach(function (input) {
      indices.push(Number(input.getAttribute("data-index")));
    });
    indices.sort(function (a, b) {
      return b - a;
    });
    indices.forEach(function (index) {
      rows.splice(index, 1);
    });
    renderChannelGames();
  });

  document.getElementById("selectAllChannelGames").addEventListener("change", function () {
    var checks = channelGameRows.querySelectorAll(".channel-game-check");
    checks.forEach(function (check) {
      check.checked = selectAllChannelGames.checked;
    });
  });

  candidateList.addEventListener("change", function (e) {
    if (e.target.matches("input[type='checkbox']")) {
      updateSelectedCount();
    }
  });

  channelGameRows.addEventListener("click", function (e) {
    if (e.target.matches(".remove-btn")) {
      var index = Number(e.target.getAttribute("data-index"));
      var rows = getCurrentRows();
      rows.splice(index, 1);
      renderChannelGames();
    }
  });

  document.querySelectorAll(".channel-table .remove-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      if (confirm("确定要删除该频道吗？")) {
        alert("删除成功");
      }
    });
  });

  // 自定义多选组件
  function initMultiSelects() {
    document.querySelectorAll('.custom-multiselect').forEach(function(container) {
      var trigger = container.querySelector('.multiselect-trigger');
      var dropdown = container.querySelector('.multiselect-dropdown');
      var selectAllCheckbox = container.querySelector('.select-all-checkbox');
      var options = container.querySelectorAll('.multiselect-option input[type="checkbox"]');
      var tagsContainer = container.querySelector('.multiselect-tags');
      var input = container.querySelector('.multiselect-input');

      // 展开/收起
      trigger.addEventListener('click', function(e) {
        e.stopPropagation();
        var isHidden = dropdown.hidden;
        // 关闭其他下拉框
        document.querySelectorAll('.multiselect-dropdown').forEach(function(dd) {
          dd.hidden = true;
        });
        document.querySelectorAll('.multiselect-trigger').forEach(function(tr) {
          tr.classList.remove('active');
        });
        if (isHidden) {
          dropdown.hidden = false;
          trigger.classList.add('active');
        }
      });

      // 全选
      selectAllCheckbox.addEventListener('change', function() {
        options.forEach(function(option) {
          option.checked = selectAllCheckbox.checked;
        });
        updateTags(container);
      });

      // 单个选项
      options.forEach(function(option) {
        option.addEventListener('change', function() {
          updateSelectAllState(container);
          updateTags(container);
        });
      });

      // 点击外部关闭
      document.addEventListener('click', function(e) {
        if (!container.contains(e.target)) {
          dropdown.hidden = true;
          trigger.classList.remove('active');
        }
      });

      // 更新全选状态
      function updateSelectAllState(container) {
        var checkedCount = container.querySelectorAll('.multiselect-option input:checked').length;
        selectAllCheckbox.checked = checkedCount === options.length;
        selectAllCheckbox.indeterminate = checkedCount > 0 && checkedCount < options.length;
      }

      // 更新标签
      function updateTags(container) {
        tagsContainer.innerHTML = '';
        var selectedValues = [];
        options.forEach(function(option) {
          if (option.checked) {
            selectedValues.push(option.value);
            var tag = document.createElement('span');
            tag.className = 'multiselect-tag';
            tag.innerHTML = option.value + '<span class="tag-remove" data-value="' + option.value + '">×</span>';
            tagsContainer.appendChild(tag);
          }
        });
        // 更新输入框显示
        input.value = selectedValues.length > 0 ? '已选 ' + selectedValues.length + ' 项' : '';
        input.placeholder = selectedValues.length === 0 ? input.placeholder : input.placeholder;
      }

      // 删除标签
      tagsContainer.addEventListener('click', function(e) {
        if (e.target.classList.contains('tag-remove')) {
          var value = e.target.getAttribute('data-value');
          var checkbox = container.querySelector('.multiselect-option input[value="' + value + '"]');
          if (checkbox) {
            checkbox.checked = false;
            updateSelectAllState(container);
            updateTags(container);
          }
        }
      });
    });
  }

  // 初始化多选组件
  initMultiSelects();

  // 初始化渲染
  renderChannels();
  renderChannelGames();
})();
