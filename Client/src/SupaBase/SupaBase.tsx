import {
  AuthChangeEvent,
  createClient,
  RealtimePostgresChangesPayload,
  Session,
  SupabaseClient,
  User,
} from "@supabase/supabase-js";
import { EventClass, EventClassEvents } from "../Tools/EventClass";
import { Attendee } from "./Attendee";
import { Database } from "./supabase-types";
import {
  AttendeesEntry,
  InsertRollCallEntry,
  InsertRollCallEvent,
  ProfileEventEntry,
  RollCallEntry,
  RollCallEventEntry,
  RollCallStatus,
  Tables,
  UpdateRollCallEvent,
} from "./types";

export enum SupaBaseEventKey {
  USER_LOGIN = "user_login",
  INIT_DONE = "init_done",
  LOADED_ATTENDEES = "loaded_attendees",
  LOADED_ROLLCALLS = "loaded_rollcalls",
  LOADED_ROLLCALL_EVENTS = "loaded_rollcall_events",
  DELETED_ATTENDEES = "deleted_attendees",
  ADDED_ATTENDEES = "added_attendees",
  UPDATED_ROLLCALL_EVENT = "updated_rollcall_event",
}

export interface SupaBaseEvent extends EventClassEvents {
  [SupaBaseEventKey.USER_LOGIN]: (isLoggedIn: boolean) => void;
  [SupaBaseEventKey.INIT_DONE]: (done: boolean) => void;
  [SupaBaseEventKey.LOADED_ATTENDEES]: () => void;
  [SupaBaseEventKey.LOADED_ROLLCALLS]: () => void;
  [SupaBaseEventKey.LOADED_ROLLCALL_EVENTS]: () => void;
  [SupaBaseEventKey.UPDATED_ROLLCALL_EVENT]: () => void;
  [SupaBaseEventKey.DELETED_ATTENDEES]: () => void;
  [SupaBaseEventKey.ADDED_ATTENDEES]: () => void;
}

export type AttendeesMap = Map<string, Attendee>;

export class SupaBase extends EventClass<SupaBaseEvent> {
  client: SupabaseClient;
  _isLoggedIn: boolean;

  user: User;
  profile: ProfileEventEntry;

  attendees: AttendeesMap;
  rollCallEvents: RollCallEventEntry[];
  currentRollCallEvent: RollCallEventEntry;
  _attendeesModified: number; // Probably a much cleaner way to do this but I'm too tired to care

  constructor() {
    super();

    const restEndpoint: string = "https://jyacqecjdlxbxjumlxbj.supabase.co";

    // According to Supabase having this here is okay since RLS is enabled
    const key =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5YWNxZWNqZGx4YnhqdW1seGJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NTc5NjAsImV4cCI6MjA3MjEzMzk2MH0.gKad_9aPVqpvzZVBvXbsHTvXCNgr25QCUoO7DpCCXKc";
    this.client = createClient<Database>(restEndpoint, key, {
      auth: {
        debug: false,
      },
    });

    this.attendees = new Map<string, Attendee>();
    this._isLoggedIn = false;
  }

  async init() {
    let resolveInit: () => void;
    const waitForInitialSession = new Promise<void>((resolve) => {
      resolveInit = resolve;
    });

    this.client.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        if (event === "INITIAL_SESSION") {
          if (session?.user) {
            // Don't await
            this.onLoggedIn(session);
          }
          resolveInit();
          return;
        }

        if (event === "SIGNED_OUT") {
          // Don't await
          this.onLoggedOut();

          return;
        }

        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          if (session?.user) {
            // Don't await
            this.onLoggedIn(session);
          }
          return;
        }

        debugger;
        if (event == "PASSWORD_RECOVERY") {
        }
      }
    );

    await waitForInitialSession;
    this.fireUpdate((cb) => cb[SupaBaseEventKey.INIT_DONE]?.(true));
  }

  async userSendOTP(email: string): Promise<boolean> {
    const { error } = await this.client.auth.signInWithOtp({
      email: email,
      options: {
        // set this to false if you do not want the user to be automatically signed up
        shouldCreateUser: false,
      },
    });

    if (error) {
      console.error(error);
      return false;
    }

    return true;
  }

  async userSignInOtp(email: string, otp: string) {
    const { error } = await this.client.auth.verifyOtp({
      email: email,
      token: otp,
      type: "email",
    });

    if (error) {
      console.error("OTP Error:", error);
      return false;
    }

    return true;
  }

  async userSignIn(email: string, password: string) {
    const result = await this.client.auth.signInWithPassword({
      email,
      password,
    });

    if (result.error) {
      throw result.error;
    }
  }

  async onLoggedIn(session: Session) {
    if (session?.access_token) {
      this.client.realtime.setAuth(session.access_token);
    }

    this.user = session.user;

    if (this._isLoggedIn) {
      return;
    }

    console.log(`User logged in!`);
    this._isLoggedIn = true;
    this.fireUpdate((cb) => cb[SupaBaseEventKey.USER_LOGIN]?.(true));

    console.groupCollapsed(`Running all the queries`);

    await this.loadAttendees();
    await this.loadRollCalls();
    await this.loadRollCallEvents();
    console.log(`Queries Done!`);
    console.groupEnd();

    await this.listenToAttendeesChanges();
  }

  async onLoggedOut() {
    if (!this._isLoggedIn) {
      return;
    }

    this._isLoggedIn = false;
    this.fireUpdate((cb) => cb[SupaBaseEventKey.USER_LOGIN]?.(false));
  }

  get isLoggedIn(): boolean {
    return this._isLoggedIn;
  }

  async listenToAttendeesChanges() {
    const channel = this.client.channel("attendees-channel").on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
      },
      (payload) => {
        switch (payload.table) {
          case Tables.ATTENDEES:
            this.handleAttendeesChanges(payload);
            return;
          case Tables.ROLLCALL:
            this.handleRollCallChanges(payload);
            return;
          case Tables.ROLLCALL_EVENT:
            this.handleRollCallEventChanges(payload);
            return;
        }

        debugger;
      }
    );

    channel.subscribe((...items: any[]) => {
      console.log(`Subscribed to changes:`, ...items);
    });
  }

  async handleAttendeesChanges(
    payload: RealtimePostgresChangesPayload<{ [key: string]: any }>
  ) {
    console.log(`${payload.table} Updated`, payload);

    switch (payload.eventType) {
      case "DELETE":
        return this.removeAttendeeFromDB(payload.old.id);
      case "INSERT":
        return this.addAttendeeFromDB(payload.new as AttendeesEntry);
    }

    debugger;
  }

  async handleRollCallEventChanges(
    payload: RealtimePostgresChangesPayload<{ [key: string]: any }>
  ) {
    console.log(`${payload.table} Updated`, payload);

    switch (payload.eventType) {
      case "INSERT":
        return this.addRollCallEventFromDB(payload.new as RollCallEventEntry);
      case "DELETE":
        return this.removeRollCallEventFromDB(payload.old.id);
      case "UPDATE":
        return this.updateRollCallEventFromDB(
          payload.new as RollCallEventEntry
        );
    }
    debugger;
  }

  async handleRollCallChanges(
    payload: RealtimePostgresChangesPayload<{ [key: string]: any }>
  ) {
    console.log(`${payload.table} Updated`, payload);

    switch (payload.eventType) {
      case "INSERT":
        return this.addRollCallFromDB(payload.new as RollCallEntry);
      case "DELETE":
        return this.removeRollCallFromDB(payload.old.id);
    }

    debugger;
  }

  async removeRollCallFromDB(rollCallId: number) {
    this.attendees.forEach((attendee) => {
      const rollCall = attendee.rollCalls.find((rc) => rc.id == rollCallId);
      if (!rollCall) {
        return;
      }

      attendee.removeRollCall(rollCall);
      this.attendeesModified = Date.now();
      this.fireUpdate((cb) => cb[SupaBaseEventKey.LOADED_ROLLCALLS]?.());
    });
  }

  async addRollCallFromDB(entry: RollCallEntry) {
    const attendee =
      Array.from(this.attendees.values()).find(
        (att) => att.id == entry.attendee_id
      ) || null;

    if (!attendee) {
      return;
    }

    attendee.pushRollCall(entry);
    // TODO Replace with Attendee level events
    this.attendeesModified = Date.now();
    this.fireUpdate((cb) => cb[SupaBaseEventKey.LOADED_ROLLCALLS]?.());
  }

  async removeRollCallEventFromDB(rollCallEventId: number) {
    if (!this.rollCallEvents.find((rce) => rce.id === rollCallEventId)) {
      return;
    }

    this.rollCallEvents = this.rollCallEvents.filter(
      (rce) => rce.id !== rollCallEventId
    );
    this.calculateCurrentRollCallEvent();
  }

  async addRollCallEventFromDB(entry: RollCallEventEntry) {
    if (this.rollCallEvents.find((rce) => rce.id === entry.id)) {
      return;
    }

    this.rollCallEvents.push(entry);
    this.rollCallEvents.sort(this.sortRollCallEvent);
    this.calculateCurrentRollCallEvent();
  }

  async updateRollCallEventFromDB(entry: RollCallEventEntry) {
    const indexOf: number = this.rollCallEvents.findIndex(
      (rce) => rce.id === entry.id
    );
    if (indexOf < 0) {
      return;
    }

    this.rollCallEvents[indexOf] = entry;
    this.rollCallEvents.sort(this.sortRollCallEvent);

    if (this.currentRollCallEvent.id === entry.id) {
      this.currentRollCallEvent = entry;
      this.fireUpdate((cb) => cb[SupaBaseEventKey.UPDATED_ROLLCALL_EVENT]?.());
    } else {
      this.calculateCurrentRollCallEvent();
    }
  }

  async addAttendeeFromDB(entry: AttendeesEntry) {
    const hash = Attendee.GenerateHash(entry);
    const record = this.attendees.has(hash);
    if (record) {
      console.error(`Attendee already exists: ${entry.name} ${entry.surname}`);
      return;
    }

    console.log(`Attendee added: ${entry.name} ${entry.surname}`);

    const attendee = new Attendee(entry);

    this.attendees.set(attendee.hash, attendee);
    this.attendeesModified = Date.now();
    this.fireUpdate((cb) => cb[SupaBaseEventKey.ADDED_ATTENDEES]?.());
  }

  async removeAttendeeFromDB(id: number) {
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
      `Attendee deleted, removing from list: ${record.name} ${record.surname}`
    );

    this.attendees.delete(hash);
    this.attendeesModified = Date.now();

    this.fireUpdate((cb) => cb[SupaBaseEventKey.DELETED_ATTENDEES]?.());
  }

  async loadAttendees(): Promise<void> {
    console.log(`Loading Attendees`);
    const { data, error } = await this.client
      .from(Tables.ATTENDEES)
      .select()
      .order("name", {
        ascending: false,
      });

    if (error) {
      console.error(error);
      debugger;
    }

    (data || []).forEach((entry: AttendeesEntry) => {
      const att = new Attendee(entry);
      this.attendees.set(att.hash, att);
    });

    this.attendeesModified = Date.now();
    this.fireUpdate((cb) => cb[SupaBaseEventKey.LOADED_ATTENDEES]?.());
    console.log(`[${data?.length || 0}] Attendees loaded`);
  }

  get attendeesModified(): number {
    return this._attendeesModified;
  }

  set attendeesModified(date: number) {
    console.log(`Attendees modified`, date);
    this._attendeesModified = date;
  }

  async loadRollCalls() {
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

    let attendeesById: Record<number, Attendee> = {};
    this.attendees.forEach((att) => {
      attendeesById[att.id] = att;
    });

    data?.forEach((rollCall: RollCallEntry) => {
      if (attendeesById[rollCall.attendee_id]) {
        attendeesById[rollCall.attendee_id].pushRollCall(rollCall);
        return;
      }
    });
    this.fireUpdate((cb) => cb[SupaBaseEventKey.LOADED_ROLLCALLS]?.());

    console.log(`[${data?.length || 0}] RollCalls loaded`);
  }

  async loadRollCallEvents() {
    console.log(`Loading RollCall Events`);

    const { data, error } = await this.client
      .from(Tables.ROLLCALL_EVENT)
      .select()
      .order("counter", {
        ascending: false,
      });

    if (error) {
      console.error(error);
      debugger;
    }

    this.rollCallEvents = (data ?? []).sort(this.sortRollCallEvent);
    this.fireUpdate((cb) => cb[SupaBaseEventKey.LOADED_ROLLCALL_EVENTS]?.());
    console.log(`[${this.rollCallEvents.length}] RollCall Events loaded`);

    this.calculateCurrentRollCallEvent();
  }

  sortRollCallEvent(a: RollCallEventEntry, b: RollCallEventEntry) {
    return (b.counter ?? 0) - (a.counter ?? 0);
  }

  async calculateCurrentRollCallEvent() {
    if (this.currentRollCallEvent?.id === this.rollCallEvents[0]?.id) {
      return;
    }

    this.currentRollCallEvent = this.rollCallEvents[0];
    this.fireUpdate((cb) => cb[SupaBaseEventKey.UPDATED_ROLLCALL_EVENT]?.());
  }

  async deleteAttendee(entry: AttendeesEntry) {
    const { error } = await this.client
      .from(Tables.ATTENDEES)
      .delete()
      .eq("id", entry.id);

    if (error) {
      console.error(error);
    }
  }

  async createNewAttendees(
    newEntries: Pick<AttendeesEntry, "name" | "surname">[]
  ) {
    const { error, data } = await this.client
      .from(Tables.ATTENDEES)
      .insert(newEntries)
      .select();

    if (error) {
      console.error(`createNewAttendees`, error);
    }
  }

  async createNewRollCall(
    attendee: Attendee,
    status: RollCallStatus = RollCallStatus.PRESENT
  ) {
    if (!this.currentRollCallEvent) {
      return;
    }

    const entry: InsertRollCallEntry = {
      attendee_id: attendee.id,
      roll_call_event_id: this.currentRollCallEvent.id,
      status,
    };

    const { error, data } = await this.client
      .from(Tables.ROLLCALL)
      .insert(entry)
      .select();

    if (error) {
      console.error(`createNewRollCall`, error);
    }
  }

  async barcodeScanned(hash: string) {
    const attendee = this.attendees.get(hash);

    if (!attendee) {
      return;
    }

    await this.createNewRollCall(attendee);
  }

  async createNewRollCallEvent(description: string) {
    const entry: InsertRollCallEvent = {
      created_by: this.user.id,
      description: description || "",
      counter: (this.currentRollCallEvent?.counter ?? 0) + 1,
    };

    const { error, data } = await this.client
      .from(Tables.ROLLCALL_EVENT)
      .insert(entry)
      .select();

    if (error) {
      console.error(`createNewRollCallEvent`, error);
    }
  }

  countPresentAttendees(): number {
    const curRCE = this.currentRollCallEvent?.id;
    if (!curRCE) {
      return 0;
    }

    let counter: number = 0;

    this.attendees.forEach((att) => {
      if (!att.currentRollCall) {
        return;
      }

      if (att.currentRollCall.roll_call_event_id === curRCE) {
        counter += 1;
        return;
      }
    });

    return counter;
  }

  async closeCurrentRollCallEvent() {
    if (!this.currentRollCallEvent) {
      console.error(
        `closeCurrentRollCallEvent: Attempted to close RollCallEvent but none active`
      );
      return;
    }

    if (this.currentRollCallEvent.closed_at != null) {
      console.error(
        `closeCurrentRollCallEvent: Attempted to close RollCallEvent but it already has been closed`
      );
      return;
    }

    const updateEntry: UpdateRollCallEvent = {
      closed_at: new Date().toISOString(),
      closed_by: this.user.id,
    };

    const { error, data } = await this.client
      .from(Tables.ROLLCALL_EVENT)
      .update(updateEntry)
      .eq("id", this.currentRollCallEvent.id)
      .select();

    if (error) {
      console.error(`closeCurrentRollCallEvent`, error);
    }
  }
}
