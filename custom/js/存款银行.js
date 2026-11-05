(function () {
  'use strict';
  function ready() {
    var page = document.querySelector('.deposit-bank-page');
    if (!page) return;
    var config = { enabled: true, minimumDeposit: 10000, minimumBalance: 10000, minimumInterest: 1, holdingMinutes: 40, inactiveDays: 3 };
    var tiers = [ { minimum: 1, rates: [99.99, 105, 110] }, { minimum: 100000, rates: [101, 103, 105] } ];
    var storageKey = 'business-deposit-bank-config-v1';
    try {
      var stored = JSON.parse(window.localStorage.getItem(storageKey) || 'null');
      if (stored && stored.config && typeof stored.config.enabled === 'boolean' &&
          ['minimumDeposit', 'minimumBalance', 'minimumInterest', 'holdingMinutes', 'inactiveDays'].every(function (key) { return Number.isFinite(stored.config[key]) && stored.config[key] > 0; }) &&
          stored.config.holdingMinutes <= 60 && Number.isInteger(stored.config.holdingMinutes) && Number.isInteger(stored.config.inactiveDays) &&
          Array.isArray(stored.tiers) && stored.tiers.length && stored.tiers[0].minimum === 1 && stored.tiers.every(function (tier, index) {
            return Number.isFinite(tier.minimum) && tier.minimum >= 1 && (!index || tier.minimum > stored.tiers[index - 1].minimum) &&
              Array.isArray(tier.rates) && tier.rates.length === 3 && tier.rates.every(function (rate) { return Number.isFinite(rate) && rate >= 0; });
          })) { config = stored.config; tiers = stored.tiers; }
    } catch (storageError) { /* A restricted local-file context can disable storage. */ }
    var modal = page.querySelector('#bank-modal');
    var modalBody = page.querySelector('#bank-modal-body');
    var modalTitle = page.querySelector('#bank-modal-title');
    var modalForm = page.querySelector('#bank-modal-form');
    var error = page.querySelector('#bank-modal-error');
    var lastFocus, saveAction, toastTimer;
    function number(value) { return Number(value).toLocaleString('en-US', { maximumFractionDigits: 2 }); }
    function field(name, label, value, min, step, readonly) {
      return '<div class="db-form-field"><label for="bank-field-' + name + '">' + label + '</label><input id="bank-field-' + name + '" name="' + name + '" type="number" required min="' + min + '" step="' + step + '" value="' + value + '"' + (readonly ? ' readonly' : '') + '></div>';
    }
    function toast(text) {
      var box = page.querySelector('#bank-toast');
      box.textContent = text; box.hidden = false;
      window.clearTimeout(toastTimer); toastTimer = window.setTimeout(function () { box.hidden = true; }, 2600);
    }
    function close() { modal.hidden = true; if (lastFocus && lastFocus.isConnected) lastFocus.focus(); }
    function open(title, html, action) {
      lastFocus = document.activeElement; modalTitle.textContent = title; modalBody.innerHTML = html;
      error.textContent = ''; saveAction = action; modal.hidden = false;
      var first = modalBody.querySelector('input:not([readonly]),select,button');
      (first || page.querySelector('#bank-modal-save')).focus();
    }
    function warning() {
      var decreasing = tiers.some(function (tier, index) {
        return index > 0 && tier.rates.some(function (rate, vip) { return rate < tiers[index - 1].rates[vip]; });
      });
      page.querySelector('#bank-rate-warning').hidden = !decreasing;
    }
    function render() {
      Object.keys(config).forEach(function (key) {
        var node = page.querySelector('[data-bank-value="' + key + '"]');
        if (node) node.textContent = key === 'enabled' ? (config.enabled ? '启用' : '停用') : number(config[key]);
      });
      var status = page.querySelector('[data-bank-value="enabled"]');
      status.className = 'db-tag ' + (config.enabled ? 'db-success' : 'db-warning');
      page.querySelector('#bank-tier-rows').innerHTML = tiers.map(function (tier, index) {
        var range = index + 1 < tiers.length ? '低于 ' + number(tiers[index + 1].minimum) : '无上限';
        return '<tr><td>≥ ' + number(tier.minimum) + '<span class="db-range-label">' + range + '</span></td>' + tier.rates.map(function (rate) { return '<td class="db-num">' + number(rate) + '%</td>'; }).join('') +
          '<td><button type="button" class="db-link" data-bank-edit="' + index + '">编辑</button>' + (index ? '<button type="button" class="db-link db-danger" data-bank-delete="' + index + '">删除</button>' : '<span class="db-muted">基础档位</span>') + '</td></tr>';
      }).join('');
      warning();
    }
    function editRules() {
      open('编辑基础配置', '<div class="db-form-grid"><div class="db-form-field"><label>活动状态</label><div class="db-radio-group"><label><input type="radio" name="enabled" value="on"' + (config.enabled ? ' checked' : '') + '>启用</label><label><input type="radio" name="enabled" value="off"' + (!config.enabled ? ' checked' : '') + '>停用</label></div></div><div class="db-form-field"><label>币种</label><input value="IDR" readonly aria-label="币种"></div>' +
        field('minimumDeposit', '最低转入金额', config.minimumDeposit, 1, '0.01') + field('minimumBalance', '最低计息余额', config.minimumBalance, 1, '0.01') +
        field('minimumInterest', '最低结算收益', config.minimumInterest, '0.01', '0.01') + field('holdingMinutes', '最短有效存放时长（分钟）', config.holdingMinutes, 1, 1) +
        field('inactiveDays', '未登录停止计息天数', config.inactiveDays, 1, 1) + '<div class="db-form-field"><label>结算周期</label><input value="每小时" readonly aria-label="结算周期"></div></div><p class="db-note">时长口径暂按当个结算周期内实际存放时长；原规则未明确起算点，业务确认后可调整。最低转入金额为示例配置。</p>', function (form) {
          var next = { enabled: form.get('enabled') === 'on' };
          ['minimumDeposit', 'minimumBalance', 'minimumInterest', 'holdingMinutes', 'inactiveDays'].forEach(function (key) { next[key] = Number(form.get(key)); });
          if (next.holdingMinutes > 60) return '按小时结算时，最短有效存放时长不能超过60分钟。';
          Object.keys(next).forEach(function (key) { config[key] = next[key]; });
          return '';
        });
    }
    function editTier(index) {
      var adding = index === -1;
      var tier = adding ? { minimum: '', rates: tiers[tiers.length - 1].rates.slice() } : tiers[index];
      open(adding ? '新增利率档位' : '编辑利率档位', '<div class="db-form-grid">' + field('minimum', '有效存款金额下限（含）', tier.minimum, 1, '0.01', index === 0) + '<div class="db-form-field"><label>币种</label><input value="IDR" readonly aria-label="币种"></div>' + tier.rates.map(function (rate, vip) { return field('vip' + vip, 'VIP' + vip + ' 年利率（%）', rate, 0, '0.01'); }).join('') + '</div><p class="db-note">有效存款指当前银行内符合计息条件的余额，非累计充值金额。按余额命中的最高金额下限整笔计息，不分段累加；金额档位不替代最低计息余额条件。</p><p class="db-notice">原规则要求存款越多利率越高，请核对同一VIP的高金额档位利率。</p>', function (form) {
        var next = { minimum: Number(form.get('minimum')), rates: [0, 1, 2].map(function (vip) { return Number(form.get('vip' + vip)); }) };
        if (tiers.some(function (row, rowIndex) { return rowIndex !== index && row.minimum === next.minimum; })) return '金额下限已存在，请设置不同的金额档位。';
        if (adding) tiers.push(next); else tiers[index] = next;
        tiers.sort(function (a, b) { return a.minimum - b.minimum; });
        return '';
      });
    }
    modalForm.addEventListener('submit', function (event) {
      event.preventDefault();
      if (!modalForm.reportValidity()) return;
      var result = saveAction(new FormData(modalForm));
      if (result) { error.textContent = result; return; }
      var message = '配置已保存到当前浏览器';
      try { window.localStorage.setItem(storageKey, JSON.stringify({ config: config, tiers: tiers })); }
      catch (storageError) { message = '配置已更新；当前环境不支持本地保存，刷新后恢复默认'; }
      render(); close(); toast(message);
    });
    page.addEventListener('click', function (event) {
      var button = event.target.closest('button'); if (!button) return;
      if (button.hasAttribute('data-bank-tab')) {
        var tab = button.getAttribute('data-bank-tab');
        page.querySelectorAll('[data-bank-tab]').forEach(function (node) { var active = node === button; node.setAttribute('aria-selected', String(active)); node.tabIndex = active ? 0 : -1; });
        page.querySelector('#bank-config-panel').hidden = tab !== 'config';
        page.querySelector('#bank-log-panel').hidden = tab !== 'logs';
      }
      if (button.id === 'bank-edit-rules') editRules();
      if (button.id === 'bank-add-tier') editTier(-1);
      if (button.hasAttribute('data-bank-edit')) editTier(Number(button.getAttribute('data-bank-edit')));
      if (button.hasAttribute('data-bank-delete')) {
        var index = Number(button.getAttribute('data-bank-delete'));
        open('删除利率档位', '<p>确定删除金额下限为 <strong>' + number(tiers[index].minimum) + '</strong> 的利率档位？删除后，该金额区间将使用前一个档位的利率。</p>', function () { tiers.splice(index, 1); return ''; });
      }
      if (button.hasAttribute('data-bank-close')) close();
    });
    page.addEventListener('keydown', function (event) {
      if (!modal.hidden && event.key === 'Escape') { event.preventDefault(); close(); }
      if (!modal.hidden && event.key === 'Tab') {
        var focusable = modal.querySelectorAll('button:not([disabled]),input:not([readonly]),select');
        var first = focusable[0], last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
      if (event.target.hasAttribute('data-bank-tab') && (event.key === 'ArrowRight' || event.key === 'ArrowLeft')) {
        event.preventDefault(); var next = page.querySelector('[data-bank-tab="' + (event.target.getAttribute('data-bank-tab') === 'config' ? 'logs' : 'config') + '"]'); next.click(); next.focus();
      }
    });
    render();
    var logs = page.querySelector('#bank-log-panel');
    if (logs && window.DepositBankLogs) window.DepositBankLogs.init(logs);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready); else ready();
})();
