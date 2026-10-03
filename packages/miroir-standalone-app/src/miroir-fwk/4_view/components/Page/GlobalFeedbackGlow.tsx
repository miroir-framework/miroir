import React from "react";

import { FeedbackGlowBoundary, useMiroirContextService } from "miroir-react";

// ################################################################################################
// #438: the global feedback glow switch applied to the document element, so that portals rendered
// to `document.body` glow too. Off renders no attribute ("inherit"), so nothing is attached.
// ################################################################################################
export const GlobalFeedbackGlow: React.FC = () => {
  const context = useMiroirContextService();
  return <FeedbackGlowBoundary target="document" enabled={context.feedbackGlowEnabled ? true : "inherit"} />;
};
