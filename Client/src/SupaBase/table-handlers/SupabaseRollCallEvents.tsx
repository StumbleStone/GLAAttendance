import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import {
  InsertRollCallEvent,
  RollCallEventEntry,
  Tables,
  UpdateRollCallEvent,
} from "../types";
import {
  BaseTableHandler,
  BaseTableHandlerEvent,
  BaseTableHandlerEventKey,
  BaseTableHandlerOptions,
  RealtimeChangeEventType,
} from "./BaseTableHandler";

export interface SupabaseRollCallEventsOptions extends BaseTableHandlerOptions {}

export interface SupabaseRollCallEventsEvent extends BaseTableHandlerEvent {}

export class SupabaseRollCallEvents extends BaseTableHandler<
  SupabaseRollCallEventsOptions,
  SupabaseRollCallEventsEvent
> {
  rollCallEvents: Map<number, RollCallEventEntry>;

  constructor(options: BaseTableHandlerOptions) {
    super(options);
    this.rollCallEvents = new Map<number, RollCallEventEntry>();
  }

  async _loadData(): Promise<void> {
    console.log(`Loading RollCall Events`);
    const { data, error } = await this.client
      .from(Tables.ROLLCALL_EVENT)
      .select()
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(error);
      debugger;
    }

    this.rollCallEvents.clear();
    (data || []).forEach((entry: RollCallEventEntry) => {
      this.rollCallEvents.set(entry.id, entry);
    });

    console.log(`[${data?.length || 0}] RollCall Events loaded`);
  }

  async handleRollCallEventChangesFromRemote(
    payload: RealtimePostgresChangesPayload<{ [key: string]: any }>,
  ) {
    switch (payload.eventType) {
      case RealtimeChangeEventType.DELETE:
        return this.removeRollCallEventReceivedFromRemote(payload.old.id);
      case RealtimeChangeEventType.INSERT:
        return this.addRollCallEventReceivedFromRemote(
          payload.new as RollCallEventEntry,
        );
      case RealtimeChangeEventType.UPDATE:
        return this.updateRollCallEventReceivedFromRemote(
          payload.new as RollCallEventEntry,
        );
    }

    debugger;
  }

  async addRollCallEventReceivedFromRemote(entry: RollCallEventEntry) {
    if (this.rollCallEvents.has(entry.id)) {
      return this.updateRollCallEventReceivedFromRemote(entry);
    }

    this.rollCallEvents.set(entry.id, entry);
    this.fireUpdate((cb) => cb[BaseTableHandlerEventKey.DATA_CHANGED]?.());
  }

  async updateRollCallEventReceivedFromRemote(entry: RollCallEventEntry) {
    this.rollCallEvents.set(entry.id, entry);
    this.fireUpdate((cb) => cb[BaseTableHandlerEventKey.DATA_CHANGED]?.());
  }

  async removeRollCallEventReceivedFromRemote(id: number) {
    if (!this.rollCallEvents.has(id)) {
      return;
    }

    this.rollCallEvents.delete(id);
    this.fireUpdate((cb) => cb[BaseTableHandlerEventKey.DATA_CHANGED]?.());
  }

  getById(id: number): RollCallEventEntry | null {
    return this.rollCallEvents.get(id) ?? null;
  }

  getByEventId(eventId: number): RollCallEventEntry[] {
    return this.arr().filter((entry) => entry.event_id === eventId);
  }

  getLatestByEventId(eventId: number): RollCallEventEntry | null {
    return this.getByEventId(eventId)[0] ?? null;
  }

  getActiveByEventId(eventId: number): RollCallEventEntry | null {
    return (
      this.getByEventId(eventId).find((entry) => entry.closed_at == null) ??
      null
    );
  }

  getLatest(): RollCallEventEntry | null {
    return this.arr()[0] ?? null;
  }

  getActive(): RollCallEventEntry[] {
    return this.arr().filter((entry) => entry.closed_at == null);
  }

  getLatestActive(): RollCallEventEntry | null {
    return this.getActive()[0] ?? null;
  }

  getLegacyCurrent(): RollCallEventEntry | null {
    return this.getLatestActive() ?? this.getLatest();
  }

  hasActiveByEventId(eventId: number): boolean {
    return !!this.getActiveByEventId(eventId);
  }

  getNextCounter(eventId: number): number {
    const eventRollCallEvents = this.getByEventId(eventId);
    if (eventRollCallEvents.length === 0) {
      return 0;
    }

    const maxCounter = eventRollCallEvents.reduce<number>(
      (currentMax, entry) => {
        return Math.max(currentMax, entry.counter ?? -1);
      },
      -1,
    );

    return maxCounter + 1;
  }

  async createRollCallEvent(
    eventId: number,
    createdBy: string,
    description: string,
  ): Promise<boolean> {
    const entry: InsertRollCallEvent = {
      created_by: createdBy,
      description: description || "",
      counter: this.getNextCounter(eventId),
      event_id: eventId,
    };

    const { data, error } = await this.client
      .from(Tables.ROLLCALL_EVENT)
      .insert<InsertRollCallEvent>(entry)
      .select()
      .single();

    if (error) {
      console.error(`createRollCallEvent`, error);
      return false;
    }

    if (!!data) {
      await this.addRollCallEventReceivedFromRemote(data as RollCallEventEntry);
    }

    return true;
  }

  async updateRollCallEvent(
    rollCallEventId: number,
    newData: UpdateRollCallEvent,
  ): Promise<boolean> {
    const { data, error } = await this.client
      .from(Tables.ROLLCALL_EVENT)
      .update(newData)
      .eq("id", rollCallEventId)
      .select()
      .single();

    if (error) {
      console.error(`updateRollCallEvent`, error);
      return false;
    }

    if (!!data) {
      await this.updateRollCallEventReceivedFromRemote(
        data as RollCallEventEntry,
      );
    }

    return true;
  }

  async closeRollCallEvent(
    rollCallEventId: number,
    closedBy: string,
  ): Promise<boolean> {
    return this.updateRollCallEvent(rollCallEventId, {
      closed_at: new Date().toISOString(),
      closed_by: closedBy,
    });
  }

  arr(): RollCallEventEntry[] {
    return Array.from(this.rollCallEvents.values()).sort(
      this.sortRollCallEvent,
    );
  }

  private sortRollCallEvent(
    a: RollCallEventEntry,
    b: RollCallEventEntry,
  ): number {
    const createdAtDelta =
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    if (createdAtDelta !== 0) {
      return createdAtDelta;
    }

    const counterDelta = (b.counter ?? 0) - (a.counter ?? 0);
    if (counterDelta !== 0) {
      return counterDelta;
    }

    return b.id - a.id;
  }
}
