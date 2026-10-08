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
  function shortId(p, prefix) {
    assert(['N', 'E', 'P', 'V', 'b'].includes(prefix), '短编号类型无效');
    const used = new Set(['nodes', 'events', 'packages', 'variables', 'collections'].flatMap(k => (p[k] || []).map(x => x.id)));
    p.short_id_counters ||= {};
    let count = Math.max(p.short_id_counters[prefix] || 0, ...[...used].filter(k => new RegExp('^' + prefix + '\\d+$').test(k)).map(k => Number(k.slice(prefix.length))), 0);
    do { count++; } while (used.has(prefix + count));
    p.short_id_counters[prefix] = count; return prefix + count;
  }
  function displayId(p, kind, key) {
    if (key.length <= 12) return key;
    const fields = {node: ['nodes', 'N'], event: ['events', 'E'], package: ['packages', 'P']}, field = fields[kind];
    if (!field) return key;
    const list = p[field[0]], used = new Set(list.filter(x => x.id.length <= 12).map(x => x.id));
    let count = 0;
    for (const x of list.filter(x => x.id.length > 12)) { do { count++; } while (used.has(field[1] + count)); if (x.id === key) return field[1] + count; }
    return key;
  }
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
      packages: new Map((project.packages || []).map(c => [c.id, c])),
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
        for (const bound of ['min', 'max']) if (value[bound] != null) assert(def.type === 'number' && Number.isFinite(value[bound]), '单次奖励的数值限制无效');
        assert(value.min == null || value.max == null || value.min <= value.max, '奖励下限大于上限');
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
    p.events ||= []; p.variables ||= []; p.collections ||= []; p.packages ||= []; p.premise ||= ''; p.original_text ||= '';
    for (const key of ['events', 'variables', 'collections', 'packages']) assert(Array.isArray(p[key]), key + ' 必须为数组');
    if (p.short_id_counters) assert(object(p.short_id_counters) && Object.entries(p.short_id_counters).every(([k, v]) => ['N', 'E', 'P', 'V', 'b'].includes(k) && Number.isSafeInteger(v) && v >= 0), '短编号计数格式无效');
    assert(p.packages.length <= 128, '每个剧本最多128个事件包');
    for (const [list, label] of [[p.nodes, '节点'], [p.events, '事件'], [p.variables, '变量'], [p.collections, '收集项'], [p.packages, '事件包']]) {
      const used = new Set();
      for (const entry of list) { assert(object(entry), label + ' 必须为对象'); safeId(entry.id, label + ' ID'); assert(!used.has(entry.id), label + ' ID 重复：' + entry.id); used.add(entry.id); }
    }
    p.variables.forEach(v => {
      v.title ||= v.id; v.owner ||= ''; assert(typeof v.title === 'string' && typeof v.owner === 'string', '数值名称与归属必须为文本');
      v.type ||= typeof v.default;
      assert(['number', 'boolean', 'string'].includes(v.type) && typeof v.default === v.type, '变量类型或默认值无效：' + v.id);
      if (v.type === 'number') {
        assert(Number.isFinite(v.default), '变量默认值必须为有限数字');
        if (v.min !== undefined && v.min !== null) assert(Number.isFinite(v.min), '变量下限无效');
        if (v.max !== undefined && v.max !== null) assert(Number.isFinite(v.max), '变量上限无效');
        assert(v.min == null || v.max == null || v.min <= v.max, '变量下限大于上限');
        assert((v.min == null || v.default >= v.min) && (v.max == null || v.default <= v.max), '变量默认值超出范围');
      }
      if (v.binding) assert(object(v.binding) && v.binding.type === 'chat' && Array.isArray(v.binding.path) && v.binding.path.length > 0 && v.binding.path.length <= 16 && v.binding.path.every(x => typeof x === 'string' && x && !forbidden.has(x)) && v.binding.path[0] !== 'branch_story_engine', '外部变量映射只支持聊天变量路径：' + v.id);
    });
    const refs = indexProject(p);
    p.start_node_id ||= p.nodes[0].id;
    assert(refs.nodes.has(p.start_node_id), '起点节点不存在');
    p.nodes.forEach(n => {
      assert(typeof n.title === 'string' && n.title.trim(), '节点名称为空：' + n.id);
      n.detail ||= ''; n.guidance ||= ''; n.boundary ||= ''; n.effects ||= []; n.routes ||= []; n.context_variables ||= [];
      Object.assign(n, normalizeCompletion(n));
      n.auto_complete = n.auto_complete !== false;
      validateCondition(n.entry_condition, refs);
      n.kind ||= 'scene'; n.suggested = n.suggested === true;
      assert(['scene', 'choice', 'ending'].includes(n.kind), '节点类型必须是 scene、choice 或 ending');
      assert([n.detail, n.guidance, n.boundary].every(v => typeof v === 'string'), '节点正文必须为文本');
      validateEffects(n.effects, refs);
      assert(Array.isArray(n.context_variables) && n.context_variables.every(v => refs.variables.has(v)), '节点相关变量引用无效');
      assert(Array.isArray(n.routes), '分支出口必须为数组');
      const targets = new Set();
      n.routes.forEach(r => {
        assert(object(r) && refs.nodes.has(r.target), '分支指向不存在的节点：' + r?.target);
        for (const field of ['label', 'action_text', 'intent']) assert(r[field] == null || typeof r[field] === 'string', '分支行动文字必须为文本');
        assert(!targets.has(r.target), '同一节点的分支目标重复：' + r.target); targets.add(r.target);
        validateCondition(r.condition, refs);
      });
    });
    p.events.forEach(e => {
      assert(typeof e.title === 'string' && e.title.trim(), '事件名称不能为空');
      assert(typeof e.description === 'string' && e.description.trim(), '事件描述不能为空：' + e.id);
      e.completion_criteria ||= e.description; e.exclusions ||= []; e.effects ||= [];
      e.scope ||= {kind: 'project'}; e.repeat_policy ||= 'once';
      if (e.max_occurrences != null) assert(Number.isSafeInteger(e.max_occurrences) && e.max_occurrences > 0, '事件次数上限必须为正整数');
      e.enabled = e.enabled !== false; e.auto_settle = e.auto_settle === true; e.detection ||= 'api';
      assert(['api', 'manual'].includes(e.detection), '事件识别模式无效');
      assert(['once', 'once_per_accepted_turn'].includes(e.repeat_policy), '事件重复策略无效');
      assert(Array.isArray(e.exclusions) && e.exclusions.every(v => typeof v === 'string'), '排除情况必须是文本数组');
      assert(object(e.scope) && ['project', 'nodes'].includes(e.scope.kind), '事件作用范围无效');
      if (e.scope.kind === 'nodes') assert(Array.isArray(e.scope.node_ids) && e.scope.node_ids.every(v => refs.nodes.has(v)), '事件适用节点不存在');
      if (e.completion_node_id != null) {
        safeId(e.completion_node_id); const node = refs.nodes.get(e.completion_node_id);
        assert(node && !node.suggested, '阶段事件引用的节点不存在或属于补充构想：' + e.title);
        assert(e.repeat_policy === 'once' && e.scope.kind === 'nodes' && e.scope.node_ids.length === 1 && e.scope.node_ids[0] === node.id && !e.effects.length && !e.actor_id && !e.recipient_id, '阶段事件必须绑定单一节点，共用节点奖励和完成标准：' + e.title);
        assert(p.events.filter(x => x.completion_node_id === node.id).length === 1, '同一阶段不能重复登记完成事件：' + node.id);
        e.completion_criteria = node.completion_criteria || '手动确认本阶段完成'; e.exclusions = clone(node.completion_exclusions);
      }
      validateCondition(e.condition, refs); validateEffects(e.effects, refs);
    });
    p.collections.forEach(c => {
      c.title ||= c.id; assert(typeof c.title === 'string', '结果名称必须为文本：' + c.id);
      c.description ||= ''; assert(typeof c.description === 'string', '结果说明必须为文本：' + c.id);
      validateCondition(c.requires, refs);
      c.exclusive_with ||= []; assert(Array.isArray(c.exclusive_with) && c.exclusive_with.every(k => k !== c.id && refs.collections.has(k)), '互斥结果引用无效：' + c.id);
    });
    const owners = new Set();
    p.packages.forEach(b => {
      assert(typeof b.title === 'string' && b.title.trim(), '事件包名称不能为空：' + b.id);
      assert(Array.isArray(b.node_ids) && b.node_ids.length && b.node_ids.every(k => refs.nodes.has(k)), '事件包必须引用已有节点：' + b.id);
      assert(new Set(b.node_ids).size === b.node_ids.length && !b.node_ids.some(k => owners.has(k)), '节点不能重复归属多个事件包：' + b.id); b.node_ids.forEach(k => owners.add(k));
      b.start_node_id ||= b.node_ids[0]; assert(b.node_ids.includes(b.start_node_id), '事件包起点不在包内：' + b.id);
      b.completion_node_ids ||= b.node_ids.filter(k => refs.nodes.get(k).kind === 'ending' || !refs.nodes.get(k).routes.length);
      assert(Array.isArray(b.completion_node_ids) && b.completion_node_ids.every(k => b.node_ids.includes(k)), '事件包终点不在包内：' + b.id);
      b.priority ??= 0; assert(Number.isFinite(b.priority), '事件包优先级必须为数字：' + b.id);
      b.role ||= 'main'; assert(['main', 'side'].includes(b.role), '事件包类型必须为main或side');
      b.enabled = b.enabled !== false; b.auto_start = b.auto_start !== false; b.interrupt = b.interrupt === true;
      b.condition ??= true; b.continue_condition ??= true;
      validateCondition(b.condition, refs); validateCondition(b.continue_condition, refs);
      for (const k of b.node_ids) assert(refs.nodes.get(k).routes.every(r => b.node_ids.includes(r.target)), '事件包内出口必须指向本包节点；跨包请使用触发条件：' + b.id + '/' + k);
    });
    if (p.analysis !== undefined) {
      assert(object(p.analysis), '分析报告必须为对象');
      p.analysis.synopsis ||= ''; p.analysis.branches ||= []; p.analysis.endings ||= []; p.analysis.foreshadowing ||= []; p.analysis.uncertainties ||= [];
      assert(typeof p.analysis.synopsis === 'string', '剧情梗概必须为文本');
      assert(Array.isArray(p.analysis.uncertainties) && p.analysis.uncertainties.every(v => typeof v === 'string'), '待核对事项必须是文本数组');
      for (const key of ['branches', 'endings', 'foreshadowing']) {
        assert(Array.isArray(p.analysis[key]), key + ' 必须为数组');
        for (const item of p.analysis[key]) {
          assert(object(item), '分析条目必须为对象');
          for (const field of ['title', 'summary', 'hint', 'payoff']) if (item[field] !== undefined) assert(typeof item[field] === 'string', '分析内容必须为文本');
          for (const field of ['node_ids', 'plant_node_ids', 'payoff_node_ids']) if (item[field] !== undefined) assert(Array.isArray(item[field]) && item[field].every(k => refs.nodes.has(k)), '分析引用不存在的节点');
          if (item.node_id !== undefined) assert(refs.nodes.has(item.node_id), '结局引用不存在的节点');
          item.suggested = item.suggested === true;
        }
      }
    }
    return p;
  }
  function normalizeCompletion(n) {
    const label = '节点“' + (n.title || n.id || '未命名') + '”(' + (n.id || '?') + ')';
    let criteria = n.completion_criteria ?? '', exclusions = n.completion_exclusions ?? [];
    if (Array.isArray(criteria) && criteria.every(x => typeof x === 'string')) criteria = criteria.join('\n');
    if (typeof exclusions === 'string') exclusions = exclusions.split(/\r?\n/).map(x => x.trim()).filter(Boolean);
    assert(typeof criteria === 'string', label + '.completion_criteria 必须为文字或文字列表');
    assert(Array.isArray(exclusions) && exclusions.every(x => typeof x === 'string'), label + '.completion_exclusions 必须为文字列表');
    return {completion_criteria: criteria, completion_exclusions: exclusions};
  }
  function nodeReady(n, p, s) {
    return condition(n.entry_condition, s) && (n.effects || []).every(e => !e.collect || resultReady(e.collect, p, s));
  }
  function resultReady(code, p, s) {
    const def = p.collections.find(x => x.id === code);
    return condition(def?.requires, s) && !p.collections.some(x => s.collected_ids.includes(x.id) && (x.exclusive_with?.includes(code) || def?.exclusive_with?.includes(x.id)));
  }
  function dependencies(c, s) {
    if (!object(c)) return [];
    const [op, v] = Object.entries(c)[0];
    if (op === 'all') return [...new Set(v.flatMap(x => dependencies(x, s)))];
    if (op === 'any') return dependencies(v.find(x => condition(x, s)), s);
    if (op === 'collected') return ['result:' + v];
    if (op === 'completed' || op === 'event_completed') return [(op === 'completed' ? 'node:' : 'event:') + v];
    if (op === 'variable') return (s.variable_sources?.[v.id] || []).map(k => 'receipt:' + k);
    return [];
  }
  function initLedger(s) {
    s.settlements ||= {baseline: {variables: clone(s.variables), collected_ids: [...s.collected_ids], completed_node_ids: [...s.completed_node_ids], event_counts: clone(s.event_counts)}, order: [], entries: {}};
    s.variable_sources ||= {};
  }
  function recordSettlement(next, before, p, receipt, source) {
    if (!receipt || !/^(node:|event:|variable:)/.test(receipt)) return;
    initLedger(next);
    if (!next.settlements.order.length) next.settlements.baseline = {variables: clone(before.variables), collected_ids: [...before.collected_ids], completed_node_ids: [...before.completed_node_ids], event_counts: clone(before.event_counts)};
    const nodeId = receipt.startsWith('node:') ? receipt.slice(5) : null;
    const linked = nodeId ? p.events.find(e => e.enabled && e.completion_node_id === nodeId) : null;
    const eventId = receipt.startsWith('event:') ? receipt.split(':')[1] : linked?.id || null;
    const def = nodeId ? indexProject(p).nodes.get(nodeId) : eventId ? indexProject(p).events.get(eventId) : null;
    const pack = nodeId ? p.packages?.find(b => b.node_ids.includes(nodeId)) : null;
    const ctx = pack ? before.package_progress?.[pack.id] : before;
    const conditions = nodeId ? [def.entry_condition, linked?.condition, pack?.continue_condition, ...(def.effects || []).filter(e => e.collect).map(e => p.collections.find(x => x.id === e.collect)?.requires)] : eventId ? [def.condition, ...(def.effects || []).filter(e => e.collect).map(e => p.collections.find(x => x.id === e.collect)?.requires)] : [];
    const effects = def ? clone(def.effects) : Object.keys(next.variables).filter(k => next.variables[k] !== before.variables[k]).map(variable => ({set: {variable, value: next.variables[variable]}}));
    const deps = [...new Set([...conditions.flatMap(c => dependencies(c, before)), ...(nodeId ? ctx?.entry_dependencies || [] : []), ...(nodeId ? ctx?.activation_dependencies || [] : [])])];
    // The local rule determines the reward; keep the actual change for player records.
    const changes = Object.keys(next.variables).filter(k => next.variables[k] !== before.variables[k]).map(variable => ({variable, before: before.variables[variable], after: next.variables[variable]}));
    for (const e of effects) if ((e.add || e.set)?.min != null || (e.add || e.set)?.max != null) deps.push(...(before.variable_sources?.[(e.add || e.set).variable] || []).map(k => 'receipt:' + k));
    next.settlements.entries[receipt] = {node_id: nodeId, event_id: eventId, package_id: pack?.id || '', effects, changes, completion_criteria: def?.completion_criteria || '', dependencies: [...new Set(deps)], source: source || null, at: Date.now()};
    next.settlements.order.push(receipt);
    for (const e of effects) if (e.add || e.set) { const k = (e.add || e.set).variable; next.variable_sources[k] = [...new Set([...(next.variable_sources[k] || []), receipt])]; }
  }
  function createProgress(p) {
    return {
      schema_version: VERSION, project_id: p.id, project_revision: p.revision, revision: 0,
      current_node_id: p.start_node_id, visited_node_ids: [p.start_node_id], completed_node_ids: [], collected_ids: [],
      variables: Object.fromEntries(p.variables.map(v => [v.id, clone(v.default)])),
      event_counts: {}, receipts: {}, accepted_turns: {}, pending_checks: [], history: [], paused: false,
      stage_progress: null, turn_context: null, last_stage_message_id: -1,
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
    const next = clone(s); const before = {variables: {}, collected_ids: [], completed_node_ids: [], visited_node_ids: [], event_counts: {}, current_node_id: s.current_node_id, paused: s.paused, last_settled_message_id: s.last_settled_message_id ?? -1, stage_progress: clone(s.stage_progress || null), turn_context: clone(s.turn_context || null), last_stage_message_id: s.last_stage_message_id ?? -1};
    if (p.packages?.length) Object.assign(before, {package_progress: clone(s.package_progress || {}), focus_package_id: s.focus_package_id || '', base_progress: clone(s.base_progress || null), manual_base_focus: !!s.manual_base_focus});
    if (s.entry_dependencies) before.entry_dependencies = [...s.entry_dependencies];
    operation(next);
    recordSettlement(next, s, p, receipt, source);
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
      if (effect.collect) { assert(resultReady(effect.collect, p, s), '结果前提未满足或结果互斥：' + effect.collect); if (!s.collected_ids.includes(effect.collect)) s.collected_ids.push(effect.collect); }
      else {
        const op = effect.add || effect.set; const def = refs.variables.get(op.variable);
        s.variables[op.variable] = effectValue(effect, def, s.variables[op.variable]);
      }
    }
  }
  function effectValue(effect, def, current) {
    const op = effect.add || effect.set;
    let value = effect.add ? current + op.value : op.value;
    if (typeof value === 'number') {
      if (op.max != null && value > current) value = Math.max(current, Math.min(op.max, value));
      if (op.min != null && value < current) value = Math.min(current, Math.max(op.min, value));
      if (def.min != null) value = Math.max(def.min, value); if (def.max != null) value = Math.min(def.max, value);
    }
    return value;
  }
  function rewardAvailable(e, p, s) {
    if (!e.effects.length || e.repeat_policy === 'once' || e.completion_node_id) return true;
    const refs = indexProject(p);
    return e.effects.some(x => x.collect ? !s.collected_ids.includes(x.collect) && resultReady(x.collect, p, s) : effectValue(x, refs.variables.get((x.add || x.set).variable), s.variables[(x.add || x.set).variable]) !== s.variables[(x.add || x.set).variable]);
  }
  function completeNode(s, p, source = null, nodeId = s.current_node_id) {
    if (s.receipts['node:' + nodeId]) return false;
    const node = indexProject(p).nodes.get(nodeId); assert(node && nodeReady(node, p, s), '节点前置条件或结果前提未满足：' + nodeId);
    const pack = p.packages?.find(b => b.node_ids.includes(nodeId));
    if (pack) assert(pack.enabled && s.package_progress?.[pack.id]?.current_node_id === nodeId && ['running', 'ready'].includes(s.package_progress?.[pack.id]?.status) && condition(pack.continue_condition, s), '事件包当前不能完成：' + pack.title);
    const linked = p.events.find(e => e.enabled && e.completion_node_id === nodeId);
    assert(!linked || condition(linked.condition, s), '阶段完成事件的前置条件未满足：' + linked?.title);
    return transact(s, p, '完成：' + node.title, next => {
      if (!next.completed_node_ids.includes(node.id)) next.completed_node_ids.push(node.id);
      applyEffects(next, p, node.effects);
      if (linked) next.event_counts[linked.id] = 1;
      if (nodeId === next.current_node_id) next.stage_progress = null;
      if (pack && next.package_progress?.[pack.id]) next.package_progress[pack.id].stage_progress = null;
    }, 'node:' + node.id, source);
  }
  function enterNode(s, p, target, choice = null) {
    const node = indexProject(p).nodes.get(s.current_node_id);
    const route = node.routes.find(r => r.target === target);
    assert(route && condition(route.condition, s) && nodeReady(indexProject(p).nodes.get(target), p, s), '分支未解锁或不是当前节点的出口');
    return transact(s, p, choice ? '选择：' + (route.label || indexProject(p).nodes.get(target).title) : '进入：' + indexProject(p).nodes.get(target).title, next => {
      next.current_node_id = target; if (!next.visited_node_ids.includes(target)) next.visited_node_ids.push(target);
      next.stage_progress = null;
      const pack = p.packages?.find(b => b.node_ids.includes(target));
      const deps = [...new Set([...dependencies(route.condition, s), ...dependencies(indexProject(p).nodes.get(target).entry_condition, s)])];
      if (pack && next.package_progress?.[pack.id]) { next.package_progress[pack.id].current_node_id = target; next.package_progress[pack.id].stage_progress = null; next.package_progress[pack.id].entry_dependencies = deps; }
      next.entry_dependencies = deps;
      if (choice) next.turn_context = {...choice, node_id: target, from_node_id: node.id, target, label: route.label || indexProject(p).nodes.get(target).title};
    }, undefined, choice ? {messages: [choice.user_id]} : null);
  }
  function settleEvent(s, p, eventId, sourceKey, source = null, scopeNode = s.current_node_id) {
    const event = indexProject(p).events.get(eventId);
    assert(event && event.enabled && condition(event.condition, s), '事件不存在、未启用或前置条件未满足');
    assert(event.scope.kind !== 'nodes' || event.scope.node_ids.includes(scopeNode), '事件不适用于该节点');
    if (event.completion_node_id) {
      if (s.receipts['node:' + event.completion_node_id]) return false;
      const pack = p.packages?.find(b => b.node_ids.includes(event.completion_node_id));
      assert(pack ? s.package_progress?.[pack.id]?.current_node_id === event.completion_node_id : s.current_node_id === event.completion_node_id, '请先进入此事件对应的剧情阶段');
      return completeNode(s, p, source, event.completion_node_id);
    }
    if (event.max_occurrences != null && (s.event_counts[eventId] || 0) >= event.max_occurrences) return false;
    assert(event.effects.every(e => !e.collect || resultReady(e.collect, p, s)), '事件的结果前提未满足或与已取得结果互斥');
    assert(typeof sourceKey === 'string' && sourceKey, '缺少事件来源标识');
    const turn = Number.isInteger(source?.assistant_id) ? 'turn_' + source.assistant_id : sourceKey;
    if (event.repeat_policy !== 'once' && (own(s.receipts, 'event:' + eventId + ':' + sourceKey) || Object.values(s.settlements?.entries || {}).some(x => x.event_id === eventId && x.source_key === sourceKey))) return false;
    if (event.repeat_policy !== 'once' && Number.isInteger(source?.assistant_id) && Object.values(s.settlements?.entries || {}).some(x => x.event_id === eventId && x.source?.assistant_id === source.assistant_id)) return false;
    const key = 'event:' + eventId + ':' + (event.repeat_policy === 'once' ? 'once' : turn);
    const changed = transact(s, p, '事件：' + event.title, next => { applyEffects(next, p, event.effects); next.event_counts[eventId] = (next.event_counts[eventId] || 0) + 1; }, key, source);
    if (changed && s.settlements?.entries[key]) s.settlements.entries[key].source_key = sourceKey;
    return changed;
  }
  function undo(s) {
    const tx = s.history.pop(); assert(tx, '没有可回退的近期操作');
    Object.assign(s.variables, tx.before.variables);
    for (const key of ['collected_ids', 'completed_node_ids', 'visited_node_ids']) s[key] = s[key].filter(v => !tx.before[key].includes(v));
    Object.assign(s.event_counts, tx.before.event_counts);
    s.current_node_id = tx.before.current_node_id; s.paused = tx.before.paused;
    if (tx.before.package_progress) { s.package_progress = tx.before.package_progress; s.focus_package_id = tx.before.focus_package_id; s.base_progress = tx.before.base_progress; s.manual_base_focus = tx.before.manual_base_focus; }
    s.entry_dependencies = tx.before.entry_dependencies || [];
    s.stage_progress = tx.before.stage_progress || null; s.turn_context = tx.before.turn_context || null; s.last_stage_message_id = tx.before.last_stage_message_id ?? -1;
    if (tx.before.last_settled_message_id !== undefined) s.last_settled_message_id = tx.before.last_settled_message_id;
    if (tx.receipt) delete s.receipts[tx.receipt];
    if (s.settlements?.entries[tx.receipt]) { delete s.settlements.entries[tx.receipt]; s.settlements.order = s.settlements.order.filter(k => k !== tx.receipt); for (const k of Object.keys(s.variable_sources || {})) s.variable_sources[k] = s.variable_sources[k].filter(x => x !== tx.receipt); }
    s.revision++; return tx;
  }
  function eligibleEvents(p, s, scopeNode = s.current_node_id) {
    return p.events.filter(e => {
      if (e.max_occurrences != null && (s.event_counts[e.id] || 0) >= e.max_occurrences) return false;
      if (!e.enabled || e.detection !== 'api' || !condition(e.condition, s) ||
        e.scope.kind === 'nodes' && !e.scope.node_ids.includes(scopeNode) || e.repeat_policy === 'once' && s.event_counts[e.id]) return false;
      if (!e.completion_node_id) return rewardAvailable(e, p, s);
      const node = indexProject(p).nodes.get(e.completion_node_id), pack = p.packages?.find(b => b.node_ids.includes(node.id));
      return !!node.completion_criteria.trim() && !s.receipts['node:' + node.id] && nodeReady(node, p, s) && (pack ? pack.enabled && s.package_progress?.[pack.id]?.current_node_id === node.id && ['ready', 'running'].includes(s.package_progress?.[pack.id]?.status) && condition(pack.continue_condition, s) : s.current_node_id === node.id);
    });
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
    if (s.project_revision !== p.revision) { s.pending_checks = []; s.history = []; s.stage_progress = null; s.turn_context = null; s.project_revision = p.revision; }
    s.stage_progress ||= null; s.turn_context ||= null; s.last_stage_message_id ??= -1;
    if (s.settlements) {
      const l = s.settlements;
      assert(object(l.entries) && Array.isArray(l.order) && new Set(l.order).size === l.order.length && object(l.baseline) && object(l.baseline.variables) && object(l.baseline.event_counts) && Array.isArray(l.baseline.collected_ids) && Array.isArray(l.baseline.completed_node_ids), '结算来源记录格式无效');
      assert(l.order.every(k => typeof k === 'string' && object(l.entries[k]) && Array.isArray(l.entries[k].effects) && Array.isArray(l.entries[k].dependencies) && l.entries[k].dependencies.every(x => typeof x === 'string' && /^(result|node|event|receipt):/.test(x))), '结算依赖记录格式无效');
    }
    if (s.stage_progress) {
      assert(object(s.stage_progress) && s.stage_progress.node_id === s.current_node_id, '阶段进度不属于当前节点');
      s.stage_progress.summary = String(s.stage_progress.summary || '').slice(0, 400);
      s.stage_progress.facts = (Array.isArray(s.stage_progress.facts) ? s.stage_progress.facts : []).slice(-8);
    }
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
        {id: 'N002', title: '走廊里的房卡', guidance: '在走廊引入可疑维修员遗落房卡的线索，让玩家自行决定是否拾取和调查。', completion_criteria: '玩家实际拾取维修员遗落的房卡并已持有。仅看到房卡或打算拾取不算完成。', completion_exclusions: ['仅进入走廊', '只提出拾取', '拾取失败'], effects: [{collect: 'A'}], routes: [{target: 'N001', label: '返回大厅'}]},
        {id: 'N003', title: '前台登记册', guidance: '前台无人值守，登记册中维修员身份与工牌信息不符。通过可观察线索呈现，不代替玩家调查。', completion_criteria: '玩家实际查阅登记册，并确认维修员登记身份与工牌信息不符。', completion_exclusions: ['仅到达前台', '仅打算查册', '尚未确认身份不符'], effects: [{collect: 'B'}], routes: [{target: 'N001', label: '返回大厅'}]},
        {id: 'C', title: '两条线索拼合', guidance: '房卡编号与假身份线索共同指向顶层的一间房。让玩家决定是否继续追查，逐步揭露有人借停电隐瞒行动。', effects: []},
        {id: 'D', title: '只有房卡', guidance: '房卡提供了房间方向，但身份信息仍缺失，保留疑点和继续调查的空间。', effects: [], routes: [{target: 'N001', label: '继续搜集线索'}]},
        {id: 'E', title: '只有身份线索', guidance: '确认维修员身份可疑，尚无法定位其房间，通过前台和在场人物的反应推动调查。', effects: [], routes: [{target: 'N001', label: '继续搜集线索'}]},
      ],
      events: [{id: 'E_TRUST', title: '共同承担风险', description: '玩家与同行角色实际协作承担调查风险。', completion_criteria: '双方已进行具体协作，不只是提出邀请或讨论计划。', exclusions: ['提出计划', '对方拒绝', '引用旧事'], effects: [{add: {variable: 'trust', value: 5}}], repeat_policy: 'once_per_accepted_turn', detection: 'api', auto_settle: false}],
    });
  }
  function convertAnalysisProject(input) {
    const p = normalizeProject(input);
    for (const node of p.nodes) if (!node.suggested && node.completion_criteria.trim() && !p.events.some(e => e.completion_node_id === node.id)) {
      const eventId = shortId(p, 'E');
      p.events.push({id: eventId, title: node.title + ' · 完成', description: node.completion_criteria, completion_node_id: node.id, scope: {kind: 'nodes', node_ids: [node.id]}, repeat_policy: 'once', effects: [], condition: true, detection: 'api', auto_settle: false});
    }
    return normalizeProject(p);
  }
  function hasResult(c, code) {
    if (!object(c)) return false;
    return c.collected === code || (c.all || c.any || []).some(x => hasResult(x, code)) || hasResult(c.not, code);
  }
  function resultReferences(p, code) {
    const refs = [], add = (kind, item, field, label) => refs.push({kind, id: item.id, field, label});
    for (const n of p.nodes) {
      if (hasResult(n.entry_condition, code)) add('node', n, 'entry_condition', n.title + '：进入条件');
      n.routes.forEach((r, i) => { if (hasResult(r.condition, code)) add('node', n, 'routes.' + i, n.title + ' → ' + (r.label || r.target) + '：出口条件'); });
      if (n.effects.some(e => e.collect === code)) add('node', n, 'effects', n.title + '：完成后取得');
    }
    for (const e of p.events) { if (hasResult(e.condition, code)) add('event', e, 'condition', e.title + '：前置条件'); if (e.effects.some(x => x.collect === code)) add('event', e, 'effects', e.title + '：发生后取得'); }
    for (const b of p.packages) for (const field of ['condition', 'continue_condition']) if (hasResult(b[field], code)) add('package', b, field, b.title + (field === 'condition' ? '：触发条件' : '：持续条件'));
    for (const c of p.collections) if (c.id !== code) { if (hasResult(c.requires, code)) add('result', c, 'requires', c.title + '：取得前提'); if (c.exclusive_with.includes(code)) add('result', c, 'exclusive_with', c.title + '：互斥结果'); }
    return refs;
  }
  function removeResultDefinition(input, code, mode = 'block', replacement = '') {
    const p = clone(input); assert(p.collections.some(x => x.id === code), '结果定义不存在');
    assert(['block', 'remove', 'replace'].includes(mode), '请选择关联条件的处理方式');
    if (mode === 'replace') assert(replacement !== code && p.collections.some(x => x.id === replacement), '请选择另一个已定义结果');
    const rewrite = c => {
      if (!hasResult(c, code)) return c;
      if (mode === 'block') return false;
      const prune = value => {
        if (!object(value)) return value;
        if (value.collected === code) return mode === 'replace' ? {collected: replacement} : null;
        if (value.not) { const child = prune(value.not); return child == null ? null : {not: child}; }
        if (value.all || value.any) { const op = value.all ? 'all' : 'any', parts = value[op].map(prune).filter(x => x != null); return parts.length ? {[op]: parts} : null; }
        return value;
      };
      return prune(c) ?? true;
    };
    for (const n of p.nodes) { n.entry_condition = rewrite(n.entry_condition); n.routes.forEach(r => { r.condition = rewrite(r.condition); }); n.effects = n.effects.filter(e => e.collect !== code); if (n.result_ids) n.result_ids = n.result_ids.filter(k => k !== code); }
    for (const e of p.events) { e.condition = rewrite(e.condition); e.effects = e.effects.filter(x => x.collect !== code); }
    for (const b of p.packages) { b.condition = rewrite(b.condition); b.continue_condition = rewrite(b.continue_condition); }
    p.collections = p.collections.filter(c => c.id !== code);
    for (const c of p.collections) { c.requires = rewrite(c.requires); c.exclusive_with = c.exclusive_with.filter(k => k !== code); }
    return normalizeProject(p);
  }
  function resultInProgress(s, code) {
    return s.collected_ids.includes(code) || s.settlements?.baseline.collected_ids.includes(code) || Object.values(s.settlements?.entries || {}).some(x => x.effects.some(e => e.collect === code) || x.dependencies.includes('result:' + code));
  }
  function obtainedResults(p, s) {
    return s.collected_ids.map(code => {
      const def = p.collections.find(c => c.id === code) || {id: code, title: code, description: ''};
      const receipt = (s.settlements?.order || []).find(k => s.settlements.entries[k]?.effects.some(e => e.collect === code));
      const entry = s.settlements?.entries[receipt];
      const from = entry?.node_id ? p.nodes.find(n => n.id === entry.node_id) : entry?.event_id ? p.events.find(e => e.id === entry.event_id) : null;
      return {id: code, title: def.title, description: def.description || '', source: from?.title || (def.external ? '外部记录' : '旧进度或导入记录'), at: entry?.at || null, receipt: receipt || ''};
    });
  }
  return {VERSION, clone, object, own, id, shortId, displayId, assert, safeId, parseJSON, normalizeProject, normalizeCompletion, convertAnalysisProject, indexProject, createProgress, condition, conditionText, validateCondition, nodeReady, resultReady, dependencies, initLedger, effectValue, rewardAvailable, applyEffects, transact, completeNode, enterNode, settleEvent, undo, eligibleEvents, prompt, migrateProgress, demoProject, hasResult, resultReferences, removeResultDefinition, resultInProgress, obtainedResults};
});
