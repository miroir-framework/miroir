interface MInstanceDomainInputActionsI {
    addInstancesForEntity(entityName: string, instances: any[]): void;
    modifyInstancesForEntity(entityName: string, instances: any[]): void;
}
interface MEntityDomainInputActionsI {
    replaceEntities(entities: any[]): void;
}
export { MInstanceDomainInputActionsI, MEntityDomainInputActionsI };
