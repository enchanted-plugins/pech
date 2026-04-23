#!/usr/bin/env bash
# publish.sh — bash wrapper for the Python publish helper.
#
# Usage:
#   publish.sh <topic> <payload-json>
#   echo '{"topic":"...","payload":{...}}' | publish.sh
#
# Fails open: exits 0 even on publish errors (advisory-only per conduct/hooks.md).

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PUBLISH_PY="${SCRIPT_DIR}/publish.py"

if [[ $# -ge 2 ]]; then
    # Called as: publish.sh <topic> <payload-json>
    topic="$1"
    payload="$2"
    printf '{"topic":"%s","payload":%s}' "$topic" "$payload" \
        | python3 "${PUBLISH_PY}" || true
elif [[ $# -eq 0 ]]; then
    # Called with stdin JSON
    python3 "${PUBLISH_PY}" || true
else
    echo "[pech:publish.sh] usage: publish.sh <topic> <payload-json>" >&2
fi

exit 0
