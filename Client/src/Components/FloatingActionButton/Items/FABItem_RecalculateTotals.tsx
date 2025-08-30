import { faScaleBalanced } from "@fortawesome/free-solid-svg-icons";
import * as React from "react";
import { CategoryEntry, SupaBase } from "../../../SupaBase/SupaBase";
import { FABItem } from "./FABItem";

export interface FABItem_RecalculateTotals {
  supabase: SupaBase;
  item: CategoryEntry;
  close: () => void;
}

export const FABItem_RecalculateTotals: React.FC<FABItem_RecalculateTotals> = (
  props
) => {
  const { supabase, item, close } = props;

  const handleClick = React.useCallback(async () => {
    await supabase.updateTransactionTotals(item.id, null);
    close();
  }, [supabase, item, close]);

  return (
    <FABItem
      key="RecalcTotals"
      close={close}
      icon={faScaleBalanced}
      label={"Recalculate Totals"}
      onClick={handleClick}
    />
  );
};
