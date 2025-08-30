import styled from "@emotion/styled";
import * as React from "react";

import { useOutletContext } from "react-router-dom";
import { FAB } from "../Components/FloatingActionButton/FAB";
import { Categories } from "../Categories/Categories";
import { SupaBase } from "../SupaBase/SupaBase";
import { FABItem } from "../Components/FloatingActionButton/Items/FABItem";
import { faCartPlus } from "@fortawesome/free-solid-svg-icons";
import { LayerHandler, LayerItem } from "../Components/Layer/Layer";
import { AddCategory } from "../Components/AddCategory/AddCategory";

export interface DashboardProps {
  supabase: SupaBase;
}

export const Dashboard: React.FC = (props) => {
  const { supabase } = useOutletContext<DashboardProps>();

  const fabItems = React.useCallback((close: () => void) => {
    return [
      <FABItem
        key="addC"
        close={close}
        icon={faCartPlus}
        label={"Add Category"}
        onClick={() => {
          LayerHandler.AddLayer((item: LayerItem) => (
            <AddCategory layerItem={item} supabase={supabase} />
          ));
        }}
      />,
    ];
  }, []);

  return (
    <>
      <FAB items={fabItems} />
      <Categories supabase={supabase} />
    </>
  );
};

namespace S {}
