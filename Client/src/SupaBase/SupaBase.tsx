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
import { Database } from "./supabase-types";

export enum SupaBaseEventKey {
  USER_LOGIN = "user_login",
  INIT_DONE = "init_done",
  LOADED_ATTENDEES = "loaded_attendees",
  DELETED_ATTENDEES = "deleted_attendees",
  ADDED_ATTENDEES = "added_attendees",
}

export interface SupaBaseEvent extends EventClassEvents {
  [SupaBaseEventKey.USER_LOGIN]: (isLoggedIn: boolean) => void;
  [SupaBaseEventKey.INIT_DONE]: (done: boolean) => void;
  [SupaBaseEventKey.LOADED_ATTENDEES]: (attendees: AttendeesEntry[]) => void;
}

export enum Tables {
  ATTENDEES = "Attendees",
}

export type AttendeesEntry =
  Database["public"]["Tables"][Tables.ATTENDEES]["Row"];
export type Attendeess = AttendeesEntry[];
export type InsertAttendees =
  Database["public"]["Tables"][Tables.ATTENDEES]["Insert"];

const ORDERED_COLORS: string[] = [
  DefaultColors.BrightPurple,
  DefaultColors.BrightCyan,
  DefaultColors.BrightGrey,
  DefaultColors.BrightGreen,
  DefaultColors.BrightYellow,
  DefaultColors.BrightBlue,
  DefaultColors.BrightOrange,
];

export class SupaBase extends EventClass<SupaBaseEvent> {
  client: SupabaseClient;
  _isLoggedIn: boolean;

  user_id: string | null;

  attendees: AttendeesEntry[];

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

    this._isLoggedIn = false;
    this.attendees = [];
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

    this.listenToAttendeesChanges();
    this.loadAttendees();
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
        table: Tables.ATTENDEES,
      },
      (payload) => {
        console.log("Realtime payload *:", payload);
        switch (payload.table) {
          case Tables.ATTENDEES:
            this.handleAttendeesChanges(payload);
            return;
        }
      }
    );

    channel.subscribe((...items: any[]) => {
      console.log(`Subscribed to changes:`, ...items);
    });
  }

  async handleAttendeesChanges(
    payload: RealtimePostgresChangesPayload<{ [key: string]: any }>
  ) {
    switch (payload.eventType) {
      case "DELETE":
        return this, this.removeAttendee(payload.old.id);
      case "INSERT":
        return this, this.addAttendee(payload.new as AttendeesEntry);
    }

    debugger;
  }

  async addAttendee(entry: AttendeesEntry) {
    const record = this.attendees.find((att) => att.id === entry.id);
    if (record) {
      return;
    }

    console.log(`Attendee added: ${entry.name} ${entry.surname}`);

    this.attendees.push(entry);

    this.fireUpdate((cb) =>
      cb[SupaBaseEventKey.ADDED_ATTENDEES]?.(this.attendees)
    );
  }

  async removeAttendee(id: number) {
    const record = this.attendees.find((att) => att.id === id);
    if (!record) {
      return;
    }

    console.log(
      `Attendee deleted, removing from list: ${record.name} ${record.surname}`
    );

    this.attendees = this.attendees.filter((att) => att.id !== id);

    this.fireUpdate((cb) =>
      cb[SupaBaseEventKey.DELETED_ATTENDEES]?.(this.attendees)
    );
  }

  async loadAttendees(): Promise<void> {
    const { data, error } = await this.client
      .from(Tables.ATTENDEES)
      .select()
      .order("name", {
        ascending: false,
      });

    if (error) {
      debugger;
    }

    this.attendees = data || [];

    this.fireUpdate((cb) =>
      cb[SupaBaseEventKey.LOADED_ATTENDEES]?.(this.attendees)
    );
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
}
