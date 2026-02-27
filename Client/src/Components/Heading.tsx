import styled from "@emotion/styled";
import * as React from "react";

export interface HeadingProps {
  text?: string;
  children?: React.ReactNode;
  className?: string;
  color?: string;
}

export const Heading: React.FC<HeadingProps> = (props: HeadingProps) => {
  const { text, children, className, color } = props;

  return (
    <S.HeadingEl className={className} color={color}>
      {text ?? children}
    </S.HeadingEl>
  );
};

namespace S {
  export const HeadingEl = styled("div")`
    color: ${(p) => p.color ?? p.theme.colors.text};
    margin: 0;
    font-size: 32px;
  `;
}
