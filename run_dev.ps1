# Load .env file manually
Get-Content .env | Where-Object { $_ -notmatch '^#' -and $_ -match '=' } | ForEach-Object {
    $parts = $_ -split '=', 2
    $key = $parts[0].Trim()
    $value = $parts[1].Trim()
    [System.Environment]::SetEnvironmentVariable($key, $value, "Process")
}

$env:NODE_ENV = "development"

# Run and capture output
$output = npx tsx server/index.ts 2>&1
$output | Out-File -FilePath "server_startup.log" -Encoding utf8
Write-Host "=== SERVER OUTPUT ==="
$output
