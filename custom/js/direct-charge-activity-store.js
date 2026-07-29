(function (window) {
  "use strict";

  var STORAGE_KEY = "business-direct-charge-activities-v1";
  var CHANNELS = [
    { value: "SuccusPay / Cashapp", amountMode: "fixed", amounts: [20, 50, 100, 200] },
    { value: "SuccusPay / Applepay", amountMode: "fixed", amounts: [4.99, 9.99, 19.99, 49.99] },
    { value: "UsdtPay / TRC20", amountMode: "custom", amounts: [] },
    { value: "WiwiPay / PIX", amountMode: "custom", amounts: [] }
  ];
  var REWARD_TYPES = ["现金奖励", "余额奖励", "活动奖金"];
  var DEFAULT_ACTIVITIES = [
    { id: "dca_001", name: "新客直充100送10", channel: "SuccusPay / Cashapp", rechargeAmount: 100, rewardType: "现金奖励", rewardAmount: 10, status: "启用", updatedAt: "2026-07-29 10:20:00" },
    { id: "dca_002", name: "Apple Pay 9.99赠1", channel: "SuccusPay / Applepay", rechargeAmount: 9.99, rewardType: "余额奖励", rewardAmount: 1, status: "启用", updatedAt: "2026-07-28 16:45:00" },
    { id: "dca_003", name: "USDT直充50送5", channel: "UsdtPay / TRC20", rechargeAmount: 50, rewardType: "活动奖金", rewardAmount: 5, status: "停用", updatedAt: "2026-07-27 09:30:00" }
  ];
  var memoryActivities = clone(DEFAULT_ACTIVITIES);

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function getAll() {
    try {
      var saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        var parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return clone(parsed);
      }
    } catch (error) {
      // File previews may block localStorage; the in-memory copy keeps the prototype usable.
    }
    return clone(memoryActivities);
  }

  function setAll(activities) {
    memoryActivities = clone(activities);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryActivities));
    } catch (error) {
      // See getAll: storage is optional for local file previews.
    }
    return getAll();
  }

  function getById(id) {
    return getAll().filter(function (activity) { return activity.id === id; })[0] || null;
  }

  function getEnabled() {
    return getAll().filter(function (activity) { return activity.status === "启用"; });
  }

  function getChannel(value) {
    return CHANNELS.filter(function (channel) { return channel.value === value; })[0] || CHANNELS[0];
  }

  function formatAmount(value) {
    var amount = Number(value);
    if (!isFinite(amount)) return "-";
    return amount.toFixed(2);
  }

  window.DirectChargeActivityStore = {
    getAll: getAll,
    setAll: setAll,
    getById: getById,
    getEnabled: getEnabled,
    getChannel: getChannel,
    formatAmount: formatAmount,
    channels: clone(CHANNELS),
    rewardTypes: REWARD_TYPES.slice()
  };
}(window));
