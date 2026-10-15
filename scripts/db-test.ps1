#!/usr/bin/env pwsh
<#
.SYNOPSIS
  Applies every migration + seed to a clean Postgres, then runs the SQL suites
  in supabase/tests.

.DESCRIPTION
  Each suite is expected to end with a "=== RESULT: ... ===" line and to raise
  nothing. A suite fails if psql reports an ERROR, or if its RESULT line reports
  a regression.

  By default the script talks to a local Docker container (-Container). Pass
  -Direct to run psql against a Postgres already reachable over the network
  (PGHOST/PGPORT/PGUSER/PGPASSWORD) — that is how CI runs it, so there is a
  single source of truth instead of a bash copy that drifts.

  Pass -Suite <name> to run a single suite. Pass -NoReset to keep the existing
  database (suites are self-cleaning, so a second run should still pass).

.EXAMPLE
  pwsh scripts/db-test.ps1
  pwsh scripts/db-test.ps1 -Suite order-lifecycle -NoReset
  pwsh scripts/db-test.ps1 -Direct          # CI: honours PGHOST/PGPORT
#>
[CmdletBinding()]
param(
  [string] $Container = 'hamyar-pg',
  [string[]] $Suite,
  [switch] $NoReset,
  [switch] $Direct
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot

function Invoke-Psql {
  param([string] $File, [string[]] $Args = @())

  if ($Direct) {
    # CI: no container, psql is on the runner and PG* vars come from the env.
    & psql @Args -f $File 2>&1
    return
  }

  # Local dev: the SQL lives inside the container, so copy it in first.
  $name = [System.IO.Path]::GetFileName($File)
  docker cp $File "${Container}:/tmp/$name" 2>&1 | Out-Null
  docker exec $Container psql -U postgres @Args -f "/tmp/$name" 2>&1
}

# `-c 'drop schema …'` does not go through a file, so it needs its own path.
function Invoke-PsqlCommand {
  param([string] $Sql)
  if ($Direct) {
    & psql -v ON_ERROR_STOP=1 -c $Sql 2>&1
    return
  }
  docker exec $Container psql -U postgres -v ON_ERROR_STOP=1 -c $Sql 2>&1
}

function Stop-WithError {
  param([string] $What, [string] $Output)
  $first = (($Output -split "`n") | Where-Object { $_ -match 'ERROR' } | Select-Object -First 1)
  if ($first) {
    Write-Host "FAIL ${What}: $($first.Trim())" -ForegroundColor Red
    exit 1
  }
}

$suites = if ($Suite) { $Suite } else {
  (Get-ChildItem (Join-Path $root 'supabase/tests') -Filter '*.sql' | Sort-Object Name).BaseName
}

if (-not $NoReset) {
  Write-Host '=== RESET ===' -ForegroundColor Cyan
  Stop-WithError 'storage reset' (Invoke-Psql (Join-Path $root 'scripts/db/00-reset-storage.sql') @('-v', 'ON_ERROR_STOP=1', '-q') | Out-String)
  Stop-WithError 'storage bootstrap' (Invoke-Psql (Join-Path $root 'scripts/db/00-storage-bootstrap.sql') @('-v', 'ON_ERROR_STOP=1', '-q') | Out-String)
  Stop-WithError 'schema reset' (Invoke-PsqlCommand 'drop schema public cascade; create schema public; grant all on schema public to postgres; grant usage on schema public to anon, authenticated, service_role;' | Out-String)

  Write-Host '=== MIGRATIONS ===' -ForegroundColor Cyan
  foreach ($f in Get-ChildItem (Join-Path $root 'supabase/migrations') -Filter '*.sql' | Sort-Object Name) {
    $out = Invoke-Psql $f.FullName @('-v', 'ON_ERROR_STOP=1', '-q') | Out-String
    if ($out -match 'ERROR') {
      $first = (($out -split "`n") | Where-Object { $_ -match 'ERROR' } | Select-Object -First 1).Trim()
      Write-Host "FAIL $($f.Name): $first" -ForegroundColor Red
      exit 1
    }
    Write-Host "OK   $($f.Name)" -ForegroundColor Green
  }

  Write-Host '=== SEED ===' -ForegroundColor Cyan
  $out = Invoke-Psql (Join-Path $root 'supabase/seed.sql') @('-v', 'ON_ERROR_STOP=1', '-q') | Out-String
  Stop-WithError 'seed.sql' $out
  Write-Host 'OK   seed.sql' -ForegroundColor Green
}

$failed = @()
foreach ($s in $suites) {
  Write-Host ''
  Write-Host "=== SUITE $s ===" -ForegroundColor Cyan
  $out = Invoke-Psql (Join-Path $root "supabase/tests/$s.sql") @('-v', 'ON_ERROR_STOP=1') | Out-String

  # Anchor on line starts: matching bare words would also hit the suite's own
  # filename in psql's "psql:/tmp/x.sql:12: NOTICE:" prefixes.
  $lines = $out -split "`n"
  $pass = ($lines | Where-Object { $_ -match '\bPASS:' }).Count
  $bad = $lines | Where-Object { $_ -match '\b(ERROR|FAIL)\b' }
  $result = ($lines | Where-Object { $_ -match '=== RESULT:' } | Select-Object -Last 1)

  # A suite signals failure by raising, which psql reports as ERROR; the RESULT
  # line is only reached when nothing was raised. So it doubles as a
  # tripwire: present but not "no ... raised" means the suite changed shape.
  $resultOk = $result -and $result -match '=== RESULT: no .* raised ==='

  Write-Host "  $pass passed"
  if ($result) { Write-Host "  $($result.Trim())" }
  foreach ($b in $bad) { Write-Host "  $($b.Trim())" -ForegroundColor Red }

  if ($bad -or -not $resultOk) {
    if (-not $result) { Write-Host '  suite produced no === RESULT: line' -ForegroundColor Red }
    $failed += $s
  }
}

Write-Host ''
if ($failed) {
  Write-Host "FAILED: $($failed -join ', ')" -ForegroundColor Red
  exit 1
}
Write-Host 'All DB suites passed.' -ForegroundColor Green