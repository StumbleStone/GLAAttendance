import { useTheme } from "@emotion/react";
import styled from "@emotion/styled";
import { faCalendarDays } from "@fortawesome/free-solid-svg-icons";
import * as React from "react";
import { Icon } from "../Icon";
import { BaseInputProps, Input } from "./BaseInput";

export interface DateInputProps extends BaseInputProps {
  forwardRef?: React.RefObject<HTMLInputElement>;
  className?: string;
  type?: "date" | "datetime-local";
}

export const DateInput: React.FC<DateInputProps> = (props: DateInputProps) => {
  const theme = useTheme();
  const {
    className,
    color,
    fontSize,
    forwardRef,
    disabled = false,
    hasError = false,
    type = "date",
    ...rest
  } = props;
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!forwardRef) {
      return;
    }

    (forwardRef as React.MutableRefObject<HTMLInputElement | null>).current =
      inputRef.current;
  }, [forwardRef]);

  const handleOpenPicker = React.useCallback(
    (ev: React.MouseEvent) => {
      ev.preventDefault();

      if (disabled) {
        return;
      }

      const input: HTMLInputElement | null = inputRef.current;
      if (!input) {
        return;
      }

      input.focus();

      const pickerInput = input as HTMLInputElement & {
        showPicker?: () => void;
      };

      if (typeof pickerInput.showPicker === "function") {
        pickerInput.showPicker();
        return;
      }

      input.click();
    },
    [disabled],
  );

  return (
    <S.InputContainer className={className}>
      <S.HiddenPickerInput
        {...rest}
        type={type}
        forwardRef={inputRef}
        color={color}
        fontSize={fontSize}
        disabled={disabled}
        hasError={hasError}
        padRight={40 + (fontSize || 18)}
      />
      <S.PickerIcon
        icon={faCalendarDays}
        size={fontSize || 18}
        onClick={handleOpenPicker}
        color={
          disabled
            ? theme.colors.textMuted
            : hasError
              ? theme.colors.accent.danger
              : color || theme.colors.input.foreground
        }
        isDisabled={disabled}
      />
    </S.InputContainer>
  );
};

namespace S {
  export const InputContainer = styled.div`
    position: relative;
    width: 100%;
    display: flex;
    align-items: center;
  `;

  export const HiddenPickerInput = styled(Input)`
    &[type="date"]::-webkit-calendar-picker-indicator,
    &[type="datetime-local"]::-webkit-calendar-picker-indicator {
      opacity: 0;
      pointer-events: none;
      width: 0;
      height: 0;
      margin: 0;
    }
  `;

  export const PickerIcon = styled(Icon)<{ isDisabled?: boolean }>`
    position: absolute;
    right: 12px;
    cursor: ${(p) => (p.isDisabled ? "not-allowed" : "pointer")};
    opacity: ${(p) => (p.isDisabled ? 0.55 : 0.92)};
  `;
}
