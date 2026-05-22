(function () {
  function maskValue(value, inputType) {
    if (!value) return "-";
    if (inputType !== "password") return value;
    if (value.length <= 2) return "••••••";
    return value.slice(0, 2) + "••••••";
  }

  function getFields(card) {
    return Array.prototype.map.call(card.querySelectorAll(".edit-form label"), function (label) {
      var caption = label.querySelector("span");
      var input = label.querySelector("input");
      return {
        label: caption ? caption.textContent.replace(/\s+/g, " ").trim() : "",
        value: input ? input.value.trim() : "",
        type: input ? input.type : "text"
      };
    });
  }

  function renderView(card) {
    var view = card.querySelector(".view-fields");
    var status = card.querySelector(".service-title p");
    var fields = getFields(card);
    var configured = fields.some(function (field) {
      return field.value !== "";
    });

    view.innerHTML = fields.map(function (field) {
      var value = maskValue(field.value, field.type);
      var emptyClass = value === "-" ? " is-empty" : "";
      return '<dl class="view-field' + emptyClass + '"><dt>' + field.label + '</dt><dd>' + value + '</dd></dl>';
    }).join("");

    status.classList.toggle("configured", configured);
    status.lastChild.nodeValue = configured ? "已配置" : "未配置";
  }

  function snapshot(card) {
    card._snapshot = Array.prototype.map.call(card.querySelectorAll(".edit-form input"), function (input) {
      return input.value;
    });
    var switchInput = card.querySelector(".card-actions .switch input");
    card._switchSnapshot = switchInput ? switchInput.checked : null;
  }

  function restore(card) {
    if (!card._snapshot) return;
    Array.prototype.forEach.call(card.querySelectorAll(".edit-form input"), function (input, index) {
      input.value = card._snapshot[index] || "";
    });
    var switchInput = card.querySelector(".card-actions .switch input");
    if (switchInput && card._switchSnapshot !== null) {
      switchInput.checked = card._switchSnapshot;
      switchInput.closest(".switch").classList.toggle("is-on", switchInput.checked);
    }
  }

  function setEditing(card, editing) {
    card.classList.toggle("is-editing", editing);
    if (editing) snapshot(card);
  }

  Array.prototype.forEach.call(document.querySelectorAll(".login-card"), function (card) {
    renderView(card);
  });

  document.addEventListener("change", function (event) {
    var input = event.target;
    if (!input.matches(".switch input")) return;
    input.closest(".switch").classList.toggle("is-on", input.checked);
  });

  document.addEventListener("click", function (event) {
    var card = event.target.closest(".login-card");
    if (!card) return;

    if (event.target.closest(".edit-btn")) {
      setEditing(card, true);
      return;
    }

    if (event.target.closest(".text-btn")) {
      restore(card);
      renderView(card);
      setEditing(card, false);
      return;
    }

    if (event.target.closest(".save-btn")) {
      renderView(card);
      setEditing(card, false);
    }
  });
})();
