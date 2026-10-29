import { effectiveShowModelTools, isDesignerToolsVisible } from "miroir-core";
import { useMiroirContextService } from "miroir-react";

import { useAuthSession } from "miroir-react";
import { useApplicationAccess } from "miroir-react";

export function useDesignerToolsVisibility(): {
  designerToolsVisible: boolean;
  showModelTools: boolean;
} {
  const context = useMiroirContextService();
  const { enabled, principal } = useAuthSession();
  const { grants } = useApplicationAccess();
  const designerToolsVisible = isDesignerToolsVisible({
    designerTools: context.processCapabilities.designerTools,
    authEnabled: enabled,
    principal,
    grants,
  });
  return {
    designerToolsVisible,
    showModelTools: effectiveShowModelTools(designerToolsVisible, context.showModelTools),
  };
}
