import { Instance } from "../0_interfaces/1_core/Instance";
import { DomainInstancesUuidIndex } from "../0_interfaces/2_domain/DomainControllerInterface";

export function DomainInstanceUuidIndexToArray(instances:DomainInstancesUuidIndex):Instance[] {
  return !!instances?Object.values(instances):[];
}