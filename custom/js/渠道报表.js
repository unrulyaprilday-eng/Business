(function () {
  function initChannelReport() {
    var searchBtn = document.getElementById('searchBtn');
    var exportBtn = document.getElementById('exportBtn');
    var detailContext = document.getElementById('detailContext');
    var tipButtons = Array.prototype.slice.call(document.querySelectorAll('.tip-trigger'));
    var tooltip = document.createElement('div');
    var activeTip = null;
    var pinnedTip = null;
    var channelMetaMap = {
      'AAAA': {
        media: 'Facebook/TikTok',
        link: 'homepageads 等'
      },
      'CCCC': {
        media: 'Facebook',
        link: 'feed-video-01 等'
      },
      'DDDD': {
        media: 'Google',
        link: 'search-brand-03 等'
      }
    };

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

    function updateDetailContextByQuery() {
      var params;
      var channel;
      var meta;

      if (!detailContext || !window.URLSearchParams) {
        return;
      }

      params = new window.URLSearchParams(window.location.search);
      channel = params.get('channel') || 'AAAA';
      meta = channelMetaMap[channel] || {
        media: '全部媒体',
        link: '全部广告链接'
      };

      detailContext.innerHTML = '<strong>渠道来源：</strong>' + channel + '&nbsp;&nbsp;&nbsp;<strong>媒体来源：</strong>' + meta.media + '&nbsp;&nbsp;&nbsp;<strong>广告链接：</strong>' + meta.link + '&nbsp;&nbsp;&nbsp;<strong>日期范围：</strong>2026-06-07 - 2026-06-14';
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

    updateDetailContextByQuery();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initChannelReport);
  } else {
    initChannelReport();
  }
}());
