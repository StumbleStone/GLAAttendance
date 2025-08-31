import styled from "@emotion/styled";
import { IconDefinition } from "@fortawesome/free-solid-svg-icons";
import React, { HTMLAttributes, useCallback } from "react";
import { DefaultColors } from "../../Tools/Toolbox";
import { Icon } from "../Icon";

export interface ButtonProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onClick"> {
  className?: string;
  disabled?: boolean;
  color?: string;
  label?: string;
  icon?: IconDefinition;
  onClick: () => any;
}

export const Button: React.FC<ButtonProps> = (props) => {
  const {
    className,
    disabled,
    onClick,
    icon,
    label,
    children,
    color,
    ...rest
  } = props;

  const handleClick = useCallback(() => {
    if (disabled) {
      return;
    }

    onClick();
  }, [onClick, disabled]);

  return (
    <ButtonDiv
      className={className}
      onClick={handleClick}
      color={color}
      disabled={disabled}
      {...rest}
    >
      {icon && <Icon icon={icon} size={20} color={color} />}
      {label ?? children}
    </ButtonDiv>
  );
};

const ButtonDiv = styled("div")<{ color?: string; disabled?: boolean }>`
  border: 2px solid ${DefaultColors.OffWhite};
  padding: 4px 16px;
  border-radius: 25px;
  background-color: ${DefaultColors.Container};

  display: flex;
  gap: 10px;

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
