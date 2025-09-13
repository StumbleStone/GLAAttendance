import styled from "@emotion/styled";
import * as React from "react";
import { InputWithIcon, InputWithIconProps } from "./InputWithIcon";

export interface PasswordInputProps extends InputWithIconProps {
  forwardRef?: React.RefObject<HTMLInputElement>;
}

export const PasswordInput: React.FC<PasswordInputProps> = (
  props: PasswordInputProps
) => {
  const { forwardRef, ...rest } = props;

  return <S.PasswordInput type="password" {...rest} forwardRef={forwardRef} />;
};

namespace S {
  export const PasswordInput = styled(InputWithIcon)``;
}
