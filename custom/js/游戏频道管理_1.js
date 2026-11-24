(function () {
  "use strict";

  const storageKey = "business.game-center.channels.v1";
  const exampleRevision = 1;
  const maxIconBytes = 512 * 1024;
  const iconTypes = new Set(["image/png", "image/jpeg", "image/webp"]);
  const catalog = new Map([
    ["102", { name: "Mahjong Ways", tone: "amber", mark: "◆" }],
    ["104", { name: "Gates of Olympus", tone: "blue", mark: "ϟ" }],
    ["105", { name: "Wild Ape", tone: "jade", mark: "♣" }],
    ["101", { name: "Wild Bounty", tone: "plum", mark: "✦" }],
    ["103", { name: "Chicken Road", tone: "red", mark: "➜", category: "casual" }],
    ["106", { name: "Fortune Ox", tone: "red", mark: "✺" }],
    ["107", { name: "Crazy Hunter", tone: "blue", mark: "◎", category: "fishing" }],
    ["108", { name: "Dream Catcher", tone: "plum", mark: "◈", category: "live" }],
    ["109", { name: "Fortune Tiger", tone: "amber", mark: "✴" }],
    ["110", { name: "Black Myth: Wukong", tone: "plum", mark: "☾" }],
    ["111", { name: "Mahjong Ways 2", tone: "jade", mark: "◇" }],
    ["112", { name: "Tiger Boom", tone: "red", mark: "✹" }],
    ["113", { name: "Crazy Time", tone: "red", mark: "✸", category: "live" }],
    ["114", { name: "Lightning Roulette", tone: "blue", mark: "⚡", category: "live" }],
    ["115", { name: "Speed Baccarat", tone: "jade", mark: "♠", category: "live" }],
    ["116", { name: "Sweet Bonanza", tone: "plum", mark: "✺" }],
    ["117", { name: "Sugar Rush", tone: "red", mark: "✿" }],
    ["118", { name: "Big Bass Bonanza", tone: "blue", mark: "◉" }],
    ["119", { name: "Starlight Princess", tone: "plum", mark: "✦" }],
    ["120", { name: "Buffalo King Megaways", tone: "amber", mark: "✴" }],
    ["121", { name: "Fortune Rabbit", tone: "jade", mark: "◇" }],
    ["122", { name: "Rooster Rumble", tone: "red", mark: "✸" }],
    ["123", { name: "Aztec Gems", tone: "jade", mark: "◆" }],
    ["124", { name: "Crazy Coin Flip", tone: "amber", mark: "◎", category: "live" }],
    ["125", { name: "Monopoly Live", tone: "blue", mark: "◈", category: "live" }],
    ["126", { name: "Mega Ball", tone: "red", mark: "●", category: "live" }],
    ["127", { name: "Blackjack VIP", tone: "plum", mark: "♣", category: "live" }],
    ["128", { name: "Dragon Tiger", tone: "jade", mark: "♠", category: "live" }]
  ]);
  const categories = { slots: "电子", live: "真人", fishing: "捕鱼", casual: "休闲" };
  const gameCategory = (info) => info.category ?? "slots";
  const badgeTags = [
    { key: "hot", text: "HOT" },
    { key: "fresh", text: "NEW" }
  ];
  const oppositeTag = { hot: "fresh", fresh: "hot" };
  const gameFlags = ["shown", "large", ...badgeTags.map((tag) => tag.key), "guide"];
  const guideIcon = '<svg class="gc-tile-guide" viewBox="0 0 32 32" role="img" aria-label="手指引导" focusable="false">' +
    '<path d="M5.5 8h2M11.5 2.5v2M16 8h2" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>' +
    '<path d="M10 17V8.4a2 2 0 0 1 4 0v6.1l1.3-.8a1.8 1.8 0 0 1 2.7 1.1l.8-.4a1.8 1.8 0 0 1 2.6 1.3l.7-.3a1.8 1.8 0 0 1 2.5 1.7v4.6a6.8 6.8 0 0 1-6.8 6.8h-2.5a5 5 0 0 1-4-2l-4.7-6.2a2 2 0 0 1 3-2.6l.4.4Z" fill="#fff4da" stroke="#56371d" stroke-width="1.55" stroke-linejoin="round"/>' +
    "</svg>";
  const autoKinds = { favorites: "收藏", recent: "最近" };

  function game(id, options = {}) {
    return { id, shown: true, large: false, hot: false, fresh: false, guide: false, ...options };
  }

  function channel(id, kind, name, en, pt, symbol, games) {
    return { id, kind, name, en, pt, symbol, icon: "", selectedIcon: "", shown: true, games };
  }

  const defaults = [
    channel("hot", "hot", "热门", "Popular", "Popular", "🔥", [
      game("106", { hot: true }), game("107"), game("102", { fresh: true }),
      game("109", { hot: true }), game("112"), game("113", { hot: true })
    ]),
    channel("favorites", "favorites", "收藏", "Favorites", "Favoritos", "★", []),
    channel("recent", "recent", "最近", "Recent", "Recentes", "◷", []),
    channel("slots", "custom", "电子", "Slots", "Slots", "◈", [
      game("102", { fresh: true, guide: true }), game("104"), game("105", { large: true }),
      game("109", { hot: true }), game("110", { fresh: true }), game("111"),
      game("101", { shown: false, hot: true }), game("103", { shown: false }), game("112", { shown: false })
    ]),
    channel("live", "custom", "真人", "Live Casino", "Cassino", "♠", [
      game("108"), game("113", { hot: true }), game("114", { fresh: true }), game("115", { shown: false })
    ]),
  ];

  const extraExamples = new Map([
    ["hot", [
      game("116", { hot: true }), game("117", { fresh: true }), game("124", { hot: true }),
      game("120", { shown: false }), game("123", { shown: false }), game("125", { shown: false })
    ]],
    ["slots", [
      game("116", { hot: true }), game("118"), game("119", { fresh: true }),
      game("117", { shown: false }), game("120", { shown: false }), game("121", { shown: false }),
      game("122", { shown: false }), game("123", { shown: false })
    ]],
    ["live", [
      game("124", { fresh: true }), game("125"), game("126"),
      game("127", { shown: false }), game("128", { shown: false })
    ]]
  ]);

  function appendExamples(channels) {
    for (const item of channels) {
      const extras = extraExamples.get(item.id);
      if (!extras || !item.games.length) continue;
      const existing = new Set(item.games.map((row) => row.id));
      item.games.push(...extras.filter((row) => !existing.has(row.id)).map((row) => ({ ...row })));
    }
    return channels;
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function safeIcon(value) {
    return typeof value === "string" && /^data:image\/(?:png|jpeg|webp);base64,[a-z0-9+/=]+$/i.test(value);
  }

  function readSaved() {
    try {
      const stored = JSON.parse(window.localStorage.getItem(storageKey));
      const value = Array.isArray(stored) ? stored : stored?.channels;
      if (Array.isArray(value) && value.length && new Set(value.map((item) => item?.id)).size === value.length &&
          value.every((item) => item && ["id", "name", "en", "pt", "symbol"].every((key) => typeof item[key] === "string") &&
            ["custom", "hot", "favorites", "recent"].includes(item.kind) && typeof item.shown === "boolean" &&
            ["icon", "selectedIcon"].every((key) => item[key] === "" || safeIcon(item[key])) && Array.isArray(item.games) &&
            new Set(item.games.map((row) => row?.id)).size === item.games.length &&
            item.games.every((row) => row && catalog.has(row.id) && gameFlags.every((key) => typeof row[key] === "boolean")))) {
        for (const item of value) {
          // Older configurations could select both badges; keep HOT in that case.
          for (const row of item.games) if (row.hot && row.fresh) row.fresh = false;
        }
        return stored.exampleRevision >= exampleRevision ? value : appendExamples(value);
      }
    } catch {
      // Keep the default configuration available when local storage is unavailable.
    }
    return appendExamples(clone(defaults));
  }

  const entities = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  function escape(value) {
    return String(value).replace(/[&<>"']/g, (char) => entities[char]);
  }

  function matchesGame(id, query) {
    return !query || id.toLowerCase().includes(query) || catalog.get(id).name.toLowerCase().includes(query);
  }

  function iconContent(source, fallback) {
    return safeIcon(source) ? '<img alt="" src="' + escape(source) + '">' : escape(fallback);
  }

  function iconMarkup(item, selected) {
    const source = selected && item.selectedIcon ? item.selectedIcon : item.icon;
    return '<span aria-hidden="true" class="gc-icon' + (selected ? ' is-selected' : '') + '">' +
      iconContent(source, item.symbol || Array.from(item.name)[0] || "◇") + "</span>";
  }

  function channelName(item) {
    return item.name || "未命名频道";
  }

  function moveButton(kind, id, name, direction, disabled) {
    const up = direction === "up";
    const label = (up ? "上移 " : "下移 ") + name;
    return '<button class="gc-move" type="button" data-gc-move="' + kind + '" data-id="' + escape(id) +
      '" data-direction="' + direction + '" aria-label="' + escape(label) + '" title="' + escape(label) +
      '"' + (disabled ? " disabled" : "") + ">" + (up ? "↑" : "↓") + "</button>";
  }

  function init() {
    const root = document.getElementById("game-channel-center");
    const siteSkin = window.businessSiteSkin;
    if (!root || !siteSkin) return;
    const ids = [
      "edit", "add", "channel-help", "channels", "current-name", "current-meta", "preview", "preview-mode", "active-skin",
      "preview-nav", "preview-games", "preview-toggle", "game-help", "game-tools", "game-table", "auto-games",
      "search", "pick", "games", "game-action-heading", "status", "edit-bar",
      "draft-status", "cancel", "save", "save-error", "channel-form", "name", "name-en", "name-pt",
      "icon", "icon-preview", "selected-icon", "selected-icon-preview", "selected-icon-note", "channel-name-error",
      "channel-icon-error", "channel-languages", "channel-actions", "remove-channel", "game-dialog", "game-form", "game-dialog-title",
      "picker-search", "picker-category", "picker-all", "picker-invert", "picker-clear", "picker-submit", "picked-count", "game-options"
    ];
    const el = Object.fromEntries(ids.map((id) => [id, document.getElementById("gc-" + id)]));
    if (Object.values(el).some((node) => !node)) return;

    let activeSkin = siteSkin.readActive();
    let previewChannelId;
    let saved = readSaved();
    let draft = null;
    let activeId = saved.some((item) => item.id === "slots") ? "slots" : saved[0].id;
    let editStartId = activeId;
    let dirty = false;
    let editorId = null;
    const pendingIcons = new Map();
    const iconErrors = new Map();
    let picked = null;

    const state = () => draft || saved;
    const current = () => state().find((item) => item.id === activeId);
    const editingChannel = () => draft?.find((item) => item.id === editorId);
    const isAuto = (item) => Boolean(item && Object.hasOwn(autoKinds, item.kind));
    const queryOf = (field) => field.value.trim().toLowerCase().replace(/^#\s*/, "");
    const shownGames = (item) => item.games.filter((row) => row.shown);
    const inputByIcon = { icon: el.icon, selectedIcon: el["selected-icon"] };
    const iconPreview = { icon: el["icon-preview"], selectedIcon: el["selected-icon-preview"] };
    const editor = el["channel-form"];
    const editorHome = editor.parentElement;
    const iconButtons = Object.fromEntries(
      [...editor.querySelectorAll("[data-gc-upload]")].map((button) => [button.dataset.gcUpload, button])
    );
    const iconResets = Object.fromEntries(
      [...editor.querySelectorAll("[data-gc-reset-icon]")].map((button) => [button.dataset.gcResetIcon, button])
    );

    function askBeforeLeaving(event) {
      event.preventDefault();
      event.returnValue = true;
    }

    function showMessage(node, message) {
      node.textContent = message;
      node.hidden = !message;
    }

    function updateBar() {
      const readingIcon = pendingIcons.size > 0;
      const changed = draft !== null && (readingIcon || JSON.stringify(draft) !== JSON.stringify(saved));
      if (dirty !== changed) {
        if (changed) window.addEventListener("beforeunload", askBeforeLeaving);
        else window.removeEventListener("beforeunload", askBeforeLeaving);
        dirty = changed;
      }
      el["draft-status"].textContent = readingIcon ? "正在读取频道图标…" : dirty ? "有未保存的修改" : "编辑中 · 尚无修改";
      el.save.disabled = !dirty || readingIcon;
      showMessage(el["save-error"], "");
    }

    function channelLine(item, index, total) {
      const selected = activeId === item.id;
      const expanded = editorId === item.id;
      const name = channelName(item);
      const id = escape(item.id);
      return '<button class="gc-channel-select" type="button" data-gc-channel="' + id +
        '" aria-pressed="' + selected + '" title="' + escape(name) + '">' + iconMarkup(item, selected) +
        '<span class="gc-channel-text"><span>' + escape(name) + "</span>" +
        (isAuto(item) ? "<small>自动频道</small>" : "") + "</span></button>" +
        '<span class="gc-channel-state"><button class="cl-switch-button gc-channel-switch' + (item.shown ? ' is-on' : '') +
        '" type="button" role="switch" data-gc-toggle="' + id + '" aria-checked="' + item.shown +
        '" aria-label="' + escape(name + " 启用") + '"' + (draft ? "" : " disabled") +
        '></button><span aria-hidden="true">' + (item.shown ? "启用" : "停用") + "</span></span>" +
        '<span class="gc-move-group">' + moveButton("channel", item.id, name, "up", !draft || index === 0) +
        moveButton("channel", item.id, name, "down", !draft || index === total - 1) + "</span>" +
        '<button class="gc-link gc-channel-modify" type="button" data-gc-modify="' + id + '" aria-expanded="' + expanded +
        '" aria-label="' + escape((expanded ? "收起 " : "修改 ") + name) + '"' +
        (expanded ? ' aria-controls="gc-channel-form"' : '') + ">" + (expanded ? "收起" : "修改") + "</button>";
    }

    function channelRow(id) {
      return [...el.channels.children].find((row) => row.dataset.gcItem === id);
    }

    function renderChannels() {
      const items = state();
      el.channels.innerHTML = items.map((item, index) =>
        '<li class="gc-channel-row' + (activeId === item.id ? ' is-current' : '') + '" data-gc-item="' + escape(item.id) +
        '"><div class="gc-channel-line">' + channelLine(item, index, items.length) + "</div></li>"
      ).join("");
      const row = editorId && channelRow(editorId);
      editor.hidden = !row;
      (row || editorHome).append(editor);
    }

    function renderPreviewNav(item) {
      el["preview-nav"].innerHTML = state().filter((entry) => entry.shown).map((entry) => {
        const selected = entry.id === item?.id;
        return '<span class="gc-preview-tab' + (selected ? ' is-current' : '') + '"' +
          (selected ? ' aria-current="true"' : '') + '>' +
          iconMarkup(entry, selected) + "<span>" + escape(channelName(entry)) + "</span></span>";
      }).join("");
    }

    function renderPreview(item) {
      const landscape = siteSkin.isLandscape(activeSkin);
      const layout = landscape ? "landscape" : "portrait";
      const resetScroll = previewChannelId !== item?.id || el.preview.dataset.layout !== layout;
      el.preview.dataset.layout = layout;
      previewChannelId = item?.id;
      if (el["active-skin"].textContent !== activeSkin) el["active-skin"].textContent = activeSkin;
      el["preview-mode"].textContent = draft ? "编辑预览 · 保存后生效" : "已保存配置";
      renderPreviewNav(item);
      const emptyMessage = !item ? "请选择频道。" : !item.shown ? "此频道已停用，不会出现在大厅。" :
        isAuto(item) ? "游戏由玩家的" + autoKinds[item.kind] + "记录生成。" : "暂无显示的游戏。";
      const visible = item?.shown && !isAuto(item) ? shownGames(item) : [];
      el["preview-games"].classList.toggle("is-empty", !visible.length);
      el["preview-games"].tabIndex = visible.length ? 0 : -1;
      const tiles = visible.map((row) => {
        const info = catalog.get(row.id);
        const badges = badgeTags.filter((tag) => row[tag.key]).map((tag) =>
          '<span class="gc-badge is-' + tag.key + '">' + tag.text + "</span>").join("");
        return '<div class="gc-tile' + (landscape && row.large ? ' is-large' : '') + ' gc-game-art" data-tone="' + info.tone + '">' +
          '<span class="gc-tile-mark" aria-hidden="true">' + escape(info.mark) + '</span><span class="gc-tile-name">' +
          escape(info.name) + '</span><span class="gc-tile-badges">' + badges + "</span>" +
          (row.guide ? guideIcon : "") + "</div>";
      }).join("");
      el["preview-games"].innerHTML = tiles ? '<div class="gc-preview-tiles">' + tiles + "</div>" :
        '<p class="gc-empty">' + emptyMessage + "</p>";
      if (resetScroll) {
        el["preview-nav"].scrollLeft = 0;
        el["preview-games"].scrollLeft = 0;
        el["preview-games"].scrollTop = 0;
      }
    }

    function syncPreviewSkin() {
      const nextSkin = siteSkin.readActive();
      if (nextSkin === activeSkin) return;
      activeSkin = nextSkin;
      renderPreview(current());
    }

    function checkbox(row, key, title) {
      const inputLabel = catalog.get(row.id).name + "：" + title;
      return '<td><label class="gc-check"><input type="checkbox" data-gc-flag="' + key + '" data-id="' + row.id + '" aria-label="' +
        escape(inputLabel) + '"' + (key === "large" ? ' aria-describedby="gc-large-help"' : "") +
        (row[key] ? " checked" : "") + (!draft || (key !== "shown" && !row.shown) ? " disabled" : "") + "></label></td>";
    }

    function renderGames(item) {
      const query = queryOf(el.search);
      const visible = shownGames(item);
      const rows = visible.concat(item.games.filter((row) => !row.shown)).filter((row) => matchesGame(row.id, query));
      el["game-action-heading"].hidden = !draft;
      el["game-help"].textContent = (draft && query ? "清空搜索后可调整顺序。" : "已显示的游戏排在前面。") +
        " HOT 与 NEW 只能选一个。";
      el.games.innerHTML = rows.map((row) => {
        const position = visible.indexOf(row);
        const info = catalog.get(row.id);
        const order = row.shown ? '<span class="gc-order">' + (position + 1) + "</span>" : "—";
        return '<tr' + (row.shown ? "" : ' class="gc-game-hidden"') + '><td><span class="gc-game-name">' +
          escape(info.name) + '</span><span class="gc-game-id">#' + row.id + "</span></td>" +
          '<td><span class="gc-game-thumb gc-game-art" data-tone="' + info.tone + '" aria-hidden="true">' +
          escape(info.mark) + "</span></td>" +
          checkbox(row, "shown", "显示") + checkbox(row, "large", "大图标") +
          badgeTags.map((tag) => checkbox(row, tag.key, tag.text)).join("") + checkbox(row, "guide", "手指引导") +
          '<td><span class="gc-move-group">' + order + (draft && row.shown ?
            moveButton("game", row.id, info.name, "up", position === 0 || Boolean(query)) +
            moveButton("game", row.id, info.name, "down", position === visible.length - 1 || Boolean(query)) : "") +
          "</span></td>" + (draft ?
            '<td class="gc-game-action-col"><button class="gc-link gc-danger gc-game-remove" type="button" data-gc-remove-game="' +
            row.id + '" aria-label="' + escape("移出 " + info.name) + '">移出</button></td>' : "") + "</tr>";
      }).join("") || '<tr><td colspan="' + (draft ? 9 : 8) + '" class="gc-empty">' +
        (query ? "没有符合条件的游戏。" : draft ? "频道内暂无游戏，点击「添加游戏」添加。" : "频道内暂无游戏。") +
        "</td></tr>";
    }

    function removeGame(button) {
      const item = current();
      if (!draft || !item || isAuto(item)) return;
      const id = button.dataset.gcRemoveGame;
      if (!item.games.some((row) => row.id === id)) return;
      const name = catalog.get(id).name;
      if (!window.confirm("将「" + name + "」移出频道？保存后会清除它在本频道的设置。临时隐藏可取消勾选「显示」。")) return;
      const selector = "[data-gc-remove-game]";
      const position = Array.from(el.games.querySelectorAll(selector)).indexOf(button);
      item.games = item.games.filter((row) => row.id !== id);
      renderGames(item);
      renderPreview(item);
      updateBar();
      const remaining = el.games.querySelectorAll(selector);
      (remaining[position] || remaining[position - 1] || el.pick).focus({ preventScroll: true });
    }

    function renderDetailHeading(item) {
      el["current-name"].textContent = item ? channelName(item) : "频道游戏";
      el["current-meta"].textContent = item ? [
        isAuto(item) ? "系统频道 · 由玩家记录生成" : item.kind === "hot" ? "系统频道 · 手动配置" : "自定义频道",
        item.shown ? "" : "已停用"
      ].filter(Boolean).join(" · ") : "选择左侧频道查看配置。";
    }

    function renderDetail() {
      const item = current();
      const manual = item && !isAuto(item);
      renderDetailHeading(item);
      el["game-help"].hidden = !manual;
      el["game-tools"].hidden = !manual;
      el["game-table"].hidden = !manual;
      showMessage(el["auto-games"], manual ? "" : item ?
        "此频道由玩家的" + autoKinds[item.kind] + "记录生成，无需配置游戏列表。" : "请选择频道。");
      el.pick.hidden = !draft || !manual;
      el.search.disabled = !manual;
      renderPreview(item);
      if (manual) renderGames(item);
      else el.games.innerHTML = "";
    }

    function render() {
      root.classList.toggle("is-editing", Boolean(draft));
      el.edit.hidden = Boolean(draft);
      el.add.hidden = !draft;
      el["channel-help"].textContent = draft ? "启用即在大厅显示，点击 ↑ ↓ 调整频道顺序。" :
        "启用的频道会出现在大厅。点击「编辑」可调整开关和顺序。";
      el["edit-bar"].hidden = !draft;
      renderChannels();
      renderDetail();
      updateBar();
    }

    function refocus(nodes, predicate, fallback) {
      const node = Array.from(nodes).find((candidate) => predicate(candidate) && !candidate.disabled);
      (node || fallback)?.focus({ preventScroll: true });
    }

    function focusChannel(id) {
      refocus(el.channels.querySelectorAll("[data-gc-channel]"), (button) => button.dataset.gcChannel === id, el.edit);
    }

    function move(button) {
      if (!draft || button.disabled) return;
      const { gcMove: kind, id, direction } = button.dataset;
      const delta = direction === "up" ? -1 : 1;
      if (kind === "channel") {
        const index = draft.findIndex((item) => item.id === id);
        if (index < 0 || !draft[index + delta]) return;
        [draft[index], draft[index + delta]] = [draft[index + delta], draft[index]];
        renderChannels();
        renderPreview(current());
      } else {
        const item = current();
        if (!item || queryOf(el.search)) return;
        const visible = shownGames(item);
        const index = visible.findIndex((row) => row.id === id);
        if (index < 0 || !visible[index + delta]) return;
        [visible[index], visible[index + delta]] = [visible[index + delta], visible[index]];
        item.games = visible.concat(item.games.filter((row) => !row.shown));
        renderDetail();
      }
      const container = kind === "channel" ? el.channels : el.games;
      const siblings = [...container.querySelectorAll("[data-gc-move]")].filter((node) => node.dataset.id === id && !node.disabled);
      (siblings.find((node) => node.dataset.direction === direction) || siblings[0])?.focus({ preventScroll: true });
      updateBar();
    }

    function selectChannel(id) {
      if (id === activeId || !state().some((item) => item.id === id)) return;
      activeId = id;
      editorId = null;
      el.search.value = "";
      renderChannels();
      renderDetail();
      focusChannel(id);
    }

    function commitDraft() {
      if (!draft || !dirty || pendingIcons.size) return;
      const invalid = [editingChannel(), ...draft].find((item) => item && nameIssue(item));
      if (invalid) {
        openChannelEditor(invalid.id);
        return;
      }
      try {
        window.localStorage.setItem(storageKey, JSON.stringify({ exampleRevision, channels: draft }));
      } catch {
        showMessage(el["save-error"], "无法保存。请检查浏览器存储空间后重试，修改仍保留在编辑中。");
        return;
      }
      saved = draft;
      finishEditing();
      render();
      el.status.textContent = "频道配置已保存。";
      el.edit.focus({ preventScroll: true });
    }

    function cancelDraft() {
      if (!draft || (dirty && !window.confirm("放弃本次所有未保存的频道和游戏修改？"))) return;
      finishEditing();
      if (!current()) activeId = saved.some((item) => item.id === editStartId) ? editStartId : saved[0].id;
      render();
      el.status.textContent = "已恢复上次保存的配置。";
      el.edit.focus({ preventScroll: true });
    }

    function startEditing() {
      if (draft) return;
      draft = clone(saved);
      editStartId = activeId;
      el.status.textContent = "";
    }

    function finishEditing() {
      draft = null;
      editorId = null;
      pendingIcons.clear();
      iconErrors.clear();
    }

    function openDialog(dialog) {
      dialog.hidden = false;
      dialog.showModal();
    }

    function closeDialog(dialog) {
      dialog.close();
      dialog.hidden = true;
    }

    function renderEditorIcons(item) {
      const fallback = item.symbol || Array.from(item.name)[0] || "◇";
      const pending = pendingIcons.get(item);
      Object.keys(iconPreview).forEach((key) => {
        const source = item[key];
        iconPreview[key].innerHTML = iconContent(source || (key === "selectedIcon" && item.icon), fallback);
        iconResets[key].hidden = !source && !pending?.has(key);
      });
      el["selected-icon-note"].textContent = item.selectedIcon ? "替换" : "沿用普通图标";
      showMessage(el["channel-icon-error"], iconErrors.get(item) || "");
    }

    function nameIssue(item) {
      const name = item.name.trim().toLowerCase();
      if (!name) return "请输入频道名称。";
      return draft.some((other) => other !== item && other.name.trim().toLowerCase() === name) ?
        "已有同名频道，请更换名称。" : "";
    }

    function renderNameIssue(item) {
      const message = nameIssue(item);
      el.name.setAttribute("aria-invalid", String(Boolean(message)));
      showMessage(el["channel-name-error"], message);
    }

    function openChannelEditor(id) {
      startEditing();
      const item = draft.find((entry) => entry.id === id);
      if (!item) return;
      if (id !== activeId) el.search.value = "";
      if (id !== editorId) {
        el["channel-languages"].open = false;
        el["channel-actions"].open = false;
      }
      activeId = editorId = id;
      el.name.value = item.name;
      el["name-en"].value = item.en;
      el["name-pt"].value = item.pt;
      el["channel-actions"].hidden = item.kind !== "custom";
      renderNameIssue(item);
      renderEditorIcons(item);
      render();
      el.name.focus();
    }

    function toggleChannelEditor(id) {
      if (editorId !== id) {
        openChannelEditor(id);
        return;
      }
      editorId = null;
      renderChannels();
      refocus(el.channels.querySelectorAll("[data-gc-modify]"), (button) => button.dataset.gcModify === id);
    }

    function addChannel() {
      if (!draft) return;
      const unnamed = draft.find((item) => !item.name);
      if (unnamed) {
        openChannelEditor(unnamed.id);
        return;
      }
      const id = "custom-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
      draft.push(channel(id, "custom", "", "", "", "", []));
      openChannelEditor(id);
    }

    function updateChannelAppearance(item) {
      const items = state();
      const line = channelRow(item.id)?.querySelector(".gc-channel-line");
      if (line) line.innerHTML = channelLine(item, items.indexOf(item), items.length);
      renderDetailHeading(current());
      renderPreviewNav(current());
    }

    function toggleChannel(button) {
      const item = draft?.find((entry) => entry.id === button.dataset.gcToggle);
      if (!item || button.disabled) return;
      item.shown = !item.shown;
      button.classList.toggle("is-on", item.shown);
      button.setAttribute("aria-checked", String(item.shown));
      button.nextElementSibling.textContent = item.shown ? "启用" : "停用";
      renderDetailHeading(current());
      renderPreview(current());
      updateBar();
    }

    function clearIconTicket(item, key) {
      const pending = pendingIcons.get(item);
      if (!pending) return;
      pending.delete(key);
      if (!pending.size) pendingIcons.delete(item);
    }

    async function readIcon(key, input) {
      const item = editingChannel();
      const file = input.files[0];
      input.value = "";
      if (!item || !file) return;
      const ticket = Symbol();
      const pending = pendingIcons.get(item) || new Map();
      pending.set(key, ticket);
      pendingIcons.set(item, pending);
      const isCurrentRead = () => pendingIcons.get(item)?.get(key) === ticket;
      iconErrors.delete(item);
      renderEditorIcons(item);
      updateBar();
      try {
        if (!iconTypes.has(file.type) || file.size > maxIconBytes) {
          throw new Error("请选择 512 KB 以内的 PNG、JPG 或 WebP 图片。");
        }
        const source = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        if (!safeIcon(source)) throw new Error("图片格式无法读取，请重新选择。");
        const image = new Image();
        image.src = source;
        await image.decode().catch(() => { throw new Error("图片无法预览，请重新选择。"); });
        if (isCurrentRead()) {
          item[key] = source;
          updateChannelAppearance(item);
        }
      } catch (error) {
        if (isCurrentRead()) iconErrors.set(item, error instanceof Error ? error.message : "无法读取图片，请重新选择。");
      } finally {
        if (isCurrentRead()) {
          clearIconTicket(item, key);
          if (editingChannel() === item) renderEditorIcons(item);
          updateBar();
        }
      }
    }

    function removeChannel() {
      const item = editingChannel();
      if (!item || item.kind !== "custom") return;
      if (!window.confirm("删除「" + channelName(item) + "」及其游戏配置？保存后生效。")) return;
      const index = draft.indexOf(item);
      pendingIcons.delete(item);
      iconErrors.delete(item);
      draft.splice(index, 1);
      activeId = (draft[index] || draft[index - 1])?.id;
      editorId = null;
      el.search.value = "";
      render();
      focusChannel(activeId);
    }

    const pickerActions = ["all", "invert", "clear"];
    el["picker-category"].innerHTML = '<option value="">全部分类</option>' +
      Object.entries(categories).map(([id, name]) => '<option value="' + id + '">' + name + "</option>").join("");

    function renderPicker() {
      if (!picked) return;
      const query = queryOf(el["picker-search"]);
      const category = el["picker-category"].value;
      const results = [...catalog].filter(([id, info]) => (!category || gameCategory(info) === category) && matchesGame(id, query));
      picked.candidates = results.filter(([id]) => !picked.existing.has(id)).map(([id]) => id);
      el["game-options"].innerHTML = results.map(([id, info]) => {
        const existing = picked.existing.has(id);
        return '<label class="gc-game-option' + (existing ? ' is-existing' : '') +
          '"><input type="checkbox" value="' + id + '"' + (existing ? " checked disabled" : picked.ids.has(id) ? " checked" : "") +
          '><span class="gc-game-option-detail">' + escape(info.name) + '<span class="gc-game-id">#' + id +
          '</span></span><span class="gc-game-option-category">' + categories[gameCategory(info)] + "</span>" +
          (existing ? '<span class="gc-game-option-status">已加入</span>' : "") + "</label>";
      }).join("") || '<p class="gc-empty">没有符合条件的游戏。</p>';
      el["game-options"].scrollTop = 0;
      pickerActions.forEach((action) => { el["picker-" + action].disabled = !picked.candidates.length; });
      updatePickedCount();
    }

    function updatePickedCount() {
      const visibleSelected = picked.candidates.filter((id) => picked.ids.has(id)).length;
      el["picked-count"].textContent = "当前 " + visibleSelected + "/" + picked.candidates.length + " 款可添加 · 共选 " + picked.ids.size + " 款";
      el["picker-submit"].disabled = !picked.ids.size;
    }

    function applyPickerAction(action) {
      if (!picked) return;
      for (const id of picked.candidates) {
        if (action === "all" || (action === "invert" && !picked.ids.has(id))) picked.ids.add(id);
        else picked.ids.delete(id);
      }
      el["game-options"].querySelectorAll('input[type="checkbox"]').forEach((input) => {
        if (!input.disabled) input.checked = picked.ids.has(input.value);
      });
      updatePickedCount();
    }

    function openGamePicker() {
      const item = current();
      if (!draft || !item || isAuto(item)) return;
      picked = { channelId: item.id, existing: new Set(item.games.map((row) => row.id)), ids: new Set() };
      el["game-dialog-title"].textContent = "添加频道游戏 · " + channelName(item);
      el["picker-search"].value = "";
      el["picker-category"].value = "";
      renderPicker();
      openDialog(el["game-dialog"]);
    }

    function applyGamePicker(event) {
      event.preventDefault();
      const item = draft?.find((entry) => entry.id === picked?.channelId);
      if (!item || !picked.ids.size) return;
      const existing = new Set(item.games.map((row) => row.id));
      item.games.push(...[...picked.ids].filter((id) => !existing.has(id)).map((id) => game(id)));
      el.search.value = "";
      closeDialog(el["game-dialog"]);
      renderDetail();
      updateBar();
      el.pick.focus({ preventScroll: true });
    }

    el.edit.addEventListener("click", () => {
      startEditing();
      render();
      focusChannel(activeId);
    });
    el.save.addEventListener("click", commitDraft);
    el.cancel.addEventListener("click", cancelDraft);
    el.add.addEventListener("click", addChannel);
    el.pick.addEventListener("click", openGamePicker);
    const previewToggle = el["preview-toggle"];
    previewToggle.addEventListener("click", () => {
      const collapsed = el.preview.classList.toggle("is-collapsed");
      const label = collapsed ? "展开" : "收起";
      previewToggle.textContent = label;
      previewToggle.setAttribute("aria-label", label + "大厅预览");
      previewToggle.setAttribute("aria-expanded", String(!collapsed));
    });
    previewToggle.hidden = false;
    el.search.addEventListener("input", () => { if (current()) renderGames(current()); });

    el.channels.addEventListener("click", (event) => {
      const button = event.target.closest("button");
      if (button?.dataset.gcChannel) selectChannel(button.dataset.gcChannel);
      else if (button?.dataset.gcToggle) toggleChannel(button);
      else if (button?.dataset.gcMove) move(button);
      else if (button?.dataset.gcModify) toggleChannelEditor(button.dataset.gcModify);
    });
    el.games.addEventListener("click", (event) => {
      const button = event.target.closest("button");
      if (button?.dataset.gcMove) move(button);
      else if (button?.dataset.gcRemoveGame) removeGame(button);
    });
    el.games.addEventListener("change", (event) => {
      const input = event.target;
      const item = current();
      const key = input.dataset.gcFlag;
      if (!draft || !item || !gameFlags.includes(key)) return;
      const row = item.games.find((entry) => entry.id === input.dataset.id);
      if (!row || (!row.shown && key !== "shown")) return;
      row[key] = input.checked;
      const opposite = oppositeTag[key];
      if (input.checked && opposite) {
        row[opposite] = false;
        const otherInput = input.closest("tr")?.querySelector('[data-gc-flag="' + opposite + '"]');
        if (otherInput) otherInput.checked = false;
      }
      if (key === "shown") {
        // Newly displayed games go to the end of the visible order.
        item.games = item.games.filter((entry) => entry !== row).concat(row);
        renderGames(item);
        refocus(el.games.querySelectorAll('[data-gc-flag="shown"]'), (node) => node.dataset.id === row.id);
      }
      renderPreview(item);
      updateBar();
    });

    el["game-dialog"].querySelectorAll("[data-gc-close]").forEach((button) => button.addEventListener("click", () => {
      closeDialog(el["game-dialog"]);
    }));
    el["game-dialog"].addEventListener("close", () => {
      if (!el["game-dialog"].open) {
        picked = null;
        el["game-dialog"].hidden = true;
      }
    });
    el.name.addEventListener("input", () => {
      const item = editingChannel();
      if (!item) return;
      item.name = el.name.value.trim();
      renderNameIssue(item);
      renderEditorIcons(item);
      updateChannelAppearance(item);
      updateBar();
    });
    for (const language of ["en", "pt"]) {
      const input = el["name-" + language];
      input.addEventListener("input", () => {
        const item = editingChannel();
        if (!item) return;
        item[language] = input.value.trim();
        updateBar();
      });
    }
    for (const [key, input] of Object.entries(inputByIcon)) {
      iconButtons[key].addEventListener("click", () => input.click());
      input.addEventListener("change", () => readIcon(key, input));
      iconResets[key].addEventListener("click", () => {
        const item = editingChannel();
        if (!item) return;
        item[key] = "";
        clearIconTicket(item, key);
        iconErrors.delete(item);
        renderEditorIcons(item);
        updateChannelAppearance(item);
        updateBar();
        iconButtons[key].focus();
      });
    }
    el["remove-channel"].addEventListener("click", removeChannel);
    el["picker-search"].addEventListener("input", renderPicker);
    el["picker-search"].addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.isComposing) event.preventDefault();
    });
    el["picker-category"].addEventListener("change", renderPicker);
    pickerActions.forEach((action) => el["picker-" + action].addEventListener("click", () => applyPickerAction(action)));
    el["game-options"].addEventListener("change", (event) => {
      const input = event.target;
      if (!picked || input.disabled || !picked.candidates.includes(input.value)) return;
      if (input.checked) picked.ids.add(input.value);
      else picked.ids.delete(input.value);
      updatePickedCount();
    });
    el["game-form"].addEventListener("submit", applyGamePicker);

    window.addEventListener("storage", (event) => {
      if (event.key === siteSkin.storageKey || event.key === null) syncPreviewSkin();
    });
    window.addEventListener("pageshow", syncPreviewSkin);
    window.addEventListener("focus", syncPreviewSkin);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") syncPreviewSkin();
    });

    render();
    el.edit.disabled = false;
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
