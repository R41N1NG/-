"use strict";
const {
  classifyPlace,
  requirementFailure,
} = require("../contracts/action-requirements.js");
const { staminaFailure } = require("../contracts/stamina.js");
const CONFIG = require("./generated/rules.json");
function capsuleGate(c, snap) {
  const staminaError =
    snap?.player &&
    staminaFailure(snap.player.stamina, CONFIG.staminaCosts[c.id] || 0);
  if (staminaError) return { hide: false, lock: true, reason: staminaError };
  const distLabel = { far: "远端", same: "同街", close: "身后", touch: "贴身" };
  const dist = (snap && snap.dist) || "same";
  const place = String((snap && snap.place) || "");
  const isDoor =
    /单元|楼道|门|玄关|电梯|台阶|入口|unit|stairs|gate|door|porch|lobby|entrance/i.test(
      place,
    );
  if (c.id === "scan" && snap?.cityMap?.target && !snap.cityMap.target.live)
    return {
      hide: false,
      lock: true,
      reason: "已失去目标目视，先恢复目视再打量",
    };
  const near = dist === "close" || dist === "touch";
  const inv = (snap && snap.inventory) || [];
  const has = (ids) =>
    inv.some((it) => ids.includes(it.id) && (it.count || 1) > 0);
  const style = c && c.args && c.args.style;

  // 破门类：没有门 → 整条不出现；有门但人还在十几米外 → 灰条（够不着）
  if (
    [
      "lockpick",
      "pry",
      "try_handle",
      "door_listen",
      "door_peep",
      "check_door",
    ].includes(c.id)
  ) {
    if (!isDoor) return { hide: true, lock: false, reason: "此处没有门" };
    if (!near)
      return {
        hide: false,
        lock: true,
        reason: `需走近门前（当前 ${distLabel[dist] || dist}）`,
      };
  }
  // 手上的活：翻找 / 翻墙，人也得先到位
  if ((c.id === "ransack" || c.id === "climb") && !near) {
    return {
      hide: false,
      lock: true,
      reason: `需走到近旁才做得成（当前 ${distLabel[dist] || dist}）`,
    };
  }
  // 跟缀＝保持当前距离继续跟，不是「挪到某个距离」，所以不吃距离变更门槛
  const isMaintain =
    c.id === "follow" && /跟缀|保持|维持/.test(String(c.name || ""));
  // 距离类：已经贴身就别再「逼近」，已经最远就别再「拉开」；同一档也别让人白点一次
  if (c.args && c.args.dist && !isMaintain) {
    const R = { far: 0, same: 1, close: 2, touch: 3 };
    const cur = R[dist],
      tgt = R[c.args.dist];
    if (tgt !== undefined) {
      const name = String(c.name || "");
      const isCloser = /贴身|逼近|压近|贴近|靠近/.test(name);
      const isFarther = /拉开|退回|后撤|拉远/.test(name);
      if (isCloser && tgt <= cur) {
        return {
          hide: false,
          lock: true,
          reason:
            cur === 3
              ? "已贴身，无法再靠近"
              : `已在${distLabel[dist] || dist}，不必再逼近`,
        };
      }
      if (isFarther && tgt >= cur) {
        return {
          hide: false,
          lock: true,
          reason:
            cur === 0
              ? "已是最远，无法再退"
              : `已在${distLabel[dist] || dist}，不必再拉开`,
        };
      }
      if (!isCloser && !isFarther && tgt === cur) {
        return {
          hide: false,
          lock: true,
          reason: `已在${distLabel[dist] || dist}`,
        };
      }
    }
  }
  // 贴身时无处可躲；按制只在贴身成立；心跳已在低位时缓息无效
  if (c.id === "hide" && dist === "touch")
    return { hide: false, lock: true, reason: "贴身时无处可躲（先拉开距离）" };
  if (c.id === "pin" && dist !== "touch")
    return { hide: false, lock: true, reason: "需贴身才能按制" };
  if (
    c.id === "breath" &&
    snap &&
    snap.player &&
    Number(snap.player.heart) <= 20
  ) {
    return { hide: false, lock: true, reason: "心跳已在低位，缓息无效" };
  }
  if (c.id === "lockpick" && !has(["lockpick", "cyber_lockpick"])) {
    return {
      hide: false,
      lock: true,
      reason: "缺少开锁工具（终端·战术行囊可购买并装备）",
    };
  }
  if (c.id === "strike") {
    const need = style === "assault" ? ["close", "touch"] : ["touch"];
    if (!need.includes(dist)) {
      return {
        hide: false,
        lock: true,
        reason:
          (style === "assault"
            ? "需身后或贴身才能强攻"
            : "需贴身（1 米内）才能偷袭") +
          `（当前 ${distLabel[dist] || dist}）`,
      };
    }
  }
  const missing = requirementFailure(CONFIG.requirements[c.id], {
    dist: snap?.dist || "same",
    placeKind: snap?.placeKind ?? classifyPlace(snap?.place, snap?.place),
    inventory: snap?.inventory || [],
  });
  if (missing)
    return {
      hide: missing.code === "place",
      lock: missing.code !== "place",
      reason: missing.reason,
    };
  return { hide: false, lock: false, reason: "" };
}

function getDynamicCapsules(snap) {
  const mode = (snap && snap.mode) || "stealth";
  const dist = (snap && snap.dist) || "same";
  const pId = String((snap && snap.place) || "").toLowerCase();
  const kind = snap?.placeKind ?? classifyPlace(pId, snap?.place);
  const isDoor = kind === "door",
    isRoom = kind === "room";

  if (mode === "stealth") {
    if (isDoor) {
      return {
        default: null,
        chips: [
          {
            id: "try_handle",
            name: "试门把",
            args: {},
            tip: "赌运气，零声浪无痕迹",
          },
          {
            id: "lockpick",
            name: "挠钩开锁",
            args: {},
            tip: "技术慢工，吃敏捷检定",
          },
          {
            id: "pry",
            name: "暴力撬门",
            args: {},
            tip: "快速强攻，留痕且声浪大",
          },
          {
            id: "door_listen",
            name: "贴门听动静",
            args: {},
            tip: "听取门内声浪与活动",
          },
        ],
      };
    }
    if (isRoom) {
      return {
        default: { id: "ransack", name: "翻找", args: {} },
        chips: [
          {
            id: "ransack",
            name: "细致翻找",
            args: {},
            tip: "搜寻衣柜/书桌/贴身物",
          },
          {
            id: "door_listen",
            name: "听门外动静",
            args: {},
            tip: "警戒走廊脚步",
          },
          { id: "door_peep", name: "观察窗外", args: {}, tip: "确认撤离路线" },
          { id: "plan_exit", name: "悄声撤离", args: {}, tip: "原路脱身离开" },
        ],
      };
    }
    if (dist === "far") {
      return {
        default: { id: "follow", name: "跟缀", args: { dist: "far" } },
        chips: [
          {
            id: "follow",
            name: "压近 (同街)",
            args: { dist: "same" },
            tip: "加快步速缩短到同街",
          },
          { id: "photo", name: "长焦拍照", args: {}, tip: "远距离取证抓拍" },
          {
            id: "hide",
            name: "借掩体躲藏",
            args: {},
            tip: "避入路灯死角或行道树",
          },
          {
            id: "breath",
            name: "缓息平复",
            args: {},
            tip: "放缓呼吸，平复心跳",
          },
        ],
      };
    }
    if (dist === "close") {
      return {
        default: { id: "follow", name: "跟缀", args: { dist: "close" } },
        chips: [
          {
            id: "follow",
            name: "贴身逼近",
            args: { dist: "touch" },
            tip: "压缩至一步之内",
          },
          {
            id: "door_listen",
            name: "贴身听/录音",
            args: {},
            tip: "监听私密电话或脚步",
          },
          {
            id: "withdraw",
            name: "退回同街",
            args: { dist: "same" },
            tip: "放慢步子退回安全距离",
          },
          {
            id: "strike",
            name: "下手 (偷袭)",
            args: { style: "ambush" },
            danger: true,
            tip: "贴身偷袭捂嘴压制",
          },
        ],
      };
    }
    if (dist === "touch") {
      return {
        default: { id: "follow", name: "跟缀", args: { dist: "touch" } },
        chips: [
          {
            id: "strike",
            name: "下手 (偷袭)",
            args: { style: "ambush" },
            danger: true,
            tip: "贴身偷袭捂嘴压制",
          },
          { id: "door_listen", name: "贴身听", args: {}, tip: "极近距离侦听" },
          {
            id: "ransack",
            name: "顺手牵羊",
            args: {},
            tip: "顺走包袋贴身物件",
          },
          {
            id: "withdraw",
            name: "稍稍拉开",
            args: { dist: "close" },
            tip: "退回身后十步",
          },
        ],
      };
    }
    // 默认 same
    return {
      default: { id: "follow", name: "跟缀", args: { dist: "same" } },
      chips: [
        {
          id: "follow",
          name: "逼近 (身后)",
          args: { dist: "close" },
          tip: "压近到她身后10步",
        },
        {
          id: "withdraw",
          name: "拉开 (远端)",
          args: { dist: "far" },
          tip: "放慢步速拉开到对街",
        },
        {
          id: "hide",
          name: "借掩体躲藏",
          args: {},
          tip: "借路边阴影或建筑躲藏",
        },
        { id: "photo", name: "拍照取证", args: {}, tip: "拿出手机抓拍" },
      ],
    };
  }
  if (mode === "contact") {
    return {
      default: null,
      chips: [
        { id: "chat", name: "搭话搭讪", args: {}, tip: "借故上前展开对话" },
        { id: "greet", name: "礼貌寒暄", args: {}, tip: "低风险日常打招呼" },
        {
          id: "misdirection",
          name: "误导归因",
          args: {},
          tip: "将可疑动静归咎于野猫风声",
        },
        { id: "abort", name: "借故告退", args: {}, tip: "结束交谈回到潜行" },
      ],
    };
  }
  if (mode === "climax") {
    return {
      default: null,
      chips: [
        {
          id: "strike",
          name: "下手 (偷袭)",
          args: { style: "ambush" },
          danger: true,
          tip: "暗中偷袭",
        },
        {
          id: "strike",
          name: "下手 (强攻)",
          args: { style: "assault" },
          danger: true,
          tip: "正面直接强攻",
        },
        { id: "pin", name: "维持按制", args: {}, tip: "压制控制" },
        { id: "chase", name: "全力追逐", args: {}, tip: "破颜追逐" },
      ],
    };
  }
  return {
    default: null,
    chips: [
      { id: "breath", name: "缓息", args: {}, tip: "平复心跳" },
      { id: "photo", name: "拍照", args: {}, tip: "抓拍" },
    ],
  };
}

module.exports = { capsuleGate, getDynamicCapsules };
