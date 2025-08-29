// Example demonstrating ActionLogService using RunActionTracker instead of LoggerGlobalContext

import { RunActionTracker } from '../src/3_controllers/RunActionTracker';
import { ActionLogService } from '../src/3_controllers/ActionLogService';

// Create instances
const runActionTracker = new RunActionTracker();
const actionLogService = new ActionLogService(runActionTracker);

// Start tracking an action
const actionId = runActionTracker.startAction('testAction', 'Example Action');

// Set action context using RunActionTracker (no longer using LoggerGlobalContext)
runActionTracker.setAction('myExampleAction');
runActionTracker.setCompositeAction('myCompositeAction');

// Log a message - ActionLogService will get context from RunActionTracker
actionLogService.logForCurrentAction('info', 'ExampleLogger', 'This is a test message');

// Get the logs and see the context comes from RunActionTracker
const logs = actionLogService.getActionLogs(actionId);
console.log('Log context:', logs?.logs[0]?.context);
// Output will show:
// {
//   testSuite: undefined,    // from LoggerGlobalContext (for test functionality)
//   test: undefined,         // from LoggerGlobalContext (for test functionality)
//   testAssertion: undefined, // from LoggerGlobalContext (for test functionality)
//   compositeAction: 'myCompositeAction', // from RunActionTracker (NEW!)
//   action: 'myExampleAction'              // from RunActionTracker (NEW!)
// }

// Clean up
runActionTracker.endAction(actionId);
