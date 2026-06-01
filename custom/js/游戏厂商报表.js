(function () {
  var rows = [
    ['568WIN-USD', 'DG', 'DreamGaming', '视讯', '2', '3', '1,650.00', '800.00', '850.00'],
    ['568WIN-USD', 'SA', 'SaGaming', '视讯', '2', '3', '34.00', '20.00', '14.00'],
    ['AE', 'SPRIBE', 'Spribe', '区块链', '9', '112', '3,850.00', '3,341.20', '508.80'],
    ['HG-USD', 'JILI', 'JILI Games', '捕鱼', '14', '1,185', '4,317,802.80', '4,814,046.60', '-496,243.80'],
    ['HG-USD', 'TADA', 'Tada Gaming', '电子', '22', '1,492', '92,640.00', '88,240.00', '4,400.00'],
    ['HG-USD', 'PG', 'PG Soft', '电子', '18', '872', '68,500.00', '71,830.00', '-3,330.00'],
    ['568WIN-USD', 'EVO', 'Evolution', '视讯', '7', '223', '28,900.00', '24,630.00', '4,270.00'],
    ['AE', 'KINGMAKER', 'Kingmaker', '棋牌', '5', '146', '12,420.00', '11,088.00', '1,332.00'],
    ['HG-USD', 'CQ9', 'CQ9', '电子', '11', '764', '54,260.00', '48,902.00', '5,358.00'],
    ['568WIN-USD', 'SBO', 'SBO Sports', '体育', '6', '95', '36,800.00', '39,120.00', '-2,320.00'],
    ['AE', 'FC', 'Fa Chai', '电子', '16', '538', '42,710.00', '37,526.00', '5,184.00'],
    ['HG-USD', 'PP', 'Pragmatic Play', '电子', '20', '918', '83,360.00', '76,188.00', '7,172.00']
  ];

  function moneyClass(value) {
    return value.indexOf('-') === 0 ? 'money minus' : 'money plus';
  }

  function render() {
    var base = document.getElementById('base');
    if (!base) return;

    base.innerHTML = [
      '<div class="custom-page-shell vendor-stat-page">',
      '<nav class="page-crumb"><span class="crumb-icon">‹</span><span class="refresh-icon">↻</span><span>游戏中心</span><b>/</b><strong>游戏厂商统计</strong></nav>',
      '<main class="stat-workbench">',
      '<section class="filter-bar" aria-label="筛选条件">',
      '<label><input type="date" value="2026-05-25"/></label>',
      '<span class="date-separator">至</span>',
      '<label><input type="date" value="2026-06-01"/></label>',
      '<label class="inline-label">游戏类型:<select><option>请选择游戏类型</option><option>视讯</option><option>区块链</option><option>捕鱼</option><option>电子</option><option>体育</option><option>棋牌</option></select></label>',
      '<label class="inline-label">厂商编码:<input type="text" placeholder="请输入厂商编码"/></label>',
      '<label class="inline-label">厂商名称:<input type="text" placeholder="请输入厂商名称"/></label>',
      '<button class="primary-btn" type="button">搜索</button>',
      '<button class="plain-btn" type="reset">重置</button>',
      '<button class="primary-btn" type="button">导出报表</button>',
      '</section>',
      '<div class="notice-bar">总损益说明：正数代表商户收益，负数代表会员收益；总损益 = 投注总金额 - 总派彩。</div>',
      '<section class="table-frame" aria-label="游戏厂商统计列表">',
      '<div class="table-scroll">',
      '<table class="stat-table">',
      '<thead><tr>',
      '<th>商户币种</th><th>厂商编码</th><th>厂商名称</th><th>游戏类型</th><th>游戏数量</th><th>投注总次数</th><th>投注总金额</th><th>总派彩</th><th>总损益</th>',
      '</tr></thead>',
      '<tbody>',
      rows.map(function (row) {
        return '<tr>' + row.map(function (cell, index) {
          var cls = index === 8 ? ' class="' + moneyClass(cell) + '"' : '';
          return '<td' + cls + '>' + cell + '</td>';
        }).join('') + '</tr>';
      }).join(''),
      '</tbody>',
      '</table>',
      '</div>',
      '</section>',
      '<footer class="pagination-bar">',
      '<button type="button" class="page-link disabled">|‹</button>',
      '<button type="button" class="page-link disabled">≪</button>',
      '<button type="button" class="page-link disabled">‹</button>',
      '<input class="page-input" value="1" aria-label="当前页"/>',
      '<span>/ 1</span>',
      '<button type="button" class="page-link disabled">›</button>',
      '<button type="button" class="page-link disabled">≫</button>',
      '<button type="button" class="page-link disabled">›|</button>',
      '<select class="page-size"><option>20条/页</option><option>50条/页</option><option>100条/页</option></select>',
      '<span>共 12 条记录</span>',
      '</footer>',
      '</main>',
      '</div>'
    ].join('');

    var table = base.querySelector('.stat-table');
    table.addEventListener('click', function (event) {
      var row = event.target.closest('tbody tr');
      if (!row) return;
      table.querySelectorAll('tbody tr.is-selected').forEach(function (item) {
        item.classList.remove('is-selected');
      });
      row.classList.add('is-selected');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
})();
