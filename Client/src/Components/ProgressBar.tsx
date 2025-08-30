import styled from "@emotion/styled";
import React from "react";
import { DefaultColors } from "../Tools/Toolbox";

export interface ProgressBarProps {
  value: number;
  max?: number;
  min?: number;
  width?: number;
  barHeight?: number;
  color?: string;
  animationSpeed?: number;
}

const DEFAULT_ANIMATION_SPEED = 500;

export const ProgressBar: React.FC<ProgressBarProps> = (
  props: ProgressBarProps
) => {
  const {
    value,
    max = 100,
    min = 0,
    width,
    barHeight = 10,
    color = DefaultColors.BrightBlue,
    animationSpeed,
  } = props;
  const perc = (((value || 0) - min) / (max - min)) * 100;

  return (
    <S.ProgressBarDiv width={width} barHeight={barHeight}>
      <S.Holder color={color} barHeight={barHeight}>
        <S.Bar
          perc={perc}
          color={color}
          barHeight={barHeight}
          animationSpeed={animationSpeed ?? DEFAULT_ANIMATION_SPEED}
        />
      </S.Holder>
    </S.ProgressBarDiv>
  );
};

namespace S {
  export const ProgressBarDiv = styled("div")<{
    width?: number;
    barHeight: number;
  }>`
    label: ProgressBarDiv;
    width: ${(props) => (props.width ? `${props.width}px` : "100%")};
    background-color: ${DefaultColors.OffWhite}44;
    border-radius: ${(p) => p.barHeight / 2}px;
  `;

  export const Holder = styled("div")<{ color: string; barHeight: number }>`
    label: Holder;
    width: 100%;
    overflow: hidden;
    position: relative;
    border-radius: ${(p) => p.barHeight / 2}px;
    border: 0px solid ${DefaultColors.TRANSPARENT};
    height: ${(p) => p.barHeight}px;
    display: flex;
    justify-content: center;
    align-items: center;
  `;
  export const Bar = styled("div")<{
    perc: number;
    color: string;
    barHeight: number;
    animationSpeed: number;
  }>`
    label: Bar;
    border-radius: ${(p) => p.barHeight / 2}px;
    height: 100%;
    width: 100%;
    background-color: ${(p) => p.color ?? DefaultColors.BrightBlue};
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    transform: translateX(${(p) => Math.max(Math.min(100, p.perc), 0) - 100}%);
    ${(p) => getBarAnimation(p.animationSpeed)}
  `;

  function getBarAnimation(animationSpeed: number) {
    if (animationSpeed === 0) {
      return "";
    }

    return `transition: transform ${animationSpeed}ms ease-in-out;`;
  }
}
