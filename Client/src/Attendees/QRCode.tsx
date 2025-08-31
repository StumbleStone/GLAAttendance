import styled from "@emotion/styled";
import * as qrcode from "qrcode";
import React, { useEffect, useRef, useState } from "react";

export interface QRCodeProps {
  dataString: string;
}

const QR_SIZE: number = 250;

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

export const QRCode: React.FC<QRCodeProps> = (props: QRCodeProps) => {
  const { dataString } = props;

  const [qrCode, setQRCode] = useState<HTMLCanvasElement | null>(null);
  const canvRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    generateQRCode(dataString).then((res) => {
      if (res == null) {
        return;
      }

      setQRCode(res);
    });
  }, [setQRCode, dataString]);

  useEffect(() => {
    requestAnimationFrame(() => {
      const el = canvRef.current;
      if (!qrCode || !el) {
        return;
      }

      el.width = QR_SIZE;
      el.height = QR_SIZE;

      const ctx: CanvasRenderingContext2D = el.getContext("2d")!;
      ctx.font = "24px monospace";

      const len = ctx.measureText(dataString)?.width || 0;
      ctx.drawImage(qrCode, 0, 0, QR_SIZE, QR_SIZE);
      ctx.fillText(dataString, QR_SIZE / 2 - len / 2, 24);
    });
  }, [qrCode]);

  return (
    <S.QRCodeEl>
      <S.StyledCanvas ref={canvRef} />
    </S.QRCodeEl>
  );
};

namespace S {
  export const QRCodeEl = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    width: ${QR_SIZE}px;
    height: ${QR_SIZE}px;
    border-radius: 10px;
    overflow: hidden;
  `;

  export const StyledCanvas = styled.canvas`
    width: ${QR_SIZE}px;
    height: ${QR_SIZE}px;
  `;
}
