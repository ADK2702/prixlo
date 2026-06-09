$log = "$PSScriptRoot\fix_log.txt"
$projDir = $PSScriptRoot
$zipPath = "$env:USERPROFILE\scoop\apps\postgresql\18.4\postgresql-18.4-1-windows-x64-binaries.zip"
$pgBase = "$env:USERPROFILE\scoop\apps\postgresql\18.4"
$dataDir = "$env:USERPROFILE\pgdata"
$dbUser = "postgres"
$dbName = "epicerie"

"" | Out-File $log -Encoding ASCII  # reset

function Log($msg) {
    $ts = Get-Date -Format "HH:mm:ss"
    $line = "[$ts] $msg"
    $line | Out-File $log -Append -Encoding ASCII
    Write-Host $line
}

Log "=== FIX_SETUP START ==="

# ── 1. Disk space check ──────────────────────────────────────────
$disk = Get-PSDrive C
$freeMB = [math]::Round($disk.Free / 1MB, 0)
Log "C: free space before cleanup: $freeMB MB"

# ── 2. Aggressive cleanup to free space ─────────────────────────
Log "Cleaning up to free disk space..."

# Delete old CSV files (keep ONLY the latest canada_flipp_*.csv)
$csvFiles = Get-ChildItem $projDir -Filter "canada_flipp_*.csv" | Sort-Object Name
if ($csvFiles.Count -gt 1) {
    $csvFiles | Select-Object -SkipLast 1 | ForEach-Object {
        $sz = [math]::Round($_.Length / 1MB, 1)
        Log "  Deleting old CSV: $($_.Name) ($sz MB)"
        Remove-Item $_.FullName -Force
    }
}

# Delete old JSON summaries (keep only latest)
$jsonFiles = Get-ChildItem $projDir -Filter "canada_summary_*.json" | Sort-Object Name
if ($jsonFiles.Count -gt 1) {
    $jsonFiles | Select-Object -SkipLast 1 | ForEach-Object {
        $sz = [math]::Round($_.Length / 1MB, 1)
        Log "  Deleting old summary JSON: $($_.Name) ($sz MB)"
        Remove-Item $_.FullName -Force
    }
}

# Delete large log/result files
@(
    "ps_install.log",
    "flipp_result.json",
    "items_result.json",
    "diag_result.txt",
    "check2.txt",
    "find_psql.txt",
    "fix_log.txt"  # will be recreated
) | ForEach-Object {
    $p = Join-Path $projDir $_
    if (Test-Path $p) {
        $sz = [math]::Round((Get-Item $p).Length / 1MB, 2)
        Log "  Deleting: $_ ($sz MB)"
        Remove-Item $p -Force -ErrorAction SilentlyContinue
    }
}

# Also clean scoop cache
$scoopCache = "$env:USERPROFILE\scoop\cache"
if (Test-Path $scoopCache) {
    $cacheSize = [math]::Round((Get-ChildItem $scoopCache -Recurse | Measure-Object Length -Sum).Sum / 1MB, 0)
    if ($cacheSize -gt 10) {
        Log "  Clearing scoop cache ($cacheSize MB)..."
        Get-ChildItem $scoopCache | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
    }
}

$disk = Get-PSDrive C
$freeMB = [math]::Round($disk.Free / 1MB, 0)
Log "C: free space after cleanup: $freeMB MB"

if ($freeMB -lt 600) {
    Log "ERROR: Still insufficient space ($freeMB MB free, need ~750 MB). Aborting."
    exit 1
}

# ── 3. Extract zip if psql not found ────────────────────────────
$psqlExe = $null
$found = Get-ChildItem $pgBase -Recurse -Filter "psql.exe" -ErrorAction SilentlyContinue | Select-Object -First 1
if ($found) {
    $psqlExe = $found.FullName
    Log "psql.exe already extracted at: $psqlExe"
} else {
    if (-not (Test-Path $zipPath)) {
        Log "ERROR: Zip not found at $zipPath"
        exit 1
    }
    $zipSizeMB = [math]::Round((Get-Item $zipPath).Length / 1MB, 0)
    Log "Extracting $zipSizeMB MB zip to $pgBase ..."

    Add-Type -AssemblyName System.IO.Compression.FileSystem
    try {
        [System.IO.Compression.ZipFile]::ExtractToDirectory($zipPath, $pgBase)
        Log "Extraction complete."
    } catch {
        Log "Extraction failed: $($_.Exception.Message)"
        exit 1
    }

    # Now find psql.exe
    $found = Get-ChildItem $pgBase -Recurse -Filter "psql.exe" -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($found) {
        $psqlExe = $found.FullName
        Log "psql.exe found at: $psqlExe"
    } else {
        Log "ERROR: psql.exe not found after extraction"
        exit 1
    }

    # Delete zip to reclaim space
    Log "Deleting zip to reclaim $zipSizeMB MB..."
    Remove-Item $zipPath -Force
    $disk = Get-PSDrive C
    Log "C: free after zip removal: $([math]::Round($disk.Free/1MB,0)) MB"
}

$pgBin = Split-Path $psqlExe
Log "Using pgBin: $pgBin"

# ── 4. Init cluster ──────────────────────────────────────────────
if (-not (Test-Path "$dataDir\PG_VERSION")) {
    Log "Initializing PostgreSQL cluster at $dataDir ..."
    $initOut = & "$pgBin\initdb.exe" -D $dataDir -U $dbUser -A trust --encoding=UTF8 2>&1
    $initOut | ForEach-Object { Log "  $_" }
    if ($LASTEXITCODE -ne 0) { Log "ERROR: initdb failed!"; exit 1 }
    Log "initdb OK"
} else {
    Log "Cluster already exists at $dataDir"
}

# ── 5. Start server ──────────────────────────────────────────────
Log "Starting PostgreSQL server..."
$startOut = & "$pgBin\pg_ctl.exe" start -D $dataDir -w -t 60 2>&1
$startOut | ForEach-Object { Log "  $_" }

# Check if running
$status = & "$pgBin\pg_ctl.exe" status -D $dataDir 2>&1
Log "Server status: $($status -join ' ')"

# ── 6. Create database ───────────────────────────────────────────
Log "Creating database $dbName ..."
$createOut = & "$pgBin\createdb.exe" -U $dbUser $dbName 2>&1
$createOut | ForEach-Object { Log "  $_" }
# ignore "already exists"

# ── 7. Apply schema ──────────────────────────────────────────────
Log "Applying schema.sql ..."
$schemaOut = & "$pgBin\psql.exe" -U $dbUser -d $dbName -f "$projDir\schema.sql" 2>&1
$schemaOut | ForEach-Object { Log "  $_" }

# ── 8. Python deps ───────────────────────────────────────────────
Log "Installing Python deps ..."
$pipOut = python -m pip install psycopg2-binary python-dotenv --break-system-packages -q 2>&1
$pipOut | ForEach-Object { Log "  $_" }

# ── 9. Import data ───────────────────────────────────────────────
Log "Running import_db.py ..."
$env:DATABASE_URL = "postgresql://${dbUser}@localhost:5432/${dbName}"
$importOut = python "$projDir\import_db.py" 2>&1
$importOut | ForEach-Object { Log "  $_" }

if ($LASTEXITCODE -eq 0) {
    Log "=== SUCCESS: Import complete! ==="
} else {
    Log "=== Import may have issues, check output above ==="
}
