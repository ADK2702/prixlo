$log = "$PSScriptRoot\finish_log.txt"
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

Log "=== FINISH_SETUP START ==="

# ── 1. Ensure server is running ───────────────────────────────────
# Use variable capture (NOT pipeline) to avoid deadlock with spawned postgres process
$statusOut = & "$pgBin\pg_ctl.exe" status -D $dataDir 2>&1
$statusStr = $statusOut -join " "
Log "PG status: $statusStr"

if ($statusStr -notmatch "server is running") {
    Log "Server not running, starting..."
    # IMPORTANT: capture to variable, NOT pipeline, to avoid stdout handle inheritance deadlock
    $startOut = & "$pgBin\pg_ctl.exe" start -D $dataDir -w -t 60 2>&1
    Log "Start result: $($startOut -join ' | ')"
} else {
    Log "Server already running."
}

# ── 2. Create database ────────────────────────────────────────────
Log "Creating database $dbName ..."
$createOut = & "$pgBin\createdb.exe" -U $dbUser $dbName 2>&1
if ($createOut) {
    Log "  createdb: $($createOut -join ' ')"
} else {
    Log "  Database created (or already exists)"
}

# ── 3. Apply schema ───────────────────────────────────────────────
Log "Applying schema.sql ..."
$schemaOut = & "$pgBin\psql.exe" -U $dbUser -d $dbName -f "$projDir\schema.sql" 2>&1
$schemaOut | ForEach-Object { Log "  $_" }

# ── 4. Verify connection ──────────────────────────────────────────
Log "Verifying DB connection..."
$verifyOut = & "$pgBin\psql.exe" -U $dbUser -d $dbName -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';" 2>&1
$verifyOut | ForEach-Object { Log "  $_" }

# ── 5. Python deps ────────────────────────────────────────────────
Log "Installing Python deps..."
$pipOut = & python -m pip install psycopg2-binary python-dotenv --break-system-packages -q 2>&1
$pipOut | ForEach-Object { Log "  $_" }

# ── 6. Import data ────────────────────────────────────────────────
Log "Running import_db.py ..."
$env:DATABASE_URL = "postgresql://${dbUser}@localhost:5432/${dbName}"
$importOut = & python "$projDir\import_db.py" 2>&1
$importOut | ForEach-Object { Log "  $_" }

Log "=== FINISH_SETUP DONE ==="
