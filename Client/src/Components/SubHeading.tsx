import styled from "@emotion/styled";
import * as React from "react";
import { HeadingProps } from "./Heading";

export interface SubHeadingProps extends HeadingProps {}

export const SubHeading: React.FC<SubHeadingProps> = (
  props: SubHeadingProps
) => {
  const { text, children } = props;

  return <S.SubHeadingEl>{text ?? children}</S.SubHeadingEl>;
};

namespace S {
  export const SubHeadingEl = styled("div")`
    margin: 0;
    margin-bottom: 10px;
    font-size: 24px;
  `;
}
