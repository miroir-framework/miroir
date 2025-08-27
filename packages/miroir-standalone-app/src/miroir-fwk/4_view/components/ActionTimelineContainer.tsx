import { useMiroirContextService } from '../MiroirContextReactProvider.js';
import { DraggableContainer } from './DraggableContainer.js';
import { RunActionTimeline } from './RunActionTimeline.js';

// Separate component to manage action timeline display state independently
export const ActionTimelineContainer = () => {
  const context = useMiroirContextService();

  // Only render if action timeline display is enabled
  if (!context.showActionTimeline) {
    return null;
  }

  return (
    <DraggableContainer
      title="Action Timeline"
      storageKey="actionTimelinePosition"
      defaultPosition={{ x: window.innerWidth - 520, y: 60 }}
      onClose={() => context.setShowActionTimeline?.(false)}
    >
      <RunActionTimeline />
    </DraggableContainer>
  );
};
