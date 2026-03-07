import { AttendeesEntry, EventsEntry, Tables } from "../types";
import {
  BaseTableHandler,
  BaseTableHandlerEvent,
  BaseTableHandlerOptions,
} from "./BaseTableHandler";

export interface SupabaseEventsOptions extends BaseTableHandlerOptions {}

export enum SupabaseEventsEventKey {
  ATTENDEE_ROLLCALL_REMOVED = "attendee_rollcall_removed",
  ATTENDEE_ADDED = "attendee_added",
  ATTENDEE_DELETED = "attendee_deleted",
}

export interface SupabaseEventsEvent extends BaseTableHandlerEvent {}

export class SupabaseEvents extends BaseTableHandler<
  SupabaseEventsOptions,
  SupabaseEventsEvent
> {
  attendanceEvents: EventsEntry[];
  constructor(options: BaseTableHandlerOptions) {
    super(options);
  }

  async _loadData(): Promise<void> {
    console.log(`Loading Events`);
    const { data, error } = await this.client
      .from(Tables.EVENTS)
      .select()
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(error);
      debugger;
    }

    this.attendanceEvents = [];
    (data || []).forEach((entry: EventsEntry) => {
      this.attendanceEvents.push(entry);
    });

    console.log(`[${data?.length || 0}] Events loaded`);
  }
}
