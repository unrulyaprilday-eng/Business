(function () {
  var CHALLENGE_STORAGE_KEY = 'promoChallengeActivities';

  function escapeHtml(value) {
    return String(value || '')
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

  function updateRecord(id, updater) {
    var records = getRecords();
    records = records.map(function (record) {
      if (record.id === id) { updater(record); }
      return record;
    });
    setRecords(records);
    renderChallengeRows();
  }

  document.addEventListener('DOMContentLoaded', function () {
    var createButton = document.getElementById('createActivityBtn');
    var tbody = document.getElementById('promoActivityRows');
    renderChallengeRows();

    if (createButton) {
      createButton.addEventListener('click', function () {
        window.location.href = '新增活动.html';
      });
    }

    if (tbody) {
      tbody.addEventListener('click', function (event) {
        var challengeRow = event.target.closest('[data-challenge-id]');
        var toggle = event.target.closest('[data-challenge-toggle]');
        var id;
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
        }
      });
    }

    document.querySelectorAll('.switch').forEach(function (toggle) {
      if (toggle.closest('[data-challenge-id]')) { return; }
      toggle.addEventListener('click', function () { toggle.classList.toggle('on'); });
    });
  });
})();
