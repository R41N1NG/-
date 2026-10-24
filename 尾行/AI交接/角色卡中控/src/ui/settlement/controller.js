"use strict";
const {
  V_3D,
  Q_3D,
  buildIcosahedron,
  SETTLE_GEO,
  getFaceTargetQuat,
} = require("./geometry.js");

// 判定台只依赖 DOM 与只读音频/心跳接口，不直接引用状态栏内部变量。
function createSettlement({
  document,
  lifecycle,
  window,
  getAudioContext,
  getHeart,
  heartToBpm,
}) {
  const SETTLE = { auto: false };
  const SETTLE_BAND_CN = {
    success: "成功",
    grace: "勉强过关",
    fail: "检定失败",
    nat1: "大失败",
    nat20: "大成功",
  };
  const SETTLE_ACC_CN = {
    stamina: "体力消耗",
    heart: "心跳进账",
    alert: "警觉变动",
    pi: "PI熟练度",
    proximity: "接近度推进",
    cash: "现金",
  };

  /* 1. 向量与四元数轻量数学核心 */

  /* 2. 正二十面体几何建模 */

  /* 3. 专属 Web Audio 物理触感合成器 */
  let settleAudioCtx = null;
  function getSettleAudio() {
    const sharedContext = getAudioContext();
    if (sharedContext && sharedContext.state === "running")
      return sharedContext;
    try {
      if (!settleAudioCtx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (AC) settleAudioCtx = new AC();
      }
      if (settleAudioCtx && settleAudioCtx.state === "suspended") {
        settleAudioCtx.resume();
      }
      return settleAudioCtx;
    } catch (e) {
      return null;
    }
  }

  function playTickSound(vol = 0.035, pitch = 700) {
    const ctx = getSettleAudio();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(pitch, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.035);
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.035);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } catch (e) {}
  }

  function playChipSound(isHidden = false) {
    const ctx = getSettleAudio();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const f0 = isHidden ? 380 : 880;
      osc.type = isHidden ? "sawtooth" : "sine";
      osc.frequency.setValueAtTime(f0, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(
        f0 * 1.25,
        ctx.currentTime + 0.05,
      );
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.07);
    } catch (e) {}
  }

  function playCritSuccessSound() {
    const ctx = getSettleAudio();
    if (!ctx) return;
    try {
      const notes = [1046.5, 1318.5, 1567.9, 2093.0];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startTime = ctx.currentTime + idx * 0.055;
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, startTime);
        osc.frequency.exponentialRampToValueAtTime(
          freq * 1.015,
          startTime + 0.35,
        );

        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.linearRampToValueAtTime(0.12, startTime + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.65);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.7);
      });
    } catch (e) {}
  }

  function playCritFailSound() {
    const ctx = getSettleAudio();
    if (!ctx) return;
    try {
      const t0 = ctx.currentTime;
      const subOsc = ctx.createOscillator();
      const subGain = ctx.createGain();
      subOsc.type = "sawtooth";
      subOsc.frequency.setValueAtTime(145, t0);
      subOsc.frequency.exponentialRampToValueAtTime(32, t0 + 0.45);
      subGain.gain.setValueAtTime(0.25, t0);
      subGain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.55);
      subOsc.connect(subGain);
      subGain.connect(ctx.destination);
      subOsc.start(t0);
      subOsc.stop(t0 + 0.6);

      [174.6, 185.0].forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "square";
        osc.frequency.setValueAtTime(freq, t0 + 0.03);
        gain.gain.setValueAtTime(0.08, t0 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.48);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t0 + 0.03);
        osc.stop(t0 + 0.5);
      });
    } catch (e) {}
  }

  function playSuccessSound() {
    const ctx = getSettleAudio();
    if (!ctx) return;
    try {
      const t0 = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(587.3, t0);
      osc.frequency.exponentialRampToValueAtTime(880, t0 + 0.16);
      gain.gain.setValueAtTime(0.12, t0);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + 0.28);
    } catch (e) {}
  }

  function playNormalSound(isGrace) {
    const ctx = getSettleAudio();
    if (!ctx) return;
    try {
      const t0 = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = isGrace ? "triangle" : "sawtooth";
      const f0 = isGrace ? 440 : 260;
      osc.frequency.setValueAtTime(f0, t0);
      osc.frequency.exponentialRampToValueAtTime(f0 * 0.7, t0 + 0.18);
      gain.gain.setValueAtTime(0.1, t0);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + 0.25);
    } catch (e) {}
  }

  /* 4. 渲染管线与状态机 */
  let settleCanvas = null;
  let settleCtx = null;
  let settleCurQuat = Q_3D.id();
  let settleAngularVel = [0.03, 0.04, 0.02];
  let settleRollState = "IDLE";
  let settleTargetVal = 14;
  let settleTargetFace = null;
  let settleAlignStartQuat = null;
  let settleAlignTargetQuat = null;
  let settleAlignProgress = 0;
  let settleBounceHeight = 0;
  let settleBounceT = 0;
  let settleAnimId = null;
  let settleLastTime = performance.now();
  let settleQueueResolve = null;
  let settleCurrentAction = null;
  let settleIsDragging = false;
  let settleLastMouse = [0, 0];

  const SETTLE_THEME = {
    faceFillA: "#151d2a",
    faceFillB: "#0a0e16",
    edgeStroke: "rgba(80, 140, 210, 0.45)",
    edgeWidth: 1.8,
    frontEdgeGlow: "rgba(100, 180, 255, 0.85)",
    textColor: "#8eb6e6",
    textLit: "#ffffff",
    specularPow: 14,
  };
  const SETTLE_LIGHT = V_3D.norm([0.4, -0.8, 1.2]);

  function renderSettleCanvas() {
    if (!settleCanvas) {
      settleCanvas = document.getElementById("settleDieCanvas");
      if (settleCanvas) settleCtx = settleCanvas.getContext("2d");
    }
    if (!settleCtx) return;

    const W = settleCanvas.width,
      H = settleCanvas.height;
    const RADIUS = 155;
    settleCtx.clearRect(0, 0, W, H);

    const transVerts = SETTLE_GEO.verts.map((v) => {
      const r = Q_3D.rotateVec(settleCurQuat, v);
      const zScale = 1 + r[2] * 0.18;
      const x = W / 2 + r[0] * RADIUS * zScale;
      const y = H / 2 - settleBounceHeight + r[1] * RADIUS * zScale;
      return { x, y, z: r[2], orig: v };
    });

    const sortedFaces = SETTLE_GEO.faces
      .map((f) => {
        const rotatedCenter = Q_3D.rotateVec(settleCurQuat, f.center);
        const rotatedNorm = Q_3D.rotateVec(settleCurQuat, f.n);
        return {
          face: f,
          z: rotatedCenter[2],
          center2d: {
            x: W / 2 + rotatedCenter[0] * RADIUS,
            y: H / 2 - settleBounceHeight + rotatedCenter[1] * RADIUS,
          },
          norm: rotatedNorm,
          isFront: rotatedNorm[2] > 0.05,
        };
      })
      .sort((a, b) => a.z - b.z);

    sortedFaces.forEach((sf) => {
      const f = sf.face;
      const pts = f.indices.map((idx) => transVerts[idx]);
      const norm = sf.norm;
      const isFront = sf.isFront;

      if (!isFront) return;

      const diff = Math.max(0, V_3D.dot(norm, SETTLE_LIGHT));
      const halfV = V_3D.norm(V_3D.add(SETTLE_LIGHT, [0, 0, 1]));
      const spec = Math.pow(
        Math.max(0, V_3D.dot(norm, halfV)),
        SETTLE_THEME.specularPow,
      );

      settleCtx.beginPath();
      settleCtx.moveTo(pts[0].x, pts[0].y);
      settleCtx.lineTo(pts[1].x, pts[1].y);
      settleCtx.lineTo(pts[2].x, pts[2].y);
      settleCtx.closePath();

      const isTargetCenter =
        (settleRollState === "SETTLED" || settleRollState === "BOUNCING") &&
        f.value === settleTargetVal &&
        norm[2] > 0.9;

      if (isTargetCenter) {
        settleCtx.fillStyle =
          settleTargetVal === 20
            ? "#282012"
            : settleTargetVal === 1
              ? "#2a1116"
              : "#142030";
      } else {
        settleCtx.fillStyle = SETTLE_THEME.faceFillA;
      }
      settleCtx.fill();

      settleCtx.fillStyle = `rgba(255,255,255,${(diff * 0.15 + spec * 0.35).toFixed(3)})`;
      settleCtx.fill();

      if (isTargetCenter) {
        settleCtx.save();
        settleCtx.strokeStyle =
          settleTargetVal === 20
            ? "#ffe699"
            : settleTargetVal === 1
              ? "#ff8a9c"
              : "#7fe3d4";
        settleCtx.lineWidth = 4;
        settleCtx.shadowColor = settleCtx.strokeStyle;
        settleCtx.shadowBlur = 18;
        settleCtx.stroke();
        settleCtx.restore();
      } else {
        settleCtx.strokeStyle = SETTLE_THEME.edgeStroke;
        settleCtx.lineWidth = SETTLE_THEME.edgeWidth;
        settleCtx.stroke();
      }

      if (norm[2] > 0.28) {
        settleCtx.save();
        settleCtx.translate(sf.center2d.x, sf.center2d.y);

        const rotatedU = Q_3D.rotateVec(settleCurQuat, f.u);
        const ang = Math.atan2(rotatedU[0], -rotatedU[1]);
        settleCtx.rotate(ang);

        if (isTargetCenter) {
          settleCtx.font = "900 36px Consolas, monospace";
          settleCtx.textAlign = "center";
          settleCtx.textBaseline = "middle";

          if (settleTargetVal === 20) {
            settleCtx.fillStyle = "#fff9e6";
            settleCtx.shadowColor = "#ffd700";
            settleCtx.shadowBlur = 24;
          } else if (settleTargetVal === 1) {
            settleCtx.fillStyle = "#ffd6dc";
            settleCtx.shadowColor = "#ff385c";
            settleCtx.shadowBlur = 24;
          } else {
            settleCtx.fillStyle = "#ffffff";
            settleCtx.shadowColor = SETTLE_THEME.frontEdgeGlow;
            settleCtx.shadowBlur = 18;
          }
        } else {
          const scale = Math.max(0.4, norm[2]);
          settleCtx.scale(scale, scale);
          settleCtx.font = "700 22px Consolas, monospace";
          settleCtx.textAlign = "center";
          settleCtx.textBaseline = "middle";
          settleCtx.fillStyle = SETTLE_THEME.textColor;
        }

        settleCtx.fillText(String(f.value), 0, 0);
        settleCtx.restore();
      }
    });
  }

  function animateSettle(now) {
    const dt = Math.min(32, now - settleLastTime) / 1000;
    settleLastTime = now;

    const shadowEl = document.getElementById("settleDieShadow");

    if (settleRollState === "SUSTAINED") {
      const speed = Math.hypot(...settleAngularVel);
      if (speed > 0.001) {
        const axis = V_3D.norm(settleAngularVel);
        const dq = Q_3D.fromAxis(axis, speed);
        settleCurQuat = Q_3D.mul(settleCurQuat, dq);
      }
      settleBounceHeight = Math.abs(Math.sin(now * 0.018)) * 14;
      if (shadowEl)
        shadowEl.style.transform = `scale(${1 - settleBounceHeight * 0.006})`;
      if (Math.random() < 0.25) playTickSound(0.035, 350 + Math.random() * 450);
    } else if (settleRollState === "DAMPING") {
      const speed = Math.hypot(...settleAngularVel);
      if (speed > 0.001) {
        const axis = V_3D.norm(settleAngularVel);
        const dq = Q_3D.fromAxis(axis, speed);
        settleCurQuat = Q_3D.mul(settleCurQuat, dq);
      }
      settleAngularVel = V_3D.mul(settleAngularVel, 0.955);
      settleBounceHeight = Math.abs(Math.sin(now * 0.015)) * (speed * 75);
      if (shadowEl)
        shadowEl.style.transform = `scale(${1 - settleBounceHeight * 0.006})`;
      if (Math.random() < 0.2 && speed > 0.06)
        playTickSound(0.04, 250 + Math.random() * 300);

      if (speed < 0.075) {
        settleRollState = "ALIGNING";
        settleAlignStartQuat = settleCurQuat;
        settleAlignTargetQuat = getFaceTargetQuat(settleTargetFace);
        settleAlignProgress = 0;
      }
    } else if (settleRollState === "ALIGNING") {
      settleAlignProgress += dt * 3.4;
      if (settleAlignProgress >= 1) {
        settleCurQuat = settleAlignTargetQuat;
        settleRollState = "BOUNCING";
        settleBounceT = 0;
      } else {
        const t = 1 - Math.pow(1 - settleAlignProgress, 3);
        settleCurQuat = Q_3D.slerp(
          settleAlignStartQuat,
          settleAlignTargetQuat,
          t,
        );
        settleBounceHeight = Math.sin((1 - settleAlignProgress) * Math.PI) * 12;
        if (shadowEl)
          shadowEl.style.transform = `scale(${1 - settleBounceHeight * 0.006})`;
      }
    } else if (settleRollState === "BOUNCING") {
      settleBounceT += dt;
      settleBounceHeight = Math.max(
        0,
        Math.sin(settleBounceT * 26) * Math.exp(-settleBounceT * 10) * 10,
      );
      if (shadowEl)
        shadowEl.style.transform = `scale(${1 - settleBounceHeight * 0.005})`;

      if (settleBounceT > 0.32) {
        settleRollState = "SETTLED";
        settleBounceHeight = 0;
        if (shadowEl) shadowEl.style.transform = "scale(1)";
        onSettleSettled();
      }
    }

    renderSettleCanvas();
    if (settleRollState !== "IDLE") {
      settleAnimId = lifecycle.frame(animateSettle);
    }
  }

  function stopSettleAnimation() {
    if (settleAnimId) {
      lifecycle.cancelFrame(settleAnimId);
      settleAnimId = null;
    }
    settleRollState = "IDLE";
  }

  function onSettleSettled() {
    const act = settleCurrentAction;
    if (!act) return;
    const isNat20 = settleTargetVal === 20;
    const isNat1 = settleTargetVal === 1;
    const isFail = act.band === "fail" || isNat1;
    const isGrace = act.band === "grace";
    const isCrit = act.band === "crit" || act.band === "nat20" || isNat20;

    if (isCrit) playCritSuccessSound();
    else if (isNat1) playCritFailSound();
    else if (act.band === "success") playSuccessSound();
    else playNormalSound(isGrace);

    const stage = document.getElementById("settleConsole");
    const vBadge = document.getElementById("settleVerdictBadge");
    const mathLine = document.getElementById("settleMathLine");
    const flash = document.getElementById("settleFlashOverlay");
    const hud = document.getElementById("settleHudStatus");
    const ledgerWrap = document.getElementById("settleLedgerWrap");
    const darkCard = document.getElementById("settleDarkRevealCard");

    let bandClass = "success",
      verdictTxt = "成 功";
    if (isCrit) {
      bandClass = "crit";
      verdictTxt = "大 成 功";
      stage?.classList.add("shake-crit");
    } else if (isNat1) {
      bandClass = "fail";
      verdictTxt = "大 失 败";
      stage?.classList.add("shake-fail");
    } else if (isFail) {
      bandClass = "fail";
      verdictTxt = "检 定 失 败";
      stage?.classList.add("shake-fail");
    } else if (isGrace) {
      bandClass = "grace";
      verdictTxt = "勉 强 过 关";
    }

    if (stage) stage.className = `stage-console settled ${bandClass}`;
    if (vBadge) {
      vBadge.textContent = `${settleTargetVal} · ${verdictTxt}`;
      vBadge.className = `verdict-badge show ${bandClass}`;
    }

    if (flash)
      flash.className = `flash-overlay ${bandClass === "fail" ? "bad" : bandClass === "crit" ? "crit" : "ok"}`;

    const totalMod =
      (act.mods || []).reduce((s, m) => s + (m.v || 0), 0) +
      (act.attr ? act.attr.v : 0);
    const finalScore = act.total ?? settleTargetVal + totalMod;
    if (mathLine)
      mathLine.innerHTML = `1d20(<b>${settleTargetVal}</b>) +${totalMod}修正 = <b>${finalScore}</b> vs DC ${act.dc}`;

    const ledgerItems = [];
    if (act.workIncome) {
      const w = act.workIncome;
      ledgerItems.push({
        label: "本次总收入",
        val: `¥ ${w.total}`,
        type: "gain work-total",
      });
      ledgerItems.push({ label: "底薪", val: `¥ ${w.base}`, type: "" });
      ledgerItems.push({
        label: w.bonus > 0 ? "判定额外收入" : "本次未获额外收入",
        val: `+ ¥ ${w.bonus}`,
        type: w.bonus > 0 ? "gain work-bonus" : "work-no-bonus",
      });
    }
    if (act.distanceDC)
      ledgerItems.push({
        label: "远端跟随难度",
        val: `DC +${act.distanceDC}`,
        type: "warn",
      });
    if (act.ledger && act.ledger.applied) {
      const aMap = {
        proximity: "接近度推进",
        heart: "心跳进账",
        alert: "警觉变动",
        stamina: "体力消耗",
        pi: "PI熟练度",
        cash: "现金收入",
      };
      for (const [k, v] of Object.entries(act.ledger.applied)) {
        if (!v || (k === "cash" && act.workIncome)) continue;
        const isWarn =
          (k === "stamina" && v < 0) ||
          (k === "heart" && v > 0) ||
          (k === "alert" && v > 0);
        const isGain = ["proximity", "pi", "cash"].includes(k) && v > 0;
        ledgerItems.push({
          label: aMap[k] || k,
          val: `${v > 0 ? "+" : ""}${v}`,
          type: isWarn ? "warn" : isGain ? "gain" : "",
        });
      }
    }
    if (act.pkgAccount) {
      const acc = act.pkgAccount;
      if (ledgerItems.length === 0) {
        if (acc.proximity)
          ledgerItems.push({
            label: "接近度推进",
            val: `${acc.proximity > 0 ? "+" : ""}${acc.proximity}`,
            type: acc.proximity > 0 ? "gain" : "",
          });
        if (acc.heart)
          ledgerItems.push({
            label: "心跳净增",
            val: `${acc.heart > 0 ? "+" : ""}${acc.heart} bpm`,
            type: acc.heart > 0 ? "warn" : "gain",
          });
        if (acc.alert)
          ledgerItems.push({
            label: "警觉变动",
            val: `${acc.alert > 0 ? "+" : ""}${acc.alert}`,
            type: acc.alert > 0 ? "warn" : "gain",
          });
        if (acc.stamina)
          ledgerItems.push({
            label: "体力开支",
            val: `${acc.stamina}`,
            type: acc.stamina < 0 ? "warn" : "gain",
          });
        if (acc.pi)
          ledgerItems.push({
            label: "PI熟练度收益",
            val: `+${acc.pi}`,
            type: "gain",
          });
      }
    }
    if (act.exposure)
      ledgerItems.push({
        label: "近距离暴露",
        val: `${act.exposure.base} − 敏捷${act.exposure.reduction} = +${act.exposure.applied}`,
        type: "warn",
      });
    if (act.discoveries?.length)
      ledgerItems.push({
        label: "首次线索",
        val: `${act.discoveries.length}项 · PI +${act.discoveries.reduce((s, c) => s + c.pi, 0)}（${act.investigationReceipt ? "已结算" : "待尾行结算"}）`,
        type: "gain",
      });
    if (act.investigationReceipt) {
      const receipt = act.investigationReceipt;
      ledgerItems.push({
        label: "整段结算",
        val: `保底 +${receipt.minimum} · 线索 +${receipt.clueGain}`,
        type: "gain",
      });
    }
    if (act.investigationReceipt)
      ledgerItems.push({
        label: "PI到账",
        val: `+${act.investigationReceipt.pi}`,
        type: "gain",
      });
    if (isNat20)
      ledgerItems.push({ label: "天然 20", val: "大成功", type: "gain" });
    if (act.attributeUnlock) {
      const attr = act.attributeUnlock;
      ledgerItems.push({
        label: "额外收益",
        val: `目标${attr.name} ${attr.value} 已解锁`,
        type: "gain",
      });
    } else if (act.attributeUnlockEmpty) {
      ledgerItems.push({
        label: "属性已齐",
        val: "无新的属性可解锁",
        type: "",
      });
    }
    if (act.pkgSeg && act.pkgSeg.staminaTax) {
      const taxVal = Number(act.pkgSeg.staminaTax);
      ledgerItems.push({
        label: "体力段位税",
        val: `${taxVal > 0 ? "-" + taxVal : taxVal}`,
        type: "warn",
      });
    }
    if (ledgerItems.length === 0) {
      ledgerItems.push({ label: "态势账目", val: "平衡维持", type: "" });
    }

    if (ledgerWrap) {
      ledgerWrap.innerHTML = "";
      ledgerItems.forEach((item, lIdx) => {
        lifecycle.timeout(() => {
          const row = document.createElement("div");
          row.className = `ledger-row ${item.type || ""}`;
          row.innerHTML = `<span>${item.label}</span><span class="val">${item.val}</span>`;
          ledgerWrap.appendChild(row);
          lifecycle.frame(() => row.classList.add("show"));
        }, lIdx * 65);
      });
    }

    if (act.darkReveal && darkCard) {
      lifecycle.timeout(() => {
        darkCard.innerHTML = `<b>[暗账揭秘]</b> ${act.darkReveal}`;
        darkCard.classList.add("show");
      }, 300);
    }

    if (hud)
      hud.textContent = `RESULT LOCKED: [ ${settleTargetVal} ] · CHECK FINISHED`;

    if (typeof settleQueueResolve === "function") {
      const res = settleQueueResolve;
      settleQueueResolve = null;
      res();
    }
  }

  function playOneSettleAction(act, idx, totalCount, account, seg) {
    return new Promise((resolve) => {
      settleQueueResolve = resolve;
      act.pkgAccount = account;
      act.pkgSeg = seg;
      settleCurrentAction = act;
      settleTargetVal = act.d20 || 10;
      settleTargetFace =
        SETTLE_GEO.faces.find((f) => f.value === settleTargetVal) ||
        SETTLE_GEO.faces[0];

      const stage = document.getElementById("settleConsole");
      if (stage) stage.className = "stage-console";

      settleAngularVel = [
        (Math.random() - 0.5) * 0.5 + 0.35,
        (Math.random() - 0.5) * 0.5 + 0.35,
        (Math.random() - 0.5) * 0.4,
      ];
      settleRollState = "SUSTAINED";

      const badge = document.getElementById("settleActBadge");
      if (badge) badge.textContent = `▸ ${act.label || act.name}`;
      const modsStack = document.getElementById("settleModsStack");
      if (modsStack) modsStack.innerHTML = "";

      const ekgHeart = document.getElementById("settleEkgHeart");
      if (ekgHeart) {
        const state = act.heartState;
        const heart = state?.value ?? getHeart();
        const low = state?.sweetLow ?? 40,
          high = state?.sweetHigh ?? 65;
        const label =
          heart >= low && heart <= high
            ? "甜区"
            : heart < low
              ? "平稳"
              : heart >= 90
                ? "过载"
                : "高压";
        const bpm = heartToBpm(heart);
        ekgHeart.textContent = `${bpm} BPM · ${label}`;
        ekgHeart.title = state
          ? `判定时心跳${heart}；甜区${low}–${high}`
          : `当前心跳${heart}`;
      }

      const vBadge = document.getElementById("settleVerdictBadge");
      if (vBadge) {
        vBadge.className = "verdict-badge";
        vBadge.textContent = "测算中 …";
      }
      const mathLine = document.getElementById("settleMathLine");
      if (mathLine) mathLine.textContent = "—";
      const ledgerWrap = document.getElementById("settleLedgerWrap");
      if (ledgerWrap)
        ledgerWrap.innerHTML =
          '<div class="ledger-row show"><span>筹码注入中，等待定格 …</span></div>';

      const darkCard = document.getElementById("settleDarkRevealCard");
      if (darkCard) {
        darkCard.className = "dark-reveal-card";
        darkCard.innerHTML = "";
      }

      const hud = document.getElementById("settleHudStatus");
      if (hud) {
        hud.textContent =
          totalCount > 1
            ? `[ 判定 ${idx + 1}/${totalCount} ] · INJECTING MODIFIERS …`
            : "INJECTING MODIFIERS …";
      }

      playTickSound(0.08, 600);

      const chipList = [];
      if (act.attr) {
        chipList.push({ name: `${act.attr.name}属性`, v: act.attr.v });
      }
      for (const m of act.mods || []) {
        chipList.push({
          name: m.name || m.src || "修正",
          v: m.v,
          ripple: m.ripple,
        });
      }
      if (act.targetMod && act.targetMod !== 0) {
        chipList.push({ name: "她的暗账 ??", v: act.targetMod, hidden: true });
      } else if (act.darkReveal) {
        chipList.push({ name: "目标防备 ??", v: 0, hidden: true });
      }

      const CHIP_GAP = 320;
      const START_T = 260;

      chipList.forEach((m, mIdx) => {
        lifecycle.timeout(
          () => {
            if (settleRollState !== "SUSTAINED") return;
            const chip = document.createElement("div");
            chip.className =
              "chip-item" +
              (m.hidden ? " hidden-mod" : "") +
              (m.ripple ? " ripple-mod" : "");
            chip.innerHTML = `<span>${m.name}</span><b>${m.v >= 0 ? "+" : ""}${m.v}</b>`;
            if (modsStack) modsStack.appendChild(chip);
            playChipSound(m.hidden);
          },
          START_T + mIdx * CHIP_GAP,
        );
      });

      const totalInjectTime = START_T + chipList.length * CHIP_GAP + 240;
      lifecycle.timeout(() => {
        if (settleRollState === "SUSTAINED") {
          if (hud) {
            hud.textContent =
              totalCount > 1
                ? `[ 判定 ${idx + 1}/${totalCount} ] · MODIFIERS LOCKED · DECELERATING …`
                : "MODIFIERS LOCKED · DECELERATING …";
          }
          settleRollState = "DAMPING";
        }
      }, totalInjectTime);
    });
  }

  async function runSettleQueue(actions, account, seg) {
    const qHistory = document.getElementById("settleQueueHistory");
    if (qHistory) {
      qHistory.innerHTML = "";
      qHistory.style.display = actions.length > 1 ? "flex" : "none";
    }

    settleLastTime = performance.now();
    if (!settleAnimId) {
      settleAnimId = lifecycle.frame(animateSettle);
    }

    for (let i = 0; i < actions.length; i++) {
      await playOneSettleAction(actions[i], i, actions.length, account, seg);

      if (actions.length > 1 && qHistory) {
        const item = document.createElement("div");
        item.className = "history-item";
        item.innerHTML = `<span>[${i + 1}/${actions.length}] ${actions[i].name}</span><b>${actions[i].d20} · ${SETTLE_BAND_CN[actions[i].band] || actions[i].band}</b>`;
        qHistory.appendChild(item);
      }

      if (i < actions.length - 1) {
        await new Promise((r) => lifecycle.timeout(r, 1200));
      }
    }
  }

  let _lastSettlePkgFloor = -1;
  let _lastSettleTime = 0;
  function showSettle(pkg) {
    if (SETTLE.auto) {
      console.log("[M4][状态栏] 自动掷开启，跳过面板");
      return;
    }
    if (!pkg) return;
    const now = performance.now();
    if (
      pkg.floor != null &&
      pkg.floor === _lastSettlePkgFloor &&
      now - _lastSettleTime < 1000
    ) {
      console.log("[M4][状态栏] 重复结算包防抖拦截：楼", pkg.floor);
      return;
    }
    _lastSettlePkgFloor = pkg.floor != null ? pkg.floor : -1;
    _lastSettleTime = now;
    if (pkg.narrativeOnly) {
      console.log("[M4][状态栏] 纯叙事动作，静默推进");
      return;
    }
    const actions = (pkg.actions || []).filter(
      (a) => !a.noRoll && a.d20 != null,
    );
    if (!actions.length) {
      console.log("[M4][状态栏] 无有效掷骰动作，静默推进");
      return;
    }

    const dlg = document.getElementById("wx-settle-dialog");
    if (!dlg) return;

    if (!dlg.open) {
      typeof dlg.showModal === "function"
        ? dlg.showModal()
        : dlg.setAttribute("open", "");
    }

    for (const act of actions)
      act.investigationReceipt = pkg.investigation || null;
    runSettleQueue(actions, pkg.account, pkg.seg);
  }

  const dieCanvasEl = document.getElementById("settleDieCanvas");
  if (dieCanvasEl) {
    lifecycle.on(dieCanvasEl, "mousedown", (e) => {
      if (settleRollState !== "SUSTAINED" && settleRollState !== "DAMPING") {
        settleIsDragging = true;
        settleLastMouse = [e.clientX, e.clientY];
      }
    });
  }
  lifecycle.on(window, "mousemove", (e) => {
    if (!settleIsDragging) return;
    const dx = e.clientX - settleLastMouse[0];
    const dy = e.clientY - settleLastMouse[1];
    settleLastMouse = [e.clientX, e.clientY];

    const axis = V_3D.norm([dy, -dx, 0]);
    const ang = Math.hypot(dx, dy) * 0.008;
    if (ang > 0.0001) {
      settleCurQuat = Q_3D.mul(settleCurQuat, Q_3D.fromAxis(axis, ang));
      renderSettleCanvas();
    }
  });
  lifecycle.on(window, "mouseup", () => (settleIsDragging = false));

  const settleDlgEl = document.getElementById("wx-settle-dialog");
  if (settleDlgEl) {
    lifecycle.on(settleDlgEl, "close", () => stopSettleAnimation());
  }

  lifecycle.on(window, "message", (e) => {
    if (e.data && e.data.wxSettle) {
      console.log("[M4][状态栏] 收到 wxSettle 消息");
      showSettle(e.data.wxSettle);
    }
  });
  /* 调试钩子：控制台可手动弹面板验证显示链（WxStatusbar.settle({...})） */
  window.WxStatusbar = window.WxStatusbar || {};
  window.WxStatusbar.settle = showSettle;

  lifecycle.cleanup(() => {
    stopSettleAnimation();
    settleQueueResolve?.();
    if (settleAudioCtx && settleAudioCtx.state !== "closed")
      settleAudioCtx.close().catch(() => {});
  });
  return { SETTLE, showSettle, stopSettleAnimation };
}

module.exports = { createSettlement };
