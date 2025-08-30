import styled from "@emotion/styled";
import * as React from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { FAB } from "../Components/FloatingActionButton/FAB";
import { FABItem_AddTransaction } from "../Components/FloatingActionButton/Items/FABItem_AddTransaction";
import { FABItem_RecalculateTotals } from "../Components/FloatingActionButton/Items/FABItem_RecalculateTotals";
import { Label } from "../Components/Label";
import { Tile } from "../Components/Tile";
import {
  CategoryEntry,
  SupaBase,
  SupaBaseEvent,
  TransactionEntry,
} from "../SupaBase/SupaBase";
import { DefaultColors } from "../Tools/Toolbox";
import { CategoryItem } from "./CategoryItem";
import { CategoryTransactions } from "./CategoryTransactions";

export interface CategoryViewContext {
  supabase: SupaBase;
}

export type CategoryViewParams = {
  id: string;
};

export const CategoryView: React.FC = (props) => {
  const { id } = useParams<CategoryViewParams>();
  const { supabase } = useOutletContext<CategoryViewContext>();

  const idx = React.useMemo((): number => {
    return parseInt(decodeURIComponent(id!));
  }, [id]);

  const [item, setItem] = React.useState<CategoryEntry | null>(
    supabase.getCategoryFromCache(idx)
  );

  const [latestTransaction, setLatestTransaction] =
    React.useState<TransactionEntry | null>(
      supabase.getLatestTransactionFromCache(idx)
    );

  const [color, setColor] = React.useState<string>(DefaultColors.Text_Color);

  React.useEffect(() => {
    if (!item) {
      supabase.getCategory(idx);
      return;
    }

    setColor(supabase.getCategoryColor(item));
  }, [item]);

  React.useEffect(() => {
    return supabase.addListener({
      [SupaBaseEvent.CATEGORY_LOADED]: (c: CategoryEntry) => {
        if (c.id !== idx) {
          return;
        }

        setItem((p) => c);
      },
      [SupaBaseEvent.LATEST_TRANSACTIONS_LOADED]: (t: TransactionEntry) => {
        if (t.category_id !== idx) {
          return;
        }

        setLatestTransaction(t);
      },
    });
  }, []);

  const fabItems = React.useCallback(
    (close: () => void) => {
      if (!item) {
        return [];
      }

      return [
        <FABItem_AddTransaction
          item={item}
          supabase={supabase}
          close={close}
          key={"add"}
        />,
        <FABItem_RecalculateTotals
          supabase={supabase}
          item={item}
          close={close}
          key={"recalc"}
        />,
      ];
    },
    [item]
  );

  if (!item) {
    return <></>;
  }

  return (
    <S.Container>
      <CategoryItem
        item={item}
        key={idx}
        color={color}
        latestTransaction={latestTransaction}
      />
      <S.TransactionContainer>
        <S.TransactionLabel>Transactions</S.TransactionLabel>
        <CategoryTransactions item={item} supabase={supabase} />
      </S.TransactionContainer>
      <FAB items={fabItems} />
    </S.Container>
  );
};

namespace S {
  export const Container = styled("div")`
    display: flex;
    flex-direction: column;
    gap: 25px;
    padding-bottom: 100px;
    padding-left: 15px;
    padding-right: 15px;
  `;

  export const HeaderEl = styled(Tile)`
    display: flex;
    align-items: center;
    justify-content: center;
  `;

  export const TransactionContainer = styled(Tile)`
    display: flex;
    border-radius: 50px;
    flex-direction: column;
    padding: 20px 0px;
    padding-bottom: 0px;
    overflow: hidden;
    gap: 5px;
  `;

  export const TransactionLabel = styled(Label)`
    label: TransactionLabel;
    font-size: 18px;
    text-align: center;
    padding: 0px 32px;
  `;
}
