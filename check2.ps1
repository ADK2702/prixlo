$log = "$PSScriptRoot\check2.txt"
$env:PATH = "$env:USERPROFILE\scoop\shims;$env:PATH"

"=== CHECK2 $(Get-Date -Format 'HH:mm:ss') ===" | Out-File $log -Encoding ASCII

"SCOOP APPS:" | Out-File $log -Append -Encoding ASCII
if (Test-Path "$env:USERPROFILE\scoop\apps") {
    Get-ChildItem "$env:USERPROFILE\scoop\apps" -Name | Out-File $log -Append -Encoding ASCII
} else {
    "scoop apps NOT FOUND" | Out-File $log -Append -Encoding ASCII
}

"" | Out-File $log -Append -Encoding ASCII
"PSQL SEARCH:" | Out-File $log -Append -Encoding ASCII
Get-ChildItem "$env:USERPROFILE\scoop" -Recurse -Filter "psql.exe" -ErrorAction SilentlyContinue |
    Select-Object -ExpandProperty FullName | Out-File $log -Append -Encoding ASCII

"" | Out-File $log -Append -Encoding ASCII
"SCOOP LIST:" | Out-File $log -Append -Encoding ASCII
scoop list 2>&1 | Out-File $log -Append -Encoding ASCII

"=== END ===" | Out-File $log -Append -Encoding ASCII
