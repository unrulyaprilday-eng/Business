(function () {
  "use strict";
  const key = "business.user-management.vip-settings.v1";
  const names = {level:"VIP晋级条件", weekly:"周工资", monthly:"月工资", birthday:"生日奖励", whale:"大R等级定义"};
  const salaryTabs = ["weekly","monthly"];
  const clone = value => JSON.parse(JSON.stringify(value));
  const amount = n => Number.isFinite(n) && n >= 0;
  const validMode = value => ["recharge","wager"].includes(value);
  const defaultBirthday = level => (level + 1) * 5;
  function defaults() {
    const recharge = [0,20,50,100,150,200,400,800,1000,1500,2000];
    const wager = [0,100,200,400,500,1000,1500,2000,3000,4000,5000];
    const reward = [0,20,40,100,200,400,600,800,1000,1200,1400];
    const weekly = [[500,1000,100],[1000,2000,200],[2000,4000,400],[3000,8000,800],[4000,12000,1200],[5000,18000,2000],[6000,25000,2500],[7000,40000,4000],[8000,80000,8000],[9000,120080,12000],[10000,300000,20000]];
    return {mode:"recharge", levels: recharge.map((v,i) => i === 0 ? {} : ({
      recharge:v, wager:wager[i], reward:reward[i], birthday:defaultBirthday(i), weekly:weekly[i],
      monthly:weekly[i].map((x,j) => i === 9 && j === 1 ? 1200000 : x * 10)
    })), weekly:{enabled:true,mode:"recharge"},monthly:{enabled:true,mode:"recharge"},birthday:{enabled:false},
      whale:[1000000,10000000,100000000]};
  }
  function valid(s) {
    return s && validMode(s.mode) && Array.isArray(s.levels) && s.levels.length > 0 &&
      s.levels.every((r,i) => i === 0 ? r && Object.keys(r).length === 0 : r && [r.recharge,r.wager,r.reward,r.birthday].every(amount) && salaryTabs.every(k =>
        Array.isArray(r[k]) && r[k].length === 3 && r[k].every(amount))) &&
      salaryTabs.every(k => s[k] && typeof s[k].enabled === "boolean" && validMode(s[k].mode)) &&
      s.birthday && typeof s.birthday.enabled === "boolean" &&
      Array.isArray(s.whale) && s.whale.length === 3 && s.whale.every(amount);
  }
  function init() {
    const page = document.querySelector(".vip-settings-page");
    if (!page) return;
    const find = selector => page.querySelector(selector);
    const control = k => find('[data-control="'+k+'"]');
    const action = k => find('[data-action="'+k+'"]');
    const table = find(".vip-table"), mode = control("mode");
    const enabled = control("enabled"), dialog = find("[data-confirm]");
    if (!table || !enabled || !mode || !dialog) return;
    const toggle = enabled.querySelector("input");
    let saved = defaults(), draft = null, tab = "level", pending = null;
    try {
      const stored = JSON.parse(localStorage.getItem(key));
      // Preserve grades and both thresholds from configurations saved before birthdays existed.
      if (stored && !stored.birthday && Array.isArray(stored.levels)) {
        stored.birthday = {enabled:false};
        stored.levels.forEach((r,i) => { r.birthday = defaultBirthday(i); });
        salaryTabs.forEach(k => { stored[k] = {enabled:stored[k].enabled, mode:"recharge"}; });
      }
      if (stored && Array.isArray(stored.levels) && stored.levels.length) stored.levels[0] = {};
      if (valid(stored)) saved = stored;
    } catch (_) { /* Storage can be unavailable for local previews. */ }
    function error(msg) {
      const el = find("[data-error]");
      el.textContent = msg; el.hidden = !msg;
    }
    function hint() {
      const el = find("[data-hint]");
      if (tab === "level") el.textContent = "VIP0 为注册默认等级。晋级仅按所选条件计算。";
      else if (tab === "whale") el.textContent = "按累计充值划分玩家类型。";
      else if (tab === "birthday") el.textContent = "生日奖励金额按会员 VIP 等级设置。";
      else el.textContent = names[tab]+"仅按所选领取条件判断。";
    }
    function render() {
      const s = draft || saved, edit = !!draft, salary = salaryTabs.includes(tab);
      page.classList.toggle("is-editing",edit);
      page.querySelectorAll("button[data-tab]").forEach(b => {
        const selected = b.dataset.tab === tab;
        b.classList.toggle("is-active",selected); b.setAttribute("aria-pressed",String(selected));
      });
      find(".vip-section-title").textContent = names[tab];
      const selectedMode = salary ? s[tab].mode : s.mode;
      mode.hidden = tab !== "level" && !salary; enabled.hidden = !salary && tab !== "birthday";
      const label = salary ? "领取条件" : "晋级条件";
      find("[data-mode-label]").textContent = label; mode.setAttribute("aria-label",label);
      mode.querySelectorAll("input").forEach(i => { i.checked = i.value === selectedMode; i.disabled = !edit; });
      if (!enabled.hidden) {
        toggle.checked = s[tab].enabled; toggle.disabled = !edit;
      }
      action("edit").hidden = edit; find("[data-footer]").hidden = !edit;
      action("add").hidden = action("remove").hidden = !edit || tab !== "level";
      action("remove").disabled = s.levels.length <= 1;
      hint();
      const headers = tab === "level" ? ["VIP等级",s.mode === "recharge" ? "累计充值" : "累计打码","晋级奖励"] :
        salary ? ["VIP等级",selectedMode === "recharge" ? "累计充值" : "累计打码","工资金额"] :
        tab === "birthday" ? ["VIP等级","生日奖励金额"] : ["类型","累计充值"];
      table.setAttribute("aria-label",names[tab]); table.replaceChildren();
      const hr = table.createTHead().insertRow();
      headers.forEach(h => { const th = document.createElement("th"); th.scope="col"; th.textContent=h; hr.append(th); });
      const body = table.createTBody();
      (tab === "whale" ? s.whale : s.levels).forEach((r,i) => {
        const tr = body.insertRow(), label = tab === "whale" ? ["小R玩家","中R玩家","大R玩家"][i] : "VIP"+i;
        tr.insertCell().textContent = label+(tab === "level" && !i ? "（默认）" : "");
        const fields = tab === "level" ? [s.mode,"reward"] : salary ? [selectedMode === "recharge" ? 0 : 1,2] : tab === "birthday" ? ["birthday"] : [i];
        const target = tab === "whale" ? s.whale : salary ? r[tab] : r;
        fields.forEach((field,j) => {
          const td = tr.insertCell();
          if (tab !== "whale" && i === 0) { td.textContent = "-"; return; }
          if (!edit) { td.textContent = target[field]; return; }
          const input = document.createElement("input");
          input.type="number"; input.min="0"; input.step="any"; input.required=true;
          input.value = target[field] == null ? "" : target[field];
          input.setAttribute("aria-label",label+" "+headers[j+1]);
          input.addEventListener("input",() => { target[field] = amount(input.valueAsNumber) ? input.valueAsNumber : null; });
          td.append(input);
        });
      });
    }
    function currentValid() {
      if (!draft) return true;
      const bad = table.querySelector("input:invalid");
      if (bad) { error("请输入有效的非负数值。"); bad.focus(); return false; }
      error(""); return true;
    }
    page.querySelectorAll("button[data-tab]").forEach(b => b.addEventListener("click",() => {
      if (currentValid()) { tab = b.dataset.tab; render(); }
    }));
    mode.addEventListener("change",e => {
      if (!draft) return;
      const config = salaryTabs.includes(tab) ? draft[tab] : draft;
      if (!currentValid()) { mode.querySelectorAll("input").forEach(i => {i.checked = i.value === config.mode;}); return; }
      config.mode=e.target.value; render();
    });
    toggle.addEventListener("change",() => { if (draft) draft[tab].enabled=toggle.checked; });
    action("edit").onclick = () => { draft=clone(saved); error(""); render(); };
    action("add").onclick = () => {
      if (!draft || !currentValid()) return;
      draft.levels.push({recharge:0,wager:0,reward:0,birthday:defaultBirthday(draft.levels.length),weekly:[0,0,0],monthly:[0,0,0]});
      render(); table.querySelector("tbody tr:last-child input").focus();
    };
    function ask(message,fn) { pending=fn; find("[data-message]").textContent=message; dialog.showModal(); }
    action("remove").onclick = () => {
      if (draft && draft.levels.length > 1) ask("删除 VIP"+(draft.levels.length-1)+" 及其周工资、月工资和生日奖励配置？保存后生效。",() => {draft.levels.pop();});
    };
    action("cancel").onclick = () => ask("放弃本次所有未保存的修改？",() => {draft=null;});
    dialog.querySelectorAll('[data-action="dismiss"]').forEach(b => { b.onclick = () => dialog.close(); });
    action("confirm").onclick = () => { if (pending) pending(); pending=null; dialog.close(); error(""); render(); };
    action("save").onclick = () => {
      if (!draft || !currentValid()) return;
      if (!valid(draft)) { error("配置不完整，请检查领取条件和各等级的数值。"); return; }
      try { localStorage.setItem(key,JSON.stringify(draft)); }
      catch (_) { error("保存失败，草稿已保留。请检查浏览器是否允许本地存储。"); return; }
      saved=draft; draft=null; error(""); render(); action("edit").focus();
    };
    render();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded",init);
  else init();
})();
