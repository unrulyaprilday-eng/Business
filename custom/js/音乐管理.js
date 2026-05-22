(function () {
  var mask = document.querySelector(".modal-mask");
  var title = document.getElementById("modalTitle");
  var songName = document.getElementById("songName");
  var sortValue = document.getElementById("sortValue");
  var currentFile = document.querySelector(".current-file");
  var audioPreview = document.querySelector(".audio-preview");

  function openModal(type) {
    var isEdit = type === "edit";
    title.textContent = isEdit ? "修改音乐" : "新增音乐";
    songName.value = isEdit ? "测试" : "";
    sortValue.value = isEdit ? "1" : "";
    songName.placeholder = "请输入歌曲名称";
    sortValue.placeholder = "请输入排序值";
    currentFile.hidden = !isEdit;
    audioPreview.hidden = !isEdit;
    mask.hidden = false;
  }

  function closeModal() {
    mask.hidden = true;
  }

  document.addEventListener("click", function (event) {
    var trigger = event.target.closest("[data-modal]");
    if (trigger) {
      openModal(trigger.getAttribute("data-modal"));
      return;
    }

    if (
      event.target.classList.contains("modal-close") ||
      event.target.classList.contains("ghost-btn") ||
      event.target.classList.contains("submit-btn")
    ) {
      closeModal();
      return;
    }

    if (event.target === mask) {
      closeModal();
    }
  });
})();
