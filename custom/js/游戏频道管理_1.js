(function () {
  "use strict";

  const storageKey = "business.game-center.channels.v1";
  const maxIconBytes = 512 * 1024;
  const iconTypes = new Set(["image/png", "image/jpeg", "image/webp"]);
  const catalog = new Map([
    ["102", { name: "Mahjong Ways", tone: "amber", mark: "◆" }],
    ["104", { name: "Gates of Olympus", tone: "blue", mark: "ϟ" }],
    ["105", { name: "Wild Ape", tone: "jade", mark: "♣" }],
    ["101", { name: "Wild Bounty", tone: "plum", mark: "✦" }],
    ["103", { name: "Chicken Road", tone: "red", mark: "➜" }],
    ["106", { name: "Fortune Ox", tone: "red", mark: "✺" }],
    ["107", { name: "Crazy Hunter", tone: "blue", mark: "◎" }],
    ["108", { name: "Dream Catcher", tone: "plum", mark: "◈" }]
  ]);
  const tags = [
    { key: "hot", text: "HOT" },
    { key: "fresh", text: "NEW" },
    { key: "guide", text: "手指引导" }
  ];
  const gameFlags = ["shown", "large", ...tags.map((tag) => tag.key)];
  const autoKinds = { favorites: "收藏", recent: "最近" };

  function game(id, options = {}) {
    return { id, shown: true, large: false, hot: false, fresh: false, guide: false, ...options };
  }

  function channel(id, kind, name, en, pt, symbol, games) {
    return { id, kind, name, en, pt, symbol, icon: "", selectedIcon: "", shown: true, games };
  }

  const defaults = [
    channel("hot", "hot", "热门", "Popular", "Popular", "🔥", [game("106", { hot: true }), game("107"), game("102", { fresh: true })]),
    channel("favorites", "favorites", "收藏", "Favorites", "Favoritos", "★", []),
    channel("recent", "recent", "最近", "Recent", "Recentes", "◷", []),
    channel("slots", "custom", "电子", "Slots", "Slots", "◈", [
      game("102", { fresh: true, guide: true }), game("104"), game("105", { large: true }),
      game("101", { shown: false, hot: true }), game("103", { shown: false })
    ]),
    channel("live", "custom", "真人", "Live Casino", "Cassino", "♠", [game("108")])
  ];

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function safeIcon(value) {
    return typeof value === "string" && /^data:image\/(?:png|jpeg|webp);base64,[a-z0-9+/=]+$/i.test(value);
  }

  function readSaved() {
    try {
      const value = JSON.parse(window.localStorage.getItem(storageKey));
      if (Array.isArray(value) && value.length && new Set(value.map((item) => item?.id)).size === value.length &&
          value.every((item) => item && ["id", "name", "en", "pt", "symbol"].every((key) => typeof item[key] === "string") &&
            ["custom", "hot", "favorites", "recent"].includes(item.kind) && typeof item.shown === "boolean" &&
            ["icon", "selectedIcon"].every((key) => item[key] === "" || safeIcon(item[key])) && Array.isArray(item.games) &&
            new Set(item.games.map((row) => row?.id)).size === item.games.length &&
            item.games.every((row) => row && catalog.has(row.id) && gameFlags.every((key) => typeof row[key] === "boolean")))) {
        return value;
      }
    } catch {
      // Keep the default configuration available when local storage is unavailable.
    }
    return clone(defaults);
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

  function moveButton(kind, id, name, direction, disabled) {
    const up = direction === "up";
    const label = (up ? "上移 " : "下移 ") + name;
    return '<button class="gc-move" type="button" data-gc-move="' + kind + '" data-id="' + escape(id) +
      '" data-direction="' + direction + '" aria-label="' + escape(label) + '" title="' + escape(label) +
      '"' + (disabled ? " disabled" : "") + ">" + (up ? "↑" : "↓") + "</button>";
  }

  function init() {
    const root = document.getElementById("game-channel-center");
    if (!root) return;
    const ids = [
      "edit", "add", "channel-help", "channels", "current-name", "current-meta", "channel-settings", "preview-mode",
      "preview-nav", "preview-games", "games-section", "game-help", "search", "pick", "games", "status", "edit-bar",
      "draft-status", "cancel", "save", "save-error", "channel-dialog", "channel-form", "channel-dialog-title", "name",
      "name-en", "name-pt", "icon", "icon-preview", "selected-icon", "selected-icon-preview", "channel-visible",
      "channel-error", "remove-channel", "confirm-channel", "game-dialog", "game-form", "game-dialog-title",
      "picker-search", "picked-count", "game-options"
    ];
    const el = Object.fromEntries(ids.map((id) => [id, document.getElementById("gc-" + id)]));
    if (Object.values(el).some((node) => !node)) return;

    let saved = readSaved();
    let draft = null;
    let activeId = saved.some((item) => item.id === "slots") ? "slots" : saved[0].id;
    let editStartId = activeId;
    let dirty = false;
    let channelEntry = null;
    let picked = null;

    const state = () => draft || saved;
    const current = () => state().find((item) => item.id === activeId);
    const isAuto = (item) => Boolean(item && Object.hasOwn(autoKinds, item.kind));
    const queryOf = (field) => field.value.trim().toLowerCase().replace(/^#\s*/, "");
    const shownGames = (item) => item.games.filter((row) => row.shown);
    const inputByIcon = { icon: el.icon, selectedIcon: el["selected-icon"] };
    const iconPreview = { icon: el["icon-preview"], selectedIcon: el["selected-icon-preview"] };

    function askBeforeLeaving(event) {
      event.preventDefault();
      event.returnValue = true;
    }

    function showMessage(node, message) {
      node.textContent = message;
      node.hidden = !message;
    }

    function updateBar() {
      const changed = draft !== null && JSON.stringify(draft) !== JSON.stringify(saved);
      if (dirty !== changed) {
        if (changed) window.addEventListener("beforeunload", askBeforeLeaving);
        else window.removeEventListener("beforeunload", askBeforeLeaving);
        dirty = changed;
      }
      el["draft-status"].textContent = dirty ? "有未保存的修改" : "编辑中 · 尚无修改";
      el.save.disabled = !dirty;
      showMessage(el["save-error"], "");
    }

    function renderChannels() {
      const items = state();
      el.channels.innerHTML = items.map((item, index) => {
        const selected = activeId === item.id;
        const name = escape(item.name);
        const subtitle = !item.shown ? "大厅隐藏" : isAuto(item) ? "自动频道" : "";
        return '<li class="gc-channel-row' + (selected ? ' is-current' : '') + '">' +
          '<button class="gc-channel-select" type="button" data-gc-channel="' + escape(item.id) +
          '" aria-pressed="' + selected + '" title="' + name + '"><span class="gc-index" aria-hidden="true">' + (index + 1) +
          "</span>" + iconMarkup(item, selected) + '<span class="gc-channel-text"><span>' + name + "</span>" +
          (subtitle ? "<small>" + subtitle + "</small>" : "") + "</span></button>" +
          (draft ? '<span class="gc-move-group">' + moveButton("channel", item.id, item.name, "up", index === 0) +
            moveButton("channel", item.id, item.name, "down", index === items.length - 1) + "</span>" : "") + "</li>";
      }).join("");
    }

    function renderPreview(item) {
      el["preview-mode"].textContent = draft ? "编辑预览 · 保存后生效" : "已保存配置";
      const nav = state().filter((entry) => entry.shown);
      el["preview-nav"].innerHTML = nav.map((entry) => {
        const selected = entry.id === item?.id;
        return '<span class="gc-preview-tab' + (selected ? ' is-current' : '') + '"' +
          (selected ? ' aria-current="true"' : '') + '>' +
          iconMarkup(entry, selected) + "<span>" + escape(entry.name) + "</span></span>";
      }).join("");
      const emptyMessage = !item ? "请选择频道。" : !item.shown ? "此频道已隐藏，不会出现在大厅。" :
        isAuto(item) ? "游戏由玩家的" + autoKinds[item.kind] + "记录生成。" : "暂无显示的游戏。";
      const visible = item?.shown && !isAuto(item) ? shownGames(item) : [];
      el["preview-games"].classList.toggle("is-empty", !visible.length);
      el["preview-games"].innerHTML = visible.length ? visible.map((row) => {
        const info = catalog.get(row.id);
        const badges = tags.filter((tag) => row[tag.key]).map((tag) =>
          '<span class="gc-badge is-' + tag.key + '">' + tag.text + "</span>").join("");
        return '<div class="gc-tile' + (row.large ? ' is-large' : '') + '" data-tone="' + info.tone + '">' +
          '<span class="gc-tile-mark" aria-hidden="true">' + info.mark + '</span><span class="gc-tile-name">' +
          escape(info.name) + '</span><span class="gc-tile-badges">' + badges + "</span></div>";
      }).join("") : '<p class="gc-empty">' + emptyMessage + "</p>";
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
      el["game-help"].textContent = draft && query ? "搜索时可修改展示和标签。清空搜索后可调整顺序。" :
        "已显示的游戏按顺序排列，隐藏的游戏列在下方。";
      el.games.innerHTML = rows.map((row) => {
        const position = visible.indexOf(row);
        const info = catalog.get(row.id);
        const order = row.shown ? '<span class="gc-order">' + (position + 1) + "</span>" : "—";
        return '<tr' + (row.shown ? "" : ' class="gc-game-hidden"') + '><td><span class="gc-game-name">' +
          escape(info.name) + '</span><span class="gc-game-id">#' + row.id + "</span></td>" +
          checkbox(row, "shown", "显示") + checkbox(row, "large", "大图标") +
          tags.map((tag) => checkbox(row, tag.key, tag.text)).join("") +
          '<td><span class="gc-move-group">' + order + (draft && row.shown ?
            moveButton("game", row.id, info.name, "up", position === 0 || Boolean(query)) +
            moveButton("game", row.id, info.name, "down", position === visible.length - 1 || Boolean(query)) : "") +
          "</span></td></tr>";
      }).join("") || '<tr><td colspan="7" class="gc-empty">' +
        (query ? "没有符合条件的游戏。" : draft ? "频道内暂无游戏，点击「选择游戏」添加。" : "频道内暂无游戏。") +
        "</td></tr>";
    }

    function renderDetail() {
      const item = current();
      const manual = item && !isAuto(item);
      el["current-name"].textContent = item ? item.name : "频道游戏";
      el["current-meta"].textContent = item ? [
        isAuto(item) ? "系统频道 · 由玩家记录生成" : item.kind === "hot" ? "系统频道 · 手动配置" : "自定义频道",
        item.shown ? "" : "大厅隐藏"
      ].filter(Boolean).join(" · ") : "选择左侧频道查看配置。";
      el["channel-settings"].hidden = !draft || !item;
      el["games-section"].hidden = !manual;
      el.pick.hidden = !draft || !manual;
      el.search.disabled = !manual;
      renderPreview(item);
      if (manual) renderGames(item);
    }

    function render() {
      root.classList.toggle("is-editing", Boolean(draft));
      el.edit.hidden = Boolean(draft);
      el.add.hidden = !draft;
      el["channel-help"].hidden = !draft;
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
      el.search.value = "";
      renderChannels();
      renderDetail();
      focusChannel(id);
    }

    function commitDraft() {
      if (!draft || !dirty) return;
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(draft));
      } catch {
        showMessage(el["save-error"], "无法保存。请检查浏览器存储空间后重试，修改仍保留在编辑中。");
        return;
      }
      saved = draft;
      draft = null;
      render();
      el.status.textContent = "频道配置已保存。";
      el.edit.focus({ preventScroll: true });
    }

    function cancelDraft() {
      if (!draft || (dirty && !window.confirm("放弃本次所有未保存的频道和游戏修改？"))) return;
      draft = null;
      if (!current()) activeId = saved.some((item) => item.id === editStartId) ? editStartId : saved[0].id;
      render();
      el.status.textContent = "已恢复上次保存的配置。";
      el.edit.focus({ preventScroll: true });
    }

    function openDialog(dialog) {
      dialog.hidden = false;
      dialog.showModal();
    }

    function closeDialog(dialog) {
      dialog.close();
      dialog.hidden = true;
    }

    function renderIconEntry() {
      if (!channelEntry) return;
      const fallback = channelEntry.fields.symbol || Array.from(el.name.value.trim())[0] || "◇";
      Object.keys(iconPreview).forEach((key) => {
        const source = channelEntry.fields[key];
        iconPreview[key].innerHTML = iconContent(source || (key === "selectedIcon" && channelEntry.fields.icon), fallback);
        root.querySelector('[data-gc-reset-icon="' + key + '"]').hidden = !source && !channelEntry.pending[key];
      });
      el["confirm-channel"].disabled = Object.values(channelEntry.pending).some(Boolean);
    }

    function openChannelForm(item) {
      if (!draft) return;
      channelEntry = { id: item?.id, fields: item ? { ...item } : channel("", "custom", "", "", "", "", []), pending: {} };
      const { fields } = channelEntry;
      el["channel-dialog-title"].textContent = item ? "编辑频道" : "新增频道";
      el.name.value = fields.name;
      el["name-en"].value = fields.en;
      el["name-pt"].value = fields.pt;
      el["channel-visible"].checked = fields.shown;
      el["remove-channel"].hidden = !item || item.kind !== "custom";
      Object.values(inputByIcon).forEach((input) => { input.value = ""; });
      showMessage(el["channel-error"], "");
      renderIconEntry();
      openDialog(el["channel-dialog"]);
    }

    async function readIcon(key, input) {
      const entry = channelEntry;
      if (!entry || !el["channel-dialog"].open) return;
      const file = input.files[0];
      if (!file) return;
      const ticket = Symbol();
      entry.pending[key] = ticket;
      showMessage(el["channel-error"], "");
      renderIconEntry();
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
        if (channelEntry === entry && entry.pending[key] === ticket) entry.fields[key] = source;
      } catch (error) {
        if (channelEntry === entry && entry.pending[key] === ticket && el["channel-dialog"].open) {
          showMessage(el["channel-error"], error instanceof Error ? error.message : "无法读取图片，请重新选择。");
        }
      } finally {
        if (channelEntry === entry && entry.pending[key] === ticket && el["channel-dialog"].open) {
          entry.pending[key] = null;
          input.value = "";
          renderIconEntry();
        }
      }
    }

    function closeChannelForm() {
      channelEntry = null;
      closeDialog(el["channel-dialog"]);
    }

    function applyChannelForm(event) {
      event.preventDefault();
      if (!draft || !channelEntry || el["confirm-channel"].disabled) return;
      const name = el.name.value.trim();
      if (!name || draft.some((item) => item.id !== channelEntry.id && item.name.toLowerCase() === name.toLowerCase())) {
        showMessage(el["channel-error"], name ? "已有同名频道，请更换名称。" : "请输入频道名称。");
        el.name.focus();
        return;
      }
      const fields = {
        ...channelEntry.fields, name, en: el["name-en"].value.trim(), pt: el["name-pt"].value.trim(),
        shown: el["channel-visible"].checked
      };
      if (channelEntry.id) {
        draft[draft.findIndex((item) => item.id === channelEntry.id)] = fields;
      } else {
        fields.id = "custom-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
        draft.push(fields);
        activeId = fields.id;
        el.search.value = "";
      }
      closeChannelForm();
      render();
      focusChannel(activeId);
    }

    function removeChannel() {
      if (!draft || !channelEntry?.id || channelEntry.fields.kind !== "custom") return;
      if (!window.confirm("删除此频道及其游戏配置？保存后生效。")) return;
      const index = draft.findIndex((item) => item.id === channelEntry.id);
      draft.splice(index, 1);
      activeId = (draft[index] || draft[index - 1])?.id;
      el.search.value = "";
      closeChannelForm();
      render();
      focusChannel(activeId);
    }

    function renderPicker() {
      const query = queryOf(el["picker-search"]);
      el["game-options"].innerHTML = [...catalog].filter(([id]) => matchesGame(id, query)).map(([id, info]) =>
        '<label class="gc-game-option"><input type="checkbox" value="' + id + '"' + (picked.ids.has(id) ? " checked" : "") +
        "><span>" + escape(info.name) + '<span class="gc-game-id">#' + id + "</span></span></label>"
      ).join("") || '<p class="gc-empty">没有符合条件的游戏。</p>';
      updatePickedCount();
    }

    function updatePickedCount() {
      el["picked-count"].textContent = "已选 " + picked.ids.size + " 项";
    }

    function openGamePicker() {
      const item = current();
      if (!draft || !item || isAuto(item)) return;
      picked = { channelId: item.id, ids: new Set(item.games.map((row) => row.id)) };
      el["game-dialog-title"].textContent = "选择频道游戏 · " + item.name;
      el["picker-search"].value = "";
      renderPicker();
      openDialog(el["game-dialog"]);
    }

    function applyGamePicker(event) {
      event.preventDefault();
      const item = draft?.find((entry) => entry.id === picked?.channelId);
      if (!item) return;
      const existing = new Set(item.games.map((row) => row.id));
      item.games = item.games.filter((row) => picked.ids.has(row.id))
        .concat([...picked.ids].filter((id) => !existing.has(id)).map((id) => game(id)));
      closeDialog(el["game-dialog"]);
      renderDetail();
      updateBar();
      el.pick.focus({ preventScroll: true });
    }

    el.edit.addEventListener("click", () => {
      draft = clone(saved);
      editStartId = activeId;
      el.status.textContent = "";
      render();
      focusChannel(activeId);
    });
    el.save.addEventListener("click", commitDraft);
    el.cancel.addEventListener("click", cancelDraft);
    el.add.addEventListener("click", () => openChannelForm());
    el["channel-settings"].addEventListener("click", () => openChannelForm(current()));
    el.pick.addEventListener("click", openGamePicker);
    el.search.addEventListener("input", () => { if (current()) renderGames(current()); });

    el.channels.addEventListener("click", (event) => {
      const button = event.target.closest("button");
      if (button?.dataset.gcChannel) selectChannel(button.dataset.gcChannel);
      else if (button?.dataset.gcMove) move(button);
    });
    el.games.addEventListener("click", (event) => {
      const button = event.target.closest("[data-gc-move]");
      if (button) move(button);
    });
    el.games.addEventListener("change", (event) => {
      const input = event.target;
      const item = current();
      const key = input.dataset.gcFlag;
      if (!draft || !item || !gameFlags.includes(key)) return;
      const row = item.games.find((entry) => entry.id === input.dataset.id);
      if (!row || (!row.shown && key !== "shown")) return;
      row[key] = input.checked;
      if (key === "shown") {
        // Newly displayed games go to the end of the visible order.
        item.games = item.games.filter((entry) => entry !== row).concat(row);
        renderGames(item);
        refocus(el.games.querySelectorAll('[data-gc-flag="shown"]'), (node) => node.dataset.id === row.id);
      }
      renderPreview(item);
      updateBar();
    });

    root.querySelectorAll("[data-gc-close]").forEach((button) => button.addEventListener("click", () => {
      const dialog = button.closest("dialog");
      if (dialog === el["channel-dialog"]) closeChannelForm();
      else closeDialog(dialog);
    }));
    el["channel-dialog"].addEventListener("close", () => {
      if (!el["channel-dialog"].open) {
        channelEntry = null;
        el["channel-dialog"].hidden = true;
      }
    });
    el["game-dialog"].addEventListener("close", () => {
      if (!el["game-dialog"].open) {
        picked = null;
        el["game-dialog"].hidden = true;
      }
    });
    el.name.addEventListener("input", renderIconEntry);
    Object.entries(inputByIcon).forEach(([key, input]) => input.addEventListener("change", () => readIcon(key, input)));
    root.querySelectorAll("[data-gc-reset-icon]").forEach((button) => button.addEventListener("click", () => {
      if (!channelEntry) return;
      const key = button.dataset.gcResetIcon;
      channelEntry.fields[key] = "";
      channelEntry.pending[key] = null;
      inputByIcon[key].value = "";
      showMessage(el["channel-error"], "");
      renderIconEntry();
      inputByIcon[key].focus();
    }));
    el["channel-form"].addEventListener("submit", applyChannelForm);
    el["remove-channel"].addEventListener("click", removeChannel);
    el["picker-search"].addEventListener("input", renderPicker);
    el["game-options"].addEventListener("change", (event) => {
      const input = event.target;
      if (!picked || !catalog.has(input.value)) return;
      if (input.checked) picked.ids.add(input.value);
      else picked.ids.delete(input.value);
      updatePickedCount();
    });
    el["game-form"].addEventListener("submit", applyGamePicker);

    render();
    el.edit.disabled = false;
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
