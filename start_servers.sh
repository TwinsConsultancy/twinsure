#!/usr/bin/env bash

# Bash script to start Twinsure backend and frontend servers on Linux/macOS
# Auto-detects and uses the local self-contained PHP runtime if globally installed PHP is missing.

set -euo pipefail

# Ensure we are in the script's directory
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

# Reading env first to get HOST and PORT values
echo "Reading .env configuration..."
ENV_FILE="backend/.env"

if [ ! -f "$ENV_FILE" ]; then
    echo -e "\033[0;31mError: .env file not found at $ENV_FILE\033[0m"
    exit 1
fi

# Parse .env and export variables safely (ignoring comments and empty lines)
while IFS='=' read -r key val || [ -n "$key" ]; do
    # Strip whitespace from key
    key=$(echo "$key" | xargs 2>/dev/null || echo "$key" | tr -d '[:space:]')
    
    # Skip if key is empty or starts with #
    if [[ -z "$key" || "$key" =~ ^# ]]; then
        continue
    fi
    
    # Strip leading/trailing quotes and whitespace from val
    val=$(echo "$val" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//' -e 's/^["'\'']//' -e 's/["'\'']$//')
    
    export "$key"="$val"
done < "$ENV_FILE"

# Set default values if not provided
: "${HOST:=127.0.0.1}"
: "${BACKEND_PORT:=8000}"
: "${FRONTEND_PORT:=3000}"
: "${API_BASE_URL:=http://$HOST:$BACKEND_PORT}"

# Auto-free ports if they are already in use
for port in "$BACKEND_PORT" "$FRONTEND_PORT"; do
    if command -v lsof &> /dev/null && lsof -i :"$port" -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "\033[1;33mWarning: Port $port is already in use. Cleaning up lingering processes...\033[0m"
        PIDS=$(lsof -t -i :"$port" || true)
        for pid in $PIDS; do
            kill -9 "$pid" 2>/dev/null || true
        done
        sleep 0.5
    fi
done

echo "Generating frontend config.js..."
mkdir -p "frontend/js"
cat << EOF > frontend/js/config.js
// Twinsure Client Configuration
var API_BASE_URL = (function() {
    var isLocal = window.location.port === '$FRONTEND_PORT' || 
                  window.location.hostname === 'localhost' || 
                  window.location.hostname === '127.0.0.1';
    return isLocal ? (window.location.protocol + '//' + window.location.hostname + ':$BACKEND_PORT') : '/backend/api';
})();
window.API_BASE_URL = API_BASE_URL;
EOF

# PHP Runtime Auto-Detection
LOCAL_PHP="$ROOT_DIR/.local/php-runtime/usr/bin/php"
PHP_ARGS=()

if [ -f "$LOCAL_PHP" ]; then
    echo "Detected local PHP runtime at .local/php-runtime. Configuring environment..."
    PHP_BIN="$LOCAL_PHP"
    
    # Configure shared libraries and extension paths for the local PHP build
    PHP_LIB_DIR="$ROOT_DIR/.local/php-runtime/usr/lib"
    PHP_EXT_DIR="$ROOT_DIR/.local/php-runtime/usr/lib/php/modules"
    PHP_INI_DIR="$ROOT_DIR/.local/php-runtime/etc/php"
    PHP_SCAN_DIR="$PHP_INI_DIR/conf.d"

    export LD_LIBRARY_PATH="$PHP_LIB_DIR${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"
    export PHPRC="$PHP_INI_DIR"
    export PHP_INI_SCAN_DIR="$PHP_SCAN_DIR"
    
    PHP_ARGS=("-d" "extension_dir=$PHP_EXT_DIR")
else
    # Fallback to system php
    if command -v php &> /dev/null; then
        echo "Using system PHP installation..."
        PHP_BIN="php"
    else
        echo -e "\033[0;31mError: php command not found, and no local runtime found at .local/php-runtime.\033[0m"
        echo "Please install PHP on your system or run in an environment with PHP available."
        exit 1
    fi
fi

echo -e "\033[0;34m========================================================\033[0m"
echo -e "\033[1;32mStarting Twinsure Services...\033[0m"
echo -e "Backend API : \033[4;36mhttp://$HOST:$BACKEND_PORT\033[0m"
echo -e "Frontend UI : \033[4;36mhttp://$HOST:$FRONTEND_PORT\033[0m"
echo -e "Database    : \033[1;33m${MONGODB_DATABASE:-N/A}\033[0m"
echo -e "\033[0;34m========================================================\033[0m"
echo ""

# Keep track of running background server process IDs (PIDs)
BACKEND_PID=""
FRONTEND_PID=""

# Define cleanup function to kill background processes on script exit or interrupt
cleanup() {
    echo ""
    echo -e "\033[1;31mStopping TwinSure servers...\033[0m"
    
    if [ -n "$BACKEND_PID" ]; then
        if kill -0 "$BACKEND_PID" 2>/dev/null; then
            kill "$BACKEND_PID"
            echo "Stopped Backend Server (PID $BACKEND_PID)"
        fi
    fi
    
    if [ -n "$FRONTEND_PID" ]; then
        if kill -0 "$FRONTEND_PID" 2>/dev/null; then
            kill "$FRONTEND_PID"
            echo "Stopped Frontend Server (PID $FRONTEND_PID)"
        fi
    fi
    
    echo -e "\033[1;32mServers stopped successfully.\033[0m"
    exit 0
}

# Trap Ctrl+C (SIGINT) and SIGTERM to run cleanup
trap cleanup SIGINT SIGTERM

echo "Starting Backend Server..."
(cd backend/api && exec "$PHP_BIN" "${PHP_ARGS[@]}" -S "$HOST:$BACKEND_PORT") &
BACKEND_PID=$!

echo "Starting Frontend Server..."
(cd frontend && exec "$PHP_BIN" "${PHP_ARGS[@]}" -S "$HOST:$FRONTEND_PORT") &
FRONTEND_PID=$!

echo ""
echo -e "\033[1;35mTwinSure servers are running in the background.\033[0m"
echo -e "\033[1;33mPress [Ctrl+C] to stop all services.\033[0m"
echo ""

# Wait for background processes to keep the main shell active and responsive to traps
wait
