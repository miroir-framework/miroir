/**
 * Unit tests for the Mermaid class-diagram generation domain library.
 *
 * These are pure-function tests (layer 2 – domain); no side effects, no
 * mocking, no external dependencies beyond the library itself and the
 * Entity type from miroir-core.
 */

import { describe, it, expect } from "vitest";
import type { Entity } from "miroir-core";
import {
  jzodTypeToUml,
  sanitiseMermaidId,
  buildEntityUuidToNameMap,
  extractClassInfo,
  extractRelationships,
  entitiesToMermaidClassDiagram,
  metaModelToMermaidClassDiagram,
  buildEntityClickLinks,
  buildEntityVersionClickLinks,
  coerceDiagramCarriersToEntities,
  type ClassDiagramOptions,
} from "../src/2_domain/entitiesToMermaidClassDiagram.js";
import {
  entitiesToMermaidErDiagram,
  type ErDiagramOptions,
} from "../src/2_domain/entitiesToMermaidErDiagram.js";

// ############################################################################
// Test fixtures – minimal Entities (mlSchema) modelled after the Library app
// ############################################################################

const countryEntity: Entity = {
  uuid: "d3139a6d-0486-4ec8-bded-2a83a3c3cee4",
  parentName: "Entity",
  parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
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

const authorEntity: Entity = {
  uuid: "d7a144ff-d1b9-4135-800c-a7cfc1f38733",
  parentName: "Entity",
  parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
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

const bookEntity: Entity = {
  uuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
  parentName: "Entity",
  parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
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

const publisherEntity: Entity = {
  uuid: "a027c379-8468-43a5-ba4d-bf618be25cab",
  parentName: "Entity",
  parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
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

const allEntities: Entity[] = [
  countryEntity,
  authorEntity,
  bookEntity,
  publisherEntity,
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
    const map = buildEntityUuidToNameMap(allEntities);
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
    const cls = extractClassInfo(countryEntity);
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
    const cls = extractClassInfo(countryEntity, { showInfrastructureAttributes: true });
    const attrNames = cls.attributes.map((a) => a.name);
    expect(attrNames).toContain("uuid");
    expect(attrNames).toContain("parentName");
    expect(attrNames).toContain("parentUuid");
    expect(attrNames).toContain("conceptLevel");
  });

  it("identifies foreign key attributes", () => {
    const cls = extractClassInfo(authorEntity);
    const countryAttr = cls.attributes.find((a) => a.name === "country");
    expect(countryAttr).toBeDefined();
    expect(countryAttr!.isForeignKey).toBe(true);
    expect(countryAttr!.targetEntityUuid).toBe("d3139a6d-0486-4ec8-bded-2a83a3c3cee4");
  });

  it("marks optional attributes correctly", () => {
    const cls = extractClassInfo(authorEntity);
    const langAttr = cls.attributes.find((a) => a.name === "language");
    expect(langAttr!.optional).toBe(true);

    const nameAttr = cls.attributes.find((a) => a.name === "name");
    expect(nameAttr!.optional).toBe(false);
  });

  it("extracts description from entity definition", () => {
    const cls = extractClassInfo(countryEntity);
    expect(cls.description).toBe("Country");
  });

  it("extracts entity name and uuid", () => {
    const cls = extractClassInfo(bookEntity);
    expect(cls.name).toBe("Book");
    expect(cls.entityUuid).toBe("e8ba151b-d68e-4cc3-9a83-3459d309ccf5");
  });

  it("detects multiple foreign keys in one entity", () => {
    const cls = extractClassInfo(bookEntity);
    const fkAttrs = cls.attributes.filter((a) => a.isForeignKey);
    expect(fkAttrs).toHaveLength(2);
    expect(fkAttrs.map((a) => a.name).sort()).toEqual(["author", "publisher"]);
  });
});

describe("extractRelationships", () => {
  it("extracts FK relationships between classes", () => {
    const entityUuidToName = buildEntityUuidToNameMap(allEntities);
    const classes = allEntities.map((ed) => extractClassInfo(ed));
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
    const classes = [extractClassInfo(countryEntity)];
    const entityUuidToName = buildEntityUuidToNameMap([countryEntity]);
    const rels = extractRelationships(classes, entityUuidToName);
    expect(rels).toEqual([]);
  });

  it("ignores FKs pointing to entities not in the provided list", () => {
    // Author references Country, but Country is not included
    const classes = [extractClassInfo(authorEntity)];
    const entityUuidToName = buildEntityUuidToNameMap([authorEntity]);
    const rels = extractRelationships(classes, entityUuidToName);
    // Should be empty because Country is not in the map
    expect(rels).toEqual([]);
  });
});

describe("entitiesToMermaidClassDiagram", () => {
  it("produces valid Mermaid classDiagram header", () => {
    const diagram = entitiesToMermaidClassDiagram(allEntities);
    expect(diagram).toContain("classDiagram");
    expect(diagram).toContain("direction TB");
  });

  it("defines classes for all entity definitions", () => {
    const diagram = entitiesToMermaidClassDiagram(allEntities);
    expect(diagram).toContain("class Country {");
    expect(diagram).toContain("class Author {");
    expect(diagram).toContain("class Book {");
    expect(diagram).toContain("class Publisher {");
  });

  it("includes domain attributes but not infrastructure attributes", () => {
    const diagram = entitiesToMermaidClassDiagram([countryEntity]);
    // Domain attributes
    expect(diagram).toContain("+String name");
    expect(diagram).toContain("+String iso3166_1Alpha_2?");
    expect(diagram).toContain("+String icon?");
    // Infrastructure attributes should be absent
    expect(diagram).not.toMatch(/\+UUID uuid/);
    expect(diagram).not.toMatch(/\+String parentName/);
  });

  it("shows infrastructure attributes when option is set", () => {
    const diagram = entitiesToMermaidClassDiagram([countryEntity], {
      showInfrastructureAttributes: true,
    });
    expect(diagram).toContain("+UUID uuid");
    expect(diagram).toContain("+String parentName?");
    expect(diagram).toContain("+UUID parentUuid");
  });

  it("renders FK attributes as associations, not class members", () => {
    const diagram = entitiesToMermaidClassDiagram(allEntities);
    // FK attributes should NOT appear in class bodies
    expect(diagram).not.toMatch(/class Author \{[\s\S]*?\+UUID country/);
    // But should appear as relationship lines
    expect(diagram).toContain('Author "*" --> "0..1" Country : country');
  });

  it("renders required FK with cardinality 1", () => {
    const diagram = entitiesToMermaidClassDiagram(allEntities);
    expect(diagram).toContain('Book "*" --> "1" Author : author');
    expect(diagram).toContain('Book "*" --> "1" Publisher : publisher');
  });

  it("renders optional FK with cardinality 0..1", () => {
    const diagram = entitiesToMermaidClassDiagram(allEntities);
    expect(diagram).toContain('Author "*" --> "0..1" Country : country');
    expect(diagram).toContain('Publisher "*" --> "0..1" Country : country');
  });

  it("supports LR direction", () => {
    const diagram = entitiesToMermaidClassDiagram(allEntities, {
      direction: "LR",
    });
    expect(diagram).toContain("direction LR");
    expect(diagram).not.toContain("direction TB");
  });

  it("renders title when showTitle is true", () => {
    const diagram = entitiesToMermaidClassDiagram(allEntities, {
      showTitle: true,
      title: "Library Model",
    });
    expect(diagram).toContain("title: Library Model");
  });

  it("does not render title by default", () => {
    const diagram = entitiesToMermaidClassDiagram(allEntities);
    expect(diagram).not.toContain("title:");
  });

  it("renders classDef colour directives", () => {
    const diagram = entitiesToMermaidClassDiagram(allEntities, {
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
    const diagram = entitiesToMermaidClassDiagram([countryEntity], {
      showAttributeLabels: true,
    });
    expect(diagram).toContain("%% Name");
    expect(diagram).toContain("%% Country Code");
    expect(diagram).toContain("%% Icon");
  });

  it("handles empty entity definitions list", () => {
    const diagram = entitiesToMermaidClassDiagram([]);
    expect(diagram).toContain("classDiagram");
    expect(diagram).toContain("direction TB");
    // No classes or relationships, just the header
    expect(diagram).not.toContain("class ");
  });

  it("handles entity definition with empty mlSchema definition", () => {
    const emptyDef: Entity = {
      uuid: "test-entity-uuid",
      parentName: "Entity",
      parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
      name: "EmptyEntity",
      mlSchema: { type: "object", definition: {} } as any,
    };
    const diagram = entitiesToMermaidClassDiagram([emptyDef]);
    expect(diagram).toContain("class EmptyEntity {");
    expect(diagram).toContain("}");
  });
});

describe("metaModelToMermaidClassDiagram", () => {
  it("generates diagram from MetaModel entities with mlSchema", () => {
    const metaModel = {
      entities: [countryEntity, authorEntity],
    };
    const diagram = metaModelToMermaidClassDiagram(metaModel);
    expect(diagram).toContain("classDiagram");
    expect(diagram).toContain("class Country {");
    expect(diagram).toContain("class Author {");
  });

  it("ignores entities without mlSchema", () => {
    const metaModel = {
      entities: [
        {
          uuid: countryEntity.uuid,
          parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
          name: "Country",
          // no mlSchema
        },
        countryEntity,
      ] as any[],
    };
    const diagram = metaModelToMermaidClassDiagram(metaModel);
    expect(diagram).toContain("class Country {");
  });
});

describe("buildEntityClickLinks", () => {
  it("maps sanitised entity name to Entity uuid", () => {
    const links = buildEntityClickLinks([
      { uuid: countryEntity.uuid, name: "Country" },
      { uuid: authorEntity.uuid, name: "Author" },
    ]);
    expect(links).toEqual({
      Country: countryEntity.uuid,
      Author: authorEntity.uuid,
    });
  });

  it("sanitises entity names with special characters", () => {
    const links = buildEntityClickLinks([
      { ...countryEntity, uuid: "aaaa-bbbb", name: "My-Entity" },
    ]);
    expect(links).toEqual({ My_Entity: "aaaa-bbbb" });
  });

  it("returns empty map for empty input", () => {
    expect(buildEntityClickLinks([])).toEqual({});
  });
});

describe("coerceDiagramCarriersToEntities", () => {
  it("Entity mode keeps carrier uuid (present-model Entity)", () => {
    const carriers = coerceDiagramCarriersToEntities([
      {
        uuid: "ev-row-uuid",
        entityUuid: countryEntity.uuid,
        name: "Country",
        parentName: "Entity",
        mlSchema: countryEntity.mlSchema,
      },
    ]);
    expect(carriers).toHaveLength(1);
    expect(carriers[0].uuid).toBe("ev-row-uuid");
    expect(carriers[0].mlSchema).toEqual(countryEntity.mlSchema);
  });

  it("EntityVersion mode uses entityUuid so FK targetEntity edges resolve", () => {
    const carriers = coerceDiagramCarriersToEntities(
      [
        {
          uuid: "ev-row-uuid",
          entityUuid: countryEntity.uuid,
          name: "Country",
          mlSchema: countryEntity.mlSchema,
        },
      ],
      "EntityVersion",
    );
    expect(carriers).toHaveLength(1);
    expect(carriers[0].uuid).toBe(countryEntity.uuid);
  });
});

describe("buildEntityVersionClickLinks", () => {
  it("maps sanitised name to EntityVersion instance uuid", () => {
    const links = buildEntityVersionClickLinks([
      { uuid: "ev-country", name: "Country" },
      { uuid: "ev-author", name: "Author" },
    ]);
    expect(links).toEqual({
      Country: "ev-country",
      Author: "ev-author",
    });
  });
});

describe("full Library model diagram", () => {
  it("produces a complete diagram for the library model", () => {
    const diagram = entitiesToMermaidClassDiagram(allEntities, {
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

// ############################################################################
// classClickLinks option in entitiesToMermaidClassDiagram
// ############################################################################

describe("entitiesToMermaidClassDiagram with classClickLinks", () => {
  it("emits click directives for each entry in classClickLinks", () => {
    const clickLinks: Record<string, string> = {
      Country: "d3139a6d-0486-4ec8-bded-2a83a3c3cee4",
      Author: "d7a144ff-d1b9-4135-800c-a7cfc1f38733",
    };
    const diagram = entitiesToMermaidClassDiagram(allEntities, { classClickLinks: clickLinks });
    expect(diagram).toContain('click Country call miroirDiagramClassClick("d3139a6d-0486-4ec8-bded-2a83a3c3cee4")');
    expect(diagram).toContain('click Author call miroirDiagramClassClick("d7a144ff-d1b9-4135-800c-a7cfc1f38733")');
  });

  it("does not emit click directives when classClickLinks is absent", () => {
    const diagram = entitiesToMermaidClassDiagram(allEntities);
    expect(diagram).not.toContain("click ");
  });

  it("does not emit click directives when classClickLinks is empty", () => {
    const diagram = entitiesToMermaidClassDiagram(allEntities, { classClickLinks: {} });
    expect(diagram).not.toContain("click ");
  });

  it("emits click directives only for entities present in classClickLinks", () => {
    const clickLinks: Record<string, string> = {
      Book: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
    };
    const diagram = entitiesToMermaidClassDiagram(allEntities, { classClickLinks: clickLinks });
    expect(diagram).toContain('click Book call miroirDiagramClassClick("e8ba151b-d68e-4cc3-9a83-3459d309ccf5")');
    expect(diagram).not.toContain("click Country call");
    expect(diagram).not.toContain("click Author call");
    expect(diagram).not.toContain("click Publisher call");
  });

  it("combines classClickLinks with classColors and entityColorAssignment", () => {
    const clickLinks = buildEntityClickLinks(allEntities);
    const diagram = entitiesToMermaidClassDiagram(allEntities, {
      classClickLinks: clickLinks,
      classColors: { highlight: { fill: "#f9f" } },
      entityColorAssignment: { Book: "highlight" },
    });
    expect(diagram).toContain('click Country call miroirDiagramClassClick("d3139a6d-0486-4ec8-bded-2a83a3c3cee4")');
    expect(diagram).toContain('click Book call miroirDiagramClassClick("e8ba151b-d68e-4cc3-9a83-3459d309ccf5")');
    expect(diagram).toContain("classDef highlight fill:#f9f");
    expect(diagram).toContain("class Book highlight");
  });

  it("click directives appear after class definitions and relationships", () => {
    const clickLinks = buildEntityClickLinks([countryEntity]);
    const diagram = entitiesToMermaidClassDiagram([countryEntity], {
      classClickLinks: clickLinks,
    });
    const classDefIndex = diagram.indexOf("class Country {");
    const clickIndex = diagram.indexOf('click Country call miroirDiagramClassClick("d3139a6d-0486-4ec8-bded-2a83a3c3cee4")');
    expect(classDefIndex).toBeGreaterThanOrEqual(0);
    expect(clickIndex).toBeGreaterThan(classDefIndex);
  });
});

// ############################################################################
// entitiesToMermaidErDiagram
// ############################################################################

describe("entitiesToMermaidErDiagram", () => {
  it("returns just 'erDiagram' for empty input", () => {
    const diagram = entitiesToMermaidErDiagram([]);
    expect(diagram.trim()).toBe("erDiagram");
  });

  it("emits an erDiagram block, not classDiagram", () => {
    const diagram = entitiesToMermaidErDiagram([countryEntity]);
    expect(diagram).toContain("erDiagram");
    expect(diagram).not.toContain("classDiagram");
  });

  it("emits an entity block for each entity definition", () => {
    const diagram = entitiesToMermaidErDiagram([countryEntity, authorEntity]);
    expect(diagram).toContain("Country {");
    expect(diagram).toContain("Author {");
  });

  it("excludes infrastructure attributes by default", () => {
    const diagram = entitiesToMermaidErDiagram([countryEntity]);
    expect(diagram).not.toMatch(/\buuid\s+uuid\b/);
    expect(diagram).not.toContain("parentName");
    expect(diagram).not.toContain("parentUuid");
    expect(diagram).not.toContain("conceptLevel");
    expect(diagram).toContain("name");
  });

  it("includes infrastructure attributes when showInfrastructureAttributes is true", () => {
    const diagram = entitiesToMermaidErDiagram([countryEntity], {
      showInfrastructureAttributes: true,
    });
    expect(diagram).toContain("parentName");
    expect(diagram).toContain("parentUuid");
  });

  it("marks FK attributes with FK keyword inside the entity block", () => {
    const diagram = entitiesToMermaidErDiagram([authorEntity]);
    expect(diagram).toMatch(/uuid\s+country\s+FK/);
  });

  it("emits a relationship line for each FK", () => {
    const diagram = entitiesToMermaidErDiagram([authorEntity, countryEntity]);
    // Author.country is optional FK → }o--||
    expect(diagram).toContain('Author }o--|| Country : "country"');
  });

  it("uses required cardinality (}|) for non-optional FK", () => {
    const diagram = entitiesToMermaidErDiagram(allEntities);
    // Book.author is required FK
    expect(diagram).toContain('Book }|--|| Author : "author"');
  });

  it("uses optional cardinality (}o) for optional FK", () => {
    const diagram = entitiesToMermaidErDiagram(allEntities);
    // Author.country is optional FK
    expect(diagram).toContain('Author }o--|| Country : "country"');
  });

  it("emits relationships for all entities with FKs", () => {
    const diagram = entitiesToMermaidErDiagram(allEntities);
    expect(diagram).toContain('Author }o--|| Country : "country"');
    expect(diagram).toContain('Book }|--|| Author : "author"');
    expect(diagram).toContain('Book }|--|| Publisher : "publisher"');
    expect(diagram).toContain('Publisher }o--|| Country : "country"');
  });

  it("emits no relationship lines when there are no FKs", () => {
    const diagram = entitiesToMermaidErDiagram([countryEntity]);
    // Country has no FK attributes
    expect(diagram).not.toMatch(/--\|\|/);
  });

  it("supports showTitle option", () => {
    const diagram = entitiesToMermaidErDiagram([countryEntity], {
      showTitle: true,
      title: "Library ER",
    });
    expect(diagram).toContain("title: Library ER");
  });

  it("does not emit title when showTitle is false", () => {
    const diagram = entitiesToMermaidErDiagram([countryEntity], {
      showTitle: false,
      title: "Library ER",
    });
    expect(diagram).not.toContain("title:");
  });

  it("does not emit click directives (erDiagram parser does not support them)", () => {
    // Mermaid erDiagram does not support `click … call` directives.  The
    // classClickLinks option is accepted for UUID lookup by DOM listeners in
    // the rendering component, but no directive is written into the diagram text.
    const clickLinks = { Country: "d3139a6d-0486-4ec8-bded-2a83a3c3cee4" };
    const diagram = entitiesToMermaidErDiagram([countryEntity], {
      classClickLinks: clickLinks,
    });
    expect(diagram).not.toContain("click ");
  });

  it("does not emit click directives when classClickLinks is absent", () => {
    const diagram = entitiesToMermaidErDiagram([countryEntity]);
    expect(diagram).not.toContain("click ");
  });

  it("sanitises entity names with special characters", () => {
    const specialDef: Entity = {
      ...countryEntity,
      uuid: "aaaa-1111",
      name: "My-Entity",
    };
    const diagram = entitiesToMermaidErDiagram([specialDef]);
    expect(diagram).toContain("My_Entity {");
    expect(diagram).not.toContain("My-Entity");
  });
});
