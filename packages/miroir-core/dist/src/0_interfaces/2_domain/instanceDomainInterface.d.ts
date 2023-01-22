interface MInstanceDomainInputActionsI {
    addInstancesForEntity(entityName: string, instances: any[]): void;
    modifyInstancesForEntity(entityName: string, instances: any[]): void;
}
interface MEntityDomainInputActionsI {
    replaceEntities(entities: any[]): void;
}
declare const _default: {};
export default _default;
export { MInstanceDomainInputActionsI, MEntityDomainInputActionsI };
