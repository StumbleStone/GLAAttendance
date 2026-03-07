import * as React from "react";
import { Label } from "../../Label";
import { BaseInputProps, Input } from "../BaseInput";
import { InputContainer } from "./InputContainer";

export interface LabelTextInputProps extends BaseInputProps {
  label: string;
  labelClassName?: string;
  forwardRef?: React.RefObject<HTMLInputElement>;
  className?: string;
}

export const LabelTextInput: React.FC<LabelTextInputProps> = (
  props: LabelTextInputProps,
) => {
  const { label, color, className, labelClassName, forwardRef, ...rest } =
    props;

  return (
    <InputContainer className={className}>
      <Label className={labelClassName} color={color}>
        {label}
      </Label>
      <Input forwardRef={forwardRef} color={color} {...rest} />
    </InputContainer>
  );
};
