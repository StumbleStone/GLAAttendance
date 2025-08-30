import * as React from "react";
import { Label } from "../../Label";
import { BaseInputProps, Input } from "../BaseInput";
import { InputContainer } from "./InputContainer";

export interface LabelTextInputProps extends BaseInputProps {
  label: string;
  labelClassName?: string;
  forwardRef?: React.RefObject<HTMLInputElement>;
}

export const LabelTextInput: React.FC<LabelTextInputProps> = (
  props: LabelTextInputProps
) => {
  const { label, color, labelClassName, forwardRef, ...rest } = props;

  return (
    <InputContainer>
      <Label className={labelClassName} color={color}>
        {label}
      </Label>
      <Input ref={forwardRef} color={color} {...rest} />
    </InputContainer>
  );
};
