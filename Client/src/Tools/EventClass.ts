import { GenerateId } from "./Toolbox";
export type DeregisterCB = () => void;

export interface EventClassEvents {
  [key: string]: (...args: any[]) => any;
}

export type Listeners<EVENTS extends EventClassEvents = EventClassEvents> = Map<
  string,
  Partial<EVENTS>
>;

export class EventClass<EVENTS extends EventClassEvents = EventClassEvents> {
  protected listeners: Listeners<EVENTS>;

  constructor() {
    this.listeners = new Map();
  }

  fireUpdate(iterator: (listener: Partial<EVENTS>) => void) {
    this.listeners.forEach(iterator);
  }

  addListener(cb: Partial<EVENTS>): DeregisterCB {
    const id: string = GenerateId();

    if (this.listeners.has(id)) {
      return this.addListener(cb);
    }

    this.listeners.set(id, cb);

    return () => {
      this.removeListener(id);
    };
  }

  removeListener(id: string) {
    this.listeners.delete(id);
  }

  clearListeners() {
    this.listeners.clear();
  }
}
