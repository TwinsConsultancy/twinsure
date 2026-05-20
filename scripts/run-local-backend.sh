#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PHP_BIN="$ROOT_DIR/.local/php-runtime/usr/bin/php"
PHP_LIB_DIR="$ROOT_DIR/.local/php-runtime/usr/lib"
PHP_EXT_DIR="$ROOT_DIR/.local/php-runtime/usr/lib/php/modules"
PHP_INI_DIR="$ROOT_DIR/.local/php-runtime/etc/php"
PHP_SCAN_DIR="$PHP_INI_DIR/conf.d"

export LD_LIBRARY_PATH="$PHP_LIB_DIR${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"
export PHPRC="$PHP_INI_DIR"
export PHP_INI_SCAN_DIR="$PHP_SCAN_DIR"

exec "$PHP_BIN" \
  -d "extension_dir=$PHP_EXT_DIR" \
  -S 127.0.0.1:8000 \
  -t "$ROOT_DIR/backend/api"
