import {
  AuthChangeEvent,
  createClient,
  REALTIME_SUBSCRIBE_STATES,
  RealtimeChannel,
  RealtimePostgresChangesPayload,
  Session,
  SupabaseClient,
  User,
} from "@supabase/supabase-js";
import React from "react";
import { Attendee } from "../Attendees/Attendee";
import { LayerHandler } from "../Components/Layer";
import { RollCallConfirm } from "../RollCall/RollCallConfirm";
import { EventClass, EventClassEvents } from "../Tools/EventClass";
import { RealtimeChannelMonitor } from "./RealtimeChannelMonitor";
import { Database } from "./supabase-types";
import {
  AttendeesEntry,
  InsertAttendees,
  InsertRollCallEntry,
  InsertRollCallEvent,
  PingEntry,
  ProfileEventEntry,
  RollCallEntry,
  RollCallEventEntry,
  RollCallMethod,
  RollCallStatus,
  Tables,
  UpdateAttendees,
  UpdatePingEntry,
  UpdateProfileEventEntry,
  UpdateRollCallEvent,
} from "./types";
import { SupabaseEvents } from "./table-handlers/SupabaseEvents";
import {
  SupabaseAttendees,
  SupabaseAttendeesEventKey,
} from "./table-handlers/SupabaseAttendees";
import { BaseTableHandlerEventKey } from "./table-handlers/BaseTableHandler";

export enum SupaBaseEventKey {
  USER_LOGIN = "user_login",
  USER_UPDATE = "user_update",
  USER_PROFILE = "user_profile",
  USERNAMES_LOADED = "usernames_loaded",
  CLIENT_CONNECTED = "client_connected",
  INIT_DONE = "init_done",
  ATTENDEES_CHANGED = "attendees_changed",
  LOADED_ROLLCALLS = "loaded_rollcalls",
  LOADED_ROLLCALL_EVENTS = "loaded_rollcall_events",
  EVENTS_CHANGED = "events_changed",
  UPDATED_ROLLCALL_EVENT = "updated_rollcall_event",
  VISIBILITY_CHANGED = "visibility_changed",
}

export interface SupaBaseEvent extends EventClassEvents {
  [SupaBaseEventKey.USER_LOGIN]: (isLoggedIn: boolean) => void;
  [SupaBaseEventKey.USER_UPDATE]: (user: User) => void;
  [SupaBaseEventKey.USER_PROFILE]: (profile: ProfileEventEntry) => void;
  [SupaBaseEventKey.CLIENT_CONNECTED]: (done: boolean) => void;
  [SupaBaseEventKey.INIT_DONE]: (done: boolean) => void;
  [SupaBaseEventKey.ATTENDEES_CHANGED]: () => void;
  [SupaBaseEventKey.LOADED_ROLLCALLS]: () => void;
  [SupaBaseEventKey.LOADED_ROLLCALL_EVENTS]: () => void;
  [SupaBaseEventKey.UPDATED_ROLLCALL_EVENT]: () => void;
  [SupaBaseEventKey.VISIBILITY_CHANGED]: (isVisible: boolean) => void;
}

export enum BarcodeProcessState {
  PRESENT = "present",
  PROCESSING = "processing",
  UNKNOWN = "unknown",
  ERROR = "error",
}

export interface BarcodeProcessResult {
  state: BarcodeProcessState;
}

interface BarcodeProcessingMap {
  processing: boolean;
  errored: boolean;
  errorTime: number;
}

export interface SubmitOnBoardingOptions {
  password: string;
  name: string;
  surname: string;
}

export class SupaBase extends EventClass<SupaBaseEvent> {
  client: SupabaseClient;
  _isLoggedIn: boolean;
  _initDone: boolean;
  _loadedAuthState: boolean;

  user: User;
  profile: ProfileEventEntry;

  rollCallEvents: RollCallEventEntry[];
  currentRollCallEvent: RollCallEventEntry;
  rollcallEventsLoaded: boolean;

  barcodeProcessMap: Map<string, BarcodeProcessingMap>;

  userNameMap: Map<string, string>;
  usernamesLoaded: boolean;

  loadPromise: Promise<void> | null;

  realtimeChannelMonitor: RealtimeChannelMonitor;
  realtimeChannel: RealtimeChannel | null;

  lastVisibilityState: boolean;

  eventsHandler: SupabaseEvents;
  attendeesHandler: SupabaseAttendees;

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

    this.barcodeProcessMap = new Map<string, BarcodeProcessingMap>();
    this._isLoggedIn = false;
    this._loadedAuthState = false;
    this._initDone = false;
    this.userNameMap = new Map();
    this.rollcallEventsLoaded = false;
    this.realtimeChannelMonitor = new RealtimeChannelMonitor(this);
    this.usernamesLoaded = false;

    this.eventsHandler = new SupabaseEvents({
      client: this.client,
    });
    this.attendeesHandler = new SupabaseAttendees({
      client: this.client,
    });
  }

  setupEventListeners() {
    this.attendeesHandler.addListener({
      [BaseTableHandlerEventKey.DATA_LOADED]: () => {
        this.fireUpdate((cb) => cb[SupaBaseEventKey.ATTENDEES_CHANGED]?.());
      },
      [SupabaseAttendeesEventKey.ATTENDEE_ROLLCALL_REMOVED]: () => {
        this.fireUpdate((cb) => cb[SupaBaseEventKey.LOADED_ROLLCALLS]?.());
      },
      [SupabaseAttendeesEventKey.ATTENDEE_ADDED]: () => {
        this.fireUpdate((cb) => cb[SupaBaseEventKey.ATTENDEES_CHANGED]?.());
      },
      [SupabaseAttendeesEventKey.ATTENDEE_DELETED]: () => {
        this.fireUpdate((cb) => cb[SupaBaseEventKey.ATTENDEES_CHANGED]?.());
      },
    });

    this.eventsHandler.addListener({
      [BaseTableHandlerEventKey.DATA_LOADED]: () => {
        this.fireUpdate((cb) => cb[SupaBaseEventKey.EVENTS_CHANGED]?.());
      },
    });
  }

  handleAuthEvent(event: AuthChangeEvent, session: Session | null) {
    if (session) {
      this.updateRealtimeToken(session);
    }

    if (event === "INITIAL_SESSION") {
      if (session?.user) {
        // Don't await
        this.onLoggedIn(session);
      }
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

    if (event === "USER_UPDATED") {
      if (session?.user) {
        this.user = this.user;
        this.fireUpdate((cb) => cb[SupaBaseEventKey.USER_UPDATE]?.(this.user));
      }
      return;
    }

    debugger;
    if (event == "PASSWORD_RECOVERY") {
    }
  }

  async init() {
    console.log(`Initiating client`);
    this.registerVisibilityChecker();

    this.client.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        console.log(`Received Auth Event: ${event}`);
        this.handleAuthEvent(event, session);

        if (!this._loadedAuthState) {
          this._loadedAuthState = true;
          this.fireUpdate((cb) =>
            cb[SupaBaseEventKey.CLIENT_CONNECTED]?.(true),
          );
        }
      },
    );

    this._initDone = true;
    console.log(`Client Init done`);
    this.fireUpdate((cb) => cb[SupaBaseEventKey.INIT_DONE]?.(true));
  }

  registerVisibilityChecker() {
    const visChanged = () => {
      const isVis: boolean = !document.hidden;

      if (isVis === this.lastVisibilityState) {
        return;
      }

      this.lastVisibilityState = isVis;

      console.log(isVis ? "Page is visible" : "Page is hidden");

      this.fireUpdate((cb) => cb[SupaBaseEventKey.VISIBILITY_CHANGED]?.(isVis));

      if (isVis) {
        if (this._isLoggedIn) {
          this.loadData(true);
          this.listenToAttendeesChanges();
        }
      } else {
        this.realtimeUnsubscribe();
      }
    };

    document.addEventListener("visibilitychange", visChanged);
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

  updateRealtimeToken(session: Session) {
    if (session?.access_token) {
      this.client.realtime.setAuth(session.access_token);
    }
  }

  async onLoggedIn(session: Session) {
    this.user = session.user;
    this.fireUpdate((cb) => cb[SupaBaseEventKey.USER_UPDATE]?.(this.user));

    if (this._isLoggedIn) {
      return;
    }

    console.log(`User logged in!`);
    this._isLoggedIn = true;
    this.fireUpdate((cb) => cb[SupaBaseEventKey.USER_LOGIN]?.(true));

    await this.loadProfile();
    await this.listenToAttendeesChanges();
  }

  async loadData(refresh: boolean = false) {
    if (this.loadPromise) {
      console.log(`loadData: Already loading, returning existing promise`);
      return this.loadPromise;
    }

    console.log(`loadData: Starting`);
    this.loadPromise = new Promise(async (res) => {
      // These don't depend on each other and can be run at the same time
      await Promise.all([
        this.attendeesHandler.loadData(refresh),
        this.loadUsernames(),
        this.loadRollCallEvents(),
      ]);

      await this.loadRollCalls();

      // Clear so that we can load again if needed
      this.loadPromise = null;
      console.log(`loadData: Done`);
      res();
    });

    return this.loadPromise;
  }

  async loadProfile() {
    console.log(`Loading Profile`);
    const { data, error } = await this.client
      .from(Tables.PROFILES)
      .select()
      .eq("uid", this.user.id)
      .single();

    if (error) {
      console.error(error);
      debugger;
      return;
    }

    this.profile = data;
    this.userNameMap.set(
      this.profile.uid,
      `${this.profile.first_name} ${this.profile.last_name}`,
    );
    this.fireUpdate((cb) => cb[SupaBaseEventKey.USER_PROFILE]?.(data));
  }

  async onLoggedOut() {
    if (!this._isLoggedIn) {
      return;
    }

    this._isLoggedIn = false;
    this.fireUpdate((cb) => cb[SupaBaseEventKey.USER_LOGIN]?.(false));
  }

  get hasInit(): boolean {
    return this._initDone;
  }

  get supabaseConnected(): boolean {
    return this._loadedAuthState;
  }

  get isLoggedIn(): boolean {
    return this._isLoggedIn;
  }

  get isOnboarded(): boolean {
    return this.isLoggedIn && this.profile?.onboarding_done === true;
  }

  async listenToAttendeesChanges() {
    if (this.realtimeChannel) {
      console.debug(`Realtime channel already exists!`);
      return;
    }

    console.log("Registering Realtime listener");
    this.realtimeChannel = this.client.channel("attendees-channel").on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
      },
      (payload) => {
        this.realtimeChannelMonitor.receivedRealtimeUpdate();

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
          case Tables.PING_TABLE:
            // Nothing to do
            return;
        }

        debugger;
      },
    );

    this.realtimeChannel.subscribe((status: REALTIME_SUBSCRIBE_STATES) => {
      console.log(`Subscribed to changes:`, status);

      if (status === "SUBSCRIBED") {
        this.realtimeChannelMonitor.setConnected();
        return;
      }

      if (
        status === "TIMED_OUT" ||
        status === "CLOSED" ||
        status === "CHANNEL_ERROR"
      ) {
        this.realtimeChannelMonitor.setDisconnected();
        return;
      }
    });
  }

  realtimeUnsubscribe() {
    if (!this.realtimeChannel) {
      return;
    }

    console.log(`Unsubscribing from Realtime channel`);

    this.client.removeChannel(this.realtimeChannel);
    this.realtimeChannel = null;
  }

  async handleAttendeesChanges(
    payload: RealtimePostgresChangesPayload<{ [key: string]: any }>,
  ) {
    console.log(`${payload.table} Updated`, payload);

    switch (payload.eventType) {
      case "DELETE":
        return this.attendeesHandler.removeAttendeeEventReceivedFromRemote(
          payload.old.id,
        );
      case "INSERT":
        return this.attendeesHandler.addAttendeeEventReceivedFromRemote(
          payload.new as AttendeesEntry,
        );
      case "UPDATE":
        return this.attendeesHandler.updateAttendeeEventReceivedFromRemote(
          payload.new as AttendeesEntry,
        );
    }

    debugger;
  }

  async handleRollCallEventChanges(
    payload: RealtimePostgresChangesPayload<{ [key: string]: any }>,
  ) {
    console.log(`${payload.table} Updated`, payload);

    switch (payload.eventType) {
      case "INSERT":
        return this.addRollCallEventFromDB(payload.new as RollCallEventEntry);
      case "DELETE":
        return this.removeRollCallEventFromDB(payload.old.id);
      case "UPDATE":
        return this.updateRollCallEventFromDB(
          payload.new as RollCallEventEntry,
        );
    }
    debugger;
  }

  async handleRollCallChanges(
    payload: RealtimePostgresChangesPayload<{ [key: string]: any }>,
  ) {
    console.log(`${payload.table} Updated`, payload);

    switch (payload.eventType) {
      case "INSERT":
        return this.addRollCallEventReceivedFromRemote(
          payload.new as RollCallEntry,
        );
      case "DELETE":
        return this.attendeesHandler.removeRollCallEventReceivedFromRemote(
          payload.old.id,
        );
    }

    debugger;
  }

  async addRollCallEventReceivedFromRemote(entry: RollCallEntry) {
    // TODO missing ading this to Rollcalls?

    const attendee = this.attendeesHandler.getById(entry.attendee_id);

    if (!attendee) {
      return;
    }

    attendee.pushRollCall(
      entry,
      entry.roll_call_event_id === this.currentRollCallEvent?.id,
    );
    this.fireUpdate((cb) => cb[SupaBaseEventKey.LOADED_ROLLCALLS]?.());
  }

  async removeRollCallEventFromDB(rollCallEventId: number) {
    if (!this.rollCallEvents.find((rce) => rce.id === rollCallEventId)) {
      return;
    }

    this.rollCallEvents = this.rollCallEvents.filter(
      (rce) => rce.id !== rollCallEventId,
    );
    await this.calculateCurrentRollCallEvent();
  }

  async addRollCallEventFromDB(entry: RollCallEventEntry) {
    if (this.rollCallEvents.find((rce) => rce.id === entry.id)) {
      return;
    }

    this.rollCallEvents.push(entry);
    this.rollCallEvents.sort(this.sortRollCallEvent);
    await this.calculateCurrentRollCallEvent();
  }

  async updateRollCallEventFromDB(entry: RollCallEventEntry) {
    const indexOf: number = this.rollCallEvents.findIndex(
      (rce) => rce.id === entry.id,
    );
    if (indexOf < 0) {
      return;
    }

    this.rollCallEvents[indexOf] = entry;
    this.rollCallEvents.sort(this.sortRollCallEvent);

    if (this.currentRollCallEvent.id === entry.id) {
      // Don't need to update attendeees (I think?) because the event is the same, only specific details might have changed
      this.currentRollCallEvent = entry;
      this.fireUpdate((cb) => cb[SupaBaseEventKey.UPDATED_ROLLCALL_EVENT]?.());
    } else {
      await this.calculateCurrentRollCallEvent();
    }
  }

  async loadUsernames(): Promise<void> {
    console.log(`Loading Usernames`);
    const { data, error } = await this.client.from(Tables.PROFILES).select();

    if (error) {
      console.error(error);
      debugger;
    }

    this.userNameMap.clear();
    (data || []).forEach((userProfile: ProfileEventEntry) => {
      this.userNameMap.set(
        userProfile.uid,
        `${userProfile.first_name} ${userProfile.last_name}`,
      );
    });

    this.usernamesLoaded = true;
    this.fireUpdate((cb) => cb[SupaBaseEventKey.USERNAMES_LOADED]?.());
    console.log(`[${data?.length || 0}] Usernames loaded`);
  }

  get rollcallInProgress(): boolean {
    if (!this.currentRollCallEvent) {
      return false;
    }

    return this.currentRollCallEvent.closed_by == null;
  }

  async loadRollCalls() {
    console.log(`Loading RollCalls`);

    const { data, error } = await this.client
      .from(Tables.ROLLCALL)
      .select()
      .in("attendee_id", this.attendeesHandler.attendeeIds)
      .order("created_at", {
        ascending: true,
      });

    if (error) {
      console.error(error);
      debugger;
    }

    data?.forEach((rollCall: RollCallEntry) => {
      const att = this.attendeesHandler.getById(rollCall.attendee_id);

      if (!att) {
        return;
      }

      att.pushRollCall(
        rollCall,
        rollCall.roll_call_event_id === this.currentRollCallEvent?.id,
      );
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

    this.rollCallEvents = [];
    this.rollCallEvents = (data ?? []).sort(this.sortRollCallEvent);
    this.fireUpdate((cb) => cb[SupaBaseEventKey.LOADED_ROLLCALL_EVENTS]?.());
    this.rollcallEventsLoaded = true;
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

    this.attendeesHandler.iterate((attendee: Attendee) =>
      attendee.checkCurrentRollCall(this.currentRollCallEvent),
    );
  }

  async updateAttendee(attendee: Attendee, newData: UpdateAttendees) {
    const { error, data } = await this.client
      .from(Tables.ATTENDEES)
      .update(newData)
      .eq("id", attendee.id)
      .select();

    if (error) {
      console.error(error);
    }
  }

  async deleteAttendee(attendee: Attendee) {
    const deleteUpdate: UpdateAttendees = {
      deleted_on: new Date().toISOString(),
      deleted: true,
      deleted_by: this.user.id,
    };

    const { error, data } = await this.client
      .from(Tables.ATTENDEES)
      .update(deleteUpdate)
      .eq("id", attendee.id)
      .select();

    if (error) {
      console.error(error);
      return;
    }

    attendee.updateAttendee(data[0] as AttendeesEntry);
  }

  async createNewAttendees(
    newEntries: Pick<AttendeesEntry, "name" | "surname">[],
  ) {
    const { error, data } = await this.client
      .from(Tables.ATTENDEES)
      .insert<InsertAttendees>(newEntries)
      .select();

    if (error) {
      console.error(`createNewAttendees`, error);
    }
  }

  async createNewRollCall(
    attendee: Attendee,
    method: RollCallMethod,
    status: RollCallStatus = RollCallStatus.PRESENT,
  ): Promise<boolean> {
    if (!this.currentRollCallEvent) {
      return false;
    }

    const entry: InsertRollCallEntry = {
      attendee_id: attendee.id,
      created_by: this.user.id,
      roll_call_event_id: this.currentRollCallEvent.id,
      created_method: method,
      status,
    };

    const { error, data } = await this.client
      .from(Tables.ROLLCALL)
      .insert<InsertRollCallEntry>(entry)
      .select()
      .single();

    if (error) {
      console.error(`createNewRollCall`, error);
      return false;
    }

    LayerHandler.AddLayer((li) => (
      <RollCallConfirm
        attendee={attendee}
        layerItem={li}
        present={data.status === RollCallStatus.PRESENT}
      />
    ));

    return true;
  }

  barcodeScanned(hash: string): BarcodeProcessResult {
    const attendee = this.attendeesHandler.get(hash);

    if (!attendee) {
      return {
        state: BarcodeProcessState.UNKNOWN,
      };
    }

    if (attendee.isPresent(this.currentRollCallEvent)) {
      return {
        state: BarcodeProcessState.PRESENT,
      };
    }

    const processing = this.barcodeProcessMap.get(hash);

    // Never processed before, process now
    if (!processing) {
      this.barcodeProcess(attendee);
      return {
        state: BarcodeProcessState.PROCESSING,
      };
    }

    if (processing.processing == true) {
      return {
        state: BarcodeProcessState.PROCESSING,
      };
    }

    // Something went wrong the last time we processed it
    if (processing.errored) {
      const delta = Date.now() - processing.errorTime;
      if (delta <= 5000) {
        return {
          state: BarcodeProcessState.ERROR,
        };
      }

      // Allow retrying errored barcodes every 5s
      processing.errorTime = 0;
      processing.errored = false;
    }

    this.barcodeProcess(attendee);
    return {
      state: BarcodeProcessState.PROCESSING,
    };
  }

  async barcodeProcess(attendee: Attendee) {
    this.barcodeProcessMap.set(attendee.hash, {
      processing: true,
      errored: false,
      errorTime: 0,
    });
    console.log(`${attendee.fullName} is being processed!`);
    const success = await this.createNewRollCall(attendee, RollCallMethod.QR);

    if (success == true) {
      console.log(`${attendee.fullName} is now Present!`);
      this.barcodeProcessMap.set(attendee.hash, {
        processing: false,
        errored: false,
        errorTime: 0,
      });
      return;
    }

    this.barcodeProcessMap.set(attendee.hash, {
      processing: false,
      errored: true,
      errorTime: Date.now(),
    });
  }

  async createNewRollCallEvent(description: string) {
    const entry: InsertRollCallEvent = {
      created_by: this.user.id,
      description: description || "",
      counter: (this.currentRollCallEvent?.counter ?? 0) + 1,
    };

    const { error, data } = await this.client
      .from(Tables.ROLLCALL_EVENT)
      .insert<InsertRollCallEvent>(entry)
      .select();

    if (error) {
      console.error(`createNewRollCallEvent`, error);
    }
  }

  countAttendees(status: RollCallStatus): number {
    const curRCE = this.currentRollCallEvent?.id;
    if (!curRCE) {
      return 0;
    }

    let counter: number = 0;

    this.attendeesHandler.iterate((att) => {
      if (!att.currentRollCall) {
        return;
      }

      if (
        att.currentRollCall.roll_call_event_id === curRCE &&
        att.currentRollCall.status === status
      ) {
        counter += 1;
        return;
      }
    });

    return counter;
  }

  countPresentAttendees(): number {
    return this.countAttendees(RollCallStatus.PRESENT);
  }

  countAbsentAttendees(): number {
    return this.countAttendees(RollCallStatus.ABSENT);
  }

  async closeCurrentRollCallEvent() {
    if (!this.currentRollCallEvent) {
      console.error(
        `closeCurrentRollCallEvent: Attempted to close RollCallEvent but none active`,
      );
      return;
    }

    if (this.currentRollCallEvent.closed_at != null) {
      console.error(
        `closeCurrentRollCallEvent: Attempted to close RollCallEvent but it already has been closed`,
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

  async generateAllQRCodes(): Promise<HTMLCanvasElement[]> {
    return await Promise.all(
      this.attendeesHandler.iterate((att) => att.generateQRCode()),
    );
  }

  async logOut(logoutAllSessions?: boolean) {
    const { error } = await this.client.auth.signOut({
      scope: logoutAllSessions ? "global" : "local",
    });

    if (error) {
      console.error(error);
      return;
    }
  }

  async updateUserDetails(name: string, surname: string, onboarded: boolean) {
    const userDetails: UpdateProfileEventEntry = {
      first_name: name,
      last_name: surname,
      onboarding_done: onboarded,
    };

    const { error, data } = await this.client
      .from(Tables.PROFILES)
      .update(userDetails)
      .eq("uid", this.user.id)
      .select()
      .single();

    if (error) {
      console.error(`updateUserDetails`, error);
      return;
    }

    if (data) {
      this.profile = data;
      this.userNameMap.set(
        this.profile.uid,
        `${this.profile.first_name} ${this.profile.last_name}`,
      );
      this.fireUpdate((cb) =>
        cb[SupaBaseEventKey.USER_PROFILE]?.(this.profile),
      );
    }
  }

  async submitOnBoarding(options: SubmitOnBoardingOptions) {
    const { data: uData, error: uError } = await this.client.auth.updateUser({
      password: options.password,
    });

    if (uError) {
      console.error(uError);
      return;
    }

    await this.updateUserDetails(options.name, options.surname, true);
  }

  getUserName(id: string, options: { nameOnly?: boolean } = {}): string {
    const user = this.userNameMap.get(id);

    if (!user) {
      return "Unknown";
    }

    const { nameOnly = false } = options;

    if (!nameOnly) {
      return user;
    }

    return user.split(" ")[0];
  }

  getUserInitials(id: string): string {
    const user = this.getUserName(id, { nameOnly: false });
    return user
      .split(" ")
      .map((part) => part[0].toUpperCase())
      .join("");
  }

  async firePing() {
    const { data: readData, error: readError } = await this.client
      .from(Tables.PING_TABLE)
      .select()
      .single<PingEntry>();

    if (readError) {
      console.error(`firePing read`, readError);
      return;
    }

    const { data: fireData, error: fireError } = await this.client
      .from(Tables.PING_TABLE)
      .update({
        counter: readData?.counter ? readData.counter + 1 : 1,
      } as UpdatePingEntry)
      .eq("id", readData.id)
      .select();

    if (fireError) {
      console.error(`firePing fire`, fireError);
    }
  }

  countUnScannedAttendees() {
    return this.attendeesHandler.countUnScannedAttendees(
      this.currentRollCallEvent?.id,
    );
  }
}
