import styled from "@emotion/styled";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { Backdrop } from "../Components/Backdrop/Backdrop";
import { Icon } from "../Components/Icon";
import { Tile } from "../Components/Tile";
import { EmoteData, QRScanner } from "../QRCode/QRScanner";
import { SupaBase } from "../SupaBase/SupaBase";
import { DefaultColors } from "../Tools/Toolbox";

export interface CaptureWindowProps {
  supabase: SupaBase;
  isCapturing: boolean;
}

function renderEmotes(emotes: EmoteData[]) {
  return emotes.map((em) => <EmoteIcon key={em.id} {...em} />);
}

export const CaptureWindow: React.FC<CaptureWindowProps> = (
  props: CaptureWindowProps
) => {
  const { supabase, isCapturing } = props;
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const emoteRef = useRef<HTMLDivElement>(null);
  const scanner = useMemo(() => new QRScanner(supabase), []);
  const [, forceUpdate] = React.useReducer((x) => x + 1, 0);

  useEffect(() => {
    if (!videoRef.current || !overlayRef.current || !isCapturing) {
      return;
    }

    const dereg = scanner.addListener({
      emote_added: forceUpdate,
      emote_removed: forceUpdate,
      emote_updated: forceUpdate,
    });

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
        <S.Emote ref={emoteRef}>{renderEmotes(scanner.emotesArr)}</S.Emote>
      </S.CaptureWindowEl>
    </S.Container>
  );
};

const EmoteIcon: React.FC<EmoteData> = (props: EmoteData) => {
  const { color, icon, size, x, y, deg } = props;

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) {
      return;
    }

    el.style.top = `${y}px`;
    el.style.left = `${x}px`;
  }, [x, y]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) {
      return;
    }

    el.style.transform = `rotateZ(${deg}deg) translate(-50%, -50%)`;
  }, [deg]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) {
      return;
    }

    el.style.width = `${size}px`;
    el.style.height = `${size}px`;
  }, [size]);

  const startX = useMemo(() => x, []);
  const startY = useMemo(() => y, []);

  return (
    <S.IconContainer ref={containerRef} startX={startX} startY={startY}>
      <S.StyledIcon icon={icon} size={size} color={color} />
    </S.IconContainer>
  );
};

namespace S {
  export const Container = styled.div`
    display: flex;
    width: 100%;
    justify-content: center;
  `;

  export const StyledIcon = styled(Icon)``;

  export const IconContainer = styled.div<{ startX: number; startY: number }>`
    background-color: ${DefaultColors.Text_Color};
    border-radius: 8px;
    position: absolute;

    top: ${(p) => p.startY}px;
    left: ${(p) => p.startX}px;

    display: flex;
    justify-content: center;
    align-items: center;
    transform: translate(-50%, -50%);
    transform-origin: 0 0;

    transition: transform 0.25s linear, width 0.25s linear, height 0.25s linear,
      top 0.1s linear, left 0.1s linear;
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

  export const Emote = styled.div`
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
  `;
}
