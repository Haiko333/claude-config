#!/usr/bin/env bash
# Claude Code config installer — Linux & macOS
set -euo pipefail

REPO_URL_SSH="git@github.com:Haiko333/claude-config.git"
REPO_URL_HTTPS="https://github.com/Haiko333/claude-config.git"
CLAUDE_DIR="${CLAUDE_DIR:-$HOME/.claude}"
ORIGINAL_AUTHOR_PATH="/home/haiko/.claude"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
log_step()    { echo -e "\n${BLUE}━━ $1 ━━${NC}"; }
log_info()    { echo -e "  ${BLUE}[→]${NC} $1"; }
log_success() { echo -e "  ${GREEN}[✓]${NC} $1"; }
log_warn()    { echo -e "  ${YELLOW}[!]${NC} $1"; }
log_error()   { echo -e "  ${RED}[✗]${NC} $1" >&2; }

detect_os() {
  case "$(uname -s)" in
    Linux*)  echo "linux" ;;
    Darwin*) echo "macos" ;;
    *)       echo "unknown" ;;
  esac
}

sed_inplace() {
  local pattern="$1" file="$2"
  if [ "$(detect_os)" = "macos" ]; then
    sed -i '' "$pattern" "$file"
  else
    sed -i "$pattern" "$file"
  fi
}

check_prerequisites() {
  log_step "Checking prerequisites"
  if ! command -v git &>/dev/null; then
    log_error "git is required. Install it first."; exit 1
  fi
  log_success "git $(git --version | awk '{print $3}')"

  if ! command -v curl &>/dev/null && ! command -v wget &>/dev/null; then
    log_error "curl or wget is required to install bun."; exit 1
  fi
}

install_bun() {
  log_step "Bun runtime"
  if command -v bun &>/dev/null; then
    log_success "bun $(bun --version) already installed"; return
  fi
  log_info "Installing bun..."
  if command -v curl &>/dev/null; then
    curl -fsSL https://bun.sh/install | bash
  else
    wget -qO- https://bun.sh/install | bash
  fi
  export BUN_INSTALL="$HOME/.bun"
  export PATH="$BUN_INSTALL/bin:$PATH"
  log_success "bun $(bun --version) installed"
}

backup_config() {
  if [ -d "$CLAUDE_DIR" ] && [ ! -d "$CLAUDE_DIR/.git" ]; then
    local backup="${CLAUDE_DIR}.backup.$(date +%Y%m%d_%H%M%S)"
    log_warn "~/.claude exists but is not a git repo — backing up to $(basename "$backup")"
    cp -r "$CLAUDE_DIR" "$backup"
    log_success "Backup created at $backup"
    rm -rf "$CLAUDE_DIR"
  fi
}

clone_or_update() {
  log_step "Configuration repository"
  if [ -d "$CLAUDE_DIR/.git" ]; then
    log_info "Repo already present — pulling latest..."
    git -C "$CLAUDE_DIR" pull --ff-only
    log_success "Up to date"
    return
  fi

  log_info "Cloning to $CLAUDE_DIR..."
  # Try SSH first (faster, no password), fall back to HTTPS
  if ssh -o BatchMode=yes -T git@github.com 2>&1 | grep -q "successfully authenticated"; then
    git clone "$REPO_URL_SSH" "$CLAUDE_DIR"
  else
    log_info "SSH key not configured for GitHub — using HTTPS"
    git clone "$REPO_URL_HTTPS" "$CLAUDE_DIR"
  fi
  log_success "Cloned"
}

install_dependencies() {
  log_step "Script dependencies"
  local scripts_dir="$CLAUDE_DIR/scripts"
  if [ -f "$scripts_dir/package.json" ]; then
    log_info "Running bun install in scripts/..."
    (cd "$scripts_dir" && bun install --silent)
    log_success "Dependencies installed"
  else
    log_warn "scripts/package.json not found — skipping"
  fi
}

fix_paths() {
  log_step "Adapting paths for this environment"
  if [ "$CLAUDE_DIR" = "$ORIGINAL_AUTHOR_PATH" ]; then
    log_info "Same path as original author — nothing to replace"; return
  fi

  local settings="$CLAUDE_DIR/settings.json"
  if [ -f "$settings" ] && grep -q "$ORIGINAL_AUTHOR_PATH" "$settings"; then
    sed_inplace "s|$ORIGINAL_AUTHOR_PATH|$CLAUDE_DIR|g" "$settings"
    log_success "Paths updated in settings.json"
  fi
}

fix_plugin_placeholders() {
  log_step "Plugin hook placeholders"
  local plugins_dir="$CLAUDE_DIR/plugins"
  [ -d "$plugins_dir" ] || { log_info "No plugins directory — skipping"; return; }

  local fixed=0
  while IFS= read -r -d '' f; do
    if grep -q '{CLAUDE_PATH}' "$f"; then
      sed_inplace "s|{CLAUDE_PATH}|$CLAUDE_DIR|g" "$f"
      log_success "Fixed: ${f#"$CLAUDE_DIR/"}"
      ((fixed++)) || true
    fi
  done < <(find "$plugins_dir" -name "hooks.json" -print0 2>/dev/null)

  if [ "$fixed" -eq 0 ]; then
    log_info "No unresolved placeholders found"
  fi
}

configure_statusline() {
  log_step "Statusline configuration"
  local settings="$CLAUDE_DIR/settings.json"

  if grep -q '"statusLine"' "$settings" 2>/dev/null; then
    log_info "statusLine already configured"; return
  fi

  if ! command -v python3 &>/dev/null; then
    log_warn "python3 not found — add manually to $settings:"
    log_warn "  \"statusLine\": { \"type\": \"command\", \"command\": \"bun $CLAUDE_DIR/scripts/statusline/src/index.ts\", \"padding\": 0 }"
    return
  fi

  python3 - "$settings" "$CLAUDE_DIR" <<'PYEOF'
import json, sys
settings_path, claude_dir = sys.argv[1], sys.argv[2]
with open(settings_path) as f:
    config = json.load(f)
config["statusLine"] = {
    "type": "command",
    "command": f"bun {claude_dir}/scripts/statusline/src/index.ts",
    "padding": 0
}
with open(settings_path, "w") as f:
    json.dump(config, f, indent=2)
    f.write("\n")
PYEOF
  log_success "statusLine configured in settings.json"
}

install_ccusage() {
  log_step "Global tools"
  if command -v ccusage &>/dev/null; then
    log_success "ccusage already installed"
  else
    log_info "Installing ccusage globally..."
    bun add -g ccusage
    log_success "ccusage installed"
  fi
}

setup_aliases() {
  log_step "Shell aliases"
  local alias_cc='alias cc="claude --dangerously-skip-permissions"'
  local alias_ccc='alias ccc="claude"'
  local os
  os=$(detect_os)

  local shell_files=()
  case "$os" in
    macos)
      [ -f "$HOME/.zshenv" ] && shell_files+=("$HOME/.zshenv")
      [ -f "$HOME/.zshrc" ]  && shell_files+=("$HOME/.zshrc")
      [ ${#shell_files[@]} -eq 0 ] && shell_files+=("$HOME/.zshenv")
      ;;
    linux)
      [ -f "$HOME/.bashrc" ] && shell_files+=("$HOME/.bashrc")
      [ -f "$HOME/.zshrc" ]  && shell_files+=("$HOME/.zshrc")
      [ ${#shell_files[@]} -eq 0 ] && shell_files+=("$HOME/.bashrc")
      ;;
  esac

  for cfg in "${shell_files[@]}"; do
    if grep -q 'alias cc=' "$cfg" 2>/dev/null; then
      log_info "  cc alias already in $(basename "$cfg")"
    else
      echo "$alias_cc" >> "$cfg"
      log_success "  cc → $(basename "$cfg")"
    fi
    if grep -q 'alias ccc=' "$cfg" 2>/dev/null; then
      log_info "  ccc alias already in $(basename "$cfg")"
    else
      echo "$alias_ccc" >> "$cfg"
      log_success "  ccc → $(basename "$cfg")"
    fi
  done
}

show_summary() {
  echo
  echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║   Claude Code config installed!        ║${NC}"
  echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
  echo
  echo "  Config : $CLAUDE_DIR"
  echo "  Aliases: cc (skip-permissions) | ccc (normal)"
  echo
  echo "  Next steps:"
  echo "    1. Restart your shell, or:"
  echo "       source ~/.zshrc   (zsh)"
  echo "       source ~/.bashrc  (bash)"
  echo "    2. Run: ccc"
  echo
  echo -e "${YELLOW}  Warning: 'cc' uses --dangerously-skip-permissions.${NC}"
  echo -e "${YELLOW}  Only use it in trusted, personal environments.${NC}"
  echo
}

main() {
  echo
  echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
  echo -e "${BLUE}║   Claude Code Config Installer         ║${NC}"
  echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
  echo -e "  OS: $(detect_os) | Target: $CLAUDE_DIR"

  check_prerequisites
  install_bun
  backup_config
  clone_or_update
  install_dependencies
  fix_paths
  fix_plugin_placeholders
  install_ccusage
  configure_statusline
  setup_aliases
  show_summary
}

main "$@"
