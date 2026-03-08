import * as React from "react";
import { Label } from "../../Label";
import { DateInput, DateInputProps } from "../DateInput";
import { InputContainer } from "./InputContainer";

export interface LabelDateInputProps extends DateInputProps {
  label: string;
  labelClassName?: string;
  forwardRef?: React.RefObject<HTMLInputElement>;
  className?: string;
}

export const LabelDateInput: React.FC<LabelDateInputProps> = (
  props: LabelDateInputProps,
) => {
  const { label, color, className, labelClassName, forwardRef, ...rest } =
    props;

  return (
    <InputContainer className={className}>
      <Label className={labelClassName} color={color}>
        {label}
      </Label>
      <DateInput forwardRef={forwardRef} color={color} {...rest} />
    </InputContainer>
  );
};
