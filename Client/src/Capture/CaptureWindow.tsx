import styled from "@emotion/styled";
import React, {
  RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Backdrop } from "../Components/Backdrop/Backdrop";
import { Tile } from "../Components/Tile";
import { SupaBase } from "../SupaBase/SupaBase";

export interface CaptureWindowProps {
  supabase: SupaBase;
  isCapturing: boolean;
}

export interface Barcodes {
  rawValue: string;
}

// Not part of standard types yet?
export interface BarcodeDetector {
  detect: (video: HTMLVideoElement) => Promise<Barcodes[]>;
}

let lastResultSet: Set<string> = new Set();
async function processBarcode(result: Barcodes, supabase: SupaBase) {
  const val = `${result.rawValue}`;
  if (lastResultSet.has(val)) {
    return;
  }

  lastResultSet.add(val);

  // Clear it after some time so that we can rescan if necessary
  setTimeout(() => {
    lastResultSet.delete(val);
  }, 5000);

  console.log(`New QR Code: ${val}`);
  await supabase.barcodeScanned(val);
}

function startDetectLoop(el: HTMLVideoElement, supabase: SupaBase) {
  let loop = true;

  const detector: BarcodeDetector = new (globalThis as any).BarcodeDetector({
    formats: ["qr_code"],
  });

  let latestTimeout: NodeJS.Timeout | null = null;
  const runDetect = async () => {
    try {
      const results = await detector.detect(el);

      if (!loop) {
        return;
      }

      for (let result of results) {
        await processBarcode(result, supabase);
      }

      if (!loop) {
        return;
      }

      latestTimeout = setTimeout(() => {
        if (!loop) {
          return;
        }

        runDetect();
      }, 250);
    } catch (err) {
      console.error("Barcode Detection Failed!", err);
    }
  };

  runDetect();

  return () => {
    console.log("Barcode Detection Stopped!");
    !!latestTimeout && clearTimeout(latestTimeout);
    lastResultSet.clear();
    loop = false;
  };
}

export const CaptureWindow: React.FC<CaptureWindowProps> = (
  props: CaptureWindowProps
) => {
  const { supabase, isCapturing } = props;
  const videoRef = useRef<HTMLVideoElement>(null);
  const [vidReady, setVidReady] = useState<boolean>(false);

  const handleVideoReady = useCallback(
    (isReady: boolean) => {
      setVidReady((prev) => {
        return isReady;
      });
    },
    [vidReady]
  );

  useEffect(() => {
    if (!vidReady) {
      return;
    }

    if (!videoRef.current) {
      return;
    }

    return startDetectLoop(videoRef.current, supabase);
  }, [vidReady]);

  if (!isCapturing) {
    return null;
  }

  return (
    <S.Container>
      <S.CaptureWindowEl>
        <Cam onReady={handleVideoReady} forwardRef={videoRef} />
      </S.CaptureWindowEl>
    </S.Container>
  );
};

export interface CamProps {
  forwardRef: RefObject<HTMLVideoElement>;
  onReady: (isReady: boolean) => void;
}

const Cam: React.FC<CamProps> = (props: CamProps) => {
  const { forwardRef, onReady } = props;

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => {
      onReady(false);
      setMounted(false);
    };
  }, []);

  useEffect(() => {
    const el = forwardRef.current;
    if (!el || !mounted) {
      return;
    }

    if (!navigator.mediaDevices.getUserMedia) {
      return;
    }

    let activeStream: MediaStream | null;

    navigator.mediaDevices
      .getUserMedia({
        video: {
          facingMode: "environment",
          aspectRatio: 1,
        },
      })
      .then(function (stream) {
        if (!forwardRef.current || !mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        forwardRef.current.srcObject = stream;
        activeStream = stream;
      })
      .catch(function (error) {
        console.log("Something went wrong!", error);
      });

    return () => {
      console.log(`Closing Camera feed`);
      activeStream?.getTracks()?.forEach((t) => t.stop());
      activeStream = null;
    };
  }, [mounted]);

  const handleOnPlay = useCallback(() => {
    onReady(true);
  }, [onReady]);

  return (
    <S.Video onPlay={handleOnPlay} autoPlay={true} ref={forwardRef}></S.Video>
  );
};

namespace S {
  export const Container = styled.div`
    display: flex;
    width: 100%;
    justify-content: center;
  `;

  export const CaptureWindowEl = styled(Tile)`
    max-width: min(300px, 80vw);
    max-height: min(300px, 80vh);
    min-width: min(300px, 80vw);
    min-height: min(300px, 80vh);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    padding: 0;
  `;

  export const StyledBackdrop = styled(Backdrop)`
    display: flex;
    justify-content: center;
    align-items: center;
  `;

  export const Video = styled.video`
    max-height: 100%;
    max-width: 100%;
    aspect-ratio: 1;
  `;
}
