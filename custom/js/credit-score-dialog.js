(function () {
  const credit = window.CreditScore;
  if (!credit) return;

  let dialog;
  let form;
  let amount;
  let error;
  let activeMember;
  let expectedScore;
  let onSaved;

  function availableAmount() {
    return form.elements.direction.value === "add" ? 100 - expectedScore : expectedScore;
  }

  function amountRange(maximum) {
    return maximum === 1 ? "1" : "1–" + maximum;
  }

  function fieldError(field, message) {
    dialog.querySelector("[data-error-" + field + "]").textContent = message;
    form.elements[field].setAttribute("aria-invalid", message ? "true" : "false");
  }

  function currentScore() {
    if (!activeMember || !credit.session().permissions.adjust) return null;
    return credit.getScore(activeMember.merchantId, activeMember.memberId);
  }

  function change() {
    const amountValue = amount.valueAsNumber;
    return form.elements.direction.value === "add" ? amountValue : -amountValue;
  }

  function updatePreview() {
    const delta = change();
    const after = expectedScore + delta;
    const maximum = availableAmount();
    amount.max = maximum;
    dialog.querySelector("[data-range]").textContent = maximum > 0
      ? "可" + (form.elements.direction.value === "add" ? "加" : "扣") + " " + amountRange(maximum) + " 分。"
      : "当前信誉分已达" + (form.elements.direction.value === "add" ? "上限，请选择扣分" : "下限，请选择加分");
    dialog.querySelector("[data-before]").textContent = expectedScore + " 分";
    dialog.querySelector("[data-after]").textContent = amount.validity.valid && Number.isInteger(delta) && delta !== 0 && after >= 0 && after <= 100
      ? after + " 分"
      : "—";
  }

  function close() {
    dialog.close();
    dialog.hidden = true;
    activeMember = null;
    onSaved = null;
  }

  function sync() {
    if (!dialog || !dialog.open) return;
    const score = currentScore();
    if (score === null) {
      close();
    } else if (score !== expectedScore) {
      expectedScore = score;
      updatePreview();
      error.textContent = "当前信誉分已变动，请核对后再提交。";
    }
  }

  function mount() {
    dialog = document.createElement("dialog");
    dialog.className = "credit-adjust-dialog";
    dialog.hidden = true;
    dialog.setAttribute("aria-labelledby", "credit-adjust-title");
    dialog.innerHTML = `
      <form novalidate>
        <header><h2 id="credit-adjust-title">调整信誉分</h2><button class="credit-adjust-close" type="button" data-cancel aria-label="关闭">×</button></header>
        <div class="credit-adjust-body">
          <dl class="credit-adjust-member">
            <div class="credit-adjust-row"><dt>会员ID：</dt><dd data-member-id></dd></div>
            <div class="credit-adjust-row"><dt>会员账号：</dt><dd data-member-name></dd></div>
            <div class="credit-adjust-row"><dt>当前信誉分：</dt><dd data-before></dd></div>
          </dl>
          <div class="credit-adjust-row"><span class="credit-adjust-label is-required" id="credit-adjust-direction">调整类型：</span>
            <div class="credit-adjust-radios" role="radiogroup" aria-labelledby="credit-adjust-direction">
              <label><input name="direction" type="radio" value="add">加分</label>
              <label><input name="direction" type="radio" value="subtract" checked>扣分</label>
            </div>
          </div>
          <div class="credit-adjust-row credit-adjust-field">
            <label class="credit-adjust-label is-required" for="credit-adjust-amount">调整分数：</label>
            <div><input id="credit-adjust-amount" name="amount" type="number" min="1" max="100" step="1" required placeholder="请输入调整分数" aria-describedby="credit-adjust-range credit-adjust-amount-error" autofocus>
              <p class="credit-adjust-hint" id="credit-adjust-range" data-range></p>
              <p class="credit-adjust-error" id="credit-adjust-amount-error" data-error-amount role="alert"></p>
            </div>
          </div>
          <div class="credit-adjust-row"><span class="credit-adjust-label">调整后信誉分：</span><output class="credit-adjust-after" data-after aria-live="polite"></output></div>
          <div class="credit-adjust-row credit-adjust-field credit-adjust-reason">
            <label class="credit-adjust-label is-required" for="credit-adjust-reason">调整原因：</label>
            <div><textarea id="credit-adjust-reason" name="reason" rows="3" maxlength="200" required placeholder="请输入调整原因，最多 200 字" aria-describedby="credit-adjust-reason-error"></textarea>
              <p class="credit-adjust-error" id="credit-adjust-reason-error" data-error-reason role="alert"></p>
            </div>
          </div>
          <p class="credit-adjust-error" role="alert"></p>
        </div>
        <footer><button class="credit-adjust-btn" type="button" data-cancel>取消</button><button class="credit-adjust-btn is-primary" type="submit">确定</button></footer>
      </form>`;
    document.body.appendChild(dialog);
    form = dialog.querySelector("form");
    amount = form.elements.amount;
    error = dialog.querySelector(".credit-adjust-body > .credit-adjust-error");
    for (const button of dialog.querySelectorAll("[data-cancel]")) button.addEventListener("click", close);
    dialog.addEventListener("cancel", (event) => { event.preventDefault(); close(); });
    dialog.addEventListener("click", (event) => { if (event.target === dialog) close(); });
    form.addEventListener("input", (event) => {
      updatePreview();
      if (event.target.name === "amount" || event.target.name === "direction") fieldError("amount", "");
      if (event.target.name === "reason") fieldError("reason", "");
    });
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (currentScore() === null) { close(); return; }
      fieldError("amount", "");
      fieldError("reason", "");
      error.textContent = "";
      if (!amount.validity.valid || !Number.isInteger(amount.valueAsNumber)) {
        const maximum = availableAmount();
        fieldError("amount", maximum === 0 ? "请选择另一种调整类型。" : maximum === 1 ? "请输入 1 分。" : "请输入 " + amountRange(maximum) + " 之间的整数。");
        amount.focus();
        return;
      }
      if (!form.elements.reason.value.trim() || form.elements.reason.value.length > 200) {
        fieldError("reason", !form.elements.reason.value.trim() ? "请填写调整原因。" : "调整原因最多 200 字。");
        form.elements.reason.focus();
        return;
      }
      const saved = onSaved;
      const result = credit.adjust(activeMember.merchantId, activeMember.memberId, change(), form.elements.reason.value, expectedScore);
      if (result.ok) {
        if (dialog.open) close();
        if (saved) saved();
      } else {
        sync();
        error.textContent = result.error;
      }
    });
    credit.subscribe(sync);
    window.addEventListener("focus", sync);
    window.addEventListener("pageshow", sync);
  }

  function open(member, trigger, saved) {
    if (!member || !credit.session().permissions.adjust || (dialog && dialog.open)) return;
    const score = credit.getScore(member.merchantId, member.memberId);
    if (score === null) return;
    if (!dialog) mount();
    activeMember = member;
    expectedScore = score;
    onSaved = typeof saved === "function" ? saved : null;
    form.reset();
    if (score === 0) form.elements.direction.value = "add";
    error.textContent = "";
    fieldError("amount", "");
    fieldError("reason", "");
    dialog.querySelector("[data-member-name]").textContent = member.memberName;
    dialog.querySelector("[data-member-id]").textContent = member.memberId;
    updatePreview();
    if (trigger) trigger.focus();
    dialog.hidden = false;
    dialog.showModal();
  }

  window.CreditScoreDialog = { open };
})();
