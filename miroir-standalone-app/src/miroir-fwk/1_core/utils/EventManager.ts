import { stringTuple } from "src/miroir-fwk/1_core/utils/utils";

export const EventStatusTypeStringValues:string[] = stringTuple('OK', 'Fail');
export type EventStatusTypeString = typeof EventStatusTypeStringValues[number];

export interface Event<EventNames, EventParams> {
  eventName:EventNames, status: EventStatusTypeString, param?:EventParams
}

export interface Observer<EventType> {
  takeEvery(localStoreEvent:EventType):void;
}

export class EventManager<EventType> {
  private observers: Set<Observer<EventType>> = new Set();

  public observerSubscribe(observer:Observer<EventType>) {
    console.log('observerSubscribe', observer);
    this.observers.add(observer);
  }

  public observerUnsubscribe(observer:Observer<EventType>) {
    this.observers.delete(observer);
  }

  public dispatch(event: EventType): void {
    console.log(
      "EventManager notify reveived Event",
      event,
      this
    );
    this.observers.forEach(o => o.takeEvery(event))
    // this.mReduxStore.fetchInstancesFromDatastoreForEntityList(
    //   event.param
    // );
  }

}
