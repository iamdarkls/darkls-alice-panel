param(
 [Parameter(Mandatory=$true)][string]$Repository,
 [switch]$CreateRepository,
 [string]$AdbPath = "$env:USERPROFILE\Downloads\platform-tools\adb.exe",
 [string]$DeviceIp = '192.168.50.168'
)
$ErrorActionPreference='Stop'
Set-Location $PSScriptRoot
if ($Repository -notmatch '^[A-Za-z0-9-]+/[A-Za-z0-9._-]+$') { throw 'Use owner/repository' }
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) { throw 'Install GitHub CLI: winget install --id GitHub.cli --exact. Then reopen PowerShell.' }
& gh auth status
if ($LASTEXITCODE -ne 0) { throw 'Run gh auth login, then repeat.' }
$savedPreference=$ErrorActionPreference
try {
 $ErrorActionPreference='Continue'
 & gh repo view $Repository --json name 2>$null | Out-Null
} finally {
 $ErrorActionPreference=$savedPreference
}
if ($LASTEXITCODE -ne 0) {
 if (-not $CreateRepository) { throw 'Repository not accessible. To create a PUBLIC repository, use -CreateRepository.' }
 & gh repo create $Repository --public --description 'DARKLS Alice native panel for Mini 3 Pro'
 if ($LASTEXITCODE -ne 0) { throw 'Repository creation failed' }
 $readme=[Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes("# DARKLS Alice Panel`nNative panel for Mini 3 Pro. Full source and release notes are attached to Releases. Based on dimap/yandex-station-web (MIT).`n"))
 & gh api --method PUT "repos/$Repository/contents/README.md" -f 'message=Initialize panel update repository' -f "content=$readme" | Out-Null
 if ($LASTEXITCODE -ne 0) { throw 'Initial commit failed' }
}
$meta=Get-Content -Raw .\release.json | ConvertFrom-Json
$version=$meta.version
if ((Get-FileHash .\app.tar.gz -Algorithm SHA256).Hash.ToLowerInvariant() -ne $meta.sha256) { throw 'Application archive checksum mismatch' }
$sourceCommit=& .\sync-source.ps1 -Repository $Repository
if ($sourceCommit -notmatch '^[a-f0-9]{40}$') { throw 'Source commit was not confirmed' }
$notes=[IO.File]::ReadAllText((Join-Path $PSScriptRoot 'release-notes.txt'), [Text.Encoding]::UTF8)
$manifest=[ordered]@{schema=1;target='aarch64-linux-gnu';version=$version;min_python='3.14';url="https://github.com/$Repository/releases/download/v$version/app.tar.gz";sha256=$meta.sha256;size=$meta.size;notes=$notes;published=[DateTime]::UtcNow.ToString('o')}
$utf8=New-Object System.Text.UTF8Encoding($false)
$manifestJson=$manifest|ConvertTo-Json -Depth 5
if ([Text.Encoding]::UTF8.GetByteCount($manifestJson) -gt 65536) { throw 'Manifest exceeds 64 KiB. Release notes must be plain text.' }
[IO.File]::WriteAllText((Join-Path $PSScriptRoot 'update.json'),$manifestJson,$utf8)
# Never overwrite a published release silently. A reused version must be inspected manually.
& gh release create "v$version" --repo $Repository --target $sourceCommit --title "DARKLS Alice Panel $version" --notes-file .\release-notes.txt .\app.tar.gz .\update.json .\source.zip
if ($LASTEXITCODE -ne 0) { throw 'Release publication failed. Existing release/assets were not replaced.' }
$feed="https://github.com/$Repository/releases/latest/download/update.json"
Write-Host "Published. Panel update feed: $feed"
if (Test-Path -LiteralPath $AdbPath) {
 $ipObject=$null
 if (-not [Net.IPAddress]::TryParse($DeviceIp,[ref]$ipObject) -or $ipObject.AddressFamily -ne 'InterNetwork') { throw 'IPv4 required' }
 $task=[guid]::NewGuid().ToString('N')
 $local=Join-Path ([IO.Path]::GetTempPath()) "darkls-feed-$task.txt"
 $remote="/tmp/darkls-feed-$task.txt"
 [IO.File]::WriteAllText($local,$feed,$utf8)
 try {
  & $AdbPath connect "${DeviceIp}:5555"
  if ($LASTEXITCODE -ne 0) { throw 'ADB connect failed. Set the feed in panel manually.' }
  & $AdbPath -s "${DeviceIp}:5555" push $local $remote
  if ($LASTEXITCODE -ne 0) { throw 'Feed upload failed. Set it in panel manually.' }
  & $AdbPath -s "${DeviceIp}:5555" push .\configure-feed.py "$remote.py"
  if ($LASTEXITCODE -ne 0) { throw 'Configurator upload failed' }
  $result=& $AdbPath -s "${DeviceIp}:5555" shell "PYTHONPATH=/data/darkls-alice/current /data/darkls-alice/runtime/python/bin/python3 $remote.py $remote"
  $result | ForEach-Object { Write-Host $_ }
  if (-not ($result -match '^FEED_CONFIGURED\s*$')) { throw 'Feed not configured. Set the URL in the panel manually.' }
 } finally {
  Remove-Item -LiteralPath $local -Force -ErrorAction SilentlyContinue
  & $AdbPath -s "${DeviceIp}:5555" shell "rm -f $remote $remote.py" | Out-Null
 }
}
Write-Host 'Automatic installation stays OFF. Enable it in the Updates tab after the first successful check.'
