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

export interface CaptureWindowProps {}

export interface Barcodes {
  rawValue: string;
}

// Not part of standard types yet?
export interface BarcodeDetector {
  detect: (video: HTMLVideoElement) => Promise<Barcodes[]>;
}

function startDetectLoop(el: HTMLVideoElement) {
  let loop = true;

  const detector: BarcodeDetector = new (globalThis as any).BarcodeDetector({
    formats: ["qr_code"],
  });

  let lastResultSet: Set<string> = new Set();
  const runDetect = async () => {
    try {
      const results = await detector.detect(el);

      results.forEach((res) => {
        const val = `${res.rawValue}`;
        if (lastResultSet.has(val)) {
          return;
        }

        lastResultSet.add(val);

        // Clear it after some time so that we can rescan if necessary
        setTimeout(() => {
          lastResultSet.delete(val);
        }, 5000);
        console.log(`New QR Code: ${val}`);
      });

      if (!loop) {
        return;
      }

      setTimeout(() => {
        runDetect();
      }, 250);
    } catch (err) {
      console.error("Barcode Detection Failed!", err);
    }
  };

  runDetect();

  return () => {
    console.log("Barcode Detection Stopped!");
    lastResultSet.clear();
    loop = false;
  };
}

export const CaptureWindow: React.FC<CaptureWindowProps> = (
  props: CaptureWindowProps
) => {
  const {} = props;
  const videoRef = useRef<HTMLVideoElement>(null);
  const [vidReady, setVidReady] = useState<boolean>(false);

  const handleVideoReady = useCallback(() => {
    setVidReady(true);
  }, []);

  useEffect(() => {
    if (!vidReady) {
      return;
    }

    if (!videoRef.current) {
      return;
    }

    return startDetectLoop(videoRef.current);
  }, [vidReady]);

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
  onReady: () => void;
}

const Cam: React.FC<CamProps> = (props: CamProps) => {
  const { forwardRef, onReady } = props;

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => {
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

    navigator.mediaDevices
      .getUserMedia({
        video: {
          facingMode: "environment",
          aspectRatio: 1,
        },
      })
      .then(function (stream) {
        if (!forwardRef.current || !mounted) {
          return;
        }

        forwardRef.current.srcObject = stream;
      })
      .catch(function (error) {
        console.log("Something went wrong!", error);
      });

    return () => {
      console.log(`Closing Camera feed`);
      const tracks = (
        forwardRef.current?.srcObject as MediaStream
      )?.getTracks();
      tracks?.forEach((t) => t.stop());
    };
  }, [mounted]);

  return <S.Video onPlay={onReady} autoPlay={true} ref={forwardRef}></S.Video>;
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
