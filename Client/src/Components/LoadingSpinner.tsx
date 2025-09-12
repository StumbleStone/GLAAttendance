import { keyframes } from "@emotion/react";
import styled from "@emotion/styled";
import React from "react";
import { DefaultColors } from "../Tools/Toolbox";

export interface LoadingSpinnerProps {
  size: number;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = (
  props: LoadingSpinnerProps
) => {
  const { size } = props;
  return (
    <S.SpinnerContainer>
      <S.Spinner size={size || 100} />
    </S.SpinnerContainer>
  );
};

namespace S {
  export const SpinnerContainer = styled("div")`
    label: SpinnerContainer;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
  `;

  const anim_spin = keyframes`
  0% {
    transform: rotate(0);
  }
  50% {
    transform: rotate(180deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

  export const Spinner = styled("div")<{ size: number }>`
    label: Spinner;
    border-top: 10px solid ${DefaultColors.OffWhite};
    border-bottom: 10px solid ${DefaultColors.OffWhite};
    border-left: 10px solid transparent;
    border-right: 10px solid transparent;
    width: ${(p) => p.size}px;
    height: ${(p) => p.size}px;
    border-radius: 50%;
    animation: ${anim_spin} linear infinite 1s;
  `;
}
