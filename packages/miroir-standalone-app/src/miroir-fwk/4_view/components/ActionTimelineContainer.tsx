import { useEffect, useState } from 'react';
import { useMiroirContextService } from '../MiroirContextReactProvider.js';
import { DraggableContainer } from './DraggableContainer.js';
import { RunActionTimeline } from './RunActionTimeline.js';

// Separate component to manage action timeline display state independently
export const ActionTimelineContainer = () => {
  const context = useMiroirContextService();

  // Debug logging to track timeline visibility and re-renders
  console.log('ActionTimelineContainer render:', { 
    showActionTimeline: context.showActionTimeline,
    timestamp: new Date().toISOString()
  });

  // Only render if action timeline display is enabled
  if (!context.showActionTimeline) {
    console.log('ActionTimelineContainer returning null (timeline should be hidden)');
    return null;
  }

  console.log('ActionTimelineContainer rendering DraggableContainer (timeline should be visible)');
  return (
    <DraggableContainer
      title="Action Timeline"
      storageKey="actionTimelinePosition"
      defaultPosition={{ x: window.innerWidth - 520, y: 60 }}
      defaultSize={{ width: 500, height: 600 }}
      onClose={() => {
        console.log('Action Timeline close button clicked');
        context.setShowActionTimeline?.(false);
      }}
    >
      <RunActionTimeline />
    </DraggableContainer>
  );
};
