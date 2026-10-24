"use strict";
const { fatigueOf } = require("../../contracts/stamina.js");
const CONFIG = require("../generated/rules.json");
const { ico, stripEmoji } = require("../icons.js");
const { ALERT_TIERS, alertTierOf } = require("../alert-view.js");
const {
  SWEET,
  sweetRangeOf,
  LINES,
  heartToBpm,
  heartFreq,
  DIST_NAMES,
  SLOT_NAMES,
  MODE_NAMES,
  lineOf,
} = require("../display.js");

// 只消费快照并更新视图；业务结算仍由引擎负责。
function createSnapshotRenderer({
  document,
  lifecycle,
  root,
  dial,
  setSweetRange,
  view,
  audio,
  renderers,
}) {
  const { HUNTER_MODES, getRainState } = audio;
  const {
    renderAlbum,
    showPhotoToast,
    renderInventory,
    renderActionCapsules,
    updateIdBadge,
  } = renderers;
  function renderSnapshot(snap) {
    view.snapshot = snap;
    renderAlbum(snap);
    showPhotoToast(snap);
    view.heart = snap.player.heart;
    view.mode = snap.mode;
    if (audio.audioOn) audio.updateRainTunnel();
    const bpm = Math.round(heartToBpm(view.heart));
    document.getElementById("heartNum").textContent = view.heart;
    document.getElementById("bpmNum").textContent = bpm + " BPM";
    const miniHeartNum = document.getElementById("miniHeartNum");
    if (miniHeartNum) miniHeartNum.textContent = view.heart;
    const miniBpmNum = document.getElementById("miniBpmNum");
    if (miniBpmNum) miniBpmNum.textContent = bpm + " BPM";
    document.getElementById("orbit").style.transform =
      `rotate(${135 + (view.heart / 100) * 270}deg)`;
    const range = sweetRangeOf(snap);
    setSweetRange?.(range);
    dial.setAttribute(
      "aria-label",
      `心跳负荷${view.heart}，量程0至100，甜区${range[0]}至${range[1]}`,
    );
    document.getElementById("instrument").dataset.tip =
      `心跳负荷0–100；当前甜区${range[0]}–${range[1]}，检定+1。${LINES[0]}起精细检定−2；${LINES[1]}起精细检定合计−4，不是敏捷属性降低。BPM是换算读数。`;
    root.style.setProperty("--beat", `${60 / bpm}s`);
    const line = lineOf(view.heart);
    document.getElementById("instrument").dataset.line = line;
    root.dataset.line = line;
    /* 疲劳由实际体力比例派生；快照渲染不得修改进度。 */
    const st = snap.player.stamina;
    const staminaMax =
      snap.player.staminaMax ||
      (snap.player.attrs?.str ? 100 + snap.player.attrs.str * 5 : 100);
    const staminaPercent = Math.max(
      0,
      Math.min(100, Math.round((st / staminaMax) * 100)),
    );
    const fatigue = fatigueOf(st, staminaMax, CONFIG.fatigue);
    const band = [
      fatigue.band,
      fatigue.band === "green" ? "" : "· " + fatigue.name,
    ];
    const staminaTip =
      `当前体力 ${st} / ${staminaMax}（${staminaPercent}%） · ${fatigue.name}` +
      (fatigue.dc
        ? ` · 跟随 DC +${fatigue.dc}`
        : st === 0
          ? " · 请补给或结束尾行"
          : "") +
      "；跟随4 / 打量2 / 拍照3点，另计每回合心跳消耗";
    const box = document.getElementById("staminaBox");
    if (box) {
      box.dataset.band = band[0];
      box.dataset.tip = staminaTip;
    }
    const sval = document.getElementById("staminaVal");
    if (sval) sval.textContent = staminaPercent + "%";
    const sfill = document.getElementById("staminaFill");
    if (sfill) sfill.style.width = staminaPercent + "%";
    const fullBox = document.getElementById("fullStaminaBox");
    if (fullBox) {
      fullBox.dataset.band = band[0];
      const fullSVal = document.getElementById("fullStaminaVal");
      if (fullSVal) fullSVal.textContent = staminaPercent + "%";
      const bname = document.getElementById("bandName");
      if (bname) bname.textContent = band[1];
      const fullFill = document.getElementById("fullStaminaFill");
      if (fullFill) fullFill.style.width = staminaPercent + "%";
      fullBox
        .querySelector(".stamina-meter")
        ?.setAttribute("aria-valuenow", st);
      fullBox
        .querySelector(".stamina-meter")
        ?.setAttribute("aria-valuemax", staminaMax);
      fullBox.dataset.tip = staminaTip;
    }
    /* 日段×模式 + 距离档（接触/车厢 = 朋友的位，pip 换暖色提醒双态语义） */
    document.getElementById("phase").textContent =
      MODE_NAMES[snap.mode] || snap.mode;
    document.getElementById("distName").textContent =
      DIST_NAMES[snap.dist] || snap.dist;
    /* 距离档双栖语义：潜行与接触是两套距离 */
    document.getElementById("distStat").dataset.tip =
      `时段：${SLOT_NAMES[snap.slot] || snap.slot} · 模式：${MODE_NAMES[snap.mode] || snap.mode}\n` +
      (snap.mode === "contact" || snap.mode === "vehicle"
        ? "接触距离：隔街招呼 / 店内对话 / 并肩同行 / 私密。越近话题越深，独处机会出现在最近档。"
        : "尾行距离：目视远端 / 同街 / 身后 / 贴身。越近看得越多，但她的察觉和你的心跳也涨得越快。");
    const order = ["far", "same", "close", "touch"];
    const pipsBox = document.getElementById("pips");
    pipsBox.innerHTML = order
      .map((d) => `<i class="pip${d === snap.dist ? " active" : ""}"></i>`)
      .join("");
    pipsBox.classList.toggle(
      "warm",
      snap.mode === "contact" || snap.mode === "vehicle",
    );
    /* v0.8 身份徽记：吃快照 identity 字段（零楼开局写入引擎，随快照流转） */
    updateIdBadge(snap);
    /* 突发环境音效（暗巷猫叫/庭院狗叫：百分比推导种子判定） */
    if (snap.envSfx) {
      audio.playEnvAudio(snap.envSfx);
      const sfxNotice =
        snap.envSfx === "cat"
          ? "暗巷深处传来野猫受惊的尖叫……"
          : "附近的院落里隐隐传来两声警惕的犬吠……";
      if (!snap.herAlert) snap.herAlert = sfxNotice;
    }
    /* 她的动静警示槽（过档事件亮起，模拟停留两段后自隐） */
    const herAlert = document.getElementById("herAlert");
    if (snap.herAlert) {
      herAlert.textContent = snap.herAlert;
      herAlert.classList.add("show");
      lifecycle.clearTimeout(renderSnapshot._herT);
      renderSnapshot._herT = lifecycle.timeout(
        () => herAlert.classList.remove("show"),
        8000,
      );
    } else herAlert.classList.remove("show");
    /* 携行 + 五维属性 + 阈值标签 + 标签栈 */
    document.getElementById("cash").textContent = snap.player.cash;
    const piEl = document.getElementById("pi");
    piEl.textContent = snap.player.pi;
    piEl.title = `当前目标调查熟练度；已知下一站跟随 +${snap.player.pi >= 40 ? 4 : snap.player.pi >= 20 ? 3 : 2}，未知 +0；60点获得情报检定优势。待结算线索 ${snap.investigation?.pendingClues || 0} 项。`;

    /* ═══ 她的鞋具：只露鞋名，敏捷修正/步声/距离折算细节走悬停 ═══ */
    {
      const shoeLine = document.getElementById("herGear");
      const info = snap.target && snap.target.shoeInfo;
      const SHOE_FALLBACK = {
        heel: ["高跟鞋", -1, 3],
        flats: ["平底鞋", 0, 1],
        sneakers: ["运动鞋", 1, 1],
        barefoot: ["赤脚", 0, 1],
        slippers: ["拖鞋", -1, 2],
        boots: ["靴子", 0, 3],
        platform: ["松糕鞋", -1, 2],
        sandals: ["凉鞋", 0, 2],
        leather: ["小皮鞋", 0, 2],
      };
      const DIST_CN = {
        far: "远端",
        same: "同街",
        close: "身后",
        touch: "贴身",
      };
      const LEVEL_CN = ["静", "轻", "中", "响", "很响", "极响"];
      let row = info;
      if (!row) {
        // 老快照兼容：只有音频码时退回本地表（声级按同街基准）
        const key = String((snap.target && snap.target.shoe) || "").replace(
          /^shoe_/,
          "",
        );
        const fb = SHOE_FALLBACK[key];
        if (fb)
          row = {
            name: fb[0],
            agi: fb[1],
            noise: fb[2],
            level: fb[2],
            distFactor: 1,
          };
      }
      if (shoeLine) {
        if (row) {
          const nameEl = document.getElementById("herGearName");
          if (nameEl) nameEl.textContent = row.name;
          const agiTxt =
            row.agi === 0
              ? "敏捷 不变"
              : `敏捷 ${row.agi > 0 ? "+" : "−"}${Math.abs(row.agi)}`;
          const lv = Math.max(0, Math.min(5, Math.round(row.level)));
          shoeLine.setAttribute(
            "data-tip",
            `${row.name} · ${agiTxt}；步声 ${row.noise} 级，${DIST_CN[snap.dist] || "同街"}时 ${lv} 级（${LEVEL_CN[lv]}）`,
          );
          shoeLine.hidden = false;
        } else {
          shoeLine.hidden = true;
        }
      }
    }

    /* ═══ 接近度五档刻度进度轨 + 悬停近 5 项流水 ═══ */
    const prox = snap.player.proximity ?? 0;
    const proxInput = document.getElementById("prox");
    if (proxInput) proxInput.value = prox;
    const proxValEl = document.getElementById("proxVal");
    if (proxValEl) proxValEl.textContent = prox;
    const proxFillEl = document.getElementById("proxFill");
    if (proxFillEl) proxFillEl.style.width = `${Math.min(prox, 100)}%`;

    const PROX_STAGES = [
      { max: 19, name: "陌生", perk: "无额外减免" },
      { max: 39, name: "眼熟", perk: "她的警觉增益 ×0.8" },
      { max: 59, name: "有交集", perk: "她的警觉增益 ×0.6" },
      { max: 79, name: "可搭话", perk: "防备自然回落加快 · 谎言穿帮宽容" },
      { max: 100, name: "独处不设防", perk: "终局行动门禁解除" },
    ];
    let curStageIdx = 0;
    if (prox >= 80) curStageIdx = 4;
    else if (prox >= 60) curStageIdx = 3;
    else if (prox >= 40) curStageIdx = 2;
    else if (prox >= 20) curStageIdx = 1;
    else curStageIdx = 0;

    const curStage = PROX_STAGES[curStageIdx];
    const proxStageEl = document.getElementById("proxStage");
    if (proxStageEl) proxStageEl.textContent = `【${curStage.name}】`;

    // 渲染 5 个节点状态
    const nodeThresholds = [0, 20, 40, 60, 80];
    const nodeNames = ["0 陌生", "20 眼熟", "40 交集", "60 搭话", "80 不设防"];
    const pnodesHtml = nodeThresholds
      .map((th, idx) => {
        const isPassed = prox >= th;
        const isActive = idx === curStageIdx;
        return `<div class="pnode${isPassed ? " passed" : ""}${isActive ? " active" : ""}" style="left: ${th}%;">
        <span class="pdot"></span>
        <span class="plabel">${nodeNames[idx]}</span>
      </div>`;
      })
      .join("");
    const proxNodesEl = document.getElementById("proxNodes");
    if (proxNodesEl) proxNodesEl.innerHTML = pnodesHtml;

    // 悬停提示：五档说明、距离下一档所需点数、最近 5 次增减明细
    let nextStageText = "已达终局门槛";
    let remainPts = 0;
    if (curStageIdx < 4) {
      const nextTh = nodeThresholds[curStageIdx + 1];
      remainPts = nextTh - prox;
      nextStageText = `【${nodeNames[curStageIdx + 1]}】还需 ${remainPts} 点`;
    }

    const proxLogs =
      snap.proxLog && snap.proxLog.length > 0
        ? snap.proxLog
        : ["（暂无近期变动记录）"];

    const proxTip = `接近度：${prox} / 100【${curStage.name}】
· 下一档进度：${nextStageText}
· 当前特权：${curStage.perk}
─────────────────
最近 5 次增减明细：
${proxLogs.slice(0, 5).join("\n")}`;
    const proxTrackWrapEl = document.getElementById("proxTrackWrap");
    if (proxTrackWrapEl) proxTrackWrapEl.setAttribute("data-tip", proxTip);

    const ATTR_NAMES = {
      str: "体格",
      agi: "敏捷",
      nrv: "胆量",
      int: "情报",
      cha: "口才",
    };
    const a = (snap.player && snap.player.attrs) || {
      str: 5,
      agi: 5,
      nrv: 5,
      int: 5,
      cha: 5,
    };
    /* 实效值 = 基础 + 标签加值（效果只认标签：物品/特质以标签形态供加值） */
    const bonus = {},
      bonusSrc = {};
    for (const t of snap.tags || [])
      for (const e of t.effects || []) {
        if (e.attr) {
          bonus[e.attr] = (bonus[e.attr] || 0) + e.value;
          (bonusSrc[e.attr] = bonusSrc[e.attr] || []).push(t.name);
        }
      }
    const attrsEl =
      document.getElementById("wx-attrs") ||
      document.querySelector("#wx-terminal-dialog #wx-attrs") ||
      document.querySelector(".wx-attrs") ||
      document.getElementById("attrs");
    if (attrsEl) {
      attrsEl.innerHTML = Object.entries(ATTR_NAMES)
        .map(([k, name]) => {
          const base = a[k] ?? 5;
          const b = bonus[k] || 0;
          const eff = base + b;
          const stat = eff >= 8 ? " hot" : eff <= 3 ? " weak" : "";
          const dir = b > 0 ? " eff-up" : b < 0 ? " eff-down" : "";
          const tip =
            b !== 0
              ? `${name} 基础 ${base} ${b > 0 ? "+" : "−"}${Math.abs(b)}（${(bonusSrc[k] || []).join("、")}）＝ ${eff}`
              : `${name} ${base}`;
          return `<div class="attr${dir}${stat}" data-tip="${tip}"><div class="an">${name}</div><div class="av">${eff}</div></div>`;
        })
        .join("");
    }

    /* 阈值标签：具体价值悬停查看，tag 明面上只显示 名字：效果类别（如 不起眼：遮蔽） */
    const TH_DESC = {
      身形醒目: "块头大，容易被人记住：更难隐蔽，她多看你一眼的概率更高",
      不起眼: "瘦小不显眼：更容易藏在人堆里",
      脚步轻: "走路轻巧：听觉类判定更占便宜",
      笨拙: "脚步声重：更容易被听见",
      粗心: "观察粗糙：打量更难看清，运气加成失效",
      结巴: "一紧张就说不出囫囵话",
    };
    const TH_EFFECT_TYPE = {
      身形醒目: "隐蔽",
      不起眼: "遮蔽",
      脚步轻: "听觉",
      笨拙: "声响",
      粗心: "洞察",
      结巴: "交际",
    };
    const TH_VALUE_TIP = {
      身形醒目: "隐蔽 -1",
      不起眼: "遮蔽 +1",
      脚步轻: "听觉 +1",
      笨拙: "声响 -1",
      粗心: "洞察 -1",
      结巴: "交际 -1",
    };
    const TH = [
      [a.str, "身形醒目", 8, 99],
      [a.str, "不起眼", 0, 3],
      [a.agi, "脚步轻", 8, 99],
      [a.agi, "笨拙", 0, 3],
      [a.int, "粗心", 0, 2],
      [a.cha, "结巴", 0, 2],
    ]
      .filter(([v, , lo, hi]) => v != null && v >= lo && v <= hi)
      .map(([v, name]) => name);
    const attrTagsEl =
      document.getElementById("wx-attr-tags") ||
      document.querySelector("#wx-terminal-dialog #wx-attr-tags") ||
      document.getElementById("attrTags");
    if (attrTagsEl) {
      attrTagsEl.innerHTML = TH.map(
        (n) =>
          `<span class="tag" data-tip="【${n}】具体价值：${TH_VALUE_TIP[n]}（${TH_DESC[n]}）｜ 属性被动">${n}</span>`,
      ).join("");
    }

    /* 标签字典规范：既然有颜色区分，去除我方、环境前缀；明面只显示标签名，具体价值悬停查看 */
    const TAG_META = {
      耳机伪装: {
        label: "耳机伪装",
        valueTip: "隐蔽 +2",
        owner: "player",
        desc: "蓝牙耳机常驻伪装，不易引人起疑",
      },
      雨伞遮挡: {
        label: "雨伞遮挡",
        valueTip: "隐蔽 +2",
        owner: "player",
        desc: "伞面遮挡视线与面部",
      },
      护身符: {
        label: "护身符",
        valueTip: "胆量 +1",
        owner: "player",
        desc: "安定心神，胆量检定+1",
      },
      操作变形: {
        label: "变形",
        valueTip: "敏捷 -2",
        owner: "player",
        isDebuff: true,
        desc: "心跳过70，敏捷检定-2",
      },
      操作崩溃: {
        label: "崩溃",
        valueTip: "敏捷 -4",
        owner: "player",
        isDebuff: true,
        desc: "心跳过90，手抖严重敏捷检定-4",
      },
      气喘: {
        label: "气喘",
        valueTip: "全检定 -2",
        owner: "player",
        isDebuff: true,
        desc: "体力<30，呼吸急促全部检定-2",
      },
      脱力: {
        label: "脱力",
        valueTip: "无法奔跑",
        owner: "player",
        isDebuff: true,
        desc: "体力<10，体力透支禁奔跑",
      },

      "优势：情报": {
        label: "优势：情报",
        valueTip: "双骰取高",
        owner: "player",
        isAdvantage: true,
        desc: "当前目标调查熟练度≥60：情报属性检定单骰变双骰（有20必取20/无20有1取1/否则取高）",
      },
      "优势：敏捷": {
        label: "优势：敏捷",
        valueTip: "双骰取高",
        owner: "player",
        isAdvantage: true,
        desc: "敏捷≥10：敏捷属性检定单骰变双骰（天然铁律同上）",
      },
      "优势：体格": {
        label: "优势：体格",
        valueTip: "双骰取高",
        owner: "player",
        isAdvantage: true,
        desc: "体格≥10：体格属性检定单骰变双骰；冲突对抗不吃",
      },
      "优势：口才": {
        label: "优势：口才",
        valueTip: "双骰取高",
        owner: "player",
        isAdvantage: true,
        desc: "口才≥10：口才属性检定单骰变双骰",
      },
      "优势：胆量": {
        label: "优势：胆量",
        valueTip: "甜区上限 +5",
        owner: "player",
        isAdvantage: true,
        desc: "胆量≥10：甜区上限 65→70，甜区档段位税同步拓宽",
      },

      提速: {
        label: "目标·提速",
        valueTip: "跟速 DC +2",
        owner: "target",
        desc: "察觉异样步伐加快，跟速检定DC+2",
      },
      警觉: {
        label: "目标·警觉",
        valueTip: "察觉 +2",
        owner: "target",
        desc: "频频回头观察，反侦察察觉+2",
      },
      结伴: {
        label: "目标·结伴",
        valueTip: "声浪+5 · 胆量+2",
        owner: "target",
        desc: "与同行人并排，声浪+5且胆量+2",
      },
      疲惫: {
        label: "目标·疲惫",
        valueTip: "敏锐 -2",
        owner: "target",
        desc: "神情困顿，敏锐察觉-2",
      },
      高跟鞋: {
        label: "目标·高跟鞋",
        valueTip: "清脆敲击声",
        owner: "target",
        desc: "细高跟鞋，步频清脆，跟钉敲击回响；驱动高跟鞋脚步声",
      },
      平底鞋: {
        label: "目标·平底鞋",
        valueTip: "轻捷踏步声",
        owner: "target",
        desc: "薄底平底单鞋，步履轻捷均匀；驱动平底鞋脚步声",
      },
      运动鞋: {
        label: "目标·运动鞋",
        valueTip: "胶底微摩擦",
        owner: "target",
        desc: "软胶底球鞋，触地静音微抓地摩擦；驱动运动鞋脚步声",
      },
      赤脚: {
        label: "目标·赤脚",
        valueTip: "肉掌触地声",
        owner: "target",
        desc: "脱鞋赤脚，肉掌拍击湿瓷砖/地面微黏声；驱动赤脚脚步声",
      },
      拖鞋: {
        label: "目标·拖鞋",
        valueTip: "啪嗒拖地声",
        owner: "target",
        desc: "居家拖鞋，啪嗒拖行声；驱动拖鞋脚步声",
      },
      靴子: {
        label: "目标·靴子",
        valueTip: "硬底重踏声",
        owner: "target",
        desc: "重底皮革靴子，硬质厚重踏步声；驱动靴子脚步声",
      },
      松糕鞋: {
        label: "目标·松糕鞋",
        valueTip: "厚底钝响",
        owner: "target",
        desc: "厚底松糕鞋，钝重沉闷踏步；驱动松糕鞋脚步声",
      },
      凉鞋: {
        label: "目标·凉鞋",
        valueTip: "细带轻拍声",
        owner: "target",
        desc: "夏日细带凉鞋，细带拍脚后跟轻脆碎步；驱动凉鞋脚步声",
      },
      小皮鞋: {
        label: "目标·小皮鞋",
        valueTip: "真皮干练声",
        owner: "target",
        desc: "硬真皮底乐福鞋/女式单鞋，干练清脆；驱动小皮鞋脚步声",
      },

      雨幕: {
        label: "雨幕",
        valueTip: "隐蔽 +2",
        owner: "scene",
        desc: "雨幕遮蔽视听，自身隐蔽+2",
      },
      湿滑: {
        label: "湿滑",
        valueTip: "敏捷 -2",
        owner: "scene",
        desc: "地面青苔湿滑，敏捷移动-2",
      },
      雨夜掩护: {
        label: "雨幕",
        valueTip: "隐蔽 +2",
        owner: "scene",
        desc: "雨幕遮蔽视听，自身隐蔽+2",
      },
      老石板湿滑: {
        label: "湿滑",
        valueTip: "敏捷 -2",
        owner: "scene",
        desc: "地面青苔湿滑，敏捷移动-2",
      },
      人流掩护: {
        label: "人流",
        valueTip: "隐蔽 +2",
        owner: "scene",
        desc: "密集人潮掩护，不易被锁定",
      },
      暴雨喧嚣: {
        label: "喧嚣",
        valueTip: "脚步声 -3",
        owner: "scene",
        desc: "雷暴雨声压制细碎脚步",
      },
      地面湿滑: {
        label: "湿滑",
        valueTip: "失足 DC +2",
        owner: "scene",
        desc: "积水路滑，奔跑有滑倒风险",
      },
    };

    const tagsEl =
      document.getElementById("tags") ||
      document.querySelector("#wx-terminal-dialog #tags");
    if (tagsEl) {
      tagsEl.innerHTML =
        (snap.tags || [])
          .map((t) => {
            const meta = TAG_META[t.name] || {};
            const owner = t.owner || meta.owner || "player";
            const isFading = t.duration === "scene" && (t.count || 2) <= 1;
            const lifeText =
              t.duration === "flag" ? "持续中" : `剩${t.count || 2}段`;

            let displayName = meta.label;
            if (!displayName) {
              if (owner === "target") displayName = `目标·${t.name}`;
              else displayName = t.name;
            }

            let valueTip =
              meta.valueTip ||
              (t.effects && t.effects.length
                ? t.effects
                    .map((e) =>
                      e.attr
                        ? `${ATTR_NAMES[e.attr]} ${e.value > 0 ? "+" : ""}${e.value}`
                        : "",
                    )
                    .join(" ")
                : "生效中");

            let cls = "tag";
            if (meta.isAdvantage) cls += " advantage";
            else if (owner === "target") cls += " target";
            else if (owner === "scene") cls += " scene";
            else if (
              meta.isDebuff ||
              t.name.includes("变形") ||
              t.name.includes("崩溃") ||
              t.name.includes("气喘") ||
              t.name.includes("脱力")
            )
              cls += " debuff";
            if (isFading) cls += " fading";

            const ownerNameMap = {
              player: "我方状态",
              target: "目标行为",
              scene: "环境修正",
            };
            const tip = `【${displayName}】具体价值：${valueTip}（${meta.desc || "规则标签"}）\n· 归属：${ownerNameMap[owner] || "系统"} · 时长：${lifeText}`;

            return `<span class="${cls}" data-tip="${tip}">${displayName}</span>`;
          })
          .join("") || '<span class="label">无</span>';
    }

    /* 战术行囊持有物动态渲染 */
    renderInventory(snap);

    /* M4-2 行动胶囊动态渲染 */
    renderActionCapsules(snap);

    /* 她的信号流（只记事实） */
    const signalEl = document.getElementById("signal");
    if (signalEl) {
      signalEl.innerHTML =
        (snap.signal || [])
          .map(([tm, txt]) => `<li><time>${tm}</time><span>${txt}</span></li>`)
          .join("") || '<li><span class="label">暂无观察记录</span></li>';
    }
    const assessEl = document.getElementById("assess");
    if (assessEl) {
      assessEl.textContent = snap.assess || "";
      assessEl.style.display = snap.assess ? "" : "none";
    }
    const ledgerEl = document.getElementById("ledger");
    if (ledgerEl) ledgerEl.textContent = snap.ledger || "";

    const floorBadge = document.getElementById("terminalFloorBadge");
    if (floorBadge) {
      const day = (snap.player && snap.player.date) || 1;
      const mName = MODE_NAMES[snap.mode] || snap.mode || "潜行";
      floorBadge.textContent = `第 ${day} 天 · ${mName}阶段`;
    }
    /* ═══ 地图 HUD 渲染 ═══ */
    /* 1. 常驻动线雷达轨 (.route-tracker) */
    const routeTrackerEl = document.getElementById("routeTracker");
    if (routeTrackerEl) {
      const { hasRain, isStorm } = getRainState(snap);
      routeTrackerEl.classList.toggle("is-storm", isStorm);
      routeTrackerEl.classList.toggle("is-rain", !isStorm && hasRain);
      routeTrackerEl.classList.toggle("is-clear", !hasRain);
    }
    const route = snap.route;
    const districtEl = document.getElementById("routeDistrict");
    const placeEl = document.getElementById("routePlace");
    const weatherEl = document.getElementById("routeWeather");
    const remainEl = document.getElementById("routeRemain");
    const stepperEl = document.getElementById("routeStepper");

    // 大区徽章与场所名
    let distBadge = snap.area || "未知";
    if (distBadge.includes("CBD")) distBadge = "CBD";
    else if (distBadge.includes("老城")) distBadge = "老城";
    else if (distBadge.includes("娱乐") || distBadge.includes("红灯"))
      distBadge = "娱乐区";
    else if (distBadge.includes("郊野") || distBadge.includes("豪宅"))
      distBadge = "郊野区";
    else if (distBadge.includes("据点")) distBadge = "据点";
    districtEl.textContent = distBadge;
    const hereIdx = route ? (route.here ?? 0) : 0;
    const isCurrentKnown =
      route && route.known && hereIdx >= 0 ? route.known[hereIdx] : 1;
    placeEl.textContent = (isCurrentKnown ? snap.place : "？") || "移动中";

    // 天气标签：图标走统一单色集，文案去掉自带的 emoji（mock / LLM 都可能带）
    const wKey =
      snap.weather === "storm"
        ? "storm"
        : snap.weather === "rain"
          ? "rain"
          : snap.weather === "clear"
            ? "moon"
            : snap.weather === "day"
              ? "sunny"
              : "moon";
    const wText =
      stripEmoji(snap.weatherName || "") ||
      (snap.weather === "storm"
        ? "暴雨"
        : snap.weather === "rain"
          ? "小雨"
          : "晴夜");
    weatherEl.innerHTML = ico(wKey) + " " + wText;

    // 路线剩余节点与步进轨（未探明地名留出位置显示 ？ 就好）
    if (route && route.nodes && route.nodes.length) {
      const total = route.nodes.length;
      const remainSteps = total - 1 - hereIdx;
      remainEl.dataset.tip =
        "到本次路线终点的剩余节点数，不是行动点或剩余回合。";

      if (snap.mode === "prepare" || hereIdx < 0) {
        remainEl.textContent = "等待行动";
      } else if (remainSteps <= 0) {
        remainEl.textContent = "本段路线结束";
      } else {
        remainEl.textContent = `路线剩余 ${remainSteps} 段`;
      }

      const NODE_ICONS = {
        学校正门: "school",
        老水泥天桥: "bridge",
        "24h便利店": "store",
        居民杂物暗巷: "alley",
        老旧单元楼道: "door",
        写字楼大堂: "office",
        跨街天桥: "bridge",
        地铁枢纽: "subway",
        沿街便利店: "store",
        B2地下车库: "parking",
        酒吧员工后门: "bar",
        大排档夜市: "alley",
        沿江便利店: "store",
        一线天幽湿窄弄: "rain",
        出租屋楼道铁门: "door",
      };
      const stepsHtml = [];
      route.nodes.forEach((nodeName, i) => {
        const isPassed = hereIdx >= 0 && i < hereIdx;
        const isCurrent = i === hereIdx;
        const isTerminal = i === total - 1;
        const isKnown = route.known ? route.known[i] : 1;
        const label = isKnown ? nodeName : "？";
        const icon = isKnown
          ? ico(NODE_ICONS[nodeName] || "pin")
          : ico("unknown");

        if (i > 0) {
          const linePassed = hereIdx >= 0 && i <= hereIdx;
          stepsHtml.push(
            `<div class="step-line ${linePassed ? "passed" : "future"}"></div>`,
          );
        }

        const itemClasses = ["step-item"];
        if (isPassed) itemClasses.push("passed");
        if (isCurrent) itemClasses.push("current");
        if (isTerminal) itemClasses.push("terminal");
        if (!isKnown) itemClasses.push("unknown");

        stepsHtml.push(`
          <div class="${itemClasses.join(" ")}" data-tip="${isKnown ? nodeName : "？"}">
            <span class="step-dot"><i class="step-ico">${icon}</i></span>
            <span class="step-name">${label}</span>
          </div>
        `);
      });
      stepperEl.innerHTML = stepsHtml.join("");
    } else {
      remainEl.textContent = "暂无路线";
      remainEl.dataset.tip = "当前没有路线进度。";
      stepperEl.innerHTML = "";
    }

    /* 2. 抽屉层战术沙盘 (.envbox) */
    const fam = snap.fam ?? 0;
    const famEl = document.getElementById("areaFam");
    famEl.textContent = `熟悉 ${fam}/10` + (fam >= 10 ? " · 熟区" : "");
    document.getElementById("famFill").style.width =
      `${Math.min(fam * 10, 100)}%`;
    document.getElementById("famDesc").textContent =
      fam >= 10 ? "熟区 (刺激减半)" : fam >= 5 ? "半熟" : "生疏";

    // 环境修正标签
    const ENV_OF = {
      rainNight: [
        ["雨幕", "隐蔽 +2，她的脚步更慢"],
        ["夜色", "隐蔽 +2，认脸更难"],
      ],
      night: [["夜色", "隐蔽 +2，认脸更难"]],
      day: [],
      open: [["空旷", "无处可藏：隐蔽 −2"]],
    };
    const SLOT_TAGS = {
      e18_21: [["人流拥挤", "好藏身，也难追逐"]],
      late: [["空旷", "无处可藏：隐蔽 −2"]],
    };
    const envList = [
      ...(ENV_OF[snap.env] || []),
      ...(SLOT_TAGS[snap.slot] || []),
    ];
    document.getElementById("envTags").innerHTML =
      envList
        .map(
          ([n, d]) => `<span class="envtag" data-tip="${n}：${d}">${n}</span>`,
        )
        .join("") || '<span class="label">当前环境无额外修正</span>';

    // 战术通路 exits
    const exits = snap.exits || [];
    document.getElementById("exitChips").innerHTML = exits.length
      ? exits
          .map(
            (e) =>
              `<span class="chip chip-exit"><span class="chip-ico">›</span>${e}</span>`,
          )
          .join("")
      : '<span class="label">无可用分支通路</span>';

    // 战术特殊位 spots（中控给微点 id，前端翻成玩家可见的人话；未映射的兜底显示原 id）
    const SPOT_LABELS = {
      reception: "前台访客登记",
      security_clock: "保安定时巡检",
      pillar_hide: "立柱后躲藏",
      tire_screech: "轮胎锐响位",
      perch_watch: "高处观察点",
      ticket_gate: "闸机口",
      sunken_plaza: "下沉广场",
      bus_wait: "公交候车位",
      window_watch: "橱窗反光位",
      exit_watch: "出口观察位",
      fan_mask: "排风扇掩体",
      ebike_hide: "电驴后躲藏",
      trash_search: "翻找垃圾桶",
      gate_watch: "校门守望位",
      rush_mask: "放学人流掩护",
      park_bench: "公园长椅",
      tree_hide: "树影躲藏",
      sodium_lamp: "老钠灯下",
      corner_shadow: "墙角阴影",
      trash_hide: "垃圾桶后躲藏",
      bike_hide: "单车堆后躲藏",
      trap_corner: "死角陷阱位",
      listen_home: "楼下听动静",
      door_crack: "门缝观察",
      try_handle: "试门把",
      climb_point: "攀爬点",
      drunk_exit: "醉客出口",
      carpool_stand: "拼车候车点",
      bridge_view: "桥头俯望位",
      hangover_cure: "解酒摊",
      river_rail: "江堤护栏边",
      sober_walk: "清醒步道",
      vomit_point: "常被吐脏的墙角",
      reed_hide: "芦苇丛躲藏",
      wet_pavement: "湿滑路面",
      aircon_drip: "空调滴水檐",
      ambush_corner: "伏击拐角",
      spiral_stairs: "旋梯转角",
      clothesline_hide: "晾衣绳后躲藏",
      overlook: "天台俯瞰位",
      curve_hide: "弯道树影躲藏",
      mart_cashier: "超市收银台",
      pump_island: "加油泵岛",
      open_road: "开阔长直路",
      patrol_watch: "巡逻守望位",
      ebike_cache: "藏电驴点",
      tree_ambush: "林间伏击位",
      gate_intercom: "大门对讲机",
      infrared_cam: "红外探头",
      dog_kennel: "狗舍",
      sprinkler: "喷灌草坪",
      pick_side_door: "侧门技术开锁",
      smart_lock: "智能门锁",
      home_safe: "保险柜",
    };
    const spots = snap.spots || [];
    const spotRow = document.getElementById("spotRow");
    if (spots.length) {
      spotRow.style.display = "";
      document.getElementById("spotChips").innerHTML = spots
        .map(
          (s) =>
            `<span class="chip chip-spot" data-tip="${s}"><span class="chip-ico">◎</span>${SPOT_LABELS[s] || s}</span>`,
        )
        .join("");
    } else {
      spotRow.style.display = "none";
    }

    // 逃跑预警 sanctuaryAlert
    const warn = snap.sanctuaryAlert || "";
    const warnRow = document.getElementById("sanctuaryRow");
    if (warn) {
      warnRow.style.display = "";
      document.getElementById("sanctuaryTip").innerHTML =
        `<span class="chip chip-sanctuary"><span class="chip-ico">${ico("warn")}</span>${warn}</span>`;
    } else {
      warnRow.style.display = "none";
    }

    /* 她的警觉：档位 + 五格刻度（终端与心跳弹层共用同一套档位） */
    const alertTier = alertTierOf(snap);
    const pipsHtml = ALERT_TIERS.map(
      (t, i) => `<i class="${i <= alertTier.idx ? "on" : ""}"></i>`,
    ).join("");
    const pipsEl = document.getElementById("alertPips");
    if (pipsEl) pipsEl.innerHTML = pipsHtml;
    const alertTxt = document.getElementById("alertText");
    if (alertTxt) {
      alertTxt.textContent = alertTier.name;
      alertTxt.setAttribute("data-tip", alertTier.tip);
    }
    const alertRowEl = document.getElementById("alertRow");
    if (alertRowEl) alertRowEl.setAttribute("data-tier", String(alertTier.idx));

    /* 心跳弹层右侧窄栏：她的警觉（同档位，不报数） */
    const popPips = document.getElementById("popoverAlertPips");
    if (popPips) popPips.innerHTML = pipsHtml;
    const popText = document.getElementById("popoverAlertText");
    if (popText) {
      popText.textContent = alertTier.name;
      popText.setAttribute("data-tip", alertTier.tip);
    }
    const popRange = document.getElementById("popoverAlertRange");
    if (popRange) popRange.textContent = alertTier.range;
    const popCard = document.getElementById("popoverHerState");
    if (popCard) popCard.setAttribute("data-tier", String(alertTier.idx));

    const prevStatusEl = document.getElementById("previewStatus");
    if (prevStatusEl) {
      prevStatusEl.textContent =
        `心跳 ${view.heart} · 换算 ${bpm} BPM · 体力 ${st}%` +
        (line ? ` · 操作${line === "crash" ? "崩溃" : "变形"}` : " · 手稳");
    }
    /* 心跳历史迷你曲线（近 12 段；真机从中控逐楼快照推入） */
    renderSnapshot._hist = renderSnapshot._hist || [];
    renderSnapshot._hist.push(view.heart);
    if (renderSnapshot._hist.length > 12) renderSnapshot._hist.shift();
    const hist = renderSnapshot._hist;
    document
      .getElementById("sparkLine")
      .setAttribute(
        "points",
        hist
          .map((v, i) => `${(i / 11) * 120},${18 - (v / 100) * 16}`)
          .join(" "),
      );
    /* 猎手状态门禁与环境音效联动更新 */
    if (audio.audioOn) {
      if (HUNTER_MODES[view.mode]) audio.syncAudioTempo();
      audio.updateAudioStatus();
    }
  }
  return renderSnapshot;
}
module.exports = { createSnapshotRenderer };
