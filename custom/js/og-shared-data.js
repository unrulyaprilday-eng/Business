(function () {
  var library = {
    siteDefault: {
      key: "site-default",
      rowType: "site",
      typeLabel: "站点OG",
      bizType: "页面",
      name: "站点默认OG",
      path: "/",
      title: "WTGAME 官方站点分享卡片",
      description: "默认用于未单独配置 OG 的页面和活动分享卡片。",
      image: "SITE",
      status: "on",
      updatedAt: "2026-06-29 16:20:00",
      inherited: false
    },
    pageRows: [
      {
        key: "invite-og",
        rowType: "module",
        typeLabel: "页面OG",
        bizType: "页面",
        name: "邀请OG",
        path: "/invite",
        title: "邀请好友领取专属首充礼遇",
        description: "邀请页分享时展示邀请奖励、任务入口与品牌主图。",
        image: "INV",
        status: "on",
        updatedAt: "2026-06-29 15:40:00",
        inherited: false
      },
      {
        key: "vip-og",
        rowType: "module",
        typeLabel: "页面OG",
        bizType: "页面",
        name: "VIP OG",
        path: "/vip",
        title: "VIP 等级权益已开放领取",
        description: "VIP 页面分享时突出等级权益、升级礼与入口链接。",
        image: "VIP",
        status: "on",
        updatedAt: "2026-06-29 15:25:00",
        inherited: false
      }
    ],
    activityRows: [
      {
        key: "first-deposit-og",
        rowType: "activity",
        typeLabel: "活动分享",
        bizType: "活动",
        name: "首充活动OG",
        path: "/promotion/first-deposit",
        title: "首充送金已开启，注册后即可参与",
        description: "首充活动分享卡片展示活动利益点、参与入口与封面图。",
        image: "1ST",
        status: "on",
        updatedAt: "2026-06-29 14:50:00",
        inherited: false
      },
      {
        key: "game-share-1",
        rowType: "activity",
        typeLabel: "活动分享",
        bizType: "活动",
        name: "游戏分享1",
        path: "/share/game-1",
        title: "今日游戏分享奖励已上线",
        description: "适用于分享领奖类活动，突出领取奖励和活动入口。",
        image: "G1",
        status: "on",
        updatedAt: "2026-06-29 13:30:00",
        inherited: false
      },
      {
        key: "game-share-2",
        rowType: "activity",
        typeLabel: "活动分享",
        bizType: "活动",
        name: "游戏分享2",
        path: "/share/game-2",
        title: "分享即领限时福利",
        description: "适用于裂变推广活动，强调时效和奖励力度。",
        image: "G2",
        status: "on",
        updatedAt: "2026-06-29 13:05:00",
        inherited: false
      },
      {
        key: "game-share-3",
        rowType: "activity",
        typeLabel: "活动分享",
        bizType: "活动",
        name: "游戏分享3",
        path: "/share/game-3",
        title: "转发活动页领取专属礼包",
        description: "作为活动 OG 方案示意，可直接被新增活动复用。",
        image: "G3",
        status: "off",
        updatedAt: "2026-06-29 12:48:00",
        inherited: true
      },
      {
        key: "game-share-4",
        rowType: "activity",
        typeLabel: "活动分享",
        bizType: "活动",
        name: "游戏分享4",
        path: "/share/game-4",
        title: "热门游戏专区分享卡片",
        description: "适合活动聚合投放，突出热门游戏和统一入口。",
        image: "G4",
        status: "on",
        updatedAt: "2026-06-29 11:55:00",
        inherited: false
      },
      {
        key: "game-share-5",
        rowType: "activity",
        typeLabel: "活动分享",
        bizType: "活动",
        name: "游戏分享5",
        path: "/share/game-5",
        title: "限时任务分享已开放",
        description: "示意用于活动发布前预留的第五套分享 OG 方案。",
        image: "G5",
        status: "off",
        updatedAt: "2026-06-29 11:20:00",
        inherited: true
      }
    ],
    customLinks: [
      {
        key: "app-download",
        rowType: "custom",
        typeLabel: "自定义链接",
        bizType: "页面",
        name: "APP下载页",
        path: "/download/app",
        title: "下载 APP 领取新客礼包",
        description: "用于外部投放和下载页分享的独立 OG 卡片。",
        image: "APP",
        status: "on",
        updatedAt: "2026-06-29 10:35:00",
        inherited: false
      },
      {
        key: "promo-hub",
        rowType: "custom",
        typeLabel: "自定义链接",
        bizType: "页面",
        name: "优惠活动聚合页",
        path: "/promo/hub",
        title: "本周重点活动一页直达",
        description: "聚合页分享卡片可单独维护标题、描述与封面图。",
        image: "HUB",
        status: "on",
        updatedAt: "2026-06-29 09:40:00",
        inherited: false
      }
    ],
    activityOptions: [
      {
        value: "follow-default",
        key: "site-default",
        label: "站点OG"
      },
      {
        value: "game-share-1",
        key: "game-share-1",
        label: "游戏分享1"
      },
      {
        value: "game-share-2",
        key: "game-share-2",
        label: "游戏分享2"
      },
      {
        value: "game-share-3",
        key: "game-share-3",
        label: "游戏分享3"
      },
      {
        value: "game-share-4",
        key: "game-share-4",
        label: "游戏分享4"
      },
      {
        value: "game-share-5",
        key: "game-share-5",
        label: "游戏分享5"
      },
      {
        value: "first-deposit-og",
        key: "first-deposit-og",
        label: "首充活动OG"
      }
    ]
  };

  library.getAllRows = function () {
    return [library.siteDefault].concat(library.pageRows, library.customLinks);
  };

  library.getActivityRows = function () {
    return library.activityRows.slice();
  };

  library.findByKey = function (key) {
    var rows = library.getAllRows().concat(library.getActivityRows());
    var index;

    for (index = 0; index < rows.length; index += 1) {
      if (rows[index].key === key) {
        return rows[index];
      }
    }

    return null;
  };

  window.OG_SHARED_LIBRARY = library;
})();
