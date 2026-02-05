import * as qrcode from "qrcode";
import {
  AttendeesEntry,
  RollCallEntry,
  RollCallEventEntry,
  RollCallStatus,
} from "../SupaBase/types";
import { EventClass, EventClassEvents } from "../Tools/EventClass";

export const QR_SIZE: number = 1024;

export interface AttendeeEvents extends EventClassEvents {
  updated: () => void;
  statusUpdated: () => void;
  qrReady: (qrCode: HTMLCanvasElement) => void;
}

export enum AttendeeStatus {
  PRESENT = "Present",
  ABSENT = "Absent",
  NOT_SCANNED = "Not Scanned",
}

async function generateQRCode(str: string): Promise<HTMLCanvasElement | null> {
  try {
    return await qrcode.toCanvas(`${str}`, {
      width: QR_SIZE,
    });
  } catch (e) {
    console.error(e);
    return null;
  }
}

export class Attendee extends EventClass<AttendeeEvents> {
  entry: AttendeesEntry;
  rollCalls: RollCallEntry[];
  hash: string;

  currentRollCall: RollCallEntry | null;

  qrCode: HTMLCanvasElement;
  qrCodeString: string;
  qrGenPromise: Promise<HTMLCanvasElement>;

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

  get isDeleted(): boolean {
    return this.entry.deleted;
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

  get fullNameFileSafe(): string {
    return this.fullName.replace(/[^a-z0-9]/gi, "_").toLowerCase();
  }

  get isUsingOwnTransport(): boolean {
    return this.entry.own_transport;
  }

  get allergies(): string[] {
    return (this.entry.allergies ?? "")
      .split(",")
      .filter((v) => v.trim() !== "");
  }

  get emergencyContacts(): string[] {
    return (this.entry.emergency_contact ?? "")
      .split(",")
      .filter((v) => v.trim() !== "");
  }

  removeRollCall(rollCall: RollCallEntry): void {
    if (!this.rollCalls.find((r) => r.id === rollCall.id)) {
      return;
    }

    this.rollCalls = this.rollCalls.filter((r) => r.id !== rollCall.id);

    this.fireUpdate((cb) => cb.updated?.());
  }

  checkCurrentRollCall(currentRollCallEvent: RollCallEventEntry) {
    const matchingRollCall = this.rollCalls.find(
      (rc) => rc.roll_call_event_id === currentRollCallEvent.id
    );

    if (matchingRollCall) {
      this.setCurrentRollCall(matchingRollCall);
    } else {
      this.setCurrentRollCall(null);
    }
  }

  setCurrentRollCall(rollCall: RollCallEntry | null): void {
    if (!rollCall && this.currentRollCall != null) {
      this.currentRollCall = null;
      this.fireUpdate((cb) => cb.statusUpdated?.());
      return;
    }

    if (!rollCall) {
      // Both are null
      return;
    }

    // Unchanged
    if (rollCall.id === this.currentRollCall?.id) {
      return;
    }

    const statusChanged = this.currentRollCall?.status !== rollCall.status;
    this.currentRollCall = rollCall;

    this.fireUpdate((cb) => cb.updated?.());
    if (statusChanged) {
      this.fireUpdate((cb) => cb.statusUpdated?.());
    }
  }

  pushRollCall(rollCall: RollCallEntry, isCurrent: boolean): void {
    this.rollCalls.push(rollCall);

    this.fireUpdate((cb) => cb.updated?.());

    if (isCurrent) {
      this.setCurrentRollCall(rollCall);
    }
  }

  updateAttendee(entry: AttendeesEntry): void {
    this.entry = entry;
    this.fireUpdate((cb) => cb.updated?.());
  }

  status(rollCallEvent: RollCallEventEntry): AttendeeStatus {
    if (!rollCallEvent) {
      return AttendeeStatus.NOT_SCANNED;
    }

    const matching = this.rollCalls
      .filter((rc) => rc.roll_call_event_id === rollCallEvent.id)
      .sort((a, b) => {
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      });

    if (matching.length == 0) {
      return AttendeeStatus.NOT_SCANNED;
    }

    return matching[0].status === RollCallStatus.PRESENT
      ? AttendeeStatus.PRESENT
      : AttendeeStatus.ABSENT;
  }

  isPresent(rollCallEvent: RollCallEventEntry): boolean {
    return this.status(rollCallEvent) === AttendeeStatus.PRESENT;
  }

  async generateQRCode(): Promise<HTMLCanvasElement> {
    if (this.qrCode) {
      return this.qrCode;
    }

    if (this.qrGenPromise) {
      return this.qrGenPromise;
    }

    this.qrGenPromise = new Promise<HTMLCanvasElement>(async (resolve) => {
      console.log(`Generating a new QR code for ${this.fullName}`);
      const canvas = await generateQRCode(this.hash);

      if (!canvas) {
        throw `Failed to create QR Code`;
      }

      requestAnimationFrame(() => {
        const ctx: CanvasRenderingContext2D = canvas.getContext("2d")!;
        ctx.font = "60px monospace";
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";

        // const len = ctx.measureText(title)?.width || 0;
        // const { actualBoundingBoxLeft, actualBoundingBoxRight } =
        //   ctx.measureText(this.fullName);
        // const len = Math.ceil(
        //   Math.abs(actualBoundingBoxLeft) + Math.abs(actualBoundingBoxRight)
        // );

        let name = this.fullName;
        if (this.isUsingOwnTransport == false) {
          name += " ";
        }

        ctx.fillText(
          name,
          QR_SIZE / 2,
          QR_SIZE * 0.08,
          QR_SIZE - QR_SIZE * 0.3
        );

        ctx.fillText(
          this.isUsingOwnTransport ? "🚙 Car" : "🚌 Bus",
          QR_SIZE / 2,
          QR_SIZE * (1 - 0.08),
          QR_SIZE - QR_SIZE * 0.3
        );

        this.qrCodeString = canvas.toDataURL("image/png");
        this.qrCode = canvas;

        this.fireUpdate((cb) => cb.qrReady?.(canvas));
        console.log(`${this.fullName} QR Ready`);

        resolve(canvas);
      });
    });

    return this.qrGenPromise;
  }

  get QRCodeURL(): string {
    return this.qrCodeString;
  }

  get QRCode(): HTMLCanvasElement {
    return this.qrCode;
  }

  static SortByField(a: Attendee, b: Attendee, field: string) {
    return (a as any)[field].localeCompare((b as any)[field], "en", {
      sensitivity: "base",
    });
  }
}
