import { useTheme } from "@emotion/react";
import styled from "@emotion/styled";
import { faBusSimple, faCar } from "@fortawesome/free-solid-svg-icons";
import React from "react";
import { Icon } from "../Components/Icon";
import { SortColumnSize } from "./Shared";

export interface TransportChipProps {
  usingOwnTransport: boolean;
  size: SortColumnSize;
}

export const TransportChip: React.FC<TransportChipProps> = (
  props: TransportChipProps,
) => {
  const theme = useTheme();
  const { usingOwnTransport, size } = props;

  const color = usingOwnTransport
    ? theme.colors.accent.transportCar
    : theme.colors.accent.transportBus;

  return (
    <S.TransportChip
      color={color}
      compact={size <= SortColumnSize.COMPACTER}
      title={usingOwnTransport ? "Car" : "Bus"}
    >
      <Icon
        size={size <= SortColumnSize.COMPACT ? 12 : 14}
        color={color}
        icon={usingOwnTransport ? faCar : faBusSimple}
      />
      {size > SortColumnSize.COMPACTER && (
        <S.TransportChipLabel color={color}>
          {usingOwnTransport ? "Car" : "Bus"}
        </S.TransportChipLabel>
      )}
    </S.TransportChip>
  );
};

namespace S {
  export const TransportChip = styled.span<{ color: string; compact: boolean }>`
    display: inline-flex;
    align-items: center;
    gap: ${(p) => (p.compact ? "0px" : "4px")};
    white-space: nowrap;
    border-radius: ${(p) => p.theme.radius.pill};
    border: 1px solid ${(p) => `${p.color}55`};
    background-color: ${(p) => `${p.color}14`};
    padding: ${(p) => (p.compact ? "2px 6px" : "2px 8px")};
    font-size: ${(p) => (p.compact ? "9px" : "10px")};
    line-height: 1;
    color: ${(p) => p.color};
  `;

  export const TransportChipLabel = styled.span<{ color: string }>`
    color: ${(p) => p.color ?? p.theme.colors.text};
    font-weight: 700;
  `;
}
