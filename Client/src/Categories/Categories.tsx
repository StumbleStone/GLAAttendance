import styled from "@emotion/styled";
import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
  Categories as ICategories,
  SupaBase,
  SupaBaseEvent,
  TransactionEntry,
} from "../SupaBase/SupaBase";
import { CategoryItem } from "./CategoryItem";

export interface CategoriesProps {
  supabase: SupaBase;
}

export const Categories: React.FC<CategoriesProps> = (
  props: CategoriesProps
) => {
  const { supabase } = props;

  const [categories, setCategories] = React.useState<ICategories>(
    supabase.categories ?? []
  );

  const [latestTransactions, setLatestTransactions] = React.useState<{
    [key: string]: TransactionEntry;
  }>({ ...supabase.latestTransactions });

  const nav = useNavigate();

  React.useEffect(() => {
    supabase.getCategories();

    return supabase.addListener({
      [SupaBaseEvent.CATEGORIES_LOADED]: (categories) => {
        setCategories([...categories]);
      },
      [SupaBaseEvent.LATEST_TRANSACTIONS_LOADED]: (t) => {
        setLatestTransactions({ ...supabase.latestTransactions });
      },
    });
  }, []);

  return (
    <S.Container>
      <S.Categories>
        {categories.map((c, idx) => (
          <CategoryItem
            item={c}
            latestTransaction={latestTransactions[c.id]}
            key={idx}
            color={supabase.getCategoryColor(c, idx)}
            onClick={() => {
              nav(`/category/${encodeURIComponent(c.id)}`);
            }}
          />
        ))}
      </S.Categories>
    </S.Container>
  );
};

namespace S {
  export const Container = styled("div")`
    label: CategoriesContainer;
    display: flex;
    width: calc(100% - 30px);
    padding-bottom: 100px;
    padding-left: 15px;
    padding-right: 15px;
  `;

  export const Categories = styled("div")`
    label: Categories;

    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 15px;

    font-size: 18px;
  `;
}
