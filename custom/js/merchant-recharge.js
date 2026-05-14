(function () {
  var amountInput = document.getElementById("rechargeAmount");
  var submitButton = document.getElementById("submitRecharge");
  var amountCards = Array.prototype.slice.call(document.querySelectorAll(".amount-card"));
  var bonusHint = document.getElementById("bonusHint");
  var giftBonusAmount = document.getElementById("giftBonusAmount");

  function toAmount(value) {
    var normalized = String(value || "").replace(/[^\d.]/g, "");
    var firstDot = normalized.indexOf(".");
    if (firstDot !== -1) {
      normalized = normalized.slice(0, firstDot + 1) + normalized.slice(firstDot + 1).replace(/\./g, "");
    }
    return normalized;
  }

  function getExtraBonus(amount) {
    if (amount >= 50000) return amount * 0.02;
    if (amount >= 20000) return 2;
    if (amount >= 10000) return amount * 0.02;
    if (amount >= 5000) return 2;
    if (amount >= 2000) return 2;
    if (amount >= 1000) return amount * 0.02;
    return 0;
  }

  function formatBonus(value) {
    return value.toLocaleString("en-US", {
      minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
      maximumFractionDigits: 2
    });
  }

  function refreshSummary() {
    var amount = Number(amountInput.value || 0);
    var valid = amount > 0;
    var base = valid ? amount * 0.01 : 0;
    var extra = valid ? getExtraBonus(amount) : 0;
    var totalBonus = base + extra;

    submitButton.disabled = !valid;
    bonusHint.hidden = !valid || totalBonus <= 0;
    giftBonusAmount.textContent = formatBonus(totalBonus);

    amountCards.forEach(function (card) {
      card.classList.toggle("is-selected", Number(card.dataset.amount) === amount);
    });
  }

  amountCards.forEach(function (card) {
    card.addEventListener("click", function () {
      amountInput.value = card.dataset.amount;
      refreshSummary();
    });
  });

  amountInput.addEventListener("input", function () {
    var cleaned = toAmount(amountInput.value);
    if (amountInput.value !== cleaned) amountInput.value = cleaned;
    refreshSummary();
  });

  submitButton.addEventListener("click", function () {
    if (submitButton.disabled) return;
    submitButton.textContent = "订单已拉取";
    setTimeout(function () {
      submitButton.textContent = "立即充值";
    }, 1600);
  });

  refreshSummary();
})();
