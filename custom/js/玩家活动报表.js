(function () {
  function buildMember(config) {
    var withdrawAccounts = config.withdrawAccounts || [
      ["USDT-TRC20", config.walletAccount, config.registerTime, config.lastLoginTime],
      ["银行卡", config.bankAccount, config.registerTime, config.lastLoginTime]
    ];

    var trades = config.trades || [
      ["TRX-" + config.playerId + "-01", config.rewardTime || config.lastLoginTime, "活动奖励发放", config.beforeBalance, "+" + (config.rewardAmount || "0.00"), config.balance, config.id],
      ["TRX-" + config.playerId + "-02", config.registerTime, "充值到账", config.registerBalance, config.todayRechargeAmount, config.beforeBalance, "DEP-" + config.playerId]
    ];

    var betSummary = config.betSummary || [
      ["电子", config.betCount, config.turnover, config.profitLoss, "58.0%", config.profitRate],
      ["体育投注", config.sportBetCount, config.sportTurnover, config.sportProfitLoss, "24.0%", config.sportProfitRate],
      ["真人", config.liveBetCount, config.liveTurnover, config.liveProfitLoss, "18.0%", config.liveProfitRate]
    ];

    var betDetails = config.betDetails || [
      [config.gameProvider, config.gameType, config.gameName, config.gameCode, config.betCount, config.turnover, config.profitLoss],
      [config.sportProvider, "体育投注", config.sportGameName, config.sportGameCode, config.sportBetCount, config.sportTurnover, config.sportProfitLoss],
      [config.liveProvider, "真人", config.liveGameName, config.liveGameCode, config.liveBetCount, config.liveTurnover, config.liveProfitLoss]
    ];

    var messages = config.messages || [
      ["1", "活动奖励提醒", "活动消息", config.name + " 奖励记录已生成，请及时查看。", "已读", config.rewardTime !== "-" ? config.rewardTime : config.lastLoginTime],
      ["2", "会员等级变动", "系统消息", "当前会员等级已更新为 " + config.vipLevel + "。", "已读", config.lastLoginTime],
      ["3", "风控提示", "系统消息", "账号近期登录环境正常，无异常关联。", "未读", config.registerTime]
    ];

    var relations = config.relations || [
      ["1", config.lastLoginTime, "设备", config.deviceRisk, config.relatedUsers, config.relatedName, "限制领取优惠"],
      ["2", config.registerTime, "IP", config.lastLoginIp, config.relatedIpUsers, config.relatedIpName, "限制提现"]
    ];

    return {
      accountName: config.accountName,
      memberId: config.playerId,
      agentName: config.agentName || "无",
      vipLevel: config.vipLevel,
      accountStatus: config.accountStatus || "启用",
      registerSource: config.registerSource || "H5注册",
      verifyType: config.verifyType || "手机号",
      registerTime: config.registerTime,
      registerIp: config.registerIp,
      registerDevice: config.registerDevice,
      lastLoginTime: config.lastLoginTime,
      lastLoginIp: config.lastLoginIp,
      balance: config.balance,
      availableBalance: config.availableBalance || config.balance,
      rechargeCount: config.rechargeCount,
      rechargeAmount: config.rechargeAmount,
      withdrawCount: config.withdrawCount,
      withdrawAmount: config.withdrawAmount,
      todayRechargeAmount: config.todayRechargeAmount,
      todayWithdrawAmount: config.todayWithdrawAmount,
      rechargeGap: config.rechargeGap,
      turnover: config.turnover,
      todayTurnover: config.todayTurnover,
      profitLoss: config.profitLoss,
      todayProfitLoss: config.todayProfitLoss,
      agentCommission: config.agentCommission || "0",
      rebateAmount: config.rebateAmount || "0",
      activityRewardAmount: config.activityRewardAmount,
      taskRewardAmount: config.taskRewardAmount || "0",
      loginPassword: "******",
      withdrawPassword: "******",
      birthday: config.birthday || "-",
      mobileArea: config.mobileArea || "+86",
      mobile: config.mobile || "-",
      email: config.email || "-",
      facebook: config.facebook || "-",
      google: config.google || "-",
      telegram: config.telegram || "-",
      whatsapp: config.whatsapp || "-",
      withdrawAccounts: withdrawAccounts,
      trades: trades,
      betSummary: betSummary,
      betDetails: betDetails,
      messages: messages,
      relations: relations
    };
  }

  var rows = [
    {
      id: "AC240601",
      name: "6月首充加赠",
      typeKey: "deposit",
      type: "首充活动",
      playerId: "P102438",
      currency: "USDT",
      rewardAmount: "188.00",
      rewardTarget: "piggy-bank",
      rewardTargetText: "存钱罐",
      rewardStatus: "claimed",
      rewardStatusText: "已领取",
      rewardTime: "2026-06-09 14:18:26",
      claimRecords: [
        { currency: "USDT", amount: "88.00", time: "2026-06-09 14:12:06" },
        { currency: "USDT", amount: "100.00", time: "2026-06-09 14:18:26" }
      ],
      member: buildMember({
        id: "AC240601",
        name: "6月首充加赠",
        playerId: "P102438",
        rewardAmount: "188.00",
        rewardTime: "2026-06-09 14:18:26",
        accountName: "Windr",
        vipLevel: "VIP4",
        registerTime: "2026-02-18 10:22:11",
        registerIp: "103.21.44.18",
        registerDevice: "Android",
        lastLoginTime: "2026-06-10 21:12:08",
        lastLoginIp: "103.21.44.20",
        balance: "3,246.18",
        beforeBalance: "3,058.18",
        registerBalance: "946.18",
        rechargeCount: "12",
        rechargeAmount: "28,640.00",
        withdrawCount: "6",
        withdrawAmount: "12,800.00",
        todayRechargeAmount: "2,000.00",
        todayWithdrawAmount: "0.00",
        rechargeGap: "15,840.00",
        turnover: "126,420.00",
        todayTurnover: "4,880.00",
        profitLoss: "-8,216.40",
        todayProfitLoss: "186.00",
        agentCommission: "0.00",
        rebateAmount: "420.00",
        activityRewardAmount: "1,386.00",
        taskRewardAmount: "66.00",
        birthday: "1996-08-12",
        mobileArea: "+86",
        mobile: "13800290021",
        email: "windr@demo.com",
        facebook: "windr.demo",
        google: "windr.demo@gmail.com",
        telegram: "@windr_bonus",
        whatsapp: "13800290021",
        walletAccount: "TX7gk...9PmA",
        bankAccount: "**** **** **** 6821",
        betCount: "186",
        sportBetCount: "58",
        liveBetCount: "34",
        sportTurnover: "32,860.00",
        liveTurnover: "23,420.00",
        sportProfitLoss: "-1,862.40",
        liveProfitLoss: "-640.00",
        profitRate: "-6.50%",
        sportProfitRate: "-5.67%",
        liveProfitRate: "-2.73%",
        gameProvider: "JILI-USDT",
        gameType: "电子",
        gameName: "Lucky Treasure",
        gameCode: "jili_lucky_treasure",
        sportProvider: "SBO-USDT",
        sportGameName: "SBO Sportsbook",
        sportGameCode: "sbo_sportsbook",
        liveProvider: "SEXY-USDT",
        liveGameName: "Baccarat A",
        liveGameCode: "sexy_baccarat_a",
        deviceRisk: "A4F0-2E7B-99",
        relatedUsers: "3",
        relatedName: "windr88",
        relatedIpUsers: "2",
        relatedIpName: "nova102"
      })
    },
    {
      id: "AC240601",
      name: "6月首充加赠",
      typeKey: "deposit",
      type: "首充活动",
      playerId: "P204511",
      currency: "USDT",
      rewardAmount: "128.00",
      rewardTarget: "piggy-bank",
      rewardTargetText: "存钱罐",
      rewardStatus: "claimed",
      rewardStatusText: "已领取",
      rewardTime: "2026-06-10 09:41:02",
      claimRecords: [
        { currency: "USDT", amount: "128.00", time: "2026-06-10 09:41:02" }
      ],
      member: buildMember({
        id: "AC240601",
        name: "6月首充加赠",
        playerId: "P204511",
        rewardAmount: "128.00",
        rewardTime: "2026-06-10 09:41:02",
        accountName: "Nova88",
        vipLevel: "VIP2",
        registerTime: "2026-03-05 08:10:24",
        registerIp: "182.52.141.78",
        registerDevice: "iPhone",
        lastLoginTime: "2026-06-10 18:06:31",
        lastLoginIp: "182.52.141.90",
        balance: "1,084.50",
        beforeBalance: "956.50",
        registerBalance: "84.50",
        rechargeCount: "8",
        rechargeAmount: "9,320.00",
        withdrawCount: "4",
        withdrawAmount: "4,480.00",
        todayRechargeAmount: "1,500.00",
        todayWithdrawAmount: "300.00",
        rechargeGap: "4,840.00",
        turnover: "58,800.00",
        todayTurnover: "2,420.00",
        profitLoss: "-2,108.60",
        todayProfitLoss: "86.00",
        agentCommission: "0.00",
        rebateAmount: "160.00",
        activityRewardAmount: "688.00",
        taskRewardAmount: "18.00",
        birthday: "1998-11-02",
        mobileArea: "+66",
        mobile: "0819920021",
        email: "nova88@demo.com",
        facebook: "nova88.demo",
        google: "nova88@gmail.com",
        telegram: "@nova88",
        whatsapp: "0819920021",
        walletAccount: "TQ2ms...12Ac",
        bankAccount: "**** **** **** 1182",
        betCount: "102",
        sportBetCount: "27",
        liveBetCount: "16",
        sportTurnover: "14,220.00",
        liveTurnover: "9,360.00",
        sportProfitLoss: "-620.40",
        liveProfitLoss: "-140.00",
        profitRate: "-3.58%",
        sportProfitRate: "-4.36%",
        liveProfitRate: "-1.50%",
        gameProvider: "PG-USDT",
        gameType: "电子",
        gameName: "Mahjong Ways",
        gameCode: "pg_mahjong_ways",
        sportProvider: "SBO-USDT",
        sportGameName: "SBO Sportsbook",
        sportGameCode: "sbo_sportsbook",
        liveProvider: "WM-USDT",
        liveGameName: "Roulette B",
        liveGameCode: "wm_roulette_b",
        deviceRisk: "TH-8A-2B-11",
        relatedUsers: "2",
        relatedName: "nova998",
        relatedIpUsers: "1",
        relatedIpName: "mint325"
      })
    },
    {
      id: "AC240588",
      name: "周末返水加码",
      typeKey: "rebate",
      type: "返水活动",
      playerId: "P774520",
      currency: "USD",
      rewardAmount: "88.00",
      rewardTarget: "piggy-bank",
      rewardTargetText: "存钱罐",
      rewardStatus: "pending",
      rewardStatusText: "待领取",
      rewardTime: "-",
      claimRecords: [
        { currency: "USD", amount: "88.00", rewardTarget: "piggy-bank", rewardTargetText: "存钱罐", time: "-" }
      ],
      member: buildMember({
        id: "AC240588",
        name: "周末返水加码",
        playerId: "P774520",
        rewardAmount: "88.00",
        accountName: "Sora",
        vipLevel: "VIP2",
        registerTime: "2026-01-22 19:03:08",
        registerIp: "43.229.80.17",
        registerDevice: "Windows",
        lastLoginTime: "2026-06-10 23:18:55",
        lastLoginIp: "43.229.80.19",
        balance: "2,128.44",
        beforeBalance: "2,040.44",
        registerBalance: "328.44",
        rechargeCount: "11",
        rechargeAmount: "18,540.00",
        withdrawCount: "5",
        withdrawAmount: "9,602.00",
        todayRechargeAmount: "0.00",
        todayWithdrawAmount: "0.00",
        rechargeGap: "8,938.00",
        turnover: "94,120.00",
        todayTurnover: "6,420.00",
        profitLoss: "-3,780.00",
        todayProfitLoss: "-216.00",
        agentCommission: "0.00",
        rebateAmount: "580.00",
        activityRewardAmount: "1,120.00",
        taskRewardAmount: "20.00",
        birthday: "1994-06-18",
        mobileArea: "+60",
        mobile: "01139920021",
        email: "sora@demo.com",
        facebook: "sora.bet",
        google: "sora.bet@gmail.com",
        telegram: "@sora_rebate",
        whatsapp: "01139920021",
        walletAccount: "0x81c0...9b3e",
        bankAccount: "Maybank •••• 8201",
        betCount: "143",
        sportBetCount: "39",
        liveBetCount: "22",
        sportTurnover: "20,620.00",
        liveTurnover: "12,600.00",
        sportProfitLoss: "-860.00",
        liveProfitLoss: "64.00",
        profitRate: "-4.02%",
        sportProfitRate: "-4.17%",
        liveProfitRate: "0.51%",
        gameProvider: "JDB-USD",
        gameType: "电子",
        gameName: "Dragon Fortune",
        gameCode: "jdb_dragon_fortune",
        sportProvider: "CMD-USD",
        sportGameName: "CMD Sports",
        sportGameCode: "cmd_sports",
        liveProvider: "EVO-USD",
        liveGameName: "Blackjack A",
        liveGameCode: "evo_blackjack_a",
        deviceRisk: "MY-6D-9K-20",
        relatedUsers: "4",
        relatedName: "sora900",
        relatedIpUsers: "2",
        relatedIpName: "iris681"
      })
    },
    {
      id: "AC240588",
      name: "周末返水加码",
      typeKey: "rebate",
      type: "返水活动",
      playerId: "P884203",
      currency: "USDT",
      rewardAmount: "288.00",
      rewardTarget: "mixed",
      rewardTargetText: "混合",
      rewardStatus: "claimed",
      rewardStatusText: "已领取",
      rewardTime: "2026-06-10 10:18:27",
      claimRecords: [
        { currency: "USDT", amount: "88.00", rewardTarget: "balance", rewardTargetText: "余额", time: "2026-06-10 10:06:10" },
        { currency: "USDT", amount: "200.00", rewardTarget: "piggy-bank", rewardTargetText: "存钱罐", time: "2026-06-10 10:18:27" }
      ],
      member: buildMember({
        id: "AC240588",
        name: "周末返水加码",
        playerId: "P884203",
        rewardAmount: "288.00",
        rewardTime: "2026-06-10 10:18:27",
        accountName: "Piper",
        vipLevel: "VIP6",
        registerTime: "2025-12-14 11:42:56",
        registerIp: "120.79.18.25",
        registerDevice: "MacOS",
        lastLoginTime: "2026-06-10 20:39:14",
        lastLoginIp: "120.79.18.29",
        balance: "9,822.66",
        beforeBalance: "9,534.66",
        registerBalance: "1,122.66",
        rechargeCount: "26",
        rechargeAmount: "82,540.00",
        withdrawCount: "11",
        withdrawAmount: "51,706.00",
        todayRechargeAmount: "3,600.00",
        todayWithdrawAmount: "2,000.00",
        rechargeGap: "30,834.00",
        turnover: "268,400.00",
        todayTurnover: "18,880.00",
        profitLoss: "12,608.00",
        todayProfitLoss: "1,286.00",
        agentCommission: "326.00",
        rebateAmount: "2,680.00",
        activityRewardAmount: "8,206.00",
        taskRewardAmount: "120.00",
        birthday: "1991-03-15",
        mobileArea: "+86",
        mobile: "13699450012",
        email: "piper@demo.com",
        facebook: "piper.vip",
        google: "piper.vip@gmail.com",
        telegram: "@piper_vip",
        whatsapp: "13699450012",
        walletAccount: "TUt8j...4Kza",
        bankAccount: "招商银行 •••• 2248",
        betCount: "388",
        sportBetCount: "102",
        liveBetCount: "66",
        sportTurnover: "62,280.00",
        liveTurnover: "40,560.00",
        sportProfitLoss: "4,260.00",
        liveProfitLoss: "1,020.00",
        profitRate: "4.70%",
        sportProfitRate: "6.84%",
        liveProfitRate: "2.51%",
        gameProvider: "PG-USDT",
        gameType: "电子",
        gameName: "Wild Bandito",
        gameCode: "pg_wild_bandito",
        sportProvider: "IM-USDT",
        sportGameName: "IM Sports",
        sportGameCode: "im_sports",
        liveProvider: "AG-USDT",
        liveGameName: "Baccarat VIP",
        liveGameCode: "ag_baccarat_vip",
        deviceRisk: "CN-VIP-10",
        relatedUsers: "1",
        relatedName: "piper661",
        relatedIpUsers: "2",
        relatedIpName: "cole732"
      })
    },
    {
      id: "AC240522",
      name: "老用户救援金",
      typeKey: "rescue",
      type: "救援金活动",
      playerId: "P661204",
      currency: "USD",
      rewardAmount: "0.00",
      rewardTarget: "balance",
      rewardTargetText: "余额",
      rewardStatus: "invalid",
      rewardStatusText: "未达标",
      rewardTime: "-",
      claimRecords: [],
      member: buildMember({
        id: "AC240522",
        name: "老用户救援金",
        playerId: "P661204",
        rewardAmount: "0.00",
        accountName: "Kite",
        vipLevel: "VIP3",
        registerTime: "2025-11-03 15:08:19",
        registerIp: "210.167.10.63",
        registerDevice: "Android",
        lastLoginTime: "2026-06-09 18:32:46",
        lastLoginIp: "210.167.10.71",
        balance: "406.74",
        beforeBalance: "406.74",
        registerBalance: "96.74",
        rechargeCount: "9",
        rechargeAmount: "14,620.00",
        withdrawCount: "7",
        withdrawAmount: "13,220.00",
        todayRechargeAmount: "0.00",
        todayWithdrawAmount: "0.00",
        rechargeGap: "1,400.00",
        turnover: "48,220.00",
        todayTurnover: "1,820.00",
        profitLoss: "-5,380.00",
        todayProfitLoss: "-208.00",
        agentCommission: "0.00",
        rebateAmount: "220.00",
        activityRewardAmount: "0.00",
        taskRewardAmount: "8.00",
        birthday: "1989-01-27",
        mobileArea: "+81",
        mobile: "08019920021",
        email: "kite@demo.com",
        facebook: "kite.demo",
        google: "kite.demo@gmail.com",
        telegram: "@kite_rescue",
        whatsapp: "08019920021",
        walletAccount: "JP-USD-0012",
        bankAccount: "Mizuho •••• 1992",
        betCount: "86",
        sportBetCount: "18",
        liveBetCount: "12",
        sportTurnover: "9,220.00",
        liveTurnover: "5,860.00",
        sportProfitLoss: "-1,206.00",
        liveProfitLoss: "-780.00",
        profitRate: "-11.16%",
        sportProfitRate: "-13.08%",
        liveProfitRate: "-13.31%",
        gameProvider: "CQ9-USD",
        gameType: "电子",
        gameName: "Thor Hammer",
        gameCode: "cq9_thor_hammer",
        sportProvider: "SBO-USD",
        sportGameName: "SBO Sportsbook",
        sportGameCode: "sbo_sportsbook",
        liveProvider: "SA-USD",
        liveGameName: "Dragon Tiger",
        liveGameCode: "sa_dragon_tiger",
        deviceRisk: "JP-3F-5C-01",
        relatedUsers: "2",
        relatedName: "kite112",
        relatedIpUsers: "1",
        relatedIpName: "mori81"
      })
    },
    {
      id: "AC240522",
      name: "老用户救援金",
      typeKey: "rescue",
      type: "救援金活动",
      playerId: "P991530",
      currency: "USDT",
      rewardAmount: "300.00",
      rewardTarget: "balance",
      rewardTargetText: "余额",
      rewardStatus: "claimed",
      rewardStatusText: "已领取",
      rewardTime: "2026-06-08 18:26:10",
      claimRecords: [
        { currency: "USDT", amount: "300.00", time: "2026-06-08 18:26:10" }
      ],
      member: buildMember({
        id: "AC240522",
        name: "老用户救援金",
        playerId: "P991530",
        rewardAmount: "300.00",
        rewardTime: "2026-06-08 18:26:10",
        accountName: "Cole",
        vipLevel: "VIP3",
        registerTime: "2025-10-10 09:14:37",
        registerIp: "121.33.4.77",
        registerDevice: "Windows",
        lastLoginTime: "2026-06-10 17:02:44",
        lastLoginIp: "121.33.4.79",
        balance: "2,090.28",
        beforeBalance: "1,790.28",
        registerBalance: "290.28",
        rechargeCount: "14",
        rechargeAmount: "22,180.00",
        withdrawCount: "8",
        withdrawAmount: "16,740.00",
        todayRechargeAmount: "0.00",
        todayWithdrawAmount: "500.00",
        rechargeGap: "5,440.00",
        turnover: "72,860.00",
        todayTurnover: "2,860.00",
        profitLoss: "-4,208.00",
        todayProfitLoss: "-106.00",
        agentCommission: "0.00",
        rebateAmount: "360.00",
        activityRewardAmount: "1,620.00",
        taskRewardAmount: "36.00",
        birthday: "1993-07-08",
        mobileArea: "+86",
        mobile: "13788550018",
        email: "cole@demo.com",
        facebook: "cole.demo",
        google: "cole.demo@gmail.com",
        telegram: "@cole_rescue",
        whatsapp: "13788550018",
        walletAccount: "TT82k...7Fas",
        bankAccount: "建设银行 •••• 8830",
        betCount: "132",
        sportBetCount: "30",
        liveBetCount: "19",
        sportTurnover: "16,200.00",
        liveTurnover: "9,720.00",
        sportProfitLoss: "-820.00",
        liveProfitLoss: "-186.00",
        profitRate: "-5.78%",
        sportProfitRate: "-5.06%",
        liveProfitRate: "-1.91%",
        gameProvider: "JILI-USDT",
        gameType: "电子",
        gameName: "Fortune Gems",
        gameCode: "jili_fortune_gems",
        sportProvider: "IM-USDT",
        sportGameName: "IM Sports",
        sportGameCode: "im_sports",
        liveProvider: "WM-USDT",
        liveGameName: "Blackjack VIP",
        liveGameCode: "wm_blackjack_vip",
        deviceRisk: "CN-33-AE-1C",
        relatedUsers: "2",
        relatedName: "cole882",
        relatedIpUsers: "2",
        relatedIpName: "piper661"
      })
    },
    {
      id: "AC240610",
      name: "世界杯竞猜赛",
      typeKey: "tournament",
      type: "竞赛活动",
      playerId: "P902188",
      currency: "USDT",
      rewardAmount: "1288.00",
      rewardTarget: "piggy-bank",
      rewardTargetText: "存钱罐",
      rewardStatus: "pending",
      rewardStatusText: "待领取",
      rewardTime: "-",
      claimRecords: [
        { currency: "USDT", amount: "1288.00", time: "-" }
      ],
      member: buildMember({
        id: "AC240610",
        name: "世界杯竞猜赛",
        playerId: "P902188",
        rewardAmount: "1288.00",
        accountName: "Moss",
        vipLevel: "VIP5",
        registerTime: "2026-04-18 12:04:22",
        registerIp: "49.228.32.41",
        registerDevice: "Android",
        lastLoginTime: "2026-06-10 22:14:05",
        lastLoginIp: "49.228.32.55",
        balance: "8,206.11",
        beforeBalance: "6,918.11",
        registerBalance: "506.11",
        rechargeCount: "17",
        rechargeAmount: "35,620.00",
        withdrawCount: "5",
        withdrawAmount: "12,540.00",
        todayRechargeAmount: "3,000.00",
        todayWithdrawAmount: "0.00",
        rechargeGap: "23,080.00",
        turnover: "156,820.00",
        todayTurnover: "12,880.00",
        profitLoss: "6,260.00",
        todayProfitLoss: "880.00",
        agentCommission: "210.00",
        rebateAmount: "980.00",
        activityRewardAmount: "3,660.00",
        taskRewardAmount: "60.00",
        birthday: "1997-02-19",
        mobileArea: "+66",
        mobile: "0837700218",
        email: "moss@demo.com",
        facebook: "moss.bet",
        google: "moss.bet@gmail.com",
        telegram: "@moss_worldcup",
        whatsapp: "0837700218",
        walletAccount: "TTA8k...1Ypa",
        bankAccount: "Kasikorn •••• 6610",
        betCount: "244",
        sportBetCount: "136",
        liveBetCount: "24",
        sportTurnover: "88,620.00",
        liveTurnover: "11,860.00",
        sportProfitLoss: "5,620.00",
        liveProfitLoss: "240.00",
        profitRate: "3.99%",
        sportProfitRate: "6.34%",
        liveProfitRate: "2.02%",
        gameProvider: "SPRIBE-USDT",
        gameType: "电子",
        gameName: "Goal",
        gameCode: "spribe_goal",
        sportProvider: "SBO-USDT",
        sportGameName: "SBO Sportsbook",
        sportGameCode: "sbo_sportsbook",
        liveProvider: "SEXY-USDT",
        liveGameName: "Baccarat C",
        liveGameCode: "sexy_baccarat_c",
        deviceRisk: "TH-CUP-29",
        relatedUsers: "3",
        relatedName: "moss218",
        relatedIpUsers: "2",
        relatedIpName: "iris681"
      })
    },
    {
      id: "AC240610",
      name: "世界杯竞猜赛",
      typeKey: "tournament",
      type: "竞赛活动",
      playerId: "P772610",
      currency: "USD",
      rewardAmount: "888.00",
      rewardTarget: "piggy-bank",
      rewardTargetText: "存钱罐",
      rewardStatus: "pending",
      rewardStatusText: "待领取",
      rewardTime: "-",
      claimRecords: [
        { currency: "USD", amount: "888.00", time: "-" }
      ],
      member: buildMember({
        id: "AC240610",
        name: "世界杯竞猜赛",
        playerId: "P772610",
        rewardAmount: "888.00",
        accountName: "Iris",
        vipLevel: "VIP3",
        registerTime: "2026-05-01 16:19:08",
        registerIp: "175.144.10.22",
        registerDevice: "iPhone",
        lastLoginTime: "2026-06-10 19:58:17",
        lastLoginIp: "175.144.10.28",
        balance: "4,284.00",
        beforeBalance: "3,396.00",
        registerBalance: "196.00",
        rechargeCount: "10",
        rechargeAmount: "17,330.00",
        withdrawCount: "4",
        withdrawAmount: "6,920.00",
        todayRechargeAmount: "1,000.00",
        todayWithdrawAmount: "0.00",
        rechargeGap: "10,410.00",
        turnover: "84,660.00",
        todayTurnover: "6,860.00",
        profitLoss: "2,380.00",
        todayProfitLoss: "420.00",
        agentCommission: "90.00",
        rebateAmount: "560.00",
        activityRewardAmount: "2,240.00",
        taskRewardAmount: "28.00",
        birthday: "1999-09-06",
        mobileArea: "+60",
        mobile: "0129002761",
        email: "iris@demo.com",
        facebook: "iris.bet",
        google: "iris.bet@gmail.com",
        telegram: "@iris_cup",
        whatsapp: "0129002761",
        walletAccount: "MY-USD-2291",
        bankAccount: "CIMB •••• 0076",
        betCount: "168",
        sportBetCount: "90",
        liveBetCount: "18",
        sportTurnover: "52,360.00",
        liveTurnover: "8,660.00",
        sportProfitLoss: "1,820.00",
        liveProfitLoss: "160.00",
        profitRate: "2.81%",
        sportProfitRate: "3.48%",
        liveProfitRate: "1.84%",
        gameProvider: "SPRIBE-USD",
        gameType: "电子",
        gameName: "Aviator",
        gameCode: "spribe_aviator",
        sportProvider: "CMD-USD",
        sportGameName: "CMD Sports",
        sportGameCode: "cmd_sports",
        liveProvider: "EVO-USD",
        liveGameName: "Roulette C",
        liveGameCode: "evo_roulette_c",
        deviceRisk: "MY-CUP-17",
        relatedUsers: "2",
        relatedName: "iris330",
        relatedIpUsers: "1",
        relatedIpName: "sora900"
      })
    }
  ];

  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
      return;
    }
    callback();
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function buildStatus(status, text) {
    return '<span class="status-tag ' + status + '">' + escapeHtml(text) + "</span>";
  }

  function buildRewardTarget(target, text) {
    var targetClass = target === "balance" || target === "mixed" ? target : "piggy-bank";
    return '<span class="reward-target-badge ' + targetClass + '">' + escapeHtml(text) + "</span>";
  }

  function amountClass(value) {
    if (String(value).indexOf("-") === 0) {
      return "red";
    }
    if (value === "0" || value === "0.00" || value === "-") {
      return "";
    }
    return "green";
  }

  function relationMark(type) {
    return type === "IP" ? '<mark class="ip">IP</mark>' : "<mark>" + escapeHtml(type) + "</mark>";
  }

  ready(function () {
    var tableBody = document.getElementById("reportTableBody");
    var tableTitle = document.getElementById("tableTitle");
    var tableSubline = document.getElementById("tableSubline");
    var pageTotalText = document.getElementById("pageTotalText");
    var searchButton = document.getElementById("searchButton");
    var resetButton = document.getElementById("resetButton");
    var exportButton = document.getElementById("exportButton");
    var refreshPageButton = document.getElementById("refreshPageButton");
    var backButton = document.querySelector(".page-titlebar .title-icon");
    var filterBar = document.getElementById("reportFilterBar");
    var playerIdFilter = document.getElementById("playerIdFilter");
    var activityTypeFilter = document.getElementById("activityTypeFilter");
    var activityIdFilter = document.getElementById("activityIdFilter");
    var activityNameFilter = document.getElementById("activityNameFilter");
    var rewardStatusFilter = document.getElementById("rewardStatusFilter");

    var memberDetailModal = document.getElementById("memberDetailModal");
    var memberDetailTitle = document.getElementById("memberDetailTitle");
    var memberDetailTabs = memberDetailModal.querySelectorAll("[data-tab]");

    var claimDetailModal = document.getElementById("claimDetailModal");
    var claimDetailTitle = document.getElementById("claimDetailModalTitle");
    var claimDetailSubline = document.getElementById("claimDetailSubline");
    var claimDetailBody = document.getElementById("claimDetailBody");
    var claimDetailTotal = document.getElementById("claimDetailTotal");
    var claimDetailModalClose = document.getElementById("claimDetailModalClose");
    var claimDetailModalCancel = document.getElementById("claimDetailModalCancel");
    var claimDetailModalConfirm = document.getElementById("claimDetailModalConfirm");

    var defaultQueryFilters = {
      activityId: "",
      activityName: ""
    };

    function rowKey(item) {
      return item.id + "|" + item.playerId;
    }

    function setText(id, value) {
      var element = document.getElementById(id);
      if (element) {
        element.textContent = value || "-";
      }
    }

    function setInputValue(id, value) {
      var element = document.getElementById(id);
      if (element) {
        element.value = value || "";
      }
    }

    function setSingleOption(selectId, value) {
      var select = document.getElementById(selectId);
      if (select && select.options.length) {
        select.options[0].textContent = value || "-";
        select.options[0].value = value || "-";
      }
    }

    function renderTable(data) {
      tableBody.innerHTML = data
        .map(function (item) {
          var key = escapeHtml(rowKey(item));
          return [
            "<tr>",
            "<td>" + escapeHtml(item.id) + "</td>",
            "<td>" + escapeHtml(item.name) + "</td>",
            '<td><button class="link-btn player-link" type="button" data-action="user" data-row-id="' + key + '">' + escapeHtml(item.playerId) + "</button></td>",
            "<td>" + escapeHtml(item.type) + "</td>",
            "<td>" + escapeHtml(item.currency) + "</td>",
            '<td class="num positive">' + escapeHtml(item.rewardAmount) + "</td>",
            "<td>" + buildRewardTarget(item.rewardTarget, item.rewardTargetText) + "</td>",
            "<td>" + buildStatus(item.rewardStatus, item.rewardStatusText) + "</td>",
            "<td>" + escapeHtml(item.rewardTime) + "</td>",
            '<td><div class="action-links"><button class="link-btn" type="button" data-action="user" data-row-id="' + key + '">用户详情</button><button class="link-btn" type="button" data-action="claim" data-row-id="' + key + '">领取详情</button></div></td>',
            "</tr>"
          ].join("");
        })
        .join("");

      pageTotalText.textContent = "共 " + data.length + " 条记录";
    }

    function renderSimpleTable(containerId, rowsData, buildRow, colspan, emptyText) {
      var container = document.getElementById(containerId);
      if (!container) return;

      if (!rowsData.length) {
        container.innerHTML = '<tr><td colspan="' + colspan + '" class="empty-cell">' + escapeHtml(emptyText) + "</td></tr>";
        return;
      }

      container.innerHTML = rowsData.map(buildRow).join("");
    }

    function activateMemberTab(name) {
      Array.prototype.forEach.call(memberDetailTabs, function (button) {
        button.classList.toggle("active", button.getAttribute("data-tab") === name);
      });
      Array.prototype.forEach.call(memberDetailModal.querySelectorAll(".tab-panel"), function (panel) {
        panel.classList.toggle("active", panel.getAttribute("data-panel") === name);
      });
    }

    function bindMemberDetail(item) {
      var member = item.member;
      memberDetailTitle.textContent = "会员详情";

      setText("memberAccountName", member.accountName);
      setText("memberIdValue", member.memberId);
      setText("memberAgentName", member.agentName);
      setText("memberStatusText", member.accountStatus);
      setText("memberRegisterSource", member.registerSource);
      setText("memberVerifyType", member.verifyType);
      setText("memberRegisterTime", member.registerTime);
      setText("memberRegisterIp", member.registerIp);
      setText("memberRegisterDevice", member.registerDevice);
      setText("memberLastLoginTime", member.lastLoginTime);
      setText("memberLastLoginIp", member.lastLoginIp);
      setText("memberBalance", member.balance);
      setText("memberAvailableBalance", member.availableBalance);
      setText("memberRechargeCount", member.rechargeCount);
      setText("memberRechargeAmount", member.rechargeAmount);
      setText("memberWithdrawCount", member.withdrawCount);
      setText("memberWithdrawAmount", member.withdrawAmount);
      setText("memberTodayRechargeAmount", member.todayRechargeAmount);
      setText("memberTodayWithdrawAmount", member.todayWithdrawAmount);
      setText("memberRechargeGap", member.rechargeGap);
      setText("memberTurnover", member.turnover);
      setText("memberTodayTurnover", member.todayTurnover);
      setText("memberProfitLoss", member.profitLoss);
      setText("memberTodayProfitLoss", member.todayProfitLoss);
      setText("memberAgentCommission", member.agentCommission);
      setText("memberRebateAmount", member.rebateAmount);
      setText("memberActivityRewardAmount", member.activityRewardAmount);
      setText("memberTaskRewardAmount", member.taskRewardAmount);

      setInputValue("memberLoginPassword", member.loginPassword);
      setInputValue("memberWithdrawPassword", member.withdrawPassword);
      setInputValue("memberBirthday", member.birthday);
      setInputValue("memberMobile", member.mobile);
      setInputValue("memberEmail", member.email);
      setInputValue("memberFacebook", member.facebook);
      setInputValue("memberGoogle", member.google);
      setInputValue("memberTelegram", member.telegram);
      setInputValue("memberWhatsapp", member.whatsapp);
      setSingleOption("memberMobileArea", member.mobileArea);
      setText("memberVipLevel", member.vipLevel);

      renderSimpleTable(
        "memberWithdrawBody",
        member.withdrawAccounts,
        function (entry) {
          return "<tr><td>" + escapeHtml(entry[0]) + "</td><td>" + escapeHtml(entry[1]) + "</td><td>" + escapeHtml(entry[2]) + "</td><td>" + escapeHtml(entry[3]) + "</td></tr>";
        },
        4,
        "暂无提现账户"
      );
      setText("memberWithdrawTotal", "共 " + member.withdrawAccounts.length + " 条记录");

      renderSimpleTable(
        "memberTradeBody",
        member.trades,
        function (entry) {
          return [
            "<tr>",
            "<td>" + escapeHtml(entry[0]) + "</td>",
            "<td>" + escapeHtml(entry[1]) + "</td>",
            "<td>" + escapeHtml(entry[2]) + "</td>",
            "<td>" + escapeHtml(entry[3]) + "</td>",
            '<td class="' + amountClass(entry[4]) + '">' + escapeHtml(entry[4]) + "</td>",
            "<td>" + escapeHtml(entry[5]) + "</td>",
            "<td>" + escapeHtml(entry[6]) + "</td>",
            "</tr>"
          ].join("");
        },
        7,
        "暂无交易记录"
      );
      setText("memberTradeTotal", "共 " + member.trades.length + " 条记录");

      renderSimpleTable(
        "memberBetSummaryBody",
        member.betSummary,
        function (entry) {
          return [
            "<tr>",
            "<td>" + escapeHtml(entry[0]) + "</td>",
            "<td>" + escapeHtml(entry[1]) + "</td>",
            "<td>" + escapeHtml(entry[2]) + "</td>",
            '<td class="' + amountClass(entry[3]) + '">' + escapeHtml(entry[3]) + "</td>",
            "<td>" + escapeHtml(entry[4]) + "</td>",
            '<td class="' + amountClass(entry[5]) + '">' + escapeHtml(entry[5]) + "</td>",
            "</tr>"
          ].join("");
        },
        6,
        "暂无投注统计"
      );

      renderSimpleTable(
        "memberBetDetailBody",
        member.betDetails,
        function (entry) {
          return [
            "<tr>",
            "<td>" + escapeHtml(entry[0]) + "</td>",
            "<td>" + escapeHtml(entry[1]) + "</td>",
            "<td>" + escapeHtml(entry[2]) + "</td>",
            "<td>" + escapeHtml(entry[3]) + "</td>",
            "<td>" + escapeHtml(entry[4]) + "</td>",
            "<td>" + escapeHtml(entry[5]) + "</td>",
            '<td class="' + amountClass(entry[6]) + '">' + escapeHtml(entry[6]) + "</td>",
            "</tr>"
          ].join("");
        },
        7,
        "暂无投注明细"
      );
      setText("memberBetTotal", "共 " + member.betDetails.length + " 条记录");

      renderSimpleTable(
        "memberMessageBody",
        member.messages,
        function (entry) {
          return [
            "<tr>",
            "<td>" + escapeHtml(entry[0]) + "</td>",
            "<td>" + escapeHtml(entry[1]) + "</td>",
            "<td>" + escapeHtml(entry[2]) + "</td>",
            "<td>" + escapeHtml(entry[3]) + "</td>",
            '<td class="' + (entry[4] === "已读" ? "green" : "red") + '">' + escapeHtml(entry[4]) + "</td>",
            "<td>" + escapeHtml(entry[5]) + "</td>",
            "</tr>"
          ].join("");
        },
        6,
        "暂无会员消息"
      );
      setText("memberMessageTotal", "共 " + member.messages.length + " 条记录");

      renderSimpleTable(
        "memberRelationBody",
        member.relations,
        function (entry) {
          return [
            "<tr>",
            "<td>" + escapeHtml(entry[0]) + "</td>",
            "<td>" + escapeHtml(entry[1]) + "</td>",
            "<td>" + relationMark(entry[2]) + "</td>",
            "<td>" + escapeHtml(entry[3]) + "</td>",
            "<td>" + escapeHtml(entry[4]) + "</td>",
            "<td>" + escapeHtml(entry[5]) + "</td>",
            "<td><mark>" + escapeHtml(entry[6]) + "</mark></td>",
            "</tr>"
          ].join("");
        },
        7,
        "暂无关联账号"
      );
      setText("memberRelationTotal", "共 " + member.relations.length + " 条记录");
    }

    function closeMemberDetail() {
      memberDetailModal.hidden = true;
      activateMemberTab("profile");
    }

    function closeClaimDetail() {
      claimDetailModal.hidden = true;
    }

    function openMemberDetail(item) {
      bindMemberDetail(item);
      activateMemberTab("profile");
      memberDetailModal.hidden = false;
    }

    function openClaimDetail(item) {
      claimDetailTitle.textContent = "领奖详情";
      claimDetailSubline.textContent = item.name + " - " + item.playerId + " - 领奖详情";

      if (!item.claimRecords.length) {
        claimDetailBody.innerHTML = '<tr><td colspan="4" class="empty-cell">当前玩家在该活动下暂无领取记录</td></tr>';
      } else {
        claimDetailBody.innerHTML = item.claimRecords
          .map(function (record) {
            return [
              "<tr>",
              "<td>" + escapeHtml(record.currency) + "</td>",
              '<td class="num positive">' + escapeHtml(record.amount) + "</td>",
              "<td>" + buildRewardTarget(record.rewardTarget || item.rewardTarget, record.rewardTargetText || item.rewardTargetText) + "</td>",
              "<td>" + escapeHtml(record.time) + "</td>",
              "</tr>"
            ].join("");
          })
          .join("");
      }

      claimDetailTotal.textContent = "共 " + item.claimRecords.length + " 条记录";
      claimDetailModal.hidden = false;
    }

    function applyFilters() {
      var playerId = playerIdFilter.value.trim().toLowerCase();
      var type = activityTypeFilter.value;
      var activityId = activityIdFilter.value.trim().toLowerCase();
      var activityName = activityNameFilter.value.trim().toLowerCase();
      var rewardStatus = rewardStatusFilter.value;

      var data = rows.filter(function (item) {
        var playerOk = !playerId || item.playerId.toLowerCase().indexOf(playerId) > -1;
        var typeOk = type === "all" || item.typeKey === type;
        var idOk = !activityId || item.id.toLowerCase().indexOf(activityId) > -1;
        var nameOk = !activityName || item.name.toLowerCase().indexOf(activityName) > -1;
        var rewardOk = rewardStatus === "all" || item.rewardStatus === rewardStatus;
        return playerOk && typeOk && idOk && nameOk && rewardOk;
      });

      renderTable(data);
      updateHeader(data);
    }

    function updateHeader(data) {
      var selectedActivityId = activityIdFilter.value.trim();
      var selectedActivityName = activityNameFilter.value.trim();

      if (selectedActivityId || selectedActivityName) {
        tableTitle.textContent = "参与玩家列表";
        tableSubline.textContent =
          "当前活动：" +
          (selectedActivityId || "-") +
          (selectedActivityName ? " / " + selectedActivityName : "") +
          "，共筛出 " +
          data.length +
          " 条参与玩家记录。";
        return;
      }

      tableTitle.textContent = "玩家活动列表";
      tableSubline.textContent = "当前展示筛选范围内参与活动的玩家记录。";
    }

    function quickFeedback(button, doneText, originalText) {
      if (!button) return;
      button.textContent = doneText;
      window.setTimeout(function () {
        button.textContent = originalText;
      }, 1000);
    }

    function fillFromQuery() {
      var params = new URLSearchParams(window.location.search);
      defaultQueryFilters.activityId = params.get("activityId") || "";
      defaultQueryFilters.activityName = params.get("activityName") || "";

      activityIdFilter.value = defaultQueryFilters.activityId;
      activityNameFilter.value = defaultQueryFilters.activityName;
    }

    tableBody.addEventListener("click", function (event) {
      var button = event.target.closest("[data-row-id]");
      if (!button) return;

      var target = rows.find(function (item) {
        return rowKey(item) === button.getAttribute("data-row-id");
      });
      if (!target) return;

      if (button.getAttribute("data-action") === "claim") {
        openClaimDetail(target);
        return;
      }

      openMemberDetail(target);
    });

    Array.prototype.forEach.call(memberDetailModal.querySelectorAll("[data-close-member-detail='true']"), function (button) {
      button.addEventListener("click", closeMemberDetail);
    });

    memberDetailModal.addEventListener("click", function (event) {
      if (event.target === memberDetailModal) {
        closeMemberDetail();
        return;
      }

      var tabButton = event.target.closest("[data-tab]");
      if (tabButton) {
        activateMemberTab(tabButton.getAttribute("data-tab"));
      }
    });

    [claimDetailModalClose, claimDetailModalCancel, claimDetailModalConfirm].forEach(function (button) {
      button.addEventListener("click", closeClaimDetail);
    });

    claimDetailModal.addEventListener("click", function (event) {
      if (event.target && event.target.getAttribute("data-close-claim-detail") === "true") {
        closeClaimDetail();
      }
    });

    searchButton.addEventListener("click", function () {
      applyFilters();
      quickFeedback(searchButton, "查询完成", "查询");
    });

    resetButton.addEventListener("click", function () {
      window.setTimeout(function () {
        Array.prototype.forEach.call(filterBar.querySelectorAll("input[type='text']"), function (input) {
          input.value = "";
        });
        Array.prototype.forEach.call(filterBar.querySelectorAll("select"), function (select) {
          select.selectedIndex = 0;
        });
        activityIdFilter.value = defaultQueryFilters.activityId;
        activityNameFilter.value = defaultQueryFilters.activityName;
        applyFilters();
      }, 0);
    });

    exportButton.addEventListener("click", function () {
      quickFeedback(exportButton, "导出完成", "导出数据");
    });

    refreshPageButton.addEventListener("click", function () {
      quickFeedback(refreshPageButton, "已刷新", "↻");
    });

    if (backButton) {
      backButton.addEventListener("click", function () {
        if (window.history.length > 1) {
          window.history.back();
          return;
        }
        window.location.href = "活动统计报表.html";
      });
    }

    fillFromQuery();
    applyFilters();
  });
})();
