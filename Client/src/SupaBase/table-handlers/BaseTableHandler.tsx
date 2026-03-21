import { SupabaseClient } from "@supabase/supabase-js";
import { EventClass, EventClassEvents } from "../../Tools/EventClass";

export interface BaseTableHandlerOptions {
  client: SupabaseClient;
}

export enum BaseTableHandlerEventKey {
  DATA_LOADED = "data_loaded",
  DATA_CHANGED = "data_changed",
}

export enum RealtimeChangeEventType {
  DELETE = "DELETE",
  INSERT = "INSERT",
  UPDATE = "UPDATE",
}

export interface BaseTableHandlerEvent extends EventClassEvents {
  [BaseTableHandlerEventKey.DATA_LOADED]: () => void;
  [BaseTableHandlerEventKey.DATA_CHANGED]: () => void;
}

export abstract class BaseTableHandler<
  O extends BaseTableHandlerOptions = BaseTableHandlerOptions,
  E extends BaseTableHandlerEvent = BaseTableHandlerEvent,
> extends EventClass<E> {
  options: O;

  dataPromise: Promise<void>;
  dataLoaded: boolean;
  constructor(options: O) {
    super();
    this.options = options;
    this.dataLoaded = false;
  }

  get client(): SupabaseClient {
    return this.options.client;
  }

  abstract _loadData(): Promise<void>;

  public async loadData(refresh: boolean = false): Promise<void> {
    if (this.dataLoaded && !refresh) {
      return;
    }

    if (this.dataPromise) {
      return this.dataPromise;
    }

    this.dataPromise = this._loadData();
    await this.dataPromise;
    this.dataPromise = null;
    this.dataLoaded = true;
    this.fireUpdate((cb) => cb[BaseTableHandlerEventKey.DATA_LOADED]?.());
  }
}
