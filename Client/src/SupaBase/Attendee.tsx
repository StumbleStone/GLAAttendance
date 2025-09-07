import { EventClass, EventClassEvents } from "../Tools/EventClass";
import {
  AttendeesEntry,
  RollCallEntry,
  RollCallEventEntry,
  RollCallStatus,
} from "./types";

export interface AttendeeEvents extends EventClassEvents {
  updated: () => void;
  statusUpdated: () => void;
}

export class Attendee extends EventClass<AttendeeEvents> {
  entry: AttendeesEntry;
  rollCalls: RollCallEntry[];
  hash: string;

  currentRollCall: RollCallEntry | null;

  constructor(entry: AttendeesEntry) {
    super();
    this.entry = entry;
    this.hash = this.generateHash();
    this.rollCalls = [];
    this.currentRollCall = null;
  }

  private generateHash(): string {
    return Attendee.GenerateHash(this.entry);
  }

  static GenerateHash(entry: AttendeesEntry): string {
    const string = `${entry.name}${entry.surname}${entry.id}`;
    let hash = 0;
    for (const char of string) {
      hash = (hash << 5) - hash + char.charCodeAt(0);
      hash |= 0; // Constrain to 32bit integer
    }
    return `${hash}`;
  }

  get id(): number {
    return this.entry.id;
  }

  get name(): string {
    return this.entry.name;
  }

  get surname(): string {
    return this.entry.surname;
  }

  get fullName(): string {
    return `${this.entry.name} ${this.entry.surname}`;
  }

  get status(): RollCallStatus {
    return this.currentRollCall?.status || RollCallStatus.MISSING;
  }

  removeRollCall(rollCall: RollCallEntry): void {
    if (!this.rollCalls.find((r) => r.id === rollCall.id)) {
      return;
    }

    this.rollCalls = this.rollCalls.filter((r) => r.id !== rollCall.id);
    if (this.currentRollCall?.id === rollCall.id) {
      this.updateCurrentRollCall(
        this.rollCalls.reduce((latest, r) => {
          return new Date(r.created_at) > new Date(latest.created_at)
            ? r
            : latest;
        }, this.rollCalls[0] || null)
      );
    }

    this.fireUpdate((cb) => cb.updated?.());
  }

  updateCurrentRollCall(newCurrent: RollCallEntry) {
    let statusChanged = !(this.currentRollCall?.status === newCurrent?.status);
    this.currentRollCall = newCurrent;

    if (statusChanged) {
      this.fireUpdate((cb) => cb.statusUpdated?.());
    }
  }

  pushRollCall(rollCall: RollCallEntry): void {
    this.rollCalls.push(rollCall);
    if (
      !this.currentRollCall ||
      new Date(rollCall.created_at) > new Date(this.currentRollCall.created_at)
    ) {
      this.updateCurrentRollCall(rollCall);
    }

    this.fireUpdate((cb) => cb.updated?.());
  }

  isPresent(rollCallEvent: RollCallEventEntry): boolean {
    if (!rollCallEvent) {
      return false;
    }

    const matching = this.rollCalls
      .filter((rc) => rc.roll_call_event_id === rollCallEvent.id)
      .sort((a, b) => {
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      });

    if (matching.length == 0) {
      return false;
    }

    return matching[0].status === RollCallStatus.PRESENT;
  }
}
