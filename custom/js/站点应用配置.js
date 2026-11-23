(function () {
  function initFloatingButtons() {
    var panel = document.getElementById('floatingButtons');
    if (!panel) return;
    var edit = panel.querySelector('#floatingButtonsEdit');
    var actions = panel.querySelector('#floatingButtonsActions');
    var cancel = panel.querySelector('#floatingButtonsCancel');
    var save = panel.querySelector('#floatingButtonsSave');
    var error = panel.querySelector('#floatingButtonsError');
    var status = panel.querySelector('#floatingButtonsStatus');
    var controls = Array.from(panel.querySelectorAll('[data-floating-button]')).map(function (card) {
      return {
        id: card.dataset.floatingButton,
        label: card.querySelector('.floating-button-switch'),
        input: card.querySelector('input'),
        state: card.querySelector('.floating-button-state'),
        icon: card.querySelector('.floating-button-icon')
      };
    });
    var storageKey = 'business.site-front.floating-buttons.v1';
    var enabled = Object.fromEntries(controls.map(function (item) { return [item.id, item.input.defaultChecked]; }));
    var editing = false;

    function readConfig(key) {
      try {
        return JSON.parse(window.localStorage.getItem(key));
      } catch (error) {
        return null;
      }
    }

    // Preserve the service switch and any existing icon from the original configuration.
    var legacyService = readConfig('business.site-app.customer-service.v1');
    var service = controls.find(function (item) { return item.id === 'service'; });
    if (legacyService && service) {
      if (typeof legacyService.enabled === 'boolean') enabled.service = legacyService.enabled;
      if (typeof legacyService.image === 'string' && /^data:image\/(png|jpeg|gif|webp);base64,[A-Za-z0-9+/]+=*$/.test(legacyService.image)) {
        var image = document.createElement('img');
        image.src = legacyService.image;
        image.alt = '';
        service.icon.replaceChildren(image);
      }
    }

    var saved = readConfig(storageKey);
    if (saved) {
      controls.forEach(function (item) {
        if (typeof saved[item.id] === 'boolean') enabled[item.id] = saved[item.id];
      });
    }

    function showError(message) {
      error.textContent = message;
      error.hidden = !message;
    }

    function render() {
      edit.hidden = editing;
      actions.hidden = !editing;
      controls.forEach(function (item) {
        item.input.checked = enabled[item.id];
        item.input.disabled = !editing;
        item.label.hidden = !editing;
        item.state.hidden = editing;
        item.state.textContent = enabled[item.id] ? '已开启' : '已关闭';
        item.state.dataset.enabled = String(enabled[item.id]);
      });
    }

    function finish(message) {
      editing = false;
      showError('');
      render();
      status.textContent = message;
      edit.focus();
    }

    edit.addEventListener('click', function () {
      editing = true;
      status.textContent = '';
      render();
      controls[0].input.focus();
    });
    controls.forEach(function (item) {
      item.input.addEventListener('change', function () { showError(''); });
    });
    cancel.addEventListener('click', function () {
      finish('已取消，恢复上次保存的状态。');
    });
    save.addEventListener('click', function () {
      if (!editing) return;
      var next = Object.fromEntries(controls.map(function (item) { return [item.id, item.input.checked]; }));
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(next));
      } catch (error) {
        showError('保存失败，请检查浏览器存储权限后重试。');
        return;
      }
      enabled = next;
      finish('首页悬浮按钮配置已保存。');
    });

    render();
  }

  initFloatingButtons();

  function setPanelEditing(panel, editing) {
    panel.classList.toggle('is-editing', editing);
    var view = panel.querySelector('.panel-view');
    var edit = panel.querySelector('.panel-edit');
    if (edit) {
      view.hidden = editing;
      edit.hidden = !editing;
    } else {
      panel.querySelectorAll('input, textarea, select').forEach(function (field) {
        field.disabled = !editing;
      });
    }
    panel.querySelector('.view-actions').hidden = editing;
    panel.querySelector('.edit-actions').hidden = !editing;
  }

  document.addEventListener('click', function (event) {
    var editButton = event.target.closest('[data-edit-panel]');
    if (editButton) {
      setPanelEditing(editButton.closest('.inline-config-panel'), true);
      return;
    }
    var saveButton = event.target.closest('[data-save-panel]');
    if (saveButton) {
      setPanelEditing(saveButton.closest('.inline-config-panel'), false);
      return;
    }
    var cancelButton = event.target.closest('[data-cancel-panel]');
    if (cancelButton) {
      setPanelEditing(cancelButton.closest('.inline-config-panel'), false);
      return;
    }
    var removeButton = event.target.closest('.upload-remove');
    if (removeButton) {
      var removePanel = removeButton.closest('.inline-config-panel');
      if (removePanel && !removePanel.classList.contains('is-editing')) {
        return;
      }
      removeButton.closest('.upload-box').classList.remove('has-image');
      return;
    }
    var uploadBox = event.target.closest('.upload-box');
    if (uploadBox && !uploadBox.classList.contains('has-image')) {
      var uploadPanel = uploadBox.closest('.inline-config-panel');
      if (uploadPanel && !uploadPanel.classList.contains('is-editing')) {
        return;
      }
      uploadBox.classList.add('has-image');
      return;
    }
  });
})();
