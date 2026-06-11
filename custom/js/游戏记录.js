(function () {
  var datasets = {
    "所有类型": {
      title: "全类型注单明细",
      notice: "当前展示全类型数据，默认按结算时间倒序，可用于快速查看整体投注与输赢分布。",
      subline: "共 60,625 条记录，已结算 59,727 条，异常与待开奖 522 条",
      totalText: "共 60625 条记录",
      summary: [
        { label: "注单总数", value: "60,625" },
        { label: "投注额", value: "11,736,990.00" },
        { label: "有效投注", value: "11,171,390.00" },
        { label: "派彩", value: "11,265,979.50" },
        { label: "玩家输赢", value: "94,589.50", tone: "positive" },
        { label: "已结算", value: "59,727" },
        { label: "异常/待开奖", value: "522" },
        { label: "平均投注额", value: "184.26" }
      ],
      rows: [
        ["Windr", "P12313", "DG202606100001", "DG", "视讯", "百家乐", "USDT", "3,000.00", "3,000.00", "-1,250.00", "1,750.00", "庄 2,000 / 闲 1,000", "庄赢", "VIP-08", "R20260610-88123", "2026-06-10 10:18:23", "2026-06-10 10:19:02"],
        ["Mina", "P82011", "PG202606100716", "PG", "电子", "Mahjong Ways 2", "USDT", "480.00", "480.00", "2,640.00", "3,120.00", "40 x 12.00", "免费旋转命中", "PG-01", "MW2-44911", "2026-06-10 09:18:25", "2026-06-10 09:18:28", [
          ["结果类型", "免费旋转"],
          ["命中轮次", "第 4 轮"],
          ["触发方式", "Scatter x3"],
          ["累计倍率", "220x"],
          ["最终派彩", "3,120.00", "positive"]
        ]],
        ["Owen", "P71822", "SBO202606100221", "SBO", "体育", "欧冠", "USDT", "1,500.00", "1,500.00", "-1,500.00", "0.00", "曼城 -1.5", "未命中", "SP-12", "SB-12871", "2026-06-10 08:22:18", "2026-06-10 10:02:14"],
        ["Cole", "P60821", "LOT202606100091", "TCG", "彩票", "腾讯分分彩", "USDT", "260.00", "260.00", "0.00", "260.00", "后二直选", "待开奖", "LT-03", "20260610-431", "2026-06-10 09:01:05", "待开奖"],
        ["Aden", "P90322", "KM202606100144", "Kingmaker", "棋牌", "德州扑克", "USDT", "1,800.00", "1,800.00", "-980.00", "820.00", "翻牌圈跟注", "顺子败给同花", "PK-14", "KM-23091", "2026-06-10 08:55:39", "2026-06-10 09:01:22"],
        ["Ari", "P62341", "JILI202606100088", "JILI", "捕鱼", "Jackpot Fishing", "USDT", "2,600.00", "2,600.00", "1,880.00", "4,480.00", "炮值 80", "Boss 命中", "FS-02", "JF-66192", "2026-06-10 08:41:26", "2026-06-10 08:41:59"],
        ["Rex", "P77421", "BC202606100602", "BC.Game", "区块链", "Crash", "USDT", "300.00", "300.00", "726.00", "1,026.00", "止盈 3.42x", "CRASH 3.42x 爆", "BC-08", "CR-88102", "2026-06-10 11:16:22", "2026-06-10 11:16:31", [
          ["结果类型", "CRASH"],
          ["爆点倍率", "3.42x", "positive"],
          ["玩家止盈", "3.42x"],
          ["下注哈希", "0x8b39...7f2c"],
          ["派彩结果", "1,026.00", "positive"]
        ]]
      ]
    },
    "视讯": {
      title: "视讯注单明细",
      notice: "默认按结算时间倒序展示，可用于日常核账与输赢复盘。",
      subline: "共 12,486 条记录，已结算 12,013 条，异常注单 27 条",
      totalText: "共 12486 条记录",
      summary: [
        { label: "注单总数", value: "12,486" },
        { label: "投注额", value: "1,352,910.00" },
        { label: "有效投注", value: "1,268,430.00" },
        { label: "派彩", value: "1,182,809.50" },
        { label: "玩家输赢", value: "-85,620.50", tone: "negative" },
        { label: "已结算", value: "12,013" },
        { label: "异常注单", value: "27" },
        { label: "平均投注额", value: "101.59" }
      ],
      rows: [
        ["Windr", "P12313", "DG202606100001", "DG", "视讯", "百家乐", "USDT", "3,000.00", "3,000.00", "-1,250.00", "1,750.00", "庄 2,000 / 闲 1,000", "庄赢", "VIP-08", "R20260610-88123", "2026-06-10 10:18:23", "2026-06-10 10:19:02"],
        ["Amber", "P88201", "EVO202606100193", "EVO", "视讯", "轮盘", "USD", "850.00", "850.00", "1,120.00", "1,970.00", "红 500 / 双数 350", "红 + 双", "ROU-03", "R20260610-88177", "2026-06-10 10:25:41", "2026-06-10 10:26:09"],
        ["Kite", "P77194", "SA202606100287", "SA", "视讯", "龙虎", "USDT", "1,500.00", "1,500.00", "-1,500.00", "0.00", "龙 1,500", "虎赢", "DL-12", "R20260610-88211", "2026-06-10 10:33:11", "2026-06-10 10:33:47"],
        ["Nova", "P66508", "DG202606100366", "DG", "视讯", "牛仔", "USDT", "2,200.00", "2,200.00", "680.00", "2,880.00", "黑桃 800 / 红桃 1,400", "红桃赢", "CW-05", "R20260610-88304", "2026-06-10 10:46:18", "2026-06-10 10:47:03"],
        ["Rhea", "P19477", "EVO202606100489", "EVO", "视讯", "极速百家乐", "USD", "6,800.00", "6,800.00", "-2,150.50", "4,649.50", "闲 4,000 / 和 2,800", "庄赢", "BAC-21", "R20260610-88388", "2026-06-10 11:08:09", "2026-06-10 11:08:39"]
      ]
    },
    "电子": {
      title: "电子注单明细",
      notice: "电子记录适合结合厂商与游戏名称快速排查返奖波动与 RTP 异常。",
      subline: "共 23,104 条记录，已结算 22,964 条，免费旋转相关 182 条",
      totalText: "共 23104 条记录",
      summary: [
        { label: "注单总数", value: "23,104" },
        { label: "投注额", value: "4,118,320.00" },
        { label: "有效投注", value: "3,908,560.00" },
        { label: "派彩", value: "4,035,440.00" },
        { label: "玩家输赢", value: "126,880.00", tone: "positive" },
        { label: "已结算", value: "22,964" },
        { label: "免费旋转", value: "182" },
        { label: "平均投注额", value: "169.16" }
      ],
      rows: [
        ["Mina", "P82011", "PG202606100716", "PG", "电子", "Mahjong Ways 2", "USDT", "480.00", "480.00", "2,640.00", "3,120.00", "40 x 12.00", "免费旋转命中", "PG-01", "MW2-44911", "2026-06-10 09:18:25", "2026-06-10 09:18:28", [
          ["结果类型", "免费旋转"],
          ["触发符号", "Scatter x3"],
          ["命中组合", "Wild x2 + 金鼓 x5"],
          ["累计倍率", "220x"],
          ["最终派彩", "3,120.00", "positive"]
        ]],
        ["Jax", "P19402", "JILI202606100904", "JILI", "电子", "Fortune Gems", "USDT", "1,200.00", "1,200.00", "-820.00", "380.00", "60 x 20.00", "普通结算", "JL-17", "FG-55103", "2026-06-10 09:46:08", "2026-06-10 09:46:12", [
          ["结果类型", "普通结算"],
          ["命中线路", "5 条"],
          ["最高倍率", "0.8x"],
          ["特殊事件", "未触发 Bonus"],
          ["最终输赢", "-820.00", "negative"]
        ]],
        ["Luca", "P30291", "CQ9202606101012", "CQ9", "电子", "Jump High", "USD", "320.00", "320.00", "1,150.00", "1,470.00", "20 x 16.00", "大奖命中", "CQ9-09", "JH-00987", "2026-06-10 10:11:42", "2026-06-10 10:11:45", [
          ["结果类型", "大奖命中"],
          ["触发关卡", "第 2 段高台"],
          ["命中倍率", "4.59x", "positive"],
          ["连击次数", "7 次"],
          ["最终派彩", "1,470.00", "positive"]
        ]],
        ["Niko", "P55092", "TADA202606101188", "TADA", "电子", "Lucky Jaguar", "USDT", "2,000.00", "2,000.00", "-1,530.00", "470.00", "100 x 20.00", "普通结算", "TD-03", "LJ-77318", "2026-06-10 10:34:59", "2026-06-10 10:35:05", [
          ["结果类型", "普通结算"],
          ["触发模式", "基础盘"],
          ["命中组合", "豹眼 x2"],
          ["回收倍率", "0.24x"],
          ["最终输赢", "-1,530.00", "negative"]
        ]],
        ["Yuri", "P90811", "PG202606101276", "PG", "电子", "Sugar Rush", "USD", "760.00", "760.00", "580.00", "1,340.00", "40 x 19.00", "倍数连击", "PG-11", "SR-88412", "2026-06-10 11:02:15", "2026-06-10 11:02:18", [
          ["结果类型", "倍数连击"],
          ["连击轮次", "第 5 轮"],
          ["最高糖果倍率", "18x", "positive"],
          ["总倍数", "1.76x"],
          ["最终派彩", "1,340.00", "positive"]
        ]]
      ]
    },
    "体育": {
      title: "体育注单明细",
      notice: "体育类默认展示赛果已确认注单，方便排查延迟结算与串关异常。",
      subline: "共 8,931 条记录，待确认赛果 143 条，串关注单 1,201 条",
      totalText: "共 8931 条记录",
      summary: [
        { label: "注单总数", value: "8,931" },
        { label: "投注额", value: "2,266,400.00" },
        { label: "有效投注", value: "2,166,900.00" },
        { label: "派彩", value: "2,102,780.00" },
        { label: "玩家输赢", value: "-64,120.00", tone: "negative" },
        { label: "已结算", value: "8,788" },
        { label: "串关注单", value: "1,201" },
        { label: "平均投注额", value: "242.62" }
      ],
      rows: [
        ["Owen", "P71822", "SBO202606100221", "SBO", "体育", "欧冠", "USDT", "1,500.00", "1,500.00", "-1,500.00", "0.00", "曼城 -1.5", "未命中", "SP-12", "SB-12871", "2026-06-10 08:22:18", "2026-06-10 10:02:14"],
        ["Iris", "P88410", "SBO202606100347", "SBO", "体育", "NBA 总分", "USD", "900.00", "900.00", "720.00", "1,620.00", "大分 218.5", "命中", "SP-02", "SB-12940", "2026-06-10 08:49:34", "2026-06-10 10:15:09"],
        ["Moss", "P60210", "CMD202606100411", "CMD", "体育", "英超串关", "USDT", "650.00", "650.00", "-650.00", "0.00", "2 串 1", "1 场未命中", "CM-06", "CM-44019", "2026-06-10 09:03:51", "2026-06-10 09:58:47"],
        ["Sage", "P11140", "SBO202606100655", "SBO", "体育", "网球让局", "USDT", "2,200.00", "2,200.00", "1,430.00", "3,630.00", "阿尔卡拉斯 -3.5", "命中", "SP-07", "SB-13088", "2026-06-10 09:57:18", "2026-06-10 11:21:46"],
        ["Tara", "P32071", "CMD202606100804", "CMD", "体育", "电竞赛果", "USDT", "400.00", "400.00", "-240.00", "160.00", "地图 1 胜者", "半赢", "CM-21", "CM-44182", "2026-06-10 10:26:12", "2026-06-10 11:07:35"]
      ]
    },
    "彩票": {
      title: "彩票注单明细",
      notice: "彩票类适合按彩种、期号与开奖状态核对未派奖和撤单记录。",
      subline: "共 6,280 条记录，未开奖 96 条，撤单 14 条",
      totalText: "共 6280 条记录",
      summary: [
        { label: "注单总数", value: "6,280" },
        { label: "投注额", value: "962,680.00" },
        { label: "有效投注", value: "938,420.00" },
        { label: "派彩", value: "987,150.00" },
        { label: "玩家输赢", value: "48,730.00", tone: "positive" },
        { label: "已结算", value: "6,170" },
        { label: "未开奖", value: "96" },
        { label: "平均投注额", value: "149.43" }
      ],
      rows: [
        ["Cole", "P60821", "LOT202606100091", "TCG", "彩票", "腾讯分分彩", "USDT", "260.00", "260.00", "0.00", "260.00", "后二直选", "待开奖", "LT-03", "20260610-431", "2026-06-10 09:01:05", "待开奖"],
        ["Vera", "P11204", "LOT202606100213", "GW", "彩票", "北京PK10", "USDT", "1,080.00", "1,080.00", "860.00", "1,940.00", "冠亚和大", "命中", "LT-08", "20260610-512", "2026-06-10 09:36:42", "2026-06-10 09:38:10"],
        ["Kora", "P77110", "LOT202606100319", "TCG", "彩票", "重庆时时彩", "USD", "520.00", "520.00", "-520.00", "0.00", "后三组三", "未命中", "LT-02", "20260610-814", "2026-06-10 10:02:09", "2026-06-10 10:03:00"],
        ["Finn", "P39881", "LOT202606100442", "GW", "彩票", "香港六合彩", "USDT", "900.00", "900.00", "1,350.00", "2,250.00", "特码单双", "命中", "LT-11", "20260610-926", "2026-06-10 10:41:18", "2026-06-10 10:42:48"],
        ["Nia", "P22089", "LOT202606100517", "TCG", "彩票", "幸运飞艇", "USDT", "300.00", "300.00", "-300.00", "0.00", "冠军龙", "未命中", "LT-05", "20260610-1013", "2026-06-10 11:10:26", "2026-06-10 11:11:00"]
      ]
    },
    "棋牌": {
      title: "棋牌注单明细",
      notice: "棋牌类建议重点观察长局、连续输赢和桌台波动。",
      subline: "共 4,118 条记录，多局连续结算 682 条，异常波动桌台 2 个",
      totalText: "共 4118 条记录",
      summary: [
        { label: "注单总数", value: "4,118" },
        { label: "投注额", value: "1,160,430.00" },
        { label: "有效投注", value: "1,106,780.00" },
        { label: "派彩", value: "1,083,940.00" },
        { label: "玩家输赢", value: "-22,840.00", tone: "negative" },
        { label: "已结算", value: "4,086" },
        { label: "长局桌台", value: "17" },
        { label: "平均投注额", value: "268.76" }
      ],
      rows: [
        ["Aden", "P90322", "KM202606100144", "Kingmaker", "棋牌", "德州扑克", "USDT", "1,800.00", "1,800.00", "-980.00", "820.00", "翻牌圈跟注", "顺子败给同花", "PK-14", "KM-23091", "2026-06-10 08:55:39", "2026-06-10 09:01:22"],
        ["Pia", "P50771", "KM202606100267", "Kingmaker", "棋牌", "二八杠", "USDT", "620.00", "620.00", "430.00", "1,050.00", "押庄", "庄赢", "PK-05", "KM-23128", "2026-06-10 09:18:47", "2026-06-10 09:20:04"],
        ["Rory", "P22830", "V8P202606100398", "V8", "棋牌", "牌九", "USD", "1,120.00", "1,120.00", "-1,120.00", "0.00", "天牌 600 / 地牌 520", "闲赢", "PK-19", "V8-91877", "2026-06-10 09:57:03", "2026-06-10 10:01:15"],
        ["Nell", "P80810", "KM202606100502", "Kingmaker", "棋牌", "牛牛", "USDT", "740.00", "740.00", "660.00", "1,400.00", "抢庄 1 倍", "牛八胜", "PK-07", "KM-23209", "2026-06-10 10:32:55", "2026-06-10 10:34:01"],
        ["Drew", "P11083", "V8P202606100641", "V8", "棋牌", "三公", "USDT", "450.00", "450.00", "-210.00", "240.00", "闲一 250 / 闲二 200", "闲一输", "PK-09", "V8-92004", "2026-06-10 11:06:44", "2026-06-10 11:08:17"]
      ]
    },
    "捕鱼": {
      title: "捕鱼注单明细",
      notice: "捕鱼类建议结合炮值、命中倍率与房间观察 RTP 波动。",
      subline: "共 5,706 条记录，Boss 命中 58 次，特殊道具触发 412 次",
      totalText: "共 5706 条记录",
      summary: [
        { label: "注单总数", value: "5,706" },
        { label: "投注额", value: "1,876,250.00" },
        { label: "有效投注", value: "1,782,300.00" },
        { label: "派彩", value: "1,873,860.00" },
        { label: "玩家输赢", value: "91,560.00", tone: "positive" },
        { label: "已结算", value: "5,706" },
        { label: "Boss 命中", value: "58" },
        { label: "平均投注额", value: "312.34" }
      ],
      rows: [
        ["Ari", "P62341", "JILI202606100088", "JILI", "捕鱼", "Jackpot Fishing", "USDT", "2,600.00", "2,600.00", "1,880.00", "4,480.00", "炮值 80", "Boss 命中", "FS-02", "JF-66192", "2026-06-10 08:41:26", "2026-06-10 08:41:59"],
        ["Bryn", "P11837", "KA202606100219", "KA", "捕鱼", "Golden Toad", "USD", "980.00", "980.00", "-420.00", "560.00", "炮值 50", "普通结算", "FS-07", "GT-10428", "2026-06-10 09:16:08", "2026-06-10 09:16:43"],
        ["Cora", "P99412", "JILI202606100356", "JILI", "捕鱼", "Mega Fishing", "USDT", "1,500.00", "1,500.00", "760.00", "2,260.00", "炮值 65", "电击连锁", "FS-11", "MF-88741", "2026-06-10 09:54:35", "2026-06-10 09:55:21"],
        ["Ezra", "P20458", "KA202606100507", "KA", "捕鱼", "Dragon Hunter", "USDT", "3,200.00", "3,200.00", "-1,260.00", "1,940.00", "炮值 100", "Boss 逃脱", "FS-03", "DH-55680", "2026-06-10 10:38:16", "2026-06-10 10:39:02"],
        ["Lina", "P71102", "JILI202606100689", "JILI", "捕鱼", "Ocean King", "USD", "1,140.00", "1,140.00", "600.00", "1,740.00", "炮值 55", "连击奖励", "FS-09", "OK-77124", "2026-06-10 11:09:58", "2026-06-10 11:10:37"]
      ]
    },
    "区块链": {
      title: "区块链注单明细",
      subline: "共 3,214 条记录，链上完成结算 3,176 条，异常确认 8 条",
      totalText: "共 3214 条记录",
      summary: [
        { label: "注单总数", value: "3,214" },
        { label: "投注额", value: "1,324,880.00" },
        { label: "有效投注", value: "1,324,880.00" },
        { label: "派彩", value: "1,408,620.00" },
        { label: "玩家输赢", value: "83,740.00", tone: "positive" },
        { label: "已结算", value: "3,176" },
        { label: "链上异常", value: "8" },
        { label: "平均投注额", value: "412.22" }
      ],
      rows: [
        ["Rex", "P77421", "BC202606100602", "BC.Game", "区块链", "Crash", "USDT", "300.00", "300.00", "726.00", "1,026.00", "止盈 3.42x", "CRASH 3.42x 爆", "BC-08", "CR-88102", "2026-06-10 11:16:22", "2026-06-10 11:16:31", [
          ["结果类型", "CRASH"],
          ["爆点倍率", "3.42x", "positive"],
          ["玩家止盈", "3.42x"],
          ["区块哈希", "0x8b39...7f2c"],
          ["派彩结果", "1,026.00", "positive"]
        ]],
        ["Miro", "P66028", "BC202606100631", "BC.Game", "区块链", "Limbo", "USDT", "180.00", "180.00", "-180.00", "0.00", "目标 18.00x", "LIMBO 未命中", "BC-02", "LB-10291", "2026-06-10 11:24:16", "2026-06-10 11:24:19", [
          ["结果类型", "LIMBO"],
          ["目标倍率", "18.00x"],
          ["实际开出", "4.72x"],
          ["随机源", "Provably Fair"],
          ["最终输赢", "-180.00", "negative"]
        ]],
        ["Noah", "P55210", "BC202606100688", "Rollbit", "区块链", "Dice", "USD", "520.00", "520.00", "312.00", "832.00", "小于 54.00", "DICE 41.28 命中", "RB-03", "DC-66018", "2026-06-10 11:46:05", "2026-06-10 11:46:07", [
          ["结果类型", "DICE"],
          ["下注区间", "< 54.00"],
          ["开出结果", "41.28", "positive"],
          ["赔率", "1.60x"],
          ["派彩结果", "832.00", "positive"]
        ]],
        ["Sia", "P18403", "BC202606100742", "Stake", "区块链", "Mines", "USDT", "400.00", "400.00", "680.00", "1,080.00", "已开 4 格 / 2 雷", "MINES 2.70x 收手", "ST-05", "MN-77140", "2026-06-10 12:03:48", "2026-06-10 12:04:12", [
          ["结果类型", "MINES"],
          ["地雷数量", "2"],
          ["已开安全格", "4 格"],
          ["收手倍率", "2.70x", "positive"],
          ["派彩结果", "1,080.00", "positive"]
        ]],
        ["Troy", "P90773", "BC202606100804", "Stake", "区块链", "Plinko", "USD", "260.00", "260.00", "-130.00", "130.00", "中风险 12 行", "PLINKO 0.50x 落点", "ST-09", "PK-44102", "2026-06-10 12:18:34", "2026-06-10 12:18:40", [
          ["结果类型", "PLINKO"],
          ["盘面配置", "中风险 / 12 行"],
          ["落点倍率", "0.50x"],
          ["种子校验", "client seed 已验证"],
          ["最终输赢", "-130.00", "negative"]
        ]]
      ]
    }
  };

  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
      return;
    }
    callback();
  }

  function formatPlayerCell(name, id) {
    return '<td class="player-cell"><strong>' + name + "</strong><span>" + id + "</span></td>";
  }

  function toneClass(value) {
    if (typeof value !== "string") return "";
    if (value.indexOf("-") === 0) return "negative";
    if (value !== "0.00" && value !== "0" && value !== "待开奖") return "positive";
    return "";
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function formatResultCell(row) {
    var text = row[12];
    var detail = row[17];

    if (!detail) {
      return "<td>" + escapeHtml(text) + "</td>";
    }

    return '<td><button class="result-link" type="button" data-result-detail="' + escapeHtml(JSON.stringify(detail)) + '" data-result-title="' + escapeHtml(row[5] + "结果详情") + '">' + escapeHtml(text) + "</button></td>";
  }

  ready(function () {
    var summaryHeadRow = document.getElementById("summaryHeadRow");
    var summaryValueRow = document.getElementById("summaryValueRow");
    var tableBody = document.getElementById("recordTableBody");
    var tableTitle = document.getElementById("tableTitle");
    var tableSubline = document.getElementById("tableSubline");
    var pageTotalText = document.getElementById("pageTotalText");
    var searchButton = document.getElementById("searchButton");
    var resetButton = document.getElementById("resetButton");
    var exportButton = document.getElementById("exportButton");
    var refreshPageButton = document.getElementById("refreshPageButton");
    var refreshSummaryButton = document.getElementById("refreshSummaryButton");
    var filterBar = document.getElementById("recordFilterBar");
    var gameTypeFilter = document.getElementById("gameTypeFilter");
    var resultModal = document.getElementById("resultModal");
    var resultModalTitle = document.getElementById("resultModalTitle");
    var resultDetailGrid = document.getElementById("resultDetailGrid");
    var resultModalClose = document.getElementById("resultModalClose");
    var resultModalCancel = document.getElementById("resultModalCancel");
    var resultModalConfirm = document.getElementById("resultModalConfirm");
    var currentTab = "所有类型";

    if (!summaryHeadRow || !summaryValueRow || !tableBody || !gameTypeFilter) return;

    function renderSummary(items) {
      summaryHeadRow.innerHTML = items
        .map(function (item) {
          return "<th>" + item.label + "</th>";
        })
        .join("");

      summaryValueRow.innerHTML = items
        .map(function (item) {
          return '<td class="' + (item.tone || "") + '">' + item.value + "</td>";
        })
        .join("");
    }

    function renderRows(rows) {
      tableBody.innerHTML = rows
        .map(function (row) {
          return [
            "<tr>",
            formatPlayerCell(row[0], row[1]),
            '<td title="' + row[2] + '">' + row[2] + "</td>",
            "<td>" + row[3] + "</td>",
            "<td>" + row[4] + "</td>",
            "<td>" + row[5] + "</td>",
            "<td>" + row[6] + "</td>",
            '<td class="num">' + row[7] + "</td>",
            '<td class="num">' + row[8] + "</td>",
            '<td class="num ' + toneClass(row[9]) + '">' + row[9] + "</td>",
            '<td class="num">' + row[10] + "</td>",
            "<td>" + row[11] + "</td>",
            formatResultCell(row),
            "<td>" + row[13] + "</td>",
            "<td>" + row[14] + "</td>",
            "<td>" + row[15] + "</td>",
            "<td>" + row[16] + "</td>",
            "</tr>"
          ].join("");
        })
        .join("");
    }

    function applyTab(tabName) {
      var data = datasets[tabName];
      if (!data) return;
      currentTab = tabName;
      gameTypeFilter.value = tabName;
      renderSummary(data.summary);
      renderRows(data.rows);
      tableTitle.textContent = data.title;
      tableSubline.textContent = data.subline;
      pageTotalText.textContent = data.totalText;
    }

    function closeResultModal() {
      if (!resultModal) return;
      resultModal.hidden = true;
    }

    function openResultModal(title, detail) {
      if (!resultModal || !resultDetailGrid) return;
      resultModalTitle.textContent = title;
      resultDetailGrid.innerHTML = "<dl>" + detail.map(function (item) {
        return "<dt>" + escapeHtml(item[0]) + "</dt><dd class=\"" + (item[2] || "") + "\">" + escapeHtml(item[1]) + "</dd>";
      }).join("") + "</dl>";
      resultModal.hidden = false;
    }

    gameTypeFilter.addEventListener("change", function () {
      applyTab(gameTypeFilter.value);
    });

    tableBody.addEventListener("click", function (event) {
      var resultButton = event.target.closest("[data-result-detail]");
      if (resultButton) {
        openResultModal(
          resultButton.getAttribute("data-result-title") || "结果详情",
          JSON.parse(resultButton.getAttribute("data-result-detail"))
        );
        return;
      }

      var row = event.target.closest("tr");
      if (!row) return;
      Array.prototype.forEach.call(tableBody.querySelectorAll("tr"), function (item) {
        item.classList.remove("is-selected");
      });
      row.classList.add("is-selected");
    });

    searchButton.addEventListener("click", function () {
      applyTab(gameTypeFilter.value);
      searchButton.textContent = "查询完成";
      window.setTimeout(function () {
        searchButton.textContent = "查询";
      }, 1200);
    });

    resetButton.addEventListener("click", function () {
      window.setTimeout(function () {
        Array.prototype.forEach.call(filterBar.querySelectorAll("input[type='text']"), function (input) {
          input.value = "";
        });
        Array.prototype.forEach.call(filterBar.querySelectorAll("select"), function (select) {
          select.selectedIndex = 0;
        });
        applyTab("所有类型");
      }, 0);
    });

    exportButton.addEventListener("click", function () {
      exportButton.textContent = "导出完成";
      window.setTimeout(function () {
        exportButton.textContent = "导出数据";
      }, 1200);
    });

    function quickRefresh(button, doneText) {
      var originalText = button.textContent;
      button.textContent = doneText;
      window.setTimeout(function () {
        button.textContent = originalText;
      }, 1000);
    }

    refreshPageButton.addEventListener("click", function () {
      quickRefresh(refreshPageButton, "已刷新");
    });

    refreshSummaryButton.addEventListener("click", function () {
      quickRefresh(refreshSummaryButton, "已刷新");
    });

    [resultModalClose, resultModalCancel, resultModalConfirm].forEach(function (button) {
      if (!button) return;
      button.addEventListener("click", closeResultModal);
    });

    if (resultModal) {
      resultModal.addEventListener("click", function (event) {
        if (event.target && event.target.getAttribute("data-close-result-modal") === "true") {
          closeResultModal();
        }
      });
    }

    applyTab(currentTab);
  });
})();
