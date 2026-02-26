import {useTheme} from "@emotion/react";
import styled from "@emotion/styled";
import {faBusSimple, faCar} from "@fortawesome/free-solid-svg-icons";
import React from "react";
import {Icon} from "../Components/Icon";

export interface TransportChipProps {
  usingOwnTransport: boolean;
}

export const TransportChip: React.FC<TransportChipProps> = (
  props: TransportChipProps
) => {
  const theme = useTheme();
  const { usingOwnTransport } = props;

  const color = usingOwnTransport
    ? theme.colors.accent.transportCar
    : theme.colors.accent.transportBus

  return (
    <S.TransportChip color={color} title={usingOwnTransport ? "Car" : "Bus"}>
      <Icon
        size={14}
        color={color}
        icon={usingOwnTransport ? faCar : faBusSimple}
      />
      <S.TransportChipLabel>{usingOwnTransport ? "Car" : "Bus"}</S.TransportChipLabel>
    </S.TransportChip>
  );
};

namespace S {
  export const TransportChip = styled.span<{ color: string }>`
    display: inline-flex;
    align-items: center;
    gap: 4px;
    white-space: nowrap;
    border-radius: ${(p) => p.theme.radius.pill};
    border: 1px solid ${(p) => `${p.color}55`};
    background-color: ${(p) => `${p.color}14`};
    padding: 2px 8px;
    font-size: 10px;
    line-height: 1;
    color: ${(p) => p.color};
  `;

  export const TransportChipLabel = styled.span`
    color: ${(p) => p.theme.colors.text};
    font-weight: 700;
  `;
}
