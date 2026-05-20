(function () {
  var mask = document.querySelector(".modal-mask");
  var card = document.querySelector(".modal-card");
  var title = document.getElementById("modalTitle");
  var body = document.getElementById("modalBody");

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

  function basicForm(kind) {
    if (kind.indexOf('网站图标') !== -1) {
      return row('Logo', uploadThumb('W'), true) + row('Favicon', uploadThumb('♜'), true);
    }
    return row('货币图标', uploadThumb('$'), true) + row('货币符号', '<input value="$"/>', true);
  }

  function openModal(modalTitle) {
    title.textContent = modalTitle;
    card.className = 'modal-card';
    if (modalTitle.indexOf('侧滑项') !== -1) {
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
  }

  document.addEventListener('click', function (event) {
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
