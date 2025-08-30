import styled from "@emotion/styled";
import { faChevronRight } from "@fortawesome/free-solid-svg-icons";
import * as React from "react";
import { Amount } from "../Components/Amount";
import { Icon } from "../Components/Icon";
import { Label } from "../Components/Label";
import { Tile } from "../Components/Tile";
import { CategoryEntry, TransactionEntry } from "../SupaBase/SupaBase";
import { DefaultColors } from "../Tools/Toolbox";
import { CategoryItemProgress } from "./CategoryItemProgress";

export interface CategoryItemProps {
  item: CategoryEntry;
  latestTransaction: TransactionEntry | null;
  color: string;
  onClick?: () => void;
}

export const CategoryItem: React.FC<CategoryItemProps> = (
  props: CategoryItemProps
) => {
  const { item, color, onClick, latestTransaction } = props;

  // const padding = Math.max(
  //   ...[latestTransaction?.total ?? 0, item.cap, item.monthly_inc].map((i) =>
  //     currencyToLength(i)
  //   )
  // );

  return (
    <S.CatItemContainer onClick={onClick}>
      <S.NameProgressContainer hasClick={!!onClick}>
        <S.NameLabel color={color}>{item.name}</S.NameLabel>
        <S.AmountContainer>
          <Amount
            color={DefaultColors.BrightGreen}
            amount={latestTransaction?.total ?? 0}
            title={"Tot"}
          />
          <Amount
            color={DefaultColors.BrightOrange}
            amount={item.cap}
            title={"Goal"}
          />
        </S.AmountContainer>

        <CategoryItemProgress
          item={item}
          color={color}
          latestTransaction={latestTransaction}
        />
      </S.NameProgressContainer>
      {!!onClick && (
        <S.IconContainer>
          <Icon
            icon={faChevronRight}
            size={20}
            color={DefaultColors.OffWhite}
          />
        </S.IconContainer>
      )}
    </S.CatItemContainer>
  );
};

namespace S {
  export const CatItemContainer = styled(Tile)`
    label: CatItemContainer;
    gap: 20px;

    display: flex;

    border-radius: 500px;
    cursor: pointer;
  `;

  export const AmountContainer = styled("div")`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
  `;

  export const NameProgressContainer = styled("div")<{ hasClick: boolean }>`
    label: NameProgressContainer;
    display: flex;
    flex-direction: column;
    flex: 1;
    gap: 5px;
    padding-left: 15px;
    padding-right: ${(p) => (!p.hasClick ? 10 : 0)}px;
  `;

  export const NameLabel = styled(Label)<{ color: string }>`
    label: NameLabel;
    font-size: 26px;
    width: 30%;
    flex: 1;

    color: ${(p) => p.color};

    display: flex;
    align-items: center;
    justify-content: flex-start;
  `;

  export const IconContainer = styled("div")`
    label: IconContainer;
    display: flex;
    align-items: center;
  `;
}
