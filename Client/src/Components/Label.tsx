import styled from "@emotion/styled";
import * as React from "react";
import { DefaultColors } from "../Tools/Toolbox";

export interface LabelProps {
  text?: string;
  children?: React.ReactNode;
  className?: string;
  color?: string;
}

export const Label: React.FC<LabelProps> = (props: LabelProps) => {
  const { text, children, className, color } = props;

  return (
    <S.LabelEl color={color} className={className}>
      {text ?? children}
    </S.LabelEl>
  );
};

namespace S {
  export const LabelEl = styled("div")<{ color?: string }>`
    color: ${(p) => p.color ?? DefaultColors.Text_Color};
    margin: 0;
    white-space: nowrap;
  `;
}
