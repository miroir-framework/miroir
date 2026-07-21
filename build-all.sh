#!/usr/bin/env bash
# =============================================================================
# build-all.sh  –  Build all Miroir packages and produce one or more artefacts.
#
# Usage:
#   ./build-all.sh [SCOPE] [CORE_BUILD_MODE] [ARTEFACT...]
#   ./build-all.sh incremental <PACKAGE> [CORE_BUILD_MODE] [ARTEFACT...]
#
# SCOPE (incremental build control):
#   (default)     Resume from last failed package if tmp/build-all-state exists
#                 and records an error; otherwise full build.
#   full          Full build (ignore previous state).
#   reset         Delete tmp/build-all-state, then full build.
#   incremental   Build from <PACKAGE> upwards (skip earlier packages).
#
# CORE_BUILD_MODE:
#   build      Standard build - faster, but does not regenerate TypeScript types from Jzod schemas.
#   devBuild   Full devBuild (default) – regenerates TypeScript types from Jzod schemas
#              before building miroir-core. Required when schemas in
#              packages/miroir-test-app_deployment-miroir/assets are modified.
#   typecheck  Type-check all packages with tsc --noEmit (no emit, no artefacts by default).
#              Workspace packages resolve types from dist/, so run a normal build first
#              if declaration files are missing or stale.
#
# ARTEFACT (one or more; default: server-binary; none when CORE_BUILD_MODE is typecheck):
#   server-binary   Self-contained server binary  (npm run build:release)
#   electron        Electron desktop application  (dist via electron-builder)
#   docker          Docker container image         (calls build_miroir.sh; optional tag argument)
#   vm              Virtual machine image          (not yet implemented)
#
# State file (tmp/build-all-state):
#   Records each successfully built package with a timestamp, and the last
#   build error (package, message, timestamp) when a build fails.
#
# Examples:
#   ./build-all.sh                         # full, or resume from last failure
#   ./build-all.sh full                    # force full build
#   ./build-all.sh reset                   # clear state, full build
#   ./build-all.sh incremental miroir-core # from miroir-core upwards
#   ./build-all.sh devBuild                # devBuild core → server binary
#   ./build-all.sh build electron          # explicit flags, build electron app
#   ./build-all.sh typecheck               # tsc --noEmit across all packages
#   ./build-all.sh docker                  # build Docker image with default tag
#   ./build-all.sh docker mycustomtag      # build Docker image with custom tag
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/ci/lib/common.sh"

cd "$SCRIPT_DIR"

STATE_FILE="$SCRIPT_DIR/tmp/build-all-state"

# ---------------------------------------------------------------------------
# Build order (flat) and parallel stages
# ---------------------------------------------------------------------------
# Flat order defines "upwards" for incremental / resume. Packages listed in the
# same STAGE_* array are eligible to build in parallel when all are selected.
ALL_PACKAGES=(
  jzod
  jzod-ts
  miroir-test-app_deployment-miroir
  miroir-test-app_deployment-admin
  miroir-core
  miroir-localcache-redux
  miroir-localcache-zustand
  miroir-localcache
  miroir-store-bundled
  miroir-store-filesystem
  miroir-store-indexedDb
  miroir-store-postgres
  miroir-store-mongodb
  miroir-react
  miroir-mcp
  miroir-diagram-class
  miroir-cli
  miroir-ai
  miroir-standalone-app
  miroir-test-app_deployment-library
  miroir-test-app_deployment-postgres
)

STAGE_OPTIONAL_JZOD=(jzod)
STAGE_OPTIONAL_JZOD_TS=(jzod-ts)
STAGE_DEPLOY_BOOTSTRAP=(miroir-test-app_deployment-miroir miroir-test-app_deployment-admin)
STAGE_CORE=(miroir-core)
STAGE_CACHES_STORES=(
  miroir-localcache-redux
  miroir-localcache-zustand
  miroir-localcache
  miroir-store-bundled
  miroir-store-filesystem
  miroir-store-indexedDb
  miroir-store-postgres
  miroir-store-mongodb
)
STAGE_UI_SERVICES=(miroir-react miroir-mcp miroir-diagram-class)
STAGE_APPS=(miroir-cli miroir-ai miroir-mcp)
STAGE_STANDALONE=(miroir-standalone-app)
STAGE_DEPLOY_TEST=(miroir-test-app_deployment-library miroir-test-app_deployment-postgres)

# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------
CORE_BUILD_MODE="devBuild"
ARTEFACTS=()
BUILD_SCOPE=""          # full | reset | incremental | "" (auto)
INCREMENTAL_PACKAGE=""
EXPECT_INCREMENTAL_PKG=false
DOCKER_TAG_ARG=""
EXPECT_DOCKER_TAG=false

for arg in "$@"; do
  if $EXPECT_INCREMENTAL_PKG; then
    INCREMENTAL_PACKAGE="$arg"
    EXPECT_INCREMENTAL_PKG=false
    continue
  fi
  if $EXPECT_DOCKER_TAG; then
    DOCKER_TAG_ARG="$arg"
    EXPECT_DOCKER_TAG=false
    continue
  fi
  case "$arg" in
    full|reset)
      BUILD_SCOPE="$arg"
      ;;
    incremental)
      BUILD_SCOPE="incremental"
      EXPECT_INCREMENTAL_PKG=true
      ;;
    build)
      CORE_BUILD_MODE="build"
      ;;
    devBuild|devbuild)
      CORE_BUILD_MODE="devBuild"
      ;;
    typecheck)
      CORE_BUILD_MODE="typecheck"
      ;;
    electron|server-binary|vm)
      ARTEFACTS+=("$arg")
      ;;
    docker)
      ARTEFACTS+=("$arg")
      EXPECT_DOCKER_TAG=true
      ;;
    -h|--help)
      sed -n '2,48p' "$0"
      exit 0
      ;;
    *)
      echo "ERROR: Unknown argument: '$arg'" >&2
      echo "Run '$0 --help' for usage." >&2
      exit 1
      ;;
  esac
done

if $EXPECT_INCREMENTAL_PKG; then
  die "incremental mode requires a package name (e.g. './build-all.sh incremental miroir-core')"
fi

# Default artefact (none for typecheck)
if [[ ${#ARTEFACTS[@]} -eq 0 && "$CORE_BUILD_MODE" != "typecheck" ]]; then
  ARTEFACTS=("server-binary")
fi

# ---------------------------------------------------------------------------
# State file helpers
# ---------------------------------------------------------------------------
iso_now() {
  date -Iseconds 2>/dev/null || date +%Y-%m-%dT%H:%M:%S%z
}

package_index() {
  local target="$1"
  local i
  for i in "${!ALL_PACKAGES[@]}"; do
    if [[ "${ALL_PACKAGES[$i]}" == "$target" ]]; then
      echo "$i"
      return 0
    fi
  done
  return 1
}

state_has_error() {
  [[ -f "$STATE_FILE" ]] || return 1
  local pkg
  pkg=$(grep -E '^error_package=' "$STATE_FILE" 2>/dev/null | head -1 | cut -d= -f2- || true)
  [[ -n "${pkg:-}" ]]
}

state_error_package() {
  grep -E '^error_package=' "$STATE_FILE" 2>/dev/null | head -1 | cut -d= -f2-
}

# Load successful package → timestamp into SUCCESS_AT associative array.
declare -A SUCCESS_AT=()

load_success_map() {
  SUCCESS_AT=()
  [[ -f "$STATE_FILE" ]] || return 0
  local line name ts
  while IFS= read -r line || [[ -n "$line" ]]; do
    case "$line" in
      success:*=*)
        name="${line#success:}"
        ts="${name#*=}"
        name="${name%%=*}"
        SUCCESS_AT["$name"]="$ts"
        ;;
    esac
  done < "$STATE_FILE"
}

write_state_header() {
  local status="${1:-in_progress}"
  mkdir -p "$(dirname "$STATE_FILE")"
  local tmp
  tmp="${STATE_FILE}.tmp.$$"
  {
    echo "# Miroir build-all state — managed by build-all.sh"
    echo "updated_at=$(iso_now)"
    echo "core_build_mode=$CORE_BUILD_MODE"
    echo "status=$status"
    echo "error_package=${ERROR_PACKAGE:-}"
    echo "error_at=${ERROR_AT:-}"
    echo "error_message=${ERROR_MESSAGE:-}"
    echo "#"
    echo "# Successfully built packages (name=timestamp):"
    local pkg
    for pkg in "${ALL_PACKAGES[@]}"; do
      if [[ -n "${SUCCESS_AT[$pkg]+x}" ]]; then
        echo "success:${pkg}=${SUCCESS_AT[$pkg]}"
      fi
    done
  } > "$tmp"
  mv "$tmp" "$STATE_FILE"
}

record_package_success() {
  local pkg="$1"
  SUCCESS_AT["$pkg"]="$(iso_now)"
  ERROR_PACKAGE=""
  ERROR_AT=""
  ERROR_MESSAGE=""
  write_state_header "in_progress"
  echo "  [STATE] recorded success: $pkg at ${SUCCESS_AT[$pkg]}"
}

record_package_failure() {
  local pkg="$1"
  local msg="${2:-build failed}"
  # Strip newlines / equals for single-line storage
  msg="${msg//$'\n'/ }"
  msg="${msg//=/:}"
  ERROR_PACKAGE="$pkg"
  ERROR_AT="$(iso_now)"
  ERROR_MESSAGE="$msg"
  write_state_header "failed"
  echo "  [STATE] recorded failure: $pkg at $ERROR_AT" >&2
  echo "  [STATE] state file → $STATE_FILE" >&2
}

clear_error_mark_success() {
  ERROR_PACKAGE=""
  ERROR_AT=""
  ERROR_MESSAGE=""
  write_state_header "ok"
}

# ---------------------------------------------------------------------------
# Resolve build scope (full / resume / incremental-from)
# ---------------------------------------------------------------------------
ERROR_PACKAGE=""
ERROR_AT=""
ERROR_MESSAGE=""
START_INDEX=0
SKIP_SUCCESSFUL=false

resolve_build_scope() {
  if [[ "$BUILD_SCOPE" == "reset" ]]; then
    rm -f "$STATE_FILE"
    echo "[SCOPE] reset — removed state file, performing full build"
    BUILD_SCOPE="full"
  fi

  if [[ -z "$BUILD_SCOPE" ]]; then
    if [[ ! -f "$STATE_FILE" ]]; then
      BUILD_SCOPE="full"
      echo "[SCOPE] no state file — full build"
    elif ! state_has_error; then
      BUILD_SCOPE="full"
      echo "[SCOPE] state file has no error — full build"
    else
      BUILD_SCOPE="resume"
      INCREMENTAL_PACKAGE="$(state_error_package)"
      echo "[SCOPE] resume from last failed package: $INCREMENTAL_PACKAGE"
    fi
  fi

  case "$BUILD_SCOPE" in
    full)
      SUCCESS_AT=()
      ERROR_PACKAGE=""
      ERROR_AT=""
      ERROR_MESSAGE=""
      START_INDEX=0
      SKIP_SUCCESSFUL=false
      write_state_header "in_progress"
      echo "[SCOPE] full build"
      ;;
    incremental)
      if [[ -z "$INCREMENTAL_PACKAGE" ]]; then
        die "incremental mode requires a package name"
      fi
      local idx
      if ! idx=$(package_index "$INCREMENTAL_PACKAGE"); then
        die "unknown package for incremental build: '$INCREMENTAL_PACKAGE'"
      fi
      load_success_map
      # Drop success marks from start package upwards so they are rebuilt.
      local pkg i
      for i in "${!ALL_PACKAGES[@]}"; do
        if (( i >= idx )); then
          pkg="${ALL_PACKAGES[$i]}"
          unset "SUCCESS_AT[$pkg]" || true
        fi
      done
      START_INDEX=$idx
      SKIP_SUCCESSFUL=false
      ERROR_PACKAGE=""
      ERROR_AT=""
      ERROR_MESSAGE=""
      write_state_header "in_progress"
      echo "[SCOPE] incremental from $INCREMENTAL_PACKAGE (index $START_INDEX) upwards"
      ;;
    resume)
      load_success_map
      if [[ -z "$INCREMENTAL_PACKAGE" ]]; then
        die "resume mode: no failed package recorded in $STATE_FILE"
      fi
      local idx
      if ! idx=$(package_index "$INCREMENTAL_PACKAGE"); then
        die "unknown failed package in state file: '$INCREMENTAL_PACKAGE'"
      fi
      # Keep prior successes; rebuild failed + anything not yet successful.
      unset "SUCCESS_AT[$INCREMENTAL_PACKAGE]" || true
      START_INDEX=$idx
      SKIP_SUCCESSFUL=true
      ERROR_PACKAGE=""
      ERROR_AT=""
      ERROR_MESSAGE=""
      write_state_header "in_progress"
      echo "[SCOPE] resume from $INCREMENTAL_PACKAGE — skipping previously successful packages"
      ;;
    *)
      die "internal error: unknown BUILD_SCOPE='$BUILD_SCOPE'"
      ;;
  esac
}

# True if this package should be built in the current scope.
should_build_package() {
  local pkg="$1"
  local idx
  if ! idx=$(package_index "$pkg"); then
    return 1
  fi
  if (( idx < START_INDEX )); then
    return 1
  fi
  if $SKIP_SUCCESSFUL && [[ -n "${SUCCESS_AT[$pkg]+x}" ]]; then
    return 1
  fi
  return 0
}

package_available() {
  local pkg="$1"
  case "$pkg" in
    jzod)
      [[ -d "$SCRIPT_DIR/../../jzod" ]]
      ;;
    jzod-ts)
      [[ -d "$SCRIPT_DIR/../../jzod-ts" ]]
      ;;
    *)
      [[ -d "$SCRIPT_DIR/packages/$pkg" ]]
      ;;
  esac
}

# Build / typecheck a single package; update state on success or failure.
build_one_package() {
  local pkg="$1"
  if ! package_available "$pkg"; then
    echo "  [SKIP] $pkg (not present)"
    return 0
  fi
  if ! should_build_package "$pkg"; then
    if [[ -n "${SUCCESS_AT[$pkg]+x}" ]]; then
      echo "  [SKIP] $pkg (already built at ${SUCCESS_AT[$pkg]})"
    else
      echo "  [SKIP] $pkg (before incremental start)"
    fi
    return 0
  fi

  echo "  build $pkg"
  local rc=0
  set +e
  case "$pkg" in
    jzod)
      (cd "$SCRIPT_DIR/../../jzod" && npm run build)
      rc=$?
      ;;
    jzod-ts)
      (cd "$SCRIPT_DIR/../../jzod-ts" && npm run build)
      rc=$?
      ;;
    miroir-core)
      if [[ "$CORE_BUILD_MODE" == "devBuild" ]]; then
        npm run devBuild -w miroir-core
        rc=$?
      elif [[ "$CORE_BUILD_MODE" == "typecheck" ]]; then
        typecheck_package miroir-core
        rc=$?
      else
        npm run build -w miroir-core
        rc=$?
      fi
      ;;
    *)
      if [[ "$CORE_BUILD_MODE" == "typecheck" ]]; then
        typecheck_package "$pkg"
        rc=$?
      else
        npm run build -w "$pkg"
        rc=$?
      fi
      ;;
  esac
  set -e

  if [[ $rc -eq 0 ]]; then
    record_package_success "$pkg"
    return 0
  fi
  record_package_failure "$pkg" "exit code $rc"
  return "$rc"
}

# Run selected packages from a stage in parallel; record per-package results.
run_stage_packages() {
  local label="$1"
  shift
  local selected=()
  local pkg
  for pkg in "$@"; do
    if ! package_available "$pkg"; then
      echo "  [SKIP] $pkg (not present)"
      continue
    fi
    if should_build_package "$pkg"; then
      selected+=("$pkg")
    else
      if [[ -n "${SUCCESS_AT[$pkg]+x}" ]]; then
        echo "  [SKIP] $pkg (already built at ${SUCCESS_AT[$pkg]})"
      else
        echo "  [SKIP] $pkg (before incremental start)"
      fi
    fi
  done

  if [[ ${#selected[@]} -eq 0 ]]; then
    echo "  [SKIP] $label (nothing to build in this stage)"
    return 0
  fi

  if [[ ${#selected[@]} -eq 1 ]]; then
    build_one_package "${selected[0]}"
    return $?
  fi

  local status_dir
  status_dir=$(mktemp -d "${TMPDIR:-/tmp}/build-all-XXXXXX")
  local pids=()
  local pid

  for pkg in "${selected[@]}"; do
    (
      set +e
      echo "  build $pkg"
      local rc=0
      case "$pkg" in
        jzod)
          (cd "$SCRIPT_DIR/../../jzod" && npm run build)
          rc=$?
          ;;
        jzod-ts)
          (cd "$SCRIPT_DIR/../../jzod-ts" && npm run build)
          rc=$?
          ;;
        miroir-core)
          if [[ "$CORE_BUILD_MODE" == "devBuild" ]]; then
            npm run devBuild -w miroir-core
            rc=$?
          elif [[ "$CORE_BUILD_MODE" == "typecheck" ]]; then
            typecheck_package miroir-core
            rc=$?
          else
            npm run build -w miroir-core
            rc=$?
          fi
          ;;
        *)
          if [[ "$CORE_BUILD_MODE" == "typecheck" ]]; then
            typecheck_package "$pkg"
            rc=$?
          else
            npm run build -w "$pkg"
            rc=$?
          fi
          ;;
      esac
      echo "$rc" > "$status_dir/$pkg"
      exit "$rc"
    ) &
    pids+=($!)
  done

  for pid in "${pids[@]}"; do
    wait "$pid" || true
  done

  local any_failed=0
  local first_failed=""
  local first_rc=1
  for pkg in "${selected[@]}"; do
    local rc=1
    if [[ -f "$status_dir/$pkg" ]]; then
      rc=$(cat "$status_dir/$pkg")
    fi
    if [[ "$rc" == "0" ]]; then
      SUCCESS_AT["$pkg"]="$(iso_now)"
      echo "  [STATE] recorded success: $pkg at ${SUCCESS_AT[$pkg]}"
    else
      any_failed=1
      unset "SUCCESS_AT[$pkg]" || true
      if [[ -z "$first_failed" ]]; then
        first_failed="$pkg"
        first_rc="$rc"
      fi
    fi
  done
  rm -rf "$status_dir"

  if [[ $any_failed -ne 0 ]]; then
    record_package_failure "$first_failed" "exit code $first_rc"
    echo "ERROR: parallel stage '$label' failed (first failure: $first_failed)." >&2
    return 1
  fi
  # Persist all parallel successes in one write.
  ERROR_PACKAGE=""
  ERROR_AT=""
  ERROR_MESSAGE=""
  write_state_header "in_progress"
  return 0
}

resolve_build_scope

# ---------------------------------------------------------------------------
# Step 1 – Optional: Build jzod if present
# ---------------------------------------------------------------------------
step "1/9 · jzod (optional)"
t0=$(now_secs)
run_stage_packages "jzod" "${STAGE_OPTIONAL_JZOD[@]}"
record_time "1/9  jzod (optional)" "$t0"

# ---------------------------------------------------------------------------
# Step 2 – Optional: Build jzod-ts if present
# ---------------------------------------------------------------------------
step "2/9 · jzod-ts (optional)"
t0=$(now_secs)
run_stage_packages "jzod-ts" "${STAGE_OPTIONAL_JZOD_TS[@]}"
record_time "2/9  jzod-ts (optional)" "$t0"

# ---------------------------------------------------------------------------
# Step 3 – Deployment packages (schema definitions; no miroir-core dependency)
# ---------------------------------------------------------------------------
step "3/9  · miroir-test-app_deployment-miroir & miroir-test-app_deployment-admin"
t0=$(now_secs)
run_stage_packages "deploy-bootstrap" "${STAGE_DEPLOY_BOOTSTRAP[@]}"
record_time "3/9  miroir-test-app_deployment-miroir & miroir-test-app_deployment-admin" "$t0"

# ---------------------------------------------------------------------------
# Step 4 – miroir-core (optionally with type generation)
# ---------------------------------------------------------------------------
step "4/9 · miroir-core ($CORE_BUILD_MODE)"
t0=$(now_secs)
run_stage_packages "miroir-core" "${STAGE_CORE[@]}"
record_time "4/9  miroir-core ($CORE_BUILD_MODE)" "$t0"

# ---------------------------------------------------------------------------
# Step 5 – Local caches & store backends (all depend only on miroir-core)
# ---------------------------------------------------------------------------
step "5/9 · localcaches & stores"
t0=$(now_secs)
run_stage_packages "localcaches & stores" "${STAGE_CACHES_STORES[@]}"
record_time "5/9  localcaches & stores" "$t0"

# ---------------------------------------------------------------------------
# Step 6 – UI library and service packages
# ---------------------------------------------------------------------------
step "6/9 · miroir-react, miroir-mcp, miroir-diagram-class"
t0=$(now_secs)
run_stage_packages "ui & services" "${STAGE_UI_SERVICES[@]}"
record_time "6/9  miroir-react, miroir-mcp, miroir-diagram-class" "$t0"

# ---------------------------------------------------------------------------
# Step 7 – Application-level packages
# ---------------------------------------------------------------------------
step "7/9 · miroir-cli, miroir-ai, miroir-mcp"
t0=$(now_secs)
run_stage_packages "apps" "${STAGE_APPS[@]}"
record_time "7/9  miroir-cli, miroir-ai, miroir-mcp" "$t0"

# ---------------------------------------------------------------------------
# Step 8 – Application-level packages
# ---------------------------------------------------------------------------
step "8/9 · miroir-standalone-app"
t0=$(now_secs)
run_stage_packages "standalone-app" "${STAGE_STANDALONE[@]}"
record_time "8/9  miroir-standalone-app" "$t0"

# ---------------------------------------------------------------------------
# Step 9 – Test/example deployment packages
# ---------------------------------------------------------------------------
step "9/9 · miroir-test-app_deployment-library & miroir-test-app_deployment-postgres"
t0=$(now_secs)
run_stage_packages "deploy-test" "${STAGE_DEPLOY_TEST[@]}"
record_time "9/9  miroir-test-app_deployment-library & miroir-test-app_deployment-postgres" "$t0"

# ---------------------------------------------------------------------------
# Artefact-specific builds with timing
# ---------------------------------------------------------------------------
for artefact in "${ARTEFACTS[@]+"${ARTEFACTS[@]}"}"; do
  case "$artefact" in

    electron)
      step "ARTEFACT · electron desktop application"
      t0=$(now_secs)
      npm run dist -w miroir-standalone-app-electron
      record_time "ARTEFACT  electron desktop application" "$t0"
      echo ""
      echo "Electron distributable → packages/miroir-standalone-app-electron/release/"
      ;;

    server-binary)
      step "ARTEFACT · server binary (npm run build:release)"
      t0=$(now_secs)
      npm run build:release -w miroir-server
      record_time "ARTEFACT  server binary (npm run build:release)" "$t0"
      echo ""
      echo "Server binary built → packages/miroir-server/release/"
      ;;

    docker)
      step "ARTEFACT · Docker container image (build_miroir.sh)"
      t0=$(now_secs)
      if [[ -n "$DOCKER_TAG_ARG" ]]; then
        "$SCRIPT_DIR/ci/docker/build_miroir.sh" --tag "$DOCKER_TAG_ARG" "$SCRIPT_DIR/.."
      else
        "$SCRIPT_DIR/ci/docker/build_miroir.sh" "$SCRIPT_DIR/.."
      fi
      record_time "ARTEFACT  docker image (build_miroir.sh)" "$t0"
      ;;

    vm)
      step "ARTEFACT · virtual machine image (not yet implemented)"
      echo "ERROR: 'vm' artefact is not yet implemented." >&2
      exit 1

  esac
done

clear_error_mark_success

print_timing_summary

echo ""
echo "========================================================================"
if [[ ${#ARTEFACTS[@]} -eq 0 ]]; then
  echo "  ALL DONE  (core: $CORE_BUILD_MODE | scope: $BUILD_SCOPE | artefacts: none)"
else
  echo "  ALL DONE  (core: $CORE_BUILD_MODE | scope: $BUILD_SCOPE | artefacts: ${ARTEFACTS[*]})"
fi
echo "  State → $STATE_FILE"
echo "========================================================================"
