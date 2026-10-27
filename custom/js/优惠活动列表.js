(function () {
  var CHALLENGE_STORAGE_KEY = 'promoChallengeActivities';
  var RED_PACKET_STORAGE_KEY = 'promoRedPacketActivities';
  var MONTHLY_CHECKIN_STORAGE_KEY = 'promoMonthlyCheckinActivities';
  var RECHARGE_GIFT_STORAGE_KEY = 'promoRechargeGiftActivities';
  var WEEKLY_CARD_STORAGE_KEY = 'promoWeeklyCardActivities';
  var activeActivityType = '全部类型';

  function applyActivityFilter() {
    var tbody = document.getElementById('promoActivityRows');
    var count = 0;
    if (!tbody) { return; }
    Array.prototype.forEach.call(tbody.rows, function (row) {
      var matches = activeActivityType === '全部类型' ||
        (row.cells.length > 3 && row.cells[3].textContent.trim() === activeActivityType);
      row.hidden = !matches;
      if (matches) { count += 1; }
    });
    var paginationSpans = document.querySelectorAll('.pagination > span');
    if (paginationSpans.length) {
      paginationSpans[paginationSpans.length - 1].textContent = '共 ' + count + ' 条记录';
    }
  }

  function getWeeklyCardRecords() {
    try {
      var records = JSON.parse(window.localStorage.getItem(WEEKLY_CARD_STORAGE_KEY) || '[]');
      if (!Array.isArray(records) || records.some(function (record) {
        return !record || typeof record !== 'object' || typeof record.id !== 'string' || !record.id;
      })) { throw new Error('Invalid weekly card records'); }
      return records;
    } catch (error) {
      window.alert('周卡活动数据读取失败，请检查浏览器本地存储后重试。');
      return null;
    }
  }

  function setWeeklyCardRecords(records) {
    try {
      window.localStorage.setItem(WEEKLY_CARD_STORAGE_KEY, JSON.stringify(records));
      return true;
    } catch (error) {
      window.alert('周卡活动保存失败，请检查浏览器存储权限或剩余空间后重试。');
      return false;
    }
  }

  function renderWeeklyCardRows(records) {
    var tbody = document.getElementById('promoActivityRows');
    if (!tbody) { return; }
    if (!records) { records = getWeeklyCardRecords(); }
    if (!records) { return; }
    Array.prototype.forEach.call(tbody.querySelectorAll('[data-weekly-card-id]'), function (row) { row.remove(); });
    records.slice().reverse().forEach(function (record) {
      var row = document.createElement('tr');
      var enabled = record.enabled !== false;
      row.setAttribute('data-weekly-card-id', record.id);
      row.innerHTML = [
        '<td>' + escapeHtml(record.name) + '</td>',
        '<td>-</td>',
        '<td title="' + escapeHtml(record.title) + '">' + escapeHtml(record.title) + '</td>',
        '<td>周卡</td>',
        '<td>' + escapeHtml(formatRechargeGiftTime(record.startTime)) + '</td>',
        '<td>' + (record.longTerm ? '长期有效' : escapeHtml(formatRechargeGiftTime(record.endTime))) + '</td>',
        '<td>' + escapeHtml(record.wagerMultiple == null ? '1' : record.wagerMultiple) + '</td>',
        '<td>-</td>',
        '<td><button class="switch' + (enabled ? ' on' : '') + '" type="button" data-weekly-card-toggle role="switch" aria-checked="' + enabled + '" aria-label="' + (enabled ? '关闭活动' : '启用活动') + '"></button></td>',
        '<td>' + escapeHtml(record.sort == null ? '0' : record.sort) + '</td>',
        '<td>admin</td>',
        '<td class="actions"><button type="button" data-weekly-card-edit>编辑</button><button class="danger" type="button" data-weekly-card-delete>删除</button></td>'
      ].join('');
      tbody.insertBefore(row, tbody.firstChild);
    });
    applyActivityFilter();
  }

  function updateWeeklyCardRecord(id) {
    var records = getWeeklyCardRecords();
    if (!records) { return; }
    var record = records.find(function (item) { return item.id === id; });
    if (!record) {
      window.alert('该周卡活动已不存在，请刷新列表。');
      renderWeeklyCardRows(records);
      return;
    }
    record.enabled = record.enabled === false;
    if (setWeeklyCardRecords(records)) { renderWeeklyCardRows(records); }
  }

  function getRechargeGiftRecords() {
    try {
      var raw = window.localStorage.getItem(RECHARGE_GIFT_STORAGE_KEY);
      var records;
      if (raw === null) {
        records = [{
          id: 'recharge-gift-demo', template: '充值送金', name: '充值送金', title: '充值送好礼',
          startTime: '2026-04-01T00:00', endTime: '2026-05-31T00:00',
          rewardTarget: '余额', claimMode: 'immediate', firstRechargeOnly: false, ipOnce: false,
          members: ['全体用户'], tiers: [{ endVip: '15', percent: '5' }], banner: '', description: '',
          wagerMultiple: '1', sort: '1', enabled: true, visible: true
        }];
        if (!setRechargeGiftRecords(records)) { return null; }
        return records;
      }
      records = JSON.parse(raw);
      if (!Array.isArray(records) || records.some(function (record) {
        return !record || typeof record !== 'object' || typeof record.id !== 'string' || !record.id;
      })) { throw new Error('Invalid recharge gift records'); }
      return records;
    } catch (error) {
      window.alert('充值送金活动数据读取失败，请检查浏览器本地存储后重试。');
      return null;
    }
  }

  function setRechargeGiftRecords(records) {
    try {
      window.localStorage.setItem(RECHARGE_GIFT_STORAGE_KEY, JSON.stringify(records));
      return true;
    } catch (error) {
      window.alert('充值送金活动保存失败，请检查浏览器存储权限或剩余空间后重试。');
      return false;
    }
  }

  function formatRechargeGiftTime(value) {
    var time = String(value || '').replace('T', ' ');
    return /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(time) ? time + ':00' : time;
  }

  function renderRechargeGiftRows(records) {
    var tbody = document.getElementById('promoActivityRows');
    if (!tbody) { return; }
    if (!records) { records = getRechargeGiftRecords(); }
    if (!records) { return; }
    Array.prototype.forEach.call(tbody.querySelectorAll('tr'), function (row) {
      if (row.hasAttribute('data-recharge-gift-id') || (row.cells.length > 3 &&
        row.cells[3].textContent.trim() === '充值送金' && row.cells[2].textContent.trim() === '充值送好礼')) {
        row.remove();
      }
    });
    records.slice().reverse().forEach(function (record) {
      var row = document.createElement('tr');
      var enabled = record.enabled !== false;
      var visible = record.visible !== false;
      row.setAttribute('data-recharge-gift-id', record.id);
      row.innerHTML = [
        '<td>' + escapeHtml(record.name) + '</td>',
        '<td>全部游戏</td>',
        '<td title="' + escapeHtml(record.title) + '">' + escapeHtml(record.title) + '</td>',
        '<td>充值送金</td>',
        '<td>' + escapeHtml(formatRechargeGiftTime(record.startTime)) + '</td>',
        '<td>' + escapeHtml(formatRechargeGiftTime(record.endTime)) + '</td>',
        '<td>' + escapeHtml(record.wagerMultiple == null ? '1' : record.wagerMultiple) + '</td>',
        '<td><button class="switch' + (visible ? ' on' : '') + '" type="button" data-recharge-gift-visible role="switch" aria-checked="' + visible + '" aria-label="活动可见"></button></td>',
        '<td><button class="switch' + (enabled ? ' on' : '') + '" type="button" data-recharge-gift-enabled role="switch" aria-checked="' + enabled + '" aria-label="活动启用"></button></td>',
        '<td>' + escapeHtml(record.sort == null ? '0' : record.sort) + '</td>',
        '<td>' + (record.id === 'recharge-gift-demo' ? 'qitian' : 'admin') + '</td>',
        '<td class="actions challenge-row-actions"><button type="button" data-recharge-gift-view>查看</button><button type="button" data-recharge-gift-edit>编辑</button><button class="danger" type="button" data-recharge-gift-delete>删除</button></td>'
      ].join('');
      tbody.insertBefore(row, tbody.firstChild);
    });
    applyActivityFilter();
  }

  function updateRechargeGiftRecord(id, field) {
    var records = getRechargeGiftRecords();
    if (!records) { return; }
    var record = records.find(function (item) { return item.id === id; });
    if (!record) {
      window.alert('该充值送金活动已不存在，请刷新列表。');
      renderRechargeGiftRows(records);
      return;
    }
    record[field] = record[field] === false;
    if (setRechargeGiftRecords(records)) { renderRechargeGiftRows(records); }
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function getRecords() {
    try {
      return JSON.parse(window.localStorage.getItem(CHALLENGE_STORAGE_KEY) || '[]');
    } catch (error) {
      return [];
    }
  }

  function setRecords(records) {
    try {
      window.localStorage.setItem(CHALLENGE_STORAGE_KEY, JSON.stringify(records));
    } catch (error) {
      return false;
    }
    return true;
  }

  function getRedPacketRecords() {
    try {
      return JSON.parse(window.localStorage.getItem(RED_PACKET_STORAGE_KEY) || '[]');
    } catch (error) {
      return [];
    }
  }

  function setRedPacketRecords(records) {
    try {
      window.localStorage.setItem(RED_PACKET_STORAGE_KEY, JSON.stringify(records));
    } catch (error) {
      return false;
    }
    return true;
  }

  function getMonthlyCheckinRecords() {
    try {
      return JSON.parse(window.localStorage.getItem(MONTHLY_CHECKIN_STORAGE_KEY) || '[]');
    } catch (error) {
      return [];
    }
  }

  function setMonthlyCheckinRecords(records) {
    try {
      window.localStorage.setItem(MONTHLY_CHECKIN_STORAGE_KEY, JSON.stringify(records));
    } catch (error) {
      return false;
    }
    return true;
  }

  function formatTime(value) {
    return String(value || '').replace('T', ' ') + (value ? ':00' : '');
  }

  function renderChallengeRows() {
    var tbody = document.getElementById('promoActivityRows');
    var records = getRecords();
    var existing;
    if (!tbody) {
      return;
    }
    existing = tbody.querySelectorAll('[data-challenge-id]');
    Array.prototype.forEach.call(existing, function (row) { row.remove(); });
    records.slice().reverse().forEach(function (record) {
      var row = document.createElement('tr');
      var enabled = record.enabled !== false;
      row.setAttribute('data-challenge-id', record.id);
      row.innerHTML = [
        '<td>' + escapeHtml(record.name) + '</td>',
        '<td>全部游戏</td>',
        '<td title="' + escapeHtml(record.title) + '">' + escapeHtml(record.title) + '</td>',
        '<td>连续挑战</td>',
        '<td>' + escapeHtml(formatTime(record.startTime)) + '</td>',
        '<td>' + escapeHtml(formatTime(record.endTime)) + '</td>',
        '<td>-</td>',
        '<td><span class="switch on" aria-label="活动可见"></span></td>',
        '<td><button class="switch challenge-status-switch' + (enabled ? ' on' : '') + '" type="button" data-challenge-toggle aria-label="' + (enabled ? '关闭活动' : '启用活动') + '"></button></td>',
        '<td>' + escapeHtml(record.sort || '0') + '</td>',
        '<td>admin</td>',
        '<td class="actions challenge-row-actions"><button type="button" data-challenge-edit>编辑</button><button type="button" data-challenge-toggle>' + (enabled ? '关闭' : '启用') + '</button><button class="danger" type="button" data-challenge-delete>删除</button></td>'
      ].join('');
      tbody.insertBefore(row, tbody.firstChild);
    });
  }

  function renderRedPacketRows() {
    var tbody = document.getElementById('promoActivityRows');
    var records = getRedPacketRecords();
    var existing;
    if (!tbody) {
      return;
    }
    existing = tbody.querySelectorAll('[data-red-packet-id]');
    Array.prototype.forEach.call(existing, function (row) { row.remove(); });
    records.slice().reverse().forEach(function (record) {
      var row = document.createElement('tr');
      var enabled = record.enabled !== false;
      var period = (record.timeRanges || []).map(function (range) { return range.start + '-' + (range.endDay === 'next' ? '次日 ' : '') + range.end; }).join('、') || '-';
      row.setAttribute('data-red-packet-id', record.id);
      row.innerHTML = [
        '<td>' + escapeHtml(record.name) + '</td>',
        '<td>全部游戏</td>',
        '<td title="' + escapeHtml(period) + '">' + escapeHtml(period) + '</td>',
        '<td>红包雨</td>',
        '<td>周期活动</td>',
        '<td>长期有效</td>',
        '<td>' + escapeHtml(record.wagerMultiple || '1') + '</td>',
        '<td><span class="switch on" aria-label="活动可见"></span></td>',
        '<td><button class="switch red-packet-status-switch' + (enabled ? ' on' : '') + '" type="button" data-red-packet-toggle aria-label="' + (enabled ? '关闭活动' : '启用活动') + '"></button></td>',
        '<td>' + escapeHtml(record.sort || '0') + '</td>',
        '<td>admin</td>',
        '<td class="actions red-packet-row-actions"><button type="button" data-red-packet-edit>编辑</button><button type="button" data-red-packet-toggle>' + (enabled ? '关闭' : '启用') + '</button><button class="danger" type="button" data-red-packet-delete>删除</button></td>'
      ].join('');
      tbody.insertBefore(row, tbody.firstChild);
    });
  }

  function getMonthlyCheckinWagerMultiple(record) {
    var dailyReward = ((record.dailyRewards || []).find(function (item) { return item.wagerMultiple; }) || {}).wagerMultiple;
    var milestone = ((record.milestones || []).find(function (item) { return item.wagerMultiple; }) || {}).wagerMultiple;
    return record.wagerMultiple || dailyReward || milestone || '1';
  }

  function renderMonthlyCheckinRows() {
    var tbody = document.getElementById('promoActivityRows');
    var records = getMonthlyCheckinRecords();
    if (!tbody) { return; }
    Array.prototype.forEach.call(tbody.querySelectorAll('[data-monthly-checkin-id]'), function (row) { row.remove(); });
    records.slice().reverse().forEach(function (record) {
      var row = document.createElement('tr');
      var enabled = record.enabled !== false;
      row.setAttribute('data-monthly-checkin-id', record.id);
      row.innerHTML = [
        '<td>' + escapeHtml(record.name) + '</td>',
        '<td>-</td>',
        '<td title="' + escapeHtml(record.title) + '">' + escapeHtml(record.title) + '</td>',
        '<td>月签到</td>',
        '<td>' + escapeHtml(formatTime(record.startTime)) + '</td>',
        '<td>' + (record.longTerm ? '长期有效' : escapeHtml(formatTime(record.endTime))) + '</td>',
        '<td>' + escapeHtml(getMonthlyCheckinWagerMultiple(record)) + '</td>',
        '<td>-</td>',
        '<td><button class="switch' + (enabled ? ' on' : '') + '" type="button" data-monthly-checkin-toggle aria-label="' + (enabled ? '关闭活动' : '启用活动') + '"></button></td>',
        '<td>' + escapeHtml(record.sort || '0') + '</td>',
        '<td>admin</td>',
        '<td class="actions"><button type="button" data-monthly-checkin-edit>编辑</button><button class="danger" type="button" data-monthly-checkin-delete>删除</button></td>'
      ].join('');
      tbody.insertBefore(row, tbody.firstChild);
    });
  }

  function updateMonthlyCheckinRecord(id, updater) {
    var records = getMonthlyCheckinRecords().map(function (record) {
      if (record.id === id) { updater(record); }
      return record;
    });
    setMonthlyCheckinRecords(records);
    renderMonthlyCheckinRows();
    applyActivityFilter();
  }

  function updateRecord(id, updater) {
    var records = getRecords();
    records = records.map(function (record) {
      if (record.id === id) { updater(record); }
      return record;
    });
    setRecords(records);
    renderChallengeRows();
    applyActivityFilter();
  }

  function updateRedPacketRecord(id, updater) {
    var records = getRedPacketRecords();
    records = records.map(function (record) {
      if (record.id === id) { updater(record); }
      return record;
    });
    setRedPacketRecords(records);
    renderRedPacketRows();
    applyActivityFilter();
  }

  document.addEventListener('DOMContentLoaded', function () {
    var createButton = document.getElementById('createActivityBtn');
    var tbody = document.getElementById('promoActivityRows');
    var typeFilter = document.getElementById('activityTypeFilter');
    var searchButton = document.getElementById('searchActivitiesBtn');
    var resetButton = document.getElementById('resetActivitiesBtn');
    renderChallengeRows();
    renderRedPacketRows();
    renderMonthlyCheckinRows();
    renderRechargeGiftRows();
    renderWeeklyCardRows();
    applyActivityFilter();

    if (searchButton && typeFilter) {
      searchButton.addEventListener('click', function () {
        activeActivityType = typeFilter.value;
        applyActivityFilter();
      });
    }
    if (resetButton && typeFilter) {
      resetButton.addEventListener('click', function () {
        typeFilter.selectedIndex = 0;
        activeActivityType = '全部类型';
        applyActivityFilter();
      });
    }

    if (createButton) {
      createButton.addEventListener('click', function () {
        window.location.href = '新增活动.html';
      });
    }

    if (tbody) {
      tbody.addEventListener('click', function (event) {
        var challengeRow = event.target.closest('[data-challenge-id]');
        var redPacketRow = event.target.closest('[data-red-packet-id]');
        var monthlyCheckinRow = event.target.closest('[data-monthly-checkin-id]');
        var rechargeGiftRow = event.target.closest('[data-recharge-gift-id]');
        var weeklyCardRow = event.target.closest('[data-weekly-card-id]');
        var toggle = event.target.closest('[data-challenge-toggle]');
        var redPacketToggle = event.target.closest('[data-red-packet-toggle]');
        var id;
        if (weeklyCardRow) {
          id = weeklyCardRow.getAttribute('data-weekly-card-id');
          if (event.target.closest('[data-weekly-card-edit]')) {
            window.location.href = '新增活动.html?weeklyCardId=' + encodeURIComponent(id);
            return;
          }
          if (event.target.closest('[data-weekly-card-toggle]')) {
            updateWeeklyCardRecord(id);
            return;
          }
          if (event.target.closest('[data-weekly-card-delete]') && window.confirm('确定删除该周卡活动吗？删除后不可恢复。')) {
            var weeklyCardRecords = getWeeklyCardRecords();
            if (weeklyCardRecords && setWeeklyCardRecords(weeklyCardRecords.filter(function (record) { return record.id !== id; }))) {
              renderWeeklyCardRows();
            }
          }
          return;
        }
        if (rechargeGiftRow) {
          id = rechargeGiftRow.getAttribute('data-recharge-gift-id');
          if (event.target.closest('[data-recharge-gift-view], [data-recharge-gift-edit]')) {
            window.location.href = '新增活动.html?rechargeGiftId=' + encodeURIComponent(id) +
              (event.target.closest('[data-recharge-gift-view]') ? '&mode=view' : '');
            return;
          }
          if (event.target.closest('[data-recharge-gift-visible]')) {
            updateRechargeGiftRecord(id, 'visible');
            return;
          }
          if (event.target.closest('[data-recharge-gift-enabled]')) {
            updateRechargeGiftRecord(id, 'enabled');
            return;
          }
          if (event.target.closest('[data-recharge-gift-delete]') && window.confirm('确定删除该充值送金活动吗？删除后不可恢复。')) {
            var rechargeGiftRecords = getRechargeGiftRecords();
            if (rechargeGiftRecords && setRechargeGiftRecords(rechargeGiftRecords.filter(function (record) { return record.id !== id; }))) {
              renderRechargeGiftRows();
            }
          }
          return;
        }
        if (monthlyCheckinRow) {
          id = monthlyCheckinRow.getAttribute('data-monthly-checkin-id');
          if (event.target.closest('[data-monthly-checkin-edit]')) {
            window.location.href = '新增活动.html?monthlyCheckinId=' + encodeURIComponent(id);
            return;
          }
          if (event.target.closest('[data-monthly-checkin-toggle]')) {
            updateMonthlyCheckinRecord(id, function (record) { record.enabled = record.enabled === false; });
            return;
          }
          if (event.target.closest('[data-monthly-checkin-delete]') && window.confirm('确定删除该月签到活动吗？删除后不可恢复。')) {
            setMonthlyCheckinRecords(getMonthlyCheckinRecords().filter(function (record) { return record.id !== id; }));
            renderMonthlyCheckinRows();
            applyActivityFilter();
          }
          return;
        }
        if (redPacketRow) {
          id = redPacketRow.getAttribute('data-red-packet-id');
          if (event.target.closest('.switch') && !redPacketToggle) {
            event.target.closest('.switch').classList.toggle('on');
            return;
          }
          if (event.target.closest('[data-red-packet-edit]')) {
            window.location.href = '新增活动.html?redPacketId=' + encodeURIComponent(id);
            return;
          }
          if (redPacketToggle) {
            updateRedPacketRecord(id, function (record) { record.enabled = record.enabled === false; });
            return;
          }
          if (event.target.closest('[data-red-packet-delete]') && window.confirm('确定删除该红包雨活动吗？删除后不可恢复。')) {
            setRedPacketRecords(getRedPacketRecords().filter(function (record) { return record.id !== id; }));
            renderRedPacketRows();
            applyActivityFilter();
          }
          return;
        }
        if (!challengeRow) {
          var genericSwitch = event.target.closest('.switch');
          if (genericSwitch) { genericSwitch.classList.toggle('on'); }
          return;
        }
        id = challengeRow.getAttribute('data-challenge-id');
        if (event.target.closest('[data-challenge-edit]')) {
          window.location.href = '新增活动.html?challengeId=' + encodeURIComponent(id);
          return;
        }
        if (toggle) {
          updateRecord(id, function (record) {
            record.enabled = record.enabled === false;
            record.status = record.enabled ? '开放' : '关闭';
          });
          return;
        }
        if (event.target.closest('[data-challenge-delete]') && window.confirm('确定删除该连续挑战活动吗？删除后不可恢复。')) {
          setRecords(getRecords().filter(function (record) { return record.id !== id; }));
          renderChallengeRows();
          applyActivityFilter();
        }
      });
    }

    document.querySelectorAll('.switch').forEach(function (toggle) {
      if (toggle.closest('[data-challenge-id], [data-red-packet-id], [data-monthly-checkin-id], [data-recharge-gift-id], [data-weekly-card-id]')) { return; }
      toggle.addEventListener('click', function () { toggle.classList.toggle('on'); });
    });
  });
})();
