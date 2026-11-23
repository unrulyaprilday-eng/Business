(function () {
  "use strict";

  const storageKey = "business.site-front.home-activity-shortcuts.v1";
  const layouts = {
    portrait: { outside: 0, cells: 32, note: "竖版 8 行 × 4 列：第 1 位从面板右上角开始，先向下，再向左。" },
    landscape: { outside: 3, cells: 25, note: "横版 5 行 × 5 列：第 1–3 位在面板外；第 4 位从面板右上角开始，先向下，再向左。" }
  };

  function init() {
    const panel = document.getElementById("homeShortcuts");
    if (!panel) return;

    const find = (name) => panel.querySelector("#homeShortcut" + name);
    const body = panel.querySelector("tbody");
    const edit = find("Edit");
    const editNote = find("EditNote");
    const template = find("Template");
    const actions = find("Actions");
    const cancel = find("Cancel");
    const save = find("Save");
    const status = find("Status");
    const error = find("Error");
    const preview = find("Preview");
    const previewNote = find("PreviewNote");
    const modeNote = find("ModeNote");
    const top = find("Top");
    const outside = find("Outside");
    const grid = find("Grid");
    const stage = panel.querySelector(".home-shortcut-stage");
    const modes = [...panel.querySelectorAll("[data-shortcut-width]")];
    if (![body, edit, editNote, template, actions, cancel, save, status, error, preview, previewNote, modeNote, top, outside, grid, stage].every(Boolean)) return;

    function button(text, label) {
      const node = document.createElement("button");
      node.type = "button";
      node.textContent = text;
      node.setAttribute("aria-label", label);
      return node;
    }

    const rows = new Map();
    const defaults = [...body.querySelectorAll("tr[data-entry]")].map((row) => {
      const id = row.dataset.entry;
      const name = row.querySelector("th").textContent;
      const icon = row.querySelector(".home-shortcut-icon");
      const visibility = row.querySelector("[data-visibility]");
      const position = row.querySelector("[data-position]");
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.setAttribute("aria-label", "显示" + name);
      visibility.after(checkbox);

      const controls = document.createElement("span");
      controls.className = "home-shortcut-order";
      const handle = document.createElement("span");
      handle.className = "home-shortcut-grip";
      handle.textContent = "⠿";
      handle.title = "拖动调整" + name + "的位置";
      handle.draggable = true;
      handle.setAttribute("aria-hidden", "true");
      const up = button("↑", "上移" + name);
      const down = button("↓", "下移" + name);
      controls.append(handle, up, down);
      position.after(controls);
      rows.set(id, { row, name, icon, visibility, position, checkbox, controls, handle, up, down });
      return { id, visible: row.dataset.visible === "true" };
    });
    if (!rows.size) return;

    function loadSaved() {
      try {
        const stored = JSON.parse(window.localStorage.getItem(storageKey));
        if (!Array.isArray(stored)) return defaults;
        const seen = new Set();
        const restored = stored.filter((entry) => {
          if (!entry || !rows.has(entry.id) || typeof entry.visible !== "boolean" || seen.has(entry.id)) return false;
          seen.add(entry.id);
          return true;
        });
        return restored.concat(defaults.filter((entry) => !seen.has(entry.id)));
      } catch {
        return defaults;
      }
    }

    let saved = loadSaved();
    let draft = null;
    let dragged = null;
    let dropTarget = null;
    let orientation = "portrait";

    function setError(text) {
      error.textContent = text;
      error.hidden = !text;
    }

    function renderPreview(entries) {
      const layout = layouts[orientation];
      const visible = entries.filter((entry) => entry.visible);

      function makeSlot(index) {
        const item = document.createElement("li");
        const position = index + 1;
        const badge = document.createElement("span");
        badge.className = "home-shortcut-slot-number";
        badge.textContent = String(position);
        badge.setAttribute("aria-hidden", "true");
        item.append(badge);

        const view = visible[index] && rows.get(visible[index].id);
        item.setAttribute("aria-label", "第 " + position + " 位：" + (view ? view.name : "空位"));
        if (view) {
          const text = document.createElement("span");
          text.className = "home-shortcut-slot-label";
          text.textContent = view.name;
          item.append(view.icon.cloneNode(true), text);
        } else {
          item.classList.add("is-empty");
        }
        return item;
      }

      stage.dataset.width = orientation;
      top.hidden = !layout.outside;
      modeNote.textContent = layout.note;
      outside.replaceChildren(...Array.from({ length: layout.outside }, (_, index) => makeSlot(index)));
      grid.replaceChildren(...Array.from({ length: layout.cells }, (_, index) => makeSlot(index + layout.outside)));
    }

    function render() {
      const entries = draft || saved;
      const editing = Boolean(draft);
      editNote.hidden = actions.hidden = previewNote.hidden = !editing;
      edit.hidden = editing;
      panel.classList.toggle("is-editing", editing);
      entries.forEach((entry, index) => {
        const view = rows.get(entry.id);
        view.row.dataset.visible = String(entry.visible);
        view.visibility.textContent = entry.visible ? "显示" : "隐藏";
        view.visibility.hidden = editing;
        view.checkbox.hidden = !editing;
        view.checkbox.checked = entry.visible;
        view.position.textContent = String(index + 1);
        view.controls.hidden = !editing;
        view.up.disabled = index === 0;
        view.down.disabled = index === entries.length - 1;
        if (body.children[index] !== view.row) body.insertBefore(view.row, body.children[index] || null);
      });
      renderPreview(entries);
    }

    function move(id, position, direction) {
      if (!draft) return;
      const from = draft.findIndex((entry) => entry.id === id);
      if (from < 0 || from === position || position < 0 || position >= draft.length) return;
      const [entry] = draft.splice(from, 1);
      draft.splice(position, 0, entry);
      setError("");
      render();
      const view = rows.get(id);
      if (direction) {
        const [preferred, fallback] = direction < 0 ? [view.up, view.down] : [view.down, view.up];
        (preferred.disabled ? fallback : preferred).focus();
      }
      status.textContent = view.name + "已移到第 " + (position + 1) + " 位。";
    }

    function clearDropTarget() {
      if (dropTarget) delete dropTarget.dataset.dropEdge;
      dropTarget = null;
    }

    function isBelowCenter(row, event) {
      const bounds = row.getBoundingClientRect();
      return event.clientY >= bounds.top + bounds.height / 2;
    }

    rows.forEach((view, id) => {
      view.checkbox.addEventListener("change", () => {
        if (!draft) return;
        draft.find((entry) => entry.id === id).visible = view.checkbox.checked;
        view.row.dataset.visible = String(view.checkbox.checked);
        setError("");
        renderPreview(draft);
      });
      view.up.addEventListener("click", () => {
        if (draft) move(id, draft.findIndex((entry) => entry.id === id) - 1, -1);
      });
      view.down.addEventListener("click", () => {
        if (draft) move(id, draft.findIndex((entry) => entry.id === id) + 1, 1);
      });
      view.handle.addEventListener("dragstart", (event) => {
        if (!draft || !event.dataTransfer) {
          event.preventDefault();
          return;
        }
        dragged = id;
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", id);
        view.row.classList.add("is-dragging");
      });
      view.handle.addEventListener("dragend", () => {
        dragged = null;
        view.row.classList.remove("is-dragging");
        clearDropTarget();
      });
      view.row.addEventListener("dragover", (event) => {
        if (!draft || !dragged || dragged === id) return;
        event.preventDefault();
        if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
        if (dropTarget !== view.row) clearDropTarget();
        dropTarget = view.row;
        dropTarget.dataset.dropEdge = isBelowCenter(view.row, event) ? "after" : "before";
      });
      view.row.addEventListener("drop", (event) => {
        if (!draft || !dragged || dragged === id) return;
        event.preventDefault();
        const from = draft.findIndex((entry) => entry.id === dragged);
        const target = draft.findIndex((entry) => entry.id === id);
        const boundary = target + Number(isBelowCenter(view.row, event));
        const draggedId = dragged;
        dragged = null;
        rows.get(draggedId).row.classList.remove("is-dragging");
        clearDropTarget();
        move(draggedId, boundary - Number(from < boundary));
      });
    });

    body.addEventListener("dragleave", (event) => {
      if (!body.contains(event.relatedTarget)) clearDropTarget();
    });

    function finish(message) {
      draft = null;
      setError("");
      render();
      status.textContent = message;
      edit.focus();
    }

    edit.addEventListener("click", () => {
      draft = saved.map((entry) => ({ ...entry }));
      status.textContent = "";
      render();
      rows.get(draft[0].id).checkbox.focus();
    });
    template.addEventListener("click", () => {
      if (!draft) return;
      draft = defaults.map((entry) => ({ ...entry }));
      setError("");
      render();
      status.textContent = "已载入 28 个样板入口，保存后生效。";
    });
    cancel.addEventListener("click", () => finish("已取消，恢复上次保存的配置。"));
    save.addEventListener("click", () => {
      if (!draft) return;
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(draft));
      } catch {
        setError("保存失败，请检查浏览器存储权限后重试。");
        return;
      }
      saved = draft;
      finish("首页活动快捷入口已保存。");
    });

    modes.forEach((mode) => {
      mode.addEventListener("click", () => {
        orientation = mode.dataset.shortcutWidth;
        modes.forEach((item) => item.setAttribute("aria-pressed", String(item === mode)));
        renderPreview(draft || saved);
      });
    });

    render();
    preview.hidden = false;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
