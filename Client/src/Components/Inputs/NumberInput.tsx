import styled from "@emotion/styled";
import * as React from "react";
import { BaseInputProps, Input } from "./BaseInput";

export interface NumberInputProps extends BaseInputProps {
  forwardRef?: React.RefObject<HTMLInputElement>;
}

export const NumberInput: React.FC<NumberInputProps> = (
  props: NumberInputProps
) => {
  const { forwardRef, ...rest } = props;

  return <S.NumberInput type="number" {...rest} forwardRef={forwardRef} />;
};

namespace S {
  export const NumberInput = styled(Input)`
    ::-webkit-outer-spin-button,
    ::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
  `;
}
