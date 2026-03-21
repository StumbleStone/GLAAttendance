import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import {
  EventProctorsEntry,
  InsertEventProctors,
  Tables,
  UpdateEventProctors,
} from "../types";
import {
  BaseTableHandler,
  BaseTableHandlerEvent,
  BaseTableHandlerEventKey,
  BaseTableHandlerOptions,
  RealtimeChangeEventType,
} from "./BaseTableHandler";

export interface SupabaseEventProctorsOptions extends BaseTableHandlerOptions {}

export interface SupabaseEventProctorsEvent extends BaseTableHandlerEvent {}

export class SupabaseEventProctors extends BaseTableHandler<
  SupabaseEventProctorsOptions,
  SupabaseEventProctorsEvent
> {
  eventProctors: Map<number, EventProctorsEntry>;

  constructor(options: BaseTableHandlerOptions) {
    super(options);
    this.eventProctors = new Map<number, EventProctorsEntry>();
  }

  async _loadData(): Promise<void> {
    console.log(`Loading Event Proctors`);
    const { data, error } = await this.client
      .from(Tables.EVENT_PROCTORS)
      .select()
      .or("removed.is.null,removed.eq.false")
      .order("created_at", {
        ascending: true,
      });

    if (error) {
      console.error(error);
      debugger;
    }

    this.eventProctors.clear();
    (data || []).forEach((entry: EventProctorsEntry) => {
      this.eventProctors.set(entry.id, entry);
    });

    console.log(`[${data?.length || 0}] Event Proctors loaded`);
  }

  async handleEventProctorsChangesFromRemote(
    payload: RealtimePostgresChangesPayload<{ [key: string]: any }>,
  ) {
    switch (payload.eventType) {
      case RealtimeChangeEventType.DELETE:
        return this.removeEventProctorReceivedFromRemote(payload.old.id);
      case RealtimeChangeEventType.INSERT:
        return this.addEventProctorReceivedFromRemote(
          payload.new as EventProctorsEntry,
        );
      case RealtimeChangeEventType.UPDATE:
        return this.updateEventProctorReceivedFromRemote(
          payload.new as EventProctorsEntry,
        );
    }

    debugger;
  }

  async addEventProctorReceivedFromRemote(entry: EventProctorsEntry) {
    if (entry.removed === true) {
      return this.removeEventProctorReceivedFromRemote(entry.id);
    }

    if (this.eventProctors.has(entry.id)) {
      return this.updateEventProctorReceivedFromRemote(entry);
    }

    this.eventProctors.set(entry.id, entry);
    this.fireUpdate((cb) => cb[BaseTableHandlerEventKey.DATA_CHANGED]?.());
  }

  async updateEventProctorReceivedFromRemote(entry: EventProctorsEntry) {
    if (entry.removed === true) {
      return this.removeEventProctorReceivedFromRemote(entry.id);
    }

    this.eventProctors.set(entry.id, entry);
    this.fireUpdate((cb) => cb[BaseTableHandlerEventKey.DATA_CHANGED]?.());
  }

  async removeEventProctorReceivedFromRemote(id: number) {
    if (!this.eventProctors.has(id)) {
      return;
    }

    this.eventProctors.delete(id);
    this.fireUpdate((cb) => cb[BaseTableHandlerEventKey.DATA_CHANGED]?.());
  }

  getById(id: number): EventProctorsEntry | null {
    return this.eventProctors.get(id) ?? null;
  }

  getByEventId(eventId: number): EventProctorsEntry[] {
    return this.arr().filter((entry) => entry.event_id === eventId);
  }

  getByUserId(userId: string): EventProctorsEntry[] {
    return this.arr().filter((entry) => entry.user_id === userId);
  }

  getByEventAndUserId(
    eventId: number,
    userId: string,
  ): EventProctorsEntry | null {
    return (
      this.arr().find(
        (entry) => entry.event_id === eventId && entry.user_id === userId,
      ) ?? null
    );
  }

  hasProctor(eventId: number, userId: string): boolean {
    return !!this.getByEventAndUserId(eventId, userId);
  }

  countByEventId(eventId: number): number {
    return this.getByEventId(eventId).length;
  }

  async createEventProctor(eventId: number, userId: string): Promise<boolean> {
    return this.createEventProctors(eventId, [userId]);
  }

  async createEventProctors(
    eventId: number,
    userIds: string[],
  ): Promise<boolean> {
    const uniqueUserIds = Array.from(new Set(userIds)).filter(
      (userId) => !this.hasProctor(eventId, userId),
    );

    if (uniqueUserIds.length === 0) {
      return true;
    }

    const entries: InsertEventProctors[] = uniqueUserIds.map((userId) => ({
      event_id: eventId,
      user_id: userId,
    }));

    const { data, error } = await this.client
      .from(Tables.EVENT_PROCTORS)
      .insert<InsertEventProctors>(entries)
      .select();

    if (error) {
      console.error(`createEventProctors`, error);
      return false;
    }

    (data || []).forEach((entry) => {
      void this.addEventProctorReceivedFromRemote(entry as EventProctorsEntry);
    });

    return true;
  }

  async updateEventProctor(
    proctorId: number,
    newData: UpdateEventProctors,
  ): Promise<boolean> {
    const { data, error } = await this.client
      .from(Tables.EVENT_PROCTORS)
      .update(newData)
      .eq("id", proctorId)
      .select()
      .single();

    if (error) {
      console.error(`updateEventProctor`, error);
      return false;
    }

    if (!!data) {
      await this.updateEventProctorReceivedFromRemote(
        data as EventProctorsEntry,
      );
    }

    return true;
  }

  async removeEventProctor(proctorId: number): Promise<boolean> {
    return this.updateEventProctor(proctorId, {
      removed: true,
    });
  }

  async removeEventProctors(proctorIds: number[]): Promise<boolean> {
    const uniqueProctorIds = Array.from(new Set(proctorIds)).filter(
      (id) => !!this.getById(id),
    );

    if (uniqueProctorIds.length === 0) {
      return true;
    }

    const { data, error } = await this.client
      .from(Tables.EVENT_PROCTORS)
      .update({
        removed: true,
      })
      .in("id", uniqueProctorIds)
      .select();

    if (error) {
      console.error(`removeEventProctors`, error);
      return false;
    }

    for (const entry of data || []) {
      await this.updateEventProctorReceivedFromRemote(
        entry as EventProctorsEntry,
      );
    }

    return true;
  }

  arr(): EventProctorsEntry[] {
    return Array.from(this.eventProctors.values()).sort(this.sortEventProctor);
  }

  private sortEventProctor(
    a: EventProctorsEntry,
    b: EventProctorsEntry,
  ): number {
    if (a.event_id !== b.event_id) {
      return (a.event_id ?? 0) - (b.event_id ?? 0);
    }

    const createdAtDelta =
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    if (createdAtDelta !== 0) {
      return createdAtDelta;
    }

    return a.id - b.id;
  }
}
