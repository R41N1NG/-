param([string]$Chunk,[int[]]$Lines)
$f = "E:\角色卡制作\仙姝堕\_chunks\$Chunk.txt"
$arr = Get-Content $f -Encoding utf8
foreach ($L in $Lines) {
  $t = $arr[$L-1].Trim()
  if ($t.Length -gt 300) { $t = $t.Substring(0,300) + '…' }
  "{0} L{1}: {2}" -f $Chunk, $L, $t
}
