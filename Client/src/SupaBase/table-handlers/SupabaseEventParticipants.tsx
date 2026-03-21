import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import {
  EventParticipantsEntry,
  InsertEventParticipants,
  Tables,
  UpdateEventParticipants,
} from "../types";
import {
  BaseTableHandler,
  BaseTableHandlerEvent,
  BaseTableHandlerEventKey,
  BaseTableHandlerOptions,
  RealtimeChangeEventType,
} from "./BaseTableHandler";

export interface SupabaseEventParticipantsOptions extends BaseTableHandlerOptions {}

export interface SupabaseEventParticipantsEvent extends BaseTableHandlerEvent {}

export class SupabaseEventParticipants extends BaseTableHandler<
  SupabaseEventParticipantsOptions,
  SupabaseEventParticipantsEvent
> {
  eventParticipants: Map<number, EventParticipantsEntry>;

  constructor(options: BaseTableHandlerOptions) {
    super(options);
    this.eventParticipants = new Map<number, EventParticipantsEntry>();
  }

  async _loadData(): Promise<void> {
    console.log(`Loading Event Participants`);
    const { data, error } = await this.client
      .from(Tables.EVENT_PARTICIPANTS)
      .select()
      .or("removed.is.null,removed.eq.false")
      .order("created_at", {
        ascending: true,
      });

    if (error) {
      console.error(error);
      debugger;
    }

    this.eventParticipants.clear();
    (data || []).forEach((entry: EventParticipantsEntry) => {
      this.eventParticipants.set(entry.id, entry);
    });

    console.log(`[${data?.length || 0}] Event Participants loaded`);
  }

  async handleEventParticipantsChangesFromRemote(
    payload: RealtimePostgresChangesPayload<{ [key: string]: any }>,
  ) {
    switch (payload.eventType) {
      case RealtimeChangeEventType.DELETE:
        return this.removeEventParticipantReceivedFromRemote(payload.old.id);
      case RealtimeChangeEventType.INSERT:
        return this.addEventParticipantReceivedFromRemote(
          payload.new as EventParticipantsEntry,
        );
      case RealtimeChangeEventType.UPDATE:
        return this.updateEventParticipantReceivedFromRemote(
          payload.new as EventParticipantsEntry,
        );
    }

    debugger;
  }

  async addEventParticipantReceivedFromRemote(entry: EventParticipantsEntry) {
    if (entry.removed === true) {
      return this.removeEventParticipantReceivedFromRemote(entry.id);
    }

    if (this.eventParticipants.has(entry.id)) {
      return this.updateEventParticipantReceivedFromRemote(entry);
    }

    this.eventParticipants.set(entry.id, entry);
    this.fireUpdate((cb) => cb[BaseTableHandlerEventKey.DATA_CHANGED]?.());
  }

  async updateEventParticipantReceivedFromRemote(
    entry: EventParticipantsEntry,
  ) {
    if (entry.removed === true) {
      return this.removeEventParticipantReceivedFromRemote(entry.id);
    }

    this.eventParticipants.set(entry.id, entry);
    this.fireUpdate((cb) => cb[BaseTableHandlerEventKey.DATA_CHANGED]?.());
  }

  async removeEventParticipantReceivedFromRemote(id: number) {
    if (!this.eventParticipants.has(id)) {
      return;
    }

    this.eventParticipants.delete(id);
    this.fireUpdate((cb) => cb[BaseTableHandlerEventKey.DATA_CHANGED]?.());
  }

  getById(id: number): EventParticipantsEntry | null {
    return this.eventParticipants.get(id) ?? null;
  }

  getByEventId(eventId: number): EventParticipantsEntry[] {
    return this.arr().filter((entry) => entry.event_id === eventId);
  }

  getByAttendeeId(attendeeId: number): EventParticipantsEntry[] {
    return this.arr().filter((entry) => entry.attendee_id === attendeeId);
  }

  getByEventAndAttendeeId(
    eventId: number,
    attendeeId: number,
  ): EventParticipantsEntry | null {
    return (
      this.arr().find(
        (entry) =>
          entry.event_id === eventId && entry.attendee_id === attendeeId,
      ) ?? null
    );
  }

  hasParticipant(eventId: number, attendeeId: number): boolean {
    return !!this.getByEventAndAttendeeId(eventId, attendeeId);
  }

  countByEventId(eventId: number): number {
    return this.getByEventId(eventId).length;
  }

  async createEventParticipant(
    eventId: number,
    attendeeId: number,
    extraFields: EventParticipantsEntry["extra_fields"] = null,
  ): Promise<boolean> {
    return this.createEventParticipants(eventId, [attendeeId], extraFields);
  }

  async createEventParticipants(
    eventId: number,
    attendeeIds: number[],
    extraFields: EventParticipantsEntry["extra_fields"] = null,
  ): Promise<boolean> {
    const uniqueAttendeeIds = Array.from(new Set(attendeeIds)).filter(
      (attendeeId) => !this.hasParticipant(eventId, attendeeId),
    );

    if (uniqueAttendeeIds.length === 0) {
      return true;
    }

    const entries: InsertEventParticipants[] = uniqueAttendeeIds.map(
      (attendeeId) => ({
        attendee_id: attendeeId,
        event_id: eventId,
        extra_fields: extraFields,
      }),
    );

    const { data, error } = await this.client
      .from(Tables.EVENT_PARTICIPANTS)
      .insert<InsertEventParticipants>(entries)
      .select();

    if (error) {
      console.error(`createEventParticipants`, error);
      return false;
    }

    (data || []).forEach((entry) => {
      void this.addEventParticipantReceivedFromRemote(
        entry as EventParticipantsEntry,
      );
    });

    return true;
  }

  async updateEventParticipant(
    participantId: number,
    newData: UpdateEventParticipants,
  ): Promise<boolean> {
    const { data, error } = await this.client
      .from(Tables.EVENT_PARTICIPANTS)
      .update(newData)
      .eq("id", participantId)
      .select()
      .single();

    if (error) {
      console.error(`updateEventParticipant`, error);
      return false;
    }

    if (!!data) {
      await this.updateEventParticipantReceivedFromRemote(
        data as EventParticipantsEntry,
      );
    }

    return true;
  }

  async removeEventParticipant(participantId: number): Promise<boolean> {
    return this.updateEventParticipant(participantId, {
      removed: true,
    });
  }

  async removeEventParticipants(participantIds: number[]): Promise<boolean> {
    const uniqueParticipantIds = Array.from(new Set(participantIds)).filter(
      (id) => !!this.getById(id),
    );

    if (uniqueParticipantIds.length === 0) {
      return true;
    }

    const { data, error } = await this.client
      .from(Tables.EVENT_PARTICIPANTS)
      .update({
        removed: true,
      })
      .in("id", uniqueParticipantIds)
      .select();

    if (error) {
      console.error(`removeEventParticipants`, error);
      return false;
    }

    for (const entry of data || []) {
      await this.updateEventParticipantReceivedFromRemote(
        entry as EventParticipantsEntry,
      );
    }

    return true;
  }

  arr(): EventParticipantsEntry[] {
    return Array.from(this.eventParticipants.values()).sort(
      this.sortEventParticipant,
    );
  }

  private sortEventParticipant(
    a: EventParticipantsEntry,
    b: EventParticipantsEntry,
  ): number {
    if (a.event_id !== b.event_id) {
      return a.event_id - b.event_id;
    }

    const createdAtDelta =
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    if (createdAtDelta !== 0) {
      return createdAtDelta;
    }

    return a.id - b.id;
  }
}
