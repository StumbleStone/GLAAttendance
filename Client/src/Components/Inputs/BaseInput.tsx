import styled from "@emotion/styled";
import * as React from "react";

export interface BaseInputCustomProps {
  forwardRef?: React.RefObject<HTMLInputElement>;
  color?: string;
  fontSize?: number;
  padLeft?: number | null;
  disabled?: boolean;
}

export type BaseInputProps = React.InputHTMLAttributes<HTMLInputElement> &
  BaseInputCustomProps;

export const Input: React.FC<BaseInputProps> = (props: BaseInputProps) => {
  const { onChange, forwardRef, disabled = false, ...rest } = props;

  const handleChange = React.useCallback(
    (ev: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled || !onChange) {
        return;
      }

      onChange(ev);
    },
    [onChange, disabled]
  );

  return (
    <S.StyledInput
      {...rest}
      ref={forwardRef}
      onChange={handleChange}
      disabled={disabled}
      // Just in case it messes with the native disabled field?
      isDisabled={disabled}
    />
  );
};

namespace S {
  export const StyledInput = styled("input")<
    BaseInputCustomProps & { isDisabled?: boolean }
  >`
    font-size: ${(p) => p.fontSize ?? 18}px;
    background-color: ${(p) => (p.isDisabled ? null : p.theme.colors.input.background)};
    cursor: ${(p) => (p.isDisabled ? "not-allowed" : null)};

    padding: 6px 16px;
    padding-left: ${(p) => (p.padLeft ? `${p.padLeft}px` : null)};
    color: ${(p) => p.color || p.theme.colors.input.foreground};

    border: 2px solid ${(p) => p.theme.colors.input.border};
    border-radius: ${(p) => p.theme.radius.lg};

    width: 100%;

    :-webkit-autofill::first-line,
    :-webkit-autofill,
    :-webkit-autofill:hover,
    :-webkit-autofill:focus {
      font-size: 18px;
      background-color: ${(p) => p.theme.colors.input.background} !important;
      -webkit-text-fill-color: ${(p) => p.theme.colors.input.foreground};
      -webkit-box-shadow: 0 0 0px 1000px ${(p) => p.theme.colors.input.background}
        inset;
    }

    :focus {
      outline: 2px solid ${(p) => p.theme.colors.input.focus};
    }
  `;
}
