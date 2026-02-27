/**
 * Unit tests for the Mermaid class-diagram generation domain library.
 *
 * These are pure-function tests (layer 2 – domain); no side effects, no
 * mocking, no external dependencies beyond the library itself and the
 * EntityDefinition type from miroir-core.
 */

import { describe, it, expect } from "vitest";
import type { EntityDefinition } from "miroir-core";
import {
  jzodTypeToUml,
  sanitiseMermaidId,
  buildEntityUuidToNameMap,
  extractClassInfo,
  extractRelationships,
  entityDefinitionsToMermaidClassDiagram,
  metaModelToMermaidClassDiagram,
  type ClassDiagramOptions,
} from "../src/2_domain/entityDefinitionsToMermaidClassDiagram.js";

// ############################################################################
// Test fixtures – minimal EntityDefinitions modelled after the Library app
// ############################################################################

const countryEntityDefinition: EntityDefinition = {
  uuid: "56628e31-3db5-4c5c-9328-4ff7ce54c36a",
  parentName: "EntityDefinition",
  parentUuid: "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd",
  entityUuid: "d3139a6d-0486-4ec8-bded-2a83a3c3cee4",
  name: "Country",
  description: "Country",
  mlSchema: {
    type: "object",
    definition: {
      uuid: {
        type: "uuid",
        tag: { value: { id: 1, defaultLabel: "Uuid", display: { editable: false } } },
      },
      parentName: {
        type: "string",
        optional: true,
        tag: { value: { id: 2, defaultLabel: "Entity Name", display: { editable: false } } },
      },
      parentUuid: {
        type: "uuid",
        tag: { value: { id: 3, defaultLabel: "Entity Uuid", display: { editable: false } } },
      },
      conceptLevel: {
        type: "enum",
        definition: ["MetaModel", "Model", "Data"],
        optional: true,
        tag: { value: { id: 5, defaultLabel: "Concept Level", display: { editable: false } } },
      },
      name: {
        type: "string",
        tag: { value: { id: 4, defaultLabel: "Name" } },
      },
      "iso3166-1Alpha-2": {
        type: "string",
        optional: true,
        tag: { value: { id: 5, defaultLabel: "Country Code" } },
      },
      icon: {
        type: "string",
        optional: true,
        tag: { value: { id: 6, defaultLabel: "Icon" } },
      },
    },
  } as any,
};

const authorEntityDefinition: EntityDefinition = {
  uuid: "b30b7180-f7dc-4cca-b4e8-e476b77fe61d",
  parentName: "EntityDefinition",
  parentUuid: "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd",
  entityUuid: "d7a144ff-d1b9-4135-800c-a7cfc1f38733",
  name: "Author",
  description: "author",
  mlSchema: {
    type: "object",
    definition: {
      uuid: {
        type: "uuid",
        tag: { value: { id: 1, defaultLabel: "Uuid", display: { editable: false } } },
      },
      parentName: {
        type: "string",
        optional: true,
        tag: { value: { id: 2, defaultLabel: "Entity Name", display: { editable: false } } },
      },
      parentUuid: {
        type: "uuid",
        tag: { value: { id: 3, defaultLabel: "Entity Uuid", display: { editable: false } } },
      },
      conceptLevel: {
        type: "enum",
        definition: ["MetaModel", "Model", "Data"],
        optional: true,
        tag: { value: { id: 5, defaultLabel: "Concept Level", display: { editable: false } } },
      },
      name: {
        type: "string",
        tag: { value: { id: 4, defaultLabel: "Name" } },
      },
      language: {
        type: "string",
        optional: true,
        tag: { value: { id: 5, defaultLabel: "Language" } },
      },
      birthDate: {
        type: "date",
        optional: true,
        tag: { value: { id: 6, defaultLabel: "Birth" } },
      },
      deathDate: {
        type: "date",
        optional: true,
        tag: { value: { id: 7, defaultLabel: "Death" } },
      },
      country: {
        type: "uuid",
        optional: true,
        tag: {
          value: {
            id: 8,
            defaultLabel: "Country",
            foreignKeyParams: {
              targetEntity: "d3139a6d-0486-4ec8-bded-2a83a3c3cee4",
              targetEntityOrderInstancesBy: "name",
            },
          },
        },
      },
      icon: {
        type: "string",
        optional: true,
        tag: { value: { id: 9, defaultLabel: "Icon" } },
      },
    },
  } as any,
};

const bookEntityDefinition: EntityDefinition = {
  uuid: "797dd185-0155-43fd-b23f-f6d0af8cae06",
  parentName: "EntityDefinition",
  parentUuid: "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd",
  entityUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
  name: "Book",
  mlSchema: {
    type: "object",
    definition: {
      uuid: {
        type: "uuid",
        tag: { value: { id: 1, defaultLabel: "Uuid", display: { editable: false } } },
      },
      parentName: {
        type: "string",
        optional: true,
        tag: { value: { id: 2, defaultLabel: "Entity Name", display: { editable: false } } },
      },
      parentUuid: {
        type: "uuid",
        tag: { value: { id: 3, defaultLabel: "Entity Uuid", display: { editable: false } } },
      },
      conceptLevel: {
        type: "enum",
        definition: ["MetaModel", "Model", "Data"],
        optional: true,
        tag: { value: { id: 5, defaultLabel: "Concept Level", display: { editable: false } } },
      },
      name: {
        type: "string",
        tag: { value: { defaultLabel: "Book Title" } },
      },
      year: {
        type: "number",
        optional: true,
        tag: { value: { id: 6, defaultLabel: "Year of Publication", display: { editable: true } } },
      },
      author: {
        type: "uuid",
        tag: {
          value: {
            id: 7,
            defaultLabel: "Author",
            foreignKeyParams: {
              targetEntity: "d7a144ff-d1b9-4135-800c-a7cfc1f38733",
              targetEntityOrderInstancesBy: "name",
            },
          },
        },
      },
      publisher: {
        type: "uuid",
        tag: {
          value: {
            defaultLabel: "Publisher",
            id: 8,
            foreignKeyParams: {
              targetEntity: "a027c379-8468-43a5-ba4d-bf618be25cab",
              targetEntityOrderInstancesBy: "name",
            },
          },
        },
      },
      ISBN: {
        type: "string",
        optional: true,
        tag: { value: { id: 9, defaultLabel: "ISBN" } },
      },
    },
  } as any,
};

const publisherEntityDefinition: EntityDefinition = {
  uuid: "7a939fe8-d119-4e7f-ab94-95b2aae30db9",
  parentName: "EntityDefinition",
  parentUuid: "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd",
  entityUuid: "a027c379-8468-43a5-ba4d-bf618be25cab",
  name: "Publisher",
  description: "Publisher",
  mlSchema: {
    type: "object",
    definition: {
      uuid: {
        type: "uuid",
        tag: { value: { id: 1, defaultLabel: "Uuid", display: { editable: false } } },
      },
      parentName: {
        type: "string",
        optional: true,
        tag: { value: { id: 2, defaultLabel: "Entity Name", display: { editable: false } } },
      },
      parentUuid: {
        type: "uuid",
        tag: { value: { id: 3, defaultLabel: "Entity Uuid", display: { editable: false } } },
      },
      conceptLevel: {
        type: "enum",
        definition: ["MetaModel", "Model", "Data"],
        optional: true,
        tag: { value: { id: 5, defaultLabel: "Concept Level", display: { editable: false } } },
      },
      name: {
        type: "string",
        tag: { value: { id: 4, defaultLabel: "Name" } },
      },
      country: {
        type: "uuid",
        optional: true,
        tag: {
          value: {
            id: 5,
            display: { editable: true },
            defaultLabel: "Country",
            foreignKeyParams: {
              targetEntity: "d3139a6d-0486-4ec8-bded-2a83a3c3cee4",
              targetEntityOrderInstancesBy: "name",
            },
          },
        },
      },
      icon: {
        type: "string",
        optional: true,
        tag: { value: { id: 6, defaultLabel: "Icon" } },
      },
    },
  } as any,
};

const allEntityDefinitions: EntityDefinition[] = [
  countryEntityDefinition,
  authorEntityDefinition,
  bookEntityDefinition,
  publisherEntityDefinition,
];

// ############################################################################
// Tests
// ############################################################################

describe("jzodTypeToUml", () => {
  it("maps known jzod types to UML types", () => {
    expect(jzodTypeToUml("uuid")).toBe("UUID");
    expect(jzodTypeToUml("string")).toBe("String");
    expect(jzodTypeToUml("number")).toBe("Number");
    expect(jzodTypeToUml("boolean")).toBe("Boolean");
    expect(jzodTypeToUml("date")).toBe("Date");
    expect(jzodTypeToUml("enum")).toBe("Enum");
    expect(jzodTypeToUml("object")).toBe("Object");
    expect(jzodTypeToUml("array")).toBe("Array");
  });

  it("returns the raw type for unknown types", () => {
    expect(jzodTypeToUml("customType")).toBe("customType");
  });
});

describe("sanitiseMermaidId", () => {
  it("passes through alphanumeric names unchanged", () => {
    expect(sanitiseMermaidId("Author")).toBe("Author");
    expect(sanitiseMermaidId("Book123")).toBe("Book123");
  });

  it("replaces special characters with underscores", () => {
    expect(sanitiseMermaidId("iso3166-1Alpha-2")).toBe("iso3166_1Alpha_2");
    expect(sanitiseMermaidId("my entity!")).toBe("my_entity_");
  });
});

describe("buildEntityUuidToNameMap", () => {
  it("builds a UUID-to-name lookup from entity definitions", () => {
    const map = buildEntityUuidToNameMap(allEntityDefinitions);
    expect(map).toEqual({
      "d3139a6d-0486-4ec8-bded-2a83a3c3cee4": "Country",
      "d7a144ff-d1b9-4135-800c-a7cfc1f38733": "Author",
      "e8ba151b-d68e-4cc3-9a83-3459d309ccf5": "Book",
      "a027c379-8468-43a5-ba4d-bf618be25cab": "Publisher",
    });
  });

  it("returns empty map for empty input", () => {
    expect(buildEntityUuidToNameMap([])).toEqual({});
  });
});

describe("extractClassInfo", () => {
  it("excludes infrastructure attributes by default", () => {
    const cls = extractClassInfo(countryEntityDefinition);
    const attrNames = cls.attributes.map((a) => a.name);
    expect(attrNames).not.toContain("uuid");
    expect(attrNames).not.toContain("parentName");
    expect(attrNames).not.toContain("parentUuid");
    expect(attrNames).not.toContain("conceptLevel");
    expect(attrNames).toContain("name");
    expect(attrNames).toContain("iso3166-1Alpha-2");
    expect(attrNames).toContain("icon");
  });

  it("includes infrastructure attributes when option is set", () => {
    const cls = extractClassInfo(countryEntityDefinition, { showInfrastructureAttributes: true });
    const attrNames = cls.attributes.map((a) => a.name);
    expect(attrNames).toContain("uuid");
    expect(attrNames).toContain("parentName");
    expect(attrNames).toContain("parentUuid");
    expect(attrNames).toContain("conceptLevel");
  });

  it("identifies foreign key attributes", () => {
    const cls = extractClassInfo(authorEntityDefinition);
    const countryAttr = cls.attributes.find((a) => a.name === "country");
    expect(countryAttr).toBeDefined();
    expect(countryAttr!.isForeignKey).toBe(true);
    expect(countryAttr!.targetEntityUuid).toBe("d3139a6d-0486-4ec8-bded-2a83a3c3cee4");
  });

  it("marks optional attributes correctly", () => {
    const cls = extractClassInfo(authorEntityDefinition);
    const langAttr = cls.attributes.find((a) => a.name === "language");
    expect(langAttr!.optional).toBe(true);

    const nameAttr = cls.attributes.find((a) => a.name === "name");
    expect(nameAttr!.optional).toBe(false);
  });

  it("extracts description from entity definition", () => {
    const cls = extractClassInfo(countryEntityDefinition);
    expect(cls.description).toBe("Country");
  });

  it("extracts entity name and uuid", () => {
    const cls = extractClassInfo(bookEntityDefinition);
    expect(cls.name).toBe("Book");
    expect(cls.entityUuid).toBe("e8ba151b-d68e-4cc3-9a83-3459d309ccf5");
  });

  it("detects multiple foreign keys in one entity", () => {
    const cls = extractClassInfo(bookEntityDefinition);
    const fkAttrs = cls.attributes.filter((a) => a.isForeignKey);
    expect(fkAttrs).toHaveLength(2);
    expect(fkAttrs.map((a) => a.name).sort()).toEqual(["author", "publisher"]);
  });
});

describe("extractRelationships", () => {
  it("extracts FK relationships between classes", () => {
    const entityUuidToName = buildEntityUuidToNameMap(allEntityDefinitions);
    const classes = allEntityDefinitions.map((ed) => extractClassInfo(ed));
    const rels = extractRelationships(classes, entityUuidToName);

    // Author → Country (optional)
    const authorCountry = rels.find(
      (r) => r.sourceClass === "Author" && r.targetClass === "Country",
    );
    expect(authorCountry).toBeDefined();
    expect(authorCountry!.attributeName).toBe("country");
    expect(authorCountry!.optional).toBe(true);

    // Book → Author (required)
    const bookAuthor = rels.find(
      (r) => r.sourceClass === "Book" && r.targetClass === "Author",
    );
    expect(bookAuthor).toBeDefined();
    expect(bookAuthor!.attributeName).toBe("author");
    expect(bookAuthor!.optional).toBe(false);

    // Book → Publisher (required)
    const bookPublisher = rels.find(
      (r) => r.sourceClass === "Book" && r.targetClass === "Publisher",
    );
    expect(bookPublisher).toBeDefined();
    expect(bookPublisher!.attributeName).toBe("publisher");
    expect(bookPublisher!.optional).toBe(false);

    // Publisher → Country (optional)
    const pubCountry = rels.find(
      (r) => r.sourceClass === "Publisher" && r.targetClass === "Country",
    );
    expect(pubCountry).toBeDefined();
    expect(pubCountry!.optional).toBe(true);
  });

  it("returns empty array when no FKs are present", () => {
    const classes = [extractClassInfo(countryEntityDefinition)];
    const entityUuidToName = buildEntityUuidToNameMap([countryEntityDefinition]);
    const rels = extractRelationships(classes, entityUuidToName);
    expect(rels).toEqual([]);
  });

  it("ignores FKs pointing to entities not in the provided list", () => {
    // Author references Country, but Country is not included
    const classes = [extractClassInfo(authorEntityDefinition)];
    const entityUuidToName = buildEntityUuidToNameMap([authorEntityDefinition]);
    const rels = extractRelationships(classes, entityUuidToName);
    // Should be empty because Country is not in the map
    expect(rels).toEqual([]);
  });
});

describe("entityDefinitionsToMermaidClassDiagram", () => {
  it("produces valid Mermaid classDiagram header", () => {
    const diagram = entityDefinitionsToMermaidClassDiagram(allEntityDefinitions);
    expect(diagram).toContain("classDiagram");
    expect(diagram).toContain("direction TB");
  });

  it("defines classes for all entity definitions", () => {
    const diagram = entityDefinitionsToMermaidClassDiagram(allEntityDefinitions);
    expect(diagram).toContain("class Country {");
    expect(diagram).toContain("class Author {");
    expect(diagram).toContain("class Book {");
    expect(diagram).toContain("class Publisher {");
  });

  it("includes domain attributes but not infrastructure attributes", () => {
    const diagram = entityDefinitionsToMermaidClassDiagram([countryEntityDefinition]);
    // Domain attributes
    expect(diagram).toContain("+String name");
    expect(diagram).toContain("+String iso3166_1Alpha_2?");
    expect(diagram).toContain("+String icon?");
    // Infrastructure attributes should be absent
    expect(diagram).not.toMatch(/\+UUID uuid/);
    expect(diagram).not.toMatch(/\+String parentName/);
  });

  it("shows infrastructure attributes when option is set", () => {
    const diagram = entityDefinitionsToMermaidClassDiagram([countryEntityDefinition], {
      showInfrastructureAttributes: true,
    });
    expect(diagram).toContain("+UUID uuid");
    expect(diagram).toContain("+String parentName?");
    expect(diagram).toContain("+UUID parentUuid");
  });

  it("renders FK attributes as associations, not class members", () => {
    const diagram = entityDefinitionsToMermaidClassDiagram(allEntityDefinitions);
    // FK attributes should NOT appear in class bodies
    expect(diagram).not.toMatch(/class Author \{[\s\S]*?\+UUID country/);
    // But should appear as relationship lines
    expect(diagram).toContain('Author "*" --> "0..1" Country : country');
  });

  it("renders required FK with cardinality 1", () => {
    const diagram = entityDefinitionsToMermaidClassDiagram(allEntityDefinitions);
    expect(diagram).toContain('Book "*" --> "1" Author : author');
    expect(diagram).toContain('Book "*" --> "1" Publisher : publisher');
  });

  it("renders optional FK with cardinality 0..1", () => {
    const diagram = entityDefinitionsToMermaidClassDiagram(allEntityDefinitions);
    expect(diagram).toContain('Author "*" --> "0..1" Country : country');
    expect(diagram).toContain('Publisher "*" --> "0..1" Country : country');
  });

  it("supports LR direction", () => {
    const diagram = entityDefinitionsToMermaidClassDiagram(allEntityDefinitions, {
      direction: "LR",
    });
    expect(diagram).toContain("direction LR");
    expect(diagram).not.toContain("direction TB");
  });

  it("renders title when showTitle is true", () => {
    const diagram = entityDefinitionsToMermaidClassDiagram(allEntityDefinitions, {
      showTitle: true,
      title: "Library Model",
    });
    expect(diagram).toContain("title: Library Model");
  });

  it("does not render title by default", () => {
    const diagram = entityDefinitionsToMermaidClassDiagram(allEntityDefinitions);
    expect(diagram).not.toContain("title:");
  });

  it("renders classDef colour directives", () => {
    const diagram = entityDefinitionsToMermaidClassDiagram(allEntityDefinitions, {
      classColors: {
        highlight: { fill: "#f9f", stroke: "#333", color: "#000" },
      },
      entityColorAssignment: {
        Book: "highlight",
      },
    });
    expect(diagram).toContain("classDef highlight fill:#f9f,stroke:#333,color:#000");
    expect(diagram).toContain("class Book highlight");
  });

  it("renders attribute labels as comments when showAttributeLabels is true", () => {
    const diagram = entityDefinitionsToMermaidClassDiagram([countryEntityDefinition], {
      showAttributeLabels: true,
    });
    expect(diagram).toContain("%% Name");
    expect(diagram).toContain("%% Country Code");
    expect(diagram).toContain("%% Icon");
  });

  it("handles empty entity definitions list", () => {
    const diagram = entityDefinitionsToMermaidClassDiagram([]);
    expect(diagram).toContain("classDiagram");
    expect(diagram).toContain("direction TB");
    // No classes or relationships, just the header
    expect(diagram).not.toContain("class ");
  });

  it("handles entity definition with empty mlSchema definition", () => {
    const emptyDef: EntityDefinition = {
      uuid: "test-uuid",
      parentName: "EntityDefinition",
      parentUuid: "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd",
      entityUuid: "test-entity-uuid",
      name: "EmptyEntity",
      mlSchema: { type: "object", definition: {} } as any,
    };
    const diagram = entityDefinitionsToMermaidClassDiagram([emptyDef]);
    expect(diagram).toContain("class EmptyEntity {");
    expect(diagram).toContain("}");
  });
});

describe("metaModelToMermaidClassDiagram", () => {
  it("generates diagram from a MetaModel-like structure", () => {
    const metaModel = {
      entities: [
        { uuid: "d3139a6d", parentUuid: "16dbfe28", name: "Country" },
        { uuid: "d7a144ff", parentUuid: "16dbfe28", name: "Author" },
      ] as any[],
      entityDefinitions: [countryEntityDefinition, authorEntityDefinition],
    };
    const diagram = metaModelToMermaidClassDiagram(metaModel);
    expect(diagram).toContain("classDiagram");
    expect(diagram).toContain("class Country {");
    expect(diagram).toContain("class Author {");
  });
});

describe("full Library model diagram", () => {
  it("produces a complete diagram for the library model", () => {
    const diagram = entityDefinitionsToMermaidClassDiagram(allEntityDefinitions, {
      showTitle: true,
      title: "Library Application Model",
      direction: "TB",
    });

    // Verify structure
    const lines = diagram.split("\n");
    expect(lines[0]).toBe("---");
    expect(lines[1]).toBe("title: Library Application Model");
    expect(lines[2]).toBe("---");
    expect(lines[3]).toBe("classDiagram");
    expect(lines[4]).toBe("  direction TB");

    // Verify all 4 classes present
    expect(diagram).toContain("class Country {");
    expect(diagram).toContain("class Author {");
    expect(diagram).toContain("class Book {");
    expect(diagram).toContain("class Publisher {");

    // Verify all 4 relationships present
    expect(diagram).toContain("Author");
    expect(diagram).toContain("Country");
    expect(diagram).toContain("Book");
    expect(diagram).toContain("Publisher");

    // Verify Country has no outgoing FK relationships
    expect(diagram).not.toMatch(/Country "\*" -->/);
  });
});
