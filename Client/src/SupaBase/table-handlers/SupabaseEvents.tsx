import { EventsEntry, InsertEvents, Tables } from "../types";
import {
  BaseTableHandler,
  BaseTableHandlerEvent,
  BaseTableHandlerEventKey,
  BaseTableHandlerOptions,
} from "./BaseTableHandler";

export interface SupabaseEventsOptions extends BaseTableHandlerOptions {}

export interface SupabaseEventsEvent extends BaseTableHandlerEvent {}

export class SupabaseEvents extends BaseTableHandler<
  SupabaseEventsOptions,
  SupabaseEventsEvent
> {
  attendanceEvents: EventsEntry[];
  constructor(options: BaseTableHandlerOptions) {
    super(options);
    this.attendanceEvents = [];
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

    this.attendanceEvents = [...(data || [])].sort(this.sortEvent);

    console.log(`[${data?.length || 0}] Events loaded`);
  }

  async addEventReceivedFromRemote(entry: EventsEntry) {
    if (this.attendanceEvents.find((event) => event.id === entry.id)) {
      return;
    }

    this.attendanceEvents.push(entry);
    this.attendanceEvents.sort(this.sortEvent);
    this.fireUpdate((cb) => cb[BaseTableHandlerEventKey.DATA_CHANGED]?.());
  }

  async updateEventReceivedFromRemote(entry: EventsEntry) {
    const indexOf = this.attendanceEvents.findIndex(
      (event) => event.id === entry.id,
    );
    if (indexOf < 0) {
      return;
    }

    this.attendanceEvents[indexOf] = entry;
    this.attendanceEvents.sort(this.sortEvent);
    this.fireUpdate((cb) => cb[BaseTableHandlerEventKey.DATA_CHANGED]?.());
  }

  async removeEventReceivedFromRemote(id: number) {
    const existing = this.attendanceEvents.find((event) => event.id === id);
    if (!existing) {
      return;
    }

    this.attendanceEvents = this.attendanceEvents.filter(
      (event) => event.id !== id,
    );
    this.fireUpdate((cb) => cb[BaseTableHandlerEventKey.DATA_CHANGED]?.());
  }

  private sortEvent(a: EventsEntry, b: EventsEntry): number {
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  }

  async createNewAttendanceEvent(
    name: string,
    startTime: string,
    endTime: string,
    userId: string,
  ): Promise<EventsEntry | null> {
    const entry: InsertEvents = {
      created_by: userId,
      name: name.trim(),
      start_time: startTime,
      end_time: endTime,
    };

    const { data, error } = await this.client
      .from(Tables.EVENTS)
      .insert<InsertEvents>(entry)
      .select()
      .single();

    if (error) {
      console.error(`createNewAttendanceEvent`, error);
      return null;
    }

    if (!!data) {
      await this.addEventReceivedFromRemote(data as EventsEntry);
    }

    return (data as EventsEntry) ?? null;
  }
}
