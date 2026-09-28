#!/bin/bash
# MiroirTest migration spot-checks (Feature #196).
# Prefer: npm run testMiroir -w miroir-core -- --suites <registryKey> --mode unit|integration
# Registry keys: packages/miroir-core/tests/helpers/miroirTestSuiteRegistry.ts

cd ~/Mes\ documents/devhome/miroir-app-dev/
 
npm run build -w miroir-app-miroir 
 
RUN_TEST=adminTransformers.unit.test npm run testByFile -w miroir-core -- 'adminTransformers.unit.test'
RUN_TEST=mustache.unit.test npm run testByFile -w miroir-core -- 'mustache.unit.test'
RUN_TEST=mlsToJsonSchema.unit.test npm run testByFile -w miroir-core -- 'mlsToJsonSchema.unit.test'
RUN_TEST=unitTest.pilot.unit.test npm run testByFile -w miroir-core -- 'unitTest.pilot.unit.test'
RUN_TEST=unitTest.tools.unit.test npm run testByFile -w miroir-core -- 'unitTest.tools.unit.test'
RUN_TEST=transformers.unit.test npm run testByFile -w miroir-core -- 'transformers.unit.test'
RUN_TEST=queries.unit.test npm run testByFile -w miroir-core -- 'queries.unit.test'

RUN_TEST=MlSchemaReferencesList.unit.test npm run testByFile -w miroir-core MlSchemaReferencesList.unit.test
RUN_TEST=mlsToMls_Summary.unit.test npm run testByFile -w miroir-core mlsToMls_Summary.unit.test

RUN_TEST=resolveConditionalSchema.test npm run testByFile -w miroir-core -- 'resolveConditionalSchema.test'

# Integration (Postgres) — miroir-standalone-app (not miroir-core)
npm run testMiroir -w miroir-standalone-app -- --suites tr.core --mode integration

# new core transformer tests
# Integration (Postgres)
MIROIR_TEST_SUITES=tr.core MIROIR_TEST_MODE=integ MIROIR_TEST_POSTGRES_HOST=192.168.1.160 npm run testMiroir -w miroir-standalone-app
# Unit (no Postgres)
MIROIR_TEST_SUITES=tr.core MIROIR_TEST_MODE=unit npm run testMiroir -w miroir-core

# go back to the original directory
cd -