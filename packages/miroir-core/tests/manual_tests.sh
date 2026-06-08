#!/bin/bash

cd ~/Mes\ documents/devhome/miroir-app-dev/
 
npm run build -w miroir-test-app_deployment-miroir 
 
RUN_TEST=adminTransformers.unit.test npm run testByFile -w miroir-core -- 'adminTransformers.unit.test'
RUN_TEST=mustache.unit.test npm run testByFile -w miroir-core -- 'mustache.unit.test'
RUN_TEST=jzodToJsonSchema.unit.test npm run testByFile -w miroir-core -- 'jzodToJsonSchema.unit.test'
RUN_TEST=unitTest.pilot.unit.test npm run testByFile -w miroir-core -- 'unitTest.pilot.unit.test'
RUN_TEST=unitTest.tools.unit.test npm run testByFile -w miroir-core -- 'unitTest.tools.unit.test'
RUN_TEST=transformers.unit.test npm run testByFile -w miroir-core -- 'transformers.unit.test'
RUN_TEST=queries.unit.test npm run testByFile -w miroir-core -- 'queries.unit.test'
RUN_TEST=resolveConditionalSchema.test npm run testByFile -w miroir-core -- 'resolveConditionalSchema.test'

# go back to the original directory
cd -