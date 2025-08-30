import { GenerateId } from "./Toolbox";

export type DeregisterCB = () => void;
export type ListenerCB<T extends string = string> = Partial<
  Record<T, (value: any) => void>
>;
export type Listeners = Map<string, ListenerCB>;

export class Eventer<T extends string = string> {
  listeners: Listeners;

  constructor() {
    this.listeners = new Map();
  }

  updateListeners(key: T | string, value: any) {
    this.listeners.forEach((cb: ListenerCB) => cb[key]?.(value));
  }

  addListener(cb: ListenerCB<T>): DeregisterCB {
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

export class EventableClass<T extends string = string> {
  eventer: Eventer<T> = new Eventer();

  public addListener(cb: ListenerCB<T>): DeregisterCB {
    return this.eventer.addListener(cb);
  }

  protected fireUpdate(key: T | string, data: any) {
    this.eventer.updateListeners(key, data);
  }

  destroy() {
    this.eventer.clearListeners();
  }
}
