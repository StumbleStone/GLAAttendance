import {DefaultColors} from "../Tools/Toolbox";
import {Database} from "./supabase-types";

export enum Tables {
  ATTENDEES = "Attendees",
  ROLLCALL = "RollCall",
}

export enum RollCallStatus {
  MISSING = 'MISSING',
  PRESENT = 'PRESENT',
}

export type RollCallEntry =
  Omit<Database["public"]["Tables"][Tables.ROLLCALL]["Row"], 'status'> & {status: RollCallStatus};

export type AttendeesEntry =
  Database["public"]["Tables"][Tables.ATTENDEES]["Row"];
export type AttendeesEntries = AttendeesEntry[];
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