param(
    [string]$Device = "192.168.50.168:5555",
    [string]$Model = "mini3pro",
    [int]$Port = 8770
)
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
$env:PYTHONUTF8 = "1"
$env:PYTHONIOENCODING = "utf-8"
if (-not $env:ADB -or -not (Test-Path $env:ADB)) {
    $candidates = @(
        "$PSScriptRoot\platform-tools\adb.exe",
        "$env:USERPROFILE\Downloads\platform-tools\adb.exe",
        "$env:USERPROFILE\Downloads\dimap-panel\runtime\platform-tools\adb.exe"
    )
    $found = $candidates | Where-Object { Test-Path $_ } | Select-Object -First 1
    if ($found) { $env:ADB = $found }
}
$ffmpegDirs = @(
    "$PSScriptRoot\runtime\ffmpeg\bin",
    "$env:USERPROFILE\Downloads\dimap-panel\runtime\ffmpeg\bin",
    "$env:USERPROFILE\Downloads\dimap-panel"
)
foreach ($dir in $ffmpegDirs) {
    if (Test-Path "$dir\ffmpeg.exe") { $env:Path = "$dir;$env:Path" }
}
$arguments = @("-u", "$PSScriptRoot\darkls.py", "--device", $Device, "--model", $Model,
               "--port", "$Port", "--https-port", "0", "--open")
# Use the installed Python launcher, not the Windows Store python alias.
if (Get-Command py -ErrorAction SilentlyContinue) {
    & py -3 @arguments
} elseif (Test-Path "$PSScriptRoot\runtime\python\python.exe") {
    & "$PSScriptRoot\runtime\python\python.exe" @arguments
} else {
    throw "Python is required. Install Python 3.13+ from python.org."
}
exit $LASTEXITCODE
