#!/usr/bin/env bash
set -euo pipefail

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$BASE_DIR/Companion-Panel"
INJECT_SCRIPT="$APP_DIR/inject-local-html.cjs"
RESTORE_SCRIPT="$APP_DIR/restore-local-html.cjs"
PAYLOAD="$APP_DIR/companion-panel.user.js"

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js was not found on this machine."
  echo "Please install Node.js LTS first: https://nodejs.org/"
  exit 1
fi

if [[ ! -f "$INJECT_SCRIPT" || ! -f "$RESTORE_SCRIPT" ]]; then
  echo "Companion Panel Injector helper scripts were not found in:"
  echo "$APP_DIR"
  exit 1
fi

echo "Companion Panel Injector"
echo
echo "1) Inject panel"
echo "2) Restore original HTML"
echo "3) Exit"
echo
read -r -p "Choose an action [1-3]: " ACTION

# The Node helpers search their current directory first, then one level above.
# Running them from Companion-Panel therefore finds an HTML file beside the
# tools or, normally, in the game folder that contains Companion-Panel.
cd "$APP_DIR"

case "$ACTION" in
  1)
    if [[ ! -f "$PAYLOAD" ]]; then
      echo "Payload file not found:"
      echo "$PAYLOAD"
      exit 1
    fi

    node "$INJECT_SCRIPT"
    ;;
  2)
    node "$RESTORE_SCRIPT"
    ;;
  3)
    exit 0
    ;;
  *)
    echo "Invalid selection."
    exit 1
    ;;
esac

