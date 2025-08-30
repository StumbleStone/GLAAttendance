import styled from "@emotion/styled";
import { BaseInputProps, Input } from "./BaseInput";
import * as React from "react";

export interface PasswordInputProps extends BaseInputProps {
  forwardRef?: React.RefObject<HTMLInputElement>;
}

export const PasswordInput: React.FC<PasswordInputProps> = (
  props: PasswordInputProps
) => {
  const { forwardRef, ...rest } = props;

  return <S.PasswordInput type="password" {...rest} ref={forwardRef} />;
};

namespace S {
  export const PasswordInput = styled(Input)``;
}
