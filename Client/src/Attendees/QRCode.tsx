import styled from "@emotion/styled";
import React from "react";

export interface QRCodeProps {
  qrCodeUrl: string;
}

export const QRCode: React.FC<QRCodeProps> = (props: QRCodeProps) => {
  const { qrCodeUrl } = props;

  if (!qrCodeUrl || qrCodeUrl == "") {
    return null;
  }

  return (
    <S.QRCodeEl>
      <S.StyledImage src={qrCodeUrl} />
    </S.QRCodeEl>
  );
};

namespace S {
  export const QRCodeEl = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    width: ${250}px;
    height: ${250}px;
    border-radius: 10px;
    overflow: hidden;
  `;

  export const StyledImage = styled.img`
    width: ${250}px;
    height: ${250}px;
  `;
}
