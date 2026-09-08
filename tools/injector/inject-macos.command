#!/usr/bin/env bash
set -uo pipefail

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$BASE_DIR/Companion-Panel"
INJECT_SCRIPT="$APP_DIR/inject-local-html.cjs"
RESTORE_SCRIPT="$APP_DIR/restore-local-html.cjs"
PAYLOAD="$APP_DIR/companion-panel.user.js"

pause_and_exit() {
  local status="${1:-0}"
  echo
  read -r -p "Press Enter to close..."
  exit "$status"
}

printf '\033]0;Companion Panel Injector\007'
echo "Companion Panel Injector"
echo

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js was not found on this machine."
  echo "Please install Node.js LTS first: https://nodejs.org/"
  pause_and_exit 1
fi

if [[ ! -f "$INJECT_SCRIPT" || ! -f "$RESTORE_SCRIPT" ]]; then
  echo "Companion Panel Injector helper scripts were not found in:"
  echo "$APP_DIR"
  pause_and_exit 1
fi

echo "1) Inject panel"
echo "2) Restore original HTML"
echo "3) Exit"
echo
read -r -p "Choose an action [1-3]: " ACTION

# The Node helpers search their current directory first, then one level above.
# Running them from Companion-Panel therefore finds an HTML file beside the
# tools or, normally, in the game folder that contains Companion-Panel.
cd "$APP_DIR" || {
  echo "Could not open Companion-Panel directory:"
  echo "$APP_DIR"
  pause_and_exit 1
}

case "$ACTION" in
  1)
    if [[ ! -f "$PAYLOAD" ]]; then
      echo "Payload file not found:"
      echo "$PAYLOAD"
      pause_and_exit 1
    fi

    node "$INJECT_SCRIPT"
    STATUS=$?
    ;;
  2)
    node "$RESTORE_SCRIPT"
    STATUS=$?
    ;;
  3)
    exit 0
    ;;
  *)
    echo "Invalid selection."
    pause_and_exit 1
    ;;
esac

if [[ "$STATUS" -eq 0 ]]; then
  echo
  echo "Done."
else
  echo
  echo "Operation failed with exit code $STATUS."
fi

pause_and_exit "$STATUS"

