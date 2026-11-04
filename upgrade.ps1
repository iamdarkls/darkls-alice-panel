param(
 [string]$DeviceIp = '192.168.50.168',
 [string]$AdbPath = "$env:USERPROFILE\Downloads\platform-tools\adb.exe"
)
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
$ipObject=$null
if (-not [System.Net.IPAddress]::TryParse($DeviceIp,[ref]$ipObject) -or $ipObject.AddressFamily -ne 'InterNetwork') { throw 'IPv4 required' }
if (-not (Test-Path -LiteralPath $AdbPath)) { throw 'ADB not found' }
$serial="${DeviceIp}:5555"
function AdbRun([string[]]$Arguments) {
 & $AdbPath @Arguments
 if ($LASTEXITCODE -ne 0) { throw 'ADB command failed' }
}
AdbRun -Arguments @('connect',$serial)
$identity=& $AdbPath -s $serial shell id
if ($identity -notmatch 'uid=0\(') { throw 'Root required' }
$meta=Get-Content -Raw .\release.json | ConvertFrom-Json
if ((Get-FileHash .\app.tar.gz -Algorithm SHA256).Hash.ToLowerInvariant() -ne $meta.sha256) { throw 'Archive checksum mismatch' }
$stage='/tmp/darkls-upgrade-'+[guid]::NewGuid().ToString('N')
AdbRun -Arguments @('-s',$serial,'shell',"mkdir -p $stage && chmod 700 $stage")
foreach ($file in @('app.tar.gz','release.json','native_updates.py','native_features.py','upgrade-device.py')) {
 AdbRun -Arguments @('-s',$serial,'push',(Join-Path $PSScriptRoot $file),"$stage/$file")
}
# A secret backup is made before activating the update. Save it locally even on failure.
$output=& $AdbPath -s $serial shell "/data/darkls-alice/runtime/python/bin/python3 -u $stage/upgrade-device.py $stage"
$output | ForEach-Object { Write-Host $_ }
$matches=@($output | Select-String -Pattern '^BACKUP=(/tmp/darkls-panel-backups/alice-backup-[0-9]{8}-[0-9]{6}-[a-f0-9]{6}\.tar\.gz)\s*$')
if ($matches.Count -gt 0) {
 $remoteBackup=$matches[0].Matches[0].Groups[1].Value
 $backupDir=Join-Path $env:USERPROFILE 'Documents\DARKLS-Alice-Backups'
 New-Item -ItemType Directory -Force -Path $backupDir | Out-Null
 AdbRun -Arguments @('-s',$serial,'pull',$remoteBackup,(Join-Path $backupDir ($remoteBackup.Split('/')[-1])))
 Write-Host "Private backup saved to: $backupDir"
}
if (-not ($output -match '^NATIVE_UPGRADE_OK\s*$')) { throw "Upgrade did not report success. Stage: $stage" }
AdbRun -Arguments @('-s',$serial,'shell',"rm -rf $stage")
Write-Host "Open http://${DeviceIp}:8770/ and refresh the page. Existing panel password was preserved."
