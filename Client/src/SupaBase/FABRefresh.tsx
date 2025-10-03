import { faRefresh } from "@fortawesome/free-solid-svg-icons";
import React, { useCallback } from "react";
import { FABItem } from "../Components/FloatingActionButton/Items/FABItem";
import { SupaBase } from "./SupaBase";

export interface FABRefreshProps {
  supabase: SupaBase;
  doClose: () => void;
}

export const FABRefresh: React.FC<FABRefreshProps> = (
  props: FABRefreshProps
) => {
  const { supabase, doClose } = props;

  const handleClick = useCallback(async () => {
    await supabase.loadData();
  }, []);

  return (
    <FABItem
      doClose={doClose}
      icon={faRefresh}
      label={"Refresh Data"}
      onClick={handleClick}
    />
  );
};
