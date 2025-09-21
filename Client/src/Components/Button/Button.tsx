import styled from "@emotion/styled";
import { IconDefinition } from "@fortawesome/free-solid-svg-icons";
import React, { HTMLAttributes, useCallback, useMemo } from "react";
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

  const resolvedColor = useMemo(() => {
    return disabled ? DefaultColors.Grey : color || DefaultColors.BrightCyan;
  }, [color, disabled]);

  return (
    <ButtonDiv
      className={className}
      onClick={handleClick}
      color={resolvedColor}
      disabled={disabled}
      {...rest}
    >
      {icon && <Icon icon={icon} size={20} color={resolvedColor} />}
      {label ?? children}
    </ButtonDiv>
  );
};

const ButtonDiv = styled("div")<{ color?: string; disabled?: boolean }>`
  border: 2px solid ${DefaultColors.OffWhite};
  padding: 4px 16px;
  border-radius: 25px;
  background-color: ${DefaultColors.Container};

  :hover {
    background-color: ${(p) => (p.disabled ? null : `${p.color}22`)};
    box-shadow: ${(p) => (p.disabled ? "none" : `0px 0px 5px 0px ${p.color}`)};
  }

  display: flex;
  gap: 10px;
  align-items: center;

  cursor: ${(p) => (p.disabled ? "not-allowed" : "pointer")};
  user-select: none;

  color: ${(p) => p.color};
  border-color: ${(p) => p.color};

  :active {
    background-color: ${DefaultColors.Container_Active};
  }
`;

export const ButtonContainer = styled("div")`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  user-select: none;
  gap: 10px;
  cursor: pointer;
`;
