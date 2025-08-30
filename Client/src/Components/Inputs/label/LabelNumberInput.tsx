import * as React from "react";
import { Label } from "../../Label";
import { NumberInput, NumberInputProps } from "../NumberInput";
import { InputContainer } from "./InputContainer";

export interface LabelNumberInputProps extends NumberInputProps {
  label: string;
  labelClassName?: string;
}

export const LabelNumberInput: React.FC<LabelNumberInputProps> = (
  props: LabelNumberInputProps
) => {
  const { label, color, labelClassName, forwardRef, ...rest } = props;

  return (
    <InputContainer>
      <Label className={labelClassName} color={color}>
        {label}
      </Label>
      <NumberInput forwardRef={forwardRef} color={color} {...rest} />
    </InputContainer>
  );
};
