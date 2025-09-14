import styled from "@emotion/styled";
import * as React from "react";
import { HeadingProps } from "./Heading";

export interface SubHeadingProps extends HeadingProps {
  tColor?: string;
}

export const SubHeading: React.FC<SubHeadingProps> = (
  props: SubHeadingProps
) => {
  const { text, children, className, tColor } = props;

  return (
    <S.SubHeadingEl tColor={tColor} className={className}>
      {text ?? children}
    </S.SubHeadingEl>
  );
};

namespace S {
  export const SubHeadingEl = styled("div")<{ tColor?: string }>`
    color: ${(p) => p.tColor};
    margin: 0;
    font-size: 24px;
  `;
}
