import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { Attendee } from "../../Attendees/Attendee";
import { AttendeesEntry, Tables } from "../types";
import {
  BaseTableHandler,
  BaseTableHandlerEvent,
  BaseTableHandlerOptions,
  RealtimeChangeEventType,
} from "./BaseTableHandler";

export type AttendeesMap = Map<string, Attendee>;

export interface SupabaseAttendeesOptions extends BaseTableHandlerOptions {}

export enum SupabaseAttendeesEventKey {
  ATTENDEE_ROLLCALL_REMOVED = "attendee_rollcall_removed",
  ATTENDEE_ADDED = "attendee_added",
  ATTENDEE_DELETED = "attendee_deleted",
}

export interface SupabaseAttendeesEvent extends BaseTableHandlerEvent {}

export class SupabaseAttendees extends BaseTableHandler<
  SupabaseAttendeesOptions,
  SupabaseAttendeesEvent
> {
  attendees: AttendeesMap;
  constructor(options: BaseTableHandlerOptions) {
    super(options);
    this.attendees = new Map<string, Attendee>();
  }

  async _loadData(): Promise<void> {
    console.log(`Loading Attendees`);
    const { data, error } = await this.client
      .from(Tables.ATTENDEES)
      .select()
      .neq("deleted", true)
      .order("name", {
        ascending: false,
      });

    if (error) {
      console.error(error);
      debugger;
    }

    this.attendees.clear();
    (data || []).forEach((entry: AttendeesEntry) => {
      const att = new Attendee(entry);
      this.attendees.set(att.hash, att);
    });

    console.log(`[${data?.length || 0}] Attendees loaded`);
  }

  async removeRollCallEventReceivedFromRemote(rollCallId: number) {
    this.attendees.forEach((attendee) => {
      const rollCall = attendee.rollCalls.find((rc) => rc.id == rollCallId);
      if (!rollCall) {
        return;
      }

      attendee.removeRollCall(rollCall);
      this.fireUpdate((cb) =>
        cb[SupabaseAttendeesEventKey.ATTENDEE_ROLLCALL_REMOVED]?.(),
      );
    });
  }

  async handleAttendeesChangesFromRemote(
    payload: RealtimePostgresChangesPayload<{ [key: string]: any }>,
  ) {
    switch (payload.eventType) {
      case RealtimeChangeEventType.DELETE:
        return this.removeAttendeeEventReceivedFromRemote(payload.old.id);
      case RealtimeChangeEventType.INSERT:
        return this.addAttendeeEventReceivedFromRemote(
          payload.new as AttendeesEntry,
        );
      case RealtimeChangeEventType.UPDATE:
        return this.updateAttendeeEventReceivedFromRemote(
          payload.new as AttendeesEntry,
        );
    }

    debugger;
  }

  async updateAttendeeEventReceivedFromRemote(entry: AttendeesEntry) {
    const hash = Attendee.GenerateHash(entry);
    const record = this.attendees.get(hash);
    if (!record) {
      console.error(`Attendee does not exist: ${entry.name} ${entry.surname}`);
      return;
    }

    console.log(`Attendee updated: ${entry.name} ${entry.surname}`);
    record.updateAttendee(entry);
  }

  async addAttendeeEventReceivedFromRemote(entry: AttendeesEntry) {
    const hash = Attendee.GenerateHash(entry);
    const record = this.attendees.has(hash);
    if (record) {
      console.error(`Attendee already exists: ${entry.name} ${entry.surname}`);
      return;
    }

    console.log(`Attendee added: ${entry.name} ${entry.surname}`);

    const attendee = new Attendee(entry);

    this.attendees.set(attendee.hash, attendee);
    this.fireUpdate((cb) => cb[SupabaseAttendeesEventKey.ATTENDEE_ADDED]?.());
  }

  async removeAttendeeEventReceivedFromRemote(id: number) {
    const attendeeEntree =
      Array.from(this.attendees.values()).find((att) => att.id == id)?.entry ||
      null;

    if (!attendeeEntree) {
      return;
    }

    const hash = Attendee.GenerateHash(attendeeEntree);
    const record = this.attendees.get(hash);
    if (!record) {
      return;
    }

    console.log(
      `Attendee deleted, removing from list: ${record.name} ${record.surname}`,
    );

    this.attendees.delete(hash);

    this.fireUpdate((cb) => cb[SupabaseAttendeesEventKey.ATTENDEE_DELETED]?.());
  }

  // Retrieve the Attendee record by using the generated Hash reference key
  get(hash: string): Attendee | null {
    return this.attendees.get(hash);
  }

  private getBy(cb: (att: Attendee) => boolean): Attendee | null {
    const iterator = this.attendees.values();

    for (const attendee of iterator) {
      if (cb(attendee)) {
        return attendee;
      }
    }

    return null;
  }

  getById(id: number): Attendee | null {
    return this.getBy((attendee) => attendee.id === id);
  }

  countUnScannedAttendees(activeRollcallId: number | null): number {
    if (!activeRollcallId) {
      return 0;
    }

    let counter: number = 0;

    this.attendees.forEach((att: Attendee) => {
      if (!att.currentRollCall) {
        counter += 1;
        return;
      }

      if (att.currentRollCall.roll_call_event_id !== activeRollcallId) {
        counter += 1;
        return;
      }
    });

    return counter;
  }

  get attendeeIds(): number[] {
    return this.toArr().map((a) => a.id);
  }

  iterate<T = any>(cb: (attendee: Attendee) => T): T[] {
    return this.toArr().map((a) => cb(a));
  }

  filter(cb: (attendee: Attendee) => boolean): Attendee[] {
    return this.toArr().filter((a) => cb(a));
  }

  sort(cb: (a: Attendee, b: Attendee) => -1 | 0 | 1): Attendee[] {
    return this.toArr().sort(cb);
  }

  get count(): number {
    return this.attendees.size;
  }

  private toArr(): Attendee[] {
    return Array.from(this.attendees.values()).filter((a) => !a.isDeleted);
  }

  arr(): Attendee[] {
    return this.toArr();
  }
}
