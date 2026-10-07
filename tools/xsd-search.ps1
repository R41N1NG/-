#requires -Version 5.1
<#
.SYNOPSIS
  《仙姝墮》（或任意 UTF-8 中文小说）关键词上下文查看器 —— 专为「名器使用场景」检索设计。

.DESCRIPTION
  启动时把原文切成「行 / 段 / 章」三级索引（只做一次），检索用二分查找定位；80 万字文本为秒级。
  每条命中都带【章名】与行号，便于回原文核对。

.PARAMETER Keyword
  一个或多个关键词；支持用 , ， | 分隔。默认任一命中（-Match Any）。

.PARAMETER Mode
  Char = 截取 ±Radius 字符（默认，适合快速扫）；Paragraph = 输出整段（看完整场景）；Chapter = 输出整章。

.EXAMPLE
  .\xsd-search.ps1 璎珞茶蕊
.EXAMPLE
  .\xsd-search.ps1 "璎珞茶蕊,茶蕊,紫金触须" -Radius 200 -Max 20
.EXAMPLE
  .\xsd-search.ps1 冰棱漩涡 -Mode Paragraph -Out 九幽_冰棱.txt
.EXAMPLE
  .\xsd-search.ps1 "璎珞,吮吸" -Match All -Mode Paragraph
.EXAMPLE
  .\xsd-search.ps1 -Preset xinmo -Mode Char -Radius 80
.EXAMPLE
  .\xsd-search.ps1 -ListPresets
#>
[CmdletBinding()]
param(
  [Parameter(Position = 0, ValueFromRemainingArguments = $true)]
  [string[]]$Keyword,

  [string]$File = 'E:\火狐下载\[仙姝墮] 1-49+番外 作者：_肉山佛.txt',

  [int]$Radius = 60,
  [ValidateSet('Char', 'Paragraph', 'Chapter')]
  [string]$Mode = 'Char',
  [ValidateSet('Any', 'All')]
  [string]$Match = 'Any',

  [int]$Max = 0,
  [int]$MaxChars = 4000,
  [switch]$NoChapter,
  [switch]$Count,
  [switch]$Regex,
  [switch]$IgnoreCase,
  [string]$Out,
  [string]$Preset,
  [switch]$ListPresets
)

$ErrorActionPreference = 'Stop'
$sw = [System.Diagnostics.Stopwatch]::StartNew()

# ---------------- 内置名器触发词表 ----------------
$PRESETS = [ordered]@{
  jiuyou  = @{ Title = '九幽玄阴穴（孤月）';      Words = @('九幽玄阴穴','九幽玄陰穴','冰棱漩涡','冰晶龙鳞','龍鱰','花宫冰莲','玄阴蜜汁','冰莲花苞','冰封极乐','幽蓝龙角') }
  zhuojiu = @{ Title = '灼酒流炎穴（叶红缨）';    Words = @('灼酒流炎穴','灼酒流炎','烈炎琼浆','炽白烈焰','邪欲凤翼','火凤道纹','酒泉') }
  xinmo   = @{ Title = '心魔茶璎乳（闻观语）';    Words = @('心魔茶璎乳','心魔茶树','璎珞茶蕊','璎珞乳浆','紫金触须','天魔金乳','邪心天目','千心一欲','天魔女') }
  boruo   = @{ Title = '般若菩提菊（楚灵夜）';    Words = @('般若菩提菊','菩提叶脉','菩提叶瓣','双穴互通','邪菩萨','孽莲') }
  beiming = @{ Title = '北冥潮生穴（雨霏柔）';    Words = @('北冥潮生穴','潮汐源涡','北冥玄津','北冥之海','鲲鹏道纹','溟鲲','归墟') }
  lingxi  = @{ Title = '灵犀同心穴（苏瑶·苏玲）'; Words = @('灵犀同心','同心异体','并蒂莲','日月道纹','阳蜜','阴蜜') }
  yuhu    = @{ Title = '玉虎噙香乳（云织梦）';    Words = @('玉虎噙香乳','月下蜜桃','桃纹炽乳','虎涎春潮','炽情桃蜜','初香玉露','玉虎镇渊阵') }
  bingxin = @{ Title = '冰心泪（孤月）';          Words = @('冰心泪','寒冰锁链','冰蓝晶石') }
  yanxia  = @{ Title = '烟霞灵乳（柳含烟）';      Words = @('烟霞灵乳','烟霞花蕊','烟霞蜜汁','幽昙花','昨日欢','蛇姬') }
  mingqi  = @{ Title = '通用名器语汇';            Words = @('名器','鼎炉','极乐引','名器榜','天姝榜','冰棱漩涡','媚肉','蜜汁','元阴','落红','沉沦') }
}

if ($ListPresets) {
  $PRESETS.GetEnumerator() | ForEach-Object { '{0,-8} {1}' -f $_.Key, $_.Value.Title }
  return
}
if ($Preset) {
  if (-not $PRESETS.Contains($Preset)) { throw "未知预设 '$Preset'；可用：$(($PRESETS.Keys) -join ', ')" }
  $Keyword = @($PRESETS[$Preset].Words)
}
if (-not $Keyword -or $Keyword.Count -eq 0) { throw "请提供关键词，例如：.\xsd-search.ps1 璎珞茶蕊  （-ListPresets 查看内置名器词表）" }

$words = @()
foreach ($k in $Keyword) { $words += ($k -split '[,，|]' | ForEach-Object { $_.Trim() } | Where-Object { $_ }) }
$words = @($words | Select-Object -Unique)

# ---------------- 读取原文 ----------------
if (-not (Test-Path -LiteralPath $File)) { throw "找不到文件：$File" }
$text = [System.IO.File]::ReadAllText((Resolve-Path -LiteralPath $File).Path, [System.Text.Encoding]::UTF8)
$L = $text.Length

# ---------------- 行索引 ----------------
$lineStarts = New-Object System.Collections.Generic.List[int]
$lineStarts.Add(0)
$i = $text.IndexOf("`n")
while ($i -ge 0) { $lineStarts.Add($i + 1); $i = $text.IndexOf("`n", $i + 1) }
$ls = $lineStarts.ToArray()

# ---------------- 段索引（连续非空行 = 一段） ----------------
$paraStarts = New-Object System.Collections.Generic.List[int]
$paraEnds = New-Object System.Collections.Generic.List[int]
$pStart = 0; $inPara = $false
foreach ($e in $ls) {
  $lineEnd = $text.IndexOf("`n", $e); if ($lineEnd -lt 0) { $lineEnd = $L }
  $seg = $text.Substring($e, $lineEnd - $e).Trim()
  if ($seg.Length -gt 0) { if (-not $inPara) { $pStart = $e; $inPara = $true } }
  elseif ($inPara) { $paraStarts.Add($pStart); $paraEnds.Add($e - 1); $inPara = $false }
}
if ($inPara) { $paraStarts.Add($pStart); $paraEnds.Add($L - 1) }
$ps = $paraStarts.ToArray(); $pe = $paraEnds.ToArray()

# ---------------- 章索引 ----------------
$chapterRx = [regex]'(?m)^[ 　\t]*(第[零一二三四五六七八九十百千0-9]+章[^\r\n]*|番外[^\r\n]*|尾声[^\r\n]*|后记[^\r\n]*|楔子[^\r\n]*|第[零一二三四五六七八九十百千0-9]+节[^\r\n]*)'
$chPos = New-Object System.Collections.Generic.List[int]
$chTitle = New-Object System.Collections.Generic.List[string]
foreach ($m in $chapterRx.Matches($text)) { $chPos.Add($m.Index); $chTitle.Add(($m.Value -replace '^[ 　\t]+', '').Trim()) }
$cp = $chPos.ToArray(); $ct = $chTitle.ToArray()

function Find-Index([int[]]$arr, [int]$pos) {  # 最后一个 <= pos 的下标，找不到返回 -1
  $lo = 0; $hi = $arr.Length - 1; $res = -1
  while ($lo -le $hi) { $mid = [int](($lo + $hi) / 2); if ($arr[$mid] -le $pos) { $res = $mid; $lo = $mid + 1 } else { $hi = $mid - 1 } }
  return $res
}
function Get-LineNo([int]$pos) { (Find-Index $ls $pos) + 1 }
function Get-ParaNo([int]$pos) { Find-Index $ps $pos }
function Get-ChapterTitle([int]$pos) {
  if ($NoChapter) { return '' }
  $k = Find-Index $cp $pos
  if ($k -lt 0) { return '' }
  return $ct[$k]
}

# ---------------- 检索 ----------------
$opts = [System.Text.RegularExpressions.RegexOptions]::None
if ($IgnoreCase) { $opts = $opts -bor [System.Text.RegularExpressions.RegexOptions]::IgnoreCase }

$hits = New-Object System.Collections.Generic.List[object]
$perWord = [ordered]@{}
foreach ($w in $words) {
  $pat = if ($Regex) { $w } else { [regex]::Escape($w) }
  $rx = [System.Text.RegularExpressions.Regex]::new($pat, $opts)
  $n = 0
  foreach ($m in $rx.Matches($text)) { $hits.Add([pscustomobject]@{ Word = $w; Pos = $m.Index; Len = $m.Length }); $n++ }
  $perWord[$w] = $n
}
$hits = @($hits | Sort-Object Pos, Word)

if ($Match -eq 'All') {
  $keep = New-Object System.Collections.Generic.List[object]
  foreach ($h in $hits) {
    $pn = Get-ParaNo $h.Pos
    if ($pn -lt 0) { continue }
    $found = $null
    foreach ($o in $keep) { if ($o.Para -eq $pn) { $found = $o; break } }
    if ($found) { $found.Words.Add($h.Word) | Out-Null }
    else {
      $ob = [pscustomobject]@{ Para = $pn; Pos = $h.Pos; Words = (New-Object System.Collections.Generic.List[string]) }
      $ob.Words.Add($h.Word) | Out-Null
      $keep.Add($ob)
    }
  }
  $tmp = New-Object System.Collections.Generic.List[object]
  foreach ($o in $keep) {
    if (($o.Words | Select-Object -Unique).Count -eq $words.Count) {
      $tmp.Add([pscustomobject]@{ Word = (($o.Words | Select-Object -Unique) -join '+'); Pos = $o.Pos; Len = 1 })
    }
  }
  $hits = @($tmp | Sort-Object Pos)
}

if ($Count) {
  "命中总数: $($hits.Count)"
  "关键词: $($words -join ' / ')    匹配: $Match    行数: $($ls.Length - 1)    段数: $($ps.Length)"
  ''
  foreach ($k in $perWord.Keys) { '  {0,-16} {1}' -f $k, $perWord[$k] }
  "耗时: $($sw.ElapsedMilliseconds) ms"
  return
}
if ($hits.Count -eq 0) { "未命中：$($words -join ' / ')（可试 -Regex / -IgnoreCase，或换关键词）"; return }

# ---------------- 渲染 ----------------
$sb = New-Object System.Text.StringBuilder
[void]$sb.AppendLine("# 关键词上下文检索：$($words -join ' / ')")
[void]$sb.AppendLine("# 原文：$File")
[void]$sb.AppendLine("# 模式：$Mode   匹配：$Match   半径：$Radius   命中：$($hits.Count)")
[void]$sb.AppendLine('')

$shown = 0
$seenPos = @{}
foreach ($h in $hits) {
  if ($Max -gt 0 -and $shown -ge $Max) { break }
  if ($seenPos.ContainsKey($h.Pos)) { continue }
  $seenPos[$h.Pos] = 1
  $shown++

  $lineNo = Get-LineNo $h.Pos
  $chap = Get-ChapterTitle $h.Pos
  $head = if ($chap) { "【$chap】第 $lineNo 行" } else { "第 $lineNo 行" }

  if ($Mode -eq 'Char') {
    $s = [Math]::Max(0, $h.Pos - $Radius)
    $e = [Math]::Min($L, $h.Pos + $h.Len + $Radius)
    $ctx = ($text.Substring($s, $e - $s) -replace '\s+', ' ').Trim()
    if ($s -gt 0) { $ctx = '…' + $ctx }
    if ($e -lt $L) { $ctx = $ctx + '…' }
  }
  elseif ($Mode -eq 'Paragraph') {
    $pn = Get-ParaNo $h.Pos
    if ($pn -ge 0) { $ctx = ($text.Substring($ps[$pn], $pe[$pn] - $ps[$pn] + 1) -replace '\s+', ' ').Trim() }
    else { $ctx = ($text.Substring($h.Pos, [Math]::Min(300, $L - $h.Pos)) -replace '\s+', ' ').Trim() }
  }
  else {
    $ci = Find-Index $cp $h.Pos
    if ($ci -ge 0) {
      $s = $cp[$ci]
      $e = if ($ci + 1 -lt $cp.Length) { $cp[$ci + 1] } else { $L }
      $ctx = $text.Substring($s, $e - $s).Trim()
    }
    else { $ctx = $text.Substring(0, [Math]::Min(3000, $L)).Trim() }
  }
  if ($ctx.Length -gt $MaxChars) { $ctx = $ctx.Substring(0, $MaxChars) + '…（已截断，用 -MaxChars 调整）' }

  [void]$sb.AppendLine("=== [$shown] $head ===")
  [void]$sb.AppendLine($ctx)
  [void]$sb.AppendLine('')
}

$result = $sb.ToString()
if ($Out) {
  $outPath = if ([System.IO.Path]::IsPathRooted($Out)) { $Out } else { Join-Path (Get-Location) $Out }
  [System.IO.File]::WriteAllText($outPath, $result, [System.Text.UTF8Encoding]::new($false))
  Write-Output "已写出：$outPath（$shown 条 / 共 $($hits.Count) 命中，$($sw.ElapsedMilliseconds) ms）"
} else {
  Write-Output $result
}
