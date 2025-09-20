import { faTableCellsLarge } from "@fortawesome/free-solid-svg-icons";
import React, { useCallback } from "react";
import { FABItem } from "../Components/FloatingActionButton/Items/FABItem";
import { LayerHandler, LayerItem } from "../Components/Layer";
import { SupaBase } from "../SupaBase/SupaBase";
import { QRGrid } from "./QRGrid";

export interface FABQRGridProps {
  supabase: SupaBase;
  doClose: () => void;
}

export const FABQRGrid: React.FC<FABQRGridProps> = (props: FABQRGridProps) => {
  const { supabase, doClose } = props;

  const handleClick = useCallback(() => {
    LayerHandler.AddLayer((item: LayerItem) => (
      <QRGrid supabase={supabase} layerItem={item} />
    ));
  }, []);

  return (
    <FABItem
      doClose={doClose}
      icon={faTableCellsLarge}
      label={"QR Grid"}
      onClick={handleClick}
    />
  );
};
