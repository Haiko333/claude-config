# Claude Code Config Installer — Windows (PowerShell)
# Run: Set-ExecutionPolicy Bypass -Scope Process -Force; .\install.ps1

$ErrorActionPreference = "Stop"

$REPO_URL            = "https://github.com/Haiko333/claude-config.git"
$CLAUDE_DIR          = "$env:USERPROFILE\.claude"
$ORIGINAL_AUTHOR_PATH = "/home/haiko/.claude"

function Write-Step($msg)    { Write-Host "`n━━ $msg ━━" -ForegroundColor Cyan }
function Write-Info($msg)    { Write-Host "  [→] $msg" -ForegroundColor Blue }
function Write-Success($msg) { Write-Host "  [✓] $msg" -ForegroundColor Green }
function Write-Warn($msg)    { Write-Host "  [!] $msg" -ForegroundColor Yellow }
function Write-Err($msg)     { Write-Host "  [✗] $msg" -ForegroundColor Red; exit 1 }

Write-Host ""
Write-Host "╔════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   Claude Code Config Installer (Win)   ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host "  Target: $CLAUDE_DIR"
Write-Host ""

# Prerequisites
Write-Step "Checking prerequisites"
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Err "git is required. Install from https://git-scm.com"
}
Write-Success "git $(git --version)"

# Bun
Write-Step "Bun runtime"
if (Get-Command bun -ErrorAction SilentlyContinue) {
    Write-Success "bun $(bun --version) already installed"
} else {
    Write-Info "Installing bun..."
    irm bun.sh/install.ps1 | iex
    $env:PATH = "$env:USERPROFILE\.bun\bin;$env:PATH"
    Write-Success "bun installed"
}

# Backup
Write-Step "Configuration repository"
if ((Test-Path $CLAUDE_DIR) -and (-not (Test-Path "$CLAUDE_DIR\.git"))) {
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $backup = "$CLAUDE_DIR.backup.$timestamp"
    Write-Warn "~/.claude exists but is not a git repo — backing up to $backup"
    Copy-Item -Recurse $CLAUDE_DIR $backup
    Write-Success "Backup created"
}

# Clone or update
if (Test-Path "$CLAUDE_DIR\.git") {
    Write-Info "Repo already present — pulling latest..."
    git -C $CLAUDE_DIR pull --ff-only
    Write-Success "Up to date"
} else {
    Write-Info "Cloning config to $CLAUDE_DIR..."
    git clone $REPO_URL $CLAUDE_DIR
    Write-Success "Cloned"
}

# Install script dependencies
Write-Step "Script dependencies"
$scriptsDir = "$CLAUDE_DIR\scripts"
if (Test-Path "$scriptsDir\package.json") {
    Write-Info "Running bun install in scripts\..."
    Push-Location $scriptsDir
    bun install --silent
    Pop-Location
    Write-Success "Dependencies installed"
} else {
    Write-Warn "scripts\package.json not found — skipping"
}

# Fix hardcoded paths
Write-Step "Adapting paths for this environment"
$settingsFile = "$CLAUDE_DIR\settings.json"
if (Test-Path $settingsFile) {
    $content = Get-Content $settingsFile -Raw
    if ($content -match [regex]::Escape($ORIGINAL_AUTHOR_PATH)) {
        # On Windows, use Windows-style path
        $content = $content -replace [regex]::Escape($ORIGINAL_AUTHOR_PATH), $CLAUDE_DIR.Replace('\', '\\')
        Set-Content $settingsFile $content -NoNewline
        Write-Success "Paths updated in settings.json"
        Write-Warn "Note: paplay (audio hooks) is Linux-only — those hooks will silently no-op on Windows"
    } else {
        Write-Info "No path replacement needed"
    }
}

# Fix {CLAUDE_PATH} placeholders in plugin hooks
Write-Step "Plugin hook placeholders"
$hookFiles = Get-ChildItem -Path "$CLAUDE_DIR\plugins" -Filter "hooks.json" -Recurse -ErrorAction SilentlyContinue
$fixed = 0
foreach ($f in $hookFiles) {
    $content = Get-Content $f.FullName -Raw
    if ($content -match '\{CLAUDE_PATH\}') {
        $content = $content -replace '\{CLAUDE_PATH\}', $CLAUDE_DIR.Replace('\', '\\')
        Set-Content $f.FullName $content -NoNewline
        Write-Success "Fixed: $($f.FullName.Replace($CLAUDE_DIR, ''))"
        $fixed++
    }
}
if ($fixed -eq 0) { Write-Info "No unresolved placeholders found" }

# Global tools
Write-Step "Global tools"
if (Get-Command ccusage -ErrorAction SilentlyContinue) {
    Write-Success "ccusage already installed"
} else {
    Write-Info "Installing ccusage globally..."
    bun add -g ccusage
    Write-Success "ccusage installed"
}

# Summary
Write-Host ""
Write-Host "╔════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║   Claude Code config installed!        ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "  Config: $CLAUDE_DIR"
Write-Host ""
Write-Host "  To add shell aliases, add these to your PowerShell `$PROFILE:"
Write-Host '    function cc  { claude --dangerously-skip-permissions @args }' -ForegroundColor Yellow
Write-Host '    function ccc { claude @args }' -ForegroundColor Yellow
Write-Host ""
Write-Host "  Open your profile with: notepad `$PROFILE"
Write-Host ""
Write-Host "  Warning: 'cc' uses --dangerously-skip-permissions." -ForegroundColor Yellow
Write-Host "  Only use it in trusted, personal environments." -ForegroundColor Yellow
Write-Host ""
