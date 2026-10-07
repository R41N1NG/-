param([string]$Name,[int]$Max=22,[string]$Extra='')
$pat = [regex]::Escape($Name)
$files = Get-ChildItem "E:\角色卡制作\仙姝堕\_chunks\ch*.txt" | Sort-Object Name
$n = 0
foreach ($f in $files) {
  $lines = Get-Content $f.FullName -Encoding utf8
  for ($i=0; $i -lt $lines.Count; $i++) {
    $ln = $lines[$i]
    if ($ln -notmatch '“') { continue }
    if ($ln -match $pat) {
      $t = $ln.Trim()
      if ($t.Length -gt 260) { $t = $t.Substring(0,260) + '…' }
      "{0} L{1}: {2}" -f $f.BaseName, ($i+1), $t
      $n++
      if ($n -ge $Max) { break }
    }
  }
  if ($n -ge $Max) { break }
}
