(function (root, factory) {
  const value = factory(typeof window === 'undefined' ? require('./core.js') : root.BSECore);
  if (typeof window === 'undefined' && typeof module === 'object' && module.exports) module.exports = value; else root.BSEFlow = value;
})(typeof window !== 'undefined' ? window : globalThis, function (C) {
  'use strict';
  const owner = (p, nodeId) => (p.packages || []).find(b => b.node_ids.includes(nodeId));
  function initialize(p, s) {
    C.initLedger(s); s.package_progress ||= {}; s.focus_package_id ||= '';
    C.assert(C.object(s.package_progress) && typeof s.focus_package_id === 'string', '事件包进度格式无效');
    const base = p.nodes.find(n => n.id === p.start_node_id && !owner(p, n.id)) || p.nodes.find(n => !owner(p, n.id));
    if (s.base_progress && (!base || owner(p, s.base_progress.current_node_id))) s.base_progress = null;
    s.base_progress ||= base ? {current_node_id: base.id, stage_progress: null, entry_dependencies: []} : null;
    for (const b of p.packages || []) {
      const progress = s.package_progress[b.id] ||= {current_node_id: b.start_node_id, status: 'locked', started: false, stage_progress: null, activation_dependencies: [], entry_dependencies: []};
      C.assert(C.object(progress) && typeof progress.started === 'boolean' && Array.isArray(progress.activation_dependencies) && Array.isArray(progress.entry_dependencies) && progress.activation_dependencies.concat(progress.entry_dependencies).every(x => typeof x === 'string'), '事件包进度或依赖记录格式无效：' + b.title);
      C.assert(b.node_ids.includes(progress.current_node_id), '事件包进度引用被删除或移出的节点：' + b.title);
      if (progress.project_revision !== p.revision) { progress.stage_progress = null; progress.project_revision = p.revision; }
      if (progress.stage_progress) {
        const work = progress.stage_progress;
        C.assert(C.object(work) && work.node_id === progress.current_node_id && typeof work.summary === 'string' && Array.isArray(work.missing) && work.missing.every(x => typeof x === 'string') && Array.isArray(work.facts) && work.facts.every(f => C.object(f) && typeof f.text === 'string' && Array.isArray(f.evidence) && f.evidence.every(r => C.object(r) && typeof r.quote === 'string')), '事件包阶段摘要格式无效：' + b.title);
        work.summary = work.summary.slice(0, 400); work.facts = work.facts.slice(-8).map(f => ({...f, text: f.text.slice(0, 160)}));
      }
    }
    for (const key of Object.keys(s.package_progress)) if (!p.packages.some(b => b.id === key)) C.assert(!s.package_progress[key].started, '请先回退事件包进度再删除：' + key);
    if (s.focus_package_id) C.assert(p.packages.some(b => b.id === s.focus_package_id), '当前事件包已被删除，请先切换或回退');
  }
  function storeFocus(p, s) {
    const target = s.focus_package_id ? s.package_progress?.[s.focus_package_id] : s.base_progress;
    if (target && (s.focus_package_id ? owner(p, s.current_node_id)?.id === s.focus_package_id : !owner(p, s.current_node_id))) {
      target.current_node_id = s.current_node_id; target.stage_progress = C.clone(s.stage_progress || null);
      target.entry_dependencies = [...(s.entry_dependencies || target.entry_dependencies || [])];
    }
  }
  function activate(p, s, b) {
    const progress = s.package_progress[b.id];
    if (!progress.started) { progress.started = true; progress.activation_dependencies = C.dependencies(b.condition, s); progress.entry_dependencies = C.dependencies(C.indexProject(p).nodes.get(progress.current_node_id).entry_condition, s); }
    progress.status = 'running';
  }
  function useFocus(p, s, id) {
    const b = p.packages.find(b => b.id === id), progress = b ? s.package_progress[id] : s.base_progress;
    C.assert(progress, '没有可以恢复的主线');
    if (b) activate(p, s, b);
    s.focus_package_id = id || ''; s.current_node_id = progress.current_node_id; s.stage_progress = C.clone(progress.stage_progress || null); s.entry_dependencies = [...(progress.entry_dependencies || [])];
    if (!s.visited_node_ids.includes(s.current_node_id)) s.visited_node_ids.push(s.current_node_id);
  }
  function availableRoutes(p, s, nodeId) {
    const refs = C.indexProject(p), n = refs.nodes.get(nodeId);
    return (n?.routes || []).filter(r => C.condition(r.condition, s) && C.nodeReady(refs.nodes.get(r.target), p, s));
  }
  function sync(p, s, enabled = true) {
    if (!p.packages?.length) { C.initLedger(s); return false; }
    const before = JSON.stringify([s.package_progress, s.focus_package_id, s.current_node_id]);
    initialize(p, s); storeFocus(p, s);
    for (const b of p.packages) {
      const q = s.package_progress[b.id], n = C.indexProject(p).nodes.get(q.current_node_id);
      const ended = b.completion_node_ids.includes(n.id) && s.completed_node_ids.includes(n.id);
      if (ended) q.status = 'done';
      else if (!b.enabled) q.status = 'disabled';
      else if (!q.started) q.status = C.condition(b.condition, s) && C.nodeReady(n, p, s) ? 'ready' : 'locked';
      else q.status = C.condition(b.continue_condition, s) && C.nodeReady(n, p, s) && (!s.completed_node_ids.includes(n.id) || availableRoutes(p, s, n.id).length) ? 'running' : 'waiting';
    }
    if (enabled && !s.paused) {
      const rank = (a, b) => b.priority - a.priority || p.packages.indexOf(a) - p.packages.indexOf(b);
      const usable = p.packages.filter(b => ['ready', 'running'].includes(s.package_progress[b.id].status));
      const main = usable.filter(b => b.role === 'main' && (s.package_progress[b.id].started || b.auto_start)).sort(rank);
      const current = p.packages.find(b => b.id === s.focus_package_id);
      const urgent = main.find(b => b.id !== current?.id && b.interrupt && b.priority > (current?.priority ?? -Infinity));
      if (urgent || !current && !s.manual_base_focus || current && !usable.includes(current)) {
        const next = urgent || main[0];
        if (next && next.id !== s.focus_package_id) useFocus(p, s, next.id);
        else if (!next && s.base_progress && (current || owner(p, s.current_node_id))) useFocus(p, s, '');
      }
      const side = usable.filter(b => b.role === 'side' && b.id !== s.focus_package_id && (s.package_progress[b.id].started || b.auto_start)).sort(rank)[0];
      if (side) activate(p, s, side);
    }
    const changed = before !== JSON.stringify([s.package_progress, s.focus_package_id, s.current_node_id]);
    if (changed) s.revision++;
    return changed;
  }
  function focusPackage(p, s, id, choice = null) {
    initialize(p, s); storeFocus(p, s);
    const b = p.packages.find(b => b.id === id);
    C.assert(b ? ['ready', 'running'].includes(s.package_progress[id].status) : s.base_progress && C.nodeReady(C.indexProject(p).nodes.get(s.base_progress.current_node_id), p, s), '事件包尚未解锁或正在等待条件');
    return C.transact(s, p, (choice ? '选择：' : '切换：') + (b?.title || '主线'), next => {
      storeFocus(p, next); useFocus(p, next, id); next.turn_context = choice ? {...choice, node_id: next.current_node_id, label: '继续' + (b?.title || '主线'), package_id: id} : null;
      next.manual_base_focus = !id;
    }, undefined, choice ? {messages: [choice.user_id]} : null);
  }
  function activeNodes(p, s) {
    if (s.paused) return [];
    if (!p.packages.length) return [{node_id: s.current_node_id, package_id: '', role: 'main'}];
    const out = [], b = p.packages.find(x => x.id === s.focus_package_id);
    if (b ? s.package_progress[b.id]?.status === 'running' : s.base_progress && !owner(p, s.current_node_id)) out.push({node_id: s.current_node_id, package_id: b?.id || '', role: 'main'});
    const side = p.packages.filter(x => x.role === 'side' && x.id !== b?.id && s.package_progress[x.id]?.status === 'running').sort((a, b) => b.priority - a.priority)[0];
    if (side && out.length) out.push({node_id: s.package_progress[side.id].current_node_id, package_id: side.id, role: 'side'});
    return out;
  }
  function prompt(p, s, options) {
    return activeNodes(p, s).map(x => (x.role === 'side' ? '相关支线（只在本轮互动涉及时推进）：\n' : '') + C.prompt(p, {...s, current_node_id: x.node_id}, options)).join('\n\n');
  }
  function stage(p, s, packageId) { return packageId && packageId !== s.focus_package_id ? s.package_progress[packageId] : s; }
  function leaves(c) {
    if (!C.object(c)) return [];
    const [op, v] = Object.entries(c)[0];
    if (op === 'all' || op === 'any') return v.flatMap(leaves);
    if (op === 'not') return leaves(v);
    return [{op, value: v}];
  }
  function contradictions(c, p) {
    // Prove simple AND contradictions; OR and complex negation remain author-reviewed.
    if (!C.object(c)) return c === false ? ['条件恒为false'] : [];
    if (c.variable) return contradictions({all: [c]}, p);
    if (c.any) return c.any.every(x => contradictions(x, p).length) ? ['所有替代条件都不可满足'] : [];
    if (!c.all) return [];
    const terms = c.all.flatMap(x => x?.all || [x]), positive = terms.filter(x => x?.collected).map(x => x.collected);
    const errors = [];
    for (const x of terms) if (x?.not?.collected && positive.includes(x.not.collected)) errors.push('同时要求拥有和没有 ' + x.not.collected);
    for (const def of p.collections) if (positive.includes(def.id) && def.exclusive_with.some(x => positive.includes(x))) errors.push('要求同时拥有互斥结果 ' + def.id + ' / ' + def.exclusive_with.find(x => positive.includes(x)));
    for (const def of p.variables.filter(v => v.type === 'number')) {
      const values = terms.filter(x => x?.variable?.id === def.id).map(x => x.variable);
      let min = def.min ?? -Infinity, max = def.max ?? Infinity, lowOpen = false, highOpen = false;
      for (const v of values) {
        if (['gt', 'gte', 'eq'].includes(v.op) && v.value >= min) { lowOpen = v.value === min ? lowOpen || v.op === 'gt' : v.op === 'gt'; min = v.value; }
        if (['lt', 'lte', 'eq'].includes(v.op) && v.value <= max) { highOpen = v.value === max ? highOpen || v.op === 'lt' : v.op === 'lt'; max = v.value; }
      }
      if (min > max || min === max && (lowOpen || highOpen || values.some(v => v.op === 'ne' && v.value === min))) errors.push('变量 ' + def.id + ' 的范围互相矛盾');
    }
    return errors.concat(terms.flatMap(x => x?.all || x?.any ? contradictions(x, p) : []));
  }
  function diagnose(p) {
    const issues = [], refs = C.indexProject(p), conditions = [];
    const add = (severity, message) => issues.push({severity, message});
    for (const n of p.nodes) { conditions.push([n.title + ' 的进入条件', n.entry_condition]); for (const r of n.routes) conditions.push([n.title + ' → ' + refs.nodes.get(r.target).title, r.condition]); }
    for (const e of p.events) conditions.push([e.title, e.condition]);
    for (const b of p.packages) { conditions.push([b.title + ' 的触发条件', b.condition], [b.title + ' 的持续条件', b.continue_condition]); if (!b.completion_node_ids.length) add('warning', b.title + ' 没有终点，需要配置完成节点'); }
    for (const c of p.collections) conditions.push([c.id + ' 的取得前提', c.requires]);
    for (const [label, c] of conditions) {
      for (const x of leaves(c)) if (x.op === 'collected' && !refs.collections.has(x.value)) add('error', label + ' 引用未定义结果 ' + x.value);
      for (const message of contradictions(c, p)) if (c !== false) add('error', label + '：' + message);
    }
    for (const def of p.nodes.concat(p.events)) {
      const codes = def.effects.filter(e => e.collect).map(e => e.collect);
      for (const c of p.collections) if (codes.includes(c.id) && c.exclusive_with.some(k => codes.includes(k))) add('error', def.title + ' 同时产生互斥结果：' + c.id);
    }
    const producers = p.nodes.flatMap(n => n.effects.filter(e => e.collect).map(e => ({code: e.collect, node: n}))).concat(p.events.flatMap(e => e.effects.filter(x => x.collect).map(x => ({code: x.collect, event: e}))));
    for (const x of producers) if (!refs.collections.has(x.code)) add('error', '产生了未定义结果 ' + x.code + '，请在结果表定义含义');
    const codes = new Set(p.collections.filter(c => c.external).map(c => c.id)), reachable = new Set(), completed = new Set(), events = new Set();
    const possible = c => {
      if (c == null || c === true) return true; if (c === false) return false;
      const [op, v] = Object.entries(c)[0];
      if (op === 'all') return v.every(possible); if (op === 'any') return v.some(possible);
      if (op === 'not') return v === true ? false : true;
      if (op === 'collected') return codes.has(v); if (op === 'visited') return reachable.has(v); if (op === 'completed') return completed.has(v); if (op === 'event_completed') return events.has(v);
      return true; // Numerical/external state may change; do not pretend to prove semantic reachability.
    };
    let changed = true;
    while (changed) {
      const count = codes.size + reachable.size + completed.size + events.size;
      if (!owner(p, p.start_node_id)) reachable.add(p.start_node_id);
      for (const b of p.packages) if (possible(b.condition)) reachable.add(b.start_node_id);
      for (const n of p.nodes) if (reachable.has(n.id) && possible(n.entry_condition) && n.effects.every(e => !e.collect || possible(p.collections.find(c => c.id === e.collect)?.requires))) {
        completed.add(n.id); n.effects.filter(e => e.collect).forEach(e => codes.add(e.collect));
        for (const r of n.routes) if (possible(r.condition)) reachable.add(r.target);
      }
      for (const e of p.events) if (possible(e.condition) && (e.scope.kind !== 'nodes' || e.scope.node_ids.some(k => reachable.has(k))) && e.effects.every(x => !x.collect || possible(p.collections.find(c => c.id === x.collect)?.requires))) { events.add(e.id); e.effects.filter(x => x.collect).forEach(x => codes.add(x.collect)); }
      changed = count !== codes.size + reachable.size + completed.size + events.size;
    }
    for (const c of p.collections) {
      if (!c.external && !producers.some(x => x.code === c.id)) add('error', c.id + ' 缺少获取来源；外部提供的结果请显式标记external');
      else if (!codes.has(c.id)) add('error', c.id + ' 的来源不可达，可能形成无起点的循环依赖：' + C.conditionText(c.requires, p));
    }
    if (p.packages.length || conditions.some(([, c]) => leaves(c).length)) add('warning', '复杂否定、跨事件语义互斥及外部数值变化仍需核对；静态检查不保证全部剧情可达。');
    return issues.filter((x, i) => issues.findIndex(y => y.severity === x.severity && y.message === x.message) === i);
  }
  function assertRunnable(p) { const errors = diagnose(p).filter(x => x.severity === 'error'); C.assert(!errors.length, '依赖检查未通过：\n' + errors.map(x => x.message).join('\n')); }
  function rollbackPlan(p, s, resultId) {
    C.initLedger(s); const ledger = s.settlements;
    C.assert(!ledger.baseline.collected_ids.includes(resultId), '此结果来自旧进度或备份，缺少可回退的结算来源，请恢复相应进度备份');
    const direct = ledger.order.filter(k => ledger.entries[k].effects.some(e => e.collect === resultId));
    C.assert(direct.length, '没有该结果的结算来源');
    const next = C.clone(s), baseline = ledger.baseline, dropped = [];
    next.variables = Object.fromEntries(p.variables.map(v => [v.id, baseline.variables[v.id] ?? v.default])); next.collected_ids = [...baseline.collected_ids]; next.completed_node_ids = [...baseline.completed_node_ids]; next.event_counts = C.clone(baseline.event_counts); next.variable_sources = {};
    const valid = new Set();
    for (const k of ledger.order) {
      const item = ledger.entries[k];
      const present = token => { const pos = token.indexOf(':'), kind = token.slice(0, pos), id = token.slice(pos + 1); return kind === 'result' ? next.collected_ids.includes(id) : kind === 'node' ? next.completed_node_ids.includes(id) : kind === 'event' ? (next.event_counts[id] || 0) > 0 : valid.has(id); };
      if (direct.includes(k) || !item.dependencies.every(present)) { dropped.push(k); continue; }
      try { C.applyEffects(next, p, item.effects); } catch { throw new Error('剧本变量或结果定义已变化，无法安全重算结算 ' + k + '；请恢复对应剧本和进度备份后回退'); }
      if (item.node_id && !next.completed_node_ids.includes(item.node_id)) next.completed_node_ids.push(item.node_id); if (item.event_id) next.event_counts[item.event_id] = (next.event_counts[item.event_id] || 0) + 1;
      for (const e of item.effects) if (e.add || e.set) { const v = (e.add || e.set).variable; (next.variable_sources[v] ||= []).push(k); }
      valid.add(k);
    }
    const removed = s.collected_ids.filter(x => !next.collected_ids.includes(x));
    return {result_id: resultId, removed_results: removed, removed_nodes: s.completed_node_ids.filter(x => !next.completed_node_ids.includes(x)), dropped, next};
  }
  function rollback(p, s, resultId) {
    const plan = rollbackPlan(p, s, resultId), next = plan.next;
    for (const k of plan.dropped) { delete next.settlements.entries[k]; delete next.receipts[k]; }
    next.settlements.order = next.settlements.order.filter(k => !plan.dropped.includes(k)); next.history = []; next.pending_checks = []; next.accepted_turns = {}; next.stage_progress = null; next.turn_context = null; next.paused = true; next.revision++;
    for (const b of p.packages) {
      const q = next.package_progress?.[b.id]; if (!q) continue;
      q.stage_progress = null;
      if (plan.dropped.some(k => s.settlements.entries[k].package_id === b.id) || plan.removed_results.some(k => q.activation_dependencies.includes('result:' + k))) { q.current_node_id = b.start_node_id; q.started = false; q.activation_dependencies = []; q.entry_dependencies = []; }
    }
    if (next.base_progress) next.base_progress.stage_progress = null;
    next.last_rollback = {result_id: resultId, removed_results: plan.removed_results, at: Date.now()};
    Object.assign(s, next); if (s.focus_package_id && s.package_progress[s.focus_package_id]) { const q = s.package_progress[s.focus_package_id]; s.current_node_id = q.current_node_id; s.entry_dependencies = q.entry_dependencies; }
    sync(p, s, false); return plan;
  }
  function clearWork(s) { s.stage_progress = null; if (s.base_progress) s.base_progress.stage_progress = null; for (const q of Object.values(s.package_progress || {})) q.stage_progress = null; }
  function demoProject() {
    const route = (target, label) => ({target, label, action_text: label, intent: label, condition: true});
    const node = (id, title, code, routes = []) => ({id, title, guidance: title + '。只叙述本阶段，未实际完成不得取得结果。', completion_criteria: '正文明确完成' + title, completion_exclusions: ['只有计划或建议'], auto_complete: true, effects: code ? [{collect: code}] : [], routes});
    return C.normalizeProject({id: C.id('cross'), title: '交叉依赖测试：b2+c1 → a4 → d1', premise: '两份证据共同打开档案，档案核验完成后才能追查真相。', start_node_id: 'hub', variables: [{id: 'trust', title: '信任', type: 'number', default: 30, min: 0, max: 100}],
      collections: [{id: 'b2', title: '维修房卡'}, {id: 'c1', title: '身份线索'}, {id: 'a4', title: '档案已核验', requires: {all: [{collected: 'b2'}, {collected: 'c1'}]}}, {id: 'd1', title: '真相已确认', requires: {collected: 'a4'}}], events: [],
      nodes: [node('hub', '大厅待命'), node('B_1', '调查走廊', null, [route('B_2', '取出房卡')]), node('B_2', '取得维修房卡', 'b2'), node('C_1', '取得身份线索', 'c1'), node('A_1', '核验档案', 'a4'), node('D_1', '确认真相', 'd1')],
      packages: [{id: 'B', title: '走廊调查', node_ids: ['B_1', 'B_2'], priority: 10, condition: {variable: {id: 'trust', op: 'gte', value: 30}}}, {id: 'C', title: '前台调查', node_ids: ['C_1'], priority: 5}, {id: 'A', title: '档案核验', node_ids: ['A_1'], priority: 20, condition: {all: [{collected: 'b2'}, {collected: 'c1'}]}}, {id: 'D', title: '追查真相', node_ids: ['D_1'], priority: 30, condition: {collected: 'a4'}}]});
  }
  return {owner, initialize, storeFocus, sync, focusPackage, activeNodes, stage, prompt, availableRoutes, leaves, diagnose, assertRunnable, rollbackPlan, rollback, clearWork, demoProject};
});
