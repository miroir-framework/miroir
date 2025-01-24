import {
  // DomainElementVoid,
  // DomainElementAny,
  DomainElementFailed,
  // DomainQueryReturnType<DomainElementObject>,
  // DomainElementEntityInstanceCollectionOrFailed,
  // DomainElementInstanceArrayOrFailed,
  // DomainElementEntityInstanceOrFailed,
  // EntityInstanceUuid,
  // EntityInstancesUuidIndex,
} from "../1_core/preprocessor-generated/miroirFundamentalType.js";


export type DomainQueryReturnType<T> =
  T
  | DomainElementFailed
  // | DomainElementVoid
  // | DomainElementAny
  // | DomainQueryReturnType<DomainElementObject>
  // | DomainQueryReturnType<DomainElementInstanceUuidIndex>
  // | DomainElementEntityInstanceCollectionOrFailed
  // | DomainElementInstanceArrayOrFailed
  // | DomainElementEntityInstanceOrFailed
  // | {
  //     elementType: "instanceUuid";
  //     elementValue: EntityInstanceUuid;
  //   }
  // | {
  //     elementType: "instanceUuidIndexUuidIndex";
  //     elementValue: EntityInstancesUuidIndex;
  //   }
  // | {
  //     elementType: "string";
  //     elementValue: string;
  //   }
  // | {
  //     elementType: "number";
  //     elementValue: number;
  //   }
  // | {
  //     elementType: "array";
  //     elementValue: DomainElement[];
  //   };
