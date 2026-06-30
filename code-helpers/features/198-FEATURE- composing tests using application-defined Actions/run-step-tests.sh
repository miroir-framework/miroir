#!/usr/bin/env bash
# Feature 198 — run TDD progress / non-regression tests per implementation step.
# Usage:
#   ./run-step-tests.sh <step>           # e.g. 1.1, 1.8, 2.6
#   ./run-step-tests.sh <step> green     # progress (GREEN) only (default for most steps)
#   ./run-step-tests.sh <step> red       # progress (RED) — same as green for most steps
#   ./run-step-tests.sh <step> regression
#   ./run-step-tests.sh <step> all       # green + regression
#
# Run from repo root (miroir-app-dev).

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
PACKAGES="$ROOT/packages"

# App-stack integ tests need VITE_MIROIR_* — see docs/reference/testing.md (--profile on testByFile).
MIROIR_STANDALONE_INTeg_PROFILE="${MIROIR_STANDALONE_INTeg_PROFILE:-emulatedServer-sql}"

step="${1:-}"
mode="${2:-all}"

if [[ -z "$step" ]]; then
  echo "Usage: $0 <step> [green|red|regression|all]"
  echo "Steps: 1.1 1.2 1.3 1.4 1.5 1.6 1.7 1.8 | 2.1 2.2 2.3 2.4 2.5 2.6 2.7 2.8 2.9 2.10"
  exit 1
fi

run_core_file() {
  (cd "$PACKAGES/miroir-core" && npm run testByFile -- "$1")
}

# Parse suite keys from registry source (no tsx import — registry top-level await hangs the shell).
list_miroir_core_suite_keys() {
  sed -n '/^const MIROIR_TEST_SUITE_REGISTRY_NAMES = \[/,/^\] as const;/p' \
    "$PACKAGES/miroir-core/src/5_tests/miroirCoreTestSuiteRegistry.ts" \
    | grep -oE '"[^"]+"' | tr -d '"'
}

run_core_all() {
  (cd "$PACKAGES/miroir-core" && npm run testMiroir)
}

# Full miroir-core MiroirTest suite run minus suites that already fail on master (not Phase 1 regressions).
run_core_gate() {
  local exclude_suites="${MIROIR_GATE_EXCLUDE_SUITES:-resolveConditionalSchema}"
  local exclude_pattern
  exclude_pattern="$(echo "$exclude_suites" | tr ',' '|' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//;s/[[:space:]]*/|/g')"
  local suites
  suites="$(list_miroir_core_suite_keys | grep -Ev "^(${exclude_pattern})$" | paste -sd, -)"
  echo "miroir-core gate: running ${suites//,/+, } (excluded: ${exclude_suites})"
  (cd "$PACKAGES/miroir-core" && MIROIR_TEST_SUITES="$suites" npm run testMiroir)
}

run_library_gate() {
  # AuthorList + LibraryHome fail on master too (library report ifThenElseMMLS).
  (cd "$PACKAGES/miroir-test-app_deployment-library" && npm run testByFile -- tests/modelValidation.unit.test.ts -t "^(?!.*(AuthorList|LibraryHome))")
}

run_core_pattern() {
  (cd "$PACKAGES/miroir-core" && npm test -- "$1")
}

run_standalone_unit() {
  (cd "$PACKAGES/miroir-standalone-app" && npm run testByFile -- "$@")
}

# Vitest file-name filter (substring), with integration profile for VITE_MIROIR_TEST_CONFIG_FILENAME.
run_standalone_integ() {
  local pattern="$1"
  echo "standalone integ (profile=${MIROIR_STANDALONE_INTeg_PROFILE}): ${pattern}"
  (cd "$PACKAGES/miroir-standalone-app" && npm run testByFile -- --profile "$MIROIR_STANDALONE_INTeg_PROFILE" "$pattern")
}

run_standalone_file() {
  run_standalone_unit "$@"
}

# Prefer run_standalone_integ / run_standalone_unit — npm test -t loads all vitest entries and breaks integ stubs.
run_standalone_pattern() {
  run_standalone_integ "$1"
}

run_standalone_testmiroir_integ() {
  local suites="$1"
  shift || true
  (cd "$PACKAGES/miroir-standalone-app" && npm run testMiroir -- --profile "$MIROIR_STANDALONE_INTeg_PROFILE" --suites "$suites" --mode integ "$@")
}

run_library_file() {
  (cd "$PACKAGES/miroir-test-app_deployment-library" && npm run testByFile -- "$1")
}

run_library_pattern() {
  (cd "$PACKAGES/miroir-test-app_deployment-library" && npm test -- "$1")
}

run_deployment_validation() {
  local pkg="$1"
  (cd "$PACKAGES/$pkg" && npm run testByFile -- tests/modelValidation.unit.test.ts)
}

run_localcache_redux() {
  if [[ -n "${1:-}" ]]; then
    (cd "$PACKAGES/miroir-localcache-redux" && npm run vitest -- "$1")
  else
    (cd "$PACKAGES/miroir-localcache-redux" && npm run vitest)
  fi
}

run_localcache_zustand() {
  if [[ -n "${1:-}" ]]; then
    (cd "$PACKAGES/miroir-localcache-zustand" && npm run vitest -- "$1")
  else
    (cd "$PACKAGES/miroir-localcache-zustand" && npm run vitest)
  fi
}

run_mcp() {
  if [[ -n "${1:-}" ]]; then
    (cd "$PACKAGES/miroir-mcp" && npm test -- "$1")
  else
    (cd "$PACKAGES/miroir-mcp" && npm test)
  fi
}

# MCP HTTP integ needs persistence server on :4080 — gate runs unit tests only (Phase 1 schema paths).
run_mcp_gate() {
  (cd "$PACKAGES/miroir-mcp" && npm run testByFile -- \
    tests/unit/jzodElementToJsonSchema.unit.test.ts \
    tests/unit/jzodElementToTS.unit.test.ts \
    tests/unit/mcpToolDescriptionFromActionDefinition.unit.test.ts)
}

run_cli() {
  if [[ -n "${1:-}" ]]; then
    (cd "$PACKAGES/miroir-cli" && npm test -- "$1")
  else
    (cd "$PACKAGES/miroir-cli" && npm test)
  fi
}

section() {
  echo ""
  echo "========== $1 =========="
}

want_green() { [[ "$mode" == "all" || "$mode" == "green" || "$mode" == "red" ]]; }
want_regression() { [[ "$mode" == "all" || "$mode" == "regression" ]]; }

case "$step" in
  1.1)
    want_green && section "1.1 progress" && run_core_file tests/1_core/schemaForDeployment.unit.test.ts
    want_regression && section "1.1 non-regression" && {
      run_core_file tests/1_core/jzod/jzodTypeCheck.test.ts
      run_core_file tests/1_core/jzod/resolveSchemaReferenceInContext.test.ts
      run_core_pattern jzodTransitiveDependencySet
    }
    ;;
  1.2)
    want_green && section "1.2 progress" && run_localcache_redux currentModelEnvironment
    want_regression && section "1.2 non-regression" && {
      run_localcache_redux
      run_core_file tests/1_core/schemaForDeployment.unit.test.ts
      run_standalone_integ DomainController.integ
    }
    ;;
  1.3)
    want_green && section "1.3 progress" && run_localcache_zustand currentModelEnvironment
    want_regression && section "1.3 non-regression" && {
      run_standalone_integ "DomainController.integ.Model"
      run_standalone_unit tests/3_controllers/DomainController.React.Model.undo-redo.test.tsx
      run_core_file tests/1_core/schemaForDeployment.unit.test.ts
    }
    ;;
  1.4)
    want_green && section "1.4 progress" && run_standalone_file tests/4_view/useCurrentModelEnvironment.unit.test.tsx
    want_regression && section "1.4 non-regression" && {
      run_standalone_unit tests/4_view/JzodElementEditor.test.tsx
      run_standalone_integ ReportPage.integ
      run_standalone_unit tests/helpers/RunnerTestSession.unit.test.ts
      run_standalone_unit tests/helpers/IntegrationTestSession.unit.test.ts
    }
    ;;
  1.5)
    want_green && section "1.5 progress" && run_core_file tests/1_core/modelEnvironment.unit.test.ts
    want_regression && section "1.5 non-regression" && {
      run_core_file tests/4_services/runMiroirTestSuiteInProcess.unit.test.ts
      run_core_file tests/4_services/miroirTestTools.unit.test.ts
      run_core_file tests/2_domain/resolveCompositeActionTemplate.unit.test.ts
      run_core_file tests/1_core/schemaForDeployment.unit.test.ts
    }
    ;;
  1.6)
    want_green && section "1.6 progress (MCP jzod unit)" && {
      (cd "$PACKAGES/miroir-mcp" && npm run testByFile -- tests/unit/jzodElementToJsonSchema.unit.test.ts tests/unit/jzodElementToTS.unit.test.ts)
    }
    want_regression && section "1.6 non-regression" && {
      (cd "$PACKAGES/miroir-mcp" && npm run testByFile -- tests/unit/jzodElementToJsonSchema.unit.test.ts)
      (cd "$PACKAGES/miroir-mcp" && npm run testByFile -- tests/unit/jzodElementToTS.unit.test.ts)
      (cd "$PACKAGES/miroir-mcp" && npm run testByFile -- tests/integration/mcpTools.integ.test.ts)
      run_cli
    }
    ;;
  1.7)
    want_green && section "1.7 progress (deployment modelValidation)" && {
      run_library_file tests/modelValidation.unit.test.ts
      run_deployment_validation miroir-test-app_deployment-admin
    }
    want_regression && section "1.7 non-regression" && {
      run_standalone_unit tests/helpers/RunnerTestSession.unit.test.ts
      run_standalone_unit tests/helpers/IntegrationTestSession.unit.test.ts
    }
    ;;
  1.8)
    section "1.8 Phase 1 regression gate" && {
      run_core_file tests/1_core/schemaForDeployment.unit.test.ts
      run_core_file tests/1_core/jzod/jzodTypeCheck.test.ts
      run_core_gate
      run_localcache_redux
      run_library_gate
      # run_deployment_validation miroir-test-app_deployment-miroir
      run_deployment_validation miroir-test-app_deployment-admin
      run_standalone_unit tests/4_view/JzodElementEditor.test.tsx
      # applicative.Library.*.integ.test.tsx are empty shells — excluded from gate
      run_mcp_gate
      # run_cli
    }
    ;;
  2.1)
    want_green && section "2.1 progress" && run_core_pattern "app-specific endpoints"
    want_regression && section "2.1 non-regression" && run_core_file tests/1_core/schemaForDeployment.unit.test.ts
    ;;
  2.2)
    want_green && section "2.2 progress" && run_core_pattern lendDocument
    want_regression && section "2.2 non-regression" && {
      run_core_file tests/1_core/jzod/jzodTypeCheck.test.ts
      run_library_file tests/modelValidation.unit.test.ts
    }
    ;;
  2.3)
    want_green && section "2.3 progress" && run_library_pattern "lendDocument action validates"
    want_regression && section "2.3 non-regression" && {
      run_core_file tests/1_core/schemaForDeployment.unit.test.ts
      run_core_file tests/1_core/jzod/resolveSchemaReferenceInContext.test.ts
      run_library_file tests/modelValidation.unit.test.ts
    }
    ;;
  2.4)
    want_green && section "2.4 progress" && run_core_pattern "actionTemplate resolves"
    want_regression && section "2.4 non-regression" && {
      run_library_pattern "lendDocument action validates"
      run_core_pattern jzodTransitiveDependencySet
      # applicative.Library.BuildPlusRuntimeCompositeAction.integ.test.tsx excluded (empty shell)
    }
    ;;
  2.5)
    want_green && section "2.5 progress" && run_library_pattern "template-form lendDocument"
    want_regression && section "2.5 non-regression" && run_library_pattern "App-action validation"
    ;;
  2.6)
    want_green && section "2.6 acceptance" && run_library_pattern "runner_library MiroirTest"
    want_regression && section "2.6 non-regression" && {
      run_library_pattern "App-action validation"
      run_library_file tests/modelValidation.unit.test.ts
      run_core_file tests/4_services/runnerLibraryTestRegistry.unit.test.ts
      run_standalone_unit tests/helpers/RunnerTestSession.unit.test.ts
    }
    ;;
  2.7)
    want_green && section "2.7 progress" && run_core_pattern "Miroir deployment schema does not include"
    want_regression && section "2.7 non-regression" && {
      run_deployment_validation miroir-test-app_deployment-miroir
      run_core_file tests/1_core/jzod/jzodTypeCheck.test.ts
    }
    ;;
  2.8)
    want_green && section "2.8 progress" && run_standalone_pattern "does not recompute schema"
    want_regression && section "2.8 non-regression" && {
      run_standalone_unit tests/4_view/useCurrentModelEnvironment.unit.test.tsx
      run_standalone_integ ReportPage.integ
    }
    ;;
  2.9)
    want_green && section "2.9 performance" && run_core_pattern "completes within 500ms"
    want_regression && section "2.9 non-regression" && run_core_file tests/1_core/schemaForDeployment.unit.test.ts
    ;;
  2.10)
    section "2.10 Phase 2 regression gate" && {
      run_core_file tests/1_core/schemaForDeployment.unit.test.ts
      run_library_pattern "App-action validation"
      run_library_file tests/modelValidation.unit.test.ts
      run_deployment_validation miroir-test-app_deployment-miroir
      run_core_gate
      run_standalone_unit tests/4_view/useCurrentModelEnvironment.unit.test.tsx
      # applicative.Library.*.integ.test.tsx excluded (empty shells)
      run_standalone_unit tests/helpers/RunnerTestSession.unit.test.ts
      run_mcp_gate
      run_cli
    }
    ;;
  *)
    echo "Unknown step: $step"
    exit 1
    ;;
esac

echo ""
echo "Done: step $step mode $mode"
