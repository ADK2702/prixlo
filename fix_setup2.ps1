$log = "$PSScriptRoot\fix2_log.txt"
$projDir = $PSScriptRoot
$zipPath = "$env:USERPROFILE\scoop\apps\postgresql\18.4\postgresql-18.4-1-windows-x64-binaries.zip"
$pgBase = "$env:USERPROFILE\scoop\apps\postgresql\18.4"
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

Log "=== FIX_SETUP2 START ==="

$disk = Get-PSDrive C
$freeMB = [math]::Round($disk.Free / 1MB, 0)
Log "C: free space: $freeMB MB"

# ── Step 1: Selective extraction (skip pgAdmin4, doc, symbols) ──
$psqlExe = Get-ChildItem $pgBase -Recurse -Filter "psql.exe" -ErrorAction SilentlyContinue | Select-Object -First 1

if ($psqlExe) {
    Log "psql.exe already present: $($psqlExe.FullName)"
    $pgBin = $psqlExe.DirectoryName
} else {
    if (-not (Test-Path $zipPath)) {
        Log "ERROR: Zip not found at $zipPath"
        exit 1
    }

    $zipSizeMB = [math]::Round((Get-Item $zipPath).Length / 1MB, 0)
    Log "Starting SELECTIVE extraction of $zipSizeMB MB zip (skipping pgAdmin4/doc/symbols)..."
    Log "This may take a few minutes..."

    Add-Type -AssemblyName System.IO.Compression.FileSystem

    # Prefixes to SKIP
    $skipPrefixes = @(
        "pgsql/pgAdmin 4/",
        "pgsql/pgAdmin4/",
        "pgsql/symbols/",
        "pgsql/doc/",
        "pgsql/installer/",
        "pgsql/include/"
    )

    $extracted = 0
    $skipped = 0

    try {
        $zip = [System.IO.Compression.ZipFile]::OpenRead($zipPath)
        foreach ($entry in $zip.Entries) {
            $name = $entry.FullName

            $skip = $false
            foreach ($prefix in $skipPrefixes) {
                if ($name.StartsWith($prefix, [System.StringComparison]::OrdinalIgnoreCase)) {
                    $skip = $true
                    break
                }
            }

            if ($skip) {
                $skipped++
                continue
            }

            # Build destination path
            $destRel = $name.Replace("/", "\")
            $dest = Join-Path $pgBase $destRel

            if ($name.EndsWith("/")) {
                # Directory
                New-Item -ItemType Directory -Path $dest -Force -ErrorAction SilentlyContinue | Out-Null
            } else {
                # File
                $destDir = Split-Path $dest
                New-Item -ItemType Directory -Path $destDir -Force -ErrorAction SilentlyContinue | Out-Null
                $stream = $null
                try {
                    $entryStream = $entry.Open()
                    $stream = [System.IO.File]::Create($dest)
                    $entryStream.CopyTo($stream)
                } finally {
                    if ($stream) { $stream.Dispose() }
                }
                $extracted++
            }

            if ($extracted % 100 -eq 0 -and $extracted -gt 0) {
                $disk2 = Get-PSDrive C
                $freeNow = [math]::Round($disk2.Free / 1MB, 0)
                Log "  Extracted $extracted files, free space: $freeNow MB"
            }
        }
        $zip.Dispose()
        Log "Selective extraction complete: $extracted files extracted, $skipped files skipped"
    } catch {
        Log "Extraction error: $($_.Exception.Message)"
        if ($zip) { $zip.Dispose() }
        exit 1
    }

    # Delete zip to recover space
    Log "Removing zip to reclaim $zipSizeMB MB..."
    Remove-Item $zipPath -Force
    $disk = Get-PSDrive C
    Log "C: free after zip removal: $([math]::Round($disk.Free/1MB,0)) MB"

    # Find psql.exe
    $psqlExe = Get-ChildItem $pgBase -Recurse -Filter "psql.exe" -ErrorAction SilentlyContinue | Select-Object -First 1
    if (-not $psqlExe) {
        Log "ERROR: psql.exe still not found after extraction"
        exit 1
    }
    Log "psql.exe found at: $($psqlExe.FullName)"
    $pgBin = $psqlExe.DirectoryName
}

Log "Using pgBin: $pgBin"

# ── Step 2: initdb ────────────────────────────────────────────────
if (-not (Test-Path "$dataDir\PG_VERSION")) {
    Log "Initializing cluster at $dataDir ..."
    & "$pgBin\initdb.exe" -D $dataDir -U $dbUser -A trust --encoding=UTF8 2>&1 | ForEach-Object { Log "  $_" }
    if ($LASTEXITCODE -ne 0) { Log "ERROR: initdb failed"; exit 1 }
    Log "initdb OK"
} else {
    Log "Cluster already exists"
}

# ── Step 3: Start server ─────────────────────────────────────────
Log "Starting PostgreSQL server..."
& "$pgBin\pg_ctl.exe" start -D $dataDir -w -t 60 2>&1 | ForEach-Object { Log "  $_" }

$status = & "$pgBin\pg_ctl.exe" status -D $dataDir 2>&1
Log "Status: $($status -join ' ')"

# ── Step 4: Create DB ─────────────────────────────────────────────
Log "Creating database $dbName ..."
& "$pgBin\createdb.exe" -U $dbUser $dbName 2>&1 | ForEach-Object { Log "  $_" }

# ── Step 5: Apply schema ──────────────────────────────────────────
Log "Applying schema.sql ..."
& "$pgBin\psql.exe" -U $dbUser -d $dbName -f "$projDir\schema.sql" 2>&1 | ForEach-Object { Log "  $_" }

# ── Step 6: Python deps ───────────────────────────────────────────
Log "Installing Python deps ..."
python -m pip install psycopg2-binary python-dotenv --break-system-packages -q 2>&1 | ForEach-Object { Log "  $_" }

# ── Step 7: Import ────────────────────────────────────────────────
Log "Running import_db.py ..."
$env:DATABASE_URL = "postgresql://${dbUser}@localhost:5432/${dbName}"
python "$projDir\import_db.py" 2>&1 | ForEach-Object { Log "  $_" }

if ($LASTEXITCODE -eq 0) {
    Log "=== SUCCESS ==="
} else {
    Log "=== Check output above ==="
}
