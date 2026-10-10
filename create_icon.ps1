Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\HP\.gemini\antigravity-ide\brain\809f0dc4-3039-4ede-9a95-ed6741a11abf\retailhub_app_icon_1791393517082.jpg"
$dstPng = "d:\Asp.Net\Asp.Net_Api\Inventory Management system\client\icon.png"
$dstIco = "d:\Asp.Net\Asp.Net_Api\Inventory Management system\client\icon.ico"

$bmp = [System.Drawing.Bitmap]::new($srcPath)
$resized = [System.Drawing.Bitmap]::new(256, 256)
$g = [System.Drawing.Graphics]::FromImage($resized)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.DrawImage($bmp, 0, 0, 256, 256)
$g.Dispose()

$resized.Save($dstPng, [System.Drawing.Imaging.ImageFormat]::Png)

$ms = [System.IO.MemoryStream]::new()
$resized.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
$pngBytes = $ms.ToArray()
$ms.Dispose()

$icoFs = [System.IO.FileStream]::new($dstIco, [System.IO.FileMode]::Create)
$bw = [System.IO.BinaryWriter]::new($icoFs)

# ICONDIR header
$bw.Write([UInt16]0) # Reserved
$bw.Write([UInt16]1) # Type (1=Icon)
$bw.Write([UInt16]1) # Count (1 image)

# ICONDIRENTRY (16 bytes)
$bw.Write([Byte]0) # Width (0 = 256)
$bw.Write([Byte]0) # Height (0 = 256)
$bw.Write([Byte]0) # ColorCount
$bw.Write([Byte]0) # Reserved
$bw.Write([UInt16]1) # ColorPlanes
$bw.Write([UInt16]32) # BitsPerPixel
$bw.Write([UInt32]$pngBytes.Length) # ImageSize
$bw.Write([UInt32]22) # ImageOffset (6 + 16 = 22)

# PNG payload
$bw.Write($pngBytes)
$bw.Flush()
$bw.Close()
$icoFs.Close()
$bmp.Dispose()
$resized.Dispose()

# Create Windows Desktop Shortcut with custom icon
$wsh = New-Object -ComObject WScript.Shell
$shortcutPath = "C:\Users\HP\Desktop\RetailHub.lnk"
$shortcut = $wsh.CreateShortcut($shortcutPath)
$shortcut.TargetPath = "wscript.exe"
$shortcut.Arguments = "`"d:\Asp.Net\Asp.Net_Api\Inventory Management system\RetailHub-Silent.vbs`""
$shortcut.WorkingDirectory = "d:\Asp.Net\Asp.Net_Api\Inventory Management system\client"
$shortcut.IconLocation = "$dstIco, 0"
$shortcut.Description = "RetailHub POS - Inventory Management System"
$shortcut.Save()

# Also copy icon to public folder in client
Copy-Item $dstIco "d:\Asp.Net\Asp.Net_Api\Inventory Management system\client\public\favicon.ico" -Force

# Remove temporary .bat and .vbs from desktop
Remove-Item "C:\Users\HP\Desktop\RetailHub.vbs" -Force -ErrorAction SilentlyContinue
Remove-Item "C:\Users\HP\Desktop\RetailHub.bat" -Force -ErrorAction SilentlyContinue

Write-Host 'Success! Created RetailHub.lnk shortcut with custom icon on Desktop!'
