import { stringTuple } from "src/miroir-fwk/1_core/utils/utils";

export const EventStatusTypeStringValues:string[] = stringTuple('OK', 'Fail');
export type EventStatusTypeString = typeof EventStatusTypeStringValues[number];

export interface Event<EventNameType, EventParamsType> {
  eventName:EventNameType, status: EventStatusTypeString, param?:EventParamsType
}

// export interface Observer<EventType> {
//   // takeEvery(localStoreEvent:EventType):void;
// }

export interface EventManagerSubscribeInterface<EventTypeParam,EventNameType> {
  observerSubscribe(takeEvery:(localStoreEvent:EventTypeParam) => void);
  observerMatcherSubscribe(matchingEvents:EventMatchParameters<EventTypeParam,EventNameType>[]);
  // useful?
  observerUnsubscribe(takeEvery:(localStoreEvent:EventTypeParam) => void);
}

export interface EventManagerInterface<EventType,EventNameType> extends EventManagerSubscribeInterface<EventType,EventNameType> {
  dispatch(event: EventType): void;
}

export interface EventMatchParameters<EventType,EventNameType> {
  eventName:EventNameType, 
  status?: EventStatusTypeString,
  takeEvery:(localStoreEvent:EventType) => void,
}

export class EventManager<EventTypeParam extends Event<EventNameType, any>,EventNameType> {
  private globallySubscribedObservers: Set<(localStoreEvent:EventTypeParam) => void> = new Set();
  private subscribedMatchObservers: Set<EventMatchParameters<EventTypeParam,EventNameType>> = new Set();

  // ###############################################################################
  public observerSubscribeMatcher(matchingEvents:EventMatchParameters<EventTypeParam,EventNameType>[])
  {
    console.log('observerSubscribe', matchingEvents);
    // this.globallySubscribedObservers.add(observer);
    matchingEvents.forEach(m => this.subscribedMatchObservers.add(m));
  }

  // ###############################################################################
  public observerSubscribe(takeEvery:(localStoreEvent:EventTypeParam) => void) {
    // console.log('observerSubscribe', observer);
    this.globallySubscribedObservers.add(takeEvery);
  }

  // ###############################################################################
  public observerUnsubscribe(takeEvery:(localStoreEvent:EventTypeParam) => void) {
    this.globallySubscribedObservers.delete(takeEvery);
  }

  // ###############################################################################
  public dispatch(event: EventTypeParam): void {
    console.log("EventManager notify reveived Event", event, this);

    const matchingObserverFunctions:((localStoreEvent: EventTypeParam)=>void)[] = 
      Array.from(this.globallySubscribedObservers.values())//.map((takeEvery:(localStoreEvent:EventTypeParam) => void)=>takeEvery(o))
      .concat(
        Array.from(this.subscribedMatchObservers.values())
        .filter(
          m => m.eventName == event.eventName && (!m.status || m.status == event.status)
        )
        .map(
          m => m.takeEvery
        )
      )
    ;
    matchingObserverFunctions.forEach(f => f(event))
  }
}
