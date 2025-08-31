import styled from "@emotion/styled";
import { faCameraAlt } from "@fortawesome/free-solid-svg-icons";
import React, { useMemo } from "react";
import { Button } from "../Components/Button/Button";
import { DefaultColors } from "../Tools/Toolbox";

export interface CaptureButtonProps {
  handleClick: () => void;
  isCapturing: boolean;
}

export const CaptureButton: React.FC<CaptureButtonProps> = (
  props: CaptureButtonProps
) => {
  const { handleClick, isCapturing } = props;

  const isSupported: boolean = useMemo(() => {
    return "BarcodeDetector" in globalThis;
  }, []);

  const message = useMemo(() => {
    if (isCapturing) {
      return `Stop Capture`;
    }

    return `Capture${!isSupported ? " (Not supported)" : ""}`;
  }, [isCapturing, isSupported]);

  return (
    <S.CaptureButton
      disabled={!isSupported}
      onClick={handleClick}
      color={DefaultColors.BrightCyan}
      icon={faCameraAlt}
    >
      {message}
    </S.CaptureButton>
  );
};

namespace S {
  export const CaptureButton = styled(Button)`
    font-family: monospace;
    border-radius: 5px;
    width: auto;
  `;
}
