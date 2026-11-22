const fs = require('fs');

let html = fs.readFileSync('预览_状态栏样式.html', 'utf8');

// ============================================================
// 1. 彻底更新 CHAR_ROSTER 数据：清除所有英文变量名与黑话！
// ============================================================
const newCharRosterCode = `    // 5 位小队角色的详细档案与可执行选项数据库 (纯净西幻手札·零黑话零代码裸露)
    const CHAR_ROSTER = {
      'ed': {
        fullname: '爱德 · 高夫 (Ed Goff)',
        subtitle: '银月珠宝铺落难遗孤 · 随行后勤伙伴与市井耳目',
        badge: '位阶：I · 见习凡俗阶（普通人类幼童）',
        sigil: '🪶',
        sigilName: '爱德',
        sigilSub: '飞羽 · 遗孤',
        census: '8岁，身形单薄清瘦，穿着改短的粗麻旧布衣，腰扎麻绳。父母遇魔物遇难后被小队救起，表舅席德借伪造借据霸占珠宝铺并将年幼的爱德逐出街头。爱德折返旅店投奔小队，以勤勉懂事报恩。',
        soul: '纯善知恩 × 渴望变强保护至亲的倔强少年气。见生人习惯性怯生，唯独紧随 {{user}} 哥哥；坚信只要自己足够听话、多帮队伍省钱干活、学好本领，就能与大家一同救回姐姐。',
        metrics: [
          { label: '市井后勤效能', val: '公会急件抢单 / 旅店免租抵宿' },
          { label: '求生常识指导', val: '传授进度：0 / 3（未达标）' },
          { label: '姐姐爱丽丝支线', val: '阶段三：探知真相（银月珠宝铺）' },
          { label: '当前位置态势', val: '随队同行在场' }
        ],
        actions: [
          {
            id: 'ed_intercept_job',
            title: '公会急件抢单（日常可重复）',
            desc: '避开公会层层抽水，直接私洽主顾接单，现结金币（+30 ~ 45 金）。',
            cost: '每3天1次',
            code: 'ed_intercept_job',
            inputText: '<action id="ed_intercept_job" />',
          },
          {
            id: 'ed_daily_perk',
            title: '营生跑腿与免租回扣（日常可重复）',
            desc: '利用爱德在镇上的勤恳打杂人缘，直接减免当晚宿费（免除 5 金）或折算实物补给。',
            cost: '每3天1次 · 清晨/上午',
            code: 'ed_daily_perk',
            inputText: '<action id="ed_daily_perk" />',
          },
          {
            id: 'teach_skills',
            title: '指导求生常识',
            desc: '传授潜行、识路、辨毒或账目核对。累计教学达 3 次解锁潜行门槛。',
            cost: '消耗1小时 · 每日限1次',
            code: 'teach_skills',
            inputText: '<talk npc="ed" topic="teach_skills" />',
          },
          {
            id: 'ask_intel',
            title: '打听镇上动态',
            desc: '依据当前城镇时段，在台账注入 1 条实用情报（天气、物价、公会放榜、卫兵排班）。',
            cost: '0消耗 · 每日限1次',
            code: 'ask_intel',
            inputText: '<talk npc="ed" topic="ask_intel" />',
          },
          {
            id: 'ask_sister',
            title: '询问姐姐近况',
            desc: '回顾已掌握的姐姐爱丽丝线索摘要与当前调查节点，稳定男孩情绪。',
            cost: '0消耗 · 无冷却',
            code: 'ask_sister',
            inputText: '<talk npc="ed" topic="ask_sister" />',
          }
        ]
      },
      'gulan': {
        fullname: '古兰 · 齐格勒 (Gulan Ziegler)',
        subtitle: '半龙人领队 · 小队武力核心与前锋',
        badge: '位阶：常态 IV · 凡俗宗师阶 / 龙血爆发 V · 传奇超凡阶',
        sigil: '⚔️',
        sigilName: '古兰',
        sigilSub: '龙角 · 重剑',
        census: '19岁，身姿高挑修长，暗红长发微卷，头顶生有一对暗金色龙角。兼具凡俗宗师武道技艺与潜隐的古老龙血。',
        soul: '严谨克制的统御外壳 × 对同伴特别是 {{user}} 的深厚信赖与护短。',
        metrics: [
          { label: '古老龙血脉络', val: '12% · 潜隐平稳' },
          { label: '伙伴羁绊同调', val: '88 · 亲密互信' },
          { label: '心智纯度状态', val: '坚韧从容 · 未受侵染' },
          { label: '当前驻足活动', val: '露天练武场 · 演武' }
        ],
        actions: [
          {
            id: 'gulan_spar',
            title: '剑技切磋与战术研讨',
            desc: '在练武场切磋剑路，研讨近郊魔物攻防破绽。',
            cost: '消耗1小时 · 每日1次',
            code: 'gulan_spar',
            inputText: '<action id="gulan_spar" target="gulan" />',
          },
          {
            id: 'gulan_check_blood',
            title: '关切龙血隐秘异动',
            desc: '探询其近期气息波动，给予精神宽慰。',
            cost: '0消耗 · 每日1次',
            code: 'gulan_check_blood',
            inputText: '<talk npc="gulan" topic="check_blood" />',
          }
        ]
      },
      'isna': {
        fullname: '伊丝娜 (Isna)',
        subtitle: '猫耳斥候 · 灵敏游侠与暗巷耳目',
        badge: '位阶：III · 精锐行家阶',
        sigil: '🐾',
        sigilName: '伊丝娜',
        sigilSub: '猫耳 · 短刃',
        census: '17岁，猫耳灵动，身手敏捷，常穿便携短皮甲与双短刃。熟悉市井灰产行情与近郊斥候路线。',
        soul: '市井警醒狡黠 × 护食重利的外表下深藏对队伍的归属感。',
        metrics: [
          { label: '身价赎回金币', val: '35 金索尔 · 缓急自如' },
          { label: '伙伴羁绊同调', val: '72 · 信任默契' },
          { label: '心智纯度状态', val: '机警灵动 · 未受侵染' },
          { label: '当前驻足活动', val: '商业街拐角 · 巡风' }
        ],
        actions: [
          {
            id: 'isna_black_market',
            title: '打听地下暗流与黑市动向',
            desc: '委托伊丝娜探寻城内隐秘货栈与特殊补给渠道。',
            cost: '0消耗 · 每日1次',
            code: 'isna_black_market',
            inputText: '<talk npc="isna" topic="black_market" />',
          }
        ]
      },
      'nise': {
        fullname: '妮丝 (Nees)',
        subtitle: '见习法师 · 魔法学者与知识探求者',
        badge: '位阶：II · 登堂学者阶',
        sigil: '🔮',
        sigilName: '妮丝',
        sigilSub: '法杖 · 见闻',
        census: '18岁，身着深紫滚金边见习法袍，手握雕木法杖。沉醉于古代魔导卷轴与奇物考据。',
        soul: '自尊心强烈的学术傲娇 × 对 {{user}} 毫无保留的爱恋依附。',
        metrics: [
          { label: '魔导造诣位阶', val: '登堂学者 · 古卷考据' },
          { label: '伙伴羁绊同调', val: '92 · 深情爱恋' },
          { label: '心智纯度状态', val: '纯粹执着 · 未受侵染' },
          { label: '当前驻足活动', val: '旅店客房 · 研读' }
        ],
        actions: [
          {
            id: 'nees_study_scroll',
            title: '研讨古代魔导卷轴与碑文',
            desc: '与妮丝一同解译刚淘来的遗迹残页。',
            cost: '消耗1小时 · 每日1次',
            code: 'nees_study_scroll',
            inputText: '<talk npc="nise" topic="study_scroll" />',
          }
        ]
      },
      'aurora': {
        fullname: '奥萝拉 (Aurora)',
        subtitle: '见习牧师 · 圣职代行者',
        badge: '位阶：II · 登堂修道阶',
        sigil: '✝️',
        sigilName: '奥萝拉',
        sigilSub: '圣徽 · 牧职',
        census: '19岁，金发束于脑后，神情温婉端庄。在领主山庄执仆役工签。',
        soul: '虔诚温厚 × 隐忍负重。不愿给小队添麻烦，独自承担还债重担。',
        metrics: [
          { label: '债务偿还压力', val: '25 · 分期清偿可控' },
          { label: '伙伴羁绊同调', val: '65 · 温和信赖' },
          { label: '心智纯度状态', val: '隐忍虔诚 · 未受侵染' },
          { label: '当前驻足活动', val: '领主山庄 · 仆役值守' }
        ],
        actions: [
          {
            id: 'aurora_inquire_debt',
            title: '探问山庄工签差事与还债压力',
            desc: '关切其在领主府邸差事，提供生活资助与支持。',
            cost: '0消耗 · 每日1次',
            code: 'aurora_inquire_debt',
            inputText: '<talk npc="aurora" topic="inquire_debt" />',
          }
        ]
      }
    };`;

const rosterStart = html.indexOf('const CHAR_ROSTER = {');
const rosterEnd = html.indexOf('function handleImgError', rosterStart);
if (rosterStart !== -1 && rosterEnd !== -1) {
  html = html.substring(0, rosterStart) + newCharRosterCode + '\n\n    ' + html.substring(rosterEnd);
  console.log('Replaced CHAR_ROSTER successfully');
} else {
  console.log('Error: CHAR_ROSTER bounds not found');
}

// ============================================================
// 2. 彻底重构 openCharModal 渲染逻辑：隐藏英文代码名与指令代号！
// ============================================================
const newModalRenderCode = `      const metricsBox = document.getElementById('m-info-metrics');
      metricsBox.innerHTML = '';
      char.metrics.forEach(m => {
        const row = document.createElement('div');
        row.className = 'okh-info-metric-row';
        row.innerHTML = '<span class="okh-metric-label">' + m.label + '：</span><span class="okh-info-metric-val">' + m.val + '</span>';
        metricsBox.appendChild(row);
      });

      const actList = document.getElementById('m-actions-list');
      actList.innerHTML = '';
      document.getElementById('m-act-count-badge').textContent = char.actions.length + ' 项行动就绪';

      char.actions.forEach(act => {
        const btn = document.createElement('button');
        btn.className = 'okh-act-pill';
        btn.onclick = () => pickActionDirect(act.inputText, act.title);
        btn.innerHTML =
          '<div class="okh-act-pill-left">' +
            '<div class="okh-act-title">✦ ' + act.title + '</div>' +
            '<div class="okh-act-desc">' + act.desc + '</div>' +
          '</div>' +
          '<div class="okh-act-pill-right">' +
            '<span class="okh-act-cost">' + act.cost + '</span>' +
            '<span class="okh-act-badge">点击委任</span>' +
          '</div>';
        actList.appendChild(btn);
      });`;

const actListTarget = html.indexOf('const metricsBox = document.getElementById(\'m-info-metrics\');');
const actListEnd = html.indexOf('document.getElementById(\'char-modal\').classList.add(\'active\');', actListTarget);

if (actListTarget !== -1 && actListEnd !== -1) {
  html = html.substring(0, actListTarget) + newModalRenderCode + '\n\n      ' + html.substring(actListEnd);
  console.log('Replaced openCharModal render logic successfully');
} else {
  console.log('Error: openCharModal render logic bounds not found');
}

// ============================================================
// 3. 模态框 HTML 结构强化（去黑话、标题文雅化）
// ============================================================
// 把 "<span>📋</span> 户籍身世与立身之本" 替换为 "<span>📜</span> 伙伴履历与身世"
html = html.replace(/<span>📋<\/span>\s*户籍身世与立身之本/g, '<span>📜</span> 伙伴履历与身世');
// 确保心境标题为 "<span>🕯</span> 内心风骨与心境"
html = html.replace(/<div class="okh-info-sec-title"><span>🕯<\/span>\s*心理<\/div>/g, '<div class="okh-info-sec-title"><span>🕯</span> 内心风骨与心境</div>');
html = html.replace(/<div class="okh-info-sec-title"><span>§<\/span>\s*心相底模与因果心智<\/div>/g, '<div class="okh-info-sec-title"><span>🕯</span> 内心风骨与心境</div>');
// 把 "<span>⚖️</span> 实时状态与关键指标" 替换为 "<span>⚖️</span> 实体状态与特质"
html = html.replace(/<span>⚖️<\/span>\s*实时状态与关键指标/g, '<span>⚖️</span> 实体状态与特质');

// ============================================================
// 4. 重构爱德卡片 HTML（使其成为横跨两列的随行后勤总管卡）
// ============================================================
const newEdCardHtml = `        <!-- 5. 爱德（横跨双列·随行后勤总管卡） -->
        <div class="okh-member-card ed-card">
          <div class="okh-ed-left">
            <div class="okh-portrait-slot" style="border-color: rgba(104, 173, 124, 0.45);" onclick="openCharModal('ed')" title="点击查看爱德大图与日常可重复委任">
              <img class="okh-portrait-img" id="img-ed" src="assets/portraits/ed.png" alt="爱德" onerror="handleImgError(this)" style="display:none;">
              <div class="okh-sigil-fallback" id="sigil-ed" style="background: radial-gradient(circle at 50% 35%, rgba(28, 48, 34, 0.95), rgba(12, 20, 15, 0.98));">
                <span class="okh-sigil-glyph" style="color: #87d79e;">🪶</span>
                <span class="okh-sigil-name" style="color:#bce3c4;">爱德</span>
                <span class="okh-sigil-sub" style="color:#7bb386;">飞羽 · 遗孤</span>
              </div>
            </div>
            <div class="okh-ed-meta">
              <div class="okh-body-head">
                <div class="okh-name-title">
                  <span class="okh-hero-name" style="color:#bce3c4;">爱德</span>
                  <span class="okh-hero-job" style="color:#85b88e;">随行后勤总管</span>
                </div>
                <span class="okh-hero-locale" style="color:#87d79e; background:rgba(104, 173, 124, 0.15); border-color:rgba(104,173,124,0.3);">同行在场</span>
              </div>
              <div class="okh-bond-metric">
                <div class="okh-bond-labels">
                  <span class="okh-bond-title" style="color:#85b88e;">市井后勤效能</span>
                  <span class="okh-bond-tier" style="color:#bce3c4;">公会急件抢单 · 旅店免租抵宿</span>
                </div>
                <div class="okh-gauge-track"><div class="okh-gauge-fill" style="width: 100%; background: linear-gradient(90deg, #4d825c, #87d79e);"></div></div>
              </div>
            </div>
          </div>
          <div class="okh-ed-divider"></div>
          <div class="okh-ed-right">
            <div class="okh-soul-row">
              <span class="okh-soul-icon">🕯</span>
              <span class="okh-soul-quote" style="color:#cce8d2;">“救回姐姐爱丽丝 · 不给队伍添负担”</span>
            </div>
            <div class="okh-action-row" style="margin-top: 5px;">
              <span class="okh-action-icon">📍</span>
              <span class="okh-action-text" style="color:#9ec7a5;">银月珠宝铺支线：探知表舅席德借据伪造真相中</span>
            </div>
          </div>
        </div>`;

const edStart = html.indexOf('<!-- 5. 爱德');
const edEnd = html.indexOf('</div>\n    </details>', edStart);
if (edStart !== -1 && edEnd !== -1) {
  html = html.substring(0, edStart) + newEdCardHtml + '\n      ' + html.substring(edEnd);
  console.log('Replaced Ed card with wide dual-column layout successfully');
} else {
  console.log('Error: Ed card bounds not found');
}

// ============================================================
// 5. 待决事件选项中的代码名清除
// ============================================================
html = html.replace(/<span class="okh-opt-code">probe_direct_mention<\/span>/g, '<span class="okh-opt-code" style="color:var(--okh-gold-dim);">[开门见山]</span>');
html = html.replace(/<span class="okh-opt-code">probe_inquire_debt<\/span>/g, '<span class="okh-opt-code" style="color:var(--okh-gold-dim);">[借商探实]</span>');

// ============================================================
// 6. 模态框 CSS 增强（左右对齐、网格指标、按钮质感）
// ============================================================
const modalCssAdditions = `
    /* 模态框指标与按钮精修 */
    .okh-info-sec {
      background: rgba(30, 24, 19, 0.7);
      border: 1px solid rgba(160, 132, 86, 0.22);
      border-radius: 4px;
      padding: 8px 12px;
      margin-bottom: 8px;
    }
    .okh-info-sec-title {
      font-size: 11px;
      font-weight: bold;
      color: var(--okh-gold-main);
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 5px;
      border-bottom: 1px dashed rgba(160, 132, 86, 0.2);
      padding-bottom: 4px;
    }
    .okh-info-sec-content {
      font-size: 12px;
      line-height: 1.6;
      color: var(--okh-text-main);
    }
    .okh-info-metric-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 3px 0;
      border-bottom: 1px solid rgba(160, 132, 86, 0.1);
      font-size: 11px;
    }
    .okh-info-metric-row:last-child {
      border-bottom: none;
    }
    .okh-metric-label {
      color: var(--okh-gold-dim);
    }
    .okh-info-metric-val {
      font-weight: 600;
      color: var(--okh-gold-light);
    }
    .okh-act-badge {
      font-size: 10px;
      color: var(--okh-gold-main);
      background: rgba(195, 162, 108, 0.12);
      border: 1px solid rgba(195, 162, 108, 0.3);
      padding: 2px 7px;
      border-radius: 3px;
      transition: all 0.2s;
    }
    .okh-act-pill:hover .okh-act-badge {
      background: rgba(195, 162, 108, 0.25);
      color: var(--okh-gold-light);
      border-color: var(--okh-gold-light);
    }
`;

const modalBoxPos = html.indexOf('.okh-modal-box {');
if (modalBoxPos !== -1) {
  html = html.substring(0, modalBoxPos) + modalCssAdditions + '\n' + html.substring(modalBoxPos);
  console.log('Inserted modalCssAdditions');
}

fs.writeFileSync('预览_状态栏样式.html', html, 'utf8');
console.log('Successfully written full layout fix to 预览_状态栏样式.html');
