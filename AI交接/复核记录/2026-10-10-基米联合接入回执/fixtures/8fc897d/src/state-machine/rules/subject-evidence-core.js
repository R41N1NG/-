/** 身份：gpt。保守的主体事实核验；不以名词提及或全段距离替代事实归属。 */
function createXsdSubjectEvidence({ holders, hardPatterns }) {
  const names = Array.from(new Set((holders || []).map(String))).sort((a, b) => b.length - a.length);
  const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const nonFact = /据说|听说|传闻|谣传|若是|倘若|假如|万一|是否|尚未|还没|没有|未曾|不曾|并未|从未|不会|不愿|不打算|打算|计划|将要|即将|可能|希望|想要|谈起|讨论|提及/;
  function deflower(prose, holder) {
    const target = String(holder || '').trim();
    if (!target || !names.includes(target)) return { ok: false, label: '', why: '未知或缺失主体' };
    const clauses = String(prose || '').split(/[，。；！？\n]/);
    for (const clause of clauses) {
      if (nonFact.test(clause)) continue;
      for (const [pattern, label] of hardPatterns) {
        const re = new RegExp(pattern.source, 'g');
        let match;
        while ((match = re.exec(clause))) {
          if (match.index === re.lastIndex) re.lastIndex++;
          if (label === '处子' && !/(?:不再是处子|处子(?:之|的)?身.{0,8}(?:被破|已破|失去)|(?:夺走|破去|失去).{0,8}处子)/.test(clause)) continue;
          if (label === '初夜' && !/(?:(?:夺走|夺去|失去|交付|交出|献出|给了|经历|度过|共度).{0,12}初夜|初夜.{0,12}(?:被夺|已过|已经过去|结束|交付|献出))/.test(clause)) continue;
          const before = clause.slice(0, match.index);
          const mentioned = names.flatMap(name => {
            const found = []; let at = before.indexOf(name);
            while (at !== -1) { found.push({ name, at, end: at + name.length }); at = before.indexOf(name, at + name.length); }
            return found;
          }).sort((a, b) => a.at - b.at);
          const passiveAt = before.lastIndexOf('被');
          const patient = passiveAt >= 0 ? mentioned.filter(m => m.end <= passiveAt).pop() : null;
          const last = patient || mentioned[mentioned.length - 1];
          if (last && match.index - last.end <= 80) {
            const group = [last.name];
            if (patient) { if (patient.name === target) return { ok: true, label, why: '' }; continue; }
            for (let i = mentioned.length - 2; i >= 0; i--) {
              const left = mentioned[i], right = mentioned[i + 1];
              if (!/^[\s和与及、跟]+$/.test(before.slice(left.end, right.at))) break;
              group.push(left.name);
            }
            if (group.includes(target)) return { ok: true, label, why: '' };
          }
          // 明确倒装只接受“破身的是某人”，不把动作后的旁观人名算成主体。
          if (new RegExp('^(?:的是|者是)\\s*' + esc(target)).test(clause.slice(match.index + match[0].length))) return { ok: true, label, why: '' };
        }
      }
    }
    return { ok: false, label: '', why: '正文缺少明确落在该主体上的已发生事实（提及、计划、否定或旁观不计）' };
  }
  return Object.freeze({ deflower });
}
