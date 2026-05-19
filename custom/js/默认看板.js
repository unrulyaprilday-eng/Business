(function () {
  var toggle = document.querySelector(".more-toggle");
  var more = document.getElementById("moreDashboard");

  if (!toggle || !more) {
    return;
  }

  toggle.addEventListener("click", function () {
    var expanded = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!expanded));
    toggle.textContent = expanded ? "查看更多" : "收起更多";
    more.hidden = expanded;
  });
}());
