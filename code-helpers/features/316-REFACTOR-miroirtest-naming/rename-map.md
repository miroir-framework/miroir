# 316 — Rename map

> Final old → new MiroirTest instance names (proposal A as amended by A on 2026-09-27), with the mode tags each instance gains. Generated from the assets at `_integration` 76e52aa; companion of [analysis.md](analysis.md).


## Function (26), tags added: `unit`

| Current name | New name | Deployment | Current root `miroirTestLabel` | uuid |
|---|---|---|---|---|
| `ansiColumnsToMlSchema` | `fn.ansiColumnsToMlSchema` | miroir | `ansiColumnsToMlSchema` | `801a12a2-2a42-4cb4-aa0d-192deae99fd4` |
| `EntityPrimaryKey` | `fn.entityPrimaryKey` | miroir | `EntityPrimaryKey` | `7c11632c-e5c0-4aca-8f96-aca26da2efa6` |
| `mlObjectFlatten` | `fn.mlObjectFlatten` | miroir | `mls.mlObjectFlatten` | `28463869-0408-48f0-b2fd-1aa9ead080ce` |
| `MlSchemaReferencesList` | `fn.mlSchemaReferences.list` | miroir | `mls.MlSchemaReferencesList` | `c3fc18b5-b572-4505-bb29-1aa75188e9dc` |
| `MlSchemaReferencesSet` | `fn.mlSchemaReferences.set` | miroir | `mls.MlSchemaReferencesSet` | `b1000bf2-4067-4881-9ac9-fa4911fb3a67` |
| `mlsTransitiveDependencySet` | `fn.mlSchemaReferences.transitiveDependencySet` | miroir | `mls.mlsTransitiveDependencySet` | `32416312-fd7b-46ea-8cd5-fed70020061b` |
| `mlUnion_RecursiveUnfold` | `fn.mlUnion.recursivelyUnfold` | miroir | `mlUnion_RecursiveUnfold` | `4a8151cc-96de-47dd-bde2-6b9e4497fcc2` |
| `mlsToCopilotKitParameter` | `fn.mlsToCopilotKitParameter` | miroir | `mls.mlsToCopilotKitParameter` | `1c086ab9-d6a3-4cb9-b0cd-720a09e2cd44` |
| `mlsToJsonSchema` | `fn.mlsToJsonSchema` | miroir | `mlsToJsonSchema` | `d11082dd-1f9e-4b19-be2d-a973a4c5ffdc` |
| `mergePositionBased` | `fn.mlsToMls.mergePositionBased` | miroir | `mls.mergePositionBased` | `44fdc559-9981-495c-90eb-555a2eb59afe` |
| `mlsToMls_Summary` | `fn.mlsToMls.summary` | miroir | `mls.mlsToMls_Summary` | `b53123e2-5cf5-4ea4-a21a-befe1086ff98` |
| `buildAnyKeyMap` | `fn.mlsTypeCheck.buildAnyKeyMap` | miroir | `mls.buildAnyKeyMap` | `dd9620db-a3e0-49a8-8053-c62cbe85ad3a` |
| `selectUnionBranchFromDiscriminator` | `fn.mlsTypeCheck.selectUnionBranchFromDiscriminator` | miroir | `mls.selectUnionBranchFromDiscriminator` | `84e67b10-17f0-4340-8c1f-5f19a8b94e05` |
| `unionArrayChoices` | `fn.mlsTypeCheck.unionArrayChoices` | miroir | `unionArrayChoices` | `9e4db067-27ab-48c1-91f7-2a739824e674` |
| `unionObjectChoices` | `fn.mlsTypeCheck.unionObjectChoices` | miroir | `unionObjectChoices` | `14319c8e-8ece-4853-9004-f095fbd16d1a` |
| `mlUnionResolvedTypeForArray` | `fn.mlsTypeCheck.unionResolvedTypeForArray` | miroir | `mlUnionResolvedTypeForArray` | `f39f9665-a5bf-43fc-929d-336b4046a440` |
| `mlUnionResolvedTypeForObject` | `fn.mlsTypeCheck.unionResolvedTypeForObject` | miroir | `mlUnionResolvedTypeForObject` | `2c08e0cc-a68c-4189-a1e2-f08ede23919a` |
| `localizeMlSchemaReferenceContext` | `fn.mlsUnfoldSchemaOnce.localizeReferenceContext` | miroir | `localizeReferenceContext` | `e38c2224-2d46-4d9c-bf2c-782119ddc999` |
| `modelUpdates` | `fn.modelUpdate` | miroir | `modelUpdates.getModelUpdate` | `31287a16-b711-4f70-b8a6-1974cbf05e42` |
| `mustache` | `fn.mustache.extractDoubleBracePatterns` | miroir | `mustache.extractDoubleBracePatterns` | `bdf83d4d-f4dd-42c9-b2d6-41311d979083` |
| `getAttributeTypesFromMlSchema` | `fn.postgres.attributeTypesFromMlSchema` | miroir | `getAttributeTypesFromMlSchema` | `b9eeba55-86f4-4aec-9488-6fb7a2747880` |
| `resolveQueryTemplates` | `fn.templates.resolveQueryTemplates` | miroir | `resolveQueryTemplates.unit.test` | `40fd4dae-037c-4b1b-ad33-204d15e90dba` |
| `alterObject_atPath` | `fn.tools.alterObjectAtPath` | miroir | `alterObject.atPath` | `d3b7f54f-8dcf-4159-814e-0f4a71a6081a` |
| `tools` | `fn.tools.pathsAndMerges` | miroir | `tools` | `e5940340-a73b-4d30-88a5-0f45072e146b` |
| `transformerInterfaceCheck` | `fn.transformer.interfaceCheck` | miroir | `transformerInterfaceCheck` | `c9f0a3e1-7b2d-4e6a-8f1c-5d3b9a7e2c84` |
| `transformerResultSchema` | `fn.transformer.resultSchema` | miroir | `transformerResultSchema` | `0d3bd258-a8f9-4a0c-8cd9-bcf5607b50ad` |

## Query (2), tags added: `unit`

| Current name | New name | Deployment | Current root `miroirTestLabel` | uuid |
|---|---|---|---|---|
| `queries_library` | `query.library.instances` | miroir | `queries.library` | `a7a74c51-f24e-43d6-bd62-ba3ebcded97d` |
| `virtualAttributes` | `query.virtualAttributes` | miroir | `virtualAttributes` | `c4dffd69-2594-482c-b680-295c30eafe30` |

## Transformer (11), tags added: `unit, integ`

| Current name | New name | Deployment | Current root `miroirTestLabel` | uuid |
|---|---|---|---|---|
| `adminTransformers` | `tr.admin.duplicateApplicationModel` | miroir | `adminTransformers` | `8f07f7a2-d864-4600-bd3e-abda85a04061` |
| `miroirCoreTransformers` | `tr.core` | miroir | `miroirCoreTransformers` | `33f60ac8-6511-43b1-b153-6b86e3177532` |
| `defaultValueForMLSchema` | `tr.defaultValueForMlSchema` | miroir | `defaultValueForMLSchema` | `3d8570ba-69f3-4647-9ca9-b62c01eb4ae0` |
| `menu_build` | `tr.menuBuild` | miroir | `menu.build` | `1a251573-f10b-4298-9264-d3233d60a763` |
| `metaModelTransformersTest` | `tr.metaModel.extractAttributes` | miroir | `metaModelTransformersTest` | `a9a39db6-bf94-4c3f-a067-f28a5cd93a87` |
| `mlsTypeCheck_TransformerTestSuite` | `tr.mlsTypeCheck` | miroir | `mlsTypeCheck` | `3aff508a-8a9f-4384-ba50-cc696411eba5` |
| `resolveConditionalSchema` | `tr.resolveConditionalSchema` | miroir | `resolveConditionalSchema` | `10bd8532-8d3e-40ca-a029-b43a38d11ea0` |
| `pilot_transformer_plus` | `tr.resolveConditionalSchema.build` | miroir | `pilot_resolveConditionalSchema` | `4b18adc6-5cec-4abf-bb60-7a7fa26e4dc4` |
| `resolveSchemaReferenceInContext` | `tr.resolveSchemaReferenceInContext` | miroir | `resolveSchemaReferenceInContext` | `02a34783-d8fa-4f3c-8978-5edc2658dcbf` |
| `externalServiceSync` | `tr.syncExternalServiceSchema` | miroir | `externalServiceSync` | `f4e5dde0-3dba-493b-a208-04494dbbb2f5` |
| `unfoldSchemaOnce` | `tr.unfoldSchemaOnce` | miroir | `unfoldSchemaOnce` | `dd06922d-d4cd-4057-9dc1-bab3a0ed6276` |

## Action (11), tags added: `integ`

| Current name | New name | Deployment | Current root `miroirTestLabel` | uuid |
|---|---|---|---|---|
| `domain_controller_data_crud` | `action.domainController.dataCrud` | miroir | `domainController.data.crud` | `c8e2a104-5b6d-4f91-a2c3-9d0e1f2a3b4c` |
| `domain_controller_composite_pk_crud` | `action.domainController.dataCrud.compositePk` | miroir | `domainController.compositePK.data.crud` | `e2f4a306-7d8f-4b13-a4e5-1f2a3b4c5d6e` |
| `domain_controller_no_parent_uuid_crud` | `action.domainController.dataCrud.noParentUuid` | miroir | `domainController.noParentUuid.crud` | `b5c7d609-a01c-4e46-b7b8-4c5d6e7f8091` |
| `domain_controller_non_uuid_pk_data_crud` | `action.domainController.dataCrud.nonUuidPk` | miroir | `domainController.nonUuidPK.data.crud` | `a4b6c508-9f0b-4d35-a6a7-3b4c5d6e7f80` |
| `domain_controller_application_version_freeze` | `action.domainController.freezeApplicationVersion` | miroir | `domainController.applicationVersion.freeze` | `d7e9f81b-c23d-4f68-b9a0-6e7f8091a2b3` |
| `domain_controller_model_crud` | `action.domainController.modelCrud` | miroir | `domainController.model.crud` | `a1b2c3d4-5e6f-4789-a0b1-c2d3e4f5a6b7` |
| `domain_controller_non_uuid_pk_model_crud` | `action.domainController.modelCrud.nonUuidPk` | miroir | `domainController.nonUuidPK.model.crud` | `f3a5b407-8e9a-4c24-b5f6-2a3b4c5d6e7f` |
| `domain_controller_model_undo_redo` | `action.domainController.modelUndoRedo` | miroir | `domainController.model.undoRedo` | `c6d8e70a-b12d-4f57-a8c9-5d6e7f8091a2` |
| `evolutionTraceWP1` | `action.scenario.evolutionTrace` | miroir | `evolutionTrace.WP1` | `2427ef3a-3cd1-4b87-afe7-433bb04b25d2` |
| `externalServiceSyncExecute` | `action.scenario.externalServiceSync` | miroir | `externalServiceSyncExecute` | `394242e7-6443-41b8-b061-9bf2bcf06f17` |
| `multistepReports.274` | `action.scenario.multistepReportTemplate` | library | `multistepReports.274` | `9931f827-a3ce-435f-bf07-4dac430d81d1` |

## Runner (7), tags added: `integ`

| Current name | New name | Deployment | Current root `miroirTestLabel` | uuid |
|---|---|---|---|---|
| `runner_create_entity` | `runner.createEntity` | miroir | `runner.createEntity` | `4b4645f5-a3c1-4563-ac3f-c6e12cc703dc` |
| `runner_drop_entity` | `runner.dropEntity` | miroir | `runner.dropEntity` | `81ec69e8-0e2f-41ef-8017-76a8f004c9aa` |
| `runner_freeze_application_version` | `runner.freezeApplicationVersion` | miroir | `runner.freezeApplicationVersion` | `967eff73-2a41-40c8-aa8d-87d292d31953` |
| `runner_lend_document` | `runner.lendDocument` | library | `runner.lendDocument` | `f8e7d6c5-b4a3-4291-8765-43210fedcba0` |
| `runner_mcp_get_instances` | `runner.mcp.getInstances` | miroir | `runner.mcpGetInstances` | `a2e0a33f-222d-4334-870c-baaffd307e1d` |
| `runner_mcp_lend_document` | `runner.mcp.lendDocument` | library | `runner.mcpLendDocument` | `a6fc85c8-83ad-4c8f-a6e0-6f9d17713159` |
| `runner_return_document` | `runner.returnDocument` | library | `runner.returnDocument` | `a1b2c3d4-e5f6-4789-a012-3456789abcde` |

## UI component (9), tags added: `ui`

| Current name | New name | Deployment | Current root `miroirTestLabel` | uuid |
|---|---|---|---|---|
| `MlTestPattern_ComponentTestSuite` | `ui.mlElementEditor.allTypesPattern` | miroir | `MlTestPattern_ComponentTestSuite` | `26ef2886-2cd8-4f91-b846-1525b24d5f41` |
| `MlAnyEditor_ComponentTestSuite` | `ui.mlElementEditor.any` | miroir | `MlAnyEditor_ComponentTestSuite` | `ec601bcc-a27d-450d-9c37-bdd6a12a1575` |
| `MlArrayEditor_ComponentTestSuite` | `ui.mlElementEditor.array` | miroir | `MlArrayEditor_ComponentTestSuite` | `1b71d68b-7dc9-468c-a251-4fa7889f20f4` |
| `MlEnumEditor_ComponentTestSuite` | `ui.mlElementEditor.enum` | miroir | `MlEnumEditor_ComponentTestSuite` | `761d4ed2-1a5c-4901-a9d9-897dbec0b27f` |
| `MlLiteralEditor_ComponentTestSuite` | `ui.mlElementEditor.literal` | miroir | `MlLiteralEditor_ComponentTestSuite` | `3995a071-b8ae-48d3-a488-6d1fc828b725` |
| `MlObjectEditor_ComponentTestSuite` | `ui.mlElementEditor.object` | miroir | `MlObjectEditor_ComponentTestSuite` | `da353085-c62b-4aa6-bd54-8813d303dfe5` |
| `MlEditorRenderPerformance_ComponentTestSuite` | `ui.mlElementEditor.renderPerformance` | miroir | `MlEditorRenderPerformance_ComponentTestSuite` | `2da30877-d248-44bd-9786-5c091b1bc8fc` |
| `MlSimpleTypeEditor_ComponentTestSuite` | `ui.mlElementEditor.simpleType` | miroir | `MlSimpleTypeEditor_ComponentTestSuite` | `590693b6-2125-43fc-89d7-1330ae8318db` |
| `MlUnionEditor_ComponentTestSuite` | `ui.mlElementEditor.union` | miroir | `MlUnionEditor_ComponentTestSuite` | `de517cd6-31a8-46d2-ac09-3a5162b630a7` |
