(function () {
  'use strict';
  var AS_OF = '2026-11-12', MAX_AMOUNT = 1000000000, PAGE_SIZE = 20;
  var CURRENCIES = ['USDT', 'INR', 'USD'];
  var filter = defaults(), section = null, serial = 0;
  function api() { return window.CM; }
  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function esc(value) { return api().escape(value == null ? '' : String(value)); }
  function defaults() { return { start: '2026-11-01', end: AS_OF, channelId: '', media: '', link: '', currency: '', page: 1 }; }
  function validDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    var time = Date.parse(value + 'T00:00:00Z');
    return Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === value;
  }
  function cents(value) {
    var text = String(value == null ? '' : value).trim();
    if (!/^\d+(?:\.\d{1,2})?$/.test(text)) throw new Error('金额须为最多两位小数的正数');
    var parts = text.split('.'), result = Number(parts[0]) * 100 + Number(((parts[1] || '') + '00').slice(0, 2));
    if (!Number.isSafeInteger(result) || result <= 0 || result > MAX_AMOUNT * 100) throw new Error('金额须大于 0 且不超过 1,000,000,000');
    return result;
  }
  function rate(value) {
    var text = String(value == null ? '' : value).trim();
    if (!/^\d+(?:\.\d{1,8})?$/.test(text) || Number(text) <= 0 || Number(text) > 1000000) throw new Error('汇率须大于 0、不超过 1,000,000，最多八位小数');
    return text;
  }
  function convert(amountCents, exchangeRate) {
    var parts = rate(exchangeRate).split('.'), decimals = (parts[1] || '').length;
    var scale = BigInt('1' + '0'.repeat(decimals)), multiplier = BigInt(parts.join(''));
    var result = Number((BigInt(amountCents) * multiplier + scale / BigInt(2)) / scale);
    if (result > MAX_AMOUNT * 100 || !Number.isSafeInteger(result) || result <= 0) throw new Error('折算金额须大于 0 且不超过 1,000,000,000');
    return result;
  }
  function money(value) { return Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function channelById(state, id) { return (state.channels || []).find(function (item) { return String(item.id) === String(id); }); }
  function links(channel) {
    if (!channel) return [];
    if (Array.isArray(channel.links)) return channel.links.map(function (item) {
      return { id: String(item.id), name: item.linkName || item.name || item.id, media: item.media || channel.media || '' };
    });
    return channel.linkName ? [{ id: 'LK-' + channel.id + '-MAIN', name: channel.linkName, media: channel.media || '' }] : [];
  }
  function normalized(record, state) {
    var result = clone(record), channel = channelById(state, record.channelId);
    result.channelCode = record.channelCode || (channel && channel.code) || record.channelId;
    result.channelName = record.channelName || (channel && channel.name) || '历史渠道';
    result.originalCurrency = record.originalCurrency || record.currency;
    result.originalAmount = record.originalAmount == null ? Number(record.amount) : Number(record.originalAmount);
    result.exchangeRate = record.exchangeRate == null ? 1 : Number(record.exchangeRate);
    result.linkId = record.linkId || '';
    result.linkName = record.linkName || (result.linkId && links(channel).filter(function (item) { return item.id === result.linkId; }).map(function (item) { return item.name; })[0]) || '';
    result.media = record.media || '';
    result.note = String(record.note || '');
    return result;
  }
  function makeRecord(values, state, saved) {
    if (!validDate(values.date)) throw new Error('请选择有效的消耗日期');
    var channel = channelById(state, values.channelId);
    if (!channel) throw new Error('请选择已有渠道');
    var linkId = String(values.linkId || ''), link = links(channel).find(function (item) { return item.id === linkId; });
    var sameBinding = saved && saved.channelId === channel.id && String(saved.linkId || '') === linkId;
    if (linkId && !link && !sameBinding) throw new Error('广告链接不存在或不属于所选渠道');
    var currency = sameBinding ? saved.currency : (channel.currency || 'INR');
    var originalCurrency = String(values.originalCurrency || values.currency || '').toUpperCase();
    if (CURRENCIES.indexOf(originalCurrency) < 0) throw new Error('原币仅支持 USDT、INR、USD');
    if (CURRENCIES.indexOf(currency) < 0) throw new Error('渠道报表币种不受支持');
    var originalCents = cents(values.originalAmount == null ? values.amount : values.originalAmount);
    var exchangeRate = originalCurrency === currency ? '1' : rate(values.exchangeRate);
    var amountCents = convert(originalCents, exchangeRate), media = sameBinding ? saved.media : (link ? link.media : channel.media || '');
    if (values.media && !linkId && !sameBinding) {
      if (values.media !== channel.media && !links(channel).some(function (item) { return item.media === values.media; })) throw new Error('媒体不属于所选渠道');
      media = values.media;
    }
    var note = String(values.note || '').trim();
    if (note.length > 500) throw new Error('备注不能超过 500 个字符');
    return Object.assign({}, saved || {}, {
      id: saved ? saved.id : 'SP-' + Date.now().toString(36) + '-' + (++serial), date: values.date,
      channelId: channel.id, channelCode: sameBinding ? saved.channelCode : channel.code,
      channelName: sameBinding ? saved.channelName : channel.name, media: media,
      linkId: linkId, linkName: sameBinding ? saved.linkName : (link ? link.name : ''),
      currency: currency, amount: amountCents / 100, originalCurrency: originalCurrency,
      originalAmount: originalCents / 100, exchangeRate: Number(exchangeRate), note: note,
      updatedAt: new Date().toISOString()
    });
  }
  function signature(record) {
    return JSON.stringify([record.date, record.channelId, record.linkId || '', record.media || '', record.currency,
      record.originalCurrency, Math.round(record.originalAmount * 100), Number(record.exchangeRate), record.note || '']);
  }
  function assertUnique(records, state, excludeId) {
    var seen = new Set((state.spend || []).filter(function (item) { return item.id !== excludeId; }).map(function (item) { return signature(normalized(item, state)); }));
    records.forEach(function (item, index) {
      var key = signature(item);
      if (seen.has(key)) throw new Error('第 ' + (index + 1) + ' 条与现有记录或本批内容完全重复');
      seen.add(key);
    });
  }
  function filtered(state) {
    return (state.spend || []).map(function (item) { return normalized(item, state); }).filter(function (item) {
      return (!filter.start || item.date >= filter.start) && (!filter.end || item.date <= filter.end) &&
        (!filter.channelId || item.channelId === filter.channelId) && (!filter.media || item.media === filter.media) &&
        (!filter.currency || item.currency === filter.currency) && (!filter.link || (filter.link === '__unassigned' ? !item.linkId : item.linkId === filter.link || item.linkName === filter.link));
    }).sort(function (a, b) { return b.date.localeCompare(a.date) || String(b.updatedAt || b.id).localeCompare(String(a.updatedAt || a.id)); });
  }
  function options(items, current) { return items.map(function (item) { var pair = Array.isArray(item) ? item : [item, item]; return '<option value="' + esc(pair[0]) + '"' + (String(pair[0]) === String(current) ? ' selected' : '') + '>' + esc(pair[1]) + '</option>'; }).join(''); }
  function select(name, items, current, extra) { return '<select class="cm-input" name="' + esc(name) + '" ' + (extra || '') + '>' + options(items, current) + '</select>'; }
  function input(name, value, extra) { return '<input class="cm-input" name="' + esc(name) + '" value="' + esc(value) + '" ' + (extra || '') + '>'; }
  function field(label, control, help, wide) { return '<label class="cm-field' + (wide ? ' wide' : '') + '"><span>' + esc(label) + '</span>' + control + (help ? '<small class="cm-field-help">' + esc(help) + '</small>' : '') + '</label>'; }
  function button(action, text, primary, id) { return '<button type="button" class="cm-btn' + (primary ? ' primary' : '') + '" data-spend-action="' + esc(action) + '"' + (id ? ' data-spend-id="' + esc(id) + '"' : '') + '>' + esc(text) + '</button>'; }
  function channelOptions(state) { return (state.channels || []).map(function (item) { return [item.id, item.code + ' · ' + item.name]; }); }
  function mediaOptions(state) { return Array.from(new Set((state.channels || []).reduce(function (out, channel) { return out.concat([channel.media], links(channel).map(function (item) { return item.media; })); }, []).concat((state.spend || []).map(function (item) { return item.media; })).filter(Boolean))).sort(); }
  function filterLinks(state, channelId) {
    var items = [];
    (state.channels || []).filter(function (channel) { return !channelId || channel.id === channelId; }).forEach(function (channel) {
      links(channel).forEach(function (link) { items.push([link.id, channel.code + ' · ' + link.name]); });
    });
    (state.spend || []).filter(function (record) { return (!channelId || record.channelId === channelId) && record.linkId && !items.some(function (item) { return item[0] === record.linkId; }); }).forEach(function (record) { items.push([record.linkId, (record.channelCode || record.channelId) + ' · ' + (record.linkName || record.linkId) + '（历史）']); });
    return [['', '全部链接'], ['__unassigned', '渠道未细分']].concat(items);
  }
  function rowsHtml(rows) {
    return rows.map(function (record) { return '<tr><td>' + esc(record.date) + '</td><td>' + esc(record.channelCode) + '<br><span class="cm-muted">' + esc(record.channelName) + '</span></td><td>' + esc(record.media || '—') + '<br><span class="cm-muted">' + esc(record.linkName || '渠道未细分') + '</span></td><td>' + esc(record.originalCurrency) + '</td><td class="cm-numeric">' + esc(money(record.originalAmount)) + '</td><td class="cm-numeric">' + esc(record.exchangeRate) + '</td><td>' + esc(record.currency) + '</td><td class="cm-numeric">' + esc(money(record.amount)) + '</td><td title="' + esc(record.note) + '">' + esc(record.note.length > 24 ? record.note.slice(0, 24) + '…' : record.note || '—') + '</td><td>' + esc(record.updatedAt ? record.updatedAt.replace('T', ' ').slice(0, 19) + ' UTC' : '历史记录') + '</td><td><div class="cm-actions">' + button('edit', '编辑', false, record.id) + button('delete', '删除', false, record.id) + '</div></td></tr>'; }).join('') || '<tr><td colspan="11" class="cm-muted">暂无符合条件的消耗记录，请调整筛选或新增消耗。</td></tr>';
  }
  function table(rows) { return '<div class="cm-table-wrap"><table class="cm-table"><thead><tr><th>消耗日期</th><th>渠道编码 / 名称</th><th>媒体 / 广告链接</th><th>原币</th><th class="cm-numeric">原币金额</th><th class="cm-numeric">汇率（报表币 / 原币）</th><th>报表币</th><th class="cm-numeric">报表币金额</th><th>备注</th><th>更新时间</th><th>操作</th></tr></thead><tbody>' + rowsHtml(rows) + '</tbody></table></div>'; }
  function context() { return { start: filter.start, end: filter.end, channelId: filter.channelId, channel: filter.channelId, media: filter.media, link: filter.link, currency: filter.currency, source: '', scene: '', packageId: '', version: '' }; }
  function render(incoming) {
    section = document.getElementById('cm-spend');
    if (!section || !api()) return;
    var state = api().getState();
    if (incoming && Object.keys(incoming).length) {
      ['start', 'end', 'media', 'link', 'currency'].forEach(function (key) { if (Object.prototype.hasOwnProperty.call(incoming, key)) filter[key] = String(incoming[key] || ''); });
      if (incoming.channelId != null || incoming.channel != null) {
        var value = incoming.channelId || incoming.channel || '', channel = (state.channels || []).find(function (item) { return item.id === value || item.code === value; });
        filter.channelId = channel ? channel.id : String(value);
      }
      filter.page = 1;
    }
    var currentLinks = filterLinks(state, filter.channelId);
    var historyMainLinks = { CH1001: 'homepageads', CH1002: 'feed-video-01', CH1003: 'search-brand-03', CH1004: 'pwa-home', CH1005: 'trial-video-02', CH1006: 'download-site-01' };
    if (filter.link) {
      var historicalIds = Object.keys(historyMainLinks).filter(function (id) { return (!filter.channelId || id === filter.channelId) && historyMainLinks[id] === filter.link; });
      if (historicalIds.length === 1) {
        var stableId = 'LK-' + historicalIds[0] + '-MAIN';
        filter.link = stableId;
        if (!currentLinks.some(function (item) { return item[0] === stableId; })) currentLinks.push([stableId, historyMainLinks[historicalIds[0]] + '（历史链接）']);
      }
    }
    if (filter.link && !currentLinks.some(function (item) { return item[0] === filter.link; })) {
      var matches = (state.channels || []).filter(function (channel) { return !filter.channelId || channel.id === filter.channelId; }).reduce(function (all, channel) { return all.concat(links(channel).filter(function (link) { return link.name === filter.link; })); }, []);
      if (matches.length === 1) filter.link = matches[0].id;
      else currentLinks.push([filter.link, filter.link + '（历史筛选）']);
    }
    var records = filtered(state), pages = Math.max(1, Math.ceil(records.length / PAGE_SIZE));
    filter.page = Math.min(Math.max(1, filter.page), pages);
    var start = (filter.page - 1) * PAGE_SIZE;
    section.innerHTML = '<h2>广告消耗数据</h2><p class="cm-note">初始演示范围为 2026-11-01 至 ' + AS_OF + '；汇率与媒体、链接、报表币种随记录保存。演示报表仅使用截至快照日的统计。</p><form class="cm-filter" data-spend-filter>' + field('开始日期', input('start', filter.start, 'type="date"')) + field('结束日期', input('end', filter.end, 'type="date"')) + field('渠道', select('channelId', [['', '全部渠道']].concat(channelOptions(state)), filter.channelId)) + field('报表币种', select('currency', [['', '全部币种']].concat(CURRENCIES), filter.currency)) + field('媒体', select('media', [['', '全部媒体']].concat(mediaOptions(state)), filter.media)) + field('广告链接', select('link', currentLinks, filter.link)) + '<div class="cm-filter-actions"><button type="submit" class="cm-btn primary">查询</button>' + button('reset', '重置') + '</div></form><div class="cm-toolbar"><div>' + button('add', '新增消耗', true) + button('import', 'CSV 导入') + button('template', '下载模板') + button('export', '导出筛选结果') + '</div><div>' + button('roi', '看回收分析') + button('daily', '看投放日报') + '</div></div>' + table(records.slice(start, start + PAGE_SIZE)) + '<div class="cm-pagination"><span class="cm-muted">共 ' + records.length + ' 条 · 每页 ' + PAGE_SIZE + ' 条</span>' + '<button type="button" class="cm-btn" data-spend-action="previous"' + (filter.page <= 1 ? ' disabled' : '') + '>上一页</button><span>第 ' + filter.page + ' / ' + pages + ' 页</span><button type="button" class="cm-btn" data-spend-action="next"' + (filter.page >= pages ? ' disabled' : '') + '>下一页</button></div>';
    if (api().navigateContext) api().navigateContext(Object.assign(context(), {entry: ''}));
    if (incoming && incoming.entry === 'add') openEditor();
  }
  function formValues(form) { var result = {}; new FormData(form).forEach(function (value, key) { result[key] = String(value).trim(); }); return result; }
  function refreshEditor(form, state, saved, resetLink) {
    var channel = channelById(state, form.elements.channelId.value), linkControl = form.elements.linkId;
    var linkId = resetLink ? '' : linkControl.value, choices = links(channel);
    if (saved && channel && saved.channelId === channel.id && saved.linkId && !choices.some(function (item) { return item.id === saved.linkId; })) choices.push({ id: saved.linkId, name: saved.linkName + '（历史）', media: saved.media });
    linkControl.innerHTML = options([['', '渠道未细分']].concat(choices.map(function (item) { return [item.id, item.name]; })), linkId);
    var selected = choices.find(function (item) { return item.id === linkControl.value; });
    var same = saved && channel && saved.channelId === channel.id && saved.linkId === linkControl.value;
    form.elements.channelCode.value = channel ? channel.code : '';
    form.elements.media.value = same ? saved.media : (selected ? selected.media : channel ? channel.media : '');
    form.elements.currency.value = same ? saved.currency : (channel ? channel.currency || 'INR' : '');
    var isSameCurrency = form.elements.originalCurrency.value === form.elements.currency.value;
    form.elements.exchangeRate.readOnly = isSameCurrency;
    if (isSameCurrency) form.elements.exchangeRate.value = '1';
    try { form.querySelector('[data-spend-converted]').textContent = money(convert(cents(form.elements.originalAmount.value), form.elements.exchangeRate.value) / 100) + ' ' + form.elements.currency.value; }
    catch (error) { form.querySelector('[data-spend-converted]').textContent = '请填写有效金额与汇率'; }
  }
  function openEditor(id) {
    var state = api().getState(), raw = (state.spend || []).find(function (item) { return item.id === id; });
    if (id && !raw) return api().toast('记录已不存在，请刷新后重试');
    if (!(state.channels || []).length) return api().toast('请先创建渠道');
    var saved = raw ? normalized(raw, state) : null;
    var defaultChannel = channelById(state, filter.channelId) || state.channels[0];
    var selectedLink = links(defaultChannel).some(function (item) { return item.id === filter.link; }) ? filter.link : '';
    var record = saved || { date: filter.end || AS_OF, channelId: defaultChannel.id, linkId: selectedLink, originalCurrency: '', originalAmount: '', exchangeRate: 1, note: '' };
    var channel = channelById(state, record.channelId);
    if (!record.originalCurrency) record.originalCurrency = channel ? channel.currency || 'INR' : 'INR';
    api().dialog({ title: saved ? '编辑消耗' : '新增消耗', width: 'normal', submitLabel: '保存',
      html: '<div class="cm-form-grid">' + field('消耗日期 *', input('date', record.date, 'type="date" required')) + field('渠道 *', select('channelId', channelOptions(state), record.channelId)) + field('渠道编码', input('channelCode', '', 'readonly')) + field('广告链接', select('linkId', [['', '渠道未细分']].concat(links(channel).map(function (item) { return [item.id, item.name]; })), record.linkId)) + field('媒体（自动带出）', input('media', '', 'readonly')) + field('报表币种（自动带出）', input('currency', '', 'readonly')) + field('原币 *', select('originalCurrency', CURRENCIES, record.originalCurrency)) + field('原币金额 *', input('originalAmount', record.originalAmount, 'inputmode="decimal" placeholder="0.00"')) + field('汇率 *', input('exchangeRate', record.exchangeRate, 'inputmode="decimal"'), '1 原币 = 此数值的报表币；相同币种固定为 1。') + field('折算报表币金额', '<output data-spend-converted></output>') + field('备注', '<textarea class="cm-input" name="note" maxlength="500" rows="3">' + esc(record.note) + '</textarea>', '最多 500 字。', true) + '</div>',
      onOpen: function (form) {
        if (saved && saved.linkId && !links(channel).some(function (item) { return item.id === saved.linkId; })) form.elements.linkId.innerHTML += options([[saved.linkId, saved.linkName + '（历史）']], saved.linkId);
        refreshEditor(form, state, saved, false);
        form.addEventListener('change', function (event) { refreshEditor(form, state, saved, event.target.name === 'channelId'); });
        form.addEventListener('input', function (event) { if (event.target.name === 'originalAmount' || event.target.name === 'exchangeRate') refreshEditor(form, state, saved, false); });
      },
      onSubmit: function (form, close) {
        var latest = api().getState();
        if (saved && !(latest.spend || []).some(function (item) { return item.id === saved.id; })) throw new Error('记录已被删除，请关闭弹窗并刷新');
        var nextRecord = makeRecord(formValues(form), latest, saved);
        assertUnique([nextRecord], latest, saved && saved.id);
        var next = clone(latest);
        next.spend = saved ? (next.spend || []).map(function (item) { return item.id === saved.id ? nextRecord : item; }) : [nextRecord].concat(next.spend || []);
        api().saveState(next); close(); render(); api().toast('消耗记录已保存');
      }
    });
  }
  function removeRecord(id) {
    var state = api().getState(), raw = (state.spend || []).find(function (item) { return item.id === id; });
    if (!raw) return api().toast('记录已不存在');
    var record = normalized(raw, state);
    api().dialog({ title: '删除消耗记录', submitLabel: '确认删除', html: '<p>确定删除 ' + esc(record.date) + ' · ' + esc(record.channelCode) + ' · ' + esc(record.originalCurrency) + ' ' + esc(money(record.originalAmount)) + ' 的消耗记录？</p><p class="cm-note">仅删除此消耗记录，渠道与广告链接保留；关联报表在下次查看时更新。</p>', onSubmit: function (form, close) { var next = api().getState(); next.spend = (next.spend || []).filter(function (item) { return item.id !== id; }); api().saveState(next); close(); render(); api().toast('消耗记录已删除'); } });
  }
  function parseCSV(text) {
    var source = String(text).replace(/^\uFEFF/, ''), rows = [], row = [], cell = '', quoted = false, closed = false;
    if (source.length > 2 * 1024 * 1024) throw new Error('CSV 内容不能超过 2 MB');
    for (var i = 0; i <= source.length; i += 1) {
      var ch = source[i];
      if (quoted) {
        if (ch === '"' && source[i + 1] === '"') { cell += '"'; i += 1; }
        else if (ch === '"') { quoted = false; closed = true; }
        else if (ch == null) throw new Error('CSV 引号未闭合');
        else cell += ch;
      } else if (ch === '"') {
        if (cell || closed) throw new Error('CSV 引号位置不正确');
        quoted = true;
      } else if (ch === ',' || ch === '\r' || ch === '\n' || ch == null) {
        row.push(cell); cell = ''; closed = false;
        if (ch !== ',') { if (row.some(function (value) { return value.trim() !== ''; })) rows.push(row); row = []; if (ch === '\r' && source[i + 1] === '\n') i += 1; }
      } else {
        if (closed) { if (!/\s/.test(ch)) throw new Error('CSV 引号后包含多余字符'); }
        else cell += ch;
      }
      if (rows.length > 1001) throw new Error('每次最多导入 1000 条记录');
    }
    return rows;
  }
  function validateCSV(text, state) {
    var rows = parseCSV(text);
    if (rows.length < 2) throw new Error('CSV 至少包含表头及一条记录');
    var header = rows.shift().map(function (item) { return item.trim(); });
    if (new Set(header).size !== header.length) throw new Error('CSV 表头不能重复');
    var modern = header.indexOf('originalAmount') >= 0;
    var required = modern ? ['date', 'channelId', 'originalCurrency', 'originalAmount', 'exchangeRate'] : ['date', 'channelId', 'media', 'currency', 'amount'];
    var allowed = ['date', 'channelId', 'linkId', 'originalCurrency', 'originalAmount', 'exchangeRate', 'note', 'media', 'currency', 'amount'];
    required.forEach(function (key) { if (header.indexOf(key) < 0) throw new Error('CSV 缺少字段：' + key); });
    header.forEach(function (key) { if (allowed.indexOf(key) < 0) throw new Error('CSV 不支持字段：' + key); });
    var errors = [], records = [];
    rows.forEach(function (row, index) {
      try {
        if (row.length !== header.length) throw new Error('列数与表头不一致');
        var values = {}; header.forEach(function (key, col) { values[key] = row[col].trim(); });
        if (!modern) {
          var channel = channelById(state, values.channelId);
          if (!channel || values.currency !== (channel.currency || 'INR')) throw new Error('旧格式 currency 必须与渠道报表币种一致；跨币种请使用新模板');
          values.originalCurrency = values.currency; values.originalAmount = values.amount; values.exchangeRate = '1';
        } else if (values.currency && values.currency !== ((channelById(state, values.channelId) || {}).currency || 'INR')) throw new Error('currency 与渠道报表币种不一致');
        records.push(makeRecord(values, state));
      } catch (error) { errors.push('第 ' + (index + 2) + ' 行：' + error.message); }
    });
    if (errors.length) throw new Error(errors.slice(0, 12).join('\n') + (errors.length > 12 ? '\n另有 ' + (errors.length - 12) + ' 行错误' : ''));
    assertUnique(records, state);
    return records;
  }
  function importCSV() {
    var preview = null, previewText = '', reading = false;
    api().dialog({ title: 'CSV 导入广告消耗', width: 'wide', submitLabel: '确认导入',
      html: '<p class="cm-note">UTF-8 CSV，每次最多 1000 条、2 MB。先校验全部内容，再一次性追加；完全重复记录拒绝导入。报表币种由渠道带出；原币为 USDT / INR / USD。linkId 为空表示渠道未细分。日期不受演示快照限制。</p><div class="cm-form-grid">' + field('选择 CSV 文件', '<input type="file" accept=".csv,text/csv" data-spend-file>', '', true) + field('CSV 内容 *', '<textarea class="cm-input" name="csv" rows="8" spellcheck="false" placeholder="date,channelId,linkId,originalCurrency,originalAmount,exchangeRate,note"></textarea>', '', true) + '</div><div class="cm-actions">' + button('preview', '校验预览', true) + button('template', '下载模板') + '</div><p class="cm-error" data-spend-import-error role="alert"></p><div data-spend-preview></div>',
      onOpen: function (form) {
        function invalidate() { preview = null; form.querySelector('[data-spend-preview]').innerHTML = '<p class="cm-muted">内容已变更，请重新校验预览。</p>'; }
        form.elements.csv.addEventListener('input', invalidate);
        form.querySelector('[data-spend-file]').addEventListener('change', function (event) {
          invalidate(); var file = event.target.files[0], error = form.querySelector('[data-spend-import-error]');
          if (!file) return;
          if (file.size > 2 * 1024 * 1024) { error.textContent = 'CSV 文件不能超过 2 MB'; return; }
          var reader = new FileReader(); reading = true;
          reader.onload = function () { reading = false; form.elements.csv.value = String(reader.result || ''); error.textContent = ''; invalidate(); };
          reader.onerror = function () { reading = false; error.textContent = '文件读取失败，请重选或粘贴 CSV 内容'; };
          reader.readAsText(file, 'UTF-8');
        });
        form.addEventListener('click', function (event) {
          var target = event.target.closest('[data-spend-action]'); if (!target) return;
          var action = target.getAttribute('data-spend-action');
          if (action === 'template') { downloadTemplate(); return; }
          if (action !== 'preview') return;
          var error = form.querySelector('[data-spend-import-error]');
          try {
            if (reading) throw new Error('文件仍在读取，请稍后校验');
            previewText = form.elements.csv.value; preview = validateCSV(previewText, api().getState());
            error.textContent = '';
            form.querySelector('[data-spend-preview]').innerHTML = '<p class="cm-note">校验通过，共 ' + preview.length + ' 条，以下展示前 20 条；确认后全部追加。</p>' + previewTable(preview.slice(0, 20));
          } catch (problem) { preview = null; error.textContent = problem.message; form.querySelector('[data-spend-preview]').innerHTML = ''; }
        });
      },
      onSubmit: function (form, close) {
        if (reading || !preview || previewText !== form.elements.csv.value) throw new Error('请先对当前 CSV 内容校验预览');
        var latest = api().getState(), records = validateCSV(previewText, latest);
        // Revalidate against current bindings; a changed channel requires review of the new preview.
        if (JSON.stringify(records.map(signature)) !== JSON.stringify(preview.map(signature))) { preview = null; throw new Error('渠道配置已变化，请重新校验预览'); }
        var next = clone(latest); next.spend = records.concat(next.spend || []);
        api().saveState(next); close(); render(); api().toast('已一次性导入 ' + records.length + ' 条消耗记录');
      }
    });
  }
  function previewTable(records) { return '<div class="cm-table-wrap"><table class="cm-table"><thead><tr><th>日期</th><th>渠道</th><th>媒体 / 链接</th><th>原币</th><th>原币金额</th><th>汇率</th><th>报表币</th><th>报表币金额</th><th>备注</th></tr></thead><tbody>' + records.map(function (item) { return '<tr>' + [item.date, item.channelCode, item.media + ' / ' + (item.linkName || '渠道未细分'), item.originalCurrency, money(item.originalAmount), item.exchangeRate, item.currency, money(item.amount), item.note].map(function (value) { return '<td>' + esc(value) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>'; }
  function downloadTemplate() {
    var state = api().getState(), channel = channelById(state, filter.channelId) || (state.channels || [])[0];
    api().download('spend-import-template.csv', [['date', 'channelId', 'linkId', 'originalCurrency', 'originalAmount', 'exchangeRate', 'note'], [AS_OF, channel ? channel.id : '', '', channel ? channel.currency || 'INR' : 'INR', '100.00', '1', '示例，请替换后导入']]);
  }
  function exportRows() {
    var records = filtered(api().getState());
    var rows = [['date', 'channelId', 'channelCode', 'channelName', 'media', 'linkId', 'linkName', 'originalCurrency', 'originalAmount', 'exchangeRate', 'currency', 'amount', 'note', 'updatedAt']];
    records.forEach(function (item) { rows.push([item.date, item.channelId, item.channelCode, item.channelName, item.media, item.linkId, item.linkName, item.originalCurrency, item.originalAmount.toFixed(2), item.exchangeRate, item.currency, Number(item.amount).toFixed(2), item.note, item.updatedAt || '']); });
    api().download('spend-' + (filter.start || 'all') + '-' + (filter.end || 'all') + '.csv', rows);
  }
  function action(name, id) {
    if (name === 'add' || name === 'edit') openEditor(name === 'edit' ? id : null);
    else if (name === 'delete') removeRecord(id);
    else if (name === 'import') importCSV();
    else if (name === 'template') downloadTemplate();
    else if (name === 'export') exportRows();
    else if (name === 'reset') { filter = defaults(); render(); }
    else if (name === 'previous' || name === 'next') { filter.page += name === 'next' ? 1 : -1; render(); }
    else if (name === 'roi' || name === 'daily') api().go(name, context());
  }
  function init() {
    var root = document.getElementById('cm-spend');
    if (!root || root.getAttribute('data-spend-bound') === 'true') return;
    root.setAttribute('data-spend-bound', 'true');
    root.addEventListener('click', function (event) { var target = event.target.closest('[data-spend-action]'); if (target && !target.disabled) action(target.getAttribute('data-spend-action'), target.getAttribute('data-spend-id')); });
    root.addEventListener('change', function (event) {
      if (event.target.name !== 'channelId' || !event.target.closest('[data-spend-filter]')) return;
      var form = event.target.form; form.elements.link.innerHTML = options(filterLinks(api().getState(), event.target.value), '');
    });
    root.addEventListener('submit', function (event) {
      if (!event.target.matches('[data-spend-filter]')) return;
      event.preventDefault(); var values = formValues(event.target);
      if ((values.start && !validDate(values.start)) || (values.end && !validDate(values.end)) || (values.start && values.end && values.start > values.end)) return api().toast('请填写有效日期范围，开始日期不能晚于结束日期');
      filter = Object.assign(defaults(), values); render();
    });
  }
  window.CMSpend = { init: init, render: render };
})();
