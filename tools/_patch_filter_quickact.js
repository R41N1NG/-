const fs = require('fs');

const files = ['_build_card.js', 'src/card_build/_build_card.js'];

files.forEach(fp => {
  if (!fs.existsSync(fp)) return;
  let code = fs.readFileSync(fp, 'utf8');

  // 1. 定义 filterQuickactScript
  if (!code.includes('仙姝墮·过滤正文伪选项按钮')) {
    const defineCode = `
const filterQuickactScript = {
  id: 'f9e8d7c6-b5a4-4321-8765-fedcba098765',
  scriptName: '仙姝墮·过滤正文伪选项按钮（保留开场白读极乐引）',
  findRegex: '/<button[^>]*class="xsd-quickact"[^>]*data-xsdsend="(?!阅读 极乐引)[^"]*"[^>]*>[\\\\s\\\\S]*?<\\\\/button>/gi',
  replaceString: '',
  trimStrings: [],
  placement: [2],
  disabled: false,
  markdownOnly: false,
  promptOnly: false,
  runOnEdit: true,
  substituteRegex: 0,
  minDepth: null,
  maxDepth: null
};
`;
    // 插入在 deEuphemismScript 后面
    if (code.includes('deEuphemismScript =')) {
      code = code.replace(/(const deEuphemismScript = \{[\s\S]*?\};)/, `$1\n${defineCode}`);
    } else {
      // 插入在 regexScript 定义之后
      code = code.replace(/(const regexScript = \{[\s\S]*?\};)/, `$1\n${defineCode}`);
    }

    // 2. 加入 regex_scripts 列表
    code = code.replace(
      'regex_scripts: [',
      'regex_scripts: [\n      filterQuickactScript,'
    );
  }

  // 3. 在系统提示词里加入禁止输出选项按钮的纪律
  if (!code.includes('【严禁正文选项】') && code.includes('### 禁忌清单（一犯即废）')) {
    code = code.replace(
      '### 禁忌清单（一犯即废）',
      '### 禁忌清单（一犯即废）\n- **【严禁正文选项】**：正文末尾严禁生成任何 `<button>` 标签、HTML 选项或剧情分支按钮。情节推进完全交由玩家在输入框自主掌控。'
    );
  }

  fs.writeFileSync(fp, code, 'utf8');
  console.log(`成功注入正文选项过滤与提示词纪律至: ${fp}`);
});
