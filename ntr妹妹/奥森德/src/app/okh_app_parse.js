/**
 * @module okh_app_parse
 * @updated 2026-11-18 21:08
 * @status  active
 * @reason  只解析唯一闭合状态栏；扩展 <economy op="buy_supply" count="N" /> 补给采买解析并保持数值防作弊校验
 * @deps    OKHBackgroundModules.utils
 * @provides { statusBody, grabTags, parseAttrs, parseDayClock, parseActivity, parseInteract, parseMove, parseStatusBar, buildFront, compareEnd }
 */
(function (root) {
  'use strict';
  const u = root.OKHBackgroundModules?.utils;
  if (!u) throw Error('parse 缺少 utils');

  const PROLOGUE_FLAGS = new Set(['ed_joined', 'arrived_oakhaven']);

  function statusBody(text) {
    const outside = String(text || '').replace(/```[\s\S]*?```/g, '')
      .replace(/<content\b[^>]*>[\s\S]*?<\/content\s*>/gi, '');
    const matches = [...outside.matchAll(/<status_bar\b[^>]*>([\s\S]*?)<\/status_bar\s*>/gi)];
    const starts = (outside.match(/<status_bar\b/gi) || []).length;
    u.check(starts === matches.length, 'status_bar 未闭合');
    u.check(matches.length <= 1, '每轮只能有一个 status_bar');
    return matches[0]?.[1] ?? null;
  }

  function parseAttrs(raw) {
    const attrs = {};
    const remaining = raw.replace(/([\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g, (_, name, a, b) => {
      u.check(u.id(name) && !u.own(attrs, name), '重复或非法标签属性：' + name);
      attrs[name] = a ?? b;
      return '';
    });
    u.check(!remaining.trim(), '标签属性必须使用引号');
    return attrs;
  }

  function rawTags(body) {
    const out = [], re = /<([a-z_][\w-]*)\b((?:"[^"]*"|'[^']*'|[^'"<>])*)\/\s*>/gi;
    let match;
    while ((match = re.exec(body || '')) !== null) {
      out.push({ name: match[1].toLowerCase(), attrs: parseAttrs(match[2]) });
    }
    return out;
  }

  function grabTags(text, tagName) {
    return rawTags(statusBody(text)).filter(t => t.name === tagName).map(t => t.attrs);
  }

  function parseDayClock(raw) {
    if (typeof raw !== 'string') return null;
    const match = /^(\d+)日\s*(\d{1,2}):(\d{2})$/.exec(raw.trim());
    if (!match) return null;
    const day = Number(match[1]), hour = Number(match[2]), min = Number(match[3]);
    if (day < 1 || hour >= 24 || min >= 60) return null;
    const value = (day - 1) * 1440 + hour * 60 + min;
    return u.minute(value) ? value : null;
  }

  function parseAtAttr(rawAt, fromMin, toMin) {
    if (rawAt === undefined) return undefined;
    if (rawAt === 'start' || rawAt === 'end') return rawAt;
    const value = parseDayClock(rawAt);
    u.check(value !== null && value >= fromMin && value <= toMin, '标签时间 at 非法或超出本轮区间：' + rawAt);
    return value;
  }

  function toMinute(spec, fallback, fromMin, toMin) {
    if (spec === undefined) return fallback;
    if (spec === 'start') return fromMin;
    if (spec === 'end') return toMin;
    return spec;
  }

  function parseStatusBar(text) {
    const body = statusBody(text), diagnostics = [];
    const tags = rawTags(body);
    const times = tags.filter(t => t.name === 'time');
    u.check(times.length <= 1, '状态栏只能有一个 time');
    const time = times[0]?.attrs;
    let elapsed = null, endMin = null;
    if (time?.elapsed !== undefined) {
      const value = Number(time.elapsed);
      if (/^\d+$/.test(time.elapsed) && Number.isSafeInteger(value) && value <= 1440) elapsed = value;
      else diagnostics.push('elapsed 非法，按缺失时间处理；不截断小数');
    }
    if (time?.end) {
      endMin = parseDayClock(time.end);
      if (endMin === null) diagnostics.push('end 格式非法，不能校验落幕时间');
    }
    const confirmations = rawTags(body?.replace(/<!--[\s\S]*?-->/g, ''))
      .filter(t => t.name === 'reveal_delivered');
    let revealDeliveryId = null;
    if (confirmations.length === 1 && u.id(confirmations[0].attrs.id)) {
      const plainReply = String(text || '').replace(/```[\s\S]*?```/g, '').replace(/<!--[\s\S]*?-->/g, '');
      const scenes = [...plainReply.matchAll(/<content\b[^>]*>([\s\S]*?)<\/content\s*>/gi)].map(match => match[1]);
      const depictsReveal = scenes.some(scene => scene.split(/[。！？!?\r\n]/).some(sentence =>
        /[爱艾]德/.test(sentence) &&
        /真身|原形|古龙|巨龙|恶龙|龙躯|龙形/.test(sentence) &&
        /显露|显出|显化|现出|露出|变成|化成|化为|化作|就是|正是|竟是|原来是|实为|现身/.test(sentence) &&
        !/(?:没有|尚未|仍未|未曾|不曾)\s*(?:显露|显出|显化|现出|露出|变成|化成|化为|化作|现身)/.test(sentence)));
      if (depictsReveal) revealDeliveryId = confirmations[0].attrs.id;
    }
    return { elapsed, end: time?.end || null, endMin, diagnostics, hasStatus: body !== null, revealDeliveryId };
  }

  function inferEventNpcId(world, config, eventId, rawNpc) {
    if (rawNpc) return rawNpc;
    const def = (config.events || []).find(item => item.id === eventId);
    if (def?.scope === 'world') return null;
    if (def?.targets?.length === 1) return def.targets[0];
    const pendingQ = (world.bg?.queue || []).find(q => q.definitionId === eventId && q.status === 'pending');
    if (pendingQ) return pendingQ.npcId ?? null;
    return null;
  }

  function collectPrologueSteps(tags, world, now) {
    const steps = [];
    const seen = new Set();
    let arrivedAtMin = world.flags?.arrived_oakhaven ? -Infinity : Infinity;

    for (const { name, attrs } of tags) {
      if (name !== 'prologue_step') continue;
      u.check(PROLOGUE_FLAGS.has(attrs.flag), '未知前传里程碑：' + attrs.flag);
      const at = parseAtAttr(attrs.at, world.timeMin, now);
      if (attrs.flag === 'arrived_oakhaven') {
        arrivedAtMin = Math.min(arrivedAtMin, toMinute(at, now, world.timeMin, now));
      }
      if (!seen.has(attrs.flag)) {
        seen.add(attrs.flag);
        steps.push(at === undefined ? attrs.flag : { flag: attrs.flag, at });
      }
    }
    return { steps, arrivedAtMin };
  }

  function parseActivityTag(a, ctx) {
    const { world, known, patch, location, relocate, diagnostics, virtual, config, now, token } = ctx;
    if (!known(a.npc)) return;
    u.check(['start', 'finish', 'cancel'].includes(a.op), 'activity op 非法');
    const at = parseAtAttr(a.at, world.timeMin, now);
    if (!u.own(virtual, a.npc)) virtual[a.npc] = world.npcs[a.npc].activity;
    const cur = virtual[a.npc];
    let change;
    if (a.op === 'start') {
      const kind = a.kind || 'ordinary';
      u.check(['ordinary', 'important', 'special'].includes(kind) && a.label?.trim(), '活动必须有合法 kind 和 label');
      const same = cur && cur.kind === kind && cur.label.trim() === a.label.trim();
      const id = a.id || (same ? cur.id : 'act:' + a.npc + ':' + token + ':' + ctx.index++);
      u.check(u.id(id), '活动 ID 非法');
      change = { op: 'start', id, kind, label: a.label.trim(), source: 'narrative' };
      if (a.replace === 'true') change.replace = true;
      if (a.rule) {
        u.check(kind !== 'ordinary' && u.own(config.releaseRules || {}, a.rule), '活动解除规则未知或不适用');
        change.releaseRule = a.rule;
      } else if (same && cur.releaseRule) change.releaseRule = cur.releaseRule;
      if (kind !== 'ordinary') u.check(change.releaseRule, 'important/special 必须申报 rule');
      virtual[a.npc] = { ...change, startedAt: same ? cur.startedAt : toMinute(at, now, world.timeMin, now) };
    } else {
      if (!cur) { diagnostics.push('忽略无当前活动的 ' + a.op + '：' + a.npc); return; }
      change = { op: a.op, id: a.id || cur.id };
      virtual[a.npc] = null;
    }
    if (at !== undefined) change.at = at;
    (patch(a.npc).activities ||= []).push(change);

    if (a.to !== undefined) {
      const to = location(a.to);
      if (relocate(world.npcs[a.npc], to, a.npc, at)) {
        const npcPatch = patch(a.npc);
        if (npcPatch.location !== undefined || npcPatch.moves) {
          if (!npcPatch.moves) {
            npcPatch.moves = [{ to: npcPatch.location, ...(npcPatch.locationAt !== undefined ? { at: npcPatch.locationAt } : {}) }];
            delete npcPatch.location;
            delete npcPatch.locationAt;
          }
          npcPatch.moves.push({ to, ...(at !== undefined ? { at } : {}) });
        } else {
          npcPatch.location = to;
          if (at !== undefined) npcPatch.locationAt = at;
        }
      }
    }
  }

  function buildFront(text, now, world, options = {}) {
    const tags = rawTags(statusBody(text)), diagnostics = [], npcs = {}, virtual = {}, playerMoves = [];
    const front = { interactingIds: [] }, interacting = new Set();
    const token = options.token || String(now), config = options.config || {};
    const canMoveFn = typeof options.canMove === 'function' ? options.canMove : config.canMove;
    const { steps: prologueSteps, arrivedAtMin } = collectPrologueSteps(tags, world, now);
    if (prologueSteps.length) front.prologueSteps = prologueSteps;

    const known = id => u.own(world.npcs, id) ? true : (diagnostics.push('忽略未知角色：' + id), false);
    const patch = id => npcs[id] ||= {};
    const location = value => {
      u.check(u.id(value) && (!options.locations || u.own(options.locations, value)), '未知地点：' + value);
      return value;
    };
    let simPlayerLoc = world.playerLocation;
    const relocate = (npc, to, label, atSpec) => {
      if (!canMoveFn) return true;
      const moveMin = toMinute(atSpec, now, world.timeMin, now);
      const unlocked = arrivedAtMin <= moveMin;
      const nextFlags = unlocked && !world.flags?.arrived_oakhaven
        ? { ...(world.flags || {}), arrived_oakhaven: true }
        : world.flags;
      const simWorld = { ...world, playerLocation: simPlayerLoc, flags: nextFlags };
      if (canMoveFn(simWorld, to, npc)) return true;
      const prefix = !simWorld.flags?.arrived_oakhaven ? '前传未抵镇前阻止移动：' : '当前阶段禁止移动：';
      diagnostics.push(prefix + to + (label ? '（' + label + '）' : ''));
      return false;
    };

    const counts = { focus: 0, room: 0 };
    const actCtx = { world, known, patch, location, relocate, diagnostics, virtual, config, now, token, index: 0 };

    for (const { name, attrs: a } of tags) {
      if (name === 'move') {
        const to = location(a.to);
        const at = parseAtAttr(a.at, world.timeMin, now);
        if (a.npc) {
          if (known(a.npc) && relocate(world.npcs[a.npc], to, a.npc, at)) {
            const p = patch(a.npc);
            if (p.location !== undefined || p.moves) {
              if (!p.moves) {
                p.moves = [{ to: p.location, ...(p.locationAt !== undefined ? { at: p.locationAt } : {}) }];
                delete p.location;
                delete p.locationAt;
              }
              p.moves.push({ to, ...(at !== undefined ? { at } : {}) });
            } else {
              p.location = to;
              if (at !== undefined) p.locationAt = at;
            }
          }
        } else if (relocate(null, to, 'player', at)) {
          simPlayerLoc = to;
          playerMoves.push({ to, ...(at !== undefined ? { at } : {}) });
        }
      } else if (name === 'interact') {
        if (known(a.npc)) interacting.add(a.npc);
      } else if (name === 'focus') {
        u.check(++counts.focus === 1, '本轮只能申报一个 focus');
        if (known(a.npc)) front.focusNpcId = a.npc;
      } else if (name === 'room') {
        u.check(++counts.room === 1 && (a.state === 'together' || a.state === 'separate'), 'room 申报非法');
        if (a.state === 'together') u.check(a.npc && u.own(world.npcs, a.npc), 'room together 需要已知 npc');
        const at = parseAtAttr(a.at, world.timeMin, now);
        front.room = { npc: a.npc || null, state: a.state, ...(at !== undefined ? { at } : {}) };
      } else if (name === 'bond') {
        u.check(a.delta === undefined && a.value === undefined && a.add === undefined, 'bond 只能申报事实，禁止携带数值字段');
        u.check(u.id(a.kind) && typeof a.npc === 'string' && a.npc.trim(), 'bond 缺少合法 npc 或 kind');
        const at = parseAtAttr(a.at, world.timeMin, now);
        let item;
        if (a.item !== undefined) {
          item = typeof a.item === 'string' ? a.item.trim() : '';
          u.check(item.length > 0 && item.length <= 24, 'bond 的 item 必须为 1~24 字非空短词');
        }
        if (known(a.npc)) {
          (front.bonds ||= []).push({
            npc: a.npc,
            kind: a.kind,
            ...(item !== undefined ? { item } : {}),
            ...(at !== undefined ? { at } : {})
          });
        }
      } else if (name === 'event_resolve') {
        u.check(u.id(a.id) && u.id(a.outcome), 'event_resolve 缺少合法 id 或 outcome');
        if (a.npc && !known(a.npc)) continue;
        const at = parseAtAttr(a.at, world.timeMin, now);
        const npcId = inferEventNpcId(world, config, a.id, a.npc);
        (front.resolveEvents ||= []).push({ eventId: a.id, npcId, outcome: a.outcome, ...(at !== undefined ? { at } : {}) });
      } else if (name === 'economy') {
        u.check(
          a.amount === undefined && a.delta === undefined && a.value === undefined && a.add === undefined && a.gold === undefined,
          'economy 只能申报枚举事实，禁止携带数值金额字段'
        );
        u.check(['work', 'repay', 'donate', 'buy_supply'].includes(a.op), 'economy op 非法');
        const at = parseAtAttr(a.at, world.timeMin, now);
        let tier = a.tier;
        let count;
        if (a.op === 'work') {
          u.check(['odd', 'guild_normal', 'guild_high', 'church_paid', 'church_volunteer'].includes(tier), 'economy work tier 非法');
        } else if (a.op === 'repay') {
          u.check(['aurora', 'nise'].includes(a.npc), 'economy repay npc 非法');
          tier = tier || 'part';
          u.check(['part', 'all'].includes(tier), 'economy repay tier 非法');
        } else if (a.op === 'donate') {
          u.check(a.npc === 'cecilia', 'economy donate npc 非法');
          tier = tier || 'small';
          u.check(['small', 'large'].includes(tier), 'economy donate tier 非法');
        } else if (a.op === 'buy_supply') {
          const rawCount = a.count === undefined ? '1' : String(a.count).trim();
          const parsedCount = Number(rawCount);
          // 99 = 单次购入补给份数上限，防止误报或异常大额单笔刷单
          u.check(/^\d+$/.test(rawCount) && Number.isSafeInteger(parsedCount) && parsedCount >= 1 && parsedCount <= 99,
            'economy buy_supply count 必须为 1~99 的整数');
          count = parsedCount;
        }
        (front.economies ||= []).push({
          op: a.op,
          ...(tier !== undefined ? { tier } : {}),
          ...(count !== undefined ? { count } : {}),
          ...(a.npc ? { npc: a.npc } : {}),
          ...(at !== undefined ? { at } : {})
        });
      } else if (name === 'activity') {
        parseActivityTag(a, actCtx);
      }
    }

    if (playerMoves.length === 1) {
      front.playerLocation = playerMoves[0].to;
      if (playerMoves[0].at !== undefined) front.playerLocationAt = playerMoves[0].at;
    } else if (playerMoves.length > 1) {
      front.playerMoves = playerMoves;
    }

    for (const [id, data] of Object.entries(npcs)) {
      if (data.activities?.some(a => a.op === 'start')) interacting.delete(id);
      if (data.activities?.length === 1) { data.activity = data.activities[0]; delete data.activities; }
    }
    if (Object.keys(npcs).length) front.npcs = npcs;
    front.interactingIds = [...interacting];
    Object.defineProperty(front, 'diagnostics', { value: diagnostics, enumerable: false });
    return front;
  }

  function parseActivity(text, now, world, options) { return buildFront(text, now, world, options).npcs || {}; }
  function parseInteract(text) { return [...new Set(grabTags(text, 'interact').map(a => a.npc).filter(Boolean))]; }
  function parseMove(text) { return grabTags(text, 'move').find(a => !a.npc)?.to || null; }
  function compareEnd(parsed, expectedMin) {
    return {
      expectedMin,
      reportedEnd: parsed.end,
      reportedMin: parsed.endMin,
      ok: parsed.endMin === null ? null : parsed.endMin === expectedMin,
      deviationMin: parsed.endMin === null ? null : parsed.endMin - expectedMin
    };
  }

  root.OKH_APP_PARSE = Object.freeze({
    statusBody, grabTags, parseAttrs, parseDayClock, parseActivity, parseInteract,
    parseMove, parseStatusBar, buildFront, compareEnd
  });
})(globalThis);
