import { faCoins } from "@fortawesome/free-solid-svg-icons";
import * as React from "react";
import { useCallback } from "react";
import { AddTransaction } from "../../../Categories/AddTransaction";
import { CategoryEntry, SupaBase } from "../../../SupaBase/SupaBase";
import { LayerHandler, LayerItem } from "../../Layer/Layer";
import { FABItem } from "./FABItem";

export interface FABItem_AddTransactionProps {
  supabase: SupaBase;
  item: CategoryEntry;
  close: () => void;
}

export const FABItem_AddTransaction: React.FC<FABItem_AddTransactionProps> = (
  props
) => {
  const { supabase, item, close } = props;

  const handleClick = useCallback(() => {
    LayerHandler.AddLayer((layerItem: LayerItem) => (
      <AddTransaction
        layerItem={layerItem}
        supabase={supabase}
        category={item}
      />
    ));
  }, [item, supabase]);

  return (
    <FABItem
      key="AddT"
      close={close}
      icon={faCoins}
      label={"Add Transaction"}
      onClick={handleClick}
    />
  );
};
