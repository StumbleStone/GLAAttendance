import styled from "@emotion/styled";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import React from "react";
import { Icon } from "../Icon";

export interface ChipProps {
  className?: string;
  title?: string;
  icon?: IconDefinition;
  iconSize?: number;
  label?: React.ReactNode;
  onClick?: (
    event: React.MouseEvent<HTMLButtonElement | HTMLSpanElement>,
  ) => void;
  ariaPressed?: boolean;
}

const ChipComponent: React.FC<ChipProps> = (props: ChipProps) => {
  const {
    className,
    title,
    icon,
    iconSize = 14,
    label,
    onClick,
    ariaPressed,
  } = props;

  const hasLead = !!icon || label !== undefined;
  const isClickable = !!onClick;

  const content = (
    <>
      {hasLead && (
        <ChipLeading>
          {!!icon && <Icon icon={icon} size={iconSize} />}
          {label !== undefined && <ChipLabel>{label}</ChipLabel>}
        </ChipLeading>
      )}
    </>
  );

  return (
    <S.ButtonRoot
      isClickable={isClickable}
      className={className}
      title={title}
      onClick={onClick}
      aria-pressed={ariaPressed}
    >
      {content}
    </S.ButtonRoot>
  );
};

export const Chip = React.memo(ChipComponent);
Chip.displayName = "Chip";

namespace S {
  interface RootStyleProps {
    isClickable: boolean;
  }

  export const ButtonRoot = styled.div<RootStyleProps>`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    white-space: nowrap;
    padding: 3px 10px;
    font-size: 11px;
    line-height: 1;
    text-decoration: none;
    border-radius: ${(p) => p.theme.radius.pill};
    color: ${(p) => p.theme.colors.text};
    border: 1px solid ${(p) => p.theme.colors.border};
    background-color: ${(p) => p.theme.colors.surface};
    cursor: ${(p) => (p.isClickable ? "pointer" : "default")};
    text-align: left;
    appearance: none;

    :focus-visible {
      outline: 2px solid ${(p) => p.theme.colors.accent.primary};
      outline-offset: 2px;
    }
  `;
}

export const ChipLeading = styled("span")`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
`;

export const ChipLabel = styled("span")`
  font-weight: 700;
  white-space: nowrap;
`;
