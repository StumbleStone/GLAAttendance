import styled from "@emotion/styled";
import * as React from "react";
import { InputWithIcon, InputWithIconProps } from "./InputWithIcon";

export interface EmailInputProps extends InputWithIconProps {
  forwardRef?: React.RefObject<HTMLInputElement>;
}

export const EmailInput: React.FC<EmailInputProps> = (
  props: EmailInputProps
) => {
  const { forwardRef, ...rest } = props;

  return <S.EmailInput type="email" {...rest} forwardRef={forwardRef} />;
};

namespace S {
  export const EmailInput = styled(InputWithIcon)``;
}
