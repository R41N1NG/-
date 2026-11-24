/**
 * @module okh_app_echo_format
 * @updated 2026-11-25 06:42
 * @status active
 * @reason 让正文 CG 的显示与回复验收共用匹配规则
 */
(function (root) {
  'use strict'

  const escapeRegExp = value => value.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')
  const contentTag = '[cC][oO][nN][tT][eE][nN][tT]'
  const statusTag = '[sS][tT][aA][tT][uU][sS]_[bB][aA][rR]'
  const contentOpen = '<' + contentTag + String.raw`\b[^>]*>`
  const contentClose = String.raw`<\/` + contentTag + String.raw`\s*>`
  const start = '(?:^|(?<=' + contentOpen + '))'
  const end = String.raw`(?=\r?$|` + contentClose + ')'
  const fenceMarks = ['\\x60', '~']
  const fences = fenceMarks.map(mark => `^ {0,3}${mark}{3,}`)
  const closedFences = fenceMarks.map((mark, index) => {
    const ref = String.raw`\k<fence` + index + '>'
    const close = '^ {0,3}' + ref + mark + String.raw`*[ \t]*\r?$`
    // Lookbehind reads right to left. Capture the opener's length at the closer,
    // and require the corresponding backreference to exhaust the opener run.
    return '^ {0,3}' + ref + '(?!' + mark + String.raw`)[^\r\n]*\r?\n(?:(?!` + close +
      String.raw`)[\s\S])*^ {0,3}(?<fence` + index + '>' + mark + '{3,})' + mark + String.raw`*[ \t]*\r?$`
  })
  const statusOpen = '<' + statusTag + String.raw`\b[^>]*>`
  const openOpaque = ['<!--', '<' + statusTag + String.raw`\b`, ...fences].join('|')
  const closedOpaque = [
    String.raw`<!--[\s\S]*?-->`,
    statusOpen + String.raw`[\s\S]*?<\/` + statusTag + String.raw`\s*>`,
    ...closedFences
  ].join('|')
  // The prefix must be reachable from the start without crossing an open opaque block.
  const outsideOpaque = String.raw`(?<=(?<![\s\S])(?:` + closedOpaque +
    '|(?!(?:' + openOpaque + String.raw`))[\s\S])*)`
  const insideContent = String.raw`(?:(?!<\/?` + contentTag + String.raw`\b)[\s\S])*`
  const anyContent = '<' + contentTag + String.raw`\b`
  const prose = '(?:(?<=' + contentOpen + insideContent + ')(?=' + insideContent + contentClose +
    String.raw`)|(?<!(?<![\s\S])[\s\S]*` + anyContent + String.raw`[\s\S]*)(?![\s\S]*` + anyContent + '))'

  function imagePattern(id) {
    const line = String.raw` {0,3}!\[[^\]\r\n]*\]\(okh-echo:` + escapeRegExp(id) + String.raw`\)[ \t]*`
    return new RegExp(start + '(?=' + line + end + ')' + outsideOpaque + prose + line + end, 'gm')
  }

  function commandLine(command) {
    return typeof command === 'string'
      ? command.trim().split(/\r?\n/, 1)[0].trim().replace(/^查看回忆\s*[:：]\s*/, '查看回忆：')
      : ''
  }

  const api = Object.freeze({ imagePattern, commandLine })
  root.OKH_APP_ECHO_FORMAT = api
  if (typeof module !== 'undefined' && module.exports) module.exports = api
})(globalThis)
