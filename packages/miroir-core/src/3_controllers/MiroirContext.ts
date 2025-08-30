import { MiroirConfigClient, MiroirConfigServer } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { MiroirContextInterface } from "../0_interfaces/3_controllers/MiroirContextInterface";
import { RunActionTrackerInterface } from "../0_interfaces/3_controllers/RunActionTrackerInterface";
import type { TestTrackerInterface } from "../0_interfaces/3_controllers/TestTrackerInterface";
import { LogInterceptor } from "../4_services/LogInterceptor";
import { ActionLogService, ActionLogServiceInterface, TestLogServiceCompatibilityWrapper } from "./ActionLogService";
import { RunActionTracker } from "./RunActionTracker";
import { TestLogService, type TestLogServiceInterface } from "./TestLogService";
import { TestTracker } from "./TestTracker";


export class MiroirContext implements MiroirContextInterface {
  // public errorLogService:ErrorLogServiceInterface;
  public runActionTracker: RunActionTrackerInterface;
  public actionLogService: ActionLogServiceInterface;
  public testTracker: TestTrackerInterface; // Backwards compatibility - points to same instance as runActionTracker
  public testLogService: TestLogServiceInterface; // Backwards compatibility - unified with actionLogService
  public logInterceptor: LogInterceptor;

  constructor(public miroirConfig?: MiroirConfigClient | MiroirConfigServer | undefined) {
    // this.errorLogService = new ErrorLogService();
    
    // Create enhanced RunActionTracker that supports both actions and tests
    this.runActionTracker = new RunActionTracker();
    
    // For backwards compatibility, testTracker points to the same enhanced instance
    this.testTracker = this.runActionTracker as TestTrackerInterface;
    
    // Create unified ActionLogService that handles both action and test logs
    this.actionLogService = new ActionLogService(this.runActionTracker);
    
    // For backwards compatibility, testLogService uses a compatibility wrapper
    this.testLogService = new TestLogServiceCompatibilityWrapper(this.actionLogService as ActionLogService);
    
    // Create unified log interceptor for both action and test logging
    this.logInterceptor = new LogInterceptor({
      action: {
        actionLogService: this.actionLogService,
        runActionTracker: this.runActionTracker
      },
      test: {
        testLogService: this.testLogService,
        testTracker: this.testTracker
      }
    });
    
    // Start intercepting logs for both action and test tracking
    this.logInterceptor.start();
  }

  getMiroirConfig(): MiroirConfigClient | MiroirConfigServer | undefined {
    return this.miroirConfig;
  }
}
