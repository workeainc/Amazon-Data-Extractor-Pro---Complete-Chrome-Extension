# Amazon Data Extractor Pro - Icon Creator (PowerShell)
# Creates PNG icons for the Chrome extension

Add-Type -AssemblyName System.Drawing

function Create-Icon {
    param(
        [int]$Size,
        [string]$FileName
    )
    
    # Create a new bitmap
    $bitmap = New-Object System.Drawing.Bitmap($Size, $Size)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    
    # Set high quality rendering
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    
    # Calculate scaling factor
    $scale = $Size / 128
    
    # Background circle
    $brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 153, 0))
    $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(230, 137, 0), [int](4 * $scale))
    
    $margin = [int](4 * $scale)
    $graphics.FillEllipse($brush, $margin, $margin, $Size - 2 * $margin, $Size - 2 * $margin)
    $graphics.DrawEllipse($pen, $margin, $margin, $Size - 2 * $margin, $Size - 2 * $margin)
    
    # Amazon arrow (simplified)
    $arrowSize = [int](20 * $scale)
    $centerX = $Size / 2
    $centerY = $Size / 2
    
    $arrowBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $arrowPoints = @(
        [System.Drawing.Point]::new([int]($centerX - $arrowSize/2), [int]($centerY - $arrowSize/4)),
        [System.Drawing.Point]::new([int]($centerX + $arrowSize/2), [int]($centerY - $arrowSize/4)),
        [System.Drawing.Point]::new([int]($centerX + $arrowSize/2), [int]($centerY - $arrowSize/2)),
        [System.Drawing.Point]::new([int]($centerX + $arrowSize), [int]$centerY),
        [System.Drawing.Point]::new([int]($centerX + $arrowSize/2), [int]($centerY + $arrowSize/2)),
        [System.Drawing.Point]::new([int]($centerX + $arrowSize/2), [int]($centerY + $arrowSize/4)),
        [System.Drawing.Point]::new([int]($centerX - $arrowSize/2), [int]($centerY + $arrowSize/4))
    )
    
    $graphics.FillPolygon($arrowBrush, $arrowPoints)
    
    # Data extraction symbols (small squares)
    $squareSize = [int](8 * $scale)
    $squareBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    
    for ($i = 0; $i -lt 6; $i++) {
        $x = [int]((35 + $i * 10) * $scale)
        $y = [int](70 * $scale)
        $graphics.FillRectangle($squareBrush, $x, $y, $squareSize, $squareSize)
    }
    
    # Extraction lines
    $linePen = New-Object System.Drawing.Pen([System.Drawing.Color]::White, [int](2 * $scale))
    for ($i = 0; $i -lt 5; $i++) {
        $startX = [int]((35 + $i * 10) * $scale)
        $endX = [int]((45 + $i * 10) * $scale)
        $y = [int](78 * $scale)
        $graphics.DrawLine($linePen, $startX, $y, $endX, $y)
    }
    
    # Pro badge
    $badgeSize = [int](12 * $scale)
    $badgeX = [int](100 * $scale)
    $badgeY = [int](28 * $scale)
    $badgeBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(35, 47, 62))
    $graphics.FillEllipse($badgeBrush, $badgeX - $badgeSize, $badgeY - $badgeSize, 2 * $badgeSize, 2 * $badgeSize)
    
    # Add "P" text
    $fontSize = [int](10 * $scale)
    if ($fontSize -lt 8) { $fontSize = 8 }
    $font = New-Object System.Drawing.Font("Arial", $fontSize, [System.Drawing.FontStyle]::Bold)
    $textBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $textFormat = New-Object System.Drawing.StringFormat
    $textFormat.Alignment = [System.Drawing.StringAlignment]::Center
    $textFormat.LineAlignment = [System.Drawing.StringAlignment]::Center
    
    $graphics.DrawString("P", $font, $textBrush, $badgeX, $badgeY, $textFormat)
    
    # Save the image
    $bitmap.Save($FileName, [System.Drawing.Imaging.ImageFormat]::Png)
    
    # Cleanup
    $graphics.Dispose()
    $bitmap.Dispose()
    $brush.Dispose()
    $pen.Dispose()
    $arrowBrush.Dispose()
    $squareBrush.Dispose()
    $linePen.Dispose()
    $badgeBrush.Dispose()
    $font.Dispose()
    $textBrush.Dispose()
    $textFormat.Dispose()
    
    Write-Host "Created $FileName ($Size x $Size)"
}

# Create icons directory if it doesn't exist
if (!(Test-Path "icons")) {
    New-Item -ItemType Directory -Name "icons"
}

Write-Host "Creating Amazon Data Extractor Pro icons..."

# Create all required icon sizes
$sizes = @(16, 32, 48, 128)
foreach ($size in $sizes) {
    Create-Icon -Size $size -FileName "icons\icon$size.png"
}

Write-Host "`nAll icons created successfully!"
Write-Host "Icons saved in the 'icons' directory."
Write-Host "`nYou can now load the extension in Chrome!"
