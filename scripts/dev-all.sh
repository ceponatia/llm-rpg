#!/usr/bin/env bash
set -euo pipefail

# Simple dev orchestrator: starts backend, frontend, and admin dashboard.
# External services (Neo4j, Ollama, vector stores, etc.) are expected to be
# managed separately (docker compose or manual). This script focuses only on
# the local TypeScript app processes.
#
# Requirements:
#  - pnpm dependencies installed
#  - services expose default ports (backend:3001, frontend:5174, admin:5175 unless overridden)
#
# Behavior:
#  - Starts processes, tails logs with colored prefixes
#  - Aggregates WARN/ERROR lines into timestamped file under logs/
#  - Graceful shutdown on INT/TERM

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_DIR="$ROOT_DIR/.dev-logs"
ERROR_EXPORT_DIR="$ROOT_DIR/logs"
mkdir -p "$LOG_DIR" "$ERROR_EXPORT_DIR"
TS=$(date '+%Y%m%d-%H%M%S')
ERROR_FILE="$ERROR_EXPORT_DIR/dev-errors-$TS.log"

# Load environment variables (.env then .env.local overrides)
if [[ -f "$ROOT_DIR/.env" ]]; then
  set -a; source "$ROOT_DIR/.env"; set +a
fi
if [[ -f "$ROOT_DIR/.env.local" ]]; then
  set -a; source "$ROOT_DIR/.env.local"; set +a
fi

# (Any database / external service credentials still come from env files; this script does not launch those services.)

BACKEND_CMD=(pnpm --filter @rpg/backend dev)
FRONTEND_CMD=(pnpm --filter @rpg/frontend dev)
ADMIN_CMD=(pnpm --filter @rpg/admin-dashboard dev)

PIDS=()

print_section() { echo -e "\n========== $1 =========="; }

color_for() { case "$1" in backend) echo "\e[35m";; frontend) echo "\e[36m";; admin) echo "\e[34m";; health) echo "\e[32m";; *) echo "\e[37m";; esac; }

reset_color='\e[0m'

# (No embedded container management.)

start_proc() {
  local name="$1"; shift
  local logfile="$LOG_DIR/$name.log"
  echo -e "$(color_for $name)[start]$reset_color $name -> $logfile"
  ("$@" &>"$logfile" & echo $! >"$LOG_DIR/$name.pid") &
  # Wait a moment and store PID
  sleep 0.3
  if [[ -f "$LOG_DIR/$name.pid" ]]; then
    local pid
    pid=$(cat "$LOG_DIR/$name.pid")
    PIDS+=("$pid:$name")
  fi
}

stop_all() {
  print_section "Shutting down"
  for entry in "${PIDS[@]}"; do
    pid="${entry%%:*}"; name="${entry##*:}"
    if kill -0 "$pid" 2>/dev/null; then
      echo -e "$(color_for $name)[stop]$reset_color $name (pid $pid)"
      kill "$pid" 2>/dev/null || true
    fi
  done
  # Give them a moment then force kill if needed
  sleep 1
  for entry in "${PIDS[@]}"; do
    pid="${entry%%:*}"; name="${entry##*:}"
    if kill -0 "$pid" 2>/dev/null; then
      echo -e "$(color_for $name)[force]$reset_color $name (pid $pid)"
      kill -9 "$pid" 2>/dev/null || true
    fi
  done
  echo "All processes stopped."
}

trap stop_all INT TERM EXIT

print_section "External Services"
echo "Neo4j / Ollama / others expected to already be running if required."
if command -v nc >/dev/null 2>&1 && nc -z localhost 7687 2>/dev/null; then
  echo "Neo4j bolt (7687) reachable."
fi



print_section "Starting Backend"
start_proc backend "${BACKEND_CMD[@]}"

print_section "Starting Frontend"
start_proc frontend "${FRONTEND_CMD[@]}"

print_section "Starting Admin Dashboard"
start_proc admin "${ADMIN_CMD[@]}"

print_section "Process Table"
printf "%-10s %-8s %s\n" NAME PID LOG
for entry in "${PIDS[@]}"; do
  pid="${entry%%:*}"; name="${entry##*:}"
  printf "%-10s %-8s %s\n" "$name" "$pid" "$LOG_DIR/$name.log"
done
echo "(External services not listed)"

echo -e "\nAggregating errors/warnings to $ERROR_FILE"
touch "$ERROR_FILE"

# Background task: tail logs with colored prefixes
tail_with_prefix() {
  local file="$1"; local name
  name=$(basename "$file" .log)
  local color; color=$(color_for "$name")
  tail -n 5 -F "$file" | sed -u "s/^/${color}[${name}]${reset_color} /"
}

# Error extraction loop (captures lines containing 'ERROR', 'Error', 'WARN', 'Warning')
aggregate_errors() {
  while true; do
    for f in "$LOG_DIR"/*.log; do
      grep -E "(ERROR|Error|WARN|Warning)" "$f" >> "$ERROR_FILE" 2>/dev/null || true
    done
    sleep 5
  done
}
aggregate_errors & AGG_PID=$!
PIDS+=("$AGG_PID:aggregator")

# Health polling (backend + frontend readiness)
health_poll() {
  local backend_ok=0 frontend_ok=0 tries=0
  local backend_port="${BACKEND_PORT:-3001}" frontend_port="${FRONTEND_PORT:-5174}" max="${HEALTH_TIMEOUT_SECS:-60}"
  while (( tries < max )) && ( (( backend_ok == 0 )) || (( frontend_ok == 0 )) ); do
    ((tries++))
    if (( backend_ok == 0 )); then
      if curl -s "http://localhost:${backend_port}/health" | grep -q '"status":"ok"'; then backend_ok=1; echo -e "$(color_for health)[health]$reset_color backend OK (${backend_port})"; fi
    fi
    if (( frontend_ok == 0 )); then
      if curl -s -I "http://localhost:${frontend_port}" | grep -q '200'; then frontend_ok=1; echo -e "$(color_for health)[health]$reset_color frontend OK (${frontend_port})"; fi
    fi
    sleep 1
  done
  if (( backend_ok == 0 )); then echo -e "$(color_for health)[health]$reset_color backend NOT READY after ${max}s"; fi
  if (( frontend_ok == 0 )); then echo -e "$(color_for health)[health]$reset_color frontend NOT READY after ${max}s"; fi
}
health_poll &

# Tail all logs with prefixes
for f in "$LOG_DIR"/*.log; do tail_with_prefix "$f" & done
wait
