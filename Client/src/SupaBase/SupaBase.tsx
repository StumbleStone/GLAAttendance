import {
  AuthChangeEvent,
  createClient,
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
  LOADED_ATTENDEES = "loaded_kids",
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
    const l = this.client.channel("schema-db-changes").on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
      },
      (payload) => {
        console.log(`Changes:`, payload);
      }
    );

    l.subscribe((...items: any[]) => {
      console.log(`Subscribed to changes:`, ...items);
    });
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
}
