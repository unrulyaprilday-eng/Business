(function () {
  function toggleHidden(node, hidden) {
    if (node) {
      node.hidden = hidden;
    }
  }

  function setActive(group, target, selector) {
    Array.prototype.forEach.call(group.querySelectorAll(selector), function (node) {
      node.classList.toggle("active", node === target);
    });
  }

  function toggleSwitch(button) {
    var next = button.getAttribute("data-on") !== "true";
    button.setAttribute("data-on", next ? "true" : "false");
    button.classList.toggle("on", next);
    return next;
  }

  function updateNameHint(mode) {
    var hint = document.getElementById("nameModeHint");
    var prefixInput = document.getElementById("namePrefixInput");
    var customPrefix = prefixInput ? prefixInput.value.trim() : "";

    function withPrefix(defaultPrefix, samples) {
      if (!customPrefix) return samples;
      return "示例：" + customPrefix + "***8 / " + customPrefix + "***3 / " + customPrefix + "***5";
    }

    if (!hint) return;
    if (mode === "letter") {
      hint.textContent = withPrefix("JA", "示例：JA***3 / RO***8 / MI***6");
    } else if (mode === "letterDigit") {
      hint.textContent = withPrefix("A8", "示例：A8***2 / M7***9 / K3***1");
    } else if (mode === "digitLetter") {
      hint.textContent = withPrefix("8A", "示例：8A***2 / 7M***9 / 3K***1");
    } else {
      hint.textContent = withPrefix("12", "示例：12***8 / 66***3 / 90***5");
    }
  }

  function updateSourcePanels() {
    var gameToggle = document.getElementById("sourceGame");
    var gameSourceCard = document.getElementById("gameSourceCard");

    if (gameToggle && gameSourceCard) {
      var detail = gameSourceCard.querySelector(".source-detail");
      if (detail) {
        detail.hidden = !gameToggle.checked;
      }
    }
  }

  function setupMultiselect(container) {
    var trigger = container.querySelector(".multiselect-trigger");
    var dropdown = container.querySelector(".multiselect-dropdown");
    var input = container.querySelector(".multiselect-input");
    var tags = container.querySelector(".multiselect-tags");
    var searchInput = container.querySelector(".multiselect-search-input");
    var checkboxes = container.querySelectorAll('.multiselect-option input[type="checkbox"]');
    var selectAll = container.querySelector(".select-all-checkbox");

    function updateView() {
      var values = [];
      tags.innerHTML = "";
      Array.prototype.forEach.call(checkboxes, function (checkbox) {
        if (checkbox.checked) {
          values.push(checkbox.value);
          var tag = document.createElement("span");
          tag.className = "multiselect-tag";
          tag.innerHTML = checkbox.value + '<span class="tag-remove" data-value="' + checkbox.value + '">×</span>';
          tags.appendChild(tag);
        }
      });
      input.value = values.length ? ("已选 " + values.length + " 项") : "";
      if (selectAll) {
        selectAll.checked = values.length === checkboxes.length && checkboxes.length > 0;
      }
    }

    function filterOptions(keyword) {
      var search = keyword ? keyword.trim().toLowerCase() : "";
      Array.prototype.forEach.call(checkboxes, function (checkbox) {
        var option = checkbox.closest(".multiselect-option");
        var text = checkbox.value.toLowerCase();
        if (option) {
          option.hidden = !!search && text.indexOf(search) === -1;
        }
      });
    }

    trigger.addEventListener("click", function () {
      dropdown.hidden = !dropdown.hidden;
      if (!dropdown.hidden && searchInput) {
        searchInput.focus();
      }
    });

    Array.prototype.forEach.call(checkboxes, function (checkbox) {
      checkbox.addEventListener("change", updateView);
    });

    if (selectAll) {
      selectAll.addEventListener("change", function () {
        Array.prototype.forEach.call(checkboxes, function (checkbox) {
          checkbox.checked = selectAll.checked;
        });
        updateView();
      });
    }

    tags.addEventListener("click", function (event) {
      var remove = event.target.closest(".tag-remove");
      if (!remove) return;
      Array.prototype.forEach.call(checkboxes, function (checkbox) {
        if (checkbox.value === remove.getAttribute("data-value")) {
          checkbox.checked = false;
        }
      });
      updateView();
    });

    document.addEventListener("click", function (event) {
      if (!container.contains(event.target)) {
        dropdown.hidden = true;
      }
    });

    if (searchInput) {
      searchInput.addEventListener("input", function () {
        filterOptions(searchInput.value);
      });
    }

    updateView();
    filterOptions("");
  }

  function setupTagRow(group) {
    group.addEventListener("click", function (event) {
      var button = event.target.closest(".tag");
      if (!button) return;
      button.classList.toggle("active");
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    var pageRoot = document.querySelector(".live-config-page");
    var robotToggle = document.getElementById("robotToggle");
    var nameModeGroup = document.getElementById("nameModeGroup");
    var sourceGame = document.getElementById("sourceGame");
    var prefixInput = document.getElementById("namePrefixInput");
    var editBtn = document.querySelector('[data-action="edit"]');
    var cancelBtn = document.querySelector('[data-action="cancel"]');
    var saveBtn = document.querySelector('[data-action="save"]');
    var editing = false;

    function setEditing(next) {
      editing = next;
      if (pageRoot) {
        pageRoot.classList.toggle("is-readonly", !editing);
      }
      toggleHidden(editBtn, editing);
      toggleHidden(cancelBtn, !editing);
      toggleHidden(saveBtn, !editing);
    }

    updateNameHint("digit");
    updateSourcePanels();
    setEditing(false);

    if (robotToggle) {
      robotToggle.addEventListener("click", function () {
        if (!editing) return;
        toggleSwitch(robotToggle);
      });
    }

    if (nameModeGroup) {
      nameModeGroup.addEventListener("click", function (event) {
        if (!editing) return;
        var button = event.target.closest(".segment");
        if (!button) return;
        setActive(nameModeGroup, button, ".segment");
        updateNameHint(button.getAttribute("data-name-mode"));
      });
    }

    if (prefixInput) {
      prefixInput.addEventListener("input", function () {
        var active = nameModeGroup ? nameModeGroup.querySelector(".segment.active") : null;
        updateNameHint(active ? active.getAttribute("data-name-mode") : "digit");
      });
    }

    if (sourceGame) {
      sourceGame.addEventListener("change", updateSourcePanels);
    }

    Array.prototype.forEach.call(document.querySelectorAll(".tag-row"), function (group) {
      setupTagRow(group);
    });

    Array.prototype.forEach.call(document.querySelectorAll(".custom-multiselect"), function (container) {
      setupMultiselect(container);
    });

    if (editBtn) {
      editBtn.addEventListener("click", function () {
        setEditing(true);
      });
    }

    if (cancelBtn) {
      cancelBtn.addEventListener("click", function () {
        setEditing(false);
      });
    }

    if (saveBtn) {
      saveBtn.addEventListener("click", function () {
        setEditing(false);
      });
    }
  });
})();
