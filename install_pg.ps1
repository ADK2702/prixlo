$ErrorActionPreference = 'Continue'
$log = "$PSScriptRoot\ps_install.log"

$env:PATH = "$env:USERPROFILE\scoop\shims;$env:PATH"

"=== INSTALL PostgreSQL via Scoop ===" | Out-File $log -Encoding UTF8
"Date: $(Get-Date)" | Out-File $log -Append

# Scoop version
"" | Out-File $log -Append
"[scoop --version]" | Out-File $log -Append
try {
    scoop --version 2>&1 | Out-File $log -Append
} catch {
    "ERROR: $($_.Exception.Message)" | Out-File $log -Append
}

# Install postgresql
"" | Out-File $log -Append
"[scoop install postgresql]" | Out-File $log -Append
try {
    scoop install postgresql 2>&1 | Out-File $log -Append
    "Exit code: $LASTEXITCODE" | Out-File $log -Append
} catch {
    "ERROR: $($_.Exception.Message)" | Out-File $log -Append
}

# Check result
"" | Out-File $log -Append
"[check psql]" | Out-File $log -Append
$psqlPath = "$env:USERPROFILE\scoop\apps\postgresql\current\bin\psql.exe"
if (Test-Path $psqlPath) {
    "SUCCESS: psql found at $psqlPath" | Out-File $log -Append
} else {
    "FAILED: psql not found at expected path" | Out-File $log -Append
    "" | Out-File $log -Append
    "Scoop apps installed:" | Out-File $log -Append
    if (Test-Path "$env:USERPROFILE\scoop\apps") {
        Get-ChildItem "$env:USERPROFILE\scoop\apps" -Name | Out-File $log -Append
    } else {
        "scoop\apps directory not found!" | Out-File $log -Append
    }

    "" | Out-File $log -Append
    "Trying 'scoop list':" | Out-File $log -Append
    scoop list 2>&1 | Out-File $log -Append
}

"" | Out-File $log -Append
"=== DONE $(Get-Date) ===" | Out-File $log -Append
