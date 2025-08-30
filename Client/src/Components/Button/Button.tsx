import styled from "@emotion/styled";
import React, { HTMLAttributes, useCallback } from "react";
import { DefaultColors } from "../../Tools/Toolbox";

export interface ButtonProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onClick"> {
  className?: string;
  disabled?: boolean;
  color?: string;
  onClick: () => any;
}

export const Button: React.FC<ButtonProps> = (props) => {
  const { className, disabled, color, onClick, ...rest } = props;

  const handleClick = useCallback(() => {
    if (disabled) {
      return;
    }

    onClick();
  }, [onClick, disabled]);

  return <ButtonDiv className={className} onClick={handleClick} {...rest} />;
};

const ButtonDiv = styled("div")<{ color?: string; disabled?: boolean }>`
  border: 2px solid ${DefaultColors.OffWhite};
  padding: 4px 16px;
  border-radius: 25px;
  background-color: ${DefaultColors.Container};

  cursor: pointer;
  user-select: none;

  color: ${(p) =>
    p.disabled
      ? DefaultColors.BrightGrey
      : p.color ?? DefaultColors.BrightBlue};
  border-color: ${(p) =>
    p.disabled
      ? DefaultColors.BrightGrey
      : p.color ?? DefaultColors.BrightBlue};

  :active {
    background-color: ${DefaultColors.Container_Active};
  }
`;

export const ButtonContainer = styled("div")`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  width: 100%;
  user-select: none;
  gap: 10px;
  cursor: pointer;
`;
