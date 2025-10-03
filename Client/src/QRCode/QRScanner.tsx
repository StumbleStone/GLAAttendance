import QrScanner from "qr-scanner";
import {
  BarcodeProcessResult,
  BarcodeProcessState,
  SupaBase,
} from "../SupaBase/SupaBase";
import { EventClass, EventClassEvents } from "../Tools/EventClass";

export interface QRScannerEvents extends EventClassEvents {}

export class QRScanner extends EventClass<QRScannerEvents> {
  worker: Worker;
  scanner: QrScanner;

  isSetup: boolean;
  supabase: SupaBase;

  emotes: any;

  constructor(supabase: SupaBase) {
    super();
    this.handleScanResult = this.handleScanResult.bind(this);
    this.isSetup = false;
    this.supabase = supabase;
  }

  async init(
    videoElement: HTMLVideoElement,
    overlay: HTMLDivElement,
    emote: HTMLDivElement
  ) {
    await this.setupScanner(videoElement, overlay, emote);
    await this.startScanning();
  }

  handleScanResult(payload: QrScanner.ScanResult) {
    if (!this.supabase.rollcallInProgress) {
      return;
    }

    const result: BarcodeProcessResult = this.supabase.barcodeScanned(
      payload.data
    );

    if (result.state === BarcodeProcessState.PRESENT) {
    }

    debugger;
  }

  async setupScanner(
    videoElement: HTMLVideoElement,
    overlay: HTMLDivElement,
    emote: HTMLDivElement
  ) {
    console.log(`Setting up scanner`);

    // Debugging: Force it to use worker like on iOS
    // (QrScanner as any)._disableBarcodeDetector = true;

    this.scanner = new QrScanner(videoElement, this.handleScanResult, {
      highlightCodeOutline: true,
      highlightScanRegion: true,
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
  }

  dispose() {
    console.log("Disposing scanner");
    this.isSetup = false;

    this.stopScanning();
    this.scanner.destroy();
    this.worker?.terminate();
  }
}
