#!/usr/bin/env bash
# Shared constants — sourced by hooks and utilities across all sub-plugins.
# Add per-plugin constants here; prefix them with {{ENGINE_PREFIX}}_ for namespacing.

# Example constants (replace with real ones for your plugin):
# {{ENGINE_PREFIX}}_VERSION="0.1.0"
# {{ENGINE_PREFIX}}_STATE_DIR="state"

# XDG-compliant global state layout — metrics → STATE, learnings → DATA.
# Spec: https://specifications.freedesktop.org/basedir-spec/basedir-spec-latest.html
XDG_STATE_HOME="${XDG_STATE_HOME:-${HOME}/.local/state}"
XDG_DATA_HOME="${XDG_DATA_HOME:-${HOME}/.local/share}"

# Generic helpers (plugin-agnostic, safe to keep):

# now_iso — current UTC timestamp in ISO-8601
now_iso() {
  date -u +"%Y-%m-%dT%H:%M:%SZ"
}

# ensure_dir — create directory if missing, no-op if present
ensure_dir() {
  [[ -d "$1" ]] || mkdir -p "$1"
}

# log — timestamped log to stderr (does not pollute stdout / conversation)
log() {
  printf "[%s] %s\n" "$(now_iso)" "$*" >&2
}
