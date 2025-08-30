import styled from "@emotion/styled";
import { DefaultColors } from "../../Tools/Toolbox";

export interface BaseInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = styled("input")`
  font-size: 18px;
  background-color: ${DefaultColors.OffWhite};

  padding: 6px 16px;
  color: ${DefaultColors.Container};

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
