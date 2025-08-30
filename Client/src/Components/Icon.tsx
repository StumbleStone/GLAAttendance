import styled from "@emotion/styled";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";

export interface IconProps {
  icon: IconDefinition;
  size: number;
  color?: string | null;
  className?: string;
}

export const Icon: React.FC<IconProps> = (props: IconProps) => {
  const { icon, size, color, className } = props;

  return (
    <S.StyledFontAwesomeIcon
      icon={icon}
      width={size}
      height={size}
      csize={size}
      color={color!}
      className={className}
    />
  );
};

namespace S {
  export const StyledFontAwesomeIcon = styled(FontAwesomeIcon)<{
    csize: number;
  }>`
    width: ${(p) => p.csize}px;
    height: ${(p) => p.csize}px;
  `;
}
