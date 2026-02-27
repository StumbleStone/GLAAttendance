import styled from "@emotion/styled";
import * as React from "react";

export interface LabelProps {
  text?: string;
  children?: React.ReactNode;
  className?: string;
  color?: string | null;
}

export const Label: React.FC<LabelProps> = (props: LabelProps) => {
  const { text, children, className, color = null } = props;

  return (
    <S.LabelEl tColor={color} className={className}>
      {text ?? children}
    </S.LabelEl>
  );
};

namespace S {
  export const LabelEl = styled("div")<{ tColor: string | null }>`
    color: ${(p) => p.tColor ?? p.theme.colors.text};
    margin: 0;
    white-space: nowrap;
  `;
}
