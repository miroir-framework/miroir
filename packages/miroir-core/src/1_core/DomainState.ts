import { EntityInstance } from "../0_interfaces/1_core/Instance";
import { DomainInstancesUuidIndex } from "../0_interfaces/2_domain/DomainControllerInterface";

export function DomainInstanceUuidIndexToArray(instances:DomainInstancesUuidIndex):EntityInstance[] {
  return !!instances?Object.values(instances):[];
}