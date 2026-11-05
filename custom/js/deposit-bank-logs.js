(function (global) {
  'use strict';

  var PAGE_SIZES = [10, 20, 50];
  var currency = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  function round2(value) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  function money(value) {
    return currency.format(value);
  }

  function pad(value) {
    return String(value).padStart(2, '0');
  }

  function localDateTime(date) {
    return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate()) + ' ' + pad(date.getHours()) + ':' + pad(date.getMinutes()) + ':' + pad(date.getSeconds());
  }

  function makeRecords() {
    var today = new Date(2026, 10, 5, 23, 59, 59);
    var people = [
      { account: 'luna88', id: 'MB10086', vip: 'VIP2', balance: 1250000 },
      { account: 'mike_21', id: 'MB10231', vip: 'VIP1', balance: 680000 },
      { account: 'sunny520', id: 'MB10917', vip: 'VIP0', balance: 320000 }
    ];
    var records = [];
    var sequence = 0;
    var schedule = [
      ['deposit', 0, 50000], ['interest', 0], ['withdraw', 1, 30000],
      ['interest', 1], ['deposit', 2, 12000], ['interest', 2],
      ['deposit', 1, 80000], ['interest', 0], ['withdraw', 2, 5000],
      ['interest', 1], ['deposit', 0, 25000], ['interest', 2],
      ['withdraw', 0, 18000], ['interest', 1], ['deposit', 2, 16000],
      ['interest', 0], ['withdraw', 1, 22000], ['interest', 2],
      ['deposit', 1, 45000], ['interest', 1], ['withdraw', 2, 7000],
      ['interest', 0], ['deposit', 0, 35000], ['interest', 2],
      ['withdraw', 0, 10000], ['interest', 1], ['deposit', 2, 12000],
      ['interest', 0], ['withdraw', 1, 12000], ['interest', 2]
    ];
    schedule.forEach(function (entry, index) {
      var type = entry[0];
      var person = people[entry[1]];
      var amount = entry[2] || 0;
      var before = person.balance;
      var rate = { VIP0: 101, VIP1: 103, VIP2: 105 }[person.vip];
      sequence += 1;
      var recordNo = 'BK' + String(100000 + sequence);
      if (type === 'deposit') {
        person.balance = round2(before + amount);
      } else if (type === 'withdraw') {
        amount = Math.min(amount, person.balance);
        person.balance = round2(before - amount);
      } else {
        amount = round2(before * (rate / 100) / 365 / 24);
        person.balance = round2(before + amount);
      }
      var daysAgo = 14 - Math.floor(index / 2);
      var happened = new Date(today.getFullYear(), today.getMonth(), today.getDate() - daysAgo, 9 + index % 2, 0, 0);
      records.push({
        no: recordNo, account: person.account, memberId: person.id, vip: person.vip,
        type: type, amount: type === 'withdraw' ? -amount : amount, before: before, after: person.balance,
        rate: rate, time: localDateTime(happened), timestamp: happened.getTime(), currency: 'IDR'
      });
    });
    return records.sort(function (a, b) { return b.timestamp - a.timestamp; });
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char];
    });
  }

  function csvCell(value) {
    var text = String(value == null ? '' : value);
    if (/^[\s\u0000-\u001f]*[=+\-@]/.test(text)) text = "'" + text;
    return '"' + text.replace(/"/g, '""') + '"';
  }

  function init(panel) {
    if (!panel || panel.dataset.dbLogsReady === 'true') return;
    panel.dataset.dbLogsReady = 'true';
    var records = makeRecords();
    var state = { query: '', vip: '', type: '', from: '', to: '', page: 1, size: 10, visible: records.slice() };
    var typeNames = { interest: '利息', deposit: '存入', withdraw: '取出' };
    panel.innerHTML = [
      '<div class="db-section-head"><div><h3>银行流水</h3><div class="db-muted">前台展示最近15天、约100条记录；后台支持筛选查询。</div></div>',
      '<button type="button" class="db-button" data-action="export">导出 CSV</button></div>',
      '<form class="db-filter db-log-filter" data-role="filter">',
      '<label class="db-field">会员账号 / ID<input name="query" type="search" placeholder="输入账号或会员ID"></label>',
      '<label class="db-field">VIP等级<select name="vip"><option value="">全部</option><option>VIP0</option><option>VIP1</option><option>VIP2</option></select></label>',
      '<label class="db-field">事件类型<select name="type"><option value="">全部</option><option value="interest">利息</option><option value="deposit">存入</option><option value="withdraw">取出</option></select></label>',
      '<label class="db-field">发生日期<input name="from" type="date"></label><label class="db-field">至<input name="to" type="date"></label>',
      '<div class="db-error db-log-date-error" data-role="date-error" role="alert" aria-live="polite" hidden>开始日期不能晚于结束日期</div>',
      '<div class="db-filter-actions"><button class="db-button db-primary" type="submit">查询</button><button class="db-button" type="reset">重置</button></div></form>',
      '<div class="db-table-wrap"><table class="db-table db-log-table"><thead><tr><th>流水号</th><th>会员账号 / ID</th><th>VIP等级</th><th>币种</th><th>事件</th><th>变动金额</th><th>变动前银行余额</th><th>变动后银行余额</th><th>年利率</th><th>发生时间</th></tr></thead><tbody data-role="rows"></tbody></table></div>',
      '<div class="db-log-empty db-empty" data-role="empty" hidden>暂无符合条件的银行流水</div>',
      '<div class="db-pagination" data-role="pagination"></div>'
    ].join('');
    var filter = panel.querySelector('[data-role="filter"]');
    var rows = panel.querySelector('[data-role="rows"]');
    var empty = panel.querySelector('[data-role="empty"]');
    var pagination = panel.querySelector('[data-role="pagination"]');
    var dateError = panel.querySelector('[data-role="date-error"]');

    function applyFilter() {
      var query = state.query.trim().toLowerCase();
      var start = state.from ? new Date(state.from + 'T00:00:00').getTime() : -Infinity;
      var end = state.to ? new Date(state.to + 'T23:59:59').getTime() : Infinity;
      state.visible = records.filter(function (row) {
        return (!query || row.account.toLowerCase().indexOf(query) >= 0 || row.memberId.toLowerCase().indexOf(query) >= 0) &&
          (!state.vip || row.vip === state.vip) && (!state.type || row.type === state.type) && row.timestamp >= start && row.timestamp <= end;
      });
      state.page = 1;
      render();
    }

    function render() {
      var pages = Math.max(1, Math.ceil(state.visible.length / state.size));
      state.page = Math.min(state.page, pages);
      var start = (state.page - 1) * state.size;
      var pageRows = state.visible.slice(start, start + state.size);
      rows.innerHTML = pageRows.map(function (row) {
        var tagClass = row.type === 'interest' ? 'db-success' : (row.type === 'deposit' ? 'db-tag' : 'db-warning');
        var amountClass = row.amount < 0 ? 'db-num db-log-negative' : 'db-num db-log-positive';
        return '<tr><td>' + escapeHtml(row.no) + '</td><td>' + escapeHtml(row.account) + '<span class="db-log-sub">' + escapeHtml(row.memberId) + '</span></td><td>' + escapeHtml(row.vip) + '</td><td>IDR</td><td><span class="db-tag ' + tagClass + '">' + typeNames[row.type] + '</span></td><td class="' + amountClass + '">' + (row.amount > 0 ? '+' : '') + money(row.amount) + '</td><td class="db-num">' + money(row.before) + '</td><td class="db-num">' + money(row.after) + '</td><td>' + (row.type === 'interest' ? row.rate.toFixed(2) + '%' : '—') + '</td><td>' + escapeHtml(row.time) + '</td></tr>';
      }).join('');
      empty.hidden = state.visible.length > 0;
      panel.querySelector('.db-table-wrap').hidden = state.visible.length === 0;
      pagination.innerHTML = '<span class="db-muted">共 ' + state.visible.length + ' 条</span><label>每页 <select data-role="size">' + PAGE_SIZES.map(function (size) { return '<option value="' + size + '"' + (size === state.size ? ' selected' : '') + '>' + size + '</option>'; }).join('') + '</select> 条</label><button type="button" class="db-button" data-action="prev"' + (state.page <= 1 ? ' disabled' : '') + '>上一页</button><span>' + state.page + ' / ' + pages + '</span><button type="button" class="db-button" data-action="next"' + (state.page >= pages ? ' disabled' : '') + '>下一页</button>';
    }

    function exportCsv() {
      var headers = ['流水号', '会员账号', '会员ID', 'VIP等级', '币种', '事件', '变动金额', '变动前银行余额', '变动后银行余额', '年利率', '发生时间'];
      var lines = [headers].concat(state.visible.map(function (row) {
        return [row.no, row.account, row.memberId, row.vip, row.currency, typeNames[row.type], row.amount.toFixed(2), row.before.toFixed(2), row.after.toFixed(2), row.type === 'interest' ? row.rate.toFixed(2) + '%' : '', row.time];
      }));
      var csv = '\uFEFF' + lines.map(function (line) { return line.map(csvCell).join(','); }).join('\r\n');
      var blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      var url = URL.createObjectURL(blob);
      var link = document.createElement('a');
      link.href = url;
      link.download = 'deposit-bank-logs.csv';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    }

    filter.addEventListener('submit', function (event) {
      event.preventDefault();
      var data = new FormData(filter);
      state.query = data.get('query') || '';
      state.vip = data.get('vip') || '';
      state.type = data.get('type') || '';
      state.from = data.get('from') || '';
      state.to = data.get('to') || '';
      if (state.from && state.to && state.from > state.to) {
        dateError.hidden = false;
        filter.querySelector('[name="from"]').setAttribute('aria-invalid', 'true');
        filter.querySelector('[name="to"]').setAttribute('aria-invalid', 'true');
        return;
      }
      dateError.hidden = true;
      filter.querySelector('[name="from"]').removeAttribute('aria-invalid');
      filter.querySelector('[name="to"]').removeAttribute('aria-invalid');
      applyFilter();
    });
    filter.addEventListener('reset', function () {
      global.setTimeout(function () {
        state.query = state.vip = state.type = state.from = state.to = '';
        dateError.hidden = true;
        filter.querySelector('[name="from"]').removeAttribute('aria-invalid');
        filter.querySelector('[name="to"]').removeAttribute('aria-invalid');
        applyFilter();
      }, 0);
    });
    panel.addEventListener('change', function (event) {
      if (event.target.matches('[data-role="size"]')) {
        state.size = Number(event.target.value) || 10;
        state.page = 1;
        render();
      }
    });
    panel.addEventListener('click', function (event) {
      var button = event.target.closest('[data-action]');
      if (!button || !panel.contains(button)) return;
      var action = button.dataset.action;
      if (action === 'prev' && state.page > 1) { state.page -= 1; render(); }
      else if (action === 'next' && state.page < Math.ceil(state.visible.length / state.size)) { state.page += 1; render(); }
      else if (action === 'export') exportCsv();
    });
    render();
  }

  global.DepositBankLogs = { init: init };
}(window));
