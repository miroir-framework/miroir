#!/usr/bin/env bash
# Feature 199 — run TDD progress / non-regression tests per implementation step.
# Usage:
#   ./run-step-tests.sh <step>           # e.g. 1.5, 3.5, 6.2
#   ./run-step-tests.sh <step> green
#   ./run-step-tests.sh <step> regression
#   ./run-step-tests.sh <step> all       # green + regression
#
# Run from repo root (miroir-app-dev).

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
PACKAGES="$ROOT/packages"

MIROIR_STANDALONE_INTEG_PROFILE="${MIROIR_STANDALONE_INTEG_PROFILE:-emulatedServer-sql}"

step="${1:-}"
mode="${2:-all}"

if [[ -z "$step" ]]; then
  echo "Usage: $0 <step> [green|regression|all]"
  echo "Steps: 1.5 | 2.6 | 3.5 | 4.4 | 5.6 | 6.2 | 7.3"
  exit 1
fi

run_core_file() {
  (cd "$PACKAGES/miroir-core" && npm run testByFile -- "$1")
}

run_core_pattern() {
  (cd "$PACKAGES/miroir-core" && npm test -- "$1")
}

list_miroir_core_suite_keys() {
  sed -n '/^const MIROIR_TEST_SUITE_REGISTRY_NAMES = \[/,/^\] as const;/p' \
    "$PACKAGES/miroir-core/src/5_tests/miroirCoreTestSuiteRegistry.ts" \
    | grep -oE '"[^"]+"' | tr -d '"'
}

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
  (cd "$PACKAGES/miroir-test-app_deployment-library" && npm run testByFile -- tests/modelValidation.unit.test.ts -t "^(?!.*(AuthorList|LibraryHome))")
}

run_miroir_gate() {
  (cd "$PACKAGES/miroir-test-app_deployment-miroir" && npm run testByFile -- tests/modelValidation.unit.test.ts -t "^(?!.*(MiroirWebAppOrDesktopHome|_MiroirDocumentation|reportMiroirRunners|createEntity))")
}

run_standalone_unit() {
  (cd "$PACKAGES/miroir-standalone-app" && npm run testByFile -- "$@")
}

run_standalone_pattern() {
  (cd "$PACKAGES/miroir-standalone-app" && npm test -- "$1")
}

run_standalone_integ() {
  local pattern="$1"
  echo "standalone integ (profile=${MIROIR_STANDALONE_INTEG_PROFILE}): ${pattern}"
  (cd "$PACKAGES/miroir-standalone-app" && npm run testByFile -- --profile "$MIROIR_STANDALONE_INTEG_PROFILE" "$pattern")
}

run_localcache_redux() {
  (cd "$PACKAGES/miroir-localcache-redux" && npm test)
}

run_phase_1_5() {
  echo "=== 199 Phase 1.5 gate ==="
  run_core_file "tests/1_core/schemaResolutionMode.unit.test.ts"
  run_core_file "tests/1_core/schemaForDeployment.unit.test.ts"
  run_core_pattern "jzodTypeCheck"
  (cd "$PACKAGES/miroir-test-app_deployment-library" && npm test -- "App-action validation")
  run_standalone_pattern "useCurrentModelEnvironment"
}

run_phase_2_6() {
  echo "=== 199 Phase 2.6 gate ==="
  run_phase_1_5
  run_core_file "tests/1_core/modelEnvironment.unit.test.ts"
  run_miroir_gate
  (cd "$PACKAGES/miroir-test-app_deployment-library" && npm test -- "App-action validation")
  run_standalone_pattern "typedValueObjectEditorSchema"
  run_standalone_pattern "RunnerTestSession"
  (cd "$PACKAGES/miroir-mcp" && npm test)
  (cd "$PACKAGES/miroir-cli" && npm test)
}

run_phase_3_5() {
  echo "=== 199 Phase 3.5 gate ==="
  run_core_file "tests/1_core/schemaChangeKind.unit.test.ts"
  run_core_file "tests/1_core/schemaForDeployment.unit.test.ts"
  (cd "$PACKAGES/miroir-test-app_deployment-library" && npm test -- "App-action validation")
  run_standalone_pattern "useCurrentModelEnvironment"
}

run_phase_4_4() {
  echo "=== 199 Phase 4.4 gate ==="
  (cd "$PACKAGES/miroir-core" && MIROIR_SCHEMA_MODE=frozen npm test -- modelEnvironment)
  (cd "$PACKAGES/miroir-core" && MIROIR_SCHEMA_MODE=frozen npm test -- FunctionCallTestFixtures)
  (cd "$PACKAGES/miroir-test-app_deployment-library" && npm test -- "App-action validation")
  run_phase_2_6
}

run_phase_5_6() {
  echo "=== 199 Phase 5.6 gate ==="
  run_standalone_unit "tests/4_view/useCurrentModelEnvironment.unit.test.tsx"
  if [[ -d "$PACKAGES/miroir-react/tests" ]]; then
    (cd "$PACKAGES/miroir-react" && npm test -- schemaReloadPolicy)
  fi
  run_standalone_unit "tests/4_view/JzodElementEditor.test.tsx"
  run_standalone_unit "tests/4_view/typedValueObjectEditorSchema.unit.test.ts"
  run_standalone_integ "DomainController.integ.Model"
  run_standalone_pattern "applicative.Library"
  run_standalone_integ "ReportPage.integ"
}

run_phase_6_2() {
  echo "=== 199 Phase 6.2 full acceptance gate ==="
  run_core_file "tests/1_core/schemaResolutionMode.unit.test.ts"
  run_core_file "tests/1_core/schemaChangeKind.unit.test.ts"
  run_core_file "tests/1_core/schemaForDeployment.unit.test.ts"
  run_core_file "tests/1_core/modelEnvironment.unit.test.ts"
  run_core_gate
  run_miroir_gate
  run_library_gate
  (cd "$PACKAGES/miroir-test-app_deployment-library" && npm test -- "App-action validation")
  (cd "$PACKAGES/miroir-test-app_deployment-admin" && npm run testByFile -- tests/modelValidation.unit.test.ts || true)
  (cd "$PACKAGES/miroir-test-app_deployment-designer" && npm run testByFile -- tests/modelValidation.unit.test.ts || true)
  run_standalone_unit "tests/4_view/useCurrentModelEnvironment.unit.test.tsx"
  run_standalone_pattern "RunnerTestSession"
  run_standalone_pattern "typedValueObjectEditorSchema"
  (cd "$PACKAGES/miroir-mcp" && npm test)
  (cd "$PACKAGES/miroir-cli" && npm test)
  run_localcache_redux
  (cd "$PACKAGES/miroir-core" && MIROIR_SCHEMA_MODE=frozen npm test -- modelEnvironment)
}

run_phase_7_3() {
  echo "=== 199 Phase 7.3 ModelEnvironmentSync gate ==="
  run_standalone_unit "tests/4_view/useCurrentModelEnvironment.unit.test.tsx"
  if [[ -d "$PACKAGES/miroir-react/tests" ]]; then
    (cd "$PACKAGES/miroir-react" && npm test -- schemaReloadPolicy)
  fi
  run_standalone_unit "tests/4_view/typedValueObjectEditorSchema.unit.test.ts"
}

run_step() {
  case "$step" in
    1.5) run_phase_1_5 ;;
    2.6) run_phase_2_6 ;;
    3.5) run_phase_3_5 ;;
    4.4) run_phase_4_4 ;;
    5.6) run_phase_5_6 ;;
    6.2) run_phase_6_2 ;;
    7.3) run_phase_7_3 ;;
    *)
      echo "Unknown step: $step"
      echo "Valid: 1.5 2.6 3.5 4.4 5.6 6.2 7.3"
      exit 1
      ;;
  esac
}

case "$mode" in
  green|red|all)
    run_step
    ;;
  regression)
    run_step
    ;;
  *)
    echo "Unknown mode: $mode (use green, regression, or all)"
    exit 1
    ;;
esac

echo "=== Step $step ($mode) complete ==="
