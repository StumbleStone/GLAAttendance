import styled from "@emotion/styled";
import * as React from "react";
import { DefaultColors } from "../../Tools/Toolbox";

export interface BaseInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = styled("input")<{
  color?: string;
  fontSize?: number;
  padLeft?: number | null;
}>`
  font-size: ${(p) => p.fontSize ?? 18}px;
  background-color: ${DefaultColors.OffWhite};

  padding: 6px 16px;
  padding-left: ${(p) => (p.padLeft ? `${p.padLeft}px` : null)};
  color: ${(p) => p.color || DefaultColors.Container};

  border: 2px solid ${DefaultColors.Black};
  border-radius: 20px;

  width: 100%;

  :-webkit-autofill::first-line,
  :-webkit-autofill,
  :-webkit-autofill:hover,
  :-webkit-autofill:focus {
    font-size: 18px;
    background-color: ${DefaultColors.OffWhite} !important;
    -webkit-text-fill-color: ${DefaultColors.Container};
    -webkit-box-shadow: 0 0 0px 1000px ${DefaultColors.OffWhite} inset;
  }

  :focus {
    outline: 2px solid ${DefaultColors.BrightYellow};
  }
`;
