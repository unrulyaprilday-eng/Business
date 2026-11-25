(function () {
  const storagePrefix = "business.player-credit-score.v1.";
  const changeEvent = "business:player-credit-score-change";
  const rolePermissions = {
    admin: { view: true, adjust: true, configure: true },
    viewer: { view: true, adjust: false, configure: false },
    risk: { view: true, adjust: true, configure: false },
    configure: { view: false, adjust: false, configure: true },
    adjuster: { view: false, adjust: true, configure: false },
    none: { view: false, adjust: false, configure: false }
  };
  const members = {
    "101": [
      ["1010123475", "xxx123"], ["1010123474", "Ampqj3mex5uvj"],
      ["1010123473", "gb107"], ["1010123472", "Ampqg3ucz14..."],
      ["1010123471", "dzh7777"], ["1010123470", "Amppwy1912s..."],
      ["1010123469", "Amppg2on9e..."], ["1010123468", "zzz123"],
      ["1010123467", "lll123"], ["1010123466", "kkk123"]
    ]
  };
  // Continue the exported first-page IDs with explicitly synthetic prototype accounts.
  for (let index = 1; index <= 345; index += 1) {
    members["101"].push([String(1010123466 - index), "demo_member_" + String(index).padStart(3, "0")]);
  }
  const demoAdjustments = [
    ["1010123475", -20, "重复提交活动申请，核查后扣分", "qitian", "2026-11-18T10:24:06+08:00"],
    ["1010123474", -35, "活动申请异常，复核确认后扣分", "white2", "2026-11-18T14:38:25+08:00"],
    ["1010123472", -10, "活动资料核验未通过", "xixi", "2026-11-19T09:16:42+08:00"],
    ["1010123470", -5, "同一活动重复申领", "qitian", "2026-11-20T11:07:18+08:00"],
    ["1010123475", 5, "申诉复核通过，恢复部分扣分", "xixi", "2026-11-21T15:26:34+08:00"],
    ["1010123472", 10, "补充资料后复核通过，恢复原分", "white2", "2026-11-23T13:10:52+08:00"],
    ["1010123468", -50, "多次违规申领活动奖励，复核后扣分", "xixi", "2026-11-24T16:42:08+08:00"]
  ];

  // The Axure export has no login service. Query parameters are for previewing roles and merchants.
  const ownParams = new URLSearchParams(window.location.search);
  let parentParams = null;
  try {
    if (window.parent !== window) parentParams = new URLSearchParams(window.parent.location.search);
  } catch (error) {
    // Opening a file directly can restrict access to the viewer's parent window.
  }
  const demoRole = (parentParams && parentParams.get("creditRole")) || ownParams.get("creditRole") || "admin";
  const demoMerchant = (parentParams && parentParams.get("creditMerchant")) || ownParams.get("creditMerchant") || "101";
  const merchantId = /^\d+$/.test(demoMerchant) ? demoMerchant : "101";
  const permissions = Object.hasOwn(rolePermissions, demoRole) ? rolePermissions[demoRole] : rolePermissions.none;
  const operator = { admin: "xixi", viewer: "support01", risk: "risk01", configure: "config01", adjuster: "adjust01" };
  const key = storagePrefix + merchantId;

  function session() {
    return { merchantId, operator: Object.hasOwn(operator, demoRole) ? operator[demoRole] : "-", permissions: { ...permissions } };
  }

  function withDemoAdjustments(state) {
    if (merchantId !== "101" || state.demoAdjustmentsSeeded) return state;
    // Apply the demo history only to untouched members, then keep it with the next local save.
    const previouslyAdjusted = new Set([...Object.keys(state.scores), ...state.history.map((row) => row.memberId)]);
    const scores = { ...state.scores };
    const history = [...state.history];
    const memberNames = new Map(roster());
    for (const [memberId, delta, reason, operator, date] of demoAdjustments) {
      if (previouslyAdjusted.has(memberId) || !memberNames.has(memberId)) continue;
      const before = scoreOf({ scores }, memberId);
      const after = before + delta;
      scores[memberId] = after;
      history.push({ memberId, memberName: memberNames.get(memberId), before, after, delta, reason, operator, timestamp: Date.parse(date) });
    }
    history.sort((a, b) => b.timestamp - a.timestamp);
    return { ...state, scores, history, demoAdjustmentsSeeded: true };
  }

  function read() {
    try {
      const state = JSON.parse(window.localStorage.getItem(key));
      if (state && typeof state.enabled === "boolean" && state.scores && Array.isArray(state.history)) return withDemoAdjustments(state);
    } catch (error) {
      // Treat unavailable storage as closed; writes report the underlying failure to the form.
    }
    return withDemoAdjustments({ enabled: false, scores: {}, history: [] });
  }

  function fail(error) {
    return { ok: false, error };
  }

  function save(state) {
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      return fail("暂时无法保存，请确认浏览器允许保存本地数据后重试。");
    }
    window.dispatchEvent(new Event(changeEvent));
    return { ok: true };
  }

  function isEnabled(targetMerchant) {
    return String(targetMerchant) === merchantId && read().enabled;
  }

  function canAccessPage() {
    return permissions.configure || ((permissions.view || permissions.adjust) && isEnabled(merchantId));
  }

  function setEnabled(targetMerchant, enabled) {
    if (!permissions.configure || String(targetMerchant) !== merchantId) return fail("没有信誉分配置权限。");
    if (typeof enabled !== "boolean") return fail("请选择有效的启用状态。");
    const state = read();
    return state.enabled === enabled ? { ok: true } : save({ ...state, enabled });
  }

  function roster() {
    return members[merchantId] || [];
  }

  function getMembers(targetMerchant) {
    if (!(permissions.view || permissions.adjust) || String(targetMerchant) !== merchantId) return [];
    const state = read();
    if (!state.enabled) return [];
    const adjusted = permissions.view ? new Set(state.history.map((row) => row.memberId)) : null;
    return roster().map(([memberId, memberName]) => ({
      merchantId, memberId, memberName, score: scoreOf(state, memberId),
      ...(adjusted ? { hasAdjustments: adjusted.has(memberId) } : {})
    }));
  }

  function scoreOf(state, memberId) {
    return Object.hasOwn(state.scores, memberId) ? state.scores[memberId] : 100;
  }

  function getScore(targetMerchant, memberId) {
    if (!(permissions.view || permissions.adjust) || String(targetMerchant) !== merchantId) return null;
    const state = read();
    return state.enabled && roster().some(([id]) => id === String(memberId)) ? scoreOf(state, memberId) : null;
  }

  function getHistory(targetMerchant, memberId) {
    if (!permissions.view || String(targetMerchant) !== merchantId) return [];
    const state = read();
    if (!state.enabled) return [];
    return memberId == null ? state.history : state.history.filter((row) => row.memberId === String(memberId));
  }

  function adjust(targetMerchant, memberId, delta, reason, expectedScore) {
    if (!permissions.adjust || String(targetMerchant) !== merchantId) return fail("没有信誉分调整权限。");
    const state = read();
    if (!state.enabled) return fail("玩家信誉分已停用，当前无法调整。");
    const member = roster().find(([id]) => id === String(memberId));
    if (!member) return fail("找不到本商户的该会员。");
    const before = scoreOf(state, member[0]);
    if (expectedScore !== before) return fail("当前信誉分已变动，请核对后重新提交。");
    if (!Number.isInteger(delta) || delta === 0 || before + delta < 0 || before + delta > 100) {
      return fail("请输入有效的调整分值，调整后须在 0–100 分之间。");
    }
    const after = before + delta;
    if (typeof reason !== "string" || !reason.trim() || reason.trim().length > 200) return fail("请填写 1–200 字的调整原因。");
    const row = {
      memberId: member[0], memberName: member[1], before, after, delta,
      reason: reason.trim(), operator: session().operator, timestamp: Date.now()
    };
    return save({ ...state, scores: { ...state.scores, [member[0]]: after }, history: [row, ...state.history] });
  }

  function subscribe(callback) {
    function onStorage(event) {
      if (event.key === key || event.key === null) callback();
    }
    window.addEventListener(changeEvent, callback);
    window.addEventListener("storage", onStorage);
    return function unsubscribe() {
      window.removeEventListener(changeEvent, callback);
      window.removeEventListener("storage", onStorage);
    };
  }

  window.CreditScore = { session, isEnabled, canAccessPage, setEnabled, getMembers, getScore, getHistory, adjust, subscribe };
})();
