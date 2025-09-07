import styled from "@emotion/styled";
import { faBarcode } from "@fortawesome/free-solid-svg-icons";
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

    return `Capture${!isSupported ? " (Unsupported)" : ""}`;
  }, [isCapturing, isSupported]);

  return (
    <S.CaptureButton
      disabled={!isSupported}
      onClick={handleClick}
      color={DefaultColors.BrightCyan}
      icon={faBarcode}
    >
      {message}
    </S.CaptureButton>
  );
};

namespace S {
  export const CaptureButton = styled(Button)`
    font-family: monospace;
    font-size: 22px;
    width: auto;
    align-items: center;
  `;
}
