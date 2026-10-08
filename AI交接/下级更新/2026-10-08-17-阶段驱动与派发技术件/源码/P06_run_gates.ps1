# P06_run_gates.ps1 —— 只读门禁运行器（沙箱可用的那一路）
# 说明：本机沙箱禁止 Node 以管道 stdio 捕获子进程输出（child_process + stdio:'pipe' ⇒ EPERM），
#       所以 `P06_run_gates.mjs` 那一路在本机必然 exit=null、无输出。
#       改用 PowerShell 自身直接调用，逐条留档 exit code 与首尾输出。
# 刻意不跑：ship.js / build.js / deploy_to_tavern.cjs / _chk_all.mjs --full（这些会重写交付产物）。
$ErrorActionPreference = 'Continue'
$node = 'C:\Program Files\nodejs\node.exe'
$dir  = 'E:\角色卡制作\仙姝堕'
$out  = Join-Path $dir 'AI交接\下级更新\2026-10-08-17-阶段驱动与派发技术件\材料\17i_原始测试结果.txt'

$gates = @(
  @('tools/checks/_chk_syntax.mjs',            '卡内与构建脚本语法门禁'),
  @('tools/checks/_chk_form_gate.mjs',         '名器成形闸门（含自动派发/归属断言）'),
  @('tools/checks/_chk_relic_stage.mjs',       '名器阶段条（触发词收紧／阶段互斥）'),
  @('tools/checks/_chk_mingqi_prereq.mjs',     '名器成形硬前置'),
  @('tools/checks/_chk_ejs_stage.mjs',         '【阶段驱动】EJS 门控'),
  @('tools/checks/_chk_plot_gate.mjs',         '主线剧情闸门'),
  @('tools/checks/_chk_identity_sync.mjs',     '身份/专轨/大势离线仿真'),
  @('tools/checks/_chk_clock_acc.mjs',         '历时推进'),
  @('tools/checks/_chk_defect_four.mjs',       '四条状态缺陷负例'),
  @('tools/checks/_chk_panel_artifact.mjs',    'HUD 面板终产物规范断言'),
  @('tools/checks/_chk_anchor_gate.mjs',       '锚点提议闸门（不在 ship.js 名单里）')
)

$buf = New-Object System.Collections.Generic.List[string]
$buf.Add('仙姝堕 · 只读门禁原始输出（2026-10-08 · 第 17 批）')
$buf.Add('运行器：PowerShell 直调 node（每脚本一次独立进程）')
$buf.Add('未跑：ship.js / build.js / deploy_to_tavern.cjs / _chk_all.mjs --full（会重写交付产物）')
$buf.Add('=' * 78)

$sum = @()
foreach ($g in $gates) {
  $rel = $g[0]; $note = $g[1]
  $raw = & $node $rel 2>&1 | Out-String
  $code = $LASTEXITCODE
  $lines = $raw -split "`r?`n"
  $pass = ([regex]::Matches($raw, '✔')).Count
  $fail = ([regex]::Matches($raw, '✘')).Count
  $sum += ('{0}  exit={1}  ✔{2}  ✘{3}' -f $rel, $code, $pass, $fail)
  $buf.Add('')
  $buf.Add('### ' + $rel + '　—　' + $note)
  $buf.Add('exit code: ' + $code)
  $buf.Add('--- 首 4 行 ---')
  $buf.Add(($lines | Select-Object -First 4) -join "`n")
  $buf.Add('--- 末 16 行 ---')
  $buf.Add(($lines | Select-Object -Last 16) -join "`n")
}
$buf.Add('')
$buf.Add('=' * 78)
$buf.Add('汇总（✔/✘ 计数取自各脚本自身标记）')
$sum | ForEach-Object { $buf.Add($_) }
[IO.File]::WriteAllText($out, ($buf -join "`n"), (New-Object System.Text.UTF8Encoding($false)))
$sum
