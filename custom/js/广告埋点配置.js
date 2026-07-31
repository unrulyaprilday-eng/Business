(function () {
  var mask = document.querySelector(".modal-mask");
  var card = document.querySelector(".modal-card");
  var title = document.getElementById("modalTitle");
  var body = document.getElementById("modalBody");

  function field(label, control, required, error) {
    return '<div class="form-row' + (error ? ' field-error' : '') + '"><label>' + (required ? '<em>*</em>' : '') + label + '</label><div>' + control + (error ? '<span class="error-tip">' + error + '</span>' : '') + '</div></div>';
  }

  function input(value, placeholder) {
    return '<input value="' + (value || '') + '" placeholder="' + (placeholder || '') + '"/>';
  }

  function textarea(value, placeholder) {
    return '<textarea placeholder="' + (placeholder || '') + '">' + (value || '') + '</textarea>';
  }

  function select(options, active, extra) {
    return '<select' + (extra || '') + '>' + options.map(function (item) {
      return '<option' + (item === active ? ' selected' : '') + '>' + item + '</option>';
    }).join('') + '</select>';
  }

  function commonRows(data) {
    return [
      field('渠道名称', input(data.name, '请输入渠道名称'), true, data.nameError),
      field('落地页域名', select(['请选择落地页域名', 'tuiguanawda.jyowhite.cc', 'm.tuiguan-demo.cc', 'promo.jyowhite.cc', 'go.jyowhite.cc'], data.domain), true),
      field('跳转地址', input(data.jump, '请输入跳转地址'), false),
      field('渠道类型', select(['Facebook', 'Google', 'Adjust', 'TikTok'], data.type, ' data-channel-type'), true)
    ].join('');
  }

  function normalRows(data) {
    return [
      field('像素ID', input(data.pixel, '请输入像素ID'), false),
      field('备注', textarea(data.remark, '请输入备注'), false)
    ].join('');
  }

  function adjustRows(data) {
    return [
      field('安装类型', select(['请选择安装类型', 'H5', 'Android', 'iOS'], data.installType), false),
      field('事件标识(注册)', input(data.registerEvent, '请输入事件标识(注册)'), false),
      field('事件标识(首充)', input(data.firstPayEvent, '请输入事件标识(首充)'), false),
      field('事件标识(复充)', input(data.repeatPayEvent, '请输入事件标识(复充)'), false),
      field('备注', textarea(data.remark, '请输入备注'), false)
    ].join('');
  }

  function renderForm(data) {
    var isAdjust = data.type === 'Adjust';
    body.innerHTML = commonRows(data) + (isAdjust ? adjustRows(data) : normalRows(data));
    var typeSelect = body.querySelector('[data-channel-type]');
    typeSelect.addEventListener('change', function () {
      data.type = typeSelect.value;
      data.nameError = '';
      if (data.type === 'Facebook') {
        data.pixel = data.pixel || '111';
      }
      renderForm(data);
    });
  }

  function modalData(mode) {
    if (mode === 'edit-facebook') {
      return {
        type: 'Facebook',
        name: 'Facebook测试',
        domain: 'tuiguanawda.jyowhite.cc',
        jump: 'tuiguanawda.jyowhite.cc',
        pixel: '111',
        remark: '测试'
      };
    }
    if (mode === 'edit-google') {
      return {
        type: 'Google',
        name: 'Google搜索投放',
        domain: 'promo.jyowhite.cc',
        jump: 'promo.jyowhite.cc/register',
        pixel: 'G-102938',
        remark: '搜索广告'
      };
    }
    if (mode === 'edit-adjust') {
      return {
        type: 'Adjust',
        name: 'adjust测试',
        domain: 'tuiguanawda.jyowhite.cc',
        jump: 'tuiguanawda.jyowhite.cc',
        installType: 'H5',
        registerEvent: '111',
        firstPayEvent: '22',
        repeatPayEvent: '33',
        remark: 'cs'
      };
    }
    if (mode === 'edit-tiktok') {
      return {
        type: 'TikTok',
        name: 'TikTok海外推广',
        domain: 'go.jyowhite.cc',
        jump: 'go.jyowhite.cc/signup',
        pixel: 'TT-8A72F9',
        remark: '海外推广'
      };
    }
    return {
      type: 'Adjust',
      name: '',
      nameError: '请输入渠道名称',
      domain: '请选择落地页域名',
      jump: '',
      installType: '请选择安装类型',
      registerEvent: '',
      firstPayEvent: '',
      repeatPayEvent: '',
      remark: ''
    };
  }

  function openModal(mode) {
    card.className = 'modal-card';
    title.textContent = mode === 'add' ? '新增埋点配置' : '编辑埋点配置';
    renderForm(modalData(mode));
    mask.hidden = false;
  }

  document.addEventListener("click", function (event) {
    var modalButton = event.target.closest("[data-modal]");
    if (modalButton) {
      openModal(modalButton.dataset.modal);
    }
    if (event.target.matches(".modal-close, [data-close], .modal-mask")) {
      mask.hidden = true;
    }
  });
})();
