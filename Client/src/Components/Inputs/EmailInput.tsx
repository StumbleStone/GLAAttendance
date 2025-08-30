import styled from "@emotion/styled";
import { BaseInputProps, Input } from "./BaseInput";
import * as React from "react";

export interface EmailInputProps extends BaseInputProps {
  forwardRef?: React.RefObject<HTMLInputElement>;
}

export const EmailInput: React.FC<EmailInputProps> = (
  props: EmailInputProps
) => {
  const { forwardRef, ...rest } = props;

  return <S.EmailInput type="email" {...rest} ref={forwardRef} />;
};

namespace S {
  export const EmailInput = styled(Input)``;
}
