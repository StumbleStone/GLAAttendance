import { Attendee, AttendeeStatus } from "../Attendees/Attendee";
import {
  EventParticipantsEntry,
  RollCallEntry,
  RollCallEventEntry,
  RollCallStatus,
} from "../SupaBase/types";

export interface EventParticipantOptions {
  attendee: Attendee;
  eventParticipant: EventParticipantsEntry;
  rollCalls: RollCallEntry[];
}

export class EventParticipant {
  attendee: Attendee;
  eventParticipant: EventParticipantsEntry;
  rollCalls: RollCallEntry[];

  constructor(options: EventParticipantOptions) {
    this.attendee = options.attendee;
    this.eventParticipant = options.eventParticipant;
    this.rollCalls = [...options.rollCalls].sort(this.sortRollCallsDescending);
  }

  get attendeeId(): number {
    return this.attendee.id;
  }

  get participantId(): number {
    return this.eventParticipant.id;
  }

  get eventId(): number {
    return this.eventParticipant.event_id;
  }

  getLatestRollCall(rollCallEventId: number | null): RollCallEntry | null {
    if (!rollCallEventId) {
      return null;
    }

    return (
      this.rollCalls.find(
        (rollCall) => rollCall.roll_call_event_id === rollCallEventId,
      ) ?? null
    );
  }

  status(rollCallEvent: RollCallEventEntry | null): AttendeeStatus {
    if (!rollCallEvent) {
      return AttendeeStatus.NOT_SCANNED;
    }

    const latestRollCall = this.getLatestRollCall(rollCallEvent.id);
    if (!latestRollCall) {
      return AttendeeStatus.NOT_SCANNED;
    }

    return latestRollCall.status === RollCallStatus.PRESENT
      ? AttendeeStatus.PRESENT
      : AttendeeStatus.ABSENT;
  }

  isPresent(rollCallEvent: RollCallEventEntry | null): boolean {
    return this.status(rollCallEvent) === AttendeeStatus.PRESENT;
  }

  private sortRollCallsDescending = (
    a: RollCallEntry,
    b: RollCallEntry,
  ): number => {
    const createdAtDelta =
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    if (createdAtDelta !== 0) {
      return createdAtDelta;
    }

    return b.id - a.id;
  };
}
