$ErrorActionPreference = "Stop"

$workspaceRoot = Get-Location
$sourceDir = Join-Path $workspaceRoot "apps\extension"
$releaseDir = Join-Path $workspaceRoot "release"
$targetDir = Join-Path $releaseDir "nono-v1"
$zipFile = Join-Path $releaseDir "nono-extension.zip"

Write-Host "Packaging NONO Extension..."

# Clean up
if (Test-Path $releaseDir) {
    Remove-Item $releaseDir -Recurse -Force
}
New-Item -ItemType Directory -Force -Path $targetDir | Out-Null

# Copy Files
Copy-Item "$sourceDir\*" -Destination $targetDir -Recurse

Write-Host "Extension files copied to: $targetDir"

# Create Zip
Compress-Archive -Path "$targetDir\*" -DestinationPath $zipFile -Force

Write-Host "Created Zip file: $zipFile"
Write-Host ""
Write-Host "DONE! Give the user the '$zipFile' file or the folder."
