(function () {
  'use strict';
  function ready() {
    var page = document.querySelector('.deposit-bank-page');
    if (!page) return;
    var config = { enabled: true, minimumDeposit: 10000, interestActivationAmount: 10000, withdrawWagerMultiplier: 1, minimumInterest: 1, holdingMinutes: 40, inactiveDays: 3 };
    var sampleRates = [99.99, 101, 103, 105, 107, 109, 111, 113, 115, 117, 119, 121, 123, 125, 127];
    var vipRates = sampleRates.map(function (rate, index) { return { level: index + 1, rate: rate }; });
    var storageKey = 'business-deposit-bank-config-v4';
    try {
      var stored = JSON.parse(window.localStorage.getItem(storageKey) || 'null');
      if (stored && stored.config && typeof stored.config.enabled === 'boolean' &&
          ['minimumDeposit', 'interestActivationAmount', 'minimumInterest', 'holdingMinutes', 'inactiveDays'].every(function (key) { return Number.isFinite(stored.config[key]) && stored.config[key] > 0; }) &&
          Number.isFinite(stored.config.withdrawWagerMultiplier) && stored.config.withdrawWagerMultiplier >= 0 &&
          stored.config.holdingMinutes <= 60 && Number.isInteger(stored.config.holdingMinutes) && Number.isInteger(stored.config.inactiveDays) &&
          Array.isArray(stored.vipRates) && stored.vipRates.length === 15 && stored.vipRates.every(function (item, index) {
            return item.level === index + 1 && (item.rate === null || (Number.isFinite(item.rate) && item.rate >= 0));
          })) { config = stored.config; vipRates = stored.vipRates; }
    } catch (storageError) { /* A restricted local-file context can disable storage. */ }
    var modal = page.querySelector('#bank-modal');
    var modalBody = page.querySelector('#bank-modal-body');
    var modalTitle = page.querySelector('#bank-modal-title');
    var modalForm = page.querySelector('#bank-modal-form');
    var error = page.querySelector('#bank-modal-error');
    var lastFocus, saveAction, saveMessage, toastTimer;
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
    function open(title, html, action, message) {
      lastFocus = document.activeElement; modalTitle.textContent = title; modalBody.innerHTML = html;
      error.textContent = ''; saveAction = action; saveMessage = message || '配置已保存到当前浏览器'; modal.hidden = false;
      var first = modalBody.querySelector('input:not([readonly]),select,button');
      (first || page.querySelector('#bank-modal-save')).focus();
    }
    function render() {
      Object.keys(config).forEach(function (key) {
        var node = page.querySelector('[data-bank-value="' + key + '"]');
        if (node) node.textContent = key === 'enabled' ? (config.enabled ? '启用' : '停用') : number(config[key]);
      });
      var status = page.querySelector('[data-bank-value="enabled"]');
      status.className = 'db-tag ' + (config.enabled ? 'db-success' : 'db-warning');
      page.querySelector('#bank-activation-amount').value = config.interestActivationAmount;
      page.querySelector('#bank-tier-rows').innerHTML = vipRates.map(function (item) {
        return '<tr><td>VIP' + item.level + '</td><td class="db-num">' + number(item.rate) + '%</td>' +
          '<td><button type="button" class="db-link" data-bank-edit="' + item.level + '">编辑</button></td></tr>';
      }).join('');
    }
    function editRules() {
      open('编辑基础配置', '<div class="db-form-grid"><div class="db-form-field db-wide db-toggle-row"><label>活动状态</label><div class="db-radio-group"><label><input type="radio" name="enabled" value="on"' + (config.enabled ? ' checked' : '') + '>启用</label><label><input type="radio" name="enabled" value="off"' + (!config.enabled ? ' checked' : '') + '>停用</label></div></div>' +
        field('minimumDeposit', '最低转入金额', config.minimumDeposit, 1, '0.01') +
        field('minimumInterest', '最低结算收益', config.minimumInterest, '0.01', '0.01') + field('holdingMinutes', '最短有效存放时长（分钟）', config.holdingMinutes, 1, 1) +
        field('inactiveDays', '未登录停止计息天数', config.inactiveDays, 1, 1) +
        '<div class="db-form-field db-wide db-wager-field"><label for="bank-field-withdrawWagerMultiplier">取款到余额打码量倍数</label><div class="db-wager-control"><input id="bank-field-withdrawWagerMultiplier" name="withdrawWagerMultiplier" type="number" required min="0" step="0.1" value="' + config.withdrawWagerMultiplier + '"><span>倍</span></div><span class="db-muted">按取款金额 × 倍数计算；0倍表示不要求。</span></div>' +
        '</div><p class="db-note">每小时结算时检查存放时长，达到配置的最短有效存放时长才参与本次计息；不足则本次不计息。</p>', function (form) {
          var next = { enabled: form.get('enabled') === 'on' };
          ['minimumDeposit', 'minimumInterest', 'holdingMinutes', 'inactiveDays', 'withdrawWagerMultiplier'].forEach(function (key) { next[key] = Number(form.get(key)); });
          if (next.holdingMinutes > 60) return '按小时结算时，最短有效存放时长不能超过60分钟。';
          Object.keys(next).forEach(function (key) { config[key] = next[key]; });
          return '';
        });
    }
    function editVipRate(level) {
      var item = vipRates[level - 1];
      open('VIP' + level + ' 年利率', '<div class="db-form-grid">' +
        '<div class="db-form-field"><label>VIP等级</label><input value="VIP' + level + '" readonly aria-label="VIP等级"></div>' +
        '<div class="db-form-field"><label>统一利息生效金额</label><input value="' + number(config.interestActivationAmount) + ' IDR" readonly aria-label="统一利息生效金额"></div>' +
        field('rate', '年利率（%）', item.rate === null ? '' : item.rate, 0, '0.01') +
        '</div><p class="db-note">达到统一利息生效金额后，该VIP账户的累计银行余额按此年利率每小时结算；结算收益并入累计余额参与下一周期计算。</p>', function (form) {
        var rate = Number(form.get('rate'));
        if (level > 1) {
          var previousRate = vipRates[level - 2].rate;
          if (previousRate === null) return '请先配置VIP' + (level - 1) + '的年利率。';
          if (rate < previousRate) return '年利率不能低于VIP' + (level - 1) + '的 ' + number(previousRate) + '%。';
        }
        item.rate = rate;
        return '';
      });
    }
    function persist(message) {
      try { window.localStorage.setItem(storageKey, JSON.stringify({ config: config, vipRates: vipRates })); }
      catch (storageError) { message = '配置已更新；当前环境不支持本地保存，刷新后恢复默认'; }
      render();
      toast(message);
    }
    page.querySelector('#bank-activation-form').addEventListener('submit', function (event) {
      event.preventDefault();
      var input = page.querySelector('#bank-activation-amount');
      var errorNode = page.querySelector('#bank-activation-error');
      var value = Number(input.value);
      if (!Number.isFinite(value) || value <= 0) {
        errorNode.hidden = false;
        input.setAttribute('aria-invalid', 'true');
        input.focus();
        return;
      }
      errorNode.hidden = true;
      input.removeAttribute('aria-invalid');
      open('确认生效金额', '<p>利息生效金额将调整为 <strong>' + number(value) + ' IDR</strong>。确认保存吗？</p>', function () {
        config.interestActivationAmount = value;
        return '';
      }, '利息生效金额已保存到当前浏览器');
    });
    modalForm.addEventListener('submit', function (event) {
      event.preventDefault();
      if (!modalForm.reportValidity()) return;
      var result = saveAction(new FormData(modalForm));
      if (result) { error.textContent = result; return; }
      var message = saveMessage;
      close(); persist(message);
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
      if (button.hasAttribute('data-bank-edit')) editVipRate(Number(button.getAttribute('data-bank-edit')));
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
