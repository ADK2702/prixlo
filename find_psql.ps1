$log = "$PSScriptRoot\find_psql.txt"

"=== FIND PSQL $(Get-Date -Format 'HH:mm:ss') ===" | Out-File $log -Encoding ASCII

# Full search in scoop postgresql dir
"SEARCHING in scoop\apps\postgresql:" | Out-File $log -Append -Encoding ASCII
if (Test-Path "$env:USERPROFILE\scoop\apps\postgresql") {
    Get-ChildItem "$env:USERPROFILE\scoop\apps\postgresql" -Recurse -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -match 'psql|postgres|pg_ctl|initdb' } |
        Select-Object FullName | Out-File $log -Append -Encoding ASCII
} else {
    "Directory not found!" | Out-File $log -Append -Encoding ASCII
}

"" | Out-File $log -Append -Encoding ASCII
"TOP-LEVEL DIRS in scoop\apps\postgresql:" | Out-File $log -Append -Encoding ASCII
if (Test-Path "$env:USERPROFILE\scoop\apps\postgresql") {
    Get-ChildItem "$env:USERPROFILE\scoop\apps\postgresql" |
        Select-Object Name, LastWriteTime | Out-File $log -Append -Encoding ASCII
}

"" | Out-File $log -Append -Encoding ASCII
"LAST 50 LINES OF ps_install.log:" | Out-File $log -Append -Encoding ASCII
try {
    $ps = Get-Content "$PSScriptRoot\ps_install.log" -Encoding Unicode -ErrorAction Stop
    $ps | Select-Object -Last 50 | Out-File $log -Append -Encoding ASCII
} catch {
    "Error reading: $($_.Exception.Message)" | Out-File $log -Append -Encoding ASCII
}

"=== END ===" | Out-File $log -Append -Encoding ASCII
