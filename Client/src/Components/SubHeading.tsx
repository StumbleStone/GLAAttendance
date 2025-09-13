import styled from "@emotion/styled";
import * as React from "react";
import { HeadingProps } from "./Heading";

export interface SubHeadingProps extends HeadingProps {}

export const SubHeading: React.FC<SubHeadingProps> = (
  props: SubHeadingProps
) => {
  const { text, children, className } = props;

  return (
    <S.SubHeadingEl className={className}>{text ?? children}</S.SubHeadingEl>
  );
};

namespace S {
  export const SubHeadingEl = styled("div")`
    margin: 0;
    font-size: 24px;
  `;
}
