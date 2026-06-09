$log = "$PSScriptRoot\finish3_log.txt"
$projDir = $PSScriptRoot
$pgBin = "$env:USERPROFILE\scoop\apps\postgresql\18.4\pgsql\bin"
$dataDir = "$env:USERPROFILE\pgdata"
$dbUser = "postgres"
$dbName = "epicerie"

"" | Out-File $log -Encoding ASCII

function Log($msg) {
    $ts = Get-Date -Format "HH:mm:ss"
    $line = "[$ts] $msg"
    $line | Out-File $log -Append -Encoding ASCII
    Write-Host $line
}

Log "=== FINISH_SETUP3 START ==="

# Free space check
$disk = Get-PSDrive C
Log "C: free space: $([math]::Round($disk.Free/1MB,0)) MB"

# ── 1. Start server using Start-Process (no pipe, no handle inheritance) ──
$statusOut = & "$pgBin\pg_ctl.exe" status -D $dataDir 2>&1
$statusStr = $statusOut -join " "
Log "PG status: $statusStr"

if ($statusStr -notmatch "server is running") {
    Log "Starting server (Start-Process, no pipe)..."
    $pgLog = "$dataDir\pg.log"
    # Use Start-Process -Wait so PowerShell blocks until pg_ctl returns,
    # but WITHOUT creating any stdout/stderr pipes (no 2>&1, no -RedirectStd*)
    # postgres output goes to $pgLog via -l flag, preventing handle inheritance deadlock
    $p = Start-Process -FilePath "$pgBin\pg_ctl.exe" `
        -ArgumentList @("start", "-D", $dataDir, "-l", $pgLog, "-w", "-t", "60") `
        -NoNewWindow -Wait -PassThru
    Log "pg_ctl start exit code: $($p.ExitCode)"

    # Re-check status
    $status2 = & "$pgBin\pg_ctl.exe" status -D $dataDir 2>&1
    Log "Status after start: $($status2 -join ' ')"

    if ($p.ExitCode -ne 0) {
        Log "pg_ctl failed. Last 20 lines of pg.log:"
        if (Test-Path $pgLog) {
            Get-Content $pgLog -Tail 20 | ForEach-Object { Log "  $_" }
        }
        exit 1
    }
} else {
    Log "Server already running."
}

# ── 2. Create database ────────────────────────────────────────────
Log "Creating database '$dbName' ..."
$createOut = & "$pgBin\createdb.exe" -U $dbUser $dbName 2>&1
if ($createOut) {
    Log "  createdb: $($createOut -join ' ')"
} else {
    Log "  Database created OK"
}

# ── 3. Apply schema ───────────────────────────────────────────────
Log "Applying schema.sql ..."
$schemaFile = "$projDir\schema.sql"
if (-not (Test-Path $schemaFile)) { Log "ERROR: schema.sql not found at $schemaFile"; exit 1 }
$schemaOut = & "$pgBin\psql.exe" -U $dbUser -d $dbName -f $schemaFile 2>&1
$schemaOut | ForEach-Object { Log "  schema: $_" }

# ── 4. Verify ────────────────────────────────────────────────────
Log "Verifying tables..."
$verOut = & "$pgBin\psql.exe" -U $dbUser -d $dbName -c "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename;" 2>&1
$verOut | ForEach-Object { Log "  $_" }

# ── 5. Python deps ────────────────────────────────────────────────
Log "Installing Python deps (psycopg2-binary, python-dotenv)..."
$pipOut = & python -m pip install psycopg2-binary python-dotenv --break-system-packages -q 2>&1
$pipOut | ForEach-Object { Log "  pip: $_" }

# ── 6. Import data ────────────────────────────────────────────────
Log "Running import_db.py ..."
$env:DATABASE_URL = "postgresql://${dbUser}@localhost:5432/${dbName}"
$importOut = & python "$projDir\import_db.py" 2>&1
$importOut | ForEach-Object { Log "  import: $_" }

if ($LASTEXITCODE -eq 0) {
    Log "=== SUCCESS - All done! ==="
} else {
    Log "=== import_db.py exited with code $LASTEXITCODE - check log above ==="
}
