(function () {
  var mask = document.querySelector(".modal-mask");
  var card = document.querySelector(".modal-card");
  var title = document.getElementById("modalTitle");
  var body = document.getElementById("modalBody");
  var customerServiceCard = document.getElementById('customerServiceCard');
  if (!mask || !card || !title || !body || !customerServiceCard) {
    return;
  }
  var submitButton = mask.querySelector('.modal-actions .blue-btn');
  var customerServiceIcon = customerServiceCard.querySelector('.customer-service');
  var defaultCustomerServiceIcon = customerServiceIcon.innerHTML;
  var customerServiceStorageKey = 'business.site-app.customer-service.v1';
  var customerServiceConfig = { sort: 3, enabled: true, image: '' };
  var customerServiceDraft = null;

  function validServiceImage(value) {
    return typeof value === 'string' && /^data:image\/(png|jpeg|gif|webp);base64,[A-Za-z0-9+/]+=*$/.test(value);
  }

  function customerServiceImageMarkup(value) {
    return value ? '<img src="' + value + '" alt="客服"/>' : defaultCustomerServiceIcon;
  }

  function renderCustomerService() {
    document.getElementById('customerServiceSortValue').textContent = customerServiceConfig.sort;
    customerServiceCard.querySelector('header input').checked = customerServiceConfig.enabled;
    customerServiceIcon.innerHTML = customerServiceImageMarkup(customerServiceConfig.image);
  }

  try {
    var savedService = JSON.parse(localStorage.getItem(customerServiceStorageKey));
    if (savedService && Number.isSafeInteger(savedService.sort) && savedService.sort >= 0 && typeof savedService.enabled === 'boolean') {
      customerServiceConfig = {
        sort: savedService.sort,
        enabled: savedService.enabled,
        image: validServiceImage(savedService.image) ? savedService.image : ''
      };
    }
  } catch (error) {
    // Keep the default card available when local storage is unavailable.
  }
  renderCustomerService();

  function row(label, field, required) {
    return '<div class="form-row"><label>' + (required ? '<em>*</em>' : '') + label + '</label><div>' + field + '</div></div>';
  }

  function languageTabs() {
    return '<div class="language-tabs"><button class="active" type="button">中文</button><button type="button">English</button><button type="button">Português</button><button type="button">हिन्दी</button><button type="button">မြန်မာ</button></div>';
  }

  function numberBox(value) {
    return '<div class="number-box"><input value="' + value + '"/><div class="stepper"><span>＋</span><span>−</span></div></div>';
  }

  function uploadThumb(symbol) {
    return '<div class="upload-row"><span class="upload-thumb">' + symbol + '</span><span class="remove-link">移除</span></div>';
  }

  function switchField() {
    return '<label class="switch"><input type="checkbox" checked/><i></i></label>';
  }

  function sideForm() {
    return [
      row('名称（name）', '<input value="rebate"/>', true),
      row('', languageTabs(), false),
      row('显示文字（label）', '<input value="返水"/>', true),
      row('路由（url）', '<input value="/"/>', true),
      row('排序（sort）', numberBox('3'), true),
      row('图标（icon）', uploadThumb('☘'), false),
      row('启用状态', switchField(), false)
    ].join('');
  }

  function shortcutForm() {
    return [
      row('名称（name）', '<input value="unclaimed"/>', true),
      row('', languageTabs(), false),
      row('显示文字（label）', '<input value="待领取"/>', true),
      row('排序（sort）', numberBox('2'), true),
      row('路由（url）', '<input value="/"/>', false),
      row('按钮颜色', '<select><option>橙色</option><option>紫色</option><option>红色</option><option>绿色</option><option>蓝色</option></select>', true),
      row('图标（icon）', uploadThumb('◉'), false),
      row('启用状态', switchField(), false)
    ].join('');
  }

  function floatForm() {
    return [
      row('名称', '<input value="右侧悬浮窗2"/>', true),
      row('位置', '<div class="radio-row"><span><i class="radio-dot"></i>左</span><span><i class="radio-dot checked"></i>右</span></div>', true),
      row('排序', numberBox('2'), true),
      row('启用状态', switchField(), false),
      '<div class="form-row wide-row"><label>按钮配置</label><div><table class="button-table"><thead><tr><th>#</th><th>名称</th><th>路由</th><th>排序</th><th>图片</th><th>开关</th><th></th></tr></thead><tbody><tr><td><span class="row-index">1</span></td><td><input value="vip"/></td><td><input value="/promotion?tab=vip"/></td><td>' + numberBox('1') + '</td><td><span class="mini-icon vip"></span></td><td>' + switchField() + '</td><td><button class="danger" type="button">删</button></td></tr><tr><td><span class="row-index">2</span></td><td><input value="推广"/></td><td><input value="/promote"/></td><td>' + numberBox('2') + '</td><td><span class="mini-icon promo"></span></td><td>' + switchField() + '</td><td><button class="danger" type="button">删</button></td></tr></tbody></table><button class="add-line-btn" type="button">＋ 添加按钮</button></div></div>'
    ].join('');
  }

  function customerServiceForm() {
    customerServiceDraft = {};
    return [
      '<div class="service-config-form">',
      '<div class="form-row"><label for="customerServiceName"><em>*</em>名称</label><div><input id="customerServiceName" value="右侧客服" disabled/></div></div>',
      '<div class="form-row"><span class="service-field-label"><em>*</em>位置</span><div class="service-position" role="group" aria-label="位置"><label><input type="radio" name="customer-service-position" value="left" disabled/>左</label><label><input type="radio" name="customer-service-position" value="right" checked disabled/>右</label></div></div>',
      '<div class="form-row service-sort-row"><label for="customerServiceSort"><em>*</em>排序</label><div class="service-sort-box"><input id="customerServiceSort" type="number" min="0" step="1" value="' + customerServiceConfig.sort + '" required/><div class="service-sort-stepper"><button type="button" data-service-step="1" aria-label="增加排序">＋</button><button type="button" data-service-step="-1" aria-label="减少排序">−</button></div></div></div>',
      '<p class="service-config-note">支持调整排序和启用状态</p>',
      '<div class="form-row service-icon-row"><span class="service-field-label">图标（icon）</span><div class="service-icon-display"><span class="mini-icon customer-service">' + customerServiceImageMarkup(customerServiceConfig.image) + '</span></div></div>',
      row('启用状态', '<label class="switch"><input id="customerServiceEnabled" type="checkbox" aria-label="启用状态"' + (customerServiceConfig.enabled ? ' checked' : '') + '/><i></i></label>', false),
      '<p class="service-form-error" id="customerServiceError" role="alert" hidden></p>',
      '</div>'
    ].join('');
  }

  function showCustomerServiceError(message) {
    var errorNode = document.getElementById('customerServiceError');
    errorNode.textContent = message;
    errorNode.hidden = !message;
  }

  function saveCustomerService() {
    if (!customerServiceDraft) {
      return;
    }
    var sortField = document.getElementById('customerServiceSort');
    var sort = Number(sortField.value);
    if (!sortField.value.trim() || !Number.isSafeInteger(sort) || sort < 0) {
      showCustomerServiceError('请输入大于或等于 0 的整数排序。');
      sortField.focus();
      return;
    }
    var nextConfig = {
      sort: sort,
      enabled: document.getElementById('customerServiceEnabled').checked,
      image: customerServiceConfig.image
    };
    try {
      localStorage.setItem(customerServiceStorageKey, JSON.stringify(nextConfig));
    } catch (error) {
      showCustomerServiceError('保存失败，请检查浏览器存储空间或权限后重试。');
      return;
    }
    customerServiceConfig = nextConfig;
    renderCustomerService();
    closeModal();
  }

  function basicForm(kind) {
    if (kind.indexOf('OG 参数') !== -1) {
      return [
        row('og:title', '<input value="WTGAME｜一站式娱乐平台"/>', true),
        row('og:description', '<textarea>热门游戏、优惠活动、任务中心和会员权益统一呈现。</textarea>', true),
        row('og:image', '<input value="https://cdn.wtgame.com/assets/share-og-cover.png"/>', true),
        row('og:url', '<input value="https://www.wtgame.com"/>', true)
      ].join('');
    }
    if (kind.indexOf('网站图标') !== -1) {
      return row('Logo', uploadThumb('W'), true) + row('Favicon', uploadThumb('♜'), true);
    }
    return row('货币图标', uploadThumb('$'), true) + row('货币符号', '<input value="$"/>', true);
  }

  function openModal(modalTitle) {
    title.textContent = modalTitle;
    card.className = 'modal-card';
    customerServiceDraft = null;
    submitButton.disabled = false;
    submitButton.textContent = '提交';
    if (modalTitle.indexOf('客服弹窗') !== -1) {
      title.textContent = '编辑悬浮按钮';
      card.className = 'modal-card customer-service-modal';
      body.innerHTML = customerServiceForm();
    } else if (modalTitle.indexOf('侧滑项') !== -1) {
      body.innerHTML = sideForm();
    } else if (modalTitle.indexOf('快捷操作') !== -1) {
      body.innerHTML = shortcutForm();
    } else if (modalTitle.indexOf('悬浮按钮') !== -1) {
      card.className = 'modal-card float-modal';
      body.innerHTML = floatForm();
    } else {
      body.innerHTML = basicForm(modalTitle);
    }
    mask.hidden = false;
  }

  function closeModal() {
    mask.hidden = true;
    customerServiceDraft = null;
    submitButton.disabled = false;
  }

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
    var serviceStep = event.target.closest('[data-service-step]');
    if (serviceStep && customerServiceDraft) {
      var sortField = document.getElementById('customerServiceSort');
      var currentSort = Number(sortField.value);
      if (!Number.isSafeInteger(currentSort) || currentSort < 0) {
        currentSort = 0;
      }
      sortField.value = Math.max(0, Math.min(Number.MAX_SAFE_INTEGER, currentSort + Number(serviceStep.getAttribute('data-service-step'))));
      showCustomerServiceError('');
      return;
    }
    if (event.target === submitButton && customerServiceDraft) {
      saveCustomerService();
      return;
    }
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
    var trigger = event.target.closest('[data-modal]');
    if (trigger) {
      openModal(trigger.getAttribute('data-modal'));
      return;
    }
    if (event.target.classList.contains('modal-close') || event.target.classList.contains('ghost-btn')) {
      closeModal();
    }
    if (event.target === mask) {
      closeModal();
    }
  });
})();
