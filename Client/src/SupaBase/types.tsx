import { DefaultColors } from "../Tools/Toolbox";
import { Database } from "./supabase-types";

export enum Tables {
  PING_TABLE = "PingTable",
  ATTENDEES = "Attendees",
  ROLLCALL = "RollCall",
  ROLLCALL_EVENT = "RollCallEvent",
  PROFILES = "profiles",
}

export enum RollCallStatus {
  ABSENT = "ABSENT",
  PRESENT = "PRESENT",
}

export enum RollCallMethod {
  QR = "QR",
  MANUAL = "MANUAL",
}

export type ProfileEventEntry =
  Database["public"]["Tables"][Tables.PROFILES]["Row"];
export type UpdateProfileEventEntry =
  Database["public"]["Tables"][Tables.PROFILES]["Update"];

export type RollCallEventEntry =
  Database["public"]["Tables"][Tables.ROLLCALL_EVENT]["Row"];
export type InsertRollCallEvent =
  Database["public"]["Tables"][Tables.ROLLCALL_EVENT]["Insert"];
export type UpdateRollCallEvent =
  Database["public"]["Tables"][Tables.ROLLCALL_EVENT]["Update"];

export type InsertRollCallEntry =
  Database["public"]["Tables"][Tables.ROLLCALL]["Insert"];
export type RollCallEntry = Omit<
  Database["public"]["Tables"][Tables.ROLLCALL]["Row"],
  "status"
> & { status: RollCallStatus };

export type AttendeesEntry =
  Database["public"]["Tables"][Tables.ATTENDEES]["Row"];
export type InsertAttendees =
  Database["public"]["Tables"][Tables.ATTENDEES]["Insert"];
export type UpdateAttendees =
  Database["public"]["Tables"][Tables.ATTENDEES]["Update"];

export type PingEntry = Database["public"]["Tables"][Tables.PING_TABLE]["Row"];
export type UpdatePingEntry =
  Database["public"]["Tables"][Tables.PING_TABLE]["Update"];

const ORDERED_COLORS: string[] = [
  DefaultColors.BrightPurple,
  DefaultColors.BrightCyan,
  DefaultColors.BrightGrey,
  DefaultColors.BrightGreen,
  DefaultColors.BrightYellow,
  DefaultColors.BrightBlue,
  DefaultColors.BrightOrange,
];
