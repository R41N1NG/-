const fs = require('fs');

let html = fs.readFileSync('预览_状态栏样式.html', 'utf8');

// ============================================================
// 1. 注入顶部常驻条与交互控件 CSS（彻底消灭白框，排版规整对齐）
// ============================================================
const topBarStyles = `
    /* ============================================================
       一、顶层常驻条 (中世纪星盘时钟、地理坐标、金币与全域舆图)
       ============================================================ */
    .okh-top-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      padding: 7px 12px;
      background: rgba(24, 19, 15, 0.9);
      border: 1px solid rgba(160, 132, 86, 0.38);
      border-radius: 4px;
      box-shadow: inset 0 1px 0 rgba(255, 230, 180, 0.08), 0 2px 8px rgba(0, 0, 0, 0.5);
      margin-bottom: 8px;
    }

    .okh-bar-left {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }

    /* 时间星盘按钮 (彻底去除原生浏览器白色背景与边框) */
    .okh-dial-plate {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(42, 33, 25, 0.85);
      border: 1px solid rgba(195, 162, 108, 0.45);
      color: var(--okh-gold-light);
      padding: 4px 10px;
      border-radius: 3px;
      cursor: pointer;
      font-family: inherit;
      font-size: 11px;
      transition: all 0.2s ease;
      box-shadow: inset 0 1px 0 rgba(255, 230, 180, 0.12), 0 2px 5px rgba(0,0,0,0.4);
      outline: none;
    }
    .okh-dial-plate:hover {
      background: rgba(58, 45, 33, 0.95);
      border-color: var(--okh-border-gold-bright);
      box-shadow: 0 0 10px rgba(223, 200, 154, 0.3);
      transform: translateY(-1px);
    }
    .okh-dial-plate:active {
      transform: translateY(0);
    }
    .okh-dial-astrolabe {
      width: 16px;
      height: 16px;
      flex-shrink: 0;
    }
    .okh-dial-text {
      font-weight: 600;
      color: var(--okh-gold-light);
      letter-spacing: 0.3px;
    }
    .okh-dial-time {
      color: var(--okh-gold-main);
      font-weight: bold;
    }
    .okh-dial-cal-hint {
      font-size: 10px;
      color: var(--okh-gold-main);
      background: rgba(195, 162, 108, 0.15);
      border: 1px solid rgba(195, 162, 108, 0.3);
      padding: 1px 6px;
      border-radius: 2px;
      margin-left: 2px;
    }

    /* 地理坐标位置 */
    .okh-loc-plate {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 11px;
      color: var(--okh-text-main);
    }
    .okh-loc-sigil {
      font-size: 13px;
      color: var(--okh-gold-main);
    }

    /* 右侧：金币与地图按键 */
    .okh-bar-right {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
    }
    .okh-wealth-box {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      background: rgba(35, 27, 20, 0.7);
      border: 1px solid rgba(195, 162, 108, 0.3);
      padding: 3px 8px;
      border-radius: 3px;
      font-size: 11px;
    }
    .okh-wealth-coin {
      font-size: 12px;
    }
    .okh-wealth-val {
      font-weight: bold;
      color: var(--okh-gold-light);
    }

    /* 全域地图按钮 (彻底去除系统白底！古典暗金拟物装帧按键) */
    .okh-map-btn {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      background: linear-gradient(180deg, rgba(62, 48, 35, 0.95), rgba(35, 26, 19, 0.98));
      border: 1px solid rgba(195, 162, 108, 0.5);
      color: var(--okh-gold-light);
      padding: 4px 10px;
      border-radius: 3px;
      cursor: pointer;
      font-family: inherit;
      font-size: 11px;
      font-weight: 600;
      transition: all 0.2s ease;
      box-shadow: inset 0 1px 0 rgba(255, 230, 180, 0.18), 0 2px 5px rgba(0,0,0,0.5);
      outline: none;
    }
    .okh-map-btn:hover {
      background: linear-gradient(180deg, rgba(80, 60, 42, 0.98), rgba(48, 35, 25, 1));
      border-color: var(--okh-border-gold-bright);
      box-shadow: 0 0 10px rgba(223, 200, 154, 0.35);
      transform: translateY(-1px);
    }
    .okh-map-btn:active {
      transform: translateY(0);
    }
    .okh-map-icon {
      font-size: 12px;
    }

    /* 视野在场行 */
    .okh-presence-row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 12px;
      background: rgba(20, 16, 13, 0.65);
      border-left: 2px solid rgba(195, 162, 108, 0.45);
      border-radius: 0 3px 3px 0;
      margin-bottom: 10px;
      font-size: 11px;
    }
    .okh-presence-title {
      color: var(--okh-gold-dim);
      font-weight: 600;
      flex-shrink: 0;
    }
    .okh-presence-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }
    .okh-presence-tag {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      color: var(--okh-text-main);
    }
    .okh-presence-orb {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #68ad7c;
      box-shadow: 0 0 5px #68ad7c;
    }
    .okh-presence-action {
      color: var(--okh-text-muted);
      font-size: 10px;
    }
`;

// 插入 topBarStyles 到 CSS
const okhCardsGridPos = html.indexOf('.okh-cards-grid {');
if (okhCardsGridPos !== -1) {
  html = html.substring(0, okhCardsGridPos) + topBarStyles + '\n' + html.substring(okhCardsGridPos);
  console.log('Inserted topBarStyles before .okh-cards-grid');
} else {
  console.log('Error: .okh-cards-grid not found');
}

// ============================================================
// 2. 爱德卡片恢复一人位（与其他 4 位伙伴规格尺寸完全一致）
// ============================================================
// 删除全宽 ed-card 的 CSS 样式
html = html.replace(/\.okh-member-card\.ed-card\s*\{[\s\S]*?padding-left:\s*6px;\s*\}/g, `
    /* 爱德作为第 5 张伙伴卡：单人尺寸，绝不霸占两人位置 */
    .okh-member-card.ed-card {
      border-color: rgba(104, 173, 124, 0.38);
      background: rgba(20, 26, 21, 0.92);
    }
    .okh-member-card.ed-card:hover {
      border-color: rgba(135, 215, 158, 0.65);
      background: rgba(25, 33, 27, 0.95);
    }
`);

// 重构爱德卡片 HTML：恢复单卡结构
const standardEdCardHtml = `        <!-- 5. 爱德（标准单人位·随行后勤伙伴） -->
        <div class="okh-member-card ed-card">
          <div class="okh-portrait-slot" style="border-color: rgba(104, 173, 124, 0.45);" onclick="openCharModal('ed')" title="点击查看爱德大图与日常可重复委任">
            <img class="okh-portrait-img" id="img-ed" src="assets/portraits/ed.png" alt="爱德" onerror="handleImgError(this)" style="display:none;">
            <div class="okh-sigil-fallback" id="sigil-ed" style="background: radial-gradient(circle at 50% 35%, rgba(28, 48, 34, 0.95), rgba(12, 20, 15, 0.98));">
              <span class="okh-sigil-glyph" style="color: #87d79e;">🪶</span>
              <span style="font-size:11px; font-weight:bold; color:#bce3c4;">爱德</span>
              <span class="okh-sigil-sub" style="color:#7bb386;">飞羽 · 遗孤</span>
            </div>
          </div>
          <div class="okh-card-body">
            <div class="okh-body-head">
              <div class="okh-name-title">
                <span class="okh-hero-name" style="color:#bce3c4;">爱德</span>
                <span class="okh-hero-job" style="color:#85b88e;">随行后勤伙伴</span>
              </div>
              <span class="okh-hero-locale" style="color:#87d79e; background:rgba(104, 173, 124, 0.15); border-color:rgba(104,173,124,0.3);">同行在场</span>
            </div>
            <div class="okh-bond-metric">
              <div class="okh-bond-labels">
                <span class="okh-bond-title" style="color:#85b88e;">市井后勤效能</span>
                <span class="okh-bond-tier" style="color:#bce3c4;">急件抢单 · 旅店免租</span>
              </div>
              <div class="okh-gauge-track"><div class="okh-gauge-fill" style="width: 100%; background: linear-gradient(90deg, #4d825c, #87d79e);"></div></div>
            </div>
            <div class="okh-state-slot">
              <div class="okh-soul-row">
                <span class="okh-soul-icon">🕯</span>
                <span class="okh-soul-quote" style="color:#cce8d2;">“救回姐姐爱丽丝 · 不给队伍添负担”</span>
              </div>
              <div class="okh-action-row">
                <span class="okh-action-icon">📍</span>
                <span class="okh-action-text" style="color:#9ec7a5;">银月珠宝铺支线 · 探知借据伪造真相中</span>
              </div>
            </div>
          </div>
        </div>`;

const edCardStart = html.indexOf('<!-- 5. 爱德');
const edCardEnd = html.indexOf('</div>\n    </details>', edCardStart);
if (edCardStart !== -1 && edCardEnd !== -1) {
  html = html.substring(0, edCardStart) + standardEdCardHtml + '\n      </div>\n    </details>' + html.substring(edCardEnd + '</div>\n    </details>'.length);
  console.log('Replaced ed card with standard single-slot layout');
} else {
  console.log('Error: edCard bounds not found');
}

// ============================================================
// 3. 详情弹窗彻底删除“作为底色的内心风骨”板块
// ============================================================
// 在 HTML 模板中彻底移除心相/内心风骨板块
html = html.replace(/<div class="okh-info-sec">\s*<div class="okh-info-sec-title"><span>🕯<\/span>\s*内心风骨与心境<\/div>\s*<div class="okh-info-sec-content" id="m-info-soul"><\/div>\s*<\/div>/g, '');
html = html.replace(/<div class="okh-info-sec">\s*<div class="okh-info-sec-title"><span>🕯<\/span>\s*心理<\/div>[\s\S]*?id="m-info-soul"[\s\S]*?<\/div>\s*<\/div>/g, '');

// 在 JS openCharModal 中删除对 m-info-soul 的赋值
html = html.replace(/document\.getElementById\('m-info-soul'\)\.textContent\s*=\s*char\.soul;/g, '');

// ============================================================
// 4. 实体状态与特质：严格对齐真实真源 Schema（杜绝乱编）
// ============================================================
const genuineCharRoster = `    // 5 位小队角色的详细档案与可执行选项数据库 (严格对齐 okh_app_data.js 单一真源)
    const CHAR_ROSTER = {
      'ed': {
        fullname: '爱德 · 高夫 (Ed Goff)',
        subtitle: '银月珠宝铺落难遗孤 · 随行后勤伙伴与市井耳目',
        badge: '位阶：I · 见习凡俗阶（普通人类幼童）',
        sigil: '🪶',
        sigilName: '爱德',
        sigilSub: '飞羽 · 遗孤',
        census: '8岁，身形单薄清瘦，穿着改短的粗麻旧布衣，腰扎麻绳。父母遇魔物遇难后被小队救起，表舅席德借伪造借据霸占珠宝铺并将年幼的爱德逐出街头。爱德折返旅店投奔小队，以勤勉懂事报恩。',
        metrics: [
          { label: '心智耐受 (patience)', val: '100 / 100（从容安定）' },
          { label: '求生常识指导进度', val: '0 / 3 次（指导潜行识路）' },
          { label: '解救姐姐爱丽丝支线', val: '阶段三：探知真相（银月珠宝铺）' },
          { label: '随队同行态势', val: '随队同行在场' }
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
        metrics: [
          { label: '龙血浓度 (blood_density)', val: '12% / 100%（初醒潜隐）' },
          { label: '同伴羁绊好感 (affection)', val: '88 · 亲密' },
          { label: '龙化侵蚀阶段 (stage)', val: '如常（0 阶段）' },
          { label: '当前驻留地点 (location)', val: '露天练武场' }
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
        metrics: [
          { label: '金币渴求 (gold_desire)', val: '25 / 100（可控平稳）' },
          { label: '同伴羁绊好感 (affection)', val: '72 · 友好' },
          { label: '堕落侵蚀阶段 (stage)', val: '如常（0 阶段）' },
          { label: '当前驻留地点 (location)', val: '镇上 · 商业街' }
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
        metrics: [
          { label: '奇物求知欲望 (curiosity)', val: '40 / 100（热切探求）' },
          { label: '金碧赌场负债 (gamble_debt)', val: '0 金币（无负债）' },
          { label: '同伴羁绊好感 (affection)', val: '92 · 爱恋' },
          { label: '当前驻留地点 (location)', val: '断剑与麦酒 · 旅店客房' }
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
        metrics: [
          { label: '山庄债务压力 (debt_pressure)', val: '25 / 100（分期清偿中）' },
          { label: '同伴羁绊好感 (affection)', val: '65 · 友好' },
          { label: '堕落侵蚀阶段 (stage)', val: '如常（0 阶段）' },
          { label: '当前驻留地点 (location)', val: '领主山庄 · 女仆工签' }
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
  html = html.substring(0, rosterStart) + genuineCharRoster + '\n\n    ' + html.substring(rosterEnd);
  console.log('Replaced CHAR_ROSTER with genuine schema data');
}

fs.writeFileSync('预览_状态栏样式.html', html, 'utf8');
console.log('Saved 预览_状态栏样式.html successfully');
