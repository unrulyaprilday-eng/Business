(function () {
  'use strict';

  var AS_OF = '2026-11-12';
  var DAY = 86400000;
  var VIEWS = ['promotion', 'retention', 'conversion', 'updates', 'roi'];
  var TITLES = { promotion: '推广数据', retention: '渠道 / 广告留存', conversion: '分类转化', updates: 'APP更新统计', roi: '注册批次充值 ROI' };
  // 2026-11-12不可变历史归因快照；现态只可提供显示名称，不参与重算历史。
  var CHANNEL_FACTS = {
    CH1001: { code: 'AAAA', media: 'Facebook', type: 'link', currency: 'INR', createdAt: '2026-11-01', packageIds: ['PK1001', 'PK1002'], linkName: 'homepageads' },
    CH1002: { code: 'CCCC', media: 'TikTok', type: 'channel', currency: 'INR', createdAt: '2026-11-02', packageIds: ['PK1003', 'PK1002'], linkName: 'feed-video-01' },
    CH1003: { code: 'DDDD', media: 'Google', type: 'native', currency: 'USD', createdAt: '2026-11-03', packageIds: ['PK1001'], linkName: 'search-brand-03' },
    CH1004: { code: 'PWA01', media: '自然流量', type: 'pwa', currency: 'INR', createdAt: '2026-11-04', packageIds: ['PK1002'], linkName: 'pwa-home' },
    CH1005: { code: 'APK01', media: 'Facebook', type: 'trial', currency: 'INR', createdAt: '2026-11-05', packageIds: ['PK1004'], linkName: 'trial-video-02' },
    CH1006: { code: 'WEB01', media: 'TikTok', type: 'download', currency: 'USD', createdAt: '2026-11-06', packageIds: ['PK1004', 'PK1002'], linkName: 'download-site-01' }
  };
  var PACKAGE_FACTS = {
    PK1001: { name: 'Android原生包', type: 'native', platform: 'Android', versions: [{ version: '2.4.0', build: '20400', publishedAt: '2026-11-01' }, { version: '2.3.0', build: '20300', publishedAt: '2026-10-20' }] },
    PK1002: { name: 'PWA包', type: 'pwa', platform: 'PWA', versions: [{ version: '1.8.0', build: '10800', publishedAt: '2026-11-01' }, { version: '1.7.0', build: '10700', publishedAt: '2026-10-18' }] },
    PK1003: { name: 'Android渠道包', type: 'channel', platform: 'Android', versions: [{ version: '2.4.1', build: '20401', publishedAt: '2026-11-08' }, { version: '2.4.0', build: '20400', publishedAt: '2026-11-01' }] },
    PK1004: { name: 'Android极速 APP', type: 'fast', platform: 'Android', versions: [{ version: '1.3.0', build: '10300', publishedAt: '2026-11-05' }] }
  };
  var SCENES = { channel: '渠道入口', web: 'WEB大厅', app: 'APP大厅', download: '下载站' };
  var SOURCES = { link: '推广链接', pwa: 'PWA安装入口', native: '原生APP包', direct: '直接访问' };
  var TYPES = { link: '链接推广', pwa: 'PWA推广', trial: '试玩推广', channel: '渠道推广', native: '原生APP推广', download: '下载站推广' };
  var activeView = 'promotion';
  var filters = {};
  var COMMON = ['start', 'end', 'channel', 'media', 'link', 'currency', 'packageId', 'version'];
  var sharedFilter = null;
  var activeRows = [];
  var pageSize = 20;
  var boundSection = null;

  function api() { return window.CM; }
  function esc(value) { return api().escape(value == null ? '' : value); }
  function number(value) { return Number(value || 0).toLocaleString('en-US'); }
  function money(cents) { return (cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function rate(numerator, denominator) { return denominator ? (numerator / denominator * 100).toFixed(2) + '%' : '—'; }
  function timestamp(date) { return Date.parse(date + 'T00:00:00Z'); }
  function age(date) { return Math.floor((timestamp(AS_OF) - timestamp(date)) / DAY); }
  function validDate(value) { return /^\d{4}-\d{2}-\d{2}$/.test(value) && !isNaN(timestamp(value)) && new Date(timestamp(value)).toISOString().slice(0, 10) === value; }
  function defaults() { return { start: '2026-11-01', end: AS_OF, channel: '', media: '', link: '', source: '', scene: '', currency: '', group: 'channel', classify: 'scene', breakdown: 'summary', metrics: 'register', promotionMetrics: 'acquisition', category: 'all', period: 'current', page: 1, packageId: '', version: '' }; }
  function has(object, key) { return Object.prototype.hasOwnProperty.call(object || {}, key); }
  function share(f) { sharedFilter = {}; COMMON.forEach(function (key) { sharedFilter[key] = f[key]; }); }
  function currentFilter() { return filters[activeView] || (filters[activeView] = defaults()); }
  function channelById(state, id) { return (state.channels || []).find(function (channel) { return channel.id === id; }); }
  function currencyOf(channel) { return channel.currency || 'INR'; }
  function sourceOf(channel) {
    if (channel.type === 'native') return 'native';
    if (channel.type === 'pwa') return 'pwa';
    if (channel.media === '自然流量') return 'direct';
    return 'link';
  }
  function historicalChannels(state) {
    var channels = Object.keys(CHANNEL_FACTS).map(function (id) {
      var current = channelById(state, id);
      return Object.assign({ id: id, name: current ? current.name : CHANNEL_FACTS[id].code + '（历史渠道）' }, CHANNEL_FACTS[id]);
    });
    return channels.concat((state.channels || []).filter(function (channel) { return !CHANNEL_FACTS[channel.id]; }));
  }
  function historicalPackages(state) {
    var packages = Object.keys(PACKAGE_FACTS).map(function (id) {
      var current = (state.packages || []).find(function (pkg) { return pkg.id === id; });
      return Object.assign({}, PACKAGE_FACTS[id], { id: id, name: current ? current.name : PACKAGE_FACTS[id].name });
    });
    return packages.concat((state.packages || []).filter(function (pkg) { return !PACKAGE_FACTS[pkg.id]; }));
  }
  function versionAt(packageId, date) {
    var pkg = PACKAGE_FACTS[packageId];
    return pkg && pkg.versions.filter(function (version) { return version.publishedAt <= date; }).sort(function (a, b) { return b.publishedAt.localeCompare(a.publishedAt); })[0];
  }
  function installPackage(packageId) { return PACKAGE_FACTS[packageId] && ['native', 'channel', 'fast'].indexOf(PACKAGE_FACTS[packageId].type) !== -1; }
  function splitInteger(total, weights) {
    var weightSum = weights.reduce(function (sum, weight) { return sum + weight; }, 0);
    if (!weightSum) return weights.map(function () { return 0; });
    var parts = weights.map(function (weight) { return Math.floor(total * weight / weightSum); });
    var order = weights.map(function (weight, index) { return { index: index, remainder: total * weight % weightSum }; }).sort(function (a, b) { return b.remainder - a.remainder || a.index - b.index; });
    var remaining = total - parts.reduce(function (sum, part) { return sum + part; }, 0);
    for (var i = 0; i < remaining; i += 1) parts[order[i].index] += 1;
    return parts;
  }

  // 固定演示快照：仅六个原始渠道，生成整数人数及分为单位的金额。
  function dailyRows(state) {
    var rows = [];
    historicalChannels(state).forEach(function (channel) {
      if (!CHANNEL_FACTS[channel.id]) return;
      var seed = Number(channel.id.slice(2)) - 1000;
      for (var day = 1; day <= 12; day += 1) {
        var date = '2026-11-' + String(day).padStart(2, '0');
        if (channel.createdAt && date < String(channel.createdAt).slice(0, 10)) continue;
        var availablePackages = channel.packageIds.filter(function (id) { return versionAt(id, date); });
        var hasNative = availablePackages.some(installPackage);
        Object.keys(SCENES).forEach(function (scene, sceneIndex) {
          if (scene === 'app' && !hasNative) return;
          if (scene === 'download' && !hasNative && channel.type !== 'download') return;
          var targets = availablePackages.filter(function (id) { return scene !== 'app' || installPackage(id); });
          if (scene === 'channel' || scene === 'web' || !targets.length) targets.push('');
          var visits = 70 + ((seed * 43 + day * 29 + sceneIndex * 17) % 240);
          var registrations = Math.floor(visits * (0.15 + ((seed + day + sceneIndex) % 9) / 100));
          var firstPay = Math.floor(registrations * (0.12 + ((seed + day) % 6) / 100));
          var ticketCents = currencyOf(channel) === 'USD' ? 1200 + seed * 130 : 63000 + seed * 4500;
          var visitParts = splitInteger(visits, targets.map(function () { return 1; }));
          var registrationParts = splitInteger(registrations, visitParts);
          var payParts = splitInteger(firstPay, registrationParts);
          var paymentParts = [];
          var paymentCounts = payParts.slice();
          var payerOwners = [];
          var repeatSeen = targets.map(function () { return {}; });
          var repeatParts = {};
          payParts.forEach(function (count, owner) { for (var payer = 0; payer < count; payer += 1) payerOwners.push(owner); });
          for (var offset = 0; offset <= age(date); offset += 1) {
            var repeatCount = offset === 0 ? 0 : Math.floor(firstPay * (0.38 + seed % 3 * 0.05) / Math.sqrt(offset));
            var repeatCounts = targets.map(function () { return 0; });
            for (var repeat = 0; repeat < repeatCount; repeat += 1) {
              var payerIndex = (offset * 3 + repeat) % firstPay;
              var owner = payerOwners[payerIndex];
              repeatCounts[owner] += 1;
              repeatSeen[owner][payerIndex] = true;
              paymentCounts[owner] += 1;
            }
            var amount = offset === 0 ? firstPay * ticketCents : repeatCount * Math.round(ticketCents * (0.7 + offset % 3 * 0.1));
            paymentParts.push(splitInteger(amount, offset === 0 ? payParts : repeatCounts));
            if ([1, 3, 7].indexOf(offset) !== -1) repeatParts[offset] = repeatSeen.map(function (seen) { return Object.keys(seen).length; });
          }
          var cumulativeParts = targets.map(function (_, index) { return paymentParts.reduce(function (sum, parts) { return sum + parts[index]; }, 0); });
          var cumulativeTotal = cumulativeParts.reduce(function (sum, amount) { return sum + amount; }, 0);
          var withdrawals = splitInteger(Math.floor(cumulativeTotal * (0.2 + seed % 3 * 0.05)), cumulativeParts);
          var bets = splitInteger(Math.round(cumulativeTotal * (2 + seed % 3 * 0.5)), cumulativeParts);
          var retentionParts = {};
          [1, 3, 7, 14, 30].forEach(function (days) {
            retentionParts[days] = splitInteger(Math.floor(registrations * Math.max(0.06, 0.54 - Math.log2(days + 1) * 0.075 + seed % 3 * 0.025)), registrationParts);
          });
          targets.forEach(function (packageId, index) {
            var pkg = PACKAGE_FACTS[packageId];
            var current = versionAt(packageId, date);
            var amounts = paymentParts.map(function (parts) { return parts[index]; });
            var retention = {};
            var recharge = {};
            Object.keys(retentionParts).forEach(function (days) { retention[days] = retentionParts[days][index]; });
            [1, 3, 7].forEach(function (days) { recharge[days] = repeatParts[days] ? repeatParts[days][index] : null; });
            var exposure = pkg && scene !== 'app' ? visitParts[index] : 0;
            var clicks = Math.floor(exposure * (pkg && pkg.type === 'pwa' ? 0.55 : 0.45 + seed % 3 * 0.04));
            var startup = installPackage(packageId) ? Math.floor(clicks * (0.68 + seed % 3 * 0.03)) : 0;
            rows.push({ channel: channel, channelId: channel.id, date: date, scene: scene, source: sourceOf(channel), currency: currencyOf(channel),
              packageId: packageId, version: current ? current.version : '', packageType: pkg ? pkg.type : '',
              visits: visitParts[index], registrations: registrationParts[index], pwa: pkg && pkg.type === 'pwa' ? Math.floor(clicks * 0.72) : 0,
              native: startup, downloads: clicks, exposure: exposure, pwaClicks: pkg && pkg.type === 'pwa' ? clicks : 0,
              nativeClicks: pkg && pkg.type === 'native' ? clicks : 0, nativeStarts: pkg && pkg.type === 'native' ? startup : 0,
              channelClicks: pkg && pkg.type === 'channel' ? clicks : 0, channelStarts: pkg && pkg.type === 'channel' ? startup : 0,
              fastClicks: pkg && pkg.type === 'fast' ? clicks : 0, fastStarts: pkg && pkg.type === 'fast' ? startup : 0,
              firstPay: payParts[index], firstCents: amounts[0], payments: amounts, retention: retention, recharge: recharge,
              withdrawCents: withdrawals[index], betsCents: bets[index], paymentCount: paymentCounts[index], ticketCents: ticketCents, seed: seed });
          });
        });
      }
    });
    return rows;
  }
  function payment(row, period) {
    var days = period === 'current' ? age(row.date) : Math.min(Number(period), age(row.date));
    return row.payments.slice(0, days + 1).reduce(function (sum, amount) { return sum + amount; }, 0);
  }
  function retained(row, days) {
    if (age(row.date) < days) return null;
    return row.retention[days];
  }
  function selectedChannels(state, f) {
    return historicalChannels(state).filter(function (channel) {
      return (!f.channel || channel.id === f.channel) && (!f.media || channel.media === f.media) && (!f.link || channel.linkName === f.link) && (!f.currency || currencyOf(channel) === f.currency) && (!f.source || sourceOf(channel) === f.source);
    });
  }
  function selectedDaily(state, f) {
    var selected = selectedChannels(state, f).map(function (channel) { return channel.id; });
    return dailyRows(state).filter(function (row) {
      return selected.indexOf(row.channelId) !== -1 && row.date >= f.start && row.date <= f.end && (!f.scene || row.scene === f.scene) && (!f.packageId || (f.packageId === '__none__' ? !row.packageId : row.packageId === f.packageId)) && (!f.version || row.packageId + '@' + row.version === f.version);
    });
  }
  function sumRows(rows) {
    return rows.reduce(function (total, row) {
      ['visits', 'registrations', 'pwa', 'native', 'downloads', 'firstPay', 'firstCents', 'exposure', 'pwaClicks', 'nativeClicks', 'nativeStarts', 'channelClicks', 'channelStarts', 'fastClicks', 'fastStarts', 'withdrawCents', 'betsCents', 'paymentCount'].forEach(function (key) { total[key] += row[key]; });
      total.totalCents += payment(row, 'current');
      return total;
    }, { visits: 0, registrations: 0, pwa: 0, native: 0, downloads: 0, firstPay: 0, firstCents: 0, totalCents: 0, exposure: 0, pwaClicks: 0, nativeClicks: 0, nativeStarts: 0, channelClicks: 0, channelStarts: 0, fastClicks: 0, fastStarts: 0, withdrawCents: 0, betsCents: 0, paymentCount: 0 });
  }
  function groupBy(rows, keyFn) {
    var groups = {};
    rows.forEach(function (row) { var key = keyFn(row); (groups[key] || (groups[key] = [])).push(row); });
    return Object.keys(groups).map(function (key) { return { key: key, rows: groups[key] }; });
  }
  function option(value, label, selected) { return '<option value="' + esc(value) + '"' + (value === selected ? ' selected' : '') + '>' + esc(label) + '</option>'; }
  function selectField(label, name, options, selected) {
    return '<label class="cm-field"><span>' + esc(label) + '</span><select class="cm-input" name="' + name + '">' + options.map(function (item) { return option(item[0], item[1], selected); }).join('') + '</select></label>';
  }
  function reportPackages(state, updatesOnly) {
    return historicalPackages(state).filter(function (pkg) { return !updatesOnly || ['native', 'channel', 'fast'].indexOf(pkg.type) !== -1; });
  }
  function versionOptions(state, packageId, updatesOnly) {
    var options = [['', '全部版本']];
    reportPackages(state, updatesOnly && !packageId).filter(function (pkg) { return !packageId || pkg.id === packageId; }).forEach(function (pkg) {
      var current = (state.packages || []).find(function (item) { return item.id === pkg.id; });
      var versions = (pkg.versions || []).concat(current ? current.versions || [] : []);
      var seen = {};
      versions.forEach(function (version) {
        if (!version.version || seen[version.version]) return;
        seen[version.version] = true;
        options.push([pkg.id + '@' + version.version, pkg.name + ' · ' + version.version]);
      });
    });
    return options;
  }
  function button(action, label, extraClass, extra) { return '<button type="button" class="cm-btn ' + (extraClass || '') + '" data-cmr-action="' + action + '"' + (extra || '') + '>' + label + '</button>'; }
  function filterHtml(state, f) {
    var html = '<form class="cm-filter" data-cmr-filter><label class="cm-field"><span>' + (activeView === 'updates' ? '更新日期' : '注册批次日期') + '</span><input class="cm-input" type="date" name="start" value="' + esc(f.start) + '" max="' + AS_OF + '" required></label>';
    html += '<label class="cm-field"><span>至</span><input class="cm-input" type="date" name="end" value="' + esc(f.end) + '" max="' + AS_OF + '" required></label>';
    html += selectField('渠道', 'channel', [['', '全部渠道']].concat(historicalChannels(state).map(function (channel) { return [channel.id, channel.code + ' · ' + channel.name]; })), f.channel);
    html += selectField('历史媒体', 'media', [['', '全部媒体']].concat(Array.from(new Set(historicalChannels(state).map(function (channel) { return channel.media; }))).sort().map(function (media) { return [media, media]; })), f.media);
    html += '<button class="cm-btn primary" type="submit">查询</button>' + button('reset', '重置') + button('export', '导出CSV') + button('definitions', '数据口径');
    var advanced = f.period !== 'current' || ['link', 'currency', 'source', 'scene', 'packageId', 'version'].some(function (key) { return Boolean(f[key]); });
    html += '<details class="cm-report-more"' + (advanced ? ' open' : '') + '><summary>更多筛选</summary><div class="cm-filter">';
    html += selectField('历史广告链接', 'link', [['', '全部广告链接']].concat(Array.from(new Set(historicalChannels(state).map(function (channel) { return channel.linkName; }).filter(Boolean))).sort().map(function (link) { return [link, link]; })), f.link);
    html += selectField('币种', 'currency', [['', '全部币种']].concat(Array.from(new Set(historicalChannels(state).map(currencyOf))).sort().map(function (currency) { return [currency, currency]; })), f.currency);
    if (activeView !== 'updates') html += selectField('注册来源', 'source', [['', '全部来源']].concat(Object.keys(SOURCES).map(function (key) { return [key, SOURCES[key]]; })), f.source);
    if (activeView === 'promotion' || activeView === 'retention') html += selectField('访问场景', 'scene', [['', '全部场景']].concat(Object.keys(SCENES).map(function (key) { return [key, SCENES[key]]; })), f.scene);
    var packageOptions = reportPackages(state, activeView === 'updates');
    if (activeView === 'updates' && f.packageId && !packageOptions.some(function (pkg) { return pkg.id === f.packageId; })) {
      var selectedPackage = historicalPackages(state).find(function (pkg) { return pkg.id === f.packageId; });
      packageOptions.push({ id: f.packageId, name: (selectedPackage ? selectedPackage.name : f.packageId === '__none__' ? '无包WEB访问' : f.packageId) + '（无APP更新事件）' });
    }
    html += selectField('历史归因包', 'packageId', [['', activeView === 'updates' ? '全部安装包' : '全部包 / 无包访问']].concat(activeView === 'updates' ? [] : [['__none__', '无包WEB访问']]).concat(packageOptions.map(function (pkg) { return [pkg.id, pkg.name]; })), f.packageId);
    html += selectField('归因版本', 'version', versionOptions(state, f.packageId, activeView === 'updates'), f.version);
    if (activeView === 'roi') html += selectField('累计充值周期', 'period', [['current', '截至快照日'], ['1', 'D1'], ['3', 'D3'], ['7', 'D7'], ['14', 'D14'], ['30', 'D30']], f.period);
    html += '</div></details></form>';
    return html;
  }
  function table(headers, rows, empty) {
    return '<div class="cm-table-wrap"><table class="cm-table"><thead><tr>' + headers.map(function (heading) { return '<th>' + heading + '</th>'; }).join('') + '</tr></thead><tbody>' + (rows.length ? rows.map(function (row) { return '<tr>' + row.map(function (cell) { return '<td>' + cell + '</td>'; }).join('') + '</tr>'; }).join('') : '<tr><td colspan="' + headers.length + '" class="cm-empty">' + esc(empty || '暂无数据；新增渠道不会自动生成历史数据') + '</td></tr>') + '</tbody></table></div>';
  }
  function paginate(rows, f) {
    var pages = Math.max(1, Math.ceil(rows.length / pageSize));
    f.page = Math.max(1, Math.min(f.page, pages));
    return { rows: rows.slice((f.page - 1) * pageSize, f.page * pageSize), html: '<div class="cm-pagination"><span>共 ' + rows.length + ' 条 · 第 ' + f.page + ' / ' + pages + ' 页</span>' + button('page-prev', '上一页', '', f.page === 1 ? ' disabled' : '') + button('page-next', '下一页', '', f.page === pages ? ' disabled' : '') + '</div>' };
  }
  function channelCell(channel) { return '<span class="cm-nowrap">' + esc(channel.code) + '</span><br><span class="cm-muted">' + esc(channel.name) + '</span>'; }
  function note(text) { return '<p class="cm-note">' + text + '</p>'; }
  function pendingCell() { return '<span class="cm-muted" title="观察周期未满，暂不可计算">—</span>'; }
  function tabsHtml(kind, values, active) { return '<div class="cm-subtabs">' + values.map(function (item) { return button(kind, esc(item[1]), active === item[0] ? 'primary' : '', ' data-value="' + esc(item[0]) + '" aria-pressed="' + (active === item[0]) + '"'); }).join('') + '</div>'; }
  function csvRows(headers, rows) {
    var f = currentFilter();
    return [headers.concat(['归因包筛选', '归因版本筛选', '历史媒体筛选', '历史广告链接筛选'])].concat(rows.map(function (row) { return row.concat([f.packageId === '__none__' ? '无包WEB访问' : f.packageId || '全部包 / 无包访问', f.version || '全部版本', f.media || '全部媒体', f.link || '全部广告链接']); }));
  }
  function repeatMetric(cohort, days) {
    if (!cohort.length) return { users: null, text: '暂无数据' };
    if (!cohort.every(function (row) { return age(row.date) >= days; })) return { users: null, text: '—' };
    var users = cohort.reduce(function (sum, row) { return sum + (row.recharge[days] || 0); }, 0);
    return { users: users, text: rate(users, sumRows(cohort).firstPay) };
  }
  function promotionTabs(f) { return tabsHtml('promotion-metrics', [['acquisition', '获客转化'], ['funds', '资金表现']], f.promotionMetrics); }
  function fundingView(state, f, rows) {
    rows.forEach(function (row) { row.repeats = [1, 3, 7].map(function (days) { return repeatMetric(row.cohort, days); }); });
    activeRows = csvRows(['渠道编码', '渠道名称', '历史媒体', '币种', '充值人数', '充值次数', '批次累计充值', '次日复充人数', '次日复充占比', '3日复充人数', '3日复充占比', '7日复充人数', '7日复充占比', '累计提现', '充提差', '有效投注额'], rows.map(function (row) {
      var t = row.totals;
      if (!row.cohort.length) return [row.channel.code, row.channel.name, row.channel.media, currencyOf(row.channel)].concat(Array(12).fill('暂无数据'));
      var cells = [row.channel.code, row.channel.name, row.channel.media, currencyOf(row.channel), t.firstPay, t.paymentCount, money(t.totalCents)];
      row.repeats.forEach(function (repeat) { cells.push(repeat.users == null ? repeat.text : repeat.users, repeat.text); });
      return cells.concat([money(t.withdrawCents), money(t.totalCents - t.withdrawCents), money(t.betsCents)]);
    }));
    var page = paginate(rows, f);
    return promotionTabs(f) + note('按所选注册批次累计至 ' + AS_OF + '，各币种独立；充值 − 提现 = 充提差。复充占比以首充人数为分母，观察周期未满或分母为 0 时显示“—”。') + table(['渠道', '币种', '充值人数', '充值次数', '累计充值', '次日复充', '3日复充', '7日复充', '累计提现', '充提差', '有效投注额', '操作'], page.rows.map(function (row) {
      var t = row.totals;
      if (!row.cohort.length) return [channelCell(row.channel), esc(currencyOf(row.channel)), '暂无数据', '—', '—', '—', '—', '—', '—', '—', '—', '—'];
      var cells = [channelCell(row.channel), esc(currencyOf(row.channel)), number(t.firstPay), number(t.paymentCount), money(t.totalCents)];
      row.repeats.forEach(function (repeat) { cells.push(repeat.users == null ? pendingCell() : repeat.text + '<br><span class="cm-muted">' + number(repeat.users) + ' 人</span>'); });
      return cells.concat([money(t.withdrawCents), money(t.totalCents - t.withdrawCents), money(t.betsCents), button('daily-detail', '批次明细', 'small', ' data-channel="' + esc(row.channel.id) + '"')]);
    })) + page.html;
  }

  function promotionView(state, f, daily) {
    var rows = selectedChannels(state, f).map(function (channel) {
      var cohort = daily.filter(function (row) { return row.channelId === channel.id; });
      return { channel: channel, cohort: cohort, totals: sumRows(cohort) };
    });
    if (f.promotionMetrics === 'funds') return fundingView(state, f, rows);
    activeRows = csvRows(['渠道编码', '渠道名称', '历史媒体', '币种', '访问人数(分场景人日加总)', '注册人数', '注册转化率', 'PWA安装', '安装包首次启动', '首充人数', '首充金额', '批次累计充值', '访问首充率', '注册首充率'], rows.map(function (row) {
      var t = row.totals;
      if (!row.cohort.length) return [row.channel.code, row.channel.name, row.channel.media, currencyOf(row.channel)].concat(Array(10).fill('暂无数据'));
      return [row.channel.code, row.channel.name, row.channel.media, currencyOf(row.channel), t.visits, t.registrations, rate(t.registrations, t.visits), t.pwa, t.native, t.firstPay, money(t.firstCents), money(t.totalCents), rate(t.firstPay, t.visits), rate(t.firstPay, t.registrations)];
    }));
    var page = paginate(rows, f);
    return promotionTabs(f) + note('演示快照 ' + AS_OF + '：按注册批次及首次入口归因，历史不随配置变更；访问为入口人日加总。PWA安装与安装包首次启动独立。') + table(['渠道', '历史媒体', '币种', '访问人次（入口人日）', '注册人数', '注册转化率', 'PWA安装', '安装包首次启动', '首充人数', '首充金额', '批次累计充值', '访问首充率', '注册首充率', '操作'], page.rows.map(function (row) {
      var t = row.totals;
      if (!row.cohort.length) return [channelCell(row.channel), esc(row.channel.media), esc(currencyOf(row.channel)), '<span class="cm-muted">暂无数据</span>'].concat(Array(10).fill('—'));
      return [channelCell(row.channel), esc(row.channel.media), esc(currencyOf(row.channel)), number(t.visits), number(t.registrations), rate(t.registrations, t.visits), number(t.pwa), number(t.native), number(t.firstPay), money(t.firstCents), money(t.totalCents), rate(t.firstPay, t.visits), rate(t.firstPay, t.registrations), button('daily-detail', '每日明细', 'small', ' data-channel="' + esc(row.channel.id) + '"')];
    })) + page.html;
  }

  function retentionView(state, f, daily) {
    var rows = groupBy(daily, function (row) { return row.date + '|' + row.channelId; }).map(function (group) {
      var first = group.rows[0];
      var registrations = sumRows(group.rows).registrations;
      var result = { date: first.date, channel: first.channel, registrations: registrations, values: [] };
      [1, 3, 7, 14, 30].forEach(function (days) {
        var mature = age(first.date) >= days;
        var users = mature ? group.rows.reduce(function (sum, row) { return sum + retained(row, days); }, 0) : null;
        result.values.push({ users: users, text: mature ? rate(users, registrations) : '—' });
      });
      return result;
    }).sort(function (a, b) { return b.date.localeCompare(a.date) || a.channel.code.localeCompare(b.channel.code); });
    activeRows = csvRows(['注册批次', '渠道编码', '渠道名称', '广告链接', '注册人数', 'D1留存人数', 'D1留存率', 'D3留存人数', 'D3留存率', 'D7留存人数', 'D7留存率', 'D14留存人数', 'D14留存率', 'D30留存人数', 'D30留存率'], rows.map(function (row) {
      var cells = [row.date, row.channel.code, row.channel.name, row.channel.linkName || '未配置广告链接', row.registrations];
      row.values.forEach(function (value) { cells.push(value.users == null ? '—' : value.users, value.text); });
      return cells;
    }));
    var page = paginate(rows, f);
    return tabsHtml('retention-group', [['channel', '渠道留存'], ['ad', '广告留存']], f.group) + note('留存率 = 注册后第N日活跃人数 / 批次注册人数，与复充占比不同。观察截止 ' + AS_OF + '，观察周期未满或分母为 0 时显示“—”；媒体及广告按历史归因。') + table(['注册批次', '渠道', f.group === 'ad' ? '广告链接' : '注册来源', '注册人数', 'D1留存', 'D3留存', 'D7留存', 'D14留存', 'D30留存'], page.rows.map(function (row) {
      return [esc(row.date), channelCell(row.channel), esc(f.group === 'ad' ? row.channel.linkName || '未配置广告链接' : SOURCES[sourceOf(row.channel)]), number(row.registrations)].concat(row.values.map(function (value) { return value.users == null ? pendingCell() : value.text + '<br><span class="cm-muted">' + number(value.users) + ' 人</span>'; }));
    })) + page.html;
  }

  function conversionView(state, f, daily) {
    var labels = f.classify === 'type' ? TYPES : SCENES;
    function categoryOf(row) { return f.classify === 'type' ? row.channel.type : row.scene; }
    var categoryRows = daily.filter(function (row) { return f.category === 'all' || categoryOf(row) === f.category; });
    var summary = f.breakdown !== 'channel';
    var rows = groupBy(categoryRows, function (row) { return categoryOf(row) + '|' + row.currency + (summary ? '' : '|' + row.channelId); }).map(function (group) { return { category: categoryOf(group.rows[0]), currency: group.rows[0].currency, channel: group.rows[0].channel, total: sumRows(group.rows) }; });
    var categoryTitle = f.classify === 'type' ? '历史推广类型' : '首次引流入口';
    var controls = tabsHtml('conversion-classify', [['scene', '按访问场景'], ['type', '按推广类型']], f.classify) + tabsHtml('conversion-breakdown', [['summary', '分类汇总'], ['channel', '渠道明细']], f.breakdown) + tabsHtml('conversion-metrics', [['register', '注册与付费'], ['download', '下载与安装']], f.metrics) + tabsHtml('conversion-category', [['all', f.classify === 'type' ? '全部推广类型' : '全部入口']].concat(Object.keys(labels).map(function (key) { return [key, labels[key]]; })), f.category);
    function csvLead(row) { return summary ? [labels[row.category], row.currency] : [labels[row.category], row.channel.code, row.channel.name, row.currency]; }
    function tableLead(row) { return summary ? [esc(labels[row.category]), esc(row.currency)] : [esc(labels[row.category]), channelCell(row.channel), esc(row.currency)]; }
    var csvHeaders = summary ? [categoryTitle, '币种'] : [categoryTitle, '渠道编码', '渠道名称', '币种'];
    var tableHeaders = summary ? [categoryTitle, '币种'] : [categoryTitle, '渠道', '币种'];
    var page = paginate(rows, f);
    if (f.metrics === 'download') {
      activeRows = csvRows(csvHeaders.concat(['下载入口曝光人次', '点击下载人次', '下载点击率', 'PWA点击人次', 'PWA安装人次', 'PWA安装率', '原生下载点击人次', '原生首次启动人次', '原生安装率', '渠道包下载点击人次', '渠道包首次启动人次', '渠道包安装率', '极速 APP下载点击人次', '极速 APP首次启动人次', '极速 APP安装率']), rows.map(function (row) {
        var t = row.total;
        return csvLead(row).concat([t.exposure, t.downloads, rate(t.downloads, t.exposure), t.pwaClicks, t.pwa, rate(t.pwa, t.pwaClicks), t.nativeClicks, t.nativeStarts, rate(t.nativeStarts, t.nativeClicks), t.channelClicks, t.channelStarts, rate(t.channelStarts, t.channelClicks), t.fastClicks, t.fastStarts, rate(t.fastStarts, t.fastClicks)]);
      }));
      return controls + note('各币种独立汇总，跨日为人次加总。点击率 = 同入口点击 / 曝光；安装率 = 对应首次启动 / 点击。PWA独立计算；APP大厅无下载曝光，显示—。') + table(tableHeaders.concat(['下载曝光人次', '点击下载人次', '点击率', 'PWA点击人次', 'PWA安装人次', 'PWA安装率', '原生点击人次', '原生启动人次', '原生安装率', '渠道包点击人次', '渠道包启动人次', '渠道包安装率', '极速 APP点击人次', '极速 APP启动人次', '极速 APP安装率']), page.rows.map(function (row) {
        var t = row.total;
        if (!t.exposure) return tableLead(row).concat(Array(15).fill('—'));
        return tableLead(row).concat([number(t.exposure), number(t.downloads), rate(t.downloads, t.exposure), number(t.pwaClicks), number(t.pwa), rate(t.pwa, t.pwaClicks), number(t.nativeClicks), number(t.nativeStarts), rate(t.nativeStarts, t.nativeClicks), number(t.channelClicks), number(t.channelStarts), rate(t.channelStarts, t.channelClicks), number(t.fastClicks), number(t.fastStarts), rate(t.fastStarts, t.fastClicks)]);
      })) + page.html;
    }
    activeRows = csvRows(csvHeaders.concat(['访问人次（入口人日）', '注册人数', '注册转化率', '下载点击人次', 'PWA安装人次', '安装包首次启动人次', '首充人数', '访问首充率', '注册首充率']), rows.map(function (row) {
      var t = row.total;
      return csvLead(row).concat([t.visits, t.registrations, rate(t.registrations, t.visits), t.downloads, t.pwa, t.native, t.firstPay, rate(t.firstPay, t.visits), rate(t.firstPay, t.registrations)]);
    }));
    return controls + note('各币种独立比较；分类比例由合计分子 / 合计分母重算。后续转化保留首次入口归因，访问为入口人日加总；可切换渠道明细。') + table(tableHeaders.concat(['访问人次（入口人日）', '注册人数', '注册转化率', '下载点击人次', 'PWA安装人次', '安装包首次启动人次', '首充人数', '访问首充率', '注册首充率']), page.rows.map(function (row) {
      var t = row.total;
      return tableLead(row).concat([number(t.visits), number(t.registrations), rate(t.registrations, t.visits), number(t.downloads), number(t.pwa), number(t.native), number(t.firstPay), rate(t.firstPay, t.visits), rate(t.firstPay, t.registrations)]);
    })) + page.html;
  }

  function updateRows(state, f) {
    var rows = [];
    // 安装包更新事件独立于当前渠道绑定及版本发布状态，仅来自固定历史快照。
    historicalPackages(state).forEach(function (pkg) {
      if (!installPackage(pkg.id) || f.packageId && pkg.id !== f.packageId) return;
      var channels = selectedChannels(state, f).filter(function (channel) { return CHANNEL_FACTS[channel.id] && CHANNEL_FACTS[channel.id].packageIds.indexOf(pkg.id) !== -1; });
      channels.forEach(function (channel) {
        for (var day = 1; day <= 12; day += 1) {
          var date = '2026-11-' + String(day).padStart(2, '0');
          var version = versionAt(pkg.id, date);
          if (!version || date < f.start || date > f.end || date < channel.createdAt || f.version && pkg.id + '@' + version.version !== f.version) continue;
          var seed = Number(channel.id.slice(2)) + Number(pkg.id.slice(2)) + String(version.version).split('').reduce(function (sum, ch) { return sum + ch.charCodeAt(0); }, 0);
          var eligible = 75 + (seed + day * 23) % 180;
          var prompted = Math.floor(eligible * 0.88);
          var started = Math.floor(prompted * 0.72);
          var success = Math.floor(started * (0.86 + day % 5 * 0.02));
          rows.push({ date: date, channel: channel, pkg: pkg, version: version, eligible: eligible, prompted: prompted, started: started, success: success, failed: started - success });
        }
      });
    });
    return rows.sort(function (a, b) { return b.date.localeCompare(a.date); });
  }
  function updatesView(state, f) {
    var rows = updateRows(state, f);
    activeRows = csvRows(['更新日期', '渠道编码', 'APP包', '目标版本', '构建号', '符合更新条件设备', '收到提示设备', '开始更新设备', '成功设备', '失败设备', '成功率'], rows.map(function (row) { return [row.date, row.channel.code, row.pkg.name, row.version.version, row.version.build, row.eligible, row.prompted, row.started, row.success, row.failed, rate(row.success, row.started)]; }));
    var page = paginate(rows, f);
    return note('按更新事件日、渠道及目标包版本去重设备；成功率 = 成功 / 开始更新，跨日不去重。新包新版本暂无历史；PWA发布不计APP更新。') + table(['更新日期', '渠道', '安装包 / 目标版本', '符合条件', '收到提示', '开始更新', '成功', '失败', '成功率', '操作'], page.rows.map(function (row) {
      return [esc(row.date), channelCell(row.channel), esc(row.pkg.name) + '<br><span class="cm-muted">' + esc(row.version.version) + ' / build ' + esc(row.version.build) + '</span>', number(row.eligible), number(row.prompted), number(row.started), number(row.success), number(row.failed), rate(row.success, row.started), button('update-detail', '更新明细', 'small', ' data-index="' + rows.indexOf(row) + '"')];
    }), '当前条件下暂无APP更新记录；新建包和新发布版本不自动产生历史统计') + page.html;
  }

  function spendCents(records) { return records.reduce(function (sum, record) { return sum + Math.round(Number(record.amount || 0) * 100); }, 0); }
  function roiData(state, f, daily) {
    return selectedChannels(state, f).map(function (channel) {
      var cohort = daily.filter(function (row) { return row.channelId === channel.id; });
      var records = (state.spend || []).filter(function (record) { return record.channelId === channel.id && record.currency === currencyOf(channel) && record.date >= f.start && record.date <= f.end; });
      var mature = f.period === 'current' || cohort.length > 0 && cohort.every(function (row) { return age(row.date) >= Number(f.period); });
      return { channel: channel, cohort: cohort, records: records, spend: spendCents(records), registrations: sumRows(cohort).registrations, recharge: cohort.reduce(function (sum, row) { return sum + payment(row, f.period); }, 0), mature: mature, unallocated: Boolean(f.packageId || f.version) };
    });
  }
  function roiText(row) { return !row.cohort.length ? '暂无批次数据' : !row.mature ? '—' : row.unallocated ? '—（消耗未分包）' : row.spend ? (row.recharge / row.spend * 100).toFixed(2) + '%' : '—'; }
  function roiView(state, f, daily) {
    var rows = roiData(state, f, daily);
    activeRows = csvRows(['注册批次开始', '注册批次结束', '渠道编码', '渠道名称', '币种', '注册人数', '广告消耗', '累计充值周期', '批次累计充值', '充值ROI', '成熟状态'], rows.map(function (row) { return [f.start, f.end, row.channel.code, row.channel.name, currencyOf(row.channel), row.registrations, money(row.spend), f.period === 'current' ? '截至' + AS_OF : 'D' + f.period, row.mature && row.cohort.length ? money(row.recharge) : '—', roiText(row), !row.cohort.length ? '暂无数据' : row.mature ? '已成熟' : '—']; }));
    var html = '<div class="cm-toolbar">' + button('spend-records', '消耗记录') + button('spend-add', '新增消耗', 'primary') + button('spend-import', 'CSV导入') + button('spend-template', '下载导入模板') + '</div>';
    html += note('充值ROI = 对应批次累计充值 / 同渠道同币种消耗；观察周期未满或消耗为 0 时显示“—”。消耗未分包，包 / 版本筛选不计算ROI；观察截止 ' + AS_OF + '。');
    var currencies = Array.from(new Set(rows.map(function (row) { return currencyOf(row.channel); })));
    currencies.forEach(function (currency) {
      var grouped = rows.filter(function (row) { return currencyOf(row.channel) === currency; });
      html += '<h3>' + esc(currency) + '</h3>' + table(['渠道', '注册人数', f.packageId || f.version ? '渠道总消耗（未分包）' : '消耗', '批次累计充值', '充值ROI', '周期状态', '操作'], grouped.map(function (row) {
        var pending = row.cohort.length && !row.mature;
        return [channelCell(row.channel), row.cohort.length ? number(row.registrations) : '暂无数据', money(row.spend), pending ? pendingCell() : row.cohort.length ? money(row.recharge) : '—', pending ? pendingCell() : roiText(row), !row.cohort.length ? '<span class="cm-muted">暂无批次</span>' : row.mature ? '<span class="cm-badge green">已成熟</span>' : pendingCell(), button('roi-detail', '批次明细', 'small', ' data-channel="' + esc(row.channel.id) + '"')];
      }));
    });
    return html + (!rows.length ? '<div class="cm-empty">暂无符合条件的渠道</div>' : '');
  }

  function render(view, context) {
    if (VIEWS.indexOf(view) === -1) view = 'promotion';
    activeView = view;
    var section = document.getElementById('cm-reports');
    if (!section || !api()) return;
    var f = currentFilter();
    if (!sharedFilter) share(defaults());
    COMMON.forEach(function (key) { f[key] = sharedFilter[key]; });
    var newContext = has(context, 'channelId') || has(context, 'channel') || has(context, 'packageId');
    if (newContext) {
      var savedStart = f.start, savedEnd = f.end;
      var clean = defaults();
      COMMON.forEach(function (key) { f[key] = clean[key]; });
      f.start = savedStart; f.end = savedEnd;
      f.source = ''; f.scene = ''; f.category = 'all';
    }
    if (context) {
      if (context.packageId != null && context.version == null) f.version = '';
      if (context.classify != null && context.classify !== f.classify) f.category = 'all';
      ['channel', 'media', 'link', 'source', 'scene', 'currency', 'packageId', 'version', 'start', 'end', 'period', 'classify', 'breakdown', 'category', 'metrics', 'promotionMetrics'].forEach(function (key) {
        var contextKey = key === 'channel' && context.channelId != null ? 'channelId' : key;
        if (context[contextKey] != null) f[key] = String(context[contextKey]);
      });
      f.page = 1;
    }
    if (f.version && f.version.indexOf('@') === -1 && f.packageId && f.packageId !== '__none__') f.version = f.packageId + '@' + f.version;
    if (!validDate(f.start) || !validDate(f.end) || f.start > f.end || f.end > AS_OF) Object.assign(f, defaults());
    if (view === 'roi' || view === 'updates' || view === 'conversion') f.scene = '';
    if (view === 'updates') f.source = '';
    share(f);
    var state = api().getState();
    var daily = selectedDaily(state, f);
    var body;
    if (view === 'promotion') body = promotionView(state, f, daily);
    else if (view === 'retention') body = retentionView(state, f, daily);
    else if (view === 'conversion') body = conversionView(state, f, daily);
    else if (view === 'updates') body = updatesView(state, f);
    else body = roiView(state, f, daily);
    section.innerHTML = '<h2>' + TITLES[view] + '</h2>' + filterHtml(state, f) + body;
    init();
  }
  function reRender() { render(activeView); }
  function infoDialog(title, html, wide) { api().dialog({ title: title, html: html, width: wide ? 'wide' : 'normal', readonly: true, submitLabel: '关闭', onSubmit: function (form, close) { close(); } }); }
  function definitions() {
    var paragraphs = [
      '快照日：2026-11-12。2026-11-01至12日为固定历史演示聚合，非生产数据。原始六渠道的媒体、币种、推广类型、来源、建档日、广告链接及包绑定固定，当前配置只更新显示名称。新增渠道、包、版本无历史。',
      '日期：推广、留存、转化与ROI为注册来源批次日期，APP更新为更新事件日。访问按首次引流入口、渠道、自然日去重后加总，跨日及跨入口可能重复。注册归属唯一来源、入口及一个历史包版本或无包WEB组，分包及分版本合计不重复。',
      '访问场景指首次访问 / 引流入口：渠道入口、WEB大厅、APP大厅、下载站。注册来源指当时进入方式；推广类型为当时渠道类型。后续注册、付费、点击及安装都保留入口与媒体广告归因。历史版本按当日已发布版本归属，与当前绑定、包状态或新版本发布无关。',
      '下载漏斗：曝光为同一来源批次看见下载入口的人数，点击下载为该批次点击人数，点击率=点击/曝光。按原生包、渠道包、极速 APP分别统计同入口、同包版本点击及首次启动，安装率=对应首次启动/对应点击；PWA安装率=对应PWA安装/对应PWA点击，互不混用。APP大厅为已安装用户，无下载曝光，下载漏斗显示—。后续首次启动保留原引流入口，不能用另一个场景的启动数除以下载点击。',
      '资金表现累计至快照日，归属所选注册批次且各币种独立。样本首充发生于注册日，充值人数按批次用户去重，充值次数为事件数；充值-提现=充提差，有效投注为符合有效规则的投注金额，不是利润。次日复充为首充次日再次充值人数/首充人数，3日及7日为首充后对应窗口内再次充值去重人数/首充人数。任何批次未到窗口则整组显示—，不以已完成周期的部分代替。',
      '活跃留存=注册后第N日活跃人数/批次注册人数，与复充占比不同。观察周期未满显示—，悬停提示原因；零分母也显示—。已完成周期且人数为0时，人数显示0，有效分母下比率显示0.00%。广告留存使用事件时广告链接归因；每个原始渠道当前演示一条历史广告链接。',
      '充值ROI=对应注册批次指定周期累计充值/同渠道同币种同日期范围消耗。D1含注册日及次日，D3同理。观察周期未全部完成时不计算并显示—；零消耗也显示—，不同币种不合并。消耗只含渠道级归因，包/版本筛选只展示包收入与渠道总消耗，不计算包ROI。',
      'APP更新来自原生包、渠道包、极速 APP固定历史发布记录；目标包版本上线前无事件，新包新版本不补历史。阶段人数按同日、渠道、目标包版本去重，成功率=成功/开始更新，跨日不去重。PWA发布不等于APP更新。分类汇总按类别及币种独立合计，比例由汇总分子/分母重算；下载曝光、点击及安装跨日均为人次，不冒充区间去重人数。'
    ];
    infoDialog('数据口径与演示范围', '<div class="cm-form-section">' + paragraphs.map(function (paragraph) { return '<p>' + esc(paragraph) + '</p>'; }).join('') + '</div>', true);
  }
  function dailyDetail(channelId, roi) {
    var state = api().getState();
    var f = currentFilter();
    var channel = historicalChannels(state).find(function (item) { return item.id === channelId; });
    if (!channel) return;
    var funds = !roi && f.promotionMetrics === 'funds';
    var rows = groupBy(selectedDaily(state, f).filter(function (row) { return row.channelId === channelId; }), function (row) { return row.date; }).map(function (group) {
      var t = sumRows(group.rows);
      var date = group.rows[0].date;
      if (funds) return [date, number(t.firstPay), number(t.paymentCount), money(t.totalCents), money(t.withdrawCents), money(t.totalCents - t.withdrawCents), money(t.betsCents)].concat([1, 3, 7].map(function (days) { var repeat = repeatMetric(group.rows, days); return repeat.users == null ? pendingCell() : repeat.text + '（' + number(repeat.users) + '人）'; }));
      if (!roi) return [date, number(t.visits), number(t.registrations), number(t.pwa), number(t.native), number(t.firstPay), money(t.firstCents), money(t.totalCents)];
      var spent = spendCents((state.spend || []).filter(function (record) { return record.channelId === channelId && record.date === date && record.currency === currencyOf(channel); }));
      var mature = f.period === 'current' || age(date) >= Number(f.period);
      var recharge = group.rows.reduce(function (sum, row) { return sum + payment(row, f.period); }, 0);
      return [date, number(t.registrations), money(spent), mature ? money(recharge) : pendingCell(), mature ? f.packageId || f.version ? '—（消耗未分包）' : rate(recharge, spent) : pendingCell()];
    });
    var breakdown = '';
    if (!roi) {
      var packages = historicalPackages(state);
      var packageRows = groupBy(selectedDaily(state, f).filter(function (row) { return row.channelId === channelId; }), function (row) { return row.packageId + '@' + row.version; }).map(function (group) {
        var first = group.rows[0];
        var pkg = packages.find(function (item) { return item.id === first.packageId; });
        var total = sumRows(group.rows);
        return [esc(pkg ? pkg.name : '无包WEB访问'), esc(first.version || '—'), number(total.visits), number(total.registrations), number(total.pwa), number(total.native), money(total.firstCents), money(total.totalCents)];
      });
      breakdown = '<h3>历史包 / 版本归因</h3>' + table(['归因包', '归因版本', '访问人次（入口人日）', '注册人数', 'PWA安装人次', '安装包首次启动人次', '首充金额', '累计充值'], packageRows);
    }
    var headers = roi ? ['注册批次', '注册人数', f.packageId || f.version ? '渠道总消耗（未分包）' : '消耗', '批次累计充值', '充值ROI'] : funds ? ['注册批次', '充值人数', '充值次数', '累计充值', '累计提现', '充提差', '有效投注额', '次日复充', '3日复充', '7日复充'] : ['注册批次', '访问人次（入口人日）', '注册人数', 'PWA安装人次', '安装包首次启动人次', '首充人数', '首充金额', '累计充值'];
    infoDialog(channel.code + ' · ' + (roi ? 'ROI注册批次明细' : funds ? '资金批次明细' : '每日推广明细'), note('历史币种：' + esc(currencyOf(channel)) + '；批次范围 ' + esc(f.start) + ' 至 ' + esc(f.end) + '，观察截止 ' + AS_OF + '。') + table(headers, rows) + breakdown, true);
  }
  function updateDetail(index) {
    var row = updateRows(api().getState(), currentFilter())[index];
    if (!row) return;
    infoDialog('APP更新事件明细', '<div class="cm-form-section"><p>' + esc(row.pkg.name) + ' · ' + esc(row.version.version) + ' · build ' + esc(row.version.build) + '</p><p>更新日期：' + row.date + '；渠道：' + esc(row.channel.code) + '；平台：' + esc(row.pkg.platform) + '</p><p>目标版本发布时间：' + esc(row.version.publishedAt) + '</p></div>' + table(['符合条件设备', '收到提示', '开始更新', '成功', '失败', '成功率'], [[number(row.eligible), number(row.prompted), number(row.started), number(row.success), number(row.failed), rate(row.success, row.started)]]) + note('失败表示已开始更新但未成功的设备数；尚未开始更新的设备不计入失败。此处为聚合演示，不伪造设备ID。'), true);
  }

  function formError(form, message) {
    var target = form.querySelector('[data-cmr-error]');
    if (target) { target.textContent = message; target.hidden = false; }
    else api().toast(message);
    return false;
  }
  function safeSave(next, form, close) {
    try { api().saveState(next); }
    catch (error) { return formError(form, '保存失败，草稿已保留：' + (error.message || '本地存储不可用')); }
    close();
    reRender();
    api().toast('保存成功');
    return true;
  }
  function spendFields(state, record) {
    return '<div class="cm-form-grid"><label class="cm-field"><span>消耗日期</span><input class="cm-input" type="date" name="date" max="' + AS_OF + '" value="' + esc(record.date || AS_OF) + '" required></label>' + selectField('渠道', 'channelId', (state.channels || []).map(function (channel) { return [channel.id, channel.code + ' · ' + channel.name]; }), record.channelId || ((state.channels || [])[0] || {}).id || '') + '<label class="cm-field"><span>媒体</span><input class="cm-input" name="media" maxlength="80" value="' + esc(record.media || '') + '" required></label><label class="cm-field"><span>币种</span><input class="cm-input" name="currency" value="' + esc(record.currency || '') + '" readonly required></label><label class="cm-field"><span>消耗金额</span><input class="cm-input" type="number" name="amount" min="0.01" step="0.01" value="' + esc(record.amount == null ? '' : record.amount) + '" required></label><label class="cm-field"><span>备注</span><input class="cm-input" name="note" maxlength="200" value="' + esc(record.note || '') + '"></label></div><p class="cm-note">币种随渠道确定。保存后计入该日注册批次的渠道级消耗；不同币种不合并。每条记录表示一次消耗，允许同日追加。</p><p class="cm-error" data-cmr-error hidden></p>';
  }
  function validateSpend(record, state) {
    var channel = channelById(state, record.channelId);
    if (!validDate(record.date) || record.date > AS_OF) return '日期无效或晚于快照日';
    if (!channel) return '渠道ID不存在';
    if (record.currency !== currencyOf(channel)) return '币种必须与渠道币种 ' + currencyOf(channel) + ' 一致';
    if (!record.media || record.media.length > 80) return '请填写不超过80字的媒体';
    if (!/^\d+(?:\.\d{1,2})?$/.test(String(record.amount)) || !Number.isFinite(Number(record.amount)) || Number(record.amount) <= 0 || Number(record.amount) > 1000000000) return '消耗须大于0，最多2位小数且不超过1,000,000,000';
    if (String(record.note || '').length > 200) return '备注最多200字';
    return '';
  }
  function spendEditor(id) {
    var state = api().getState();
    if (!(state.channels || []).length) { api().toast('请先创建渠道'); return; }
    var record = id ? (state.spend || []).find(function (item) { return item.id === id; }) : {};
    if (!record) { api().toast('消耗记录已不存在'); return; }
    api().dialog({ title: id ? '编辑消耗' : '新增消耗', html: spendFields(state, record), width: 'normal', onOpen: function (form) {
      function syncChannel() {
        var channel = channelById(api().getState(), form.elements.channelId.value);
        if (!channel) return;
        form.elements.currency.value = currencyOf(channel);
        form.elements.media.value = channel.media || '';
      }
      form.elements.channelId.addEventListener('change', syncChannel);
      if (!id) syncChannel();
    }, onSubmit: function (form, close) {
      var next = api().getState();
      var item = {};
      ['date', 'channelId', 'media', 'currency', 'amount', 'note'].forEach(function (name) { item[name] = form.elements[name].value.trim(); });
      var error = validateSpend(item, next);
      if (error) return formError(form, error);
      item.amount = Number(item.amount);
      item.id = id || 'SP' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
      var records = (next.spend || []).slice();
      if (id) {
        var index = records.findIndex(function (existing) { return existing.id === id; });
        if (index === -1) return formError(form, '记录已被删除，请关闭后刷新');
        records[index] = item;
      } else records.push(item);
      return safeSave(Object.assign({}, next, { spend: records }), form, close);
    } });
  }
  function spendRecords() {
    var state = api().getState();
    var f = currentFilter();
    var channelIds = selectedChannels(state, f).map(function (channel) { return channel.id; });
    var records = (state.spend || []).filter(function (record) { return channelIds.indexOf(record.channelId) !== -1 && record.date >= f.start && record.date <= f.end && (!f.currency || record.currency === f.currency); }).sort(function (a, b) { return b.date.localeCompare(a.date); });
    var totals = {};
    records.forEach(function (record) { totals[record.currency] = (totals[record.currency] || 0) + Math.round(Number(record.amount) * 100); });
    var html = note('按当前报表日期 / 渠道 / 来源 / 币种筛选。' + Object.keys(totals).map(function (currency) { return esc(currency) + ' 合计 ' + money(totals[currency]); }).join('；'));
    html += table(['日期', '渠道', '媒体', '币种', '消耗', '备注', '操作'], records.map(function (record) {
      var channel = channelById(state, record.channelId);
      return [esc(record.date), esc(channel ? channel.code : record.channelId), esc(record.media), esc(record.currency), money(Math.round(Number(record.amount) * 100)), esc(record.note || '—'), button('spend-edit-modal', '编辑', 'small', ' data-id="' + esc(record.id) + '"') + button('spend-delete-modal', '删除', 'small danger', ' data-id="' + esc(record.id) + '"')];
    }), '当前条件下无消耗记录');
    api().dialog({ title: '消耗记录', html: html, width: 'wide', submitLabel: '关闭', onSubmit: function (form, close) { close(); }, onOpen: function (form) {
      form.addEventListener('click', function (event) {
        var action = event.target.closest('[data-cmr-action]');
        if (!action) return;
        if (action.dataset.cmrAction === 'spend-edit-modal') spendEditor(action.dataset.id);
        if (action.dataset.cmrAction === 'spend-delete-modal') deleteSpend(action.dataset.id);
      });
    } });
  }
  function deleteSpend(id) {
    var record = (api().getState().spend || []).find(function (item) { return item.id === id; });
    if (!record) return;
    api().dialog({ title: '删除消耗记录', html: '<p>确认删除 ' + esc(record.date) + ' · ' + esc(record.currency) + ' ' + money(Math.round(Number(record.amount) * 100)) + ' 的消耗？删除后ROI会重新计算。</p><p class="cm-error" data-cmr-error hidden></p>', submitLabel: '删除', onSubmit: function (form, close) {
      var next = api().getState();
      return safeSave(Object.assign({}, next, { spend: (next.spend || []).filter(function (item) { return item.id !== id; }) }), form, close);
    } });
  }

  function parseCsv(text) {
    text = text.replace(/^\uFEFF/, '');
    var rows = [], row = [], field = '', quoted = false, afterQuote = false;
    for (var i = 0; i < text.length; i += 1) {
      var ch = text[i];
      if (quoted) {
        if (ch === '"' && text[i + 1] === '"') { field += '"'; i += 1; }
        else if (ch === '"') { quoted = false; afterQuote = true; }
        else field += ch;
      } else if (ch === '"') {
        if (field || afterQuote) throw new Error('CSV引号格式不正确');
        quoted = true;
      } else if (ch === ',' || ch === '\n' || ch === '\r') {
        row.push(field); field = ''; afterQuote = false;
        if (ch !== ',') { if (ch === '\r' && text[i + 1] === '\n') i += 1; if (row.some(function (value) { return value.trim(); })) rows.push(row); row = []; }
      } else {
        if (afterQuote && ch.trim()) throw new Error('CSV引号后有多余字符');
        if (!afterQuote) field += ch;
      }
    }
    if (quoted) throw new Error('CSV引号未闭合');
    row.push(field);
    if (row.some(function (value) { return value.trim(); })) rows.push(row);
    return rows;
  }
  function fingerprint(record) { return [record.date, record.channelId, record.media, record.currency, Math.round(Number(record.amount) * 100), record.note || ''].join('\u001f'); }
  function importPreview(text, state) {
    var rows = parseCsv(text);
    if (rows.length < 2) throw new Error('CSV需包含表头及至少一条记录');
    if (rows.length > 1001) throw new Error('每次最多导入1000条记录');
    var fields = ['date', 'channelId', 'media', 'currency', 'amount', 'note'];
    var header = rows.shift().map(function (value) { return value.trim(); });
    if (header.length !== fields.length || fields.some(function (key) { return header.indexOf(key) === -1; })) throw new Error('表头必须包含 date,channelId,media,currency,amount,note；请使用模板');
    var seen = new Set((state.spend || []).map(fingerprint));
    return rows.map(function (row, index) {
      if (row.length !== header.length) throw new Error('第' + (index + 2) + '行列数与表头不一致');
      var record = {};
      fields.forEach(function (key) { record[key] = row[header.indexOf(key)].trim(); });
      var error = validateSpend(record, state);
      if (error) throw new Error('第' + (index + 2) + '行：' + error);
      var key = fingerprint(record);
      if (seen.has(key)) throw new Error('第' + (index + 2) + '行与已保存或本次导入记录完全重复');
      seen.add(key);
      record.amount = Number(record.amount);
      return record;
    });
  }
  function spendImport() {
    var pending = null;
    var previewSource = '';
    api().dialog({ title: 'CSV导入广告消耗', width: 'wide', submitLabel: '确认导入', html: '<div class="cm-form-section"><p>UTF-8 CSV，最多1000条；表头为 date,channelId,media,currency,amount,note。选择文件或粘贴内容后点击“校验预览”，所有行有效才可保存。导入为追加，完全重复记录会拒绝；各币种分别计算。</p><label class="cm-field"><span>CSV文件</span><input type="file" accept=".csv,text/csv" data-cmr-file></label><label class="cm-field"><span>CSV内容</span><textarea class="cm-input" name="csv" rows="7" spellcheck="false" placeholder="date,channelId,media,currency,amount,note"></textarea></label>' + button('import-preview', '校验预览') + '<p class="cm-error" data-cmr-error hidden></p><div data-cmr-preview></div></div>', onOpen: function (form) {
      var input = form.querySelector('[data-cmr-file]');
      input.addEventListener('change', function () {
        var file = input.files[0];
        if (!file) return;
        pending = null;
        if (file.size > 1024 * 1024) { formError(form, 'CSV文件不能超过1MB'); return; }
        var reader = new FileReader();
        reader.onload = function () { form.elements.csv.value = String(reader.result); form.querySelector('[data-cmr-preview]').innerHTML = ''; };
        reader.onerror = function () { formError(form, '文件读取失败，请重新选择'); };
        reader.readAsText(file, 'UTF-8');
      });
      form.elements.csv.addEventListener('input', function () { pending = null; form.querySelector('[data-cmr-preview]').innerHTML = ''; });
      form.addEventListener('click', function (event) {
        var target = event.target.closest('[data-cmr-action="import-preview"]');
        if (!target) return;
        try {
          previewSource = form.elements.csv.value;
          pending = importPreview(previewSource, api().getState());
          form.querySelector('[data-cmr-error]').hidden = true;
          var totals = {};
          pending.forEach(function (record) { totals[record.currency] = (totals[record.currency] || 0) + Math.round(record.amount * 100); });
          form.querySelector('[data-cmr-preview]').innerHTML = note('校验通过：' + pending.length + '条；' + Object.keys(totals).map(function (currency) { return esc(currency) + ' ' + money(totals[currency]); }).join('；') + '。预览前10条：') + table(['日期', '渠道ID', '媒体', '币种', '金额', '备注'], pending.slice(0, 10).map(function (record) { return [esc(record.date), esc(record.channelId), esc(record.media), esc(record.currency), money(Math.round(record.amount * 100)), esc(record.note)]; }));
        } catch (error) { pending = null; form.querySelector('[data-cmr-preview]').innerHTML = ''; formError(form, error.message); }
      });
    }, onSubmit: function (form, close) {
      if (!pending || form.elements.csv.value !== previewSource) return formError(form, '请先校验并预览当前CSV内容');
      var next = api().getState();
      try { pending = importPreview(previewSource, next); }
      catch (error) { return formError(form, error.message); }
      var batchId = 'SP' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
      var records = pending.map(function (record, index) { return Object.assign({}, record, { id: batchId + '-' + index }); });
      return safeSave(Object.assign({}, next, { spend: (next.spend || []).concat(records) }), form, close);
    } });
  }
  function spendTemplate() {
    var state = api().getState();
    var channel = (state.channels || [])[0];
    api().download('spend-import-template.csv', [['date', 'channelId', 'media', 'currency', 'amount', 'note'], [AS_OF, channel ? channel.id : 'CH1001', channel ? channel.media : 'Facebook', channel ? currencyOf(channel) : 'INR', '100.00', '示例记录，请替换后导入']]);
  }
  function onAction(event) {
    var target = event.target.closest('[data-cmr-action]');
    if (!target || !boundSection.contains(target)) return;
    var action = target.dataset.cmrAction;
    var f = currentFilter();
    if (action === 'reset') { filters = {}; share(defaults()); reRender(); }
    else if (action === 'export') api().download('channel-' + activeView + '-' + f.start + '-' + f.end + '.csv', activeRows);
    else if (action === 'definitions') definitions();
    else if (action === 'page-prev' || action === 'page-next') { f.page += action === 'page-next' ? 1 : -1; reRender(); }
    else if (action === 'retention-group') { f.group = target.dataset.value; f.page = 1; reRender(); }
    else if (action === 'promotion-metrics') { f.promotionMetrics = target.dataset.value; f.page = 1; reRender(); }
    else if (action === 'conversion-classify') { f.classify = target.dataset.value; f.category = 'all'; f.page = 1; reRender(); }
    else if (action === 'conversion-breakdown') { f.breakdown = target.dataset.value; f.page = 1; reRender(); }
    else if (action === 'conversion-metrics') { f.metrics = target.dataset.value; f.page = 1; reRender(); }
    else if (action === 'conversion-category') { f.category = target.dataset.value; f.page = 1; reRender(); }
    else if (action === 'daily-detail') dailyDetail(target.dataset.channel, false);
    else if (action === 'roi-detail') dailyDetail(target.dataset.channel, true);
    else if (action === 'update-detail') updateDetail(Number(target.dataset.index));
    else if (action === 'spend-add') spendEditor();
    else if (action === 'spend-records') spendRecords();
    else if (action === 'spend-import') spendImport();
    else if (action === 'spend-template') spendTemplate();
  }
  function onFilter(event) {
    if (!event.target.matches('[data-cmr-filter]')) return;
    event.preventDefault();
    var form = event.target;
    var f = Object.assign({}, currentFilter());
    ['start', 'end', 'channel', 'media', 'link', 'source', 'scene', 'currency', 'packageId', 'version', 'period'].forEach(function (name) { if (form.elements[name]) f[name] = form.elements[name].value; });
    if (!validDate(f.start) || !validDate(f.end) || f.start > f.end) { api().toast('请选择有效日期，开始日期不能晚于结束日期'); return; }
    if (f.end > AS_OF) { api().toast('演示数据观察截止 ' + AS_OF + '，请选择该日期之前的范围'); return; }
    f.page = 1;
    filters[activeView] = f;
    share(f);
    reRender();
  }
  function onPackageFilter(event) {
    if (!event.target.matches('select[name="packageId"]')) return;
    var form = event.target.closest('[data-cmr-filter]');
    if (!form) return;
    var versions = form.elements.version;
    var options = versionOptions(api().getState(), event.target.value, activeView === 'updates');
    versions.innerHTML = options.map(function (item) { return option(item[0], item[1], ''); }).join('');
    versions.value = '';
  }
  function init() {
    var section = document.getElementById('cm-reports');
    if (!section || section === boundSection) return;
    boundSection = section;
    section.addEventListener('click', onAction);
    section.addEventListener('submit', onFilter);
    section.addEventListener('change', onPackageFilter);
  }
  window.CMReports = { init: init, render: render };
}());
