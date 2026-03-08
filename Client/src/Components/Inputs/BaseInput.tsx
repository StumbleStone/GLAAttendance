import styled from "@emotion/styled";
import * as React from "react";

export interface BaseInputCustomProps {
  forwardRef?: React.RefObject<HTMLInputElement>;
  color?: string;
  fontSize?: number;
  padLeft?: number | null;
  padRight?: number | null;
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
    box-sizing: border-box;
    width: 100%;
    min-height: 48px;
    font-size: ${(p) => p.fontSize ?? 18}px;
    font-family: inherit;
    line-height: 1.2;
    color-scheme: ${(p) => p.theme.mode};
    background-color: ${(p) =>
      p.isDisabled
        ? p.theme.colors.surfaceActive
        : p.theme.colors.input.background};
    cursor: ${(p) => (p.isDisabled ? "not-allowed" : "text")};

    padding: 8px 16px;
    padding-left: ${(p) => (p.padLeft ? `${p.padLeft}px` : null)};
    padding-right: ${(p) => (p.padRight ? `${p.padRight}px` : null)};
    color: ${(p) =>
      p.isDisabled
        ? p.theme.colors.textMuted
        : p.color || p.theme.colors.input.foreground};
    caret-color: ${(p) => p.color || p.theme.colors.input.foreground};

    border: 1px solid
      ${(p) =>
        p.isDisabled ? p.theme.colors.border : p.theme.colors.input.border};
    border-radius: ${(p) => p.theme.radius.lg};
    box-shadow: inset 0 1px 0 ${(p) => p.theme.colors.borderSubtle};
    transition:
      background-color 120ms ease,
      border-color 120ms ease,
      box-shadow 120ms ease,
      color 120ms ease;

    :-webkit-autofill::first-line,
    :-webkit-autofill,
    :-webkit-autofill:hover,
    :-webkit-autofill:focus {
      font-size: ${(p) => p.fontSize ?? 18}px;
      background-color: ${(p) => p.theme.colors.input.background} !important;
      -webkit-text-fill-color: ${(p) => p.theme.colors.input.foreground};
      -webkit-box-shadow: 0 0 0px 1000px ${(p) => p.theme.colors.input.background}
        inset;
    }

    ::placeholder {
      color: ${(p) => p.theme.colors.textMuted};
      opacity: 1;
    }

    :hover {
      border-color: ${(p) =>
        p.isDisabled ? p.theme.colors.border : p.theme.colors.textMuted};
    }

    :focus,
    :focus-visible {
      outline: none;
      border-color: ${(p) => p.theme.colors.input.focus};
      box-shadow:
        inset 0 1px 0 ${(p) => p.theme.colors.borderSubtle},
        0 0 0 2px ${(p) => p.theme.colors.input.focus};
    }
  `;
}
