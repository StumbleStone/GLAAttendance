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
import { Attendee, AttendeeStatus } from "../Attendees/Attendee";
import { LayerHandler } from "../Components/Layer";
import { EventParticipant } from "../RollCall/EventParticipant";
import { RollCallConfirm } from "../RollCall/RollCallConfirm";
import { EventClass, EventClassEvents } from "../Tools/EventClass";
import { RealtimeChannelMonitor } from "./RealtimeChannelMonitor";
import { Database } from "./supabase-types";
import {
  BaseTableHandlerEventKey,
  RealtimeChangeEventType,
} from "./table-handlers/BaseTableHandler";
import {
  SupabaseAttendees,
  SupabaseAttendeesEventKey,
} from "./table-handlers/SupabaseAttendees";
import { SupabaseEventParticipants } from "./table-handlers/SupabaseEventParticipants";
import { SupabaseEventProctors } from "./table-handlers/SupabaseEventProctors";
import { SupabaseEvents } from "./table-handlers/SupabaseEvents";
import { SupabaseRollCallEvents } from "./table-handlers/SupabaseRollCallEvents";
import { SupabaseRollCalls } from "./table-handlers/SupabaseRollCalls";
import {
  AttendeesEntry,
  EventParticipantsEntry,
  EventsEntry,
  InsertAttendees,
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
} from "./types";

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
  EVENT_PARTICIPANTS_CHANGED = "event_participants_changed",
  EVENT_PROCTORS_CHANGED = "event_proctors_changed",
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
  [SupaBaseEventKey.EVENTS_CHANGED]: () => void;
  [SupaBaseEventKey.EVENT_PARTICIPANTS_CHANGED]: () => void;
  [SupaBaseEventKey.EVENT_PROCTORS_CHANGED]: () => void;
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
  currentRollCallEvent: RollCallEventEntry | null;
  rollcallEventsLoaded: boolean;

  barcodeProcessMap: Map<string, BarcodeProcessingMap>;

  userNameMap: Map<string, string>;
  usernamesLoaded: boolean;

  loadPromise: Promise<void> | null;

  loadUsernamePromise: Promise<void> | null;

  realtimeChannelMonitor: RealtimeChannelMonitor;
  realtimeChannel: RealtimeChannel | null;

  lastVisibilityState: boolean;

  eventsHandler: SupabaseEvents;
  attendeesHandler: SupabaseAttendees;
  eventParticipantsHandler: SupabaseEventParticipants;
  eventProctorsHandler: SupabaseEventProctors;
  rollCallEventsHandler: SupabaseRollCallEvents;
  rollCallsHandler: SupabaseRollCalls;

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
    this.rollCallEvents = [];
    this.currentRollCallEvent = null;
    this.rollcallEventsLoaded = false;
    this.realtimeChannelMonitor = new RealtimeChannelMonitor(this);
    this.usernamesLoaded = false;

    this.eventsHandler = new SupabaseEvents({
      client: this.client,
    });
    this.attendeesHandler = new SupabaseAttendees({
      client: this.client,
    });
    this.eventParticipantsHandler = new SupabaseEventParticipants({
      client: this.client,
    });
    this.eventProctorsHandler = new SupabaseEventProctors({
      client: this.client,
    });
    this.rollCallEventsHandler = new SupabaseRollCallEvents({
      client: this.client,
    });
    this.rollCallsHandler = new SupabaseRollCalls({
      client: this.client,
    });
    this.setupEventListeners();
  }

  setupEventListeners() {
    this.attendeesHandler.addListener({
      [BaseTableHandlerEventKey.DATA_LOADED]: () => {
        this.fireUpdate((cb) => cb[SupaBaseEventKey.ATTENDEES_CHANGED]?.());
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
      [BaseTableHandlerEventKey.DATA_CHANGED]: () => {
        this.fireUpdate((cb) => cb[SupaBaseEventKey.EVENTS_CHANGED]?.());
      },
    });

    this.eventParticipantsHandler.addListener({
      [BaseTableHandlerEventKey.DATA_LOADED]: () => {
        this.fireUpdate((cb) =>
          cb[SupaBaseEventKey.EVENT_PARTICIPANTS_CHANGED]?.(),
        );
      },
      [BaseTableHandlerEventKey.DATA_CHANGED]: () => {
        this.fireUpdate((cb) =>
          cb[SupaBaseEventKey.EVENT_PARTICIPANTS_CHANGED]?.(),
        );
      },
    });

    this.eventProctorsHandler.addListener({
      [BaseTableHandlerEventKey.DATA_LOADED]: () => {
        this.fireUpdate((cb) =>
          cb[SupaBaseEventKey.EVENT_PROCTORS_CHANGED]?.(),
        );
      },
      [BaseTableHandlerEventKey.DATA_CHANGED]: () => {
        this.fireUpdate((cb) =>
          cb[SupaBaseEventKey.EVENT_PROCTORS_CHANGED]?.(),
        );
      },
    });

    this.rollCallEventsHandler.addListener({
      [BaseTableHandlerEventKey.DATA_LOADED]: () => {
        const currentChanged = this.refreshLegacyRollCallState();
        this.fireUpdate((cb) =>
          cb[SupaBaseEventKey.LOADED_ROLLCALL_EVENTS]?.(),
        );
        if (currentChanged) {
          this.fireUpdate((cb) =>
            cb[SupaBaseEventKey.UPDATED_ROLLCALL_EVENT]?.(),
          );
        }
      },
      [BaseTableHandlerEventKey.DATA_CHANGED]: () => {
        const currentChanged = this.refreshLegacyRollCallState();
        this.fireUpdate((cb) =>
          cb[SupaBaseEventKey.LOADED_ROLLCALL_EVENTS]?.(),
        );
        if (currentChanged) {
          this.fireUpdate((cb) =>
            cb[SupaBaseEventKey.UPDATED_ROLLCALL_EVENT]?.(),
          );
        }
      },
    });

    this.rollCallsHandler.addListener({
      [BaseTableHandlerEventKey.DATA_LOADED]: () => {
        this.fireUpdate((cb) => cb[SupaBaseEventKey.LOADED_ROLLCALLS]?.());
      },
      [BaseTableHandlerEventKey.DATA_CHANGED]: () => {
        this.fireUpdate((cb) => cb[SupaBaseEventKey.LOADED_ROLLCALLS]?.());
      },
    });
  }

  private refreshLegacyRollCallState(): boolean {
    const nextRollCallEvents = this.rollCallEventsHandler.arr();
    const nextCurrentRollCallEvent =
      this.rollCallEventsHandler.getLegacyCurrent();
    const currentChanged =
      this.currentRollCallEvent !== nextCurrentRollCallEvent;

    this.rollCallEvents = nextRollCallEvents;
    this.rollcallEventsLoaded = this.rollCallEventsHandler.dataLoaded;
    this.currentRollCallEvent = nextCurrentRollCallEvent;

    return currentChanged;
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
          this.listenToRealtimeChanges();
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
    await this.listenToRealtimeChanges();
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
        this.eventsHandler.loadData(refresh),
        this.eventParticipantsHandler.loadData(refresh),
        this.eventProctorsHandler.loadData(refresh),
        this.rollCallEventsHandler.loadData(refresh),
        this.rollCallsHandler.loadData(refresh),
        this.loadUsernames(),
      ]);
      this.refreshLegacyRollCallState();

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

  async listenToRealtimeChanges() {
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
        console.log(
          `%cReceived update from remote for table %c${payload.table}%c with event %c${payload.eventType}`,
          "color: grey",
          "color: cyan",
          "color: grey",
          "color: lime",
          payload,
        );
        this.realtimeChannelMonitor.receivedRealtimeUpdate();

        switch (payload.table) {
          case Tables.ATTENDEES:
            this.attendeesHandler.handleAttendeesChangesFromRemote(payload);
            return;
          case Tables.ROLLCALL:
            this.rollCallsHandler.handleRollCallChangesFromRemote(payload);
            return;
          case Tables.ROLLCALL_EVENT:
            this.rollCallEventsHandler.handleRollCallEventChangesFromRemote(
              payload,
            );
            return;
          case Tables.EVENTS:
            this.handleEventsChanges(payload);
            return;
          case Tables.EVENT_PARTICIPANTS:
            this.handleEventParticipantsChanges(payload);
            return;
          case Tables.EVENT_PROCTORS:
            this.handleEventProctorsChanges(payload);
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

  async handleRollCallEventChanges(
    payload: RealtimePostgresChangesPayload<{ [key: string]: any }>,
  ) {
    return this.rollCallEventsHandler.handleRollCallEventChangesFromRemote(
      payload,
    );
  }

  async handleRollCallChanges(
    payload: RealtimePostgresChangesPayload<{ [key: string]: any }>,
  ) {
    return this.rollCallsHandler.handleRollCallChangesFromRemote(payload);
  }

  async handleEventsChanges(
    payload: RealtimePostgresChangesPayload<{ [key: string]: any }>,
  ) {
    switch (payload.eventType) {
      case RealtimeChangeEventType.INSERT:
        return this.eventsHandler.addEventReceivedFromRemote(
          payload.new as EventsEntry,
        );
      case RealtimeChangeEventType.UPDATE:
        return this.eventsHandler.updateEventReceivedFromRemote(
          payload.new as EventsEntry,
        );
      case RealtimeChangeEventType.DELETE:
        return this.eventsHandler.removeEventReceivedFromRemote(payload.old.id);
    }

    debugger;
  }

  async handleEventParticipantsChanges(
    payload: RealtimePostgresChangesPayload<{ [key: string]: any }>,
  ) {
    return this.eventParticipantsHandler.handleEventParticipantsChangesFromRemote(
      payload,
    );
  }

  async handleEventProctorsChanges(
    payload: RealtimePostgresChangesPayload<{ [key: string]: any }>,
  ) {
    return this.eventProctorsHandler.handleEventProctorsChangesFromRemote(
      payload,
    );
  }

  async addRollCallEventReceivedFromRemote(entry: RollCallEntry) {
    return this.rollCallsHandler.addRollCallReceivedFromRemote(entry);
  }

  async removeRollCallEventFromDB(rollCallEventId: number) {
    return this.rollCallEventsHandler.removeRollCallEventReceivedFromRemote(
      rollCallEventId,
    );
  }

  async addRollCallEventFromDB(entry: RollCallEventEntry) {
    return this.rollCallEventsHandler.addRollCallEventReceivedFromRemote(entry);
  }

  async updateRollCallEventFromDB(entry: RollCallEventEntry) {
    return this.rollCallEventsHandler.updateRollCallEventReceivedFromRemote(
      entry,
    );
  }

  async _loadUsernames(): Promise<void> {
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

  async loadUsernames(): Promise<void> {
    if (!this.loadUsernamePromise) {
      this.loadUsernamePromise = this._loadUsernames();
    }

    return this.loadUsernamePromise;
  }

  get rollcallInProgress(): boolean {
    if (!this.currentRollCallEvent) {
      return false;
    }

    return this.currentRollCallEvent.closed_by == null;
  }

  async loadRollCalls() {
    await this.rollCallsHandler.loadData(true);
  }

  async loadRollCallEvents() {
    await this.rollCallEventsHandler.loadData(true);
    this.refreshLegacyRollCallState();
  }

  sortRollCallEvent(a: RollCallEventEntry, b: RollCallEventEntry) {
    const createdAtDelta =
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    if (createdAtDelta !== 0) {
      return createdAtDelta;
    }

    const counterDelta = (b.counter ?? 0) - (a.counter ?? 0);
    if (counterDelta !== 0) {
      return counterDelta;
    }

    return b.id - a.id;
  }

  async calculateCurrentRollCallEvent() {
    const currentChanged = this.refreshLegacyRollCallState();
    if (currentChanged) {
      this.fireUpdate((cb) => cb[SupaBaseEventKey.UPDATED_ROLLCALL_EVENT]?.());
    }
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

  async createNewAttendanceEvent(
    name: string,
    startTime: string,
    endTime: string,
  ) {
    const createdEvent = await this.eventsHandler.createNewAttendanceEvent(
      name,
      startTime,
      endTime,
      this.user.id,
    );

    if (!createdEvent) {
      return false;
    }

    const didCreateCreatorProctor =
      await this.eventProctorsHandler.createEventProctor(
        createdEvent.id,
        this.user.id,
      );

    if (!didCreateCreatorProctor) {
      console.error(
        `createNewAttendanceEvent: Event created but creator could not be added as first proctor`,
      );
    }

    return true;
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

  async createRollCall(
    attendee: Attendee,
    rollCallEventId: number,
    method: RollCallMethod,
    status: RollCallStatus = RollCallStatus.PRESENT,
  ): Promise<boolean> {
    const data = await this.rollCallsHandler.createRollCall(
      attendee.id,
      this.user.id,
      rollCallEventId,
      method,
      status,
    );

    if (!data) {
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

  async createNewRollCall(
    attendee: Attendee,
    method: RollCallMethod,
    status: RollCallStatus = RollCallStatus.PRESENT,
  ): Promise<boolean> {
    if (!this.currentRollCallEvent) {
      return false;
    }

    return this.createRollCall(
      attendee,
      this.currentRollCallEvent.id,
      method,
      status,
    );
  }

  barcodeScanned(hash: string): BarcodeProcessResult {
    const attendee = this.attendeesHandler.get(hash);

    if (!attendee) {
      return {
        state: BarcodeProcessState.UNKNOWN,
      };
    }

    if (this.isAttendeePresent(attendee, this.currentRollCallEvent?.id)) {
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

  async createRollCallEvent(
    description: string,
    eventId: number,
  ): Promise<boolean> {
    return this.rollCallEventsHandler.createRollCallEvent(
      eventId,
      this.user.id,
      description,
    );
  }

  async createNewRollCallEvent(
    description: string,
    eventId: number,
  ): Promise<boolean> {
    return this.createRollCallEvent(description, eventId);
  }

  getRollCallEventById(rollCallEventId: number): RollCallEventEntry | null {
    return this.rollCallEventsHandler.getById(rollCallEventId);
  }

  getRollCallEventsByEventId(eventId: number): RollCallEventEntry[] {
    return this.rollCallEventsHandler.getByEventId(eventId);
  }

  getRollCallEventsByEventIds(eventIds: number[]): RollCallEventEntry[] {
    const validEventIds = eventIds.filter((eventId) =>
      Number.isInteger(eventId),
    );
    if (validEventIds.length === 0) {
      return [];
    }

    const eventIdSet = new Set(validEventIds);
    return this.rollCallEventsHandler
      .arr()
      .filter(
        (event) => event.event_id != null && eventIdSet.has(event.event_id),
      );
  }

  getLatestRollCallEventByEventIds(
    eventIds: number[],
  ): RollCallEventEntry | null {
    return this.getRollCallEventsByEventIds(eventIds)[0] ?? null;
  }

  getLatestRollCallEvent(eventId: number): RollCallEventEntry | null {
    return this.rollCallEventsHandler.getLatestByEventId(eventId);
  }

  getActiveRollCallEvent(eventId: number): RollCallEventEntry | null {
    return this.rollCallEventsHandler.getActiveByEventId(eventId);
  }

  hasActiveRollCallEvent(eventId: number): boolean {
    return this.rollCallEventsHandler.hasActiveByEventId(eventId);
  }

  getNextRollCallEventCounter(eventId: number): number {
    return this.rollCallEventsHandler.getNextCounter(eventId);
  }

  getRollCallsByRollCallEventId(rollCallEventId: number): RollCallEntry[] {
    return this.rollCallsHandler.getByRollCallEventId(rollCallEventId);
  }

  getLatestRollCallForAttendee(
    rollCallEventId: number,
    attendeeId: number,
  ): RollCallEntry | null {
    return this.rollCallsHandler.getLatestByRollCallEventAndAttendeeId(
      rollCallEventId,
      attendeeId,
    );
  }

  getCurrentRollCallForAttendee(
    attendee: Attendee,
    rollCallEventId: number | null = this.currentRollCallEvent?.id,
  ): RollCallEntry | null {
    if (!rollCallEventId) {
      return null;
    }

    return this.getLatestRollCallForAttendee(rollCallEventId, attendee.id);
  }

  getAttendeeStatus(
    attendee: Attendee,
    rollCallEventId: number | null = this.currentRollCallEvent?.id,
  ): AttendeeStatus {
    const currentRollCall = this.getCurrentRollCallForAttendee(
      attendee,
      rollCallEventId,
    );

    if (!currentRollCall) {
      return AttendeeStatus.NOT_SCANNED;
    }

    return currentRollCall.status === RollCallStatus.PRESENT
      ? AttendeeStatus.PRESENT
      : AttendeeStatus.ABSENT;
  }

  isAttendeePresent(
    attendee: Attendee,
    rollCallEventId: number | null = this.currentRollCallEvent?.id,
  ): boolean {
    return (
      this.getAttendeeStatus(attendee, rollCallEventId) ===
      AttendeeStatus.PRESENT
    );
  }

  getEventParticipants(eventId: number): EventParticipant[] {
    return this.eventParticipantsHandler
      .getByEventId(eventId)
      .map((eventParticipant) => this.createEventParticipant(eventParticipant))
      .filter(
        (eventParticipant): eventParticipant is EventParticipant =>
          eventParticipant != null,
      );
  }

  getEventParticipantsForRollCallEvent(
    rollCallEventId: number | null,
  ): EventParticipant[] {
    if (!rollCallEventId) {
      return [];
    }

    const rollCallEvent = this.getRollCallEventById(rollCallEventId);
    if (!rollCallEvent?.event_id) {
      return [];
    }

    return this.getEventParticipants(rollCallEvent.event_id);
  }

  countAttendees(
    status: RollCallStatus,
    rollCallEventId: number | null = this.currentRollCallEvent?.id,
  ): number {
    if (!rollCallEventId) {
      return 0;
    }

    const rollCallEvent = this.getRollCallEventById(rollCallEventId);
    if (!!rollCallEvent?.event_id) {
      const attendeeStatus =
        status === RollCallStatus.PRESENT
          ? AttendeeStatus.PRESENT
          : AttendeeStatus.ABSENT;
      return this.getEventParticipantsForRollCallEvent(rollCallEventId).filter(
        (eventParticipant) =>
          eventParticipant.status(rollCallEvent) === attendeeStatus,
      ).length;
    }

    let counter = 0;
    this.attendeesHandler.iterate((attendee) => {
      if (
        this.getAttendeeStatus(attendee, rollCallEventId) ===
        AttendeeStatus.PRESENT
      ) {
        if (status === RollCallStatus.PRESENT) {
          counter += 1;
        }
        return;
      }

      if (status === RollCallStatus.ABSENT) {
        const attendeeStatus = this.getAttendeeStatus(
          attendee,
          rollCallEventId,
        );
        if (attendeeStatus === AttendeeStatus.ABSENT) {
          counter += 1;
        }
      }
    });

    return counter;
  }

  countTrackedAttendees(
    rollCallEventId: number | null = this.currentRollCallEvent?.id,
  ): number {
    if (!rollCallEventId) {
      return this.attendeesHandler.count;
    }

    const rollCallEvent = this.getRollCallEventById(rollCallEventId);
    if (!!rollCallEvent?.event_id) {
      return this.getEventParticipantsForRollCallEvent(rollCallEventId).length;
    }

    return this.attendeesHandler.count;
  }

  countPresentAttendees(
    rollCallEventId: number | null = this.currentRollCallEvent?.id,
  ): number {
    return this.countAttendees(RollCallStatus.PRESENT, rollCallEventId);
  }

  countAbsentAttendees(
    rollCallEventId: number | null = this.currentRollCallEvent?.id,
  ): number {
    return this.countAttendees(RollCallStatus.ABSENT, rollCallEventId);
  }

  async closeRollCallEvent(rollCallEventId: number): Promise<boolean> {
    return this.rollCallEventsHandler.closeRollCallEvent(
      rollCallEventId,
      this.user.id,
    );
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

    return this.closeRollCallEvent(this.currentRollCallEvent.id);
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

  private createEventParticipant(
    eventParticipant: EventParticipantsEntry,
  ): EventParticipant | null {
    const attendee = this.attendeesHandler.getById(
      eventParticipant.attendee_id,
    );
    if (!attendee) {
      return null;
    }

    return new EventParticipant({
      attendee,
      eventParticipant,
      rollCalls: this.rollCallsHandler.getByAttendeeId(attendee.id),
    });
  }

  countUnScannedAttendees(
    rollCallEventId: number | null = this.currentRollCallEvent?.id,
  ) {
    const rollCallEvent = rollCallEventId
      ? this.getRollCallEventById(rollCallEventId)
      : null;
    if (!!rollCallEvent?.event_id) {
      return this.getEventParticipantsForRollCallEvent(rollCallEventId).filter(
        (eventParticipant) =>
          eventParticipant.status(rollCallEvent) === AttendeeStatus.NOT_SCANNED,
      ).length;
    }

    let counter = 0;
    this.attendeesHandler.iterate((attendee) => {
      if (
        this.getAttendeeStatus(attendee, rollCallEventId) ===
        AttendeeStatus.NOT_SCANNED
      ) {
        counter += 1;
      }
    });

    return counter;
  }
}
