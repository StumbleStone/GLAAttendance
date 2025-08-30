import styled from "@emotion/styled";
import { Label } from "./Label";
import * as React from "react";
import { formatCurrency } from "../Tools/Toolbox";

export interface AmountProps {
  title: string;
  amount: number;
  padding?: number;
  includeCents?: boolean;
  color?: string;
}

export const Amount: React.FC<AmountProps> = (props) => {
  const { amount, padding = 0, title, includeCents = false, color } = props;
  return (
    <S.Amount>
      <S.AmountLabel color={color}>{title}</S.AmountLabel>
      <S.AmountValue color={color}>
        {formatCurrency(amount, { padding, includeCents, symbol: "R" })}
      </S.AmountValue>
    </S.Amount>
  );
};

namespace S {
  export const Amount = styled("div")`
    label: Amount;
    display: flex;
    gap: 5px;
    font-size: 12px;
    justify-content: flex-end;
  `;

  export const AmountLabel = styled("div")<{ color?: string }>`
    label: AmountLabel;
    display: flex;
    color: ${(p) => p.color};
  `;

  export const AmountValue = styled(Label)`
    label: AmountValue;
    white-space: pre;
  `;
}
