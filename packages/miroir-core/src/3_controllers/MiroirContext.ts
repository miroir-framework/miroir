import { MiroirConfigClient, MiroirConfigServer } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { MiroirContextInterface } from "../0_interfaces/3_controllers/MiroirContextInterface";
import { RunActionTrackerInterface } from "../0_interfaces/3_controllers/RunActionTrackerInterface";
import type { TestTrackerInterface } from "../0_interfaces/3_controllers/TestTrackerInterface";
import { LogInterceptor } from "../4_services/LogInterceptor";
import { ActionLogService, ActionLogServiceInterface } from "./ActionLogService";
import { RunActionTracker } from "./RunActionTracker";
import { TestLogService, type TestLogServiceInterface } from "./TestLogService";
import { TestTracker } from "./TestTracker";


export class MiroirContext implements MiroirContextInterface {
  // public errorLogService:ErrorLogServiceInterface;
  public runActionTracker: RunActionTrackerInterface;
  public actionLogService: ActionLogServiceInterface;
  public testTracker: TestTrackerInterface;
  public testLogService: TestLogServiceInterface;
  public logInterceptor: LogInterceptor;

  constructor(public miroirConfig?: MiroirConfigClient | MiroirConfigServer | undefined) {
    // this.errorLogService = new ErrorLogService();
    this.runActionTracker = new RunActionTracker();
    this.actionLogService = new ActionLogService(this.runActionTracker);
    this.testTracker = new TestTracker();
    this.testLogService = new TestLogService(this.testTracker);
    
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
