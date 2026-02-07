import styled from "@emotion/styled";
import { faQrcode } from "@fortawesome/free-solid-svg-icons";
import QrScanner from "qr-scanner";
import React, { useEffect, useMemo, useState } from "react";
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
  const [supported, setSupported] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const hasCam = await QrScanner.hasCamera();
      console.log(`QR Scan Support: ${hasCam}`);
      if (mounted) {
        setSupported(() => hasCam);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const message = useMemo(() => {
    if (isCapturing) {
      return `Stop`;
    }

    return `Capture`;
  }, [isCapturing, supported]);

  return (
    <S.CaptureButton
      disabled={!supported}
      onClick={handleClick}
      color={DefaultColors.BrightCyan}
      icon={faQrcode}
    >
      {message}
    </S.CaptureButton>
  );
};

namespace S {
  export const CaptureButton = styled(Button)`
    font-family: monospace;
    font-size: 22px;
  `;
}
