#!/bin/sh
# =============================================================================
# Miroir Framework — Docker entrypoint
# =============================================================================
# 1. On the very first start (empty /data volume), seeds the volume with the
#    framework bootstrap data and the library demo application.
# 2. Delegates to the command passed as arguments (defaults to starting the
#    Node.js server: node /miroir/packages/miroir-server/dist/server.js).
# =============================================================================
set -e

SEED_DIR=/seed
DATA_DIR=/data

# Determine whether the data volume has already been initialised.
# A volume is considered uninitialised when it is empty (no files or dirs).
is_empty() {
  [ -z "$(ls -A "$1" 2>/dev/null)" ]
}

if is_empty "$DATA_DIR"; then
  echo "[miroir] First run detected — initialising data volume from seed..."
  # Copy seed data preserving directory structure and permissions.
  # The trailing /. on the source ensures hidden files are also copied.
  cp -r "${SEED_DIR}/." "${DATA_DIR}/"
  echo "[miroir] Data volume initialised at ${DATA_DIR}."
  echo "[miroir] Seeded:"
  find "${DATA_DIR}" -maxdepth 3 -type d | sed 's|^|  |'
else
  echo "[miroir] Data volume already initialised — skipping seed."
fi

echo "[miroir] Starting server..."
exec "$@"
