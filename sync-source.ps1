param([Parameter(Mandatory=$true)][string]$Repository)
$ErrorActionPreference='Stop'
if ($Repository -notmatch '^[A-Za-z0-9-]+/[A-Za-z0-9._-]+$') { throw 'Use owner/repository' }
$utf8=New-Object System.Text.UTF8Encoding($false)
$temp=Join-Path ([IO.Path]::GetTempPath()) ('darkls-source-'+[guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $temp | Out-Null
function ApiJson {
 param([string]$Endpoint,[string]$Method='GET',$Body=$null)
 $request=Join-Path $temp 'request.json'
 if ($null -eq $Body) {
  $raw=& gh api $Endpoint
 } else {
  [IO.File]::WriteAllText($request,($Body|ConvertTo-Json -Depth 12 -Compress),$utf8)
  $raw=& gh api --method $Method $Endpoint --input $request
 }
 if ($LASTEXITCODE -ne 0) { throw "GitHub API failed: $Endpoint" }
 return ($raw -join "`n" | ConvertFrom-Json)
}
try {
 $meta=ApiJson -Endpoint "repos/$Repository"
 $branch=$meta.default_branch
 if (-not $branch) { throw 'Repository must have an initial commit' }
 $branchPath=[Uri]::EscapeDataString($branch)
 $ref=ApiJson -Endpoint "repos/$Repository/git/ref/heads/$branchPath"
 $head=$ref.object.sha
 $baseCommit=ApiJson -Endpoint "repos/$Repository/git/commits/$head"
 $source=Join-Path $temp 'source'
 Expand-Archive -LiteralPath (Join-Path $PSScriptRoot 'source.zip') -DestinationPath $source
 $entries=New-Object System.Collections.Generic.List[object]
 $files=@(Get-ChildItem -LiteralPath $source -Recurse -File)
 $count=0
 foreach ($file in $files) {
  $relative=$file.FullName.Substring($source.Length).TrimStart([char[]]'\/').Replace('\','/')
  if ($relative -match '(^|/)(\.git|__pycache__|data|runtime)(/|$)' -or $relative -match '\.(pyc|pyo)$') { continue }
  $count++
  Write-Host "Source $count/$($files.Count): $relative"
  $content=[Convert]::ToBase64String([IO.File]::ReadAllBytes($file.FullName))
  $blob=ApiJson -Endpoint "repos/$Repository/git/blobs" -Method POST -Body @{content=$content;encoding='base64'}
  $entries.Add(@{path=$relative;mode='100644';type='blob';sha=$blob.sha})
 }
 $tree=ApiJson -Endpoint "repos/$Repository/git/trees" -Method POST -Body @{base_tree=$baseCommit.tree.sha;tree=@($entries.ToArray())}
 if ($tree.sha -eq $baseCommit.tree.sha) {
  Write-Host 'Source is already up to date.'
  return $head
 }
 $version=(Get-Content -Raw (Join-Path $PSScriptRoot 'release.json') | ConvertFrom-Json).version
 $commit=ApiJson -Endpoint "repos/$Repository/git/commits" -Method POST -Body @{message="Publish native panel source $version";tree=$tree.sha;parents=@($head)}
 # Non-force update rejects concurrent changes rather than overwriting them.
 $null=ApiJson -Endpoint "repos/$Repository/git/refs/heads/$branchPath" -Method PATCH -Body @{sha=$commit.sha;force=$false}
 Write-Host "Source committed: $($commit.sha)"
 return $commit.sha
} finally {
 Remove-Item -LiteralPath $temp -Recurse -Force -ErrorAction SilentlyContinue
}
