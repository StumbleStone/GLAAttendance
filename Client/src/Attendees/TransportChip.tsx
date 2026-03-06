import { useTheme } from "@emotion/react";
import styled from "@emotion/styled";
import { faBusSimple, faCar } from "@fortawesome/free-solid-svg-icons";
import React from "react";
import { Chip } from "../Components/Chip/Chip";
import { SortColumnSize } from "./Shared";

export interface TransportChipProps {
  usingOwnTransport: boolean;
  size?: SortColumnSize;
}

const TransportChipComponent: React.FC<TransportChipProps> = (
  props: TransportChipProps,
) => {
  const theme = useTheme();
  const { usingOwnTransport, size = SortColumnSize.NORMAL } = props;

  const color = usingOwnTransport
    ? theme.colors.accent.transportCar
    : theme.colors.accent.transportBus;

  return (
    <S.TransportChip
      tone={color}
      compact={size <= SortColumnSize.COMPACTER}
      title={usingOwnTransport ? "Car" : "Bus"}
      icon={usingOwnTransport ? faCar : faBusSimple}
      iconSize={size <= SortColumnSize.COMPACT ? 12 : 14}
      label={
        size > SortColumnSize.COMPACTER
          ? usingOwnTransport
            ? "Car"
            : "Bus"
          : undefined
      }
    />
  );
};

export const TransportChip = React.memo(TransportChipComponent);
TransportChip.displayName = "TransportChip";

namespace S {
  export const TransportChip = styled(Chip)<{
    tone: string;
    compact: boolean;
  }>`
    color: ${(p) => p.tone};
    border-color: ${(p) => `${p.tone}55`};
    background-color: ${(p) => `${p.tone}14`};
    padding: ${(p) => (p.compact ? "2px 6px" : "2px 8px")};
    font-size: ${(p) => (p.compact ? "9px" : "10px")};
  `;
}
