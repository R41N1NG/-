(function (root, factory) {
  const value = factory();
  if (typeof window === 'undefined' && typeof module === 'object' && module.exports) module.exports = value;
  else root.BSECore = value;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';
  const VERSION = 1;
  const forbidden = new Set(['__proto__', 'prototype', 'constructor']);
  const clone = value => JSON.parse(JSON.stringify(value));
  const object = v => v !== null && typeof v === 'object' && !Array.isArray(v);
  const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
  function id(prefix = 'ID') { return prefix + '_' + (globalThis.crypto?.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2)); }
  function assert(test, message) { if (!test) throw new Error(message); }
  function safeId(value, name = 'ID') {
    assert(typeof value === 'string' && /^[A-Za-z0-9_-]{1,100}$/.test(value) && !forbidden.has(value), name + ' 只能包含字母、数字、下划线和短横线（1～100 字符）');
    return value;
  }
  function parseJSON(text, label = 'JSON') {
    let value;
    try { value = JSON.parse(text); } catch (e) { throw new Error(label + ' 格式错误：' + e.message); }
    function scan(v) {
      if (v && typeof v === 'object') for (const k of Object.keys(v)) { assert(!forbidden.has(k), label + ' 含有保留字段'); scan(v[k]); }
    }
    scan(value); return value;
  }
  function indexProject(project) {
    return {
      nodes: new Map(project.nodes.map(n => [n.id, n])),
      events: new Map(project.events.map(e => [e.id, e])),
      variables: new Map(project.variables.map(v => [v.id, v])),
      collections: new Map((project.collections || []).map(c => [c.id, c.title])),
    };
  }
  function validateCondition(c, refs, depth = 0) {
    assert(depth < 24, '条件嵌套超过 24 层');
    if (c === undefined || c === null || c === true || c === false) return;
    assert(object(c) && Object.keys(c).length === 1, '每个条件必须只有一个运算符');
    const [op, value] = Object.entries(c)[0];
    if (op === 'all' || op === 'any') {
      assert(Array.isArray(value), op + ' 必须为条件数组'); value.forEach(v => validateCondition(v, refs, depth + 1));
    } else if (op === 'not') validateCondition(value, refs, depth + 1);
    else if (['collected', 'completed', 'visited', 'event_completed'].includes(op)) {
      safeId(value);
      if (op === 'completed' || op === 'visited') assert(refs.nodes.has(value), '条件引用不存在的节点：' + value);
      if (op === 'event_completed') assert(refs.events.has(value), '条件引用不存在的事件：' + value);
    } else if (op === 'variable') {
      assert(object(value) && refs.variables.has(value.id), '条件引用不存在的变量：' + value?.id);
      assert(['eq', 'ne', 'gt', 'gte', 'lt', 'lte'].includes(value.op), '变量比较符无效');
      assert(['number', 'string', 'boolean'].includes(typeof value.value), '变量比较值无效');
      const def = refs.variables.get(value.id);
      assert(typeof value.value === def.type, '变量比较值类型与定义不一致：' + value.id);
      if (def.type === 'number') assert(Number.isFinite(value.value), '变量比较值必须为有限数字');
      if (!['eq', 'ne'].includes(value.op)) assert(def.type === 'number', '大小比较仅支持数值变量');
    } else throw new Error('未知条件运算符：' + op);
  }
  function validateEffects(effects, refs) {
    assert(Array.isArray(effects), '效果必须为数组');
    for (const effect of effects) {
      assert(object(effect) && Object.keys(effect).length === 1, '每个效果必须只有一个操作');
      const [op, value] = Object.entries(effect)[0];
      if (op === 'collect') safeId(value, '收集项 ID');
      else if (op === 'add' || op === 'set') {
        assert(object(value) && refs.variables.has(value.variable), '效果引用不存在的变量：' + value?.variable);
        const def = refs.variables.get(value.variable);
        assert(typeof value.value === def.type, '效果值类型不匹配：' + value.variable);
        if (def.type === 'number') assert(Number.isFinite(value.value), '数值效果必须为有限数字');
        if (op === 'add') assert(def.type === 'number', '只有数值变量可以累加');
      } else throw new Error('未知效果操作：' + op);
    }
  }
  function normalizeProject(input) {
    const p = parseJSON(JSON.stringify(input), '剧本');
    assert(object(p), '剧本必须为对象');
    safeId(p.id, '剧本 ID');
    assert(typeof p.title === 'string' && p.title.trim(), '请填写剧本名称');
    assert(Array.isArray(p.nodes) && p.nodes.length > 0, '剧本至少需要一个节点');
    p.schema_version = VERSION; p.revision = p.revision || id('rev');
    p.events ||= []; p.variables ||= []; p.collections ||= []; p.premise ||= ''; p.original_text ||= '';
    for (const key of ['events', 'variables', 'collections']) assert(Array.isArray(p[key]), key + ' 必须为数组');
    for (const [list, label] of [[p.nodes, '节点'], [p.events, '事件'], [p.variables, '变量'], [p.collections, '收集项']]) {
      const used = new Set();
      for (const entry of list) { assert(object(entry), label + ' 必须为对象'); safeId(entry.id, label + ' ID'); assert(!used.has(entry.id), label + ' ID 重复：' + entry.id); used.add(entry.id); }
    }
    p.variables.forEach(v => {
      v.type ||= typeof v.default;
      assert(['number', 'boolean', 'string'].includes(v.type) && typeof v.default === v.type, '变量类型或默认值无效：' + v.id);
      if (v.type === 'number') {
        assert(Number.isFinite(v.default), '变量默认值必须为有限数字');
        if (v.min !== undefined && v.min !== null) assert(Number.isFinite(v.min), '变量下限无效');
        if (v.max !== undefined && v.max !== null) assert(Number.isFinite(v.max), '变量上限无效');
        assert(v.min == null || v.max == null || v.min <= v.max, '变量下限大于上限');
        assert((v.min == null || v.default >= v.min) && (v.max == null || v.default <= v.max), '变量默认值超出范围');
      }
    });
    const refs = indexProject(p);
    p.start_node_id ||= p.nodes[0].id;
    assert(refs.nodes.has(p.start_node_id), '起点节点不存在');
    p.nodes.forEach(n => {
      assert(typeof n.title === 'string' && n.title.trim(), '节点名称为空：' + n.id);
      n.detail ||= ''; n.guidance ||= ''; n.boundary ||= ''; n.effects ||= []; n.routes ||= []; n.context_variables ||= [];
      assert([n.detail, n.guidance, n.boundary].every(v => typeof v === 'string'), '节点正文必须为文本');
      validateEffects(n.effects, refs);
      assert(Array.isArray(n.context_variables) && n.context_variables.every(v => refs.variables.has(v)), '节点相关变量引用无效');
      assert(Array.isArray(n.routes), '分支出口必须为数组');
      const targets = new Set();
      n.routes.forEach(r => {
        assert(object(r) && refs.nodes.has(r.target), '分支指向不存在的节点：' + r?.target);
        assert(!targets.has(r.target), '同一节点的分支目标重复：' + r.target); targets.add(r.target);
        validateCondition(r.condition, refs);
      });
    });
    p.events.forEach(e => {
      assert(typeof e.title === 'string' && e.title.trim(), '事件名称不能为空');
      assert(typeof e.description === 'string' && e.description.trim(), '事件描述不能为空：' + e.id);
      e.completion_criteria ||= e.description; e.exclusions ||= []; e.effects ||= [];
      e.scope ||= {kind: 'project'}; e.repeat_policy ||= 'once';
      e.enabled = e.enabled !== false; e.auto_settle = e.auto_settle === true; e.detection ||= 'api';
      assert(['api', 'manual'].includes(e.detection), '事件识别模式无效');
      assert(['once', 'once_per_accepted_turn'].includes(e.repeat_policy), '事件重复策略无效');
      assert(Array.isArray(e.exclusions) && e.exclusions.every(v => typeof v === 'string'), '排除情况必须是文本数组');
      assert(object(e.scope) && ['project', 'nodes'].includes(e.scope.kind), '事件作用范围无效');
      if (e.scope.kind === 'nodes') assert(Array.isArray(e.scope.node_ids) && e.scope.node_ids.every(v => refs.nodes.has(v)), '事件适用节点不存在');
      validateCondition(e.condition, refs); validateEffects(e.effects, refs);
    });
    return p;
  }
  function createProgress(p) {
    return {
      schema_version: VERSION, project_id: p.id, project_revision: p.revision, revision: 0,
      current_node_id: p.start_node_id, visited_node_ids: [p.start_node_id], completed_node_ids: [], collected_ids: [],
      variables: Object.fromEntries(p.variables.map(v => [v.id, clone(v.default)])),
      event_counts: {}, receipts: {}, accepted_turns: {}, pending_checks: [], history: [], paused: false,
    };
  }
  function condition(c, s, depth = 0) {
    if (depth > 24) return false;
    if (c === undefined || c === null || c === true) return true;
    if (c === false) return false;
    if (!object(c) || Object.keys(c).length !== 1) return false;
    const [op, v] = Object.entries(c)[0];
    if (op === 'all') return Array.isArray(v) && v.every(x => condition(x, s, depth + 1));
    if (op === 'any') return Array.isArray(v) && v.some(x => condition(x, s, depth + 1));
    if (op === 'not') return !condition(v, s, depth + 1);
    if (op === 'collected') return s.collected_ids.includes(v);
    if (op === 'completed') return s.completed_node_ids.includes(v);
    if (op === 'visited') return s.visited_node_ids.includes(v);
    if (op === 'event_completed') return (s.event_counts[v] || 0) > 0;
    if (op === 'variable') {
      const actual = s.variables[v.id];
      if (typeof actual !== typeof v.value) return false;
      return ({eq: () => actual === v.value, ne: () => actual !== v.value, gt: () => actual > v.value, gte: () => actual >= v.value, lt: () => actual < v.value, lte: () => actual <= v.value}[v.op] || (() => false))();
    }
    return false;
  }
  function conditionText(c, p) {
    if (c == null || c === true) return '无前置条件';
    if (c === false) return '不可进入';
    const [op, v] = Object.entries(c)[0]; const refs = indexProject(p);
    if (op === 'all' || op === 'any') return '(' + v.map(x => conditionText(x, p)).join(op === 'all' ? ' 且 ' : ' 或 ') + ')';
    if (op === 'not') return '未满足 ' + conditionText(v, p);
    if (op === 'collected') return '收集 ' + (refs.collections.get(v) || v);
    if (op === 'completed' || op === 'visited') return (op === 'completed' ? '完成 ' : '访问 ') + (refs.nodes.get(v)?.title || v);
    if (op === 'event_completed') return '达成 ' + (refs.events.get(v)?.title || v);
    if (op === 'variable') return (refs.variables.get(v.id)?.title || v.id) + ' ' + ({eq: '=', ne: '≠', gt: '>', gte: '≥', lt: '<', lte: '≤'}[v.op]) + ' ' + v.value;
    return '未知条件';
  }
  function transact(s, p, label, operation, receipt, source = null) {
    if (receipt && own(s.receipts, receipt)) return false;
    const next = clone(s); const before = {variables: {}, collected_ids: [], completed_node_ids: [], visited_node_ids: [], event_counts: {}, current_node_id: s.current_node_id, paused: s.paused, last_settled_message_id: s.last_settled_message_id ?? -1};
    operation(next);
    if (Number.isInteger(source?.assistant_id)) next.last_settled_message_id = Math.max(next.last_settled_message_id ?? -1, source.assistant_id);
    for (const k of Object.keys(next.variables)) if (next.variables[k] !== s.variables[k]) before.variables[k] = s.variables[k];
    for (const key of ['collected_ids', 'completed_node_ids', 'visited_node_ids']) before[key] = next[key].filter(v => !s[key].includes(v));
    for (const k of Object.keys(next.event_counts)) if (next.event_counts[k] !== s.event_counts[k]) before.event_counts[k] = s.event_counts[k] || 0;
    if (receipt) next.receipts[receipt] = true;
    next.revision++; next.project_revision = p.revision;
    next.history.push({id: id('TX'), label, receipt, before, source, at: Date.now()});
    next.history = next.history.slice(-25);
    Object.assign(s, next); return true;
  }
  function applyEffects(s, p, effects) {
    const refs = indexProject(p); validateEffects(effects, refs);
    for (const effect of effects) {
      if (effect.collect) { if (!s.collected_ids.includes(effect.collect)) s.collected_ids.push(effect.collect); }
      else {
        const op = effect.add || effect.set; const def = refs.variables.get(op.variable);
        let value = effect.add ? s.variables[op.variable] + op.value : op.value;
        if (typeof value === 'number') { if (def.min != null) value = Math.max(def.min, value); if (def.max != null) value = Math.min(def.max, value); }
        s.variables[op.variable] = value;
      }
    }
  }
  function completeNode(s, p) {
    const node = indexProject(p).nodes.get(s.current_node_id);
    return transact(s, p, '完成：' + node.title, next => {
      if (!next.completed_node_ids.includes(node.id)) next.completed_node_ids.push(node.id);
      applyEffects(next, p, node.effects);
    }, 'node:' + node.id);
  }
  function enterNode(s, p, target) {
    const node = indexProject(p).nodes.get(s.current_node_id);
    const route = node.routes.find(r => r.target === target);
    assert(route && condition(route.condition, s), '分支未解锁或不是当前节点的出口');
    return transact(s, p, '进入：' + indexProject(p).nodes.get(target).title, next => {
      next.current_node_id = target; if (!next.visited_node_ids.includes(target)) next.visited_node_ids.push(target);
    });
  }
  function settleEvent(s, p, eventId, sourceKey, source = null, scopeNode = s.current_node_id) {
    const event = indexProject(p).events.get(eventId);
    assert(event && event.enabled && condition(event.condition, s), '事件不存在、未启用或前置条件未满足');
    assert(event.scope.kind !== 'nodes' || event.scope.node_ids.includes(scopeNode), '事件不适用于该节点');
    const key = 'event:' + eventId + ':' + (event.repeat_policy === 'once' ? 'once' : sourceKey);
    assert(typeof sourceKey === 'string' && sourceKey, '缺少事件来源标识');
    return transact(s, p, '事件：' + event.title, next => { applyEffects(next, p, event.effects); next.event_counts[eventId] = (next.event_counts[eventId] || 0) + 1; }, key, source);
  }
  function undo(s) {
    const tx = s.history.pop(); assert(tx, '没有可回退的近期操作');
    Object.assign(s.variables, tx.before.variables);
    for (const key of ['collected_ids', 'completed_node_ids', 'visited_node_ids']) s[key] = s[key].filter(v => !tx.before[key].includes(v));
    Object.assign(s.event_counts, tx.before.event_counts);
    s.current_node_id = tx.before.current_node_id; s.paused = tx.before.paused;
    if (tx.before.last_settled_message_id !== undefined) s.last_settled_message_id = tx.before.last_settled_message_id;
    if (tx.receipt) delete s.receipts[tx.receipt];
    s.revision++; return tx;
  }
  function eligibleEvents(p, s, scopeNode = s.current_node_id) {
    return p.events.filter(e => e.enabled && e.detection === 'api' && condition(e.condition, s) &&
      (e.scope.kind !== 'nodes' || e.scope.node_ids.includes(scopeNode)) && !(e.repeat_policy === 'once' && s.event_counts[e.id]));
  }
  function prompt(p, s, options = {}) {
    if (s.paused) return '';
    const node = indexProject(p).nodes.get(s.current_node_id); if (!node) return '';
    const related = node.context_variables.map(k => (indexProject(p).variables.get(k).title || k) + '：' + String(s.variables[k])).join('；');
    const body = options.detail ? node.detail || node.guidance : node.guidance || node.detail;
    return ['<branch_story_guidance>', '当前剧情阶段：' + node.title, p.premise ? '必要背景：' + p.premise : '', body,
      node.boundary ? '本阶段演绎要求：' + node.boundary : '', related ? '相关已确认状态：' + related : '',
      s.completed_node_ids.includes(node.id) ? '本阶段已经完成，衔接玩家当前互动，等待后续阶段。' : '',
      '结合现有角色设定与对话自然演绎，为玩家保留行动选择。', '</branch_story_guidance>'].filter(Boolean).join('\n');
  }
  function migrateProgress(s, p) {
    assert(object(s) && s.project_id === p.id, '进度不属于当前剧本');
    const refs = indexProject(p);
    assert(refs.nodes.has(s.current_node_id), '新剧本删除了当前节点，请先备份或迁移进度');
    assert(['visited_node_ids', 'completed_node_ids', 'collected_ids', 'pending_checks', 'history'].every(k => Array.isArray(s[k])), '进度数组格式无效');
    assert(s.visited_node_ids.concat(s.completed_node_ids).every(k => refs.nodes.has(k)), '已有进度引用被删除的节点，请保留 ID 或导入为新剧本');
    assert(object(s.variables) && object(s.event_counts) && object(s.receipts) && object(s.accepted_turns), '进度格式无效');
    for (const v of p.variables) {
      if (!own(s.variables, v.id)) s.variables[v.id] = clone(v.default);
      assert(typeof s.variables[v.id] === v.type, '已有变量类型冲突：' + v.id);
      if (v.type === 'number') assert(Number.isFinite(s.variables[v.id]) && (v.min == null || s.variables[v.id] >= v.min) && (v.max == null || s.variables[v.id] <= v.max), '已有变量超出新定义范围：' + v.id);
    }
    if (s.project_revision !== p.revision) { s.pending_checks = []; s.history = []; s.project_revision = p.revision; }
    return s;
  }
  function demoProject() {
    return normalizeProject({id: 'hotel_demo', title: '停电酒店 · 分支演示', revision: 'demo_v1', premise: '暴雨中的酒店突然停电。保持悬疑氛围，人物沿用当前聊天设定。',
      variables: [{id: 'trust', title: '信任度', type: 'number', default: 0, min: 0, max: 100}],
      collections: [{id: 'A', title: '维修员房卡'}, {id: 'B', title: '假身份线索'}],
      nodes: [
        {id: 'N001', title: '停电发生', guidance: '酒店突然停电，应急灯没有亮起。描写环境变化和同行角色的即时反应，留出玩家的行动空间。走廊有一声轻响，前台方向仍有微弱光线。', boundary: '停电原因尚未揭露。', context_variables: ['trust'], effects: [], routes: [
          {target: 'N002', label: '查看走廊', condition: true}, {target: 'N003', label: '寻找前台', condition: true},
          {target: 'C', label: '证据齐全，追查真相', condition: {all: [{collected: 'A'}, {collected: 'B'}]}},
          {target: 'D', label: '用房卡调查房间', condition: {all: [{collected: 'A'}, {not: {collected: 'B'}}]}},
          {target: 'E', label: '追查假身份', condition: {all: [{collected: 'B'}, {not: {collected: 'A'}}]}},
        ]},
        {id: 'N002', title: '走廊里的房卡', guidance: '在走廊引入可疑维修员遗落房卡的线索，让玩家自行决定是否拾取和调查。', effects: [{collect: 'A'}], routes: [{target: 'N001', label: '返回大厅'}]},
        {id: 'N003', title: '前台登记册', guidance: '前台无人值守，登记册中维修员身份与工牌信息不符。通过可观察线索呈现，不代替玩家调查。', effects: [{collect: 'B'}], routes: [{target: 'N001', label: '返回大厅'}]},
        {id: 'C', title: '两条线索拼合', guidance: '房卡编号与假身份线索共同指向顶层的一间房。让玩家决定是否继续追查，逐步揭露有人借停电隐瞒行动。', effects: []},
        {id: 'D', title: '只有房卡', guidance: '房卡提供了房间方向，但身份信息仍缺失，保留疑点和继续调查的空间。', effects: [], routes: [{target: 'N001', label: '继续搜集线索'}]},
        {id: 'E', title: '只有身份线索', guidance: '确认维修员身份可疑，尚无法定位其房间，通过前台和在场人物的反应推动调查。', effects: [], routes: [{target: 'N001', label: '继续搜集线索'}]},
      ],
      events: [{id: 'E_TRUST', title: '共同承担风险', description: '玩家与同行角色实际协作承担调查风险。', completion_criteria: '双方已进行具体协作，不只是提出邀请或讨论计划。', exclusions: ['提出计划', '对方拒绝', '引用旧事'], effects: [{add: {variable: 'trust', value: 5}}], repeat_policy: 'once_per_accepted_turn', detection: 'api', auto_settle: false}],
    });
  }
  return {VERSION, clone, object, own, id, assert, safeId, parseJSON, normalizeProject, indexProject, createProgress, condition, conditionText, transact, completeNode, enterNode, settleEvent, undo, eligibleEvents, prompt, migrateProgress, demoProject};
});
