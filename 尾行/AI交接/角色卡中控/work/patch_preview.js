const fs = require('fs');
const path = require('path');

const htmlContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>尾行 · 听觉系统高级试听台 v3.1</title>
<style>
  :root {
    --bg: #090d14;
    --panel: #131924;
    --panel-hover: #192231;
    --border: #232f42;
    --tx: #cad8ec;
    --dim: #6d7f99;
    --hot: #e0566a;
    --cool: #5ba2e6;
    --gold: #d6b96a;
    --green: #7fd6a4;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background: var(--bg);
    color: var(--tx);
    font: 14.5px/1.7 system-ui, -apple-system, sans-serif;
    padding: 24px 18px 70px;
  }
  .wrap { max-width: 820px; margin: 0 auto; }
  header { margin-bottom: 22px; border-bottom: 1px solid var(--border); padding-bottom: 16px; }
  h1 { font-size: 21px; letter-spacing: 1.5px; color: #f0f4fc; display: flex; align-items: baseline; gap: 12px; }
  h1 small { font-size: 12px; color: var(--gold); font-weight: normal; letter-spacing: 0.5px; }
  .intro { color: var(--dim); font-size: 12.5px; margin-top: 6px; }
  
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  @media (max-width: 680px) { .grid { grid-template-columns: 1fr; } }
  
  section {
    background: var(--panel);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 16px 18px;
    position: relative;
    box-shadow: 0 4px 16px rgba(0,0,0,0.4);
  }
  section.full { grid-column: 1 / -1; }
  h2 {
    font-size: 14px;
    color: var(--gold);
    letter-spacing: 0.8px;
    margin-bottom: 4px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .desc { font-size: 11.5px; color: var(--dim); margin-bottom: 12px; line-height: 1.5; }
  .row { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-top: 8px; }
  .lab { font-size: 11.5px; color: var(--dim); min-width: 36px; }
  
  button {
    background: #1b2435;
    color: var(--tx);
    border: 1px solid #33435c;
    border-radius: 5px;
    padding: 7px 13px;
    font-size: 13px;
    cursor: pointer;
    transition: all .15s ease;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  button:hover { border-color: var(--cool); color: #fff; background: #233149; }
  button:active { transform: translateY(1px); }
  button.active { background: #223c5e; border-color: #6aa8ea; color: #fff; box-shadow: 0 0 10px rgba(91,162,230,0.3); }
  button.danger { border-color: #6b353e; }
  button.danger:hover, button.danger.active { border-color: var(--hot); background: #3d1b24; color: #ff9fae; }
  button.highlight { border-color: #6b5a35; }
  button.highlight:hover, button.highlight.active { border-color: var(--gold); background: #3d311b; color: #ffe19f; }
  
  .status-tag {
    font: 11.5px ui-monospace, Consolas, monospace;
    padding: 2px 8px;
    border-radius: 3px;
    background: #101620;
    color: var(--cool);
    border: 1px solid #233044;
    margin-left: auto;
  }
  .status-tag.warn { color: var(--hot); border-color: #5c242c; }
  
  .hr-display {
    display: flex;
    align-items: center;
    gap: 16px;
    background: #0d121b;
    border: 1px solid #1c2738;
    border-radius: 6px;
    padding: 10px 14px;
    margin-bottom: 10px;
  }
  .hr-num {
    font: 700 32px ui-monospace, Consolas, monospace;
    color: var(--hot);
    min-width: 65px;
    text-shadow: 0 0 12px rgba(224,86,106,0.5);
  }
  .hr-info { font-size: 12px; color: var(--dim); flex: 1; }
  .hr-info strong { color: var(--tx); }
  
  input[type=range] {
    flex: 1;
    accent-color: var(--hot);
    cursor: pointer;
    height: 24px;
  }
  
  .sub-console {
    background: #0d131d;
    border: 1px solid #1f2b3e;
    border-radius: 6px;
    padding: 12px 14px;
    margin-top: 12px;
  }
</style>
</head>
<body>
<div class="wrap">
  <header>
    <h1>尾行 · 听觉系统高级试听调音台 <small>v3.1 · 真实网络采样 vs 超重低音重构</small></h1>
    <p class="intro">脚步重音强化 · 真实录音与 WebAudio 次低音对比 · 戴上耳机调节重音推子体验击地沉浸感。</p>
  </header>

  <div class="grid">
    <!-- 模块 1：她的脚步与节奏变化（猎物动静） -->
    <section class="full">
      <h2>
        <span>一、她的脚步与步态演变 <small style="color:var(--dim);font-weight:normal">（核心猎物动静信标 · 真实网络录音 vs 次低频重构）</small></span>
        <span class="status-tag" id="footTag">未播放</span>
      </h2>
      <p class="desc">开场白中“高跟鞋踩在湿滑积水上的声响很有节奏”。实地脚步具备前脚掌与细跟交错的“双触点”以及沥青/水泥地表的次低频共振。下方支持切换真实录音与重构算法，并可通过低音推子调整击地厚度。</p>
      
      <!-- 音源模式横向对比 -->
      <div style="background:#0d131d;border:1px solid #1f2b3e;border-radius:6px;padding:10px 12px;margin-bottom:12px;">
        <div style="font-size:11.5px;color:var(--gold);margin-bottom:6px;font-weight:600;">🎧 音源模式选择 (戴上耳机横向对比):</div>
        <div class="row" style="margin-top:0;">
          <button id="btnModeRealHeel" class="highlight active">🎵 真实高跟鞋录音 (网络素材·NachtmahrTV)</button>
          <button id="btnModeReconstruct">🔨 超重低音双触点 (WebAudio 65Hz下潜)</button>
          <button id="btnModeRealConcrete">👞 真实水泥地硬靴 (网络素材·InspectorJ)</button>
          <button id="btnModeOld">📻 老版单触点对照组 (220Hz原版)</button>
        </div>
      </div>

      <!-- 步态与节奏控制 -->
      <div class="row">
        <span class="lab">节奏:</span>
        <button id="btnFootNormal" class="highlight">▶ 常规跟缀 (92 BPM)</button>
        <button id="btnFootSprint" class="danger">⚡ 目标提速 (136 BPM)</button>
        <button id="btnFootHalt">⛔ 目标起疑停步 (骤停死寂)</button>
        <button id="btnFootTap">👞 单步试听 (Tap Step)</button>
        <button id="btnFootStop">⏹ 停止</button>
      </div>

      <!-- 重音与次低频调音台 -->
      <div class="sub-console">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
          <span style="font-size:12px;color:var(--gold);font-weight:600;">🎛️ 鞋底重音与次低频专属调音台 (物理低音增强推子)</span>
          <span id="bassBoostVal" style="font:11.5px ui-monospace,monospace;color:var(--green)">+10 dB 增强</span>
        </div>
        
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div>
            <div style="display:flex;justify-content:space-between;font-size:11.5px;color:var(--dim);margin-bottom:2px;">
              <span>次低频加重 (Bass Boost @ 75Hz):</span>
              <span id="txtBoost">+10 dB</span>
            </div>
            <input type="range" id="sliderBassBoost" min="0" max="18" step="1" value="10" style="accent-color:var(--gold)">
          </div>
          <div>
            <div style="display:flex;justify-content:space-between;font-size:11.5px;color:var(--dim);margin-bottom:2px;">
              <span>地面重音下潜频点 (Sub Pitch):</span>
              <span id="txtPitch">65 Hz</span>
            </div>
            <input type="range" id="sliderSubPitch" min="45" max="120" step="1" value="65" style="accent-color:var(--cool)">
          </div>
          <div>
            <div style="display:flex;justify-content:space-between;font-size:11.5px;color:var(--dim);margin-bottom:2px;">
              <span>双触点时差 (细跟-前掌 Gap):</span>
              <span id="txtGap">24 ms</span>
            </div>
            <input type="range" id="sliderGap" min="12" max="45" step="1" value="24" style="accent-color:var(--cool)">
          </div>
          <div style="display:flex;align-items:center;gap:10px;padding-top:10px;">
            <label style="font-size:12px;color:var(--tx);cursor:pointer;display:inline-flex;align-items:center;gap:6px;">
              <input type="checkbox" id="chkSplash" checked style="accent-color:var(--cool)">
              <span>💧 湿滑路面积水微溅瞬态</span>
            </label>
          </div>
        </div>
      </div>
    </section>

    <!-- 模块 2：都市街景特色微声场 -->
    <section>
      <h2>
        <span>二、都市街景特色微声场</span>
        <span class="status-tag" id="cityTag">待命</span>
      </h2>
      <p class="desc">动线场景专属的声音印记，强化深秋雨夜街道穿行的空间真实感。</p>
      <div class="row">
        <button id="btnMartBell">🏪 24h便利店电子风铃</button>
      </div>
      <div class="row">
        <button id="btnWaterDrop">🏮 暗巷铁皮雨棚单发水滴</button>
      </div>
      <div class="row">
        <button id="btnFarCar">🚗 远景环路车流呼啸 (多普勒)</button>
      </div>
      <div class="row">
        <button id="btnNightHum">🌙 晴夜都市深层低频暗震 (55Hz)</button>
      </div>
    </section>

    <!-- 模块 3：器材操作与特工触感音 -->
    <section>
      <h2>
        <span>三、器材操作与微物理触感</span>
        <span class="status-tag">瞬态反馈</span>
      </h2>
      <p class="desc">状态栏作为手持夜行侦察仪器的微物理反馈音，赋予操作机械质感。</p>
      <div class="row">
        <button id="btnShutter">📷 长焦单反抓拍快门</button>
      </div>
      <div class="row">
        <button id="btnRelay">🗄 微型继电器微响 (抽屉展开)</button>
      </div>
      <div class="row">
        <button id="btnPager">📍 定位器数字寻呼 (哔-嘟)</button>
      </div>
      <div class="row">
        <button id="btnPuddleStep">👞 湿地水渍踩踏 (距离换档)</button>
      </div>
    </section>

    <!-- 模块 4：心跳与生理应激微声场 -->
    <section class="full">
      <h2>
        <span>四、心跳与生理应激微声场 <small style="color:var(--dim);font-weight:normal">（隧道效应 + 呼吸气流层）</small></span>
        <span class="status-tag" id="hrTag">心跳：关</span>
      </h2>
      <div class="hr-display">
        <div class="hr-num" id="hrNum">58</div>
        <div class="hr-info">
          <div>换算 BPM: <strong id="bpmNum">69</strong> · 状态: <strong id="hrState" style="color:var(--gold)">甜区 · 清晰稳定</strong></div>
          <div style="font-size:11px;color:var(--dim);margin-top:2px;">过线 (70) 启动听觉狭窄发闷；失控 (88+) 7500Hz 高频耳鸣渐入并伴随急促气流喘息。</div>
        </div>
        <input type="range" id="hrSlider" min="20" max="100" value="58">
      </div>
      <div class="row">
        <button id="btnToggleHr" class="active">心跳：开</button>
        <button data-val="30">准备期待命 30</button>
        <button data-val="58" class="highlight">甜区稳态 58</button>
        <button data-val="78" class="danger">过线变形 78</button>
        <button data-val="94" class="danger">失控崩溃 94</button>
        <button id="btnSpike" class="danger">💥 结算 spike (+8 重拍)</button>
        <button id="btnExhale">💨 缓息舒气释放</button>
      </div>
    </section>
  </div>
</div>

<!-- 引入网络下载的真实高跟鞋录音 Base64 数据 (离线独立可用) -->
<script src="work/audio_data.js"></script>

<script>
(() => {
  let ctx = null, masterGain = null;
  function ensureAudio() {
    if (!ctx) {
      const AudioCtor = window.AudioContext || window.webkitAudioContext;
      ctx = new AudioCtor();
      masterGain = ctx.createGain();
      masterGain.gain.value = 0.95;
      masterGain.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  /* 辅助生成噪声源 */
  function createNoiseBuffer(durSec = 2) {
    const rate = ctx.sampleRate;
    const buf = ctx.createBuffer(1, rate * durSec, rate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }
  let sharedNoiseBuf = null;
  function getNoiseSource(rate = 1) {
    ensureAudio();
    if (!sharedNoiseBuf) sharedNoiseBuf = createNoiseBuffer(2);
    const src = ctx.createBufferSource();
    src.buffer = sharedNoiseBuf;
    src.loop = true;
    src.playbackRate.value = rate;
    return src;
  }

  /* ══════════════════════════════════════════════
     一、她的脚步系统：网络真实采样 vs 超重低音重构
     ══════════════════════════════════════════════ */
  let curMode = 'realHeel'; // 'realHeel' | 'reconstruct' | 'realConcrete' | 'old'
  let footTimer = null;
  let footState = 'stopped'; // 'normal' | 'sprint' | 'stopped'
  const footTag = document.getElementById('footTag');

  // 脚步低音专属母带与滤波链路 (Low-shelf 75Hz)
  let footBusGain = null;
  let footBassBoost = null;
  function getFootBus() {
    ensureAudio();
    if (!footBusGain) {
      footBusGain = ctx.createGain();
      footBusGain.gain.value = 0.95;
      footBassBoost = ctx.createBiquadFilter();
      footBassBoost.type = 'lowshelf';
      footBassBoost.frequency.value = 75; // 75Hz 次低频段
      const boostVal = parseFloat(document.getElementById('sliderBassBoost').value || 10);
      footBassBoost.gain.value = boostVal;
      footBusGain.connect(footBassBoost).connect(masterGain);
    }
    return { bus: footBusGain, boost: footBassBoost };
  }

  // 1. 真实网络音频加载与初始化
  const audioRealHeel = new Audio();
  if (window.B64_HEELS) {
    audioRealHeel.src = 'data:audio/mp3;base64,' + window.B64_HEELS;
  } else {
    audioRealHeel.src = 'work/heels_test.mp3';
  }
  audioRealHeel.loop = true;

  const audioRealConcrete = new Audio('work/inspectorj_concrete.mp3');
  audioRealConcrete.loop = true;

  // 2. 超重低音双触点重构脚步 (WebAudio 物理算法)
  function triggerDoubleImpactStep(t = ctx.currentTime) {
    const { bus } = getFootBus();
    const subPitch = parseFloat(document.getElementById('sliderSubPitch').value || 65);
    const gap = parseFloat(document.getElementById('sliderGap').value || 24) / 1000;
    const wet = document.getElementById('chkSplash').checked;
    const jitter = 0.92 + Math.random() * 0.16;

    // ── 触点 1：细高跟硬钉砸地 (Stiletto Strike) ──
    // A. 次低频重锤冲击 (Sub-bass Impact: 65Hz -> 32Hz 下潜)
    const o1 = ctx.createOscillator();
    const g1 = ctx.createGain();
    o1.type = 'sine';
    o1.frequency.setValueAtTime(subPitch, t);
    o1.frequency.exponentialRampToValueAtTime(subPitch * 0.48, t + 0.055);
    g1.gain.setValueAtTime(0.85 * jitter, t);
    g1.gain.exponentialRampToValueAtTime(0.0001, t + 0.075);
    o1.connect(g1).connect(bus);
    o1.start(t);
    o1.stop(t + 0.08);

    // B. 路面石质共鸣 (Ground Resonance 165Hz)
    const o2 = ctx.createOscillator();
    const g2 = ctx.createGain();
    o2.type = 'triangle';
    o2.frequency.setValueAtTime(165, t);
    o2.frequency.exponentialRampToValueAtTime(75, t + 0.04);
    g2.gain.setValueAtTime(0.35 * jitter, t);
    g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    o2.connect(g2).connect(bus);
    o2.start(t);
    o2.stop(t + 0.055);

    // C. 细跟钉硬质锐击嗒声 (Stiletto Click 3400Hz 脆瞬态)
    const src1 = getNoiseSource(1.8);
    const hp1 = ctx.createBiquadFilter();
    hp1.type = 'highpass';
    hp1.frequency.value = 3400;
    const gClick = ctx.createGain();
    gClick.gain.setValueAtTime(0.55 * jitter, t);
    gClick.gain.exponentialRampToValueAtTime(0.0001, t + 0.015);
    src1.connect(hp1).connect(gClick).connect(bus);
    src1.start(t, Math.random());
    src1.stop(t + 0.025);

    // ── 触点 2：前脚掌肉垫/皮革接触 (Forefoot Pad Strike, 延后 gap 秒) ──
    const t2 = t + gap;
    // A. 前掌闷音扑地 (Muffled Thud 95Hz -> 45Hz)
    const oPad = ctx.createOscillator();
    const gPad = ctx.createGain();
    oPad.type = 'sine';
    oPad.frequency.setValueAtTime(95, t2);
    oPad.frequency.exponentialRampToValueAtTime(45, t2 + 0.045);
    gPad.gain.setValueAtTime(0.42 * jitter, t2);
    gPad.gain.exponentialRampToValueAtTime(0.0001, t2 + 0.055);
    oPad.connect(gPad).connect(bus);
    oPad.start(t2);
    oPad.stop(t2 + 0.06);

    // B. 前掌橡胶摩擦带通声 (Rubber Friction 720Hz)
    const srcPad = getNoiseSource(1.0);
    const bpPad = ctx.createBiquadFilter();
    bpPad.type = 'bandpass';
    bpPad.frequency.value = 720;
    bpPad.Q.value = 1.4;
    const gPadFric = ctx.createGain();
    gPadFric.gain.setValueAtTime(0.22 * jitter, t2);
    gPadFric.gain.exponentialRampToValueAtTime(0.0001, t2 + 0.035);
    srcPad.connect(bpPad).connect(gPadFric).connect(bus);
    srcPad.start(t2, Math.random());
    srcPad.stop(t2 + 0.045);

    // ── 湿滑地面微溅瞬态 (Water Splash) ──
    if (wet) {
      const srcWet = getNoiseSource(1.5);
      const hpWet = ctx.createBiquadFilter();
      hpWet.type = 'highpass';
      hpWet.frequency.value = 3800;
      const gWet = ctx.createGain();
      gWet.gain.setValueAtTime(0.18 * jitter, t2 + 0.005);
      gWet.gain.exponentialRampToValueAtTime(0.0001, t2 + 0.04);
      srcWet.connect(hpWet).connect(gWet).connect(bus);
      srcWet.start(t2 + 0.005, Math.random());
      srcWet.stop(t2 + 0.045);
    }
  }

  // 3. 老版对照组 (220Hz 单触点，原代码)
  function triggerOldStep(t = ctx.currentTime) {
    const { bus } = getFootBus();
    const jitter = 0.9 + Math.random() * 0.2;
    const total = 0.70 * 0.7;

    const o = ctx.createOscillator(), g1 = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(220, t); // 老版 220Hz
    o.frequency.exponentialRampToValueAtTime(220 * 0.55, t + 0.06);
    g1.gain.setValueAtTime(total * 0.45 * jitter, t);
    g1.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
    o.connect(g1).connect(bus);
    o.start(t); o.stop(t + 0.1);

    const src = getNoiseSource(0.95);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 2900;
    bp.Q.value = 2.6;
    const g2 = ctx.createGain();
    g2.gain.setValueAtTime(total * jitter, t);
    g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
    src.connect(bp).connect(g2).connect(bus);
    src.start(t, Math.random());
    src.stop(t + 0.08);

    const c = getNoiseSource(1.6);
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 3500;
    const g3 = ctx.createGain();
    g3.gain.setValueAtTime(total * 0.90 * jitter, t);
    g3.gain.exponentialRampToValueAtTime(0.0001, t + 0.016);
    c.connect(hp).connect(g3).connect(bus);
    c.start(t, Math.random());
    c.stop(t + 0.035);
  }

  // 步态执行中枢
  function stopAllFootAudio() {
    if (footTimer) { clearInterval(footTimer); footTimer = null; }
    audioRealHeel.pause();
    audioRealHeel.currentTime = 0;
    audioRealConcrete.pause();
    audioRealConcrete.currentTime = 0;
  }

  function startFootsteps(pace) {
    ensureAudio();
    stopAllFootAudio();
    footState = pace;
    const interval = pace === 'sprint' ? 440 : 650;
    const rate = pace === 'sprint' ? 1.35 : 1.0;

    if (curMode === 'realHeel') {
      audioRealHeel.playbackRate = rate;
      audioRealHeel.play().catch(e => console.log('Audio play err:', e));
    } else if (curMode === 'realConcrete') {
      audioRealConcrete.playbackRate = rate;
      audioRealConcrete.play().catch(e => console.log('Audio play err:', e));
    } else if (curMode === 'reconstruct') {
      triggerDoubleImpactStep();
      footTimer = setInterval(triggerDoubleImpactStep, interval);
    } else if (curMode === 'old') {
      triggerOldStep();
      footTimer = setInterval(triggerOldStep, interval);
    }

    footTag.className = pace === 'sprint' ? 'status-tag warn' : 'status-tag';
    const modeName = curMode === 'realHeel' ? '真实高跟鞋录音' : curMode === 'reconstruct' ? '超重低音双触点' : curMode === 'realConcrete' ? '真实水泥地硬靴' : '老版220Hz对照';
    footTag.textContent = pace === 'sprint' ? \`提速拉开 (\${modeName} 136 BPM)\` : \`常规跟缀 (\${modeName} 92 BPM)\`;
  }

  function haltFootsteps() {
    stopAllFootAudio();
    footState = 'stopped';
    footTag.className = 'status-tag warn';
    footTag.textContent = '⛔ 目标骤停起疑！(死寂)';
  }

  function tapOneStep() {
    ensureAudio();
    if (curMode === 'realHeel') {
      audioRealHeel.currentTime = 0.15;
      audioRealHeel.play();
      setTimeout(() => { if (footState === 'stopped') audioRealHeel.pause(); }, 450);
    } else if (curMode === 'realConcrete') {
      audioRealConcrete.currentTime = 0.2;
      audioRealConcrete.play();
      setTimeout(() => { if (footState === 'stopped') audioRealConcrete.pause(); }, 480);
    } else if (curMode === 'reconstruct') {
      triggerDoubleImpactStep();
    } else if (curMode === 'old') {
      triggerOldStep();
    }
  }

  // 绑定模式按钮
  function setMode(mode, targetBtn) {
    curMode = mode;
    document.querySelectorAll('#btnModeRealHeel, #btnModeReconstruct, #btnModeRealConcrete, #btnModeOld').forEach(b => b.classList.remove('active'));
    targetBtn.classList.add('active');
    if (footState !== 'stopped') {
      startFootsteps(footState);
    }
  }

  document.getElementById('btnModeRealHeel').addEventListener('click', e => setMode('realHeel', e.currentTarget));
  document.getElementById('btnModeReconstruct').addEventListener('click', e => setMode('reconstruct', e.currentTarget));
  document.getElementById('btnModeRealConcrete').addEventListener('click', e => setMode('realConcrete', e.currentTarget));
  document.getElementById('btnModeOld').addEventListener('click', e => setMode('old', e.currentTarget));

  document.getElementById('btnFootNormal').addEventListener('click', () => startFootsteps('normal'));
  document.getElementById('btnFootSprint').addEventListener('click', () => startFootsteps('sprint'));
  document.getElementById('btnFootHalt').addEventListener('click', haltFootsteps);
  document.getElementById('btnFootTap').addEventListener('click', tapOneStep);
  document.getElementById('btnFootStop').addEventListener('click', () => {
    stopAllFootAudio();
    footState = 'stopped';
    footTag.className = 'status-tag';
    footTag.textContent = '未播放';
  });

  // 绑定重音控制滑条
  const sliderBassBoost = document.getElementById('sliderBassBoost');
  const txtBoost = document.getElementById('txtBoost');
  const bassBoostVal = document.getElementById('bassBoostVal');
  sliderBassBoost.addEventListener('input', e => {
    const val = parseFloat(e.target.value);
    txtBoost.textContent = \`+\${val} dB\`;
    bassBoostVal.textContent = \`+\${val} dB 增强\`;
    const { boost } = getFootBus();
    if (boost) boost.gain.value = val;
  });

  const sliderSubPitch = document.getElementById('sliderSubPitch');
  const txtPitch = document.getElementById('txtPitch');
  sliderSubPitch.addEventListener('input', e => {
    txtPitch.textContent = \`\${e.target.value} Hz\`;
  });

  const sliderGap = document.getElementById('sliderGap');
  const txtGap = document.getElementById('txtGap');
  sliderGap.addEventListener('input', e => {
    txtGap.textContent = \`\${e.target.value} ms\`;
  });

  /* ══════════════════════════════════════════════
     二、都市街景特色微声场
     ══════════════════════════════════════════════ */
  // 1. 24h 便利店双音风铃
  function playMartBell() {
    ensureAudio();
    const t = ctx.currentTime;
    const playChime = (freq, time, dur) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(freq, time);
      g.gain.setValueAtTime(0.0001, time);
      g.gain.linearRampToValueAtTime(0.18, time + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
      o.connect(g).connect(masterGain);
      o.start(time); o.stop(time + dur + 0.04);

      // 高频金属泛音
      const o2 = ctx.createOscillator(), g2 = ctx.createGain();
      o2.type = 'sine';
      o2.frequency.setValueAtTime(freq * 2.76, time);
      g2.gain.setValueAtTime(0.0001, time);
      g2.gain.linearRampToValueAtTime(0.035, time + 0.002);
      g2.gain.exponentialRampToValueAtTime(0.0001, time + dur * 0.4);
      o2.connect(g2).connect(masterGain);
      o2.start(time); o2.stop(time + dur * 0.45);
    };
    playChime(1650, t, 0.42);
    playChime(1280, t + 0.16, 0.65);
    setCityTag('便利店自动门双音铃');
  }
  document.getElementById('btnMartBell').addEventListener('click', playMartBell);

  // 2. 暗巷铁皮雨棚单发水滴
  function playWaterDrop() {
    ensureAudio();
    const t = ctx.currentTime;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(1450, t);
    o.frequency.exponentialRampToValueAtTime(260, t + 0.032);
    g.gain.setValueAtTime(0.15, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.075);
    o.connect(g).connect(masterGain);
    o.start(t); o.stop(t + 0.09);

    // 铁皮余振
    const tin = ctx.createOscillator(), tg = ctx.createGain();
    tin.type = 'triangle';
    tin.frequency.setValueAtTime(280, t + 0.006);
    tin.frequency.exponentialRampToValueAtTime(120, t + 0.11);
    tg.gain.setValueAtTime(0.065, t + 0.006);
    tg.gain.exponentialRampToValueAtTime(0.0001, t + 0.13);
    tin.connect(tg).connect(masterGain);
    tin.start(t + 0.006); tin.stop(t + 0.15);
    setCityTag('雨棚铁皮水滴“嗒”');
  }
  document.getElementById('btnWaterDrop').addEventListener('click', playWaterDrop);

  // 3. 远车呼啸 (多普勒滑频)
  function playFarCar() {
    ensureAudio();
    const t = ctx.currentTime, dur = 3.2;
    const src = getNoiseSource(0.7);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 0.65;
    bp.frequency.setValueAtTime(420, t);
    bp.frequency.exponentialRampToValueAtTime(160, t + dur);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 950;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.06, t + dur * 0.35);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(bp).connect(lp).connect(g).connect(masterGain);
    src.start(t, Math.random());
    src.stop(t + dur + 0.1);
    setCityTag('远景车流多普勒呼啸');
  }
  document.getElementById('btnFarCar').addEventListener('click', playFarCar);

  // 4. 晴夜都市深层低频暗震
  let nightHumNode = null;
  function toggleNightHum() {
    ensureAudio();
    if (nightHumNode) {
      nightHumNode.stop();
      nightHumNode.disconnect();
      nightHumNode = null;
      document.getElementById('btnNightHum').classList.remove('active');
      setCityTag('都市低噪：关');
      return;
    }
    const t = ctx.currentTime;
    const osc = ctx.createOscillator(), g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 55;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.028, t + 1.2);
    osc.connect(g).connect(masterGain);
    osc.start(t);
    nightHumNode = osc;
    document.getElementById('btnNightHum').classList.add('active');
    setCityTag('都市55Hz深层暗震运行中');
  }
  document.getElementById('btnNightHum').addEventListener('click', toggleNightHum);

  function setCityTag(txt) {
    document.getElementById('cityTag').textContent = txt;
  }

  /* ══════════════════════════════════════════════
     三、器材操作与微物理触感音
     ══════════════════════════════════════════════ */
  // 1. 单反抓拍快门
  function playShutter() {
    ensureAudio();
    const t = ctx.currentTime;
    const osc = ctx.createOscillator(), g1 = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(340, t);
    osc.frequency.exponentialRampToValueAtTime(70, t + 0.025);
    g1.gain.setValueAtTime(0.001, t);
    g1.gain.linearRampToValueAtTime(0.22, t + 0.003);
    g1.gain.exponentialRampToValueAtTime(0.0001, t + 0.028);
    osc.connect(g1).connect(masterGain);
    osc.start(t); osc.stop(t + 0.032);

    const src = getNoiseSource(1.2);
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 2400;
    filter.Q.value = 2.5;
    const g2 = ctx.createGain();
    g2.gain.setValueAtTime(0.26, t + 0.012);
    g2.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    src.connect(filter).connect(g2).connect(masterGain);
    src.start(t + 0.012, Math.random());
    src.stop(t + 0.055);

    const osc2 = ctx.createOscillator(), g3 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(220, t + 0.04);
    osc2.frequency.exponentialRampToValueAtTime(80, t + 0.065);
    g3.gain.setValueAtTime(0.09, t + 0.04);
    g3.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
    osc2.connect(g3).connect(masterGain);
    osc2.start(t + 0.04); osc2.stop(t + 0.075);
  }
  document.getElementById('btnShutter').addEventListener('click', playShutter);

  // 2. 微型继电器吸合
  function playRelay() {
    ensureAudio();
    const t = ctx.currentTime;
    const pulse = (time, freq, vol) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'square';
      o.frequency.setValueAtTime(freq, time);
      o.frequency.exponentialRampToValueAtTime(140, time + 0.006);
      g.gain.setValueAtTime(vol, time);
      g.gain.exponentialRampToValueAtTime(0.0001, time + 0.008);
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 3500;
      o.connect(lp).connect(g).connect(masterGain);
      o.start(time); o.stop(time + 0.012);
    };
    pulse(t, 2200, 0.12);
    pulse(t + 0.012, 1750, 0.09);
  }
  document.getElementById('btnRelay').addEventListener('click', playRelay);

  // 3. 定位器数字寻呼 (哔-嘟)
  function playPager() {
    ensureAudio();
    const t = ctx.currentTime;
    const beep = (freq, time, dur) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(freq, time);
      g.gain.setValueAtTime(0.0001, time);
      g.gain.linearRampToValueAtTime(0.09, time + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
      o.connect(g).connect(masterGain);
      o.start(time); o.stop(time + dur + 0.01);
    };
    beep(2400, t, 0.045);
    beep(2880, t + 0.055, 0.055);
  }
  document.getElementById('btnPager').addEventListener('click', playPager);

  // 4. 湿地水渍踩踏
  function playPuddleStep() {
    ensureAudio();
    const t = ctx.currentTime;
    const osc = ctx.createOscillator(), g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(90, t);
    osc.frequency.exponentialRampToValueAtTime(35, t + 0.055);
    g.gain.setValueAtTime(0.12, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.065);
    osc.connect(g).connect(masterGain);
    osc.start(t); osc.stop(t + 0.07);

    const src = getNoiseSource(1.5);
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 3200;
    const gSplash = ctx.createGain();
    gSplash.gain.setValueAtTime(0.08, t + 0.005);
    gSplash.gain.exponentialRampToValueAtTime(0.001, t + 0.045);
    src.connect(filter).connect(gSplash).connect(masterGain);
    src.start(t + 0.005, Math.random());
    src.stop(t + 0.055);
  }
  document.getElementById('btnPuddleStep').addEventListener('click', playPuddleStep);

  /* ══════════════════════════════════════════════
     四、心跳与生理应激微声场
     ══════════════════════════════════════════════ */
  let hrValue = 58;
  let hrRunning = true;
  let nextBeatTime = 0;
  let tinnitusOsc = null, tinnitusGain = null;
  let hrLoopTimer = null;

  function heartToBpm(v) {
    return v < 40 ? 45 + v * 0.25 : v < 65 ? 55 + (v - 40) * 0.8 : v < 90 ? 75 + (v - 65) * 1.2 : 105 + (v - 90) * 2.5;
  }
  function thump(time, freq, vol) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(freq, time);
    o.frequency.exponentialRampToValueAtTime(Math.max(freq * 0.45, 20), time + 0.16);
    g.gain.setValueAtTime(0.0001, time);
    g.gain.linearRampToValueAtTime(vol, time + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, time + 0.24);
    o.connect(g).connect(masterGain);
    o.start(time); o.stop(time + 0.28);

    const h = ctx.createOscillator(), hg = ctx.createGain();
    h.type = 'sine';
    h.frequency.setValueAtTime(freq * 2.7, time);
    h.frequency.exponentialRampToValueAtTime(freq * 1.6, time + 0.1);
    hg.gain.setValueAtTime(0.0001, time);
    hg.gain.linearRampToValueAtTime(vol * 0.38, time + 0.01);
    hg.gain.exponentialRampToValueAtTime(0.0001, time + 0.12);
    h.connect(hg).connect(masterGain);
    h.start(time); h.stop(time + 0.16);
  }

  function playBreathGasp(time, intensity) {
    if (intensity <= 0) return;
    const src = getNoiseSource(0.9);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 540;
    bp.Q.value = 1.0;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, time);
    g.gain.linearRampToValueAtTime(0.035 * intensity, time + 0.08);
    g.gain.exponentialRampToValueAtTime(0.0001, time + 0.22);
    src.connect(bp).connect(g).connect(masterGain);
    src.start(time, Math.random());
    src.stop(time + 0.25);
  }

  function hrSchedule() {
    if (!hrRunning || !ctx) return;
    const now = ctx.currentTime;
    const bpm = heartToBpm(hrValue);
    const period = 60 / bpm;
    const freq = hrValue >= 90 ? 50 : 58;
    const volLevel = 0.55 + (hrValue / 100) * 0.45;

    if (nextBeatTime < now - 0.12) nextBeatTime = now + 0.04;
    while (nextBeatTime < now + 0.14) {
      thump(nextBeatTime, freq, volLevel);
      thump(nextBeatTime + Math.min(0.16, period * 0.22), freq * 0.9, volLevel * 0.8);

      if (hrValue >= 70) {
        const gaspIntensity = Math.min((hrValue - 65) / 30, 1.0);
        playBreathGasp(nextBeatTime + period * 0.45, gaspIntensity);
      }

      nextBeatTime += period;
    }

    if (!tinnitusOsc) {
      tinnitusOsc = ctx.createOscillator();
      tinnitusOsc.frequency.value = 7500;
      tinnitusOsc.type = 'sine';
      tinnitusGain = ctx.createGain();
      tinnitusGain.gain.value = 0;
      tinnitusOsc.connect(tinnitusGain).connect(masterGain);
      tinnitusOsc.start();
    }
    const tinnVol = hrValue > 88 ? Math.min((hrValue - 88) / 12, 1) * 0.025 : 0;
    tinnitusGain.gain.setTargetAtTime(tinnVol, ctx.currentTime, 0.3);

    hrLoopTimer = setTimeout(hrSchedule, 30);
  }

  function updateHrUI() {
    const bpm = Math.round(heartToBpm(hrValue));
    document.getElementById('hrNum').textContent = hrValue;
    document.getElementById('bpmNum').textContent = bpm;
    document.getElementById('hrSlider').value = hrValue;

    let stateText = '甜区 · 清晰稳定';
    let stateColor = 'var(--gold)';
    if (hrValue < 40) {
      stateText = '低压 · 平缓待命';
      stateColor = 'var(--cool)';
    } else if (hrValue >= 90) {
      stateText = '失控崩溃 · 耳鸣暴涨 + 急促喘息';
      stateColor = 'var(--hot)';
    } else if (hrValue >= 70) {
      stateText = '过线变形 · 听觉狭窄 + 呼吸沉重';
      stateColor = '#e38258';
    }
    const el = document.getElementById('hrState');
    el.textContent = stateText;
    el.style.color = stateColor;
  }

  document.getElementById('hrSlider').addEventListener('input', e => {
    ensureAudio();
    hrValue = +e.target.value;
    updateHrUI();
  });
  document.querySelectorAll('[data-val]').forEach(b => {
    b.addEventListener('click', () => {
      ensureAudio();
      hrValue = +b.dataset.val;
      updateHrUI();
    });
  });

  const btnToggleHr = document.getElementById('btnToggleHr');
  btnToggleHr.addEventListener('click', () => {
    ensureAudio();
    hrRunning = !hrRunning;
    btnToggleHr.textContent = hrRunning ? '心跳：开' : '心跳：关';
    btnToggleHr.classList.toggle('active', hrRunning);
    document.getElementById('hrTag').textContent = hrRunning ? '心跳：开' : '心跳：关';
    if (hrRunning) {
      nextBeatTime = ctx.currentTime + 0.05;
      hrSchedule();
    } else {
      clearTimeout(hrLoopTimer);
      if (tinnitusGain) tinnitusGain.gain.setTargetAtTime(0, ctx.currentTime, 0.2);
    }
  });

  document.getElementById('btnSpike').addEventListener('click', () => {
    ensureAudio();
    const t = ctx.currentTime;
    thump(t, 38, 1.0);
    thump(t + 0.15, 36, 0.85);
    hrValue = Math.min(100, hrValue + 8);
    updateHrUI();
  });

  function playExhaleRelease() {
    ensureAudio();
    const t = ctx.currentTime;
    const dur = 1.0;
    const src = getNoiseSource(0.85);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 0.8;
    bp.frequency.setValueAtTime(650, t);
    bp.frequency.exponentialRampToValueAtTime(180, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.055, t + 0.15);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(bp).connect(g).connect(masterGain);
    src.start(t, Math.random());
    src.stop(t + dur + 0.1);

    hrValue = Math.max(35, hrValue - 12);
    updateHrUI();
  }
  document.getElementById('btnExhale').addEventListener('click', playExhaleRelease);

  updateHrUI();
})();
</script>
</body>
</html>
`;

fs.writeFileSync(path.join(__dirname, '..', '音效预览.html'), htmlContent, 'utf8');
console.log('音效预览.html updated successfully. Size:', Buffer.byteLength(htmlContent, 'utf8'));
