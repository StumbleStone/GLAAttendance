import styled from "@emotion/styled";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { Backdrop } from "../Components/Backdrop/Backdrop";
import { Tile } from "../Components/Tile";
import { QRScanner } from "../QRCode/QRScanner";
import { SupaBase } from "../SupaBase/SupaBase";

export interface CaptureWindowProps {
  supabase: SupaBase;
  isCapturing: boolean;
}

export const CaptureWindow: React.FC<CaptureWindowProps> = (
  props: CaptureWindowProps
) => {
  const { supabase, isCapturing } = props;
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scanner = useMemo(() => new QRScanner(supabase), []);

  useEffect(() => {
    if (!videoRef.current || !overlayRef.current || !isCapturing) {
      return;
    }

    const dereg = scanner.addListener({});

    scanner.init(videoRef.current, overlayRef.current);

    return () => {
      scanner.dispose();
      dereg();
    };
  }, [isCapturing]);

  // Fix video size since we can't change camera size
  const onReady = useCallback(() => {
    const vid = videoRef.current;
    const con = containerRef.current;
    if (!con || !vid) {
      return;
    }

    const conSize = con.getBoundingClientRect();
    if (vid.videoWidth > vid.videoHeight) {
      vid.height = Math.floor(conSize.height);
    } else {
      vid.width = Math.floor(conSize.width);
    }
  }, []);

  if (!isCapturing) {
    return null;
  }

  return (
    <S.Container>
      <S.CaptureWindowEl forwardRef={containerRef}>
        <S.Video
          onPlay={onReady}
          onResize={onReady}
          autoPlay={true}
          ref={videoRef}
          playsInline
        ></S.Video>
        <S.Overlay ref={overlayRef} />
      </S.CaptureWindowEl>
    </S.Container>
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
    position: relative;
    justify-content: center;
    align-items: center;
  `;

  export const StyledBackdrop = styled(Backdrop)`
    display: flex;
    justify-content: center;
    align-items: center;
  `;

  export const Video = styled.video`
    /* max-height: 100%;
    max-width: 100%;
    aspect-ratio: 1; */
  `;

  export const Overlay = styled.div``;
}
