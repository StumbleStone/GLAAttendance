import {faTowerBroadcast} from "@fortawesome/free-solid-svg-icons";
import {HeadingIcon, HeadingIconHandler,} from "../MainMenu/HeadingIconHandler";
import {EventClass, EventClassEvents} from "../Tools/EventClass";
import {DefaultColors} from "../Tools/Toolbox";
import {ShowRealtimeChannelWindow} from "./RealtimeChannelWindow";
import {SupaBase} from "./SupaBase";

const IS_ALIVE_TIMEOUT = 120000; // 2min
const PING_DEBOUNCE = 5000; // 5s

export enum RealtimeChannelMonitorEventKey {
  UPDATE_RECEIVED = "update_received",
  CONNECTION_CHANGED = "connection_changed",
}

export interface RealtimeChannelMonitorEvent extends EventClassEvents {
  [RealtimeChannelMonitorEventKey.CONNECTION_CHANGED]: () => void;
  [RealtimeChannelMonitorEventKey.UPDATE_RECEIVED]: () => void;
}

export class RealtimeChannelMonitor extends EventClass<RealtimeChannelMonitorEvent> {
  icon: HeadingIcon;

  isConnected: boolean = false;
  hasReceivedUpdate: boolean = false;
  timer: NodeJS.Timeout | null = null;

  iconColor: string;
  status: string;
  lastReceived: number | null;
  lastPing: number;

  // yay... cross dependencies... TODO do this via events instead
  supabase: SupaBase;

  constructor(supabase: SupaBase) {
    super();
    this.icon = HeadingIconHandler.AddIcon({
      icon: faTowerBroadcast,
      onClick: () => ShowRealtimeChannelWindow(this),
      color: DefaultColors.BrightGrey,
    });
    this.supabase = supabase;
    this.lastPing = 0;

    this.pingChannel = this.pingChannel.bind(this);
  }

  setConnected() {
    this.isConnected = true;
    if (this.hasReceivedUpdate) {
      return;
    }

    this.updateIcon();
    this.fireUpdate((cb) =>
      cb[RealtimeChannelMonitorEventKey.CONNECTION_CHANGED]?.()
    );

    this.setupStaleChecker();
    this.pingChannel();
  }

  setDisconnected() {
    this.isConnected = false;
    this.hasReceivedUpdate = false;

    if (this.timer) {
      clearTimeout(this.timer);
    }

    this.updateIcon();
    this.fireUpdate((cb) =>
      cb[RealtimeChannelMonitorEventKey.CONNECTION_CHANGED]?.()
    );
  }

  setConnectionStale() {
    this.pingChannel();
    this.hasReceivedUpdate = false;
    this.updateIcon();
    this.timer = null;
  }

  receivedRealtimeUpdate() {
    this.lastReceived = Date.now();
    this.hasReceivedUpdate = true;

    if (!this.isConnected) {
      this.setConnected();
    }

    this.updateIcon();


    this.fireUpdate((cb) =>
      cb[RealtimeChannelMonitorEventKey.UPDATE_RECEIVED]?.()
    );
  }

  setupStaleChecker() {
    if (this.timer) {
      clearTimeout(this.timer);
    }

    this.timer = setTimeout(() => {
      this.setConnectionStale();
    }, IS_ALIVE_TIMEOUT);
  }

  updateIcon() {
    const calcColor = this.isConnected
      ? this.hasReceivedUpdate
        ? DefaultColors.BrightCyan
        : DefaultColors.Green
      : DefaultColors.BrightGrey;

    this.status = this.isConnected
      ? this.hasReceivedUpdate
        ? "Connected (Receiving)"
        : "Connected (Stale)"
      : "Disconnected";

    if (calcColor == this.iconColor) {
      return;
    }
    this.iconColor = calcColor;

    this.icon.update({ color: this.iconColor });
  }

  pingChannel() {
    if (this.lastPing - Date.now() >= PING_DEBOUNCE) {
      return;
    }

    console.log("Sending Ping!");
    this.lastPing = Date.now();
    this.supabase.firePing();
  }
}
