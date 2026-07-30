(function () {
  var detailMap = {
    eva1029: {
      summary: "eva1029 / 1010037821 / VIP1",
      spinCount: 3,
      rows: [
        { time: "2026-07-08 10:32:16", change: "+2.40", type: "Money Coming" },
        { time: "2026-07-08 10:28:43", change: "+2.00", type: "Money Coming" },
        { time: "2026-07-08 10:21:09", change: "+3.00", type: "Money Coming" }
      ]
    },
    mark7801: {
      summary: "mark7801 / 1010037798 / VIP3",
      spinCount: 5,
      rows: [
        { time: "2026-07-08 10:04:51", change: "-15.00", type: "Claim to Balance" },
        { time: "2026-07-08 09:58:22", change: "+4.00", type: "Money Coming" },
        { time: "2026-07-08 09:53:10", change: "+3.00", type: "Money Coming" },
        { time: "2026-07-08 09:47:36", change: "+8.00", type: "Money Coming" }
      ]
    },
    luna4412: {
      summary: "luna4412 / 1010037712 / VIP6",
      spinCount: 1,
      rows: [
        { time: "2026-07-08 08:22:02", change: "+0.80", type: "Money Coming" },
        { time: "2026-07-08 08:18:44", change: "+0.00", type: "Money Coming" }
      ]
    },
    nora6530: {
      summary: "nora6530 / 1010037502 / VIP2",
      spinCount: 2,
      rows: [
        { time: "2026-07-07 22:20:31", change: "+2.80", type: "Money Coming" },
        { time: "2026-07-07 22:11:05", change: "+3.00", type: "Money Coming" }
      ]
    },
    chris88: {
      summary: "chris88 / 1010037448 / VIP4",
      spinCount: 0,
      rows: [
        { time: "2026-07-07 19:33:42", change: "+0.00", type: "Money Coming" }
      ]
    },
    polo377: {
      summary: "polo377 / 1010037306 / VIP8",
      spinCount: 5,
      rows: [
        { time: "2026-07-07 17:01:18", change: "+4.60", type: "Money Coming" },
        { time: "2026-07-07 16:57:44", change: "+4.00", type: "Money Coming" },
        { time: "2026-07-07 16:54:21", change: "+5.00", type: "Money Coming" },
        { time: "2026-07-07 16:50:27", change: "+5.00", type: "Money Coming" }
      ]
    },
    amy201: {
      summary: "amy201 / 1010037189 / VIP5",
      spinCount: 4,
      rows: [
        { time: "2026-07-07 13:43:02", change: "+3.20", type: "Money Coming" },
        { time: "2026-07-07 13:35:58", change: "+2.00", type: "Money Coming" },
        { time: "2026-07-07 13:31:24", change: "+3.00", type: "Money Coming" },
        { time: "2026-07-07 13:28:10", change: "+3.00", type: "Money Coming" }
      ]
    },
    skye55: {
      summary: "skye55 / 1010037018 / VIP7",
      spinCount: 2,
      rows: [
        { time: "2026-07-07 11:16:40", change: "+1.10", type: "Money Coming" },
        { time: "2026-07-07 11:05:19", change: "+3.00", type: "Money Coming" }
      ]
    },
    zoe729: {
      summary: "zoe729 / 1010036924 / VIP9",
      spinCount: 5,
      rows: [
        { time: "2026-07-07 10:03:22", change: "-12.80", type: "Claim to Balance" },
        { time: "2026-07-07 09:58:41", change: "+2.80", type: "Money Coming" },
        { time: "2026-07-07 09:52:13", change: "+5.00", type: "Money Coming" },
        { time: "2026-07-07 09:40:08", change: "+5.00", type: "Money Coming" }
      ]
    },
    kevin03: {
      summary: "kevin03 / 1010036680 / VIP2",
      spinCount: 1,
      rows: [
        { time: "2026-07-06 21:19:55", change: "+2.40", type: "Money Coming" },
        { time: "2026-07-06 21:12:44", change: "+0.00", type: "Money Coming" }
      ]
    }
  };

  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  function renderRows(rows) {
    return rows.map(function (row) {
      var changeClass = row.change.charAt(0) === "-" ? "is-minus" : "is-plus";
      return "<tr>" +
        "<td>" + row.time + "</td>" +
        "<td class=\"" + changeClass + "\">" + row.change + "</td>" +
        "<td>" + row.type + "</td>" +
      "</tr>";
    }).join("");
  }

  function openDetail(key) {
    var modal = document.querySelector("[data-detail-modal]");
    var detail = detailMap[key];
    if (!modal || !detail) return;

    modal.querySelector("[data-detail-summary]").textContent = detail.summary;
    modal.querySelector("[data-detail-spin]").textContent = "已转 " + detail.spinCount + " 次 / 上限 5 次";
    modal.querySelector("[data-detail-body]").innerHTML = renderRows(detail.rows);
    modal.hidden = false;
  }

  function closeDetail() {
    var modal = document.querySelector("[data-detail-modal]");
    if (modal) {
      modal.hidden = true;
    }
  }

  ready(function () {
    document.addEventListener("click", function (event) {
      var detailTrigger = event.target.closest("[data-detail-key]");
      if (detailTrigger) {
        event.preventDefault();
        openDetail(detailTrigger.getAttribute("data-detail-key"));
        return;
      }

      if (event.target.closest("[data-detail-close]")) {
        closeDetail();
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        closeDetail();
      }
    });
  });
})();
