import {
  faCamera,
  faCheckSquare,
  faQuestionCircle,
  faWarning,
  IconDefinition,
} from "@fortawesome/free-solid-svg-icons";
import QrScanner from "qr-scanner";
import {
  BarcodeProcessResult,
  BarcodeProcessState,
  SupaBase,
} from "../SupaBase/SupaBase";
import { EventClass, EventClassEvents } from "../Tools/EventClass";
import { DefaultColors } from "../Tools/Toolbox";

export enum QRScannerEventKey {
  EMOTE_ADDED = "emote_added",
  EMOTE_REMOVED = "emote_removed",
  EMOTE_UPDATED = "emote_updated",
}

export interface QRScannerEvents extends EventClassEvents {
  [QRScannerEventKey.EMOTE_ADDED]: () => void;
  [QRScannerEventKey.EMOTE_REMOVED]: () => void;
  [QRScannerEventKey.EMOTE_UPDATED]: () => void;
}

export interface EmoteData {
  x: number;
  y: number;
  size: number;
  icon: IconDefinition;
  color: string;
  id: string;
  deg: number;
  lastRefreshed: number;
}

const EMOTE_STALE_TH = 500;

export class QRScanner extends EventClass<QRScannerEvents> {
  worker: Worker;
  scanner: QrScanner;

  isSetup: boolean;
  supabase: SupaBase;

  emotes: Map<string, EmoteData>;

  frameSize: number = 1;
  xOffset: number = 0;
  yOffset: number = 0;

  staleEmoteChecker: NodeJS.Timeout | null;

  constructor(supabase: SupaBase) {
    super();
    this.handleScanResult = this.handleScanResult.bind(this);
    this.isSetup = false;
    this.supabase = supabase;

    this.emotes = new Map();
    this.checkStaleEmotes = this.checkStaleEmotes.bind(this);
  }

  checkStaleEmotes() {
    const time = Date.now();
    const toDel: string[] = [];
    Array.from(this.emotes.values()).forEach((v) => {
      if (time - v.lastRefreshed > EMOTE_STALE_TH) {
        toDel.push(v.id);
      }
    });

    if (toDel.length == 0) {
      return;
    }

    toDel.forEach((id) => this.emotes.delete(id));

    this.fireUpdate((cb) => cb[QRScannerEventKey.EMOTE_REMOVED]?.());
    if (this.emotes.size == 0) {
      this.stopStaleChecker();
    }
  }

  startStaleChecker() {
    if (!this.staleEmoteChecker) {
      this.staleEmoteChecker = setInterval(this.checkStaleEmotes, 100);
    }
  }

  stopStaleChecker() {
    if (this.staleEmoteChecker) {
      clearInterval(this.staleEmoteChecker);
      this.staleEmoteChecker = null;
    }
  }

  async init(videoElement: HTMLVideoElement, overlay: HTMLDivElement) {
    await this.setupScanner(videoElement, overlay);
    await this.startScanning();
  }

  get emotesArr(): EmoteData[] {
    return Array.from(this.emotes.values());
  }

  handleScanResult(payload: QrScanner.ScanResult) {
    // if (!this.supabase.rollcallInProgress) {
    //   return;
    // }

    const result: BarcodeProcessResult = this.supabase.barcodeScanned(
      payload.data
    );

    const top = Math.min(...payload.cornerPoints.map((p) => p.y));
    const bot = Math.max(...payload.cornerPoints.map((p) => p.y));
    const left = Math.min(...payload.cornerPoints.map((p) => p.x));
    const right = Math.max(...payload.cornerPoints.map((p) => p.x));

    const p1 = payload.cornerPoints[0];
    const p2 = payload.cornerPoints[1];
    const xDiff = p2.x - p1.x;
    const yDiff = p2.y - p1.y;
    const deg = Math.floor((Math.sin(yDiff / xDiff) / Math.PI) * 180);

    const size = Math.min(
      60,
      ((bot - top) / this.frameSize) * 300 * 1.2,
      ((right - left) / this.frameSize) * 300 * 1.2
    );

    const icon: IconDefinition =
      result.state === BarcodeProcessState.PRESENT
        ? faCheckSquare
        : result.state === BarcodeProcessState.PROCESSING
        ? faCamera
        : result.state === BarcodeProcessState.ERROR
        ? faWarning
        : faQuestionCircle;

    const color: string =
      result.state === BarcodeProcessState.PRESENT
        ? DefaultColors.BrightGreen
        : result.state === BarcodeProcessState.PROCESSING
        ? DefaultColors.BrightOrange
        : result.state === BarcodeProcessState.ERROR
        ? DefaultColors.BrightRed
        : DefaultColors.BrightGrey;

    const newEmote: EmoteData = {
      color: color,
      icon: icon,
      id: payload.data,
      size: Math.floor(size),
      x: Math.floor(
        ((left - this.xOffset + (right - left) / 2) / this.frameSize) * 300
      ),
      y: Math.floor(
        ((top - this.yOffset + (bot - top) / 2) / this.frameSize) * 300
      ),
      deg: deg,
      lastRefreshed: Date.now(),
    };

    let existingEmote = this.emotes.get(payload.data);
    if (!existingEmote) {
      this.emotes.set(newEmote.id, newEmote);
      this.fireUpdate((cb) => cb[QRScannerEventKey.EMOTE_ADDED]?.());
      this.startStaleChecker();
      return;
    }

    let updated = false;
    for (let key of Object.keys(newEmote)) {
      if ((newEmote as any)[key] === (existingEmote as any)[key]) {
        continue;
      }

      updated = true;
      (existingEmote as any)[key] = (newEmote as any)[key];
    }

    if (updated) {
      this.fireUpdate((cb) => cb[QRScannerEventKey.EMOTE_UPDATED]?.());
    }
  }

  async setupScanner(videoElement: HTMLVideoElement, overlay: HTMLDivElement) {
    console.log(`Setting up scanner`);

    // Debugging: Force it to use worker like on iOS
    // (QrScanner as any)._disableBarcodeDetector = true;

    this.scanner = new QrScanner(videoElement, this.handleScanResult, {
      highlightCodeOutline: true,
      highlightScanRegion: true,
      calculateScanRegion: (video) => {
        const square = Math.min(video.videoWidth, video.videoHeight);

        this.frameSize = square;
        this.xOffset = (video.videoWidth - square) / 2;
        this.yOffset = (video.videoHeight - square) / 2;

        return {
          x: this.xOffset,
          y: this.yOffset,
          height: square,
          width: square,
        };
      },
      maxScansPerSecond: 10,
      returnDetailedScanResult: true,
      overlay: overlay,
      onDecodeError: (error) => {
        if (`${error}`.includes("No QR code found")) {
          // no worries
          return;
        }
        console.error(error);
      },
    });

    this.isSetup = true;
    console.log(`Setting up scanner done`);
  }

  async startScanning() {
    if (!this.isSetup) {
      return;
    }

    console.log(`Starting to scan`);
    await this.scanner.start();
  }

  async stopScanning() {
    console.log(`Stopping scan`);
    this.scanner.stop();
    this.stopStaleChecker();
    if (this.emotes.size > 0) {
      this.emotes.clear();
      this.fireUpdate((cb) => cb[QRScannerEventKey.EMOTE_REMOVED]?.());
    }
  }

  dispose() {
    console.log("Disposing scanner");
    this.isSetup = false;

    this.stopScanning();
    this.scanner.destroy();
    this.worker?.terminate();
  }
}
