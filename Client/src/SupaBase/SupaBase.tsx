import {
  AuthChangeEvent,
  createClient,
  RealtimePostgresChangesPayload,
  Session,
  SupabaseClient,
  User,
} from "@supabase/supabase-js";
import { EventClass, EventClassEvents } from "../Tools/EventClass";
import { DefaultColors } from "../Tools/Toolbox";
import { Attendee } from "./Attendee";
import { Database } from "./supabase-types";
import {
  AttendeesEntries,
  AttendeesEntry,
  RollCallEntry,
  RollCallStatus,
  Tables,
} from "./types";

export enum SupaBaseEventKey {
  USER_LOGIN = "user_login",
  INIT_DONE = "init_done",
  LOADED_ATTENDEES = "loaded_attendees",
  LOADED_ROLLCALLS = "loaded_rollcalls",
  DELETED_ATTENDEES = "deleted_attendees",
  ADDED_ATTENDEES = "added_attendees",
}

export interface SupaBaseEvent extends EventClassEvents {
  [SupaBaseEventKey.USER_LOGIN]: (isLoggedIn: boolean) => void;
  [SupaBaseEventKey.INIT_DONE]: (done: boolean) => void;
  [SupaBaseEventKey.LOADED_ATTENDEES]: () => void;
  [SupaBaseEventKey.LOADED_ROLLCALLS]: () => void;
  [SupaBaseEventKey.DELETED_ATTENDEES]: () => void;
  [SupaBaseEventKey.ADDED_ATTENDEES]: () => void;
}

export type AttendeesMap = Map<string, Attendee>;

export class SupaBase extends EventClass<SupaBaseEvent> {
  client: SupabaseClient;
  _isLoggedIn: boolean;

  user_id: string | null;

  attendees: AttendeesMap;

  attendeesModified: number; // Probably a much cleaner way to do this but I'm too tired to care

  constructor() {
    super();

    this.handleAttendeesChanges = this.handleAttendeesChanges.bind(this);
    this.handleRollCallChanges = this.handleRollCallChanges.bind(this);

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
            this.onLoggedIn(session.user);
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
            this.onLoggedIn(session.user);
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

  async onLoggedIn(user: User) {
    this.user_id = user.id;
    if (this._isLoggedIn) {
      return;
    }

    this._isLoggedIn = true;
    this.fireUpdate((cb) => cb[SupaBaseEventKey.USER_LOGIN]?.(true));

    await this.listenToAttendeesChanges();
    await this.loadAttendees();
    await this.loadRollCalls();
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
    const channel = this.client
      .channel("attendees-channel")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: Tables.ATTENDEES,
        },
        this.handleAttendeesChanges
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: Tables.ROLLCALL,
        },
        this.handleRollCallChanges
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
  }

  async loadRollCalls() {
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

  async addNewAttendees(
    newEntries: Pick<AttendeesEntry, "name" | "surname">[]
  ) {
    const { error, data } = await this.client
      .from(Tables.ATTENDEES)
      .insert(newEntries)
      .select();

    if (error) {
      console.error(`addNewAttendees`, error);
    }
  }

  async addNewRollCall(
    attendee: Attendee,
    status: RollCallStatus = RollCallStatus.PRESENT
  ) {
    const entry: Omit<RollCallEntry, "created_at" | "id"> = {
      attendee_id: attendee.id,
      status,
    };

    const { error, data } = await this.client
      .from(Tables.ROLLCALL)
      .insert(entry)
      .select();

    if (error) {
      console.error(`addNewRollCall`, error);
    }
  }

  async barcodeScanned(hash: string) {
    const attendee = this.attendees.get(hash);

    if (!attendee) {
      return;
    }

    await this.addNewRollCall(attendee);
  }
}
