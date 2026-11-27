(function () {
  "use strict";

  const STORAGE_KEY = "business.robot-customer-service.v1";
  const PAGE_SIZE = 6;
  const QA_STATUS = {
    published: ["已发布", "success"], draft: ["草稿", "muted"], disabled: ["已停用", "warning"]
  };
  const QUESTION_STATUS = {
    pending: ["待处理", "warning"], added: ["已入库", "success"], ignored: ["已忽略", "muted"]
  };
  const CATEGORIES = { account: "账号", deposit: "充值", withdraw: "提现", activity: "活动", other: "其他" };
  const SAMPLE_KEYWORDS = [
    [["充值", "存款", "充钱", "刚充", "充了", "充的钱"], ["到账", "还没到", "迟迟没到", "多久能到", "多久才到", "多久才能到", "什么时候到", "没收到", "余额没变", "没进余额"]],
    [["提现", "出款", "提款"], ["审核", "到账", "要多久", "多久能到", "多久才能到", "什么时候到", "还没到", "处理中"]],
    [["密码", "口令"], ["忘了", "忘记", "重置", "找回"]],
    [["活动", "奖励", "福利"], ["查看", "哪里看", "去哪看", "在哪看", "领取记录"]],
    [["充值", "存款", "充钱"], ["关闭", "过期", "失效"]],
    [["余额", "账变"], ["明细", "记录", "变化", "流水"]],
    [["提现", "出款", "提款"], ["失败", "退回", "退款", "退钱"]],
    [["人工客服", "人工坐席"], ["怎么联系", "如何联系", "入口", "在哪里", "在哪"]]
  ];
  const DEFAULT_SETTINGS = {
    enabled: true,
    welcome: "您好，我是智能客服。您可以问我充值、提现、账号或活动相关问题，也可以随时转人工。",
    fallback: "抱歉，我暂时没找到匹配的答案。您可以换个说法，或选择转人工。",
    threshold: 2,
    handoff: "已为您转接人工客服，请稍候。"
  };

  function seedState() {
    const knowledge = [
      ["充值后多久到账？", "deposit", ["充值没到账", "存款多久到账", "充值多久能到"], "充值到账时间以订单页显示为准。请先在「我的 → 充值记录」查看状态；若显示成功但余额未更新，可带上订单号转人工核查。", "published", "10:30"],
      ["提现审核需要多久？", "withdraw", ["提现要多久", "提现多久到账", "出款还在审核"], "提现审核时间以提现记录页面的提示为准。您可以在「我的 → 提现记录」查看当前进度；超过页面提示的时间可转人工查询。", "published", "10:16"],
      ["忘记登录密码怎么办？", "account", ["密码忘了", "无法登录怎么重置密码", "忘记账号密码"], "请在登录页点击「忘记密码」，按提示验证账号并设置新密码。如无法完成验证，请转人工。请勿发送密码或验证码。", "published", "09:45"],
      ["活动奖励在哪里查看？", "activity", ["奖励去哪看", "在哪看活动奖励", "活动奖励记录"], "请在「我的 → 优惠活动 → 领取记录」查看。有些活动需要先点击领取，具体以活动页说明为准。", "published", "09:25"],
      ["充值时提示订单已关闭怎么办？", "deposit", ["充值订单关闭", "充值单过期"], "请返回充值页重新生成一笔订单。若原订单已扣款，请保留交易凭证并转人工核查，避免重复支付。", "draft", "09:14"],
      ["如何查看账户余额明细？", "account", ["看余额变化", "余额明细在哪"], "请打开「我的 → 账变记录」查看。您可以用日期及收支类型筛选明细。", "disabled", "08:56"],
      ["提现失败后资金会退回吗？", "withdraw", ["提现失败钱去哪了", "出款失败会退回吗"], "请在提现记录中查看失败原因和退款状态。若已超过页面提示时间或余额异常，请提供提现订单号转人工查询。", "published", "08:40"],
      ["如何联系人工客服？", "other", ["人工客服入口在哪", "怎么联系人工坐席"], "请在客服窗口点击「转人工」，接通后向客服说明您遇到的问题。", "published", "08:18"]
    ].map(([question, category, aliases, answer, status, time], index) => ({
      id: `qa-${index + 1}`, question, category, aliases, answer, status, updated: `2026-11-26 ${time}`, sourceId: null,
      keywords: { topics: SAMPLE_KEYWORDS[index][0], intents: SAMPLE_KEYWORDS[index][1] }
    }));
    const unanswered = [
      { id: "miss-1", question: "异地登录提示怎么处理？", count: 5, updated: "2026-11-26 10:36", status: "pending" },
      { id: "miss-2", question: "充值账户名填错了怎么办？", count: 3, updated: "2026-11-26 09:51", status: "pending" },
      { id: "miss-3", question: "在吗？", count: 2, updated: "2026-11-25 17:48", status: "ignored" }
    ];
    return { knowledge, unanswered, settings: { ...DEFAULT_SETTINGS } };
  }

  function normalized(value) {
    return value.normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
  }

  function phraseList(item) {
    return [item.question, ...(item.aliases || [])];
  }

  function parseKeywords(text) {
    const unique = new Map();
    text.split(/[、,，;；\r\n]+/).forEach((entry) => {
      const term = entry.trim();
      const key = normalized(term);
      if (key && !unique.has(key)) unique.set(key, term);
    });
    return [...unique.values()];
  }

  function separateMatches(query, topic, intent) {
    for (let at = query.indexOf(topic); at >= 0; at = query.indexOf(topic, at + topic.length)) {
      if (query.slice(0, at).includes(intent) || query.slice(at + topic.length).includes(intent)) return true;
    }
    return false;
  }

  function matchKnowledge(knowledge, message, context = []) {
    const query = normalized(message);
    if (!query) return { kind: "miss" };

    const published = knowledge.filter((item) => item.status === "published");
    const topicMatches = (item) => (item.keywords?.topics || []).filter((term) => query.includes(normalized(term)));
    const detected = published.map((item) => ({ item, topics: topicMatches(item) })).filter(({ topics }) => topics.length);
    const inherited = !detected.length && context.length > 0;
    const candidates = inherited ? published.map((item) => ({
      item, topics: (item.keywords?.topics || []).filter((term) => context.includes(normalized(term)))
    })).filter(({ topics }) => topics.length) : detected;

    const matches = candidates.flatMap(({ item, topics }) => {
      const intents = item.keywords.intents.filter((intent) => {
        const key = normalized(intent);
        if (inherited) return query.includes(key);
        // A single occurrence cannot count as both the topic and the intent.
        return topics.some((term) => separateMatches(query, normalized(term), key));
      });
      return intents.length ? [{ item, topics, intents }] : [];
    });
    if (matches.length === 1) return { kind: "answer", ...matches[0], inherited };
    if (matches.length > 1) return { kind: "clarify", choices: matches.map(({ item }) => item), context: [], ambiguous: true };

    const topics = [...new Set(detected.flatMap((entry) => entry.topics.map(normalized)))];
    const topicOnly = query.replace(/^(?:你好|您好)?(?:请问|我想问(?:一下)?|我想咨询(?:一下)?|咨询(?:一下)?|关于|我要|我想)?/, "")
      .replace(/(?:方面)?(?:的问题|问题|相关问题)$/, "");
    if (topics.includes(topicOnly)) {
      return { kind: "clarify", choices: detected.map(({ item }) => item), context: topics, ambiguous: false };
    }

    // Examples are a secondary route; old custom entries also keep their previous matching behavior.
    const examples = published.flatMap((item) => {
      const scored = phraseList(item).map((phrase) => {
        const key = normalized(phrase);
        return { item, phrase, score: key && query === key ? 1000 + key.length : !item.keywords && key.length >= 4 && query.includes(key) ? key.length : 0 };
      }).sort((a, b) => b.score - a.score);
      return scored[0].score ? [scored[0]] : [];
    });
    examples.sort((a, b) => b.score - a.score);
    if (examples[0] && examples[0].score !== examples[1]?.score) return { kind: "answer", ...examples[0] };
    if (examples[0]) return { kind: "clarify", choices: examples.filter(({ score }) => score === examples[0].score).map(({ item }) => item), context: [], ambiguous: true };
    return { kind: "miss" };
  }

  function isHandoff(message) {
    return /^(?:human|agent|(?:请|麻烦)?(?:帮我|给我|我要|我想要|我需要|我想|能不能|可以)?(?:找|转接?|联系)?人工(?:客服|坐席)?(?:一下|可以吗|好吗|吧|谢谢)?)$/.test(normalized(message));
  }

  function clockText() {
    const parts = Object.fromEntries(new Intl.DateTimeFormat("zh-CN", {
      timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hourCycle: "h23"
    }).formatToParts(new Date()).map(({ type, value }) => [type, value]));
    return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}`;
  }

  function newId(prefix) {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function loadState() {
    try {
      const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
      if (stored && Array.isArray(stored.knowledge) && Array.isArray(stored.unanswered) && stored.settings) {
        const samples = new Map(seedState().knowledge.map((item) => [item.id, item]));
        const knowledge = stored.knowledge.map((item) => {
          const sample = samples.get(item.id);
          return !item.keywords && sample?.question === item.question && sample.category === item.category
            ? { ...item, keywords: sample.keywords } : item;
        });
        return { ...stored, knowledge, settings: { ...DEFAULT_SETTINGS, ...stored.settings } };
      }
    } catch (error) {
      // Opening directly from disk can restrict storage; the examples remain available.
    }
    return seedState();
  }

  function el(tag, className, value) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (value !== undefined) node.textContent = String(value);
    return node;
  }

  function boot() {
    const root = document.querySelector(".rc-page");
    if (!root) return;
    const find = (selector) => root.querySelector(selector);
    const all = (selector) => Array.from(root.querySelectorAll(selector));
    const filter = find("#rc-filter");
    const qaBody = find("#rc-knowledge-body");
    const missBody = find("#rc-unanswered-body");
    const missFilter = find("#rc-unanswered-filter");
    const editor = find("#rc-editor");
    const settings = find("#rc-settings");
    const settingsActions = find("#rc-settings-actions");
    const settingsEdit = find('[data-rc-action="edit-settings"]');
    const chat = find("#rc-chat");
    const messages = find("#rc-messages");
    const toast = find("#rc-toast");
    if (![filter, qaBody, missBody, missFilter, editor, settings, settingsActions, settingsEdit, chat, messages, toast].every(Boolean)) return;

    const tabs = all('[data-cl-tab-group="robot-service"][data-cl-tab]');
    const defaults = { keyword: "", category: "", status: "" };
    let state = loadState();
    let filters = { ...defaults };
    let page = 1;
    let activeDialog = null;
    let returnFocus = null;
    let editorContext = null;
    let confirmAction = null;
    let toastTimer;
    let missStreak = 0;
    let handedOff = false;
    let chatContext = [];
    let choices = [];

    function notify(text) {
      toast.hidden = false;
      toast.textContent = text;
      window.clearTimeout(toastTimer);
      toastTimer = window.setTimeout(() => { toast.hidden = true; }, 3500);
    }

    function commit(mutator) {
      const next = JSON.parse(JSON.stringify(state));
      mutator(next);
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (error) {
        notify("浏览器无法保存，请检查本地存储权限后重试。");
        return false;
      }
      state = next;
      return true;
    }

    function action(text, key, id) {
      const button = el("button", "cl-link", text);
      button.type = "button";
      button.dataset.rcAction = key;
      button.dataset.id = id;
      return button;
    }

    function emptyRow(body, columns, text) {
      const row = el("tr");
      const cell = el("td", "rc-empty", text);
      cell.colSpan = columns;
      row.append(cell);
      body.append(row);
    }

    function badge(stateMap, key) {
      const [text, style] = stateMap[key];
      return el("span", `cl-status cl-status-${style}`, text);
    }

    function renderKnowledge() {
      const key = filters.keyword.trim().toLowerCase();
      const rows = state.knowledge.filter((item) => (
        (!key || [...phraseList(item), ...(item.keywords?.topics || []), ...(item.keywords?.intents || [])]
          .some((phrase) => phrase.toLowerCase().includes(key))) &&
        (!filters.category || filters.category === item.category) &&
        (!filters.status || filters.status === item.status)
      ));
      const maxPage = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
      page = Math.min(page, maxPage);
      qaBody.replaceChildren();
      rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).forEach((item) => {
        const row = el("tr");
        const entry = el("td");
        const detail = el("span", "rc-q-detail", item.answer.replace(/\s+/g, " "));
        detail.title = item.answer;
        entry.append(el("strong", "rc-q-title", item.question), detail);
        const keywords = el("td");
        if (item.keywords) {
          for (const [label, terms] of [["主题", item.keywords.topics], ["意图", item.keywords.intents]]) {
            const shown = terms.slice(0, 2).join(" / ") + (terms.length > 2 ? ` 等 ${terms.length} 个` : "");
            const line = el("span", "rc-keyword-line", `${label}：${shown}`);
            line.title = `${label}：${terms.join("、")}`;
            keywords.append(line);
          }
        } else {
          keywords.append(el("span", "rc-keyword-line", "待补关键词"));
        }
        const stateCell = el("td");
        stateCell.append(badge(QA_STATUS, item.status));
        const toolsCell = el("td");
        const tools = el("span", "cl-row-actions");
        tools.append(action("编辑", "edit-qa", item.id), item.status === "published"
          ? action("停用", "disable-qa", item.id)
          : action("发布", "publish-qa", item.id));
        toolsCell.append(tools);
        row.append(entry, el("td", "", CATEGORIES[item.category]), keywords, stateCell, el("td", "rc-numeric", item.updated), toolsCell);
        qaBody.append(row);
      });
      if (!rows.length) emptyRow(qaBody, 6, "没有符合条件的问答，请调整筛选或新增问答。");
      find("#rc-knowledge-count").textContent = `共 ${rows.length} 条`;
      find("#rc-page-number").textContent = `${page} / ${maxPage}`;
      find("#rc-page-prev").disabled = page <= 1;
      find("#rc-page-next").disabled = page >= maxPage;
    }

    function renderUnanswered() {
      missBody.replaceChildren();
      const rows = state.unanswered.filter((item) => !missFilter.value || item.status === missFilter.value);
      rows.forEach((item) => {
        const row = el("tr");
        const stateCell = el("td");
        stateCell.append(badge(QUESTION_STATUS, item.status));
        const toolsCell = el("td");
        const tools = el("span", "cl-row-actions");
        const linked = state.knowledge.some((qa) => qa.sourceId === item.id);
        if (item.status === "pending") {
          tools.append(action(linked ? "继续补录" : "补充问答", "fill-qa", item.id), action("忽略", "ignore-question", item.id));
        } else if (item.status === "ignored") {
          tools.append(action("恢复待处理", "restore-question", item.id));
        } else if (linked) {
          tools.append(action("查看问答", "fill-qa", item.id));
        } else {
          tools.append(el("span", "rc-q-detail", "已处理"));
        }
        toolsCell.append(tools);
        row.append(el("td", "", item.question), el("td", "rc-numeric", item.count), el("td", "rc-numeric", item.updated), stateCell, toolsCell);
        missBody.append(row);
      });
      if (!rows.length) emptyRow(missBody, 5, "暂无符合条件的待补问题。");
    }

    function renderSettings(editing) {
      Object.entries(state.settings).forEach(([key, value]) => {
        const field = settings.elements.namedItem(key);
        if (!field) return;
        if (field.type === "checkbox") field.checked = Boolean(value);
        else field.value = String(value);
        field.disabled = !editing;
      });
      settingsActions.hidden = !editing;
      settingsEdit.hidden = editing;
      settings.classList.toggle("is-editing", editing);
    }

    function openDialog(name, opener, initialFocus) {
      const dialog = find(`[data-rc-dialog="${name}"]`);
      if (!dialog) return;
      returnFocus = opener || document.activeElement;
      dialog.hidden = false;
      document.body.classList.add("cl-modal-open");
      activeDialog = dialog;
      (dialog.querySelector(initialFocus) || dialog.querySelector("button")).focus();
    }

    function closeDialog() {
      if (!activeDialog) return;
      const fallback = activeDialog.dataset.rcDialog === "preview"
        ? '[data-rc-action="preview"]'
        : '[data-cl-tab].is-active';
      activeDialog.hidden = true;
      activeDialog = null;
      confirmAction = null;
      editorContext = null;
      document.body.classList.remove("cl-modal-open");
      const rowId = returnFocus?.dataset?.id;
      const refreshedRow = rowId && all(".cl-table [data-id]").find((button) => button.dataset.id === rowId && !button.closest("[hidden]"));
      const target = returnFocus?.isConnected ? returnFocus : refreshedRow || find(fallback);
      if (target) target.focus();
      returnFocus = null;
    }

    function openEditor(item, source, opener) {
      editorContext = { qaId: item?.id || null, sourceId: source?.id || item?.sourceId || null };
      editor.elements.question.value = item?.question || source?.question || "";
      editor.elements.category.value = item?.category || "";
      editor.elements.topics.value = item?.keywords?.topics.join("、") || "";
      editor.elements.intents.value = item?.keywords?.intents.join("、") || "";
      editor.elements.aliases.value = item?.aliases.join("\n") || "";
      editor.elements.answer.value = item?.answer || "";
      find("#rc-editor-title").textContent = item ? "编辑问答" : source ? "补充问答" : "新增问答";
      find("#rc-editor-error").hidden = true;
      const draftButton = find("#rc-save-draft");
      draftButton.hidden = item?.status === "published";
      draftButton.textContent = item?.status === "disabled" ? "保存为停用" : "保存草稿";
      find("#rc-save-publish").textContent = "保存并发布";
      openDialog("editor", opener, "[name=question]");
    }

    function confirmChange(title, text, label, effect, opener) {
      find("#rc-confirm-title").textContent = title;
      find("#rc-confirm-copy").textContent = text;
      find("#rc-confirm-button").textContent = label;
      confirmAction = effect;
      openDialog("confirm", opener, '[data-rc-action="close-dialog"]');
    }

    function markAdded(next, sourceId) {
      const source = next.unanswered.find((item) => item.id === sourceId);
      if (source) source.status = "added";
    }

    function setKnowledgeStatus(item, nextStatus, opener) {
      const publish = nextStatus === "published";
      const label = publish ? "发布" : "停用";
      confirmChange(`${label}问答`, `确定${label}「${item.question}」？${publish ? "发布后机器人可用此问答回复。" : "停用后机器人将不再使用此问答。"}`, label, () => {
        if (!commit((next) => {
          const target = next.knowledge.find(({ id }) => id === item.id);
          target.status = nextStatus;
          target.updated = clockText();
          if (publish) markAdded(next, target.sourceId);
        })) return;
        renderKnowledge();
        renderUnanswered();
        closeDialog();
        notify(`问答已${label}`);
      }, opener);
    }

    function changeQuestionStatus(record, status) {
      if (commit((next) => { next.unanswered.find(({ id }) => id === record.id).status = status; })) {
        renderUnanswered();
        find("#rc-unanswered-filter").focus();
        notify(status === "ignored" ? "已忽略该问题" : "已恢复为待处理");
      }
    }

    function noteUnanswered(question) {
      const key = normalized(question);
      commit((next) => {
        const index = key ? next.unanswered.findIndex((record) => normalized(record.question) === key) : -1;
        const prior = index >= 0 ? next.unanswered.splice(index, 1)[0] : null;
        next.unanswered.unshift({
          id: prior?.id || newId("miss"), question: prior?.question || question, count: (prior?.count || 0) + 1,
          updated: clockText(), status: prior?.status === "ignored" ? "ignored" : "pending"
        });
      });
      renderUnanswered();
    }

    function bubble(who, message, source) {
      const user = who === "user";
      const item = el("div", `rc-message is-${who}`);
      item.append(el("span", "rc-message-name", user ? "访客" : "机器人"), el("div", "rc-bubble", message));
      if (source) item.append(el("span", "rc-message-source", source));
      messages.append(item);
      messages.scrollTop = messages.scrollHeight;
      return item;
    }

    function clearChoices() {
      choices = [];
      messages.querySelectorAll('[data-rc-action="choose-qa"]').forEach((button) => { button.disabled = true; });
    }

    function clarify(result) {
      clearChoices();
      chatContext = result.context;
      choices = result.choices.slice(0, 4);
      const item = bubble("bot", result.ambiguous
        ? "我找到了几个可能相关的问题。您想先问哪一个？"
        : "请问具体遇到了什么问题？您也可以选择下面的问题。");
      const options = el("div", "rc-chat-choices");
      choices.forEach(({ id, question }) => {
        const button = action(question, "choose-qa", id);
        button.className = "cl-btn";
        options.append(button);
      });
      item.append(options);
      messages.scrollTop = messages.scrollHeight;
    }

    function setChatActive(active) {
      chat.elements.message.disabled = !active;
      find("#rc-chat-send").disabled = !active;
      all('[data-rc-example], [data-rc-action="handoff"]').forEach((item) => { item.disabled = !active; });
    }

    function transfer(reason) {
      if (handedOff) return;
      clearChoices();
      chatContext = [];
      handedOff = true;
      bubble("bot", state.settings.handoff);
      messages.append(el("p", "rc-chat-note", `${reason} · 已模拟转人工`));
      messages.scrollTop = messages.scrollHeight;
      setChatActive(false);
      activeDialog?.querySelector('[data-rc-action="reset-chat"]')?.focus();
    }

    function resetChat() {
      missStreak = 0;
      handedOff = false;
      chatContext = [];
      choices = [];
      messages.replaceChildren();
      chat.reset();
      setChatActive(true);
      bubble("bot", state.settings.enabled ? state.settings.welcome : "机器人接待已停用，发送消息将模拟转人工。");
    }

    function ask(message) {
      const question = message.trim();
      if (!question || handedOff) return;
      clearChoices();
      bubble("user", question);
      if (isHandoff(question)) {
        transfer("访客请求人工客服");
        return;
      }
      if (!state.settings.enabled) {
        transfer("机器人接待已停用");
        return;
      }
      const result = matchKnowledge(state.knowledge, question, chatContext);
      chatContext = [];
      if (result.kind === "answer") {
        missStreak = 0;
        const source = result.topics
          ? `来源：${result.item.question} · ${result.inherited ? "上文主题" : "主题"}：${result.topics.join(" / ")} · 意图：${result.intents.join(" / ")}`
          : `来源：${result.item.question} · 整句：${result.phrase}`;
        bubble("bot", result.item.answer, source);
      } else if (result.kind === "clarify") {
        clarify(result);
      } else {
        missStreak += 1;
        noteUnanswered(question);
        if (missStreak >= state.settings.threshold) transfer(`连续 ${missStreak} 次未匹配`);
        else bubble("bot", state.settings.fallback);
      }
    }

    const editorError = (text, field) => {
      const error = find("#rc-editor-error");
      error.hidden = false;
      error.textContent = text;
      field?.focus();
    };

    filter.addEventListener("submit", (event) => {
      event.preventDefault();
      filters = Object.fromEntries(new FormData(filter));
      page = 1;
      renderKnowledge();
    });
    filter.addEventListener("reset", () => {
      filters = { ...defaults };
      page = 1;
      renderKnowledge();
    });
    find("#rc-page-prev").addEventListener("click", () => { page -= 1; renderKnowledge(); });
    find("#rc-page-next").addEventListener("click", () => { page += 1; renderKnowledge(); });
    missFilter.addEventListener("change", renderUnanswered);

    editor.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!editorContext) return;
      const fields = editor.elements;
      const question = fields.question.value.trim();
      const questionKey = normalized(question);
      const answer = fields.answer.value.trim();
      if (!questionKey) return editorError("标准问题至少需要包含一个文字或数字。", fields.question);
      if (!answer) return editorError("请填写标准答案。", fields.answer);
      if (!Object.hasOwn(CATEGORIES, fields.category.value)) return editorError("请选择问题分类。", fields.category);
      const topics = parseKeywords(fields.topics.value);
      const intents = parseKeywords(fields.intents.value);
      if (!topics.length) return editorError("请填写至少一个主题关键词。", fields.topics);
      if (!intents.length) return editorError("请填写至少一个意图关键词。", fields.intents);
      const topicKeys = new Set(topics.map(normalized));
      if (intents.some((term) => topicKeys.has(normalized(term)))) {
        return editorError("主题与意图不能填写相同关键词。", fields.intents);
      }
      const phrases = new Set([questionKey]);
      const aliases = fields.aliases.value.split(/\r?\n/).map((line) => line.trim()).filter((line) => {
        const key = normalized(line);
        if (!key || phrases.has(key)) return false;
        phrases.add(key);
        return true;
      });
      const existing = state.knowledge.find(({ id }) => id === editorContext.qaId);
      const conflict = state.knowledge.find((item) => item.id !== existing?.id && phraseList(item).some((phrase) => phrases.has(normalized(phrase))));
      if (conflict) return editorError(`问题或相似问法与「${conflict.question}」重复，请调整后再保存。`);

      const status = existing?.status === "published" || event.submitter?.value === "publish"
        ? "published" : existing?.status === "disabled" ? "disabled" : "draft";
      const updated = {
        id: existing?.id || newId("qa"), question, category: fields.category.value, aliases, answer, keywords: { topics, intents },
        status, updated: clockText(), sourceId: editorContext.sourceId
      };
      if (!commit((next) => {
        const index = next.knowledge.findIndex(({ id }) => id === updated.id);
        if (index >= 0) next.knowledge.splice(index, 1);
        next.knowledge.unshift(updated);
        if (status === "published") markAdded(next, updated.sourceId);
      })) return editorError("保存失败，请重试。");
      renderKnowledge();
      renderUnanswered();
      closeDialog();
      notify(status === "published" ? "问答已保存并发布" : status === "disabled" ? "问答已保存，保持停用" : "草稿已保存");
    });

    settings.addEventListener("submit", (event) => {
      event.preventDefault();
      if (settingsActions.hidden) return;
      const fields = settings.elements;
      const patch = {
        enabled: fields.enabled.type === "checkbox" ? fields.enabled.checked : fields.enabled.value === "true",
        welcome: fields.welcome.value.trim(), fallback: fields.fallback.value.trim(),
        threshold: Number(fields.threshold.value), handoff: fields.handoff.value.trim()
      };
      const missing = ["welcome", "fallback", "handoff"].find((field) => !patch[field]);
      if (missing) {
        fields[missing].focus();
        notify("请填写完整的接待话术。");
        return;
      }
      if (![1, 2, 3].includes(patch.threshold)) return;
      if (!commit((next) => { next.settings = patch; })) return;
      renderSettings(false);
      settingsEdit.focus();
      notify("接待设置已保存");
    });

    chat.addEventListener("submit", (event) => {
      event.preventDefault();
      ask(chat.elements.message.value);
      chat.elements.message.value = "";
      if (!handedOff) chat.elements.message.focus();
    });

    root.addEventListener("click", (event) => {
      const example = event.target.closest("[data-rc-example]");
      if (example) return ask(example.dataset.rcExample);
      if (activeDialog && event.target.classList.contains("cl-modal-mask")) return closeDialog();
      const button = event.target.closest("[data-rc-action]");
      if (!button) return;
      const key = button.dataset.rcAction;
      const id = button.dataset.id;
      if (key === "preview") {
        resetChat();
        openDialog("preview", button, "[name=message]");
      } else if (key === "new") {
        openEditor(null, null, button);
      } else if (key === "edit-qa" || key === "publish-qa" || key === "disable-qa") {
        const item = state.knowledge.find((row) => row.id === id);
        if (!item) return;
        if (key === "edit-qa") openEditor(item, null, button);
        else setKnowledgeStatus(item, key === "publish-qa" ? "published" : "disabled", button);
      } else if (key === "fill-qa" || key === "ignore-question" || key === "restore-question") {
        const record = state.unanswered.find((row) => row.id === id);
        if (!record) return;
        if (key === "fill-qa") openEditor(state.knowledge.find((item) => item.sourceId === id), record, button);
        else changeQuestionStatus(record, key === "ignore-question" ? "ignored" : "pending");
      } else if (key === "close-dialog") {
        closeDialog();
      } else if (key === "confirm") {
        if (confirmAction) confirmAction();
      } else if (key === "edit-settings") {
        renderSettings(true);
        settings.elements.enabled.focus();
      } else if (key === "cancel-settings") {
        renderSettings(false);
        settingsEdit.focus();
      } else if (key === "reset-chat") {
        resetChat();
        chat.elements.message.focus();
      } else if (key === "choose-qa" && !handedOff) {
        const selected = choices.find((item) => item.id === id);
        if (!selected) return;
        clearChoices();
        chatContext = [];
        missStreak = 0;
        bubble("user", selected.question);
        bubble("bot", selected.answer, `来源：${selected.question} · 访客已选择`);
        chat.elements.message.focus();
      } else if (key === "handoff" && !handedOff) {
        bubble("user", "转人工");
        transfer("访客请求人工客服");
      }
    });

    tabs.forEach((tab, index) => {
      tab.addEventListener("click", () => {
        tabs.forEach((item) => {
          item.setAttribute("aria-selected", String(item === tab));
          item.tabIndex = item === tab ? 0 : -1;
        });
      });
      tab.addEventListener("keydown", (event) => {
        const next = { ArrowLeft: (index + tabs.length - 1) % tabs.length,
          ArrowRight: (index + 1) % tabs.length, Home: 0, End: tabs.length - 1 }[event.key];
        if (next === undefined) return;
        event.preventDefault();
        tabs[next].click();
        tabs[next].focus();
      });
    });

    document.addEventListener("keydown", (event) => {
      if (!activeDialog) return;
      if (event.key === "Escape") {
        event.preventDefault();
        closeDialog();
      } else if (event.key === "Tab") {
        const focusable = Array.from(activeDialog.querySelectorAll("button, input, select, textarea, a[href]"))
          .filter((item) => !item.disabled && !item.closest("[hidden]"));
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    });

    renderKnowledge();
    renderUnanswered();
    renderSettings(false);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
