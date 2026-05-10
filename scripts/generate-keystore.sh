#!/usr/bin/env bash
# ============================================================
# generate-keystore.sh
# Generate an Android release keystore for Shazzar.
#
# Usage:
#   ./scripts/generate-keystore.sh
#
# Optional env overrides (all have safe defaults):
#   KEYSTORE_FILE   — output filename           (default: shazzar-release.keystore)
#   KEY_ALIAS       — alias inside the keystore  (default: shazzar-key)
#   KEYSTORE_PASS   — keystore password          (prompted if unset)
#   KEY_PASS        — key password               (prompted if unset)
#   KEY_CN          — Common Name                (default: Shazzar)
#   KEY_OU          — Organisational Unit        (default: Engineering)
#   KEY_O           — Organisation               (default: Shazzar)
#   KEY_L           — City/Locality              (default: Bucharest)
#   KEY_ST          — State/Province             (default: Bucharest)
#   KEY_C           — Country code (2-letter)    (default: RO)
#   KEY_VALIDITY    — validity in days           (default: 10000 ~27 years)
#
# What this script does NOT do:
#   - It does not commit anything.
#   - It does not push anything.
#   - It does not set any secrets in GitHub or anywhere else.
#   - It does not modify build.gradle or any CI config.
# ============================================================

set -euo pipefail

# ── Defaults ────────────────────────────────────────────────
KEYSTORE_FILE="${KEYSTORE_FILE:-shazzar-release.keystore}"
KEY_ALIAS="${KEY_ALIAS:-shazzar-key}"
KEY_CN="${KEY_CN:-Shazzar}"
KEY_OU="${KEY_OU:-Engineering}"
KEY_O="${KEY_O:-Shazzar}"
KEY_L="${KEY_L:-Bucharest}"
KEY_ST="${KEY_ST:-Bucharest}"
KEY_C="${KEY_C:-RO}"
KEY_VALIDITY="${KEY_VALIDITY:-10000}"

# ── Colour helpers ───────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

info()    { echo -e "${CYAN}[INFO]${RESET}  $*"; }
success() { echo -e "${GREEN}[OK]${RESET}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${RESET}  $*"; }
error()   { echo -e "${RED}[ERROR]${RESET} $*" >&2; }

# ── Check keytool availability ───────────────────────────────
if ! command -v keytool &>/dev/null; then
  error "keytool not found. Install a JDK (Java 17 recommended) and ensure it is on your PATH."
  error "  macOS:  brew install openjdk@17"
  error "  Ubuntu: sudo apt install openjdk-17-jdk"
  exit 1
fi

echo ""
echo -e "${BOLD}=== Shazzar Android Release Keystore Generator ===${RESET}"
echo ""

# ── Safety check: don't overwrite an existing keystore ───────
if [[ -f "$KEYSTORE_FILE" ]]; then
  error "File '$KEYSTORE_FILE' already exists. Remove it first if you want to regenerate."
  error "  rm $KEYSTORE_FILE"
  exit 1
fi

# ── Prompt for passwords if not set in the environment ───────
if [[ -z "${KEYSTORE_PASS:-}" ]]; then
  echo -n "Enter keystore password (min 6 chars): "
  read -rs KEYSTORE_PASS
  echo ""
  if [[ ${#KEYSTORE_PASS} -lt 6 ]]; then
    error "Password must be at least 6 characters."
    exit 1
  fi
  echo -n "Confirm keystore password: "
  read -rs KEYSTORE_PASS_CONFIRM
  echo ""
  if [[ "$KEYSTORE_PASS" != "$KEYSTORE_PASS_CONFIRM" ]]; then
    error "Passwords do not match."
    exit 1
  fi
fi

if [[ -z "${KEY_PASS:-}" ]]; then
  echo -n "Enter key password (leave blank to use keystore password): "
  read -rs KEY_PASS
  echo ""
  if [[ -z "$KEY_PASS" ]]; then
    KEY_PASS="$KEYSTORE_PASS"
    info "Using keystore password for the key as well."
  fi
fi

# ── Build the Distinguished Name string ──────────────────────
DNAME="CN=${KEY_CN}, OU=${KEY_OU}, O=${KEY_O}, L=${KEY_L}, ST=${KEY_ST}, C=${KEY_C}"

# ── Generate the keystore ────────────────────────────────────
info "Generating keystore..."
info "  File    : $KEYSTORE_FILE"
info "  Alias   : $KEY_ALIAS"
info "  Validity: $KEY_VALIDITY days"
info "  DN      : $DNAME"
echo ""

keytool \
  -genkeypair \
  -v \
  -keystore "$KEYSTORE_FILE" \
  -alias "$KEY_ALIAS" \
  -keyalg RSA \
  -keysize 4096 \
  -validity "$KEY_VALIDITY" \
  -storepass "$KEYSTORE_PASS" \
  -keypass "$KEY_PASS" \
  -dname "$DNAME"

echo ""
success "Keystore generated: $KEYSTORE_FILE"
echo ""

# ── Next steps ───────────────────────────────────────────────
echo -e "${BOLD}━━━ NEXT STEPS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo ""
echo -e "${BOLD}1. Keep the keystore safe (never commit it):${RESET}"
echo "   • Add '*.keystore' to .gitignore if not already there."
echo "   • Back it up to a secure location (password manager, encrypted drive)."
echo "   • If you lose it you cannot publish updates to the same Play Store listing."
echo ""
echo -e "${BOLD}2. Base64-encode it for GitHub Actions:${RESET}"
echo ""
echo "   base64 -w 0 $KEYSTORE_FILE > keystore.b64"
echo "   cat keystore.b64"
echo ""
echo "   (On macOS use: base64 -i $KEYSTORE_FILE -o keystore.b64)"
echo ""
echo -e "${BOLD}3. Add these GitHub Actions secrets${RESET} (Settings → Secrets → Actions):"
echo ""
echo "   Secret name                Value"
echo "   ─────────────────────────  ──────────────────────────────────────"
echo "   ANDROID_KEYSTORE_B64       <paste the full base64 string>"
echo "   ANDROID_STORE_PASSWORD     $KEYSTORE_PASS"
echo "   ANDROID_KEY_ALIAS          $KEY_ALIAS"
echo "   ANDROID_KEY_PASSWORD       $KEY_PASS"
echo ""
echo -e "${BOLD}4. Local development (optional):${RESET}"
echo "   Add these to ~/.zshrc / ~/.bashrc and run 'source ~/.zshrc':"
echo ""
echo "   export ANDROID_KEYSTORE_PATH=\"\$(pwd)/$KEYSTORE_FILE\""
echo "   export ANDROID_STORE_PASSWORD=\"\$KEYSTORE_PASS\""
echo "   export ANDROID_KEY_ALIAS=\"$KEY_ALIAS\""
echo "   export ANDROID_KEY_PASSWORD=\"\$KEY_PASS\""
echo ""
echo "   Then build locally with:  bundle exec fastlane android build"
echo ""
echo -e "${BOLD}5. How CI uses the keystore (automated in ci.yml):${RESET}"
echo "   • The ANDROID_KEYSTORE_B64 secret is decoded back to a file."
echo "   • ANDROID_KEYSTORE_PATH is set to that temp file path."
echo "   • Fastlane's 'build' lane reads those env vars and passes them to Gradle."
echo ""
echo -e "${YELLOW}IMPORTANT: Do not share passwords in plaintext. Use a password manager.${RESET}"
echo -e "${YELLOW}IMPORTANT: Do not commit $KEYSTORE_FILE or keystore.b64 to git.${RESET}"
echo ""
success "Done. Your keystore is ready."
