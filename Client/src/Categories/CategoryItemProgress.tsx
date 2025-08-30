import styled from "@emotion/styled";
import * as React from "react";
import { Amount } from "../Components/Amount";
import { CategoryEntry, TransactionEntry } from "../SupaBase/SupaBase";
import { ProgressBar } from "../Components/ProgressBar";

export interface CategoryItemProgressProps {
  item: CategoryEntry;
  latestTransaction: TransactionEntry | null;
  color: string;
}

export const CategoryItemProgress: React.FC<CategoryItemProgressProps> = (
  props: CategoryItemProgressProps
) => {
  const { item, color, latestTransaction } = props;

  return (
    <S.Content>
      <ProgressBar
        value={latestTransaction?.total ?? 0}
        max={item.cap}
        color={color}
      />
    </S.Content>
  );
};
namespace S {
  export const Content = styled("div")`
    label: Content;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 5px;
  `;
}
