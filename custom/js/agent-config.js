(function () {
  var baseRows = [
    { members: '1', performance: '0.00', commission: '70.00' },
    { members: '3', performance: '1.00', commission: '71.00' },
    { members: '8', performance: '10.00', commission: '73.00' },
    { members: '15', performance: '300.00', commission: '75.00' },
    { members: '21', performance: '500.00', commission: '77.00' },
    { members: '55', performance: '1,000.00', commission: '80.00' },
    { members: '89', performance: '3,000.00', commission: '90.00' },
    { members: '110', performance: '5,000.00', commission: '100.00' }
  ];

  var categoryAdjust = {
    '棋牌佣金': 0,
    '捕鱼佣金': 2,
    '电子佣金': 4,
    '体育佣金': 6,
    '视讯佣金': 8,
    '彩票佣金': 10,
    '区块链佣金': 12
  };

  var rowsBody = document.querySelector('#commissionRows');
  var tabs = document.querySelectorAll('.tab');
  var pagerTotal = document.querySelector('#pagerTotal');
  var configDialog = document.querySelector('#configDialog');
  var configDialogTitle = document.querySelector('#configDialogTitle');
  var dialogPerformance = document.querySelector('#dialogPerformance');
  var dialogCommission = document.querySelector('#dialogCommission');

  function renderRows(tabName) {
    var adjust = categoryAdjust[tabName] || 0;
    rowsBody.innerHTML = baseRows.map(function (row, index) {
      var commission = (parseFloat(row.commission) + adjust).toFixed(2);
      return [
        '<tr>',
        '<td>' + (index + 1) + '</td>',
        '<td>' + row.members + '</td>',
        '<td>' + row.performance + '</td>',
        '<td>' + commission + '</td>',
        '<td><button class="link-btn js-open-config" data-dialog="commission" data-index="' + index + '" type="button">修改</button><button class="danger-link" type="button">删除</button></td>',
        '</tr>'
      ].join('');
    }).join('');

    var rows = rowsBody.querySelectorAll('tr');
    rows.forEach(function (row) {
      row.addEventListener('click', function () {
        rows.forEach(function (item) { item.classList.remove('is-selected'); });
        row.classList.add('is-selected');
      });
    });

    bindDialogButtons();

    if (pagerTotal) {
      pagerTotal.textContent = '共 ' + baseRows.length + ' 条记录';
    }
  }

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      tabs.forEach(function (item) { item.classList.remove('is-active'); });
      tab.classList.add('is-active');
      renderRows(tab.textContent.trim());
    });
  });

  function openDialog(type, trigger) {
    if (!configDialog) return;
    var titleMap = {
      commission: '修改返佣配置',
      performance: '修改业绩计算'
    };
    configDialogTitle.textContent = titleMap[type] || '修改配置';

    // 根据类型设置对话框字段标签
    var dialogFieldLabels = document.querySelectorAll('.dialog-field span');
    if (type === 'commission') {
      // 修改返佣配置对话框的标签
      dialogFieldLabels[0].innerHTML = '<i>*</i> 有效投注业绩(单位：万):';
      dialogFieldLabels[1].innerHTML = '<i>*</i> 每万返佣(比例):';
      
      if (trigger) {
        var row = trigger.closest('tr');
        var cells = row ? row.querySelectorAll('td') : [];
        if (cells.length >= 4) {
          dialogPerformance.value = cells[2].textContent.replace(/,/g, '');
          dialogCommission.value = cells[3].textContent.replace(/,/g, '');
        }
      }
    } else if (type === 'performance') {
      // 修改业绩计算对话框的标签（不带单位）
      dialogFieldLabels[0].innerHTML = '<i>*</i> 周期内总有效投注 ≥';
      dialogFieldLabels[1].innerHTML = '<i>*</i> 周期内总存款 ≥';
      
      var parentCard = trigger ? trigger.closest('.rule-card') : null;
      if (parentCard) {
        var perfValue = parentCard.querySelector('.condition-box .condition-row:first-child strong');
        var depositValue = parentCard.querySelector('.condition-box .condition-row:nth-child(2) strong');
        if (perfValue && depositValue) {
          // 直接使用数值，不需要转换
          dialogPerformance.value = perfValue.textContent;
          dialogCommission.value = depositValue.textContent;
        }
      }
    }

    configDialog.hidden = false;
    document.body.classList.add('dialog-open');
    dialogPerformance.focus();
  }

  function closeDialog() {
    if (!configDialog) return;
    configDialog.hidden = true;
    document.body.classList.remove('dialog-open');
  }

  function bindDialogButtons() {
    document.querySelectorAll('.js-open-config').forEach(function (button) {
      if (button.dataset.boundDialog) return;
      button.dataset.boundDialog = '1';
      button.addEventListener('click', function (event) {
        event.stopPropagation();
        openDialog(button.dataset.dialog || 'commission', button);
      });
    });
  }

  document.querySelectorAll('[data-close-dialog]').forEach(function (button) {
    button.addEventListener('click', closeDialog);
  });

  var confirmButton = document.querySelector('[data-confirm-dialog]');
  if (confirmButton) {
    confirmButton.addEventListener('click', closeDialog);
  }

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') closeDialog();
  });

  renderRows('棋牌佣金');
  bindDialogButtons();
})();
