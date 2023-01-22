interface Instance {
    "uuid": string;
    "entity": string;
}
interface InstanceWithName extends Instance {
    "name": string;
}
interface InstanceCollection {
    entity: string;
    instances: Instance[];
}

interface EntityAttribute {
    "id": number;
    "name": string;
    "defaultLabel": string;
    "type": string;
    "nullable": boolean;
    "editable": boolean;
}
interface EntityDefinition extends InstanceWithName {
    "entity": string;
    "description"?: string;
    "instanceValidationJsonSchema": {};
    "attributes"?: EntityAttribute[];
}

interface MiroirReportListDefinition {
    "entity": string;
}
type MiroirReportDefinition = MiroirReportListDefinition;
interface MiroirReport extends InstanceWithName {
    "defaultLabel": string;
    "type": 'list' | 'grid';
    "definition"?: MiroirReportDefinition;
}

interface MInstanceDomainInputActionsI {
    addInstancesForEntity(entityName: string, instances: any[]): void;
    modifyInstancesForEntity(entityName: string, instances: any[]): void;
}
interface MEntityDomainInputActionsI {
    replaceEntities(entities: any[]): void;
}

interface DataControllerInterface {
    loadConfigurationFromRemoteDataStore(): void;
}

interface MError {
    errorMessage?: string;
    stack?: string[];
}
interface ErrorLogServiceInterface {
    pushError(error: MError): void;
    getErrorLog(): MError[];
}

interface StoreReturnType {
    status: 'ok' | 'error';
    errorMessage?: string;
    error?: MError;
    instances?: InstanceCollection[];
}
interface EntityDefinitionLocalStoreInputActionsI {
    replaceAllEntityDefinitions(entityDefinitions: EntityDefinition[]): Promise<StoreReturnType>;
}
interface InstanceLocalStoreInputActionsI {
    addInstancesForEntity(entityName: string, instances: Instance[]): void;
    modifyInstancesForEntity(entityName: string, instances: Instance[]): void;
    replaceAllInstances(instances: InstanceCollection[]): Promise<void>;
}
declare interface LocalStoreInterface extends EntityDefinitionLocalStoreInputActionsI, InstanceLocalStoreInputActionsI {
    run(): void;
    getInnerStore(): any;
}

interface EntityDefinitionRemoteDataStoreInputActionsI {
    fetchAllEntityDefinitionsFromRemoteDataStore(): Promise<StoreReturnType>;
}
interface InstanceRemoteDataStoreInputActionsI {
    fetchInstancesForEntityListFromRemoteDatastore(entities: EntityDefinition[]): Promise<StoreReturnType>;
}
declare interface RemoteDataStoreInterface extends EntityDefinitionRemoteDataStoreInputActionsI, InstanceRemoteDataStoreInputActionsI {
}

declare const ReportGetInstancesToDispay: (report: MiroirReport, miroirEntities: EntityDefinition[]) => any[];

declare const _default: {};

export { DataControllerInterface, EntityAttribute, EntityDefinition, EntityDefinitionLocalStoreInputActionsI, EntityDefinitionRemoteDataStoreInputActionsI, ErrorLogServiceInterface, Instance, InstanceCollection, InstanceLocalStoreInputActionsI, InstanceRemoteDataStoreInputActionsI, InstanceWithName, LocalStoreInterface, MEntityDomainInputActionsI, MError, MInstanceDomainInputActionsI, MiroirReport, MiroirReportDefinition, RemoteDataStoreInterface, ReportGetInstancesToDispay, StoreReturnType, _default as default };
