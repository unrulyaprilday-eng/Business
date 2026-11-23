(function () {
  "use strict";

  const storageKey = "business.site-front.side-menu.v1";

  function init() {
    const panel = document.getElementById("sideMenuSettings");
    if (!panel) return;
    const fields = Object.fromEntries([
      "Edit", "Channels", "Entries", "ChannelTiles", "EntryTiles",
      "Empty", "PreviewNote", "Actions", "Error", "Cancel", "Save", "Status"
    ].map((name) => [name, panel.querySelector("#sideMenu" + name)]));
    if (Object.values(fields).some((field) => !field)) return;

    function make(tag, className, content) {
      const node = document.createElement(tag);
      if (className) node.className = className;
      if (content) node.textContent = content;
      return node;
    }

    function moveButton(glyph, label) {
      const button = make("button", "", glyph);
      button.type = "button";
      button.setAttribute("aria-label", label);
      return button;
    }

    const groups = {
      channels: { body: fields.Channels, tiles: fields.ChannelTiles },
      entries: { body: fields.Entries, tiles: fields.EntryTiles }
    };
    for (const group of Object.values(groups)) {
      group.views = new Map();
      group.defaults = [...group.body.querySelectorAll("[data-side-entry]")].map((row) => {
        const id = row.dataset.sideEntry;
        const name = row.querySelector("th").textContent;
        const icon = row.querySelector(".side-menu-icon");
        const status = row.querySelector(".side-menu-visibility");
        const position = row.querySelector("[data-side-position]");
        const checkbox = make("input");
        checkbox.type = "checkbox";
        checkbox.setAttribute("aria-label", "显示" + name);
        status.after(checkbox);

        const order = make("span", "side-menu-order");
        const grip = make("span", "side-menu-grip", "⠿");
        grip.draggable = true;
        grip.title = "拖动调整" + name + "的位置";
        grip.setAttribute("aria-hidden", "true");
        const up = moveButton("↑", "上移" + name);
        const down = moveButton("↓", "下移" + name);
        order.append(grip, up, down);
        position.after(order);
        group.views.set(id, { row, name, icon, status, position, checkbox, order, grip, up, down });
        return { id, visible: row.dataset.visible === "true" };
      });
    }

    function restoreList(value, group) {
      if (!Array.isArray(value)) return group.defaults;
      const seen = new Set();
      const items = value.filter((entry) => {
        if (!entry || !group.views.has(entry.id) || seen.has(entry.id) || typeof entry.visible !== "boolean") return false;
        seen.add(entry.id);
        return true;
      });
      return items.concat(group.defaults.filter((entry) => !seen.has(entry.id)));
    }

    function load() {
      let stored;
      try {
        stored = JSON.parse(window.localStorage.getItem(storageKey));
      } catch {
        // Use the static sample when storage is unavailable.
      }
      return {
        channels: restoreList(stored?.channels, groups.channels),
        entries: restoreList(stored?.entries, groups.entries)
      };
    }

    let saved = load();
    let draft = null;
    let drag = null;
    let target = null;

    function error(message) {
      fields.Error.textContent = message;
      fields.Error.hidden = !message;
    }

    function clearTarget() {
      if (target) delete target.dataset.dropEdge;
      target = null;
    }

    function clearDrag() {
      if (drag) groups[drag.group].views.get(drag.id).row.classList.remove("is-dragging");
      drag = null;
      clearTarget();
    }

    function renderTiles(group, list) {
      group.tiles.replaceChildren(...list.map((entry) => {
        const view = group.views.get(entry.id);
        const node = make("li");
        node.append(view.icon.cloneNode(true), make("span", "side-menu-tile-name", view.name));
        return node;
      }));
      group.tiles.hidden = list.length === 0;
    }

    function renderPreview() {
      const data = draft || saved;
      const channels = data.channels.filter((entry) => entry.visible);
      const entries = data.entries.filter((entry) => entry.visible);
      renderTiles(groups.channels, channels);
      renderTiles(groups.entries, entries);
      fields.Empty.textContent = "暂无显示入口";
      fields.Empty.hidden = channels.length + entries.length > 0;
    }

    function render() {
      const editing = draft !== null;
      const data = draft || saved;
      panel.classList.toggle("is-editing", editing);
      fields.Edit.hidden = editing;
      fields.Actions.hidden = fields.PreviewNote.hidden = !editing;
      for (const [key, group] of Object.entries(groups)) {
        data[key].forEach((item, index) => {
          const view = group.views.get(item.id);
          view.row.dataset.visible = String(item.visible);
          view.status.textContent = item.visible ? "显示" : "隐藏";
          view.status.hidden = editing;
          view.checkbox.hidden = view.order.hidden = !editing;
          view.checkbox.checked = item.visible;
          view.position.textContent = String(index + 1);
          view.up.disabled = index === 0;
          view.down.disabled = index === data[key].length - 1;
          if (group.body.children[index] !== view.row) group.body.insertBefore(view.row, group.body.children[index] || null);
        });
      }
      renderPreview();
    }

    function move(group, id, to, direction) {
      if (!draft) return;
      const list = draft[group];
      const from = list.findIndex((entry) => entry.id === id);
      if (from < 0 || to === from || to < 0 || to >= list.length) return;
      const [entry] = list.splice(from, 1);
      list.splice(to, 0, entry);
      error("");
      render();
      const view = groups[group].views.get(id);
      if (direction) {
        const [first, fallback] = direction < 0 ? [view.up, view.down] : [view.down, view.up];
        (first.disabled ? fallback : first).focus();
      }
      fields.Status.textContent = view.name + "已移到本组第 " + (to + 1) + " 位。";
    }

    function afterCenter(row, y) {
      const bounds = row.getBoundingClientRect();
      return y >= bounds.top + bounds.height / 2;
    }

    for (const [key, group] of Object.entries(groups)) {
      group.views.forEach((view, id) => {
        view.checkbox.addEventListener("change", () => {
          if (!draft) return;
          draft[key].find((entry) => entry.id === id).visible = view.checkbox.checked;
          view.row.dataset.visible = String(view.checkbox.checked);
          error("");
          renderPreview();
        });
        for (const [button, step] of [[view.up, -1], [view.down, 1]]) {
          button.addEventListener("click", () => {
            if (draft) move(key, id, draft[key].findIndex((entry) => entry.id === id) + step, step);
          });
        }
        view.grip.addEventListener("dragstart", (event) => {
          if (!draft || !event.dataTransfer) {
            event.preventDefault();
            return;
          }
          drag = { group: key, id };
          event.dataTransfer.effectAllowed = "move";
          event.dataTransfer.setData("text/plain", id);
          view.row.classList.add("is-dragging");
        });
        view.grip.addEventListener("dragend", clearDrag);
        view.row.addEventListener("dragover", (event) => {
          if (!drag || drag.group !== key || drag.id === id) {
            clearTarget();
            return;
          }
          event.preventDefault();
          if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
          if (target !== view.row) clearTarget();
          target = view.row;
          target.dataset.dropEdge = afterCenter(view.row, event.clientY) ? "after" : "before";
        });
        view.row.addEventListener("drop", (event) => {
          if (!draft || !drag || drag.group !== key || drag.id === id) return;
          event.preventDefault();
          const draggedId = drag.id;
          const from = draft[key].findIndex((entry) => entry.id === draggedId);
          const to = draft[key].findIndex((entry) => entry.id === id) + Number(afterCenter(view.row, event.clientY));
          clearDrag();
          move(key, draggedId, to - Number(from < to));
        });
      });
      group.body.addEventListener("dragleave", (event) => {
        if (!group.body.contains(event.relatedTarget)) clearTarget();
      });
    }

    function finish(message) {
      draft = null;
      clearDrag();
      error("");
      render();
      fields.Status.textContent = message;
      fields.Edit.focus();
    }

    fields.Edit.addEventListener("click", () => {
      draft = {
        channels: saved.channels.map((entry) => ({ ...entry })),
        entries: saved.entries.map((entry) => ({ ...entry }))
      };
      fields.Status.textContent = "";
      render();
      groups.channels.views.get(draft.channels[0]?.id)?.checkbox.focus({ preventScroll: true });
    });
    fields.Cancel.addEventListener("click", () => finish("已取消，恢复上次保存的侧滑菜单配置。"));
    fields.Save.addEventListener("click", () => {
      if (!draft) return;
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(draft));
      } catch {
        error("保存失败，请检查浏览器存储权限后重试。");
        return;
      }
      saved = draft;
      finish("侧滑菜单配置已保存。");
    });

    render();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
