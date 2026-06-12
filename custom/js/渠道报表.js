(function () {
  function initChannelReport() {
    var searchBtn = document.getElementById('searchBtn');
    var exportBtn = document.getElementById('exportBtn');
    var summaryTab = document.getElementById('summaryTab');
    var detailTab = document.getElementById('detailTab');
    var summaryView = document.getElementById('summaryView');
    var detailView = document.getElementById('detailView');
    var backToSummaryBtn = document.getElementById('backToSummaryBtn');
    var drillButtons = Array.prototype.slice.call(document.querySelectorAll('[data-drill-channel]'));
    var detailContext = document.getElementById('detailContext');
    var tipButtons = Array.prototype.slice.call(document.querySelectorAll('.tip-trigger'));
    var tooltip = document.createElement('div');
    var activeTip = null;
    var pinnedTip = null;

    tooltip.className = 'floating-tip';
    document.body.appendChild(tooltip);

    function hideTooltip() {
      tooltip.classList.remove('is-visible');
    }

    function positionTooltip(button) {
      var rect = button.getBoundingClientRect();
      var tooltipRect;
      var left;
      var top;

      tooltip.classList.add('is-visible');
      tooltipRect = tooltip.getBoundingClientRect();
      left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
      top = rect.top - tooltipRect.height - 12;

      if (left < 8) {
        left = 8;
      }

      if (left + tooltipRect.width > window.innerWidth - 8) {
        left = window.innerWidth - tooltipRect.width - 8;
      }

      if (top < 8) {
        top = rect.bottom + 12;
        tooltip.style.setProperty('--tip-arrow-top', '-8px');
        tooltip.style.setProperty('--tip-arrow-bottom', 'auto');
        tooltip.style.setProperty('--tip-arrow-border-width', '0 7px 8px');
        tooltip.style.setProperty('--tip-arrow-border-color', 'transparent transparent rgba(40, 47, 58, 0.96)');
      } else {
        tooltip.style.setProperty('--tip-arrow-top', 'auto');
        tooltip.style.setProperty('--tip-arrow-bottom', '-8px');
        tooltip.style.setProperty('--tip-arrow-border-width', '8px 7px 0');
        tooltip.style.setProperty('--tip-arrow-border-color', 'rgba(40, 47, 58, 0.96) transparent transparent');
      }

      tooltip.style.left = left + 'px';
      tooltip.style.top = top + 'px';
    }

    function clearTipButtons(current) {
      tipButtons.forEach(function (button) {
        if (button !== current) {
          button.classList.remove('is-open');
        }
      });
    }

    function closeTips() {
      pinnedTip = null;
      activeTip = null;
      clearTipButtons(null);
      hideTooltip();
    }

    function openTip(button, pinned) {
      activeTip = button;
      pinnedTip = pinned ? button : null;
      tooltip.textContent = button.getAttribute('data-tip') || '';
      clearTipButtons(button);
      button.classList.add('is-open');
      positionTooltip(button);
    }

    function switchView(viewName) {
      var isDetail = viewName === 'detail';

      summaryTab.classList.toggle('active', !isDetail);
      detailTab.classList.toggle('active', isDetail);
      summaryView.hidden = isDetail;
      detailView.hidden = !isDetail;
      closeTips();

      if (window.parent && window.parent.$axure && window.parent.$axure.player) {
        window.parent.$axure.player.resizeContent(true);
      }
    }

    function updateDetailContext(channel, media, link) {
      if (detailContext) {
        detailContext.innerHTML = '<strong>渠道来源：</strong>' + channel + '&nbsp;&nbsp;&nbsp;<strong>媒体来源：</strong>' + media + '&nbsp;&nbsp;&nbsp;<strong>广告链接：</strong>' + link + '&nbsp;&nbsp;&nbsp;<strong>日期范围：</strong>2026-06-07 - 2026-06-14';
      }
    }

    if (searchBtn) {
      searchBtn.addEventListener('click', function () {
        searchBtn.textContent = '查询中...';
        window.setTimeout(function () {
          searchBtn.textContent = '查询';
        }, 500);
      });
    }

    if (exportBtn) {
      exportBtn.addEventListener('click', function () {
        exportBtn.textContent = '导出中...';
        window.setTimeout(function () {
          exportBtn.textContent = '导出数据';
        }, 700);
      });
    }

    if (summaryTab) {
      summaryTab.addEventListener('click', function () {
        switchView('summary');
      });
    }

    if (detailTab) {
      detailTab.addEventListener('click', function () {
        switchView('detail');
      });
    }

    if (backToSummaryBtn) {
      backToSummaryBtn.addEventListener('click', function () {
        switchView('summary');
      });
    }

    drillButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        updateDetailContext(
          button.getAttribute('data-drill-channel') || '-',
          button.getAttribute('data-drill-media') || '-',
          button.getAttribute('data-drill-link') || '-'
        );
        switchView('detail');
      });
    });

    tipButtons.forEach(function (button) {
      button.addEventListener('click', function (event) {
        if (pinnedTip === button) {
          closeTips();
        } else {
          openTip(button, true);
        }
        event.stopPropagation();
      });

      button.addEventListener('mouseenter', function () {
        if (!pinnedTip || pinnedTip === button) {
          openTip(button, false);
        }
      });

      button.addEventListener('mouseleave', function () {
        if (!pinnedTip || pinnedTip !== button) {
          button.classList.remove('is-open');
          activeTip = null;
          hideTooltip();
        }
      });
    });

    document.addEventListener('click', function () {
      closeTips();
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        closeTips();
      }
    });

    window.addEventListener('resize', function () {
      if (activeTip) {
        positionTooltip(activeTip);
      }
    });

    window.addEventListener('scroll', function () {
      if (activeTip) {
        positionTooltip(activeTip);
      }
    }, true);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initChannelReport);
  } else {
    initChannelReport();
  }
}());
