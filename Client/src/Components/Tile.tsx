import styled from "@emotion/styled";
import * as React from "react";
import { DefaultColors } from "../Tools/Toolbox";

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
    color: whitesmoke;
    font-family: monospace;
    border-radius: 15px;
    border: 2px solid ${DefaultColors.Background};
    background-color: ${DefaultColors.Container};
    padding: 8px 16px;
    box-shadow: 0px 5px 10px 5px ${DefaultColors.Container};
  `;
}
