"use strict";
const BAND_CN = {
  success: "成功",
  grace: "勉强",
  fail: "失败",
  nat1: "天然1",
  nat20: "大成功",
};
const ACC_CN = {
  stamina: "体力",
  heart: "心跳",
  alert: "警觉",
  pi: "调查熟练度",
  proximity: "接近度",
  cash: "现金",
};

function receiptText(r) {
  const lines = [`【第${r.floor}楼 · 中控结算回执（唯一数值真源）】`];
  const st = r.stats || (r.package && r.package.stats) || {};
  const pkg = r.package || {};

  // 1. 时空环境与站位模式
  const ts = pkg.targetState || st.targetState;
  const startT =
    (ts && ts.route && ts.route.startTime) || (st.route && st.route.startTime);
  let hh = 21;
  let mm = "15";
  if (startT && typeof startT === "string" && startT.includes(":")) {
    const parts = startT.split(":");
    const baseH = parseInt(parts[0], 10) || 21;
    const baseM = parseInt(parts[1], 10) || 0;
    const totalM = baseM + Math.max(0, (r.floor || 1) - 1) * 15;
    hh = baseH + Math.floor(totalM / 60);
    mm = (totalM % 60).toString().padStart(2, "0");
  } else {
    const timeMin = ((r.floor || 1) * 15) % 120;
    hh = 21 + Math.floor(timeMin / 60);
    mm = (timeMin % 60).toString().padStart(2, "0");
  }
  const timeStr = `周三 ${hh}:${mm}`;

  const weatherKey = (st.world && st.world.weather) || "clear";
  const weatherDesc =
    {
      clear: "秋末晴夜（干燥清冷，街灯通明）",
      rain: "秋末冷雨夜（地面湿滑，沥青反光，雨伞遮蔽视线）",
      storm: "秋末暴雨夜（狂风暴雨，积水漫溢，视线受限）",
      fog: "秋末夜雾（浓雾弥漫，能见度低，声响沉闷）",
    }[weatherKey] || "秋末冷雨夜（地面湿滑沥青反光）";

  const modeKey = st.mode || "stealth";
  const modeDesc =
    {
      stealth: "潜行跟缀（明暗隔离态，目标未察觉正面存在，不可当面对话）",
      contact: "接触攀谈（正面相对态，可展开言语交流）",
      lock: "门锁博弈（专注锁具物理交互）",
      endgame: "终局控制（身体对抗与束缚）",
    }[modeKey] || "潜行跟缀";

  const distKey = st.dist || "same";
  const distDesc =
    {
      far: "远端（约30米以上，仅能辨别身形轮廓，不可感知微表情）",
      same: "同街（约15-20米，必须依托沿街障碍遮蔽，严禁近身触碰）",
      street: "同街（约15-20米，必须依托沿街障碍遮蔽，严禁近身触碰）",
      close: "身后（约3-5米，脚步声与身形清晰，高危戒备区）",
      behind: "身后（约3-5米，脚步声与身形清晰，高危戒备区）",
      touch: "贴身（1米以内，可及肢体与呼吸声）",
    }[distKey] || "同街（约15-20米）";

  const sanc = st.sanctuaryAlert ? `｜逃逸向导：${st.sanctuaryAlert}` : "";

  /* 她本楼所在的地点：由引擎的时刻表推进（route.here → currentPlace），这里只是把它写成硬约束。
     模型只能在这个场所里展开画面，不得自行把她挪到别处、也不得提前抵达下一站。 */
  const placeName =
    (ts && ts.route && ts.route.currentPlace) || st.place || null;
  const placeStr = placeName ? `地点：[${placeName}]｜` : "";

  lines.push(`[时空与环境] 时间：${timeStr}｜${placeStr}环境：${weatherDesc}`);
  lines.push(
    `[站位与模式] 交互模式：${modeDesc}｜相对距离：${distDesc}${sanc}`,
  );

  // 2. 动作裁决（去原始算式噪音，保留定性成败）
  if (pkg.narrativeOnly) {
    lines.push(
      "本轮玩家未点选任何动作胶囊：纯叙事推进，不得凭空发生检定或体力/心跳/警觉变动。",
    );
  } else if (pkg.actions && pkg.actions.length) {
    lines.push("[动作裁决]");
    for (const a of pkg.actions) {
      const actName = a.label || a.name;
      if (a.rejected) {
        // 条件门槛（缺工具 / 距离不够 / 不在门前）：动作没做成，正文不许写成成功
        lines.push(`- ${actName}：未执行（${a.reason || "当前条件不满足"}）`);
        continue;
      }
      if (a.noRoll) {
        lines.push(`- ${actName}：${a.text || "完成（无检定）"}`);
        continue;
      }
      const isFail = a.band === "fail" || a.band === "crit_fail";
      const bandStr = BAND_CN[a.band] || (isFail ? "未达成" : "达成");
      let detail = a.text || "";
      if (isFail && !detail) {
        if (actName.includes("潜行") || actName.includes("藏匿"))
          detail = "踩中积水或碎杂物引发细微动静，引起反光注意";
        else if (
          actName.includes("拍照") ||
          actName.includes("打量") ||
          actName.includes("观察")
        )
          detail = "视线被雨伞与行人物件遮挡，角度不佳";
        else if (actName.includes("锁") || actName.includes("撬"))
          detail = "锁芯锈死卡涩，发出金属碰撞脆响";
        else detail = "受限于现场环境突发干扰，动作受阻";
      }
      lines.push(
        `- ${actName}：${bandStr}${detail ? "（" + detail + "）" : ""}`,
      );
    }
  }

  // 3. 叙事断点原则（失败时必发）
  if (pkg.alertEvent) {
    lines.push(
      `- 她的过档反应：${pkg.alertEvent.kind}（${pkg.alertEvent.detail}）`,
    );
  }
  if (pkg.capture) {
    const cn = {
      front: "正面",
      side: "侧面",
      back: "背面",
      "three-quarter": "斜侧",
    };
    const al = pkg.stats && pkg.stats.album ? pkg.stats.album : null;
    lines.push(
      `- 拍照成果：${pkg.capture.name} · ${cn[pkg.capture.angle] || pkg.capture.angle}` +
        (al ? `（相册 ${al.count}/${al.total}）` : "") +
        `；PI +${pkg.capture.piBonus}`,
    );
  }
  const fails = (pkg.actions || []).filter(
    (a) => a.band === "fail" || a.band === "crit_fail",
  );
  if (fails.length) {
    const failNames = fails.map((a) => a.label || a.name).join("、");
    lines.push(
      `【叙事断点原则】：玩家输入的内容仅为其“主观预想与动作尝试”。判定为未达成（${failNames} 失败/意外），玩家描写的成功预想未发生！请在正文承接尝试细节，随即描写突发意外阻碍与真实挫折后果。`,
    );
  }

  // 4. 目标当前态势与行为焦点（白描约束）
  if (ts) {
    lines.push("【目标当前态势与行为焦点（白描约束）】");
    const defaultTargetName = st.targetId === "college" ? "林若雪" : "陈雨婷";
    const targetName =
      (st.target && (st.target.realName || st.target.name)) ||
      ts.targetName ||
      defaultTargetName;
    if (st.target) {
      lines.push(`- 目标人物：${targetName}`);
    }
    if (ts.route) {
      const curLoc = ts.route.currentPlace ? `[${ts.route.currentPlace}] ` : "";
      const noteStr = ts.route.note ? `[${ts.route.note}] ` : "";
      lines.push(
        `- 动线情境：${curLoc}${noteStr}${ts.route.prompt || ""}`.trim(),
      );
    }
    if (placeName) {
      lines.push(
        `- 当前位置：[${placeName}]（本楼她只在这里；严禁把她写到别的场所，也严禁提前抵达下一站——地点变更只认回执里的「目标动向推进」）`,
      );
    }
    if (ts.outfit) {
      lines.push(
        `- 当前着装：[${ts.outfit.name}] ${ts.outfit.desc}。${ts.outfit.prompt || ""}`,
      );
    }
    if (ts.somatic) {
      const modStr = Object.entries(ts.somatic.mod || {})
        .map(([k, v]) => `${k.toUpperCase()} ${v > 0 ? "+" : ""}${v}`)
        .join(" ");
      lines.push(
        `- 情绪身心：[${ts.somatic.name}] ${ts.somatic.reason}${modStr ? `（${modStr}）` : ""}。${ts.somatic.prompt || ""}`,
      );
    }
    if (ts.hand) {
      let handExtra = "";
      if (ts.hand.fumbling) {
        handExtra =
          " ⚠️【破绽暴露：低感知翻找态，注意力被手中事务占满，视线脱离周围环境，白描其专注找物、背身无备细节】";
      } else if (ts.hand.isCarriage) {
        handExtra = " 🚇【车厢情境：随车体晃荡而微摆，与外界声音封闭隔离】";
      }
      lines.push(`- 双手焦点：[${ts.hand.name}] ${ts.hand.desc}${handExtra}`);
    }
    const herAlert = pkg.herAlert || st.herAlert;
    if (herAlert) {
      lines.push(`- 警觉反应：${herAlert}`);
    }
  }

  // 5. 纪律底注与微观时间切片
  lines.push(
    "纪律：单轮正文仅限当前场所约 1~2 分钟微观切片，描写完最新动静后即刻定格；本轮动作与数值已由中控封账，正文照此回执演绎，成败不得篡改；文末按规申报事实。",
  );
  return lines.join("\n");
}

module.exports = { receiptText };
