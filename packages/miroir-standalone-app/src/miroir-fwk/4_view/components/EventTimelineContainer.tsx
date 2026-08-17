import { useMiroirContextService } from 'miroir-react';
import { LoggerInterface, MiroirLoggerFactory } from 'miroir-core';
import { packageName } from '../../../constants';
import { cleanLevel } from '../constants';
import { DraggableContainer } from './DraggableContainer.js';
import { MiroirEventTimeLine } from './MiroirEventTimeline.js';

const _miroirLoggerName = MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "EventTimelineContainer");
let log: LoggerInterface = MiroirLoggerFactory.getPreStartLogger(_miroirLoggerName);
MiroirLoggerFactory.registerLoggerToStart(_miroirLoggerName, "UI").then((logger: LoggerInterface) => { log = logger; });

// Separate component to manage action timeline display state independently
export const EventTimelineContainer = () => {
  const context = useMiroirContextService();

  // Debug logging to track timeline visibility and re-renders
  // console.log('EventTimelineContainer render:', { 
  //   showActionTimeline: context.showActionTimeline,
  //   timestamp: new Date().toISOString()
  // });

  // Only render if action timeline display is enabled
  if (!context.showActionTimeline) {
    // console.log('EventTimelineContainer returning null (timeline should be hidden)');
    return null;
  }

  log.debug('EventTimelineContainer rendering DraggableContainer (timeline should be visible)');
  return (
    <DraggableContainer
      title="Action Timeline"
      storageKey="actionTimelinePosition"
      defaultPosition={{ x: window.innerWidth - 520, y: 60 }}
      defaultSize={{ width: 500, height: 600 }}
      onClose={() => {
        log.debug('Action Timeline close button clicked');
        context.setShowActionTimeline?.(false);
      }}
    >
      <MiroirEventTimeLine />
    </DraggableContainer>
  );
};
