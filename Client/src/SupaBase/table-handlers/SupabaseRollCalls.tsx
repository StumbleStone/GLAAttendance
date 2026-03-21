import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import {
  InsertRollCallEntry,
  RollCallEntry,
  RollCallMethod,
  RollCallStatus,
  Tables,
} from "../types";
import {
  BaseTableHandler,
  BaseTableHandlerEvent,
  BaseTableHandlerEventKey,
  BaseTableHandlerOptions,
  RealtimeChangeEventType,
} from "./BaseTableHandler";

export interface SupabaseRollCallsOptions extends BaseTableHandlerOptions {}

export interface SupabaseRollCallsEvent extends BaseTableHandlerEvent {}

export class SupabaseRollCalls extends BaseTableHandler<
  SupabaseRollCallsOptions,
  SupabaseRollCallsEvent
> {
  rollCalls: Map<number, RollCallEntry>;

  constructor(options: BaseTableHandlerOptions) {
    super(options);
    this.rollCalls = new Map<number, RollCallEntry>();
  }

  async _loadData(): Promise<void> {
    console.log(`Loading RollCalls`);
    const { data, error } = await this.client
      .from(Tables.ROLLCALL)
      .select()
      .order("created_at", {
        ascending: true,
      });

    if (error) {
      console.error(error);
      debugger;
    }

    this.rollCalls.clear();
    (data || []).forEach((entry: RollCallEntry) => {
      this.rollCalls.set(entry.id, entry);
    });

    console.log(`[${data?.length || 0}] RollCalls loaded`);
  }

  async handleRollCallChangesFromRemote(
    payload: RealtimePostgresChangesPayload<{ [key: string]: any }>,
  ) {
    switch (payload.eventType) {
      case RealtimeChangeEventType.DELETE:
        return this.removeRollCallReceivedFromRemote(payload.old.id);
      case RealtimeChangeEventType.INSERT:
        return this.addRollCallReceivedFromRemote(payload.new as RollCallEntry);
      case RealtimeChangeEventType.UPDATE:
        return this.updateRollCallReceivedFromRemote(
          payload.new as RollCallEntry,
        );
    }

    debugger;
  }

  async addRollCallReceivedFromRemote(entry: RollCallEntry) {
    if (this.rollCalls.has(entry.id)) {
      return this.updateRollCallReceivedFromRemote(entry);
    }

    this.rollCalls.set(entry.id, entry);
    this.fireUpdate((cb) => cb[BaseTableHandlerEventKey.DATA_CHANGED]?.());
  }

  async updateRollCallReceivedFromRemote(entry: RollCallEntry) {
    this.rollCalls.set(entry.id, entry);
    this.fireUpdate((cb) => cb[BaseTableHandlerEventKey.DATA_CHANGED]?.());
  }

  async removeRollCallReceivedFromRemote(id: number) {
    if (!this.rollCalls.has(id)) {
      return;
    }

    this.rollCalls.delete(id);
    this.fireUpdate((cb) => cb[BaseTableHandlerEventKey.DATA_CHANGED]?.());
  }

  getById(id: number): RollCallEntry | null {
    return this.rollCalls.get(id) ?? null;
  }

  getByAttendeeId(attendeeId: number): RollCallEntry[] {
    return this.arr().filter((entry) => entry.attendee_id === attendeeId);
  }

  getByRollCallEventId(rollCallEventId: number): RollCallEntry[] {
    return this.arr().filter(
      (entry) => entry.roll_call_event_id === rollCallEventId,
    );
  }

  getByRollCallEventAndAttendeeId(
    rollCallEventId: number,
    attendeeId: number,
  ): RollCallEntry[] {
    return this.arr().filter(
      (entry) =>
        entry.roll_call_event_id === rollCallEventId &&
        entry.attendee_id === attendeeId,
    );
  }

  getLatestByRollCallEventAndAttendeeId(
    rollCallEventId: number,
    attendeeId: number,
  ): RollCallEntry | null {
    return (
      this.getByRollCallEventAndAttendeeId(rollCallEventId, attendeeId)
        .slice()
        .sort(this.sortRollCallDescending)[0] ?? null
    );
  }

  async createRollCall(
    attendeeId: number,
    createdBy: string,
    rollCallEventId: number,
    method: RollCallMethod,
    status: RollCallStatus = RollCallStatus.PRESENT,
  ): Promise<RollCallEntry | null> {
    const entry: InsertRollCallEntry = {
      attendee_id: attendeeId,
      created_by: createdBy,
      created_method: method,
      roll_call_event_id: rollCallEventId,
      status,
    };

    const { data, error } = await this.client
      .from(Tables.ROLLCALL)
      .insert<InsertRollCallEntry>(entry)
      .select()
      .single();

    if (error) {
      console.error(`createRollCall`, error);
      return null;
    }

    if (!!data) {
      await this.addRollCallReceivedFromRemote(data as RollCallEntry);
      return data as RollCallEntry;
    }

    return null;
  }

  arr(): RollCallEntry[] {
    return Array.from(this.rollCalls.values()).sort(this.sortRollCallAscending);
  }

  private sortRollCallAscending = (
    a: RollCallEntry,
    b: RollCallEntry,
  ): number => {
    const createdAtDelta =
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    if (createdAtDelta !== 0) {
      return createdAtDelta;
    }

    return a.id - b.id;
  };

  private sortRollCallDescending = (
    a: RollCallEntry,
    b: RollCallEntry,
  ): number => {
    return this.sortRollCallAscending(b, a);
  };
}
