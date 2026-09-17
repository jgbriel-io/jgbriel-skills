<#
.SYNOPSIS
  Moves a machine off the old ~/.claude symlink layout and onto the plugin.

.DESCRIPTION
  Before the plugin, ~/.claude/{skills,agents,commands,hooks} were symlinks into
  a clone of this repo. Those paths no longer exist on main, so the links dangle
  and Claude Code starts with no skills, no agents and no guard-dangerous-bash.

  This removes a link only when it really is a link. A real directory is left
  alone and reported: it holds something that was never in the repo, and losing
  it silently would be worse than a manual step.

  Run it after pulling main. It is safe to run twice.
#>

$ErrorActionPreference = 'Stop'
$claude = Join-Path $HOME '.claude'
$kept = @()

foreach ($name in 'skills', 'agents', 'commands', 'hooks') {
    $path = Join-Path $claude $name
    if (-not (Test-Path $path)) { Write-Host "skip   $name (não existe)"; continue }

    $item = Get-Item $path -Force
    if ($item.Attributes -band [IO.FileAttributes]::ReparsePoint) {
        Remove-Item $path -Force
        Write-Host "removido $name (symlink)"
    } else {
        $kept += $path
        Write-Host "MANTIDO  $name — diretório de verdade, não um link"
    }
}

if ($kept) {
    Write-Host ''
    Write-Host 'Confira estes caminhos antes de apagar à mão:' -ForegroundColor Yellow
    $kept | ForEach-Object { Write-Host "  $_" }
}

Write-Host ''
claude plugin marketplace add jgbriel-io/jgbriel-skills
claude plugin install jgbriel-skills@jgbriel

Write-Host ''
Write-Host 'Feito. Reinicie o Claude Code e confira com: claude plugin list' -ForegroundColor Green
