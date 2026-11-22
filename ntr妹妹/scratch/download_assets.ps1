$destDir = "E:\角色卡制作\ntr妹妹\assets\ui"
if (!(Test-Path $destDir)) { New-Item -ItemType Directory -Path $destDir -Force }

$downloads = @{
    "dark_parchment_bg.webp" = "https://raw.githubusercontent.com/naturalcrit/homebrewery/master/themes/assets/fluffy_background_dark.webp"
    "journal_bg_1.webp"       = "https://raw.githubusercontent.com/naturalcrit/homebrewery/master/themes/assets/Journal/Background1.webp"
    "journal_hr.png"         = "https://raw.githubusercontent.com/naturalcrit/homebrewery/master/themes/assets/Journal/HorizontalRule.png"
    "horizontal_rule.svg"    = "https://raw.githubusercontent.com/naturalcrit/homebrewery/master/themes/assets/horizontalRule.svg"
    "footer_accent.png"      = "https://raw.githubusercontent.com/naturalcrit/homebrewery/master/themes/assets/PHB_footerAccent.png"
    "journal_border_1.png"   = "https://raw.githubusercontent.com/naturalcrit/homebrewery/master/themes/assets/Journal/Border1.png"
    "parchment_bg.jpg"       = "https://raw.githubusercontent.com/naturalcrit/homebrewery/master/themes/assets/parchmentBackground.jpg"
}

foreach ($item in $downloads.GetEnumerator()) {
    $name = $item.Key
    $url = $item.Value
    $outPath = Join-Path $destDir $name
    Write-Host "Downloading $name from $url"
    try {
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        Invoke-WebRequest -Uri $url -OutFile $outPath -UserAgent "Mozilla/5.0"
        $sz = (Get-Item $outPath).Length
        Write-Host "Downloaded: $name ($sz bytes)"
    } catch {
        Write-Host "Error for $name : $($_.Exception.Message)"
    }
}
