import styled from "@emotion/styled";
import * as React from "react";
import { DefaultColors } from "../Tools/Toolbox";

export interface HeadingProps {
  text?: string;
  children?: React.ReactNode;
}

export const Heading: React.FC<HeadingProps> = (props: HeadingProps) => {
  const { text, children } = props;

  return <S.HeadingEl>{text ?? children}</S.HeadingEl>;
};

namespace S {
  export const HeadingEl = styled("div")`
    color: ${(p) => p.color ?? DefaultColors.Text_Color};
    margin: 0;
    font-size: 32px;
  `;
}
