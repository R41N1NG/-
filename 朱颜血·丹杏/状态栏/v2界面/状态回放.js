/**
 * 朱颜血 · 历时与状态记录汇总模块 (zyx_status_records.js)
 * 职责：
 * 1. 扫描回放各楼层的状态明报（时间、耗时、地点、各角色状态）；
 * 2. 桥接 ZYXPrisonTracker，精确计算仅包含“明确已关押角色”的人犯列表。
 */

(function (global) {
  'use strict';

  const ledger = global.ZYXMartialLedger || (typeof require === 'function' ? require('./zyx_martial_ledger.js') : null);
  const tracker = global.ZYXPrisonTracker || (typeof require === 'function' ? require('./zyx_prison_tracker.js') : null);
  const known = value => !!value && !/^(未明|未知|未记录|未登记|不详)$/.test(value.trim());

  function parseStatus(input) {
    const body = String(input ?? '').replace(/<(think|analysis)>[^]*?<\/\1>/gi, '').replace(/<details\b[^>]*>[^]*?<\/details>/gi, '');
    const matches = [...body.matchAll(/<status_bar>((?:(?!<status_bar>)[^])*?)<\/status_bar>/g)];
    if (matches.length !== 1 || !/^(?:---)?$/.test(body.slice(matches[0].index + matches[0][0].length).trim())) return null;
    const result = {};
    const tags = [
      'time', 'elapsed', 'location', 'bailian_state', 'shuangling_state',
      'danniang_state', 'yuniang_state', 'baiyulian_state', 'xieyunsu_state',
      'junzhu_state', 'qingluo_state', 'prison_control', 'roster_event', 'news_near', 'news_mid', 'clue', 'environment', 'crisis', 'intel_delta'
    ];
    for (const tag of tags) {
      const hits = [...matches[0][1].matchAll(new RegExp('<' + tag + '>([^<]*)</' + tag + '>', 'g'))];
      result[tag] = hits.length === 1 ? ledger.decodeText(hits[0][1]) : '';
    }
    return result;
  }

  function collect(reports, source) {
    const latest = reports.at(-1) ?? {};
    // 关键：通过中控 PrisonTracker 过滤，只有明确关押的角色才出现在监牢名单中！
    const activePrisoners = tracker ? tracker.getImprisonedList(reports) : [];
    const allRoster = tracker ? tracker.evaluateRoster(reports) : [];

    return {
      source,
      // 仅包含明确已关押的角色名单
      prisoners: activePrisoners,
      // 全量 8 人监视名单供后台查阅
      allPrisoners: allRoster,
      time: latest.time || '未明',
      elapsed: known(latest.elapsed) && latest.elapsed !== '无' ? latest.elapsed : '待回报',
      history: reports.slice(-30).map(({ floor, time, elapsed, location }) => ({
        floor,
        time: time || '未明',
        elapsed: known(latest.elapsed) && latest.elapsed !== '无' ? latest.elapsed : '待回报',
        location: location || '未明'
      }))
    };
  }

  function fromChat(chat, { cutoff } = {}) {
    if (!Array.isArray(chat) || !Number.isInteger(cutoff) || cutoff < 0 || cutoff >= chat.length) {
      throw new Error('状态记录必须限定当前楼');
    }
    let reports = [];
    for (let i = 0; i <= cutoff; i++) {
      const message = chat[i];
      if (!message || message.is_system) continue;
      const body = String(message.mes ?? message.message ?? '');
      if (message.is_user) {
        if (ledger && ledger.parseOpening(body)) reports = [];
        continue;
      }
      const report = parseStatus(body);
      if (report) reports.push({ ...report, floor: i });
    }
    return collect(reports, 'history');
  }

  function fromSnapshot(snapshot) {
    return collect([{ ...snapshot, floor: null }], 'snapshot');
  }

  const StatusRecords = {
    parseStatus,
    fromChat,
    fromSnapshot
  };

  global.ZYXStatusRecords = StatusRecords;
  global.ZYX = global.ZYX || {};
  global.ZYX.StatusRecords = StatusRecords;

  if (typeof module === 'object' && module.exports) {
    module.exports = StatusRecords;
  }
})(typeof window !== 'undefined' ? window : globalThis);
