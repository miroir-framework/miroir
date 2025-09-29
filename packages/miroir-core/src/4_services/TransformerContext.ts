import { MiroirActivityTrackerInterface } from "../0_interfaces/3_controllers/MiroirActivityTrackerInterface";

export class TransformerGlobalContext {
  private static eventTracker: MiroirActivityTrackerInterface | undefined = undefined;

  public static setEventTracker(tracker: MiroirActivityTrackerInterface | undefined): void {
    TransformerGlobalContext.eventTracker = tracker;
  }

  public static getEventTracker(): MiroirActivityTrackerInterface | undefined {
    return TransformerGlobalContext.eventTracker;
  }

  public static reset(): void {
    TransformerGlobalContext.eventTracker = undefined;
  }
}
