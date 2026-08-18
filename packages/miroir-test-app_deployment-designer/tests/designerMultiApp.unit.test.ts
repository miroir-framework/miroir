/// <reference types="vite/client" />

import { describe, expect, it } from "vitest";

import designerMenu from "../assets/designer_model/dde4c883-ae6d-47c3-b6df-26bc6e3c1842/dd168e5a-2a21-4d2d-a443-032c6d15eb22.json" with {
  type: "json",
};
import entityActivity from "../assets/designer_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/fd622624-1a7e-46fa-9964-c4ecfb543de3.json" with {
  type: "json",
};
import entityRole from "../assets/designer_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/702535cd-e6fa-49d6-aa6f-b5874821e5a3.json" with {
  type: "json",
};
import entityUserStory from "../assets/designer_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/59debf06-405d-4def-a7eb-3db45360310d.json" with {
  type: "json",
};
import reportDesignerApplicationDetails from "../assets/designer_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/f730ecf1-88b6-46ea-8147-aa24ff7cdfcf.json" with {
  type: "json",
};
import reportDesignerApplicationList from "../assets/designer_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/951d74b2-a3e9-4e07-8850-1d7d12909f11.json" with {
  type: "json",
};

const DESIGNER_SELF_APPLICATION = "880831db-4f76-40b1-97c0-6a2f3f4ffccb";
const LIBRARY_DESIGNER_APPLICATION = "5af03c98-fe5e-490b-b08f-e1230971c57f";
const DESIGNER_APPLICATION_LIST_UUID = "951d74b2-a3e9-4e07-8850-1d7d12909f11";

const activityData = import.meta.glob(
  "../assets/designer_data/fd622624-1a7e-46fa-9964-c4ecfb543de3/*.json",
  { eager: true },
) as Record<string, { default: { designerApplication?: string } }>;

const userStoryData = import.meta.glob(
  "../assets/designer_data/59debf06-405d-4def-a7eb-3db45360310d/*.json",
  { eager: true },
) as Record<string, { default: { designerApplication?: string } }>;

const roleData = import.meta.glob(
  "../assets/designer_data/702535cd-e6fa-49d6-aa6f-b5874821e5a3/*.json",
  { eager: true },
) as Record<string, { default: { designerApplication?: string } }>;

function countByDesignerApplication(
  instances: Record<string, { default: { designerApplication?: string } }>,
  designerApplicationUuid: string,
): number {
  return Object.values(instances).filter(
    (module) => module.default.designerApplication === designerApplicationUuid,
  ).length;
}

describe("designer multi-app requirements (#241)", () => {
  it("DesignerMenu lists Designer Applications first in Requirements", () => {
    const section = designerMenu.definition.definition[0];
    expect(section.items).toHaveLength(4);
    expect(section.items[0].label).toBe("Designer Applications");
    expect(section.items[0].reportUuid).toBe(DESIGNER_APPLICATION_LIST_UUID);
  });

  it("DesignerApplicationList is wired to the Designer selfApplication", () => {
    expect(reportDesignerApplicationList.name).toBe("DesignerApplicationList");
    expect(reportDesignerApplicationList.selfApplication).toBe(DESIGNER_SELF_APPLICATION);
    expect(reportDesignerApplicationList.definition.extractorTemplates.designerApplications.parentName).toBe(
      "DesignerApplication",
    );
  });

  it("DesignerApplicationDetails is a composite report scoped per DesignerApplication", () => {
    expect(reportDesignerApplicationDetails.name).toBe("DesignerApplicationDetails");
    expect(reportDesignerApplicationDetails.selfApplication).toBe(DESIGNER_SELF_APPLICATION);
    expect(reportDesignerApplicationDetails.definition.extractorTemplates.designerApplication.parentName).toBe(
      "DesignerApplication",
    );
    expect(reportDesignerApplicationDetails.definition.combinerTemplates.activitiesOfDesignerApplication.parentName).toBe(
      "Activity",
    );
    expect(
      reportDesignerApplicationDetails.definition.combinerTemplates.userStoriesOfDesignerApplication.parentName,
    ).toBe("UserStory");
    expect(reportDesignerApplicationDetails.definition.runtimeTransformers.rolesUsedByUserStories).toBeDefined();
    expect(reportDesignerApplicationDetails.definition.section.definition).toHaveLength(4);
  });

  it("Activity, UserStory, and Role list designerApplication as the first column", () => {
    expect(entityActivity.viewAttributes?.[0]).toBe("designerApplication");
    expect(entityUserStory.viewAttributes?.[0]).toBe("designerApplication");
    expect(entityRole.viewAttributes?.[0]).toBe("designerApplication");
  });

  it("Designer DesignerApplication is populated; Library DesignerApplication is empty", () => {
    expect(countByDesignerApplication(activityData, DESIGNER_SELF_APPLICATION)).toBe(3);
    expect(countByDesignerApplication(userStoryData, DESIGNER_SELF_APPLICATION)).toBe(5);
    expect(countByDesignerApplication(roleData, DESIGNER_SELF_APPLICATION)).toBe(3);

    expect(countByDesignerApplication(activityData, LIBRARY_DESIGNER_APPLICATION)).toBe(0);
    expect(countByDesignerApplication(userStoryData, LIBRARY_DESIGNER_APPLICATION)).toBe(0);
    expect(countByDesignerApplication(roleData, LIBRARY_DESIGNER_APPLICATION)).toBe(0);
  });
});
