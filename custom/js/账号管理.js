(function () {
  var employees = [
    ["1", "xixi", "商户管理员", "启用", "163.53.18.25", "2026/05/09 22:44:54", "2026/04/13 15:42:37", "2026/05/09 22:44:54"],
    ["2", "josez", "商户管理员", "启用", "15.168.239.155", "2026/05/26 10:38:49", "2026/03/24 10:19:35", "2026/05/26 10:38:49"],
    ["3", "amumu", "商户管理员", "启用", "104.28.165.56", "2026/05/23 20:28:28", "2026/03/21 17:31:04", "2026/05/23 20:28:28"],
    ["4", "white2", "商户管理员", "启用", "45.207.205.111", "2026/04/25 10:36:20", "2026/03/20 16:30:03", "2026/04/25 10:38:13"],
    ["5", "qitian", "商户管理员", "启用", "50.7.250.50", "2026/05/26 13:20:43", "2026/03/20 10:23:00", "2026/05/26 13:20:43"],
    ["6", "gaullow", "商户管理员", "启用", "45.207.205.111", "2026/05/25 12:03:21", "2026/03/18 17:24:10", "2026/05/25 12:03:21"],
    ["7", "zhoudaxi", "商户管理员", "启用", "154.12.53.157", "2026/05/26 13:22:25", "2026/03/12 13:15:03", "2026/05/26 13:22:25"],
    ["8", "white", "商户管理员", "启用", "154.12.53.157", "2026/05/26 11:20:28", "2026/01/29 10:33:40", "2026/05/26 11:20:28"]
  ];

  var tableBody = document.getElementById("accountTableBody");
  var keywordInput = document.getElementById("keywordInput");
  var employeeModal = document.getElementById("employeeModal");
  var confirmModal = document.getElementById("confirmModal");
  var employeeTitle = document.getElementById("employeeTitle");
  var loginNameInput = document.getElementById("loginNameInput");
  var passwordInput = document.getElementById("passwordInput");
  var roleSelect = document.getElementById("roleSelect");
  var roleValue = document.getElementById("roleValue");
  var roleMenu = roleSelect.querySelector(".select-menu");

  function renderRows(rows) {
    tableBody.innerHTML = rows.map(function (row) {
      return "<tr>" +
        "<td>" + row[0] + "</td>" +
        "<td>" + row[1] + "</td>" +
        "<td>" + row[2] + "</td>" +
        "<td><span class=\"status-tag\">" + row[3] + "</span></td>" +
        "<td>" + row[4] + "</td>" +
        "<td>" + row[5] + "</td>" +
        "<td>" + row[6] + "</td>" +
        "<td>" + row[7] + "</td>" +
        "<td><button class=\"link-btn\" type=\"button\" data-edit=\"" + row[1] + "\">编辑</button>" +
        "<button class=\"link-btn link-warning\" type=\"button\" data-reset-auth>重置Google验证器</button></td>" +
        "</tr>";
    }).join("");
  }

  function openEmployee(mode, name) {
    var editing = mode === "edit";
    employeeTitle.textContent = editing ? "编辑员工" : "新增员工";
    loginNameInput.value = editing ? name : "";
    loginNameInput.disabled = editing;
    passwordInput.value = "";
    passwordInput.placeholder = editing ? "不修改请留空" : "请输入登录密码（至少6位）";
    roleValue.textContent = "商户管理员";
    roleSelect.classList.remove("open");
    roleMenu.hidden = true;
    employeeModal.hidden = false;
  }

  function closeEmployee() {
    employeeModal.hidden = true;
    roleSelect.classList.remove("open");
    roleMenu.hidden = true;
  }

  function closeConfirm() {
    confirmModal.hidden = true;
  }

  renderRows(employees);

  document.getElementById("searchBtn").addEventListener("click", function () {
    var keyword = keywordInput.value.trim().toLowerCase();
    renderRows(employees.filter(function (row) {
      return !keyword || row[1].toLowerCase().indexOf(keyword) !== -1;
    }));
  });

  document.getElementById("resetBtn").addEventListener("click", function () {
    keywordInput.value = "";
    renderRows(employees);
  });

  document.querySelector("[data-open-employee]").addEventListener("click", function () {
    openEmployee("create");
  });

  tableBody.addEventListener("click", function (event) {
    var editBtn = event.target.closest("[data-edit]");
    var resetBtn = event.target.closest("[data-reset-auth]");
    if (editBtn) {
      openEmployee("edit", editBtn.getAttribute("data-edit"));
    }
    if (resetBtn) {
      confirmModal.hidden = false;
    }
  });

  employeeModal.addEventListener("click", function (event) {
    if (event.target.closest("[data-close-modal]")) {
      closeEmployee();
    }
  });

  confirmModal.addEventListener("click", function (event) {
    if (event.target.closest("[data-close-confirm]")) {
      closeConfirm();
    }
  });

  roleSelect.querySelector(".select-trigger").addEventListener("click", function () {
    var willOpen = !roleSelect.classList.contains("open");
    roleSelect.classList.toggle("open", willOpen);
    roleMenu.hidden = !willOpen;
  });

  roleMenu.addEventListener("click", function (event) {
    var option = event.target.closest("[data-role]");
    if (!option) {
      return;
    }
    roleValue.textContent = option.getAttribute("data-role");
    roleMenu.querySelectorAll("button").forEach(function (button) {
      button.classList.toggle("active", button === option);
    });
    roleSelect.classList.remove("open");
    roleMenu.hidden = true;
  });

  document.addEventListener("click", function (event) {
    if (!roleSelect.contains(event.target)) {
      roleSelect.classList.remove("open");
      roleMenu.hidden = true;
    }
  });
})();
