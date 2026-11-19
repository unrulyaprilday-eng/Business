(function () {
  'use strict';

  var AS_OF = '2026-11-12';
  var DAY = 86400000;
  var VIEWS = ['promotion', 'retention', 'conversion', 'updates', 'roi', 'daily', 'detail'];
  var TITLES = { promotion: '推广数据', retention: '渠道 / 广告留存', conversion: '分类转化', updates: 'APP更新统计', roi: '注册批次回收分析', daily: '注册批次投放日报', detail: '渠道报表明细' };
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
  function defaults() { return { start: '2026-11-01', end: AS_OF, channel: '', media: '', link: '', source: '', scene: '', currency: '', group: 'channel', classify: 'scene', breakdown: 'summary', metrics: 'register', promotionMetrics: 'acquisition', category: 'all', period: 'current', page: 1, packageId: '', version: '', returnView: 'promotion', returnUrl: '' }; }
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
          var payerSeen = targets.map(function () { return {}; });
          var repeatSeen = targets.map(function () { return {}; });
          var repeatParts = {};
          payParts.forEach(function (count, owner) { for (var payer = 0; payer < count; payer += 1) payerOwners.push(owner); });
          for (var offset = 0; offset <= age(date); offset += 1) {
            if (offset === 0) payerOwners.forEach(function (owner, payerIndex) { payerSeen[owner][payerIndex] = true; });
            var repeatCount = offset === 0 ? 0 : Math.floor(firstPay * (0.38 + seed % 3 * 0.05) / Math.sqrt(offset));
            var repeatCounts = targets.map(function () { return 0; });
            for (var repeat = 0; repeat < repeatCount; repeat += 1) {
              var payerIndex = (offset * 3 + repeat) % firstPay;
              var owner = payerOwners[payerIndex];
              payerSeen[owner][payerIndex] = true;
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
              firstPay: payParts[index], firstPayDate: date, payerUsers: Object.keys(payerSeen[index]).length, firstCents: amounts[0], payments: amounts, retention: retention, recharge: recharge,
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
      var current = channelById(state, channel.id) || channel;
      var links = current.links || [];
      var mediaMatch = !f.media || channel.media === f.media || links.some(function (link) { return link.media === f.media; }) || (state.spend || []).some(function (record) { return record.channelId === channel.id && record.media === f.media; });
      var linkMatch = !f.link || f.link === '__unassigned' && (state.spend || []).some(function (record) { return record.channelId === channel.id && !record.linkId && !record.linkName; }) || channel.linkName === f.link || 'LK-' + channel.id + '-MAIN' === f.link && Boolean(CHANNEL_FACTS[channel.id]) || links.some(function (link) { return link.id === f.link || link.linkName === f.link; });
      return (!f.channel || channel.id === f.channel || channel.code === f.channel) && mediaMatch && linkMatch && (!f.currency || currencyOf(channel) === f.currency) && (!f.source || sourceOf(channel) === f.source);
    });
  }
  function selectedDaily(state, f) {
    var selected = selectedChannels(state, f).map(function (channel) { return channel.id; });
    return dailyRows(state).filter(function (row) {
      return selected.indexOf(row.channelId) !== -1 && (!f.media || row.channel.media === f.media) && (!f.link || row.channel.linkName === f.link || f.link === 'LK-' + row.channelId + '-MAIN') && row.date >= f.start && row.date <= f.end && (!f.scene || row.scene === f.scene) && (!f.packageId || (f.packageId === '__none__' ? !row.packageId : row.packageId === f.packageId)) && (!f.version || row.packageId + '@' + row.version === f.version || f.version.indexOf('@') === -1 && row.version === f.version);
    });
  }
  function sumRows(rows) {
    return rows.reduce(function (total, row) {
      ['visits', 'registrations', 'pwa', 'native', 'downloads', 'firstPay', 'payerUsers', 'firstCents', 'exposure', 'pwaClicks', 'nativeClicks', 'nativeStarts', 'channelClicks', 'channelStarts', 'fastClicks', 'fastStarts', 'withdrawCents', 'betsCents', 'paymentCount'].forEach(function (key) { total[key] += row[key]; });
      total.totalCents += payment(row, 'current');
      return total;
    }, { visits: 0, registrations: 0, pwa: 0, native: 0, downloads: 0, firstPay: 0, payerUsers: 0, firstCents: 0, totalCents: 0, exposure: 0, pwaClicks: 0, nativeClicks: 0, nativeStarts: 0, channelClicks: 0, channelStarts: 0, fastClicks: 0, fastStarts: 0, withdrawCents: 0, betsCents: 0, paymentCount: 0 });
  }
  function registrationHistory(state, f) { return selectedDaily(state, Object.assign({}, f, { start: '2026-11-01' })); }
  function cumulativeRegistrations(history, channelId, end) {
    return history.reduce(function (total, row) { return total + (row.channelId === channelId && row.date <= end ? row.registrations : 0); }, 0);
  }
  function averageRecharge(t) { return t.payerUsers ? money(t.totalCents / t.payerUsers) : '—'; }
  function cumulativeHeading() { return '<span title="2026-11-01起截至本行日期（汇总截至查询结束日）的历史注册，保留其他筛选；不受查询开始日限制，不可按日求和">累计注册</span>'; }
  function groupBy(rows, keyFn) {
    var groups = {};
    rows.forEach(function (row) { var key = keyFn(row); (groups[key] || (groups[key] = [])).push(row); });
    return Object.keys(groups).map(function (key) { return { key: key, rows: groups[key] }; });
  }
  function option(value, label, selected) { return '<option value="' + esc(value) + '"' + (value === selected ? ' selected' : '') + '>' + esc(label) + '</option>'; }
  function selectField(label, name, options, selected) {
    if (selected && !options.some(function (item) { return item[0] === selected; })) options = options.concat([[selected, selected + '（当前筛选）']]);
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
  function reportLinkOptions(state) {
    var options = [['', '全部广告链接']];
    if (activeView !== 'conversion') options.push(['__unassigned', '渠道消耗未细分链接（无批次归因）']);
    options = options.concat(Array.from(new Set(historicalChannels(state).map(function (channel) { return channel.linkName; }).filter(Boolean))).sort().map(function (link) { return [link, link]; }));
    (state.channels || []).forEach(function (channel) { (channel.links || []).forEach(function (link) { if (!link.legacy) options.push([link.id, (link.linkName || link.name || link.id) + '（新增链接，无历史）']); }); });
    return options;
  }
  function filterHtml(state, f) {
    var html = '<form class="cm-filter" data-cmr-filter><label class="cm-field"><span>' + (activeView === 'updates' ? '更新日期' : '注册批次日期') + '</span><input class="cm-input" type="date" name="start" value="' + esc(f.start) + '" max="' + AS_OF + '" required></label>';
    html += '<label class="cm-field"><span>至</span><input class="cm-input" type="date" name="end" value="' + esc(f.end) + '" max="' + AS_OF + '" required></label>';
    html += selectField('渠道', 'channel', [['', '全部渠道']].concat(historicalChannels(state).map(function (channel) { return [channel.id, channel.code + ' · ' + channel.name]; })), f.channel);
    var actions = '<button class="cm-btn primary" type="submit">查询</button>' + button('reset', '重置') + button('export', '导出CSV') + button('definitions', '数据口径');
    if (activeView === 'conversion') {
      html += selectField('历史广告链接', 'link', reportLinkOptions(state), f.link);
      html += selectField('历史归因包', 'packageId', [['', '全部包'], ['__none__', '未关联包']].concat(reportPackages(state, false).map(function (pkg) { return [pkg.id, pkg.name]; })), f.packageId);
      html += selectField('币种', 'currency', [['', '全部币种']].concat(Array.from(new Set(historicalChannels(state).map(currencyOf))).sort().map(function (currency) { return [currency, currency]; })), f.currency);
      html += actions + '<details class="cm-report-more"' + (f.media || f.version ? ' open' : '') + '><summary>更多筛选</summary><div class="cm-filter">';
      html += selectField('历史媒体', 'media', [['', '全部媒体']].concat(Array.from(new Set(historicalChannels(state).map(function (channel) { return channel.media; }))).sort().map(function (media) { return [media, media]; })), f.media);
      html += selectField('归因版本', 'version', versionOptions(state, f.packageId, false), f.version);
      return html + '</div></details></form>';
    }
    html += selectField('历史媒体', 'media', [['', '全部媒体']].concat(Array.from(new Set(historicalChannels(state).map(function (channel) { return channel.media; }))).sort().map(function (media) { return [media, media]; })), f.media);
    html += actions;
    var advanced = f.period !== 'current' || ['link', 'currency', 'source', 'scene', 'packageId', 'version'].some(function (key) { return Boolean(f[key]); });
    html += '<details class="cm-report-more"' + (advanced ? ' open' : '') + '><summary>更多筛选</summary><div class="cm-filter">';
    html += selectField('历史广告链接', 'link', reportLinkOptions(state), f.link);
    html += selectField('币种', 'currency', [['', '全部币种']].concat(Array.from(new Set(historicalChannels(state).map(currencyOf))).sort().map(function (currency) { return [currency, currency]; })), f.currency);
    if (activeView !== 'updates') html += selectField('注册来源', 'source', [['', '全部来源']].concat(Object.keys(SOURCES).map(function (key) { return [key, SOURCES[key]]; })), f.source);
    if (activeView === 'promotion' || activeView === 'retention' || activeView === 'detail') html += selectField('访问场景', 'scene', [['', '全部场景']].concat(Object.keys(SCENES).map(function (key) { return [key, SCENES[key]]; })), f.scene);
    var packageOptions = reportPackages(state, activeView === 'updates');
    if (activeView === 'updates' && f.packageId && !packageOptions.some(function (pkg) { return pkg.id === f.packageId; })) {
      var selectedPackage = historicalPackages(state).find(function (pkg) { return pkg.id === f.packageId; });
      packageOptions.push({ id: f.packageId, name: (selectedPackage ? selectedPackage.name : f.packageId === '__none__' ? '无包WEB访问' : f.packageId) + '（无APP更新事件）' });
    }
    html += selectField('历史归因包', 'packageId', [['', activeView === 'updates' ? '全部安装包' : '全部包 / 无包访问']].concat(activeView === 'updates' ? [] : [['__none__', '无包WEB访问']]).concat(packageOptions.map(function (pkg) { return [pkg.id, pkg.name]; })), f.packageId);
    html += selectField('归因版本', 'version', versionOptions(state, f.packageId, activeView === 'updates'), f.version);
    if (activeView === 'roi') html += selectField('累计观察周期', 'period', [['current', '截至快照日'], ['0', 'D0'], ['1', 'D1'], ['3', 'D3'], ['7', 'D7'], ['14', 'D14'], ['15', 'D15'], ['30', 'D30']], f.period);
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
    var packageFilter = f.packageId === '__none__' ? (activeView === 'conversion' ? '未关联包' : '无包WEB访问') : f.packageId || (activeView === 'conversion' ? '全部包' : '全部包 / 无包访问');
    return [headers.concat(['归因包筛选', '归因版本筛选', '历史媒体筛选', '历史广告链接筛选'])].concat(rows.map(function (row) { return row.concat([packageFilter, f.version || '全部版本', f.media || '全部媒体', f.link || '全部广告链接']); }));
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
    activeRows = csvRows(['渠道编码', '渠道名称', '历史媒体', '币种', '充值人数', '充值次数', '批次累计充值', '次日复充人数', '次日复充占比', '3日复充人数', '3日复充占比', '7日复充人数', '7日复充占比', '累计提现', '充提差', '有效投注额', '充值转化率', '人均充值', '提现次数'], rows.map(function (row) {
      var t = row.totals;
      if (!row.cohort.length) return [row.channel.code, row.channel.name, row.channel.media, currencyOf(row.channel)].concat(Array(14).fill('暂无数据'), ['—']);
      var cells = [row.channel.code, row.channel.name, row.channel.media, currencyOf(row.channel), t.payerUsers, t.paymentCount, money(t.totalCents)];
      row.repeats.forEach(function (repeat) { cells.push(repeat.users == null ? repeat.text : repeat.users, repeat.text); });
      return cells.concat([money(t.withdrawCents), money(t.totalCents - t.withdrawCents), money(t.betsCents), rate(t.payerUsers, t.registrations), averageRecharge(t), '—']);
    }));
    var page = paginate(rows, f);
    return promotionTabs(f) + note('所选注册批次累计至 ' + AS_OF + '，各币种独立。充值转化率 = 去重充值人数 / 注册人数；人均充值 = 累计充值 / 去重充值人数；充值 − 提现 = 充提差。复充观察窗口未满或分母为0显示“—”；提现次数快照缺失，显示“—”。') + table(['渠道', '币种', '充值人数', '充值次数', '累计充值', '次日复充占比', '3日复充占比', '7日复充占比', '累计提现', '充提差', '有效投注额', '充值转化率', '人均充值', '提现次数', '操作'], page.rows.map(function (row) {
      var t = row.totals;
      if (!row.cohort.length) return [channelCell(row.channel), esc(currencyOf(row.channel)), '暂无数据'].concat(Array(12).fill('—'));
      var cells = [channelCell(row.channel), esc(currencyOf(row.channel)), number(t.payerUsers), number(t.paymentCount), money(t.totalCents)];
      row.repeats.forEach(function (repeat) { cells.push(repeat.users == null ? pendingCell() : repeat.text + '<br><span class="cm-muted">' + number(repeat.users) + ' 人</span>'); });
      return cells.concat([money(t.withdrawCents), money(t.totalCents - t.withdrawCents), money(t.betsCents), rate(t.payerUsers, t.registrations), averageRecharge(t), unavailable('当前演示快照未提供提现次数'), button('daily-detail', '批次明细', 'small', ' data-channel="' + esc(row.channel.id) + '"')]);
    })) + page.html;
  }

  function promotionView(state, f, daily) {
    var history = registrationHistory(state, f);
    var rows = selectedChannels(state, f).map(function (channel) {
      var cohort = daily.filter(function (row) { return row.channelId === channel.id; });
      return { channel: channel, cohort: cohort, totals: sumRows(cohort), cumulativeRegistrations: cumulativeRegistrations(history, channel.id, f.end) };
    });
    if (f.promotionMetrics === 'funds') return fundingView(state, f, rows);
    activeRows = csvRows(['渠道编码', '渠道名称', '历史媒体', '币种', '访问人次（入口人日）', '注册人数', '注册转化率', 'PWA安装', '安装包首次启动', '首充人数', '首充金额', '批次累计充值', '访问-首充转化率', '注册-首充转化率', '累计注册'], rows.map(function (row) {
      var t = row.totals;
      if (!row.cohort.length) return [row.channel.code, row.channel.name, row.channel.media, currencyOf(row.channel)].concat(Array(10).fill('暂无数据'), [row.cumulativeRegistrations || '暂无数据']);
      return [row.channel.code, row.channel.name, row.channel.media, currencyOf(row.channel), t.visits, t.registrations, rate(t.registrations, t.visits), t.pwa, t.native, t.firstPay, money(t.firstCents), money(t.totalCents), rate(t.firstPay, t.visits), rate(t.firstPay, t.registrations), row.cumulativeRegistrations];
    }));
    var page = paginate(rows, f);
    return promotionTabs(f) + note('演示快照 ' + AS_OF + '：按注册批次及首次入口归因，历史不随配置变更；访问为入口人日加总。PWA安装与安装包首次启动独立。累计注册为2026-11-01起截至查询结束日的历史注册，保留其他筛选，不受开始日限制。') + table(['渠道', '历史媒体', '币种', '访问人次（入口人日）', '注册人数', '注册转化率', 'PWA安装', '安装包首次启动', '首充人数', '首充金额', '批次累计充值', '访问-首充转化率', '注册-首充转化率', cumulativeHeading(), '操作'], page.rows.map(function (row) {
      var t = row.totals;
      if (!row.cohort.length) return [channelCell(row.channel), esc(row.channel.media), esc(currencyOf(row.channel)), '<span class="cm-muted">暂无数据</span>'].concat(Array(9).fill('—'), [row.cumulativeRegistrations ? number(row.cumulativeRegistrations) : '—', '—']);
      return [channelCell(row.channel), esc(row.channel.media), esc(currencyOf(row.channel)), number(t.visits), number(t.registrations), rate(t.registrations, t.visits), number(t.pwa), number(t.native), number(t.firstPay), money(t.firstCents), money(t.totalCents), rate(t.firstPay, t.visits), rate(t.firstPay, t.registrations), number(row.cumulativeRegistrations), button('daily-detail', '每日明细', 'small', ' data-channel="' + esc(row.channel.id) + '"')];
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
    var packages = historicalPackages(state);
    var rows = groupBy(daily, function (row) { return JSON.stringify([row.channelId, row.channel.linkName, row.packageId, row.currency]); }).map(function (group) {
      var first = group.rows[0];
      var pkg = packages.find(function (item) { return item.id === first.packageId; });
      return { channel: first.channel, link: first.channel.linkName || '未关联链接', packageId: first.packageId, packageName: pkg ? pkg.name : first.packageId || '未关联包', currency: first.currency, total: sumRows(group.rows) };
    }).sort(function (a, b) { return a.channel.code.localeCompare(b.channel.code) || a.link.localeCompare(b.link) || a.packageId.localeCompare(b.packageId); });
    var controls = tabsHtml('conversion-metrics', [['register', '注册与付费'], ['download', '下载与安装']], f.metrics);
    function csvLead(row) { return [row.channel.code, row.channel.name, row.link, row.packageId, row.packageName, row.currency]; }
    function tableLead(row) { return [channelCell(row.channel), esc(row.link), esc(row.packageName) + (row.packageId ? '<div class="cm-cell-sub">' + esc(row.packageId) + '</div>' : ''), esc(row.currency)]; }
    var csvHeaders = ['渠道编码', '渠道名称', '广告链接', '包ID', '包名称', '币种'];
    var tableHeaders = ['渠道', '链接', '包', '币种'];
    var page = paginate(rows, f);
    if (f.metrics === 'download') {
      activeRows = csvRows(csvHeaders.concat(['下载入口曝光人次', '点击下载人次', '下载点击率', '安装 / 首次启动人次', '安装转化率']), rows.map(function (row) {
        var t = row.total;
        return csvLead(row).concat([t.exposure, t.downloads, rate(t.downloads, t.exposure), t.pwa + t.native, rate(t.pwa + t.native, t.downloads)]);
      }));
      return controls + note('每行按渠道、链接、包汇总，各币种独立。点击率 = 点击下载 / 下载曝光；安装转化率 = 本包安装或首次启动 / 本包点击下载。PWA统计安装，其他安装包统计首次启动；跨日为人次加总，分母为0显示“—”。') + table(tableHeaders.concat(['下载曝光人次', '点击下载人次', '点击率', '安装 / 首次启动人次', '安装转化率']), page.rows.map(function (row) {
        var t = row.total;
        return tableLead(row).concat([number(t.exposure), number(t.downloads), rate(t.downloads, t.exposure), number(t.pwa + t.native), rate(t.pwa + t.native, t.downloads)]);
      })) + page.html;
    }
    activeRows = csvRows(csvHeaders.concat(['访问人次（入口人日）', '注册人数', '注册转化率', '下载点击人次', 'PWA安装人次', '安装包首次启动人次', '首充人数', '访问-首充转化率', '注册-首充转化率', '充值人数', '充值转化率']), rows.map(function (row) {
      var t = row.total;
      return csvLead(row).concat([t.visits, t.registrations, rate(t.registrations, t.visits), t.downloads, t.pwa, t.native, t.firstPay, rate(t.firstPay, t.visits), rate(t.firstPay, t.registrations), t.payerUsers, rate(t.payerUsers, t.registrations)]);
    }));
    return controls + note('每行按渠道、链接、包汇总，各币种独立；未关联包的访问与转化单独保留。转化率由本行合计人数重算，访问为入口人日加总；充值转化率 = 去重充值人数 / 注册人数。样本首充均在注册日，充值人数与首充人数同值。') + table(tableHeaders.concat(['访问人次（入口人日）', '注册人数', '注册转化率', '下载点击人次', 'PWA安装人次', '安装包首次启动人次', '首充人数', '访问-首充转化率', '注册-首充转化率', '充值人数', '充值转化率']), page.rows.map(function (row) {
      var t = row.total;
      return tableLead(row).concat([number(t.visits), number(t.registrations), rate(t.registrations, t.visits), number(t.downloads), number(t.pwa), number(t.native), number(t.firstPay), rate(t.firstPay, t.visits), rate(t.firstPay, t.registrations), number(t.payerUsers), rate(t.payerUsers, t.registrations)]);
    })) + page.html;
  }

  function updateRows(state, f) {
    var rows = [];
    // 安装包更新事件独立于当前渠道绑定及版本发布状态，仅来自固定历史快照。
    historicalPackages(state).forEach(function (pkg) {
      if (!installPackage(pkg.id) || f.packageId && pkg.id !== f.packageId) return;
      var channels = selectedChannels(state, f).filter(function (channel) { return CHANNEL_FACTS[channel.id] && CHANNEL_FACTS[channel.id].packageIds.indexOf(pkg.id) !== -1 && (!f.media || channel.media === f.media) && (!f.link || channel.linkName === f.link || f.link === 'LK-' + channel.id + '-MAIN'); });
      channels.forEach(function (channel) {
        for (var day = 1; day <= 12; day += 1) {
          var date = '2026-11-' + String(day).padStart(2, '0');
          var version = versionAt(pkg.id, date);
          if (!version || date < f.start || date > f.end || date < channel.createdAt || f.version && pkg.id + '@' + version.version !== f.version && version.version !== f.version) continue;
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
      var records = spendRecordsFor(state, f, channel);
      var mature = f.period === 'current' || cohort.length > 0 && cohort.every(function (row) { return age(row.date) >= Number(f.period); });
      var reason = costReason(state, f, channel);
      return { channel: channel, cohort: cohort, records: records, spend: spendCents(records), registrations: sumRows(cohort).registrations, recharge: cohort.reduce(function (sum, row) { return sum + payment(row, f.period); }, 0), withdraw: sumRows(cohort).withdrawCents, mature: mature, unallocated: Boolean(reason), costReason: reason };
    });
  }
  function roiText(row) { return !row.cohort.length ? '暂无批次数据' : !row.mature || row.unallocated || !row.spend ? '—' : rate(row.recharge, row.spend); }
  function unavailable(reason) { return '<span class="cm-muted" title="' + esc(reason) + '">—</span>'; }
  function spendRecordsFor(state, f, channel) {
    return (state.spend || []).filter(function (record) {
      var legacyId = 'LK-' + channel.id + '-MAIN';
      var linkMatch = !f.link || f.link === '__unassigned' && !record.linkId && !record.linkName || record.linkName === f.link || record.linkId === f.link || f.link === legacyId && record.linkName === channel.linkName || f.link === channel.linkName && record.linkId === legacyId;
      return record.channelId === channel.id && record.currency === currencyOf(channel) && record.date >= f.start && record.date <= f.end && (!f.media || record.media === f.media) && linkMatch;
    });
  }
  function costReason(state, f, channel) {
    if (f.packageId || f.version) return '消耗未分包 / 版本，不能计算该包的成本或回收率';
    if (f.scene || f.source) return '消耗未细分场景 / 注册来源，不能计算该筛选的成本或回收率';
    if (f.media && (state.spend || []).some(function (record) { return record.channelId === channel.id && record.currency === currencyOf(channel) && record.date >= f.start && record.date <= f.end && !record.media; })) return '所选范围存在未细分媒体的渠道消耗，不能计算媒体成本 / 回收率';
    if (f.link && f.link !== '__unassigned' && (state.spend || []).some(function (record) { return record.channelId === channel.id && record.currency === currencyOf(channel) && record.date >= f.start && record.date <= f.end && (!f.media || !record.media || record.media === f.media) && !record.linkId && !record.linkName; })) return '所选范围存在渠道级未细分链接消耗，不能分摊或计算链接成本 / 回收率';
    return '';
  }
  function navigationContext(extra) {
    var f = currentFilter(), result = {};
    COMMON.concat(['source', 'scene', 'period', 'promotionMetrics', 'classify', 'breakdown', 'metrics', 'category', 'group', 'returnView', 'returnUrl']).forEach(function (key) { result[key] = f[key]; });
    return Object.assign(result, extra || {});
  }
  function returnTarget(value) {
    if (typeof value !== 'string' || !value || /[\\\x00-\x20#]/.test(value)) return null;
    var parts = value.split('?'), path;
    if (parts.length > 2) return null;
    try { path = decodeURIComponent(parts[0]); } catch (error) { return null; }
    var views = path === '渠道报表.html' ? ['promotion', 'conversion', 'retention'] : path === '投放数据报表.html' ? ['daily', 'roi'] : null;
    if (!views) return null;
    var params = new URLSearchParams(parts[1] || ''), view = params.get('view') || views[0];
    if (views.indexOf(view) === -1) return null;
    var context = defaults();
    COMMON.concat(['source', 'scene', 'period', 'promotionMetrics', 'classify', 'breakdown', 'metrics', 'category', 'group', 'returnView']).forEach(function (key) {
      if (params.has(key)) context[key] = params.get(key);
    });
    [['channelId', 'channel'], ['package', 'packageId'], ['linkId', 'link']].forEach(function (pair) {
      if (!params.has(pair[1]) && params.has(pair[0])) context[pair[1]] = params.get(pair[0]);
    });
    context.returnUrl = '';
    return { view: view, context: context, url: value };
  }
  function spendToolbar() { return '<div class="cm-toolbar">' + button('spend-view', '查看消耗') + button('spend-entry', '录入消耗', 'primary') + '</div>'; }
  function roiView(state, f, daily) {
    var rows = roiData(state, f, daily);
    activeRows = csvRows(['注册批次开始', '注册批次结束', '渠道编码', '渠道名称', '币种', '注册人数', '广告消耗', '累计观察周期', '批次累计充值', '充值回收率', '成熟状态', '周期提现', '净回收率', '成本口径说明'], rows.map(function (row) { return [f.start, f.end, row.channel.code, row.channel.name, currencyOf(row.channel), row.registrations, row.unallocated ? '—' : money(row.spend), f.period === 'current' ? '截至' + AS_OF : 'D' + f.period, row.mature && row.cohort.length ? money(row.recharge) : '—', roiText(row), !row.cohort.length ? '暂无数据' : row.mature ? '已成熟' : '—', f.period === 'current' && row.cohort.length ? money(row.withdraw) : '—', f.period === 'current' && row.cohort.length && !row.unallocated && row.spend ? rate(row.recharge - row.withdraw, row.spend) : '—', row.costReason || (f.period !== 'current' ? '历史快照不含分期提现，周期净回收率不可计算' : '')]; }));
    var html = spendToolbar();
    html += note('充值回收率 = 批次累计充值 / 同渠道同币种消耗；净回收率 =（充值 − 提现）/ 消耗，并非利润。周期统一作用于所有行；D0为注册当日，D1为当日及次日。历史快照只有截至快照日累计提现，因此仅累计周期计算净回收率，其他周期显示—。包 / 版本及未细分链接消耗不计算成本或回收率；观察截止 ' + AS_OF + '。');
    var currencies = Array.from(new Set(rows.map(function (row) { return currencyOf(row.channel); })));
    currencies.forEach(function (currency) {
      var grouped = rows.filter(function (row) { return currencyOf(row.channel) === currency; });
      html += '<h3>' + esc(currency) + '</h3>' + table(['渠道', '注册人数', '匹配广告消耗', '批次累计充值', '充值回收率', '累计提现', '净回收率', '周期状态', '操作'], grouped.map(function (row) {
        var pending = row.cohort.length && !row.mature;
        return [channelCell(row.channel), row.cohort.length ? number(row.registrations) : '暂无数据', row.unallocated ? unavailable(row.costReason) : money(row.spend), pending ? pendingCell() : row.cohort.length ? money(row.recharge) : '—', pending ? pendingCell() : row.unallocated ? unavailable(row.costReason) : row.spend ? roiText(row) : unavailable('匹配消耗为0，不能计算回收率'), f.period === 'current' && row.cohort.length ? money(row.withdraw) : unavailable('历史快照不含分期提现'), f.period !== 'current' ? unavailable('历史快照不含分期提现，周期净回收率不可计算') : row.unallocated ? unavailable(row.costReason) : row.cohort.length && row.spend ? rate(row.recharge - row.withdraw, row.spend) : unavailable('暂无批次或匹配消耗为0'), !row.cohort.length ? '<span class="cm-muted">暂无批次</span>' : row.mature ? '<span class="cm-badge green">已成熟</span>' : pendingCell(), button('roi-detail', '批次明细', 'small', ' data-channel="' + esc(row.channel.id) + '"')];
      }));
    });
    return html + (!rows.length ? '<div class="cm-empty">暂无符合条件的渠道</div>' : '');
  }

  function dailyView(state, f, daily) {
    // 首充事件日与注册批次日分开统计；固定样本恰好全部在注册日首充。
    var firstPayEvents = registrationHistory(state, f);
    var groups = groupBy(daily, function (row) { return row.date + '|' + row.channelId + '|' + row.currency; });
    var channels = selectedChannels(state, f);
    channels.forEach(function (channel) {
      spendRecordsFor(state, f, channel).forEach(function (record) {
        var key = record.date + '|' + channel.id + '|' + record.currency;
        if (!groups.some(function (group) { return group.key === key; })) groups.push({ key: key, rows: [], date: record.date, channel: channel });
      });
    });
    var rows = groups.map(function (group) {
      var first = group.rows[0], channel = first ? first.channel : group.channel, date = first ? first.date : group.date;
      var dayFilter = Object.assign({}, f, { start: date, end: date }), total = sumRows(group.rows);
      var records = spendRecordsFor(state, dayFilter, channel);
      var media = f.media || Array.from(new Set(records.map(function (record) { return record.media || '未细分媒体'; }).concat(first ? [channel.media] : []))).join(' / ') || channel.media;
      return { date: date, channel: channel, media: media, cohort: group.rows, total: total, spend: spendCents(records), reason: costReason(state, dayFilter, channel) };
    }).sort(function (a, b) { return b.date.localeCompare(a.date) || currencyOf(a.channel).localeCompare(currencyOf(b.channel)) || a.channel.code.localeCompare(b.channel.code); });
    function cells(row, html) {
      var t = row.total, validCost = !row.reason && row.spend > 0 && row.cohort.length;
      function missing(reason) { return html ? unavailable(reason) : '—'; }
      var firstPayOnDay = firstPayEvents.filter(function (event) { return event.channelId === row.channel.id && event.firstPayDate === row.date; }).reduce(function (total, event) { return total + event.firstPay; }, 0);
      return [html ? esc(row.date) : row.date, html ? channelCell(row.channel) : row.channel.code, html ? esc(row.media) : row.media, html ? esc(currencyOf(row.channel)) : currencyOf(row.channel), row.reason ? missing(row.reason) : money(row.spend), row.cohort.length ? html ? number(t.registrations) : t.registrations : '暂无批次', validCost && t.registrations ? money(row.spend / t.registrations) : missing(row.reason || '匹配消耗或注册人数为0 / 暂无批次'), row.cohort.length ? html ? number(t.firstPay) : t.firstPay : '—', validCost && t.firstPay ? money(row.spend / t.firstPay) : missing(row.reason || '匹配消耗或首充人数为0 / 暂无批次'), row.cohort.length ? money(t.firstCents) : '—', row.cohort.length ? money(t.totalCents) : '—', row.cohort.length ? money(t.withdrawCents) : '—', validCost ? rate(t.totalCents, row.spend) : missing(row.reason || '匹配消耗为0 / 暂无批次'), validCost ? rate(t.totalCents - t.withdrawCents, row.spend) : missing(row.reason || '匹配消耗为0 / 暂无批次'), row.cohort.length ? html ? number(firstPayOnDay) : firstPayOnDay : '—'];
    }
    var headers = ['注册批次日期', '渠道', '历史媒体', '币种', '匹配广告消耗', '注册人数', '注册成本', '批次累计首充人数', '首充成本', '首充金额', '批次累计充值', '累计提现', '充值回收率', '净回收率', '当日首充人数'];
    activeRows = csvRows(headers.concat(['成本口径说明']), rows.map(function (row) { return cells(row, false).concat([row.reason]); }));
    var page = paginate(rows, f);
    return spendToolbar() + note('按注册批次日期、渠道、币种汇总，不是事件日流水。当日首充人数单独按首充发生日统计，样本全部在注册日首充；其余首充、充值及提现累计至 ' + AS_OF + '。首充成本即原充值成本；充值回收率 = 充值 / 消耗，净回收率 =（充值 − 提现）/ 消耗，并非利润。消耗未分包 / 链接时不分摊成本。') + table(headers.map(function (header) { return header === '首充成本' ? '<span title="充值成本 = 消耗 / 批次累计首充人数">首充成本</span>' : header; }).concat(['操作']), page.rows.map(function (row) { return cells(row, true).concat([button('cohort-detail', '批次明细', 'small', ' data-channel="' + esc(row.channel.id) + '" data-date="' + row.date + '"')]); })) + page.html;
  }

  function detailView(state, f, daily) {
    var funds = f.promotionMetrics === 'funds';
    var history = registrationHistory(state, f);
    var rows = groupBy(daily, function (row) { return row.date + '|' + row.channelId + '|' + row.channel.media + '|' + row.channel.linkName + '|' + row.currency; }).map(function (group) {
      var first = group.rows[0];
      return { date: first.date, channel: first.channel, rows: group.rows, total: sumRows(group.rows), mature: f.period === 'current' || age(first.date) >= Number(f.period), recharge: group.rows.reduce(function (sum, row) { return sum + payment(row, f.period); }, 0) };
    }).sort(function (a, b) { return b.date.localeCompare(a.date) || a.channel.code.localeCompare(b.channel.code); });
    var lead = ['注册批次日期', '渠道编码', '渠道名称', '历史媒体', '历史广告链接', '币种'];
    var headers = funds ? ['充值人数', '充值次数', '批次累计充值', '次日复充人数', '次日复充占比', '3日复充人数', '3日复充占比', '7日复充人数', '7日复充占比', '累计提现', '充提差', '有效投注额', '充值转化率', '人均充值', '提现次数'] : ['访问人次（入口人日）', '注册人数', '注册转化率', 'PWA安装', '安装包首次启动', '首充人数', '首充金额', '批次累计充值', '访问-首充转化率', '注册-首充转化率', '累计注册'];
    function values(row, html) {
      var t = row.total;
      var recharge = row.mature ? money(row.recharge) : html ? pendingCell() : '—';
      var cumulative = cumulativeRegistrations(history, row.channel.id, row.date);
      if (!funds) return [html ? number(t.visits) : t.visits, html ? number(t.registrations) : t.registrations, rate(t.registrations, t.visits), html ? number(t.pwa) : t.pwa, html ? number(t.native) : t.native, html ? number(t.firstPay) : t.firstPay, money(t.firstCents), recharge, rate(t.firstPay, t.visits), rate(t.firstPay, t.registrations), html ? number(cumulative) : cumulative];
      var result = [html ? number(t.payerUsers) : t.payerUsers, html ? number(t.paymentCount) : t.paymentCount, recharge];
      [1, 3, 7].forEach(function (days) { var repeat = repeatMetric(row.rows, days); result.push(repeat.users == null ? html ? pendingCell() : repeat.text : html ? number(repeat.users) : repeat.users, repeat.users == null && html ? pendingCell() : repeat.text); });
      var current = f.period === 'current', missing = html ? unavailable('历史快照不含分期提现 / 投注，周期资金指标不可计算') : '—';
      return result.concat([current ? money(t.withdrawCents) : missing, current ? money(t.totalCents - t.withdrawCents) : missing, current ? money(t.betsCents) : missing, rate(t.payerUsers, t.registrations), row.mature && t.payerUsers ? money(row.recharge / t.payerUsers) : html ? unavailable(row.mature ? '充值人数为0，无法计算人均充值' : '观察周期未满，暂不可计算') : '—', html ? unavailable('当前演示快照未提供提现次数') : '—']);
    }
    activeRows = csvRows(lead.concat(headers), rows.map(function (row) { return [row.date, row.channel.code, row.channel.name, row.channel.media, row.channel.linkName, currencyOf(row.channel)].concat(values(row, false)); }));
    var page = paginate(rows, f);
    return '<div class="cm-toolbar">' + button('back-summary', '返回汇总') + '</div>' + promotionTabs(f) + note('同汇总历史归因，包 / 版本筛选生效。充值观察周期：' + (f.period === 'current' ? '累计至 ' + AS_OF : 'D' + esc(f.period)) + '；人数及次数截至快照日，复充按各自窗口。累计注册滚动至本行日期，不受开始日限制，不可逐日求和。比例按分子 / 分母重算，人均充值按所选周期充值 / 去重充值人数。提现次数快照缺失；分期提现 / 投注缺失，仅累计周期展示。跨入口 / 跨日访问为人次。') + table(lead.concat(headers.map(function (header) { return header === '累计注册' ? cumulativeHeading() : header; })), page.rows.map(function (row) { return [esc(row.date), esc(row.channel.code), esc(row.channel.name), esc(row.channel.media), esc(row.channel.linkName), esc(currencyOf(row.channel))].concat(values(row, true)); })) + page.html;
  }

  function render(view, context) {
    if (VIEWS.indexOf(view) === -1) view = 'promotion';
    if (context && !has(context, 'link') && context.linkId != null) context = Object.assign({}, context, { link: context.linkId });
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
      ['channel', 'media', 'link', 'source', 'scene', 'currency', 'packageId', 'version', 'start', 'end', 'period', 'classify', 'breakdown', 'category', 'metrics', 'promotionMetrics', 'returnView', 'returnUrl', 'group'].forEach(function (key) {
        var contextKey = key === 'channel' && context.channelId != null ? 'channelId' : key;
        if (context[contextKey] != null) f[key] = String(context[contextKey]);
      });
      f.page = 1;
    }
    Object.keys(CHANNEL_FACTS).some(function (channelId) {
      if (f.link !== 'LK-' + channelId + '-MAIN') return false;
      f.link = CHANNEL_FACTS[channelId].linkName;
      return true;
    });
    if (f.version && f.version.indexOf('@') === -1 && f.packageId && f.packageId !== '__none__') f.version = f.packageId + '@' + f.version;
    if (['current', '0', '1', '3', '7', '14', '15', '30'].indexOf(f.period) === -1) f.period = 'current';
    if (f.returnUrl && !returnTarget(f.returnUrl)) f.returnUrl = '';
    if (!validDate(f.start) || !validDate(f.end) || f.start > f.end || f.end > AS_OF) Object.assign(f, defaults());
    if (view === 'roi' || view === 'updates' || view === 'conversion' || view === 'daily') f.scene = '';
    if (view === 'updates') f.source = '';
    if (view === 'conversion') {
      // 旧分类链接统一进入平铺报表，移除已经隐藏的分类及来源条件。
      f.source = ''; f.classify = ''; f.breakdown = ''; f.category = 'all';
      if (['register', 'download'].indexOf(f.metrics) === -1) f.metrics = 'register';
    }
    share(f);
    if (api().navigateContext) api().navigateContext(navigationContext());
    if (view === 'detail') {
      var back = document.getElementById('cm-detail-back');
      var returnView = ['promotion', 'conversion', 'retention', 'daily', 'roi'].indexOf(f.returnView) !== -1 ? f.returnView : 'promotion';
      var target = returnTarget(f.returnUrl);
      if (back && api().navigateUrl) back.href = target ? target.url : api().navigateUrl(returnView, navigationContext());
    }
    var state = api().getState();
    var daily = selectedDaily(state, f);
    var body;
    if (view === 'promotion') body = promotionView(state, f, daily);
    else if (view === 'retention') body = retentionView(state, f, daily);
    else if (view === 'conversion') body = conversionView(state, f, daily);
    else if (view === 'updates') body = updatesView(state, f);
    else if (view === 'daily') body = dailyView(state, f, daily);
    else if (view === 'detail') body = detailView(state, f, daily);
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
      '注册转化率=注册人数/访问人次；访问-首充转化率=首充人数/访问人次；注册-首充转化率=首充人数/注册人数；充值转化率=批次去重充值人数/注册人数；人均充值=批次累计充值/去重充值人数，明细选择D周期时按对应周期充值计算。充值人数独立按支付用户归属去重，当前样本全部首充发生于注册日，因此与首充人数同值，不代表生产环境两者恒等。当日首充人数按首充事件日期统计，批次累计首充人数按注册批次累计至快照日，生产需分别接入注册日期与首充发生日期；首充成本即原充值成本=消耗/批次累计首充人数。累计注册从演示历史起点2026-11-01计至查询结束日，明细滚动至本行日期；保留渠道、媒体、来源、场景、币种、包版本等筛选，不受查询开始日限制，不按日求和。当前演示快照未提供提现次数，需接入提现事件数；不得根据提现金额反推次数，表格与CSV显示—。',
      '活跃留存=注册后第N日活跃人数/批次注册人数，与复充占比不同。观察周期未满显示—，悬停提示原因；零分母也显示—。已完成周期且人数为0时，人数显示0，有效分母下比率显示0.00%。广告留存使用事件时广告链接归因；每个原始渠道当前演示一条历史广告链接。',
      '充值回收率=对应注册批次指定周期累计充值/同渠道同币种同日期范围消耗；净回收率=(充值-提现)/消耗，并非利润。D0为注册当日，D1含当日及次日，其他周期同理。观察周期未全部完成、消耗为0时显示—；不同币种不合并。历史快照只有截至快照日累计提现，仅累计周期计算净回收率，D周期的提现与净回收率均显示—。消耗没有包/版本归因时，包消耗、成本和回收率均显示—，不以全渠道消耗替代；具体链接筛选若范围有渠道级未细分消耗，也不分摊，消耗与链接成本 / 回收率显示—。未细分链接筛选只展示相应消耗，不冒充注册批次。消耗通过独立广告消耗页维护，金额使用报表币种，不重复换汇。',
      'APP更新来自原生包、渠道包、极速 APP固定历史发布记录；目标包版本上线前无事件，新包新版本不补历史。阶段人数按同日、渠道、目标包版本去重，成功率=成功/开始更新，跨日不去重。PWA发布不等于APP更新。分类转化直接按渠道、历史广告链接、历史归因包及币种平铺，不再拆分访问场景或推广类型；未关联包单列，比例由汇总分子/分母重算。下载安装指标按每个包合计，PWA用安装人次，其他安装包用首次启动人次；曝光、点击及安装跨日均为人次，不冒充区间去重人数。'
    ];
    infoDialog('数据口径与演示范围', '<div class="cm-form-section">' + paragraphs.map(function (paragraph) { return '<p>' + esc(paragraph) + '</p>'; }).join('') + '</div>', true);
  }
  function updateDetail(index) {
    var row = updateRows(api().getState(), currentFilter())[index];
    if (!row) return;
    infoDialog('APP更新事件明细', '<div class="cm-form-section"><p>' + esc(row.pkg.name) + ' · ' + esc(row.version.version) + ' · build ' + esc(row.version.build) + '</p><p>更新日期：' + row.date + '；渠道：' + esc(row.channel.code) + '；平台：' + esc(row.pkg.platform) + '</p><p>目标版本发布时间：' + esc(row.version.publishedAt) + '</p></div>' + table(['符合条件设备', '收到提示', '开始更新', '成功', '失败', '成功率'], [[number(row.eligible), number(row.prompted), number(row.started), number(row.success), number(row.failed), rate(row.success, row.started)]]) + note('失败表示已开始更新但未成功的设备数；尚未开始更新的设备不计入失败。此处为聚合演示，不伪造设备ID。'), true);
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
    else if (action === 'conversion-metrics') { f.metrics = target.dataset.value; f.page = 1; reRender(); }
    else if (action === 'daily-detail' || action === 'roi-detail' || action === 'cohort-detail') {
      var origin = navigationContext({ returnUrl: '' });
      var context = navigationContext({ channel: target.dataset.channel, returnView: activeView, returnUrl: api().navigateUrl ? api().navigateUrl(activeView, origin) : '', promotionMetrics: action === 'roi-detail' || activeView === 'daily' ? 'funds' : f.promotionMetrics, period: activeView === 'roi' ? f.period : 'current' });
      if (target.dataset.date) { context.start = target.dataset.date; context.end = target.dataset.date; }
      api().go('detail', context);
    }
    else if (action === 'back-summary') {
      var destination = returnTarget(f.returnUrl);
      if (destination) api().go(destination.view, destination.context);
      else api().go(['promotion', 'conversion', 'retention', 'daily', 'roi'].indexOf(f.returnView) !== -1 ? f.returnView : 'promotion', navigationContext({ returnUrl: '' }));
    }
    else if (action === 'update-detail') updateDetail(Number(target.dataset.index));
    else if (action === 'spend-view' || action === 'spend-entry') api().go('spend', navigationContext({ entry: action === 'spend-entry' ? 'add' : '' }));
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
