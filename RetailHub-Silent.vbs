Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "d:\Asp.Net\Asp.Net_Api\Inventory Management system\client"
WshShell.Run "cmd /c npm run electron", 0, False
