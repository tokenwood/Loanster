export enum EventType {
  SUPPLY_OFFER_CREATED,
  SUPPLY_OFFER_CANCELLED,
  COLLATERAL_TOKEN_DEPOSITED,
  COLLATERAL_TOKEN_WITHDRAWN,
  LOAN_CREATED,
  LOAN_REPAID,
  LOAN_CLAIMED,
  LOAN_PARAMS_CHANGED,
}

export interface EventId {
  eventType: EventType;
  suffix?: string | number;
}

/**
 * Event emitter to subscribe, dispatch, and unsubscribe to events.
 */
export const eventEmitter: {
  readonly events: Record<string, (() => void)[]>;
  dispatch(eventId: EventId): void;
  subscribe(eventId: EventId, callback: () => void): void;
  unsubscribe(eventId: EventId): void;
  getEventKey(eventId: EventId): string;
} = {
  //This is event object to store events.
  events: {},
  //Internal function to get event name from type and suffix
  getEventKey(eventId: EventId) {
    return `${eventId.eventType} ${eventId.suffix}`;
  },
  //This will dispatch the event and call the callback for every event.
  dispatch(eventId) {
    const eventName = this.getEventKey(eventId);
    if (!this.events[eventName]) return;
    this.events[eventName].forEach((callback: () => void) => callback());
  },
  //This will subscribe the event with a specific callback
  subscribe(eventId, callback) {
    const eventName = this.getEventKey(eventId);
    if (!this.events[eventName]) this.events[eventName] = [];
    if (!this.events[eventName]?.includes(callback)) {
      this.events[eventName]?.push(callback);
    }
  },
  //This will unsubscribe the event to avoid unnecessary event calls
  unsubscribe(eventId) {
    const eventName = this.getEventKey(eventId);
    if (!this.events[eventName]) return;
    delete this.events[eventName];
  },
};
