$ErrorActionPreference = 'Stop'
Set-Location (Join-Path $PSScriptRoot 'backend')
if (Get-Command mvn -ErrorAction SilentlyContinue) {
  mvn spring-boot:run
} else {
  Write-Error 'Maven was not found. Install Maven 3.9+ or add mvn to PATH, then run this script again.'
}
