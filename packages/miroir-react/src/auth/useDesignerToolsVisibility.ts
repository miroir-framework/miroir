import { effectiveShowModelTools, isDesignerToolsVisible } from "miroir-core";
import { useMiroirContextService } from "../contexts/MiroirContextReactProvider.js";

import { useAuthSession } from "./authSession.js";
import { useApplicationAccess } from "./useApplicationAccess.js";

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
