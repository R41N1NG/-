'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const test = require('node:test');

const root = __dirname;
const card = JSON.parse(fs.readFileSync(path.resolve(root, '../../最新角色卡/奥克赫斯.json'), 'utf8'));
const oldTest = path.join(root, 'test_foundation.cjs');
const header = fs.readFileSync(oldTest, 'utf8').split('async function runTests()')[0];
const holder = { exports: {} };
new Function('require', '__dirname', 'module', header + '\nmodule.exports={createSandbox,makeStorage};')(
  require, path.dirname(oldTest), holder
);
const { createSandbox, makeStorage } = holder.exports;

test('valid V2 card with 32 formal lorebook entries, zero dead macros, PHASES sync & anti-spoiler guards', () => {
  assert.equal(card.spec, 'chara_card_v2');
  assert.equal(card.spec_version, '2.0');
  assert(card.data.character_book.token_budget >= 6000);
  const entries = card.data.character_book.entries;
  assert.equal(entries.length, 32);
  assert.equal(new Set(entries.map(e => e.id)).size, entries.length);
  for (const entry of entries) {
    assert.equal(entry.enabled, true);
    assert(Array.isArray(entry.keys));
    assert(entry.content.trim());
    assert.equal(typeof entry.insertion_order, 'number');
    assert(!/\{\{getvar::/i.test(entry.content), `entry ${entry.comment} still has getvar macro`);
    assert(!/极其|极度|彻底|臣服|献祭|近乎|绝对|尽数|不可或缺|顺从|终极|神坛/.test(entry.content),
      `entry ${entry.comment} violates banned-word check`);
    if (entry.position === 'at_depth') {
      assert.equal(entry.extensions.position, 4);
      assert(Number.isInteger(entry.extensions.depth) && entry.extensions.depth >= 0);
    } else if (entry.position === 'before_char') {
      assert.equal(entry.extensions.position, 0);
    }
    if (entry.constant) {
      assert(!/太古古龙王|恶龙艾德|古兰生父|表面伪装|主人钦定/.test(entry.content),
        `constant entry ${entry.comment} leaks hidden plot/meta`);
    }
  }
  const timeLore = entries.find(e => e.comment.includes('时序作息'));
  assert(timeLore && timeLore.content.includes('06:00-09:59') && timeLore.content.includes('10:00-16:59'));
  assert(!/06:00-11:59|12:00-17:59/.test(timeLore.content));

  const powerLore = entries.find(e => e.comment.includes('武力法则'));
  assert(powerLore.content.includes('古兰 (血脉激发'));
  assert(powerLore.content.includes('爱德'));

  const edSurface = entries.filter(e => e.comment.endsWith('·爱德'));
  assert.equal(edSurface.length, 2);
  for (const e of edSurface) {
    assert.deepEqual(e.keys, ['爱德']);
    assert(!/太古古龙王|恶龙艾德/.test(e.content));
  }
  const edTrue = entries.filter(e => e.comment.includes('恶龙艾德'));
  assert.equal(edTrue.length, 0, '旧版恶龙艾德双轨条目已彻底移除，爱德纯化为普通伙伴');
});

test('all configured IDs, locations, room & bond kinds are documented', () => {
  const sb = createSandbox();
  for (const npc of sb.OKH_APP_CONFIG.ROSTER) {
    assert(card.data.description.includes(npc.id));
    assert(card.data.personality.includes(npc.name));
  }
  for (const id of Object.keys(sb.OKH_APP_CONFIG.LOCATIONS)) {
    assert(card.data.description.includes(id));
  }
  assert(card.data.description.includes('manualRelease'));
  assert(card.data.description.includes('<event_resolve'));
  assert(card.data.description.includes('<prologue_step'));
  assert(card.data.description.includes('<room'));
  assert(card.data.description.includes('together') && card.data.description.includes('separate'));
  for (const kind of ['spar', 'care', 'gear', 'guild_report', 'wilds_assist', 'calm', 'confide', 'watch', 'duty', 'offend']) {
    assert(card.data.description.includes(kind), `description missing gulan bond kind: ${kind}`);
  }
  for (const kind of ['comfort', 'steady_work', 'share_food', 'scout_chat', 'gift', 'wilds_assist', 'offend']) {
    assert(card.data.description.includes(kind), `description missing isna bond kind: ${kind}`);
  }
  for (const kind of ['tease_back', 'magic_help', 'night_chat', 'treat', 'escort', 'wilds_assist', 'guide', 'novelty', 'offend']) {
    assert(card.data.description.includes(kind), `description missing nise bond kind: ${kind}`);
  }
  for (const kind of ['help_chores', 'heal_care', 'reassure', 'church_visit', 'gift', 'wilds_assist', 'offend']) {
    assert(card.data.description.includes(kind), `description missing aurora bond kind: ${kind}`);
  }
  for (const kind of ['care_watch', 'encourage', 'scout_prep', 'cover_hide', 'rescue_shield', 'offend']) {
    assert(card.data.description.includes(kind), `description missing eileen bond kind: ${kind}`);
  }
  for (const kind of ['mass_pray', 'help_orphans', 'herb_assist', 'night_talk', 'church_gift', 'shield_church', 'offend']) {
    assert(card.data.description.includes(kind), `description missing cecilia bond kind: ${kind}`);
  }
  for (const kind of ['ask_intel', 'teach_skills', 'ask_sister']) {
    assert(card.data.description.includes(kind), `description missing ed bond kind: ${kind}`);
  }
  assert(card.data.description.includes('<economy'));
  for (const tier of ['odd', 'guild_normal', 'guild_high', 'church_paid', 'church_volunteer']) {
    assert(card.data.description.includes(tier), `description missing economy work tier: ${tier}`);
  }
  assert(card.data.description.includes('buy_supply'), 'description missing economy buy_supply contract');
  assert(card.data.description.includes('item="'));
});

test('extensions bundle HUD regexes and live autostart without depth_prompt, synced to dist', () => {
  assert.equal(card.data.extensions.depth_prompt, undefined);
  const regexes = card.data.extensions.regex_scripts;
  assert.equal(regexes.length, 4);
  assert.equal(regexes[0].id, 'okh-regex-hud-draft-clean');
  assert.equal(regexes[1].id, 'okh-regex-hud-render');
  assert.equal(regexes[2].id, 'okh-regex-hud-streaming-hide');
  assert.equal(regexes[3].id, 'okh-regex-content-strip');
  for (const r of regexes) {
    assert.equal(r.disabled, false);
    assert.equal(r.markdownOnly, true);
    assert.equal(r.promptOnly, false);
    assert.deepEqual(r.placement, [2]);
  }
  let sample = '<content>正文。</content>\n<status_bar><time elapsed="5" /></status_bar>\n<status_bar><time elapsed="10" /></status_bar>';
  for (const r of regexes) {
    const m = r.findRegex.match(/^\/([\s\S]*)\/([gimsuy]*)$/);
    assert(m, `invalid ST regex syntax: ${r.findRegex}`);
    sample = sample.replace(new RegExp(m[1], m[2]), r.replaceString);
  }
  assert(!sample.includes('<status_bar>') && !sample.includes('<content>') && !sample.includes('</content>'));
  assert.equal((sample.match(/data-okh-hud/g) || []).length, 1);

  const scripts = card.data.extensions.tavern_helper?.scripts || [];
  assert.equal(scripts.length, 1);
  assert.equal(scripts[0].id, 'okh-complete-autostart');
  const builtAuto = fs.readFileSync(path.resolve(root, '../../tavern_scripts/okh_complete_autostart.js'), 'utf8');
  assert.equal(scripts[0].content, builtAuto);

  const distCardPath = path.resolve(root, '../../dist/奥克赫斯.json');
  assert.equal(fs.readFileSync(distCardPath, 'utf8'),
    fs.readFileSync(path.resolve(root, '../../最新角色卡/奥克赫斯.json'), 'utf8'));

  const sb = createSandbox();
  const cfg = sb.OKH_APP_CONFIG.buildConfig();
  const w = sb.OKHBackground.init(sb.OKH_APP_CONFIG.buildInitialWorld(), cfg);
  const hudHtml = sb.OKH_APP_HUD.buildHudHtml(w);
  assert(hudHtml.includes('okh-row-time') && hudHtml.includes('第 1 天 · 夜晚（周一）') && hudHtml.includes('18:00'));
  assert(hudHtml.includes('补给') && hudHtml.includes('×10'), 'Initial HUD displays starting 10 supply');
});

test('opening parses without blocked movement or premature milestones', () => {
  const sb = createSandbox();
  const cfg = sb.OKH_APP_CONFIG.buildConfig();
  const w = sb.OKHBackground.init(sb.OKH_APP_CONFIG.buildInitialWorld(), cfg);
  const parsed = sb.OKH_APP_PARSE.parseStatusBar(card.data.first_mes);
  assert.equal(parsed.elapsed, 0);
  assert.equal(parsed.endMin, w.timeMin);
  const front = sb.OKH_APP_PARSE.buildFront(card.data.first_mes, w.timeMin, w,
    { config: cfg, locations: sb.OKH_APP_CONFIG.LOCATIONS, canMove: cfg.canMove });
  assert.equal(front.diagnostics.length, 0);
  const state = sb.OKHBackground.advance(w, {
    id: 'card-opening', revision: 'r1', toMin: w.timeMin, interactingIds: front.interactingIds, front
  }, cfg).state;
  assert.equal(state.playerLocation, 'wilds');
  assert.equal(state.flags.arrived_oakhaven, false);
  assert.equal(state.flags.ed_joined, false);
  assert.equal(state.npcs.ed.monitored, false);
  assert.equal(state.npcs.eileen.monitored, false);
  assert.equal(state.npcs.eileen.location, 'manor');
  assert.equal(state.npcs.eileen.values.counterattack, 0);
  assert.equal(state.npcs.eileen.values.affection, 0);
  assert.equal(state.npcs.cecilia.location, 'church');
  assert.equal(state.npcs.nise.values.curiosity, 40);
  assert.equal(state.npcs.nise.values.affection, 70);
  assert.equal(state.npcs.aurora.values.debt_pressure, 100);
  assert.equal(state.npcs.aurora.values.affection, 50);
});

test('example reply uses valid time and tags after the opening', () => {
  const sb = createSandbox();
  const cfg = sb.OKH_APP_CONFIG.buildConfig();
  const w = sb.OKHBackground.init(sb.OKH_APP_CONFIG.buildInitialWorld(), cfg);
  const reply = card.data.mes_example.split('{{char}}: ')[1];
  const p = sb.OKH_APP_PARSE.parseStatusBar(reply);
  assert.equal(p.endMin, w.timeMin + p.elapsed);
  const front = sb.OKH_APP_PARSE.buildFront(reply, p.endMin, w,
    { config: cfg, locations: sb.OKH_APP_CONFIG.LOCATIONS, canMove: cfg.canMove });
  assert.equal(front.diagnostics.length, 0);
  const state = sb.OKHBackground.advance(w, {
    id: 'sample', revision: 'r1', toMin: p.endMin, interactingIds: front.interactingIds, front
  }, cfg).state;
  assert.equal(state.timeMin, 1090);
  assert.equal(state.interactingIds.includes('nise'), true);
});

test('pending-event ledger supplies registered IDs and choices, including legacy records', () => {
  const sb = createSandbox();
  const cfg = sb.OKH_APP_CONFIG.buildConfig();
  let w = sb.OKHBackground.init(sb.OKH_APP_CONFIG.buildInitialWorld(), cfg);
  w.timeMin = sb.OKH_APP_CONFIG.DAY(8, 14);
  w.flags.arrived_oakhaven = true;
  w.playerLocation = 'inn';
  w.npcs.isna.location = 'inn';
  w.npcs.isna.values.gold_desire = 35;
  w = sb.OKHBackground.advance(w, {
    id: 'notice', revision: 'r1', toMin: w.timeMin, interactingIds: [], front: {}
  }, cfg).state;
  const ledger = sb.OKH_APP_ADAPTER.buildLedger(w);
  assert(ledger.includes('id="isna_tavern_rumor_notice" npc="isna"'));
  assert(ledger.includes('"soothe" / "ignore"'));
  const key = Object.keys(w.bg.eventStates)[0];
  delete w.bg.eventStates[key].instanceId;
  delete w.bg.eventStates[key].occurrence;
  assert(sb.OKH_APP_ADAPTER.buildLedger(w).includes('id="isna_tavern_rumor_notice"'));
  const front = sb.OKH_APP_PARSE.buildFront(
    '<status_bar><event_resolve id="isna_tavern_rumor_notice" npc="isna" outcome="ignore" /></status_bar>',
    w.timeMin, w, { config: cfg }
  );
  w = sb.OKHBackground.advance(w, {
    id: 'choose', revision: 'r1', toMin: w.timeMin, interactingIds: [], front
  }, cfg).state;
  assert.equal(w.bg.eventStates[key].status, 'resolved');
  assert(!sb.OKH_APP_ADAPTER.buildLedger(w).includes('待决事件：id="isna_tavern_rumor_notice"'));
});

test('autostart registers listeners, processes greeting once and preserves existing save', async () => {
  const sb = createSandbox();
  makeStorage(sb);
  const listeners = new Map();
  sb.OKH_APP.configure({
    eventOn: (name, fn) => listeners.set(name, fn),
    eventOff: name => listeners.delete(name),
    events: sb._ctxObj.event_types
  });
  sb._ctxObj.chat = [{ is_user: false, mes: card.data.first_mes }];
  const boot = fs.readFileSync(path.join(root, 'autostart.js'), 'utf8');
  try {
    vm.runInContext(boot, sb);
    await sb.OKH_CARD_READY;
    assert(listeners.has('GENERATION_STARTED'));
    assert(listeners.has('MESSAGE_RECEIVED'));
    const once = JSON.stringify(sb.OKH_APP.world());
    vm.runInContext(boot, sb);
    await sb.OKH_CARD_READY;
    assert.equal(JSON.stringify(sb.OKH_APP.world()), once);
    await sb.OKH_APP.step(10);
    const progressed = JSON.stringify(sb.OKH_APP.world());
    vm.runInContext(boot, sb);
    await sb.OKH_CARD_READY;
    assert.equal(JSON.stringify(sb.OKH_APP.world()), progressed);
  } finally {
    await sb.OKH_APP.stop();
  }
  assert.equal(listeners.size, 0);
});
