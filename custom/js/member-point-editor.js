(function () {
  var records = [
    { id: "pc-1001", memberId: "1010123475", username: "xxx123", vip: "VIP15", accountStatus: "启用", rtp: 105, targetAmount: 100000, completedAmount: 68450, status: "active", releaseResult: "", updatedAt: "2026-08-17 10:35:22", remark: "高价值玩家" },
    { id: "pc-1002", memberId: "1010123468", username: "zzz123", vip: "VIP10", accountStatus: "启用", rtp: 98, targetAmount: 50000, completedAmount: 47500, status: "active", releaseResult: "", updatedAt: "2026-08-17 09:42:10", remark: "" },
    { id: "pc-1003", memberId: "1010123462", username: "lucky77", vip: "VIP8", accountStatus: "启用", rtp: 90, targetAmount: 20000, completedAmount: 20000, status: "released", releaseResult: "amount", updatedAt: "2026-08-16 22:10:03", remark: "已达到目标" },
    { id: "pc-1004", memberId: "1010123449", username: "gamer_01", vip: "VIP5", accountStatus: "启用", rtp: 100, targetAmount: 10000, completedAmount: 3650, status: "active", releaseResult: "", updatedAt: "2026-08-16 18:20:44", remark: "100%控赢" },
    { id: "pc-1005", memberId: "1010123421", username: "betmaster", vip: "VIP12", accountStatus: "启用", rtp: 108, targetAmount: null, completedAmount: 123600, status: "active", releaseResult: "", updatedAt: "2026-08-15 16:04:18", remark: "无退出条件" },
    { id: "pc-1006", memberId: "1010123398", username: "sunshine", vip: "VIP3", accountStatus: "冻结", rtp: 92, targetAmount: 5000, completedAmount: 5000, status: "released", releaseResult: "amount", updatedAt: "2026-08-14 12:55:27", remark: "" }
  ];

  var storageKey = "business.memberPointControl.records.v1";
  var seedRecords = records;

  function readRecords() {
    try {
      var saved = JSON.parse(window.localStorage.getItem(storageKey));
      if (Array.isArray(saved)) return saved;
    } catch (_) {
      // The prototype also works for this visit if browser storage is unavailable.
    }
    return seedRecords.map(function (record) { return Object.assign({}, record); });
  }

  function persistRecords() {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(records));
    } catch (_) {
      // Keep the in-memory records usable on this page.
    }
  }

  function getRecords() {
    var changed = false;
    records.forEach(function (record) {
      if (record.targetAmount > 0 && record.status === "active" && record.completedAmount >= record.targetAmount) {
        record.status = "released";
        record.releaseResult = "amount";
        changed = true;
      }
    });
    if (changed) persistRecords();
    return records;
  }

  function formatDate(date) {
    var pad = function (number) { return String(number).padStart(2, "0"); };
    return date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate()) + " " + pad(date.getHours()) + ":" + pad(date.getMinutes()) + ":" + pad(date.getSeconds());
  }

  function release(id) {
    var record = getRecords().find(function (item) { return item.id === id; });
    if (!record || record.status !== "active") return false;
    record.status = "released";
    record.releaseResult = "manual";
    record.updatedAt = formatDate(new Date());
    persistRecords();
    return true;
  }

  var editorMarkup = `
    <div class="cl-modal-layer" data-point-modal="editor" hidden>
      <div class="cl-modal-mask" data-point-editor-close></div>
      <section class="cl-modal point-editor-modal" role="dialog" aria-modal="true" aria-labelledby="pointEditorTitle">
        <header class="cl-modal-head">
          <strong id="pointEditorTitle">新增会员点控</strong>
          <button class="cl-close-btn" type="button" data-point-editor-close aria-label="关闭">×</button>
        </header>
        <div class="cl-modal-body">
          <div class="point-query-step">
            <div class="cl-form-field">
              <label for="editorMemberId"><span class="cl-required">*</span>会员ID</label>
              <div class="member-query-row"><input class="cl-input" id="editorMemberId" type="text" placeholder="请输入会员ID"/><button class="cl-btn cl-btn-primary" id="editorMemberQuery" type="button">查询会员</button></div>
            </div>
            <p class="query-result" id="pointQueryResult" hidden></p>
            <p class="field-error" id="pointQueryError" role="alert" hidden></p>
          </div>
          <div class="point-config-step" id="pointConfigStep" hidden>
            <div class="cl-form-grid point-form-grid">
              <div class="cl-form-field">
                <label for="editorRtp"><span class="cl-required">*</span>设定RTP</label>
                <div class="input-suffix"><input class="cl-input" id="editorRtp" type="number" min="50" max="200" step="0.1" placeholder="请输入RTP"/><span>%</span></div>
                <div class="rtp-direction-hint direction-lose" id="editorDirectionHint"><strong>控输</strong><span>RTP低于100%，目标按玩家净输累计</span></div>
              </div>
              <div class="cl-form-field">
                <label for="editorTargetAmount" id="editorTargetLabel">净输目标金额</label>
                <div class="input-suffix"><input class="cl-input" id="editorTargetAmount" type="number" min="0.01" step="0.01" placeholder="可不设置净输目标"/></div>
                <p class="target-help">点控规则：目标金额可不设置，留空表示没有自动退出条件。</p>
              </div>
              <div class="cl-form-field is-wide">
                <label for="editorRemark">备注</label>
                <textarea class="cl-textarea" id="editorRemark" rows="3" placeholder="请输入点控备注"></textarea>
              </div>
            </div>
          </div>
          <p class="field-error" id="pointFormError" role="alert" hidden></p>
        </div>
        <footer class="cl-modal-foot">
          <button class="cl-btn" type="button" data-point-editor-close>取消</button>
          <button class="cl-btn cl-btn-primary" id="pointSave" type="button" disabled>保存</button>
        </footer>
      </section>
    </div>
    <div class="point-toast" id="pointToast" role="status" aria-live="polite" hidden></div>
  `;

  function createEditor(mount, onSave) {
    mount.innerHTML = editorMarkup;

    function find(selector) { return mount.querySelector(selector); }

    var modal = find('[data-point-modal="editor"]');
    var memberInput = find("#editorMemberId");
    var queryButton = find("#editorMemberQuery");
    var rtpInput = find("#editorRtp");
    var targetInput = find("#editorTargetAmount");
    var remarkInput = find("#editorRemark");
    var queryError = find("#pointQueryError");
    var queryResult = find("#pointQueryResult");
    var configStep = find("#pointConfigStep");
    var saveButton = find("#pointSave");
    var formError = find("#pointFormError");
    var toast = find("#pointToast");
    var editingId = null;
    var queriedMember = null;
    var returnFocus = null;
    var toastTimer;

    function syncDirection() {
      var isWin = Number(rtpInput.value) >= 100;
      var hint = find("#editorDirectionHint");
      hint.className = "rtp-direction-hint direction-" + (isWin ? "win" : "lose");
      hint.innerHTML = isWin
        ? "<strong>控赢</strong><span>RTP达到100%，目标按玩家净赢累计</span>"
        : "<strong>控输</strong><span>RTP低于100%，目标按玩家净输累计</span>";
      find("#editorTargetLabel").textContent = isWin ? "净赢目标金额" : "净输目标金额";
      targetInput.placeholder = isWin ? "可不设置净赢目标" : "可不设置净输目标";
    }

    function resetQuery() {
      queriedMember = null;
      configStep.hidden = true;
      saveButton.disabled = true;
      queryError.hidden = true;
      queryResult.hidden = true;
      formError.hidden = true;
    }

    function queryMember(selectedMember) {
      resetQuery();
      var memberId = memberInput.value.trim();
      var existing = getRecords().find(function (record) { return record.memberId === memberId; });
      var error = "";
      if (!memberId) error = "请输入会员ID后查询。";
      else if (!/^\d+$/.test(memberId)) error = "会员ID只能输入数字。";
      else if (existing && existing.id !== editingId) error = "该会员已有点控配置，请直接编辑已有配置。";
      if (error) {
        queryError.textContent = error;
        queryError.hidden = false;
        return;
      }

      queriedMember = selectedMember || existing || { memberId: memberId, username: "会员" + memberId.slice(-4), accountStatus: "启用" };
      queryResult.textContent = "已找到会员：" + queriedMember.username + "（ID：" + memberId + "）";
      queryResult.hidden = false;
      configStep.hidden = false;
      saveButton.disabled = false;
      syncDirection();
    }

    function open(options) {
      options = options || {};
      var selectedMember = options.member;
      var record = getRecords().find(function (item) {
        return options.id ? item.id === options.id : selectedMember && item.memberId === selectedMember.memberId;
      });
      if (options.id && !record) return;

      editingId = record ? record.id : null;
      find("#pointEditorTitle").textContent = record ? "编辑会员点控" : "新增会员点控";
      memberInput.value = selectedMember ? selectedMember.memberId : (record ? record.memberId : "");
      memberInput.readOnly = Boolean(selectedMember);
      queryButton.hidden = Boolean(selectedMember);
      rtpInput.value = record ? record.rtp : "95";
      targetInput.value = record && record.targetAmount != null ? record.targetAmount : "";
      remarkInput.value = record ? record.remark || "" : "";
      resetQuery();
      syncDirection();
      if (selectedMember || record) queryMember(selectedMember);

      returnFocus = document.activeElement;
      modal.hidden = false;
      (selectedMember && queriedMember ? rtpInput : memberInput).focus();
    }

    function close() {
      modal.hidden = true;
      if (returnFocus && returnFocus.isConnected) returnFocus.focus();
      returnFocus = null;
    }

    function notify(message) {
      toast.textContent = message;
      toast.hidden = false;
      window.clearTimeout(toastTimer);
      toastTimer = window.setTimeout(function () { toast.hidden = true; }, 2200);
    }

    function save() {
      var memberId = memberInput.value.trim();
      var rtp = Number(rtpInput.value);
      var rawTarget = targetInput.value.trim();
      var targetAmount = rawTarget === "" ? null : Number(rawTarget);
      var items = getRecords();
      var current = editingId ? items.find(function (record) { return record.id === editingId; }) : null;
      var error = "";
      if (!queriedMember || queriedMember.memberId !== memberId) error = "请先输入会员ID并查询会员。";
      else if (items.some(function (record) { return record.memberId === memberId && record.id !== editingId; })) error = "该会员已有点控配置，请直接编辑已有配置。";
      else if (editingId && !current) error = "该点控记录已更新，请关闭弹窗后重试。";
      else if (!Number.isFinite(rtp) || rtp < 50 || rtp > 200) error = "设定RTP需填写50至200之间的百分比。";
      else if (targetInput.validity.badInput || (targetAmount !== null && (!Number.isFinite(targetAmount) || targetAmount <= 0))) error = "目标金额留空表示无退出条件，否则需填写大于0的金额。";
      if (error) {
        formError.textContent = error;
        formError.hidden = false;
        return;
      }

      var updated = current || {
        id: "pc-" + memberId + "-" + Date.now(),
        completedAmount: 0
      };
      updated.memberId = memberId;
      updated.username = queriedMember.username;
      updated.vip = queriedMember.vip || updated.vip || "-";
      updated.accountStatus = queriedMember.accountStatus || updated.accountStatus || "启用";
      updated.rtp = rtp;
      updated.targetAmount = targetAmount;
      updated.status = targetAmount !== null && updated.completedAmount >= targetAmount ? "released" : "active";
      updated.releaseResult = updated.status === "released" ? "amount" : "";
      updated.remark = remarkInput.value.trim();
      updated.updatedAt = formatDate(new Date());
      if (!current) items.unshift(updated);
      persistRecords();
      close();
      if (onSave) onSave();
      notify(current ? "点控配置已更新" : "点控配置已新增");
    }

    modal.addEventListener("click", function (event) {
      if (event.target.closest("[data-point-editor-close]")) close();
    });
    modal.addEventListener("keydown", function (event) {
      if (event.key === "Escape") close();
    });
    queryButton.addEventListener("click", function () { queryMember(); });
    memberInput.addEventListener("input", resetQuery);
    rtpInput.addEventListener("input", syncDirection);
    saveButton.addEventListener("click", save);

    return { open: open, notify: notify };
  }

  records = readRecords();
  window.memberPointControl = {
    createEditor: createEditor,
    getRecords: getRecords,
    release: release,
    onStorageChange: function (callback) {
      window.addEventListener("storage", function (event) {
        if (event.key !== storageKey && event.key !== null) return;
        records = readRecords();
        callback();
      });
    }
  };
})();
