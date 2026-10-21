"use strict";

const fs = require("node:fs");
const path = require("node:path");

const { validateNarrativeDiscipline } = require("../utils/narrative_validator");

/**
 * 尾行 · 世界书自动组装器 (worldbook_builder.js)
 * 将本地核心配置 (lifepack.json) 与单一真源提示词 (_card_core.txt)
 * 编译并转换为标准酒馆 Character Book Entries 格式。
 */
function buildWorldbook(rootDir) {
  // 单一真源：从 _card_core.txt 动态切片提取文风 (SECTION_1) 与中控回执 (SECTION_2)
  const coreRaw = fs.readFileSync(path.join(rootDir, "src/text_data/_card_core.txt"), "utf8");
  const sysPromptMatch = coreRaw.match(/@@@ SYSTEM_PROMPT\s*([\s\S]*?)(?=@@@|$)/);
  const sysPrompt = sysPromptMatch ? sysPromptMatch[1].trim() : "";
  const sec1Match = sysPrompt.match(/### SECTION_1:[^\n]*\s*([\s\S]*?)(?=### SECTION_2:|$)/);
  const sec2Match = sysPrompt.match(/### SECTION_2:[^\n]*\s*([\s\S]*?)$/);
  const contentTheme = sec1Match ? sec1Match[1].trim() : "";
  const contentCentral = sec2Match ? sec2Match[1].trim() : "";

  let uidCounter = 1;
  const entries = [];

  function addEntry({ name, keys, secondaryKeys = [], content, constant = false, selective = false, position = "before_char", order = 100, enabled = true }) {
    // 物理拦截防线：凡装入世界书的条目，必须先经受风骨扫描检验
    validateNarrativeDiscipline(content, `世界书条目 [${name}]`);

    entries.push({
      id: uidCounter,
      uid: uidCounter,
      name,
      comment: name,
      keys: keys || [],
      secondary_keys: secondaryKeys || [],
      content: content.trim(),
      enabled: enabled !== false,
      constant,
      selective,
      insertion_order: order,
      position,
      case_sensitive: false,
      extensions: {
        position: position === "before_char" ? 0 : 1,
        display_index: uidCounter,
        exclude_recursion: true,
        prevent_recursion: true,
        delay_until_recursion: false,
        probability: 100,
        useProbability: true,
        depth: 4,
        selectiveLogic: 0,
        scan_depth: 2
      }
    });
    uidCounter++;
  }

  // 1. 文风：现代都市潜行与叙事风骨（常驻，单一真源派生）
  addEntry({
    name: "【题材与文风】现实都市潜行与叙事风骨",
    keys: ["尾行", "文风", "都市", "潜行", "叙事"],
    constant: true,
    order: 10,
    position: "before_char",
    content: contentTheme
  });

  // 2. 中控：数据真源与裁决演绎指南（常驻，单一真源派生）
  addEntry({
    name: "【中控与回执】数据真源与裁决演绎指南",
    keys: ["中控", "回执", "裁判", "规则", "结算", "申报"],
    constant: true,
    order: 20,
    position: "before_char",
    content: contentCentral
  });

  // 3. 目标档案：晚自习女高中生（备选目标：默认关闭，由中控在开局选定后动态启用）
  addEntry({
    name: "【目标档案】晚自习女高中生",
    keys: ["高中生", "女高中生", "陈雨婷", "自习", "校服", "JK", "student"],
    constant: false,
    enabled: false,
    order: 31,
    content: `[TARGET_GROUP: student]
CATEGORY: 在校高中生 | 升学期在读学生群体
PHYSICAL_STATUS:
  - 体格与肌肉力量处于天然弱势层级，遭遇正面压制缺乏有效抗衡手段
  - 缺乏对抗冲突、防暴与反追踪经验，体能储备有限
INSTITUTIONAL_FRAME:
  - 处在家庭监护与学校规训的双重约束下，生活圈高度依附于既定体制
  - 受家庭作息与门禁规矩管束，晚归面临严格的问责与心理重压
  - 经济与人身依附监护，外部社会求助资源单纯匮乏
PSYCHOLOGICAL_VULNERABILITY:
  - 高度在乎学生身份声誉与体面，对“违纪通报、叫家长、被周围社交圈议论指点”具备强烈的应激戒备
  - 危机处置本能以避险脱离为主，遇突发险情倾向于逃回熟悉安全区而非正面单挑
BEHAVIOR_BASELINE:
  - 言行带有校园环境的规矩与收敛底色，遵守秩序
  - 对暗处潜伏的尾随恶意缺乏系统性的防范与反侦查预警`
  });

  // 4. 目标档案：独居女大学生（首发默认目标：默认启用并常驻，与卡片 first_mes / 创角默认选项一致）
  addEntry({
    name: "【目标档案】独居女大学生",
    keys: ["大学生", "女大学生", "林若雪", "自习", "大学", "college"],
    constant: true,
    enabled: true,
    order: 30,
    content: `[TARGET_GROUP: college]
CATEGORY: 全日制在校大学生 | 校外独居租住群体
PHYSICAL_STATUS:
  - 女性自然生理体格，抗正面力量压制能力薄弱，体能储备属于常规学生区间
  - 缺乏专业防暴对抗技巧，在突发近身受迫时以本能挣脱与避险为主
INSTITUTIONAL_FRAME:
  - 脱离原生家庭日常监护，租住在校外老旧公寓或周边社区，具备独立起居空间但缺乏物理安防支持
  - 日常行动受排课、大作业与自习作息支配，晚归属于常见生活规律
  - 人际网络主要依托同系同学与熟人圈子，独处时缺乏即时监护依托
PSYCHOLOGICAL_VULNERABILITY:
  - 重视自身在校园社交圈内的知性形象与声誉，对私生活被窥视、被跟踪尾随具备强烈的羞耻感与戒心
  - 面临试探或异常关注时，起初常因要强或侥幸心理迟疑，不愿轻易声张或当众示弱
  - 遇到可疑危机时，倾向于向熟悉的室友或公共明亮场所求助，而非正面单挑
BEHAVIOR_BASELINE:
  - 习惯独立往返于校区与寓所之间，夜间独行带有日常警惕，但对系统性的潜伏追踪缺乏防范经验
  - 依靠常态化的市井秩序与沿街商铺获取安全感`
  });

  return {
    name: "尾行·中控世界书",
    description: "尾行世界书：文风骨架、中控回执与目标群体生态画像",
    scan_depth: 2,
    token_budget: 4096,
    recursive_scanning: false,
    extensions: {},
    entries
  };
}

module.exports = { buildWorldbook };
