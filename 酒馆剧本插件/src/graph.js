(function (root, factory) {
  const value = factory(typeof window === 'undefined' ? require('./core.js') : root.BSECore, typeof window === 'undefined' ? require('./flow.js') : root.BSEFlow);
  if (typeof window === 'undefined' && typeof module === 'object' && module.exports) module.exports = value; else root.BSEGraph = value;
})(typeof window !== 'undefined' ? window : globalThis, function (C, F) {
  'use strict';
  const escape = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
  const STATUS = {locked: '未解锁', available: '已解锁，待完成', running: '进行中', done: '已完成'};
  function build(p, s, filter = '') {
    const nodes = new Map(), edges = [], active = F.activeNodes(p, s), refs = C.indexProject(p);
    const add = (id, label, name, status, kind) => { if (!nodes.has(id)) nodes.set(id, {id, label, name, status, kind}); return id; };
    const edge = (from, to, satisfied = false, label = '') => edges.push({from, to, satisfied, label});
    const nodeAvailable = n => {
      const b = F.owner(p, n.id);
      return C.nodeReady(n, p, s) && (b ? ['ready', 'running'].includes(s.package_progress?.[b.id]?.status) && s.package_progress[b.id].current_node_id === n.id : n.id === s.current_node_id || F.availableRoutes(p, s, s.current_node_id).some(r => r.target === n.id));
    };
    for (const n of p.nodes) add('node:' + n.id, C.displayId(p, 'node', n.id), n.title, s.completed_node_ids.includes(n.id) ? 'done' : active.some(x => x.node_id === n.id) ? 'running' : nodeAvailable(n) ? 'available' : 'locked', 'node');
    for (const e of p.events) add('event:' + e.id, C.displayId(p, 'event', e.id), e.title, s.event_counts[e.id] ? 'done' : e.enabled && C.condition(e.condition, s) && (!e.completion_node_id || nodeAvailable(refs.nodes.get(e.completion_node_id))) ? 'available' : 'locked', 'event');
    for (const c of p.collections) {
      const ready = p.nodes.some(n => n.effects.some(e => e.collect === c.id) && nodeAvailable(n)) || p.events.some(e => e.enabled && C.condition(e.condition, s) && e.effects.some(x => x.collect === c.id));
      add('result:' + c.id, c.id, c.title, s.collected_ids.includes(c.id) ? 'done' : ready && C.resultReady(c.id, p, s) ? 'available' : 'locked', 'result');
    }
    let counter = 0;
    const condition = (c, target) => {
      if (c == null || c === true) return;
      if (c === false) { edge(add('gate:' + counter++, '禁止', '条件为false', 'locked', 'gate'), target); return; }
      const [op, value] = Object.entries(c)[0]; let source;
      if (op === 'all' || op === 'any' || op === 'not') {
        source = add('gate:' + counter++, op === 'all' ? '且' : op === 'any' ? '或' : '非', C.conditionText(c, p), C.condition(c, s) ? 'done' : 'locked', 'gate');
        for (const part of op === 'not' ? [value] : value) condition(part, source);
      } else if (op === 'collected') source = add('result:' + value, value, refs.collections.get(value) || '未定义结果', s.collected_ids.includes(value) ? 'done' : 'locked', 'result');
      else if (op === 'completed' || op === 'visited') source = 'node:' + value;
      else if (op === 'event_completed') source = 'event:' + value;
      else source = add('condition:' + counter++, '数值条件', C.conditionText(c, p), C.condition(c, s) ? 'done' : 'locked', 'condition');
      edge(source, target, C.condition(c, s), op === 'visited' ? '访问' : '前提');
    };
    for (const b of p.packages) {
      const status = s.package_progress?.[b.id]?.status;
      const id = add('package:' + b.id, C.displayId(p, 'package', b.id), b.title, status === 'done' ? 'done' : status === 'running' ? 'running' : status === 'ready' ? 'available' : 'locked', 'package');
      condition(b.condition, id); condition(b.continue_condition, id); edge(id, 'node:' + b.start_node_id, ['running', 'done'].includes(status), '启动');
    }
    for (const c of p.collections) condition(c.requires, 'result:' + c.id);
    for (const n of p.nodes) {
      const id = 'node:' + n.id; condition(n.entry_condition, id);
      for (const e of n.effects) if (e.collect) edge(id, add('result:' + e.collect, e.collect, refs.collections.get(e.collect) || '未定义结果', s.collected_ids.includes(e.collect) ? 'done' : 'locked', 'result'), s.completed_node_ids.includes(n.id), '完成后取得');
      for (const r of n.routes) { edge(id, 'node:' + r.target, s.current_node_id === n.id && C.condition(r.condition, s), '行动'); condition(r.condition, 'node:' + r.target); }
    }
    for (const e of p.events) { condition(e.condition, 'event:' + e.id); if (e.completion_node_id) edge('node:' + e.completion_node_id, 'event:' + e.id, Boolean(s.event_counts[e.id]), '阶段完成'); for (const x of e.effects) if (x.collect) edge('event:' + e.id, 'result:' + x.collect, Boolean(s.event_counts[e.id]), '确认后取得'); }
    for (const n of p.nodes) nodes.get('node:' + n.id).detail = '进入条件：' + C.conditionText(n.entry_condition, p) + '；完成标准：' + (n.completion_criteria || '仅手动确认');
    for (const b of p.packages) nodes.get('package:' + b.id).detail = '触发：' + C.conditionText(b.condition, p) + '；持续：' + C.conditionText(b.continue_condition, p) + '；优先级：' + b.priority;
    for (const c of p.collections) {
      const witnesses = (s.settlements?.order || []).map(k => s.settlements.entries[k]).filter(x => x.effects.some(e => e.collect === c.id)).flatMap(x => x.dependencies);
      nodes.get('result:' + c.id).detail = (c.description ? c.description + '；' : '') + '取得前提：' + C.conditionText(c.requires, p) + (c.exclusive_with.length ? '；互斥：' + c.exclusive_with.join('、') : '') + (witnesses.length ? '；本次使用的前提：' + [...new Set(witnesses)].join('、') : '');
    }
    if (filter && refs.packages.has(filter)) {
      const b = refs.packages.get(filter), keep = new Set(['package:' + b.id, ...b.node_ids.map(k => 'node:' + k)]);
      b.node_ids.forEach(k => refs.nodes.get(k).effects.filter(e => e.collect).forEach(e => keep.add('result:' + e.collect)));
      p.events.filter(e => b.node_ids.includes(e.completion_node_id)).forEach(e => keep.add('event:' + e.id));
      let changed = true; while (changed) { const count = keep.size; for (const e of edges) if (keep.has(e.to)) keep.add(e.from); changed = keep.size !== count; }
      for (const k of nodes.keys()) if (!keep.has(k)) nodes.delete(k);
    }
    return {nodes: [...nodes.values()], edges: edges.filter(e => nodes.has(e.from) && nodes.has(e.to))};
  }
  function svg(graph, zoom = 1) {
    const byId = new Map(graph.nodes.map(n => [n.id, n])), incoming = new Map(graph.nodes.map(n => [n.id, 0])), level = new Map(graph.nodes.map(n => [n.id, 0]));
    graph.edges.forEach(e => incoming.set(e.to, incoming.get(e.to) + 1));
    const queue = graph.nodes.filter(n => incoming.get(n.id) === 0).map(n => n.id), processed = new Set();
    for (let i = 0; i < queue.length; i++) { const id = queue[i]; if (processed.has(id)) continue; processed.add(id); for (const e of graph.edges.filter(e => e.from === id)) { level.set(e.to, Math.max(level.get(e.to), Math.min(30, level.get(id) + 1))); incoming.set(e.to, incoming.get(e.to) - 1); if (!incoming.get(e.to)) queue.push(e.to); } }
    // Cyclic paths are displayed too; diagnostics decide whether the result dependency is viable.
    for (const n of graph.nodes) if (!processed.has(n.id)) level.set(n.id, 1 + Math.min(5, graph.nodes.indexOf(n) % 6));
    const rows = new Map(); let height = 150, width = 240;
    for (const n of graph.nodes) { const column = level.get(n.id), row = rows.get(column) || 0; rows.set(column, row + 1); n.x = 20 + column * 240; n.y = 24 + row * 116; width = Math.max(width, n.x + 220); height = Math.max(height, n.y + 106); }
    const palette = {done: '#4c9e82', running: '#c8a45c', available: '#608dbc', locked: '#526079'};
    const paths = graph.edges.map(e => { const a = byId.get(e.from), b = byId.get(e.to), x = a.x + 200, y = a.y + 44, bx = b.x, by = b.y + 44; return `<path d="M${x},${y} C${x + 35},${y} ${bx - 35},${by} ${bx},${by}" fill="none" stroke="${e.satisfied ? '#9ce4cf' : '#68748a'}" stroke-width="2" ${e.satisfied ? '' : 'stroke-dasharray="5 4"'} marker-end="url(#bse-arrow)"><title>${escape(e.label)}</title></path>`; }).join('');
    const boxes = graph.nodes.map(n => `<g class="graph-node" data-action="graph-node" data-id="${escape(n.id)}" tabindex="0" role="button" aria-label="${escape(n.label + ' ' + n.name + ' ' + STATUS[n.status])}"><title>${escape(n.name)}</title><rect x="${n.x}" y="${n.y}" width="200" height="88" rx="12" fill="#172235" stroke="${palette[n.status]}" stroke-width="2"/><text x="${n.x + 12}" y="${n.y + 24}" fill="#e7ecf6" font-size="14">${escape(n.name.slice(0, 14))}${n.name.length > 14 ? '…' : ''}</text><text x="${n.x + 12}" y="${n.y + 46}" fill="#b9c5dc" font-size="12">${escape(n.label.slice(0, 24))}</text><text x="${n.x + 12}" y="${n.y + 69}" fill="${palette[n.status]}" font-size="12">${escape(STATUS[n.status])}</text></g>`).join('');
    return `<svg xmlns="http://www.w3.org/2000/svg" role="group" aria-label="完成与解锁关系图" width="${Math.round(width * zoom)}" height="${Math.round(height * zoom)}" viewBox="0 0 ${width} ${height}"><defs><marker id="bse-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 Z" fill="#9aaac1"/></marker></defs>${paths}${boxes}</svg>`;
  }
  return {build, svg, STATUS};
});
