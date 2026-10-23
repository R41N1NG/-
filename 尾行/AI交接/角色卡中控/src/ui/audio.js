"use strict";
// 音频实例隔离；调用方提供当前视图与渲染回调。
function createAudio({
  document,
  lifecycle,
  window,
  root,
  heartToBpm,
  heartFreq,
  ico,
  renderSnapshot,
  getHeart,
  getMode,
  getSnapshot,
}) {
  const AudioCtor = window.AudioContext || window.webkitAudioContext;
  let audioContext = null,
    masterGain = null,
    heartBus = null;
  let audioOn = false,
    audioPending = false;
  let audioTimer = null,
    audioRevision = 0,
    nextBeat = 0,
    tinnitusOsc = null,
    tinnitusGain = null;
  const voices = new Set();
  const soundButton = document.getElementById("heartbeat-sound");
  const audioStatus = document.getElementById("audioStatus");

  /* 音量设置（滑条 0-100） */
  const vol = { heart: 0.8, tinnitus: 0.25, rain: 0.5, step: 0.7 }; // 默认：心跳偏重，冷雨沙沙，脚步适中，耳鸣压低
  let rainSource = null,
    rainGain = null,
    rainFilter = null;

  function createRain() {
    if (rainSource || !audioContext) return;
    const sampleRate = audioContext.sampleRate;
    const bufferSize = sampleRate * 2;
    const noiseBuffer = audioContext.createBuffer(1, bufferSize, sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0,
      b1 = 0,
      b2 = 0,
      b3 = 0,
      b4 = 0,
      b5 = 0,
      b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.969 * b2 + white * 0.153852;
      b3 = 0.8665 * b3 + white * 0.3104856;
      b4 = 0.55 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.016898;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.035;
      b6 = white * 0.115926;
    }
    rainSource = audioContext.createBufferSource();
    rainSource.buffer = noiseBuffer;
    rainSource.loop = true;

    rainFilter = audioContext.createBiquadFilter();
    rainFilter.type = "lowpass";
    rainFilter.frequency.value = 2600;

    rainGain = audioContext.createGain();
    rainGain.gain.value = vol.rain * 0.4;

    rainSource.connect(rainFilter).connect(rainGain).connect(masterGain);
    rainSource.start();
  }

  /* 她的警觉：只给档位与五格刻度，不给精确数值（她的状态是天气不是仪表） */

  function getRainState(snap) {
    if (!snap) return { hasRain: false, isStorm: false };
    const w = (snap.weather || "").toLowerCase();
    const wn = snap.weatherName || "";
    const env = (snap.env || "").toLowerCase();
    const tagNames = (snap.tags || []).map((t) => t.name);

    const isStorm =
      w === "storm" ||
      wn.includes("暴雨") ||
      tagNames.some((n) => n.includes("暴雨"));
    const hasRain =
      isStorm ||
      w === "rain" ||
      wn.includes("雨") ||
      env.includes("rain") ||
      tagNames.some(
        (n) => n.includes("雨") || n === "雨幕" || n === "雨夜掩护",
      );
    return { hasRain, isStorm };
  }

  function updateRainTunnel() {
    if (!rainFilter || !rainGain || !audioContext) return;
    const t = audioContext.currentTime;
    const { hasRain, isStorm } = getRainState(getSnapshot());

    if (!hasRain) {
      // 场景/标签无雨：雨声平滑淡出至完全静音（晴夜不胡乱下雨）
      rainGain.gain.setTargetAtTime(0.00001, t, 0.35);
      return;
    }

    const rainIntensity = isStorm ? 1.35 : 1.0;
    const baseCutoff = isStorm ? 3200 : 2600;

    // 生理听觉狭窄（隧道效应）：心跳>70 滤波截止频率降至1100Hz；>90 骤降至420Hz且音量压低，真实呈现被自身心跳重击与耳鸣淹没的压迫感
    if (getHeart() >= 90) {
      rainFilter.frequency.setTargetAtTime(420, t, 0.3);
      rainGain.gain.setTargetAtTime(vol.rain * 0.15 * rainIntensity, t, 0.3);
    } else if (getHeart() >= 70) {
      rainFilter.frequency.setTargetAtTime(1100, t, 0.3);
      rainGain.gain.setTargetAtTime(vol.rain * 0.28 * rainIntensity, t, 0.3);
    } else {
      rainFilter.frequency.setTargetAtTime(baseCutoff, t, 0.4);
      rainGain.gain.setTargetAtTime(vol.rain * 0.4 * rainIntensity, t, 0.4);
    }
  }

  function soundUI(message) {
    document.querySelectorAll("#heartbeat-sound, .audio-btn").forEach((btn) => {
      btn.textContent = audioPending
        ? "取消开启"
        : audioOn
          ? "关闭雨夜心跳声"
          : "开启雨夜心跳声";
      btn.setAttribute("aria-pressed", String(audioOn || audioPending));
    });
    document.querySelectorAll("#audioStatus, .audio-status").forEach((el) => {
      el.textContent = message;
    });
    const audioBtnTxt = document.getElementById("audioBtnTxt");
    if (audioBtnTxt) {
      audioBtnTxt.textContent = audioOn ? "声音 (开)" : "声音";
    }
  }

  function updateAudioStatus() {
    if (!audioOn) return soundUI("音效已关闭");
    if (!HUNTER_MODES[getMode()]) {
      soundUI("准备期 · 潜行状态未激活 · 心跳静默（自动待命）");
      return;
    }
    const { hasRain, isStorm } = getRainState(getSnapshot());
    if (isStorm) {
      soundUI("暴雨夜心跳声已开启 · 狂风骤雨与心跳实时联动");
    } else if (hasRain) {
      soundUI("雨夜心跳声已开启 · 雨幕掩护与心跳实时联动");
    } else {
      soundUI("心跳声已开启 · 晴夜无雨（环境雨声静音待命）");
    }
  }
  function cancelVoices() {
    for (const o of voices) {
      try {
        o.stop();
      } catch {}
    }
    voices.clear();
  }
  function stopAudio(message = "音效已关闭") {
    ++audioRevision;
    audioOn = false;
    audioPending = false;
    lifecycle.clearTimeout(audioTimer);
    audioTimer = null;
    cancelVoices();
    if (tinnitusGain)
      tinnitusGain.gain.setTargetAtTime(0, audioContext.currentTime, 0.2);
    if (rainSource) {
      try {
        rainSource.stop();
        rainSource.disconnect();
      } catch {}
      rainSource = null;
    }
    if (audioContext && audioContext.state !== "closed")
      audioContext.suspend().catch(() => {});
    soundUI(message);
  }
  function thump(time, frequency, level) {
    // 重音版 + 谐波层：小喇叭靠 2.7 倍频发声，大喇叭靠基频压阵
    const o = audioContext.createOscillator(),
      g = audioContext.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(frequency, time);
    o.frequency.exponentialRampToValueAtTime(
      Math.max(frequency * 0.45, 20),
      time + 0.16,
    );
    g.gain.setValueAtTime(0.0001, time);
    g.gain.linearRampToValueAtTime(level, time + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, time + 0.24);
    o.connect(g).connect(heartBus);
    voices.add(o);
    o.onended = () => {
      voices.delete(o);
      o.disconnect();
      g.disconnect();
    };
    o.start(time);
    o.stop(time + 0.28);
    const h = audioContext.createOscillator(),
      hg = audioContext.createGain();
    h.type = "sine";
    h.frequency.setValueAtTime(frequency * 2.7, time);
    h.frequency.exponentialRampToValueAtTime(frequency * 1.6, time + 0.1);
    hg.gain.setValueAtTime(0.0001, time);
    hg.gain.linearRampToValueAtTime(level * 0.38, time + 0.01);
    hg.gain.exponentialRampToValueAtTime(0.0001, time + 0.12);
    h.connect(hg).connect(heartBus);
    voices.add(h);
    h.onended = () => {
      voices.delete(h);
      h.disconnect();
      hg.disconnect();
    };
    h.start(time);
    h.stop(time + 0.16);
  }
  function tinnitus() {
    // 心跳>88 渐入的耳鸣层（音量走独立滑条）
    if (!tinnitusOsc) {
      tinnitusOsc = audioContext.createOscillator();
      tinnitusOsc.frequency.value = 7500;
      tinnitusOsc.type = "sine";
      tinnitusGain = audioContext.createGain();
      tinnitusGain.gain.value = 0;
      tinnitusOsc.connect(tinnitusGain).connect(masterGain);
      tinnitusOsc.start();
    }
    const base = 0.025 * vol.tinnitus;
    const g = getHeart() > 88 ? Math.min((getHeart() - 88) / 12, 1) * base : 0;
    tinnitusGain.gain.setTargetAtTime(g, audioContext.currentTime, 0.4);
  }

  /* 拟音层 1：机械单反抓拍快门声（打开档案取景器时触发） */
  function playShutterSound() {
    if (!audioContext || audioContext.state !== "running") return;
    const t = audioContext.currentTime;
    // 1. 反光板升起 (轻低微撞击)
    const osc = audioContext.createOscillator(),
      g1 = audioContext.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(340, t);
    osc.frequency.exponentialRampToValueAtTime(70, t + 0.025);
    g1.gain.setValueAtTime(0.001, t);
    g1.gain.linearRampToValueAtTime(0.2, t + 0.003);
    g1.gain.exponentialRampToValueAtTime(0.0001, t + 0.028);
    osc.connect(g1).connect(masterGain);
    osc.start(t);
    osc.stop(t + 0.032);

    // 2. 快门帘幕运动（白噪声切片）
    const buf = audioContext.createBuffer(
      1,
      Math.floor(audioContext.sampleRate * 0.04),
      audioContext.sampleRate,
    );
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++)
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (data.length * 0.35));
    const src = audioContext.createBufferSource();
    src.buffer = buf;
    const filter = audioContext.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 2400;
    filter.Q.value = 2.5;
    const g2 = audioContext.createGain();
    g2.gain.setValueAtTime(0.25, t + 0.012);
    g2.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    src.connect(filter).connect(g2).connect(masterGain);
    src.start(t + 0.012);

    // 3. 帘幕闭合回弹微震
    const osc2 = audioContext.createOscillator(),
      g3 = audioContext.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(220, t + 0.04);
    osc2.frequency.exponentialRampToValueAtTime(80, t + 0.065);
    g3.gain.setValueAtTime(0.09, t + 0.04);
    g3.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
    osc2.connect(g3).connect(masterGain);
    osc2.start(t + 0.04);
    osc2.stop(t + 0.075);
  }

  /* 真实音频直链映射表（双模：本地/静态资源优先，加载失败时无缝由 WebAudio 拟音兜底） */
  const SHOE_AUDIO_FILES = {
    heel: "work/audio_assets/heels.mp3",
    flats: "work/audio_assets/flats.mp3",
    leather: "work/audio_assets/leather_shoes.mp3",
    boots: "work/audio_assets/boots.mp3",
    platform: "work/audio_assets/platform.mp3",
    sandals: "work/audio_assets/sandals.mp3",
    slippers: "work/audio_assets/slippers.mp3",
    sneakers: "work/audio_assets/sneakers.mp3",
    barefoot: "work/audio_assets/barefoot.mp3",
  };

  const ENV_SFX_FILES = {
    cat: "work/audio_assets/cat_meow.ogg",
    dog: "work/audio_assets/dog_bark.ogg",
  };

  function playEnvAudio(sfxKey) {
    if (!audioOn) return;
    const url = ENV_SFX_FILES[sfxKey];
    if (url) {
      try {
        const a = new Audio(url);
        a.volume = Math.min(1, Math.max(0.1, (vol.heart || 0.8) * 0.9));
        const p = a.play();
        if (p && p.then) {
          p.catch(() => {
            synthProceduralEnv(sfxKey);
          });
        }
      } catch {
        synthProceduralEnv(sfxKey);
      }
    } else {
      synthProceduralEnv(sfxKey);
    }
  }

  function synthProceduralEnv(sfxKey) {
    if (!audioContext || audioContext.state !== "running") return;
    const t = audioContext.currentTime;
    if (sfxKey === "cat") {
      const o = audioContext.createOscillator(),
        g = audioContext.createGain();
      o.type = "triangle";
      o.frequency.setValueAtTime(1100, t);
      o.frequency.exponentialRampToValueAtTime(1350, t + 0.12);
      o.frequency.exponentialRampToValueAtTime(650, t + 0.45);
      g.gain.setValueAtTime(0.001, t);
      g.gain.linearRampToValueAtTime(0.12, t + 0.08);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
      o.connect(g).connect(masterGain);
      o.start(t);
      o.stop(t + 0.46);
    } else if (sfxKey === "dog") {
      for (let i = 0; i < 2; i++) {
        const dt = t + i * 0.22;
        const o = audioContext.createOscillator(),
          g = audioContext.createGain();
        o.type = "sawtooth";
        o.frequency.setValueAtTime(220, dt);
        o.frequency.exponentialRampToValueAtTime(85, dt + 0.12);
        g.gain.setValueAtTime(0.14, dt);
        g.gain.exponentialRampToValueAtTime(0.001, dt + 0.14);
        const filter = audioContext.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = 450;
        o.connect(filter).connect(g).connect(masterGain);
        o.start(dt);
        o.stop(dt + 0.15);
      }
    }
  }

  /* 拟音层 2：目标鞋型踏步声（真实采样优先 + WebAudio 物理双触点兜底）
     响度 = 脚步滑杆 × 距离折算声级（0~5）：越近越响，静音级不播；她已到家（走完动线）也不再播 */
  function playFootstepSound(shoeOverride) {
    if (!audioContext || audioContext.state !== "running") return;
    const snap = getSnapshot();
    const shoe =
      shoeOverride || (snap && snap.target && snap.target.shoe) || "heel";
    const info = snap && snap.target && snap.target.shoeInfo;
    const level =
      info && typeof info.level === "number"
        ? Math.max(0, Math.min(5, info.level))
        : 3;
    const route = snap && snap.route;
    const atEnd = !!(
      route &&
      Array.isArray(route.nodes) &&
      route.here >= route.nodes.length - 1
    );
    if (level <= 0 || atEnd) return; // 静音鞋 / 她已停下：这一步不响
    const distVol = Math.max(0.12, level / 5); // 1 级也有细响，避免整段没声
    const t = audioContext.currentTime;
    const { hasRain } = getRainState(getSnapshot());

    const audioUrl = SHOE_AUDIO_FILES[shoe];
    if (audioUrl) {
      try {
        const a = new Audio(audioUrl);
        a.volume = Math.min(1, Math.max(0.05, (vol.step || 0.7) * distVol));
        const p = a.play();
        if (p && p.then) {
          p.catch(() => {
            synthProceduralFootstep(shoe, t);
          });
        }
      } catch {
        synthProceduralFootstep(shoe, t);
      }
    } else {
      synthProceduralFootstep(shoe, t);
    }

    if (hasRain) {
      const buf = audioContext.createBuffer(
        1,
        Math.floor(audioContext.sampleRate * 0.045),
        audioContext.sampleRate,
      );
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++)
        d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (d.length * 0.25));
      const src = audioContext.createBufferSource();
      src.buffer = buf;
      const filter = audioContext.createBiquadFilter();
      filter.type = "highpass";
      filter.frequency.value = 3200;
      const gSplash = audioContext.createGain();
      gSplash.gain.setValueAtTime(0.08, t + 0.005);
      gSplash.gain.exponentialRampToValueAtTime(0.001, t + 0.045);
      src.connect(filter).connect(gSplash).connect(masterGain);
      src.start(t + 0.005);
    }
  }

  function synthProceduralFootstep(shoe, t) {
    if (!audioContext || audioContext.state !== "running") return;
    if (shoe === "heel") {
      const oscPin = audioContext.createOscillator(),
        gPin = audioContext.createGain();
      oscPin.type = "triangle";
      oscPin.frequency.setValueAtTime(1900, t);
      oscPin.frequency.exponentialRampToValueAtTime(450, t + 0.025);
      gPin.gain.setValueAtTime(0.18, t);
      gPin.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
      oscPin.connect(gPin).connect(masterGain);
      oscPin.start(t);
      oscPin.stop(t + 0.035);

      const oscSole = audioContext.createOscillator(),
        gSole = audioContext.createGain();
      oscSole.type = "sine";
      oscSole.frequency.setValueAtTime(110, t + 0.015);
      oscSole.frequency.exponentialRampToValueAtTime(40, t + 0.055);
      gSole.gain.setValueAtTime(0.1, t + 0.015);
      gSole.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
      oscSole.connect(gSole).connect(masterGain);
      oscSole.start(t + 0.015);
      oscSole.stop(t + 0.065);
    } else if (shoe === "boots") {
      const osc = audioContext.createOscillator(),
        g = audioContext.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(70, t);
      osc.frequency.exponentialRampToValueAtTime(26, t + 0.085);
      g.gain.setValueAtTime(0.18, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
      osc.connect(g).connect(masterGain);
      osc.start(t);
      osc.stop(t + 0.095);
    } else if (shoe === "platform") {
      const osc = audioContext.createOscillator(),
        g = audioContext.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(140, t);
      osc.frequency.exponentialRampToValueAtTime(32, t + 0.07);
      g.gain.setValueAtTime(0.15, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.075);
      osc.connect(g).connect(masterGain);
      osc.start(t);
      osc.stop(t + 0.08);
    } else if (shoe === "leather") {
      const osc = audioContext.createOscillator(),
        g = audioContext.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(750, t);
      osc.frequency.exponentialRampToValueAtTime(95, t + 0.04);
      g.gain.setValueAtTime(0.14, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.045);
      osc.connect(g).connect(masterGain);
      osc.start(t);
      osc.stop(t + 0.05);
    } else if (shoe === "sneakers") {
      const osc = audioContext.createOscillator(),
        g = audioContext.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(85, t);
      osc.frequency.exponentialRampToValueAtTime(38, t + 0.045);
      g.gain.setValueAtTime(0.09, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
      osc.connect(g).connect(masterGain);
      osc.start(t);
      osc.stop(t + 0.055);
    } else if (shoe === "barefoot") {
      const osc = audioContext.createOscillator(),
        g = audioContext.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(150, t);
      osc.frequency.exponentialRampToValueAtTime(45, t + 0.05);
      g.gain.setValueAtTime(0.11, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.055);
      osc.connect(g).connect(masterGain);
      osc.start(t);
      osc.stop(t + 0.06);
    } else if (shoe === "slippers") {
      const o1 = audioContext.createOscillator(),
        g1 = audioContext.createGain();
      o1.type = "triangle";
      o1.frequency.setValueAtTime(280, t);
      o1.frequency.exponentialRampToValueAtTime(60, t + 0.03);
      g1.gain.setValueAtTime(0.12, t);
      g1.gain.exponentialRampToValueAtTime(0.001, t + 0.035);
      o1.connect(g1).connect(masterGain);
      o1.start(t);
      o1.stop(t + 0.04);
    } else if (shoe === "sandals") {
      const o1 = audioContext.createOscillator(),
        g1 = audioContext.createGain();
      o1.type = "triangle";
      o1.frequency.setValueAtTime(1100, t);
      o1.frequency.exponentialRampToValueAtTime(220, t + 0.02);
      g1.gain.setValueAtTime(0.11, t);
      g1.gain.exponentialRampToValueAtTime(0.001, t + 0.025);
      o1.connect(g1).connect(masterGain);
      o1.start(t);
      o1.stop(t + 0.03);
    } else {
      const osc = audioContext.createOscillator(),
        g = audioContext.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(110, t);
      osc.frequency.exponentialRampToValueAtTime(40, t + 0.05);
      g.gain.setValueAtTime(0.11, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.055);
      osc.connect(g).connect(masterGain);
      osc.start(t);
      osc.stop(t + 0.06);
    }
  }
  /* 潜行状态门禁：心跳声只在尾行/潜伏/伪装接触/终局激活，准备期与熟络社交静默 */
  const HUNTER_MODES = { stealth: 1, contact: 1, vehicle: 1 };

  function scheduleAudio() {
    if (!audioOn || audioContext.state !== "running") return;
    if (!HUNTER_MODES[getMode()]) {
      audioTimer = lifecycle.timeout(scheduleAudio, 300);
      return;
    } // 待命：切回潜行模式自动恢复
    const period = 60 / heartToBpm(getHeart());
    const freq = heartFreq(getHeart());
    const volLevel = (0.55 + (getHeart() / 100) * 0.45) * vol.heart; // 基础翻倍：满值贴 1.0
    const now = audioContext.currentTime;
    if (nextBeat < now - 0.12) nextBeat = now + 0.04;
    while (nextBeat < now + 0.12) {
      thump(nextBeat, freq, volLevel);
      thump(
        nextBeat + Math.min(0.16, period * 0.22),
        freq * 0.9,
        volLevel * 0.8,
      );
      nextBeat += period;
    }
    audioTimer = lifecycle.timeout(scheduleAudio, 25);
    tinnitus();
  }
  function syncAudioTempo() {
    if (!audioOn) return;
    lifecycle.clearTimeout(audioTimer);
    cancelVoices();
    nextBeat = audioContext.currentTime + 0.04;
    scheduleAudio();
    const periodMs = 60000 / heartToBpm(getHeart());
    for (const animation of root.getAnimations({ subtree: true })) {
      const phase = animation.animationName === "ecg-scroll" ? 22 / 72 : 0.12;
      if (["ecg-scroll", "beat", "ring-beat"].includes(animation.animationName))
        animation.currentTime = phase * periodMs - 40;
    }
  }
  async function toggleAudio() {
    if (audioOn || audioPending) return stopAudio();
    if (!getSnapshot()) return soundUI("完成开局后再开启心跳声");
    if (!AudioCtor) return soundUI("当前浏览器不支持心跳音效");
    if (document.hidden) return soundUI("回到页面后点击开启心跳声");
    const revision = ++audioRevision;
    audioPending = true;
    soundUI("正在开启心跳声…");
    try {
      if (!audioContext || audioContext.state === "closed") {
        audioContext = new AudioCtor();
        masterGain = audioContext.createGain();
        masterGain.gain.value = 1;
        masterGain.connect(audioContext.destination);
        heartBus = audioContext.createGain();
        heartBus.gain.value = 1;
        heartBus.connect(masterGain);
        lifecycle.on(audioContext, "statechange", () => {
          if (audioOn && audioContext.state !== "running")
            stopAudio("播放已暂停，点击可重新开启");
        });
      }
      await audioContext.resume();
      if (revision !== audioRevision || !root.isConnected || document.hidden)
        return;
      if (audioContext.state !== "running") throw new Error("no resume");
      audioPending = false;
      audioOn = true;
      createRain();
      updateRainTunnel();
      syncAudioTempo();
      updateAudioStatus();
    } catch {
      if (revision === audioRevision)
        stopAudio("未能播放，点击可重试；也可保持静音");
    }
  }
  if (!AudioCtor) {
    soundButton.disabled = true;
    soundUI("当前浏览器不支持心跳音效");
  }
  /* 结算 spike：+8 刺激的重拍（真机由中控结算回执触发） */
  function spike() {
    if (__WX_PREVIEW__) {
      if (!audioOn) return soundUI("先开启雨夜心跳声，再试 spike");
      const t = audioContext.currentTime,
        v = (0.55 + (getHeart() / 100) * 0.45) * vol.heart;
      thump(t, 38, Math.max(v, 0.5) * 1.9);
      thump(t + 0.15, 36, Math.max(v, 0.5) * 1.5);
      const vig = document.getElementById("trpgVignette");
      if (vig) {
        vig.classList.remove("pulse");
        void vig.offsetWidth;
        vig.classList.add("pulse");
      }
      const snap = getSnapshot();
      if (snap)
        renderSnapshot({
          ...snap,
          player: {
            ...snap.player,
            heart: Math.min(100, snap.player.heart + 8),
          },
        });
    }
  }

  /* 三音量滑条联动 */
  function applyVolumes() {
    if (heartBus)
      heartBus.gain.setTargetAtTime(vol.heart, audioContext.currentTime, 0.05);
    if (audioOn) {
      tinnitus();
      updateRainTunnel();
    }
  }

  lifecycle.cleanup(() => {
    stopAudio();
    if (audioContext && audioContext.state !== "closed")
      audioContext.close().catch(() => {});
  });
  return {
    getRainState,
    HUNTER_MODES,
    updateAudioStatus,
    stopAudio,
    toggleAudio,
    spike,
    applyVolumes,
    tinnitus,
    updateRainTunnel,
    syncAudioTempo,
    playShutterSound,
    playFootstepSound,
    playEnvAudio,
    vol,
    get context() {
      return audioContext;
    },
    get audioOn() {
      return audioOn;
    },
  };
}
module.exports = { createAudio };
