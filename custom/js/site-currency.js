(function () {
  var storageKey = "business.site-front.currency.v1";
  var allowedCodes = ["USD", "BRL", "IDR", "INR"];

  window.businessSiteCurrency = {
    read: function () {
      try {
        var code = window.localStorage.getItem(storageKey);
        return allowedCodes.indexOf(code) !== -1 ? code : "USD";
      } catch (error) {
        return "USD";
      }
    },
    write: function (code) {
      if (allowedCodes.indexOf(code) === -1) return false;
      try {
        window.localStorage.setItem(storageKey, code);
        return true;
      } catch (error) {
        return false;
      }
    }
  };
})();
