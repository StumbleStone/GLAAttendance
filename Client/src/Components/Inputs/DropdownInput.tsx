import styled from "@emotion/styled";
import { BaseInputProps, Input } from "./BaseInput";
import * as React from "react";
import { DefaultColors } from "../../Tools/Toolbox";

export interface DropdownOption {
  key: string | number;
  label: string;
}

export interface DropdownInputProps
  extends React.InputHTMLAttributes<HTMLSelectElement> {
  forwardRef?: React.RefObject<HTMLSelectElement>;
  options: DropdownOption[];
}

export const DropdownInput: React.FC<DropdownInputProps> = (
  props: DropdownInputProps
) => {
  const { options, forwardRef, ...rest } = props;

  return (
    <S.DropdownInput {...rest} ref={forwardRef}>
      {options.map((opt) => (
        <option key={opt.key} value={opt.key}>
          {opt.label}
        </option>
      ))}
    </S.DropdownInput>
  );
};

namespace S {
  export const DropdownInput = styled("select")`
    font-size: 18px;
    background-color: ${DefaultColors.OffWhite};

    padding: 5px 10px;
    color: ${DefaultColors.Container};

    border: 2px solid ${DefaultColors.Black};
    border-radius: 15px;

    width: 100%;
  `;
}
