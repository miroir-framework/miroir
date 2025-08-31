import { MiroirEventTrackerInterface } from "../0_interfaces/3_controllers/MiroirEventTrackerInterface";

export class TransformerGlobalContext {
  private static eventTracker: MiroirEventTrackerInterface | undefined = undefined;

  public static setEventTracker(tracker: MiroirEventTrackerInterface | undefined): void {
    TransformerGlobalContext.eventTracker = tracker;
  }

  public static getEventTracker(): MiroirEventTrackerInterface | undefined {
    return TransformerGlobalContext.eventTracker;
  }

  public static reset(): void {
    TransformerGlobalContext.eventTracker = undefined;
  }
}
