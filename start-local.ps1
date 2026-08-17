$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location -LiteralPath $projectRoot

Write-Host "ASA local clone: http://127.0.0.1:4173/"
Write-Host "Press Ctrl+C to stop the server."
python -m http.server 4173 --bind 127.0.0.1
