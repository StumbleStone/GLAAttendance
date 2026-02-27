import styled from "@emotion/styled";
import * as React from "react";

export interface TileProps {
  children?: React.ReactNode;
  className?: string;
  forwardRef?: React.RefObject<HTMLDivElement>;
  onClick?: (event: React.MouseEvent) => void;
}

export const Tile: React.FC<TileProps> = (props: TileProps) => {
  const { children, className, onClick, forwardRef } = props;

  return (
    <S.TileEl onClick={onClick} className={className} ref={forwardRef}>
      {children}
    </S.TileEl>
  );
};

namespace S {
  export const TileEl = styled("div")`
    color: ${(p) => p.theme.colors.text};
    font-family: ${(p) => p.theme.font.body};
    border-radius: ${(p) => p.theme.radius.md};
    border: 2px solid ${(p) => p.theme.colors.border};
    background-color: ${(p) => p.theme.colors.surface};
    padding: 8px 16px;
    box-shadow: ${(p) => p.theme.shadow.tile};
  `;
}
