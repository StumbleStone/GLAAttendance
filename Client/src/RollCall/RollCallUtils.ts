import { EventsEntry, RollCallEventEntry } from "../SupaBase/types";

export function getRollCallEventLabel(
  event: EventsEntry | null,
  eventId: number | null,
): string {
  const eventName = event?.name?.trim();
  if (!!eventName) {
    return eventName;
  }

  if (eventId != null) {
    return `Event #${eventId}`;
  }

  return "Unassigned Event";
}

export function getRollCallSessionLabel(
  rollCallEvent: RollCallEventEntry | null,
): string {
  if (!rollCallEvent) {
    return "Rollcall";
  }

  const counterLabel = Number.isInteger(rollCallEvent.counter)
    ? `#${rollCallEvent.counter}`
    : "Rollcall";
  const description = rollCallEvent.description?.trim();

  if (!!description) {
    return `${counterLabel} ${description}`;
  }

  return counterLabel === "Rollcall"
    ? counterLabel
    : `${counterLabel} Rollcall`;
}
