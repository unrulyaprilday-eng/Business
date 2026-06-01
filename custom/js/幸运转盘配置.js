(function () {
  function prizeTemplate(index) {
    return '<div class="prize-item">' +
      '<b>' + index + '</b>' +
      '<input type="text" placeholder="请输入奖项名称"/>' +
      '<input type="text" placeholder="请输入奖项标识"/>' +
      '<select><option>请选择奖项类型</option><option>送金币</option><option>优惠券</option><option>再来一次</option><option>未中奖</option></select>' +
      '<span class="dash">—</span>' +
      '<div class="number-box"><input type="text" value="0"/><span class="stepper"><button type="button">＋</button><button type="button">－</button></span></div>' +
      '<div class="icon-cell"><span class="upload-box"><span class="upload-plus">＋</span>点击或拖拽上传</span><small>请上传64*64规格或等比例，PNG、JPG、GIF图片，50KB以内。</small></div>' +
      '<button class="delete-prize" type="button" title="删除" aria-label="删除"></button>' +
      '</div>';
  }

  function refreshPrizeNumbers(list) {
    var items = list.querySelectorAll('.prize-item');
    items.forEach(function (item, index) {
      item.querySelector('b').textContent = index + 1;
    });
    var modal = list.closest('.modal');
    var count = modal && modal.querySelector('.prize-count');
    if (count) {
      count.textContent = items.length + ' 个奖项';
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    var editList = document.querySelector('[data-prize-list="edit"]');
    if (editList) {
      editList.innerHTML = prizeTemplate(1) + prizeTemplate(2);
    }

    document.querySelectorAll('[data-open-modal]').forEach(function (trigger) {
      trigger.addEventListener('click', function () {
        var modal = document.querySelector('[data-modal="' + trigger.getAttribute('data-open-modal') + '"]');
        if (modal) {
          modal.hidden = false;
        }
      });
    });

    document.querySelectorAll('[data-close-modal]').forEach(function (trigger) {
      trigger.addEventListener('click', function () {
        var modal = trigger.closest('.modal-mask');
        if (modal) {
          modal.hidden = true;
        }
      });
    });

    document.querySelectorAll('.switch:not(.disabled)').forEach(function (toggle) {
      toggle.addEventListener('click', function () {
        toggle.classList.toggle('on');
      });
    });

    document.querySelectorAll('[data-add-prize]').forEach(function (button) {
      button.addEventListener('click', function () {
        var list = button.closest('.modal').querySelector('[data-prize-list]');
        list.insertAdjacentHTML('beforeend', prizeTemplate(list.querySelectorAll('.prize-item').length + 1));
        refreshPrizeNumbers(list);
      });
    });

    document.addEventListener('click', function (event) {
      if (!event.target.classList.contains('delete-prize')) {
        return;
      }
      var list = event.target.closest('[data-prize-list]');
      event.target.closest('.prize-item').remove();
      refreshPrizeNumbers(list);
    });
  });
})();
