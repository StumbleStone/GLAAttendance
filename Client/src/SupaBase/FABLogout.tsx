import { faArrowRightToBracket } from "@fortawesome/free-solid-svg-icons";
import React, { useCallback } from "react";
import { FABItem } from "../Components/FloatingActionButton/Items/FABItem";
import { LayerHandler, LayerItem } from "../Components/Layer/Layer";
import {
  PopupConfirm,
  PopupConfirmButton,
} from "../Components/Popup/PopupConfirm";
import { DefaultColors } from "../Tools/Toolbox";
import { SupaBase } from "./SupaBase";

export interface FABLogoutProps {
  supabase: SupaBase;
  doClose: () => void;
}

function logoutConfirm(supabase: SupaBase) {
  LayerHandler.AddLayer((layerItem: LayerItem) => {
    const buttons: PopupConfirmButton[] = [
      {
        label: "No",
        onClick: () => layerItem.close(),
        color: DefaultColors.BrightRed,
      },
      {
        label: "Yes",
        onClick: () => {
          layerItem.close();
          supabase.logOut();
        },
        color: DefaultColors.BrightGreen,
      },
      {
        label: "All",
        onClick: () => {
          layerItem.close();
          supabase.logOut(true);
        },
      },
    ];

    return (
      <PopupConfirm
        layerItem={layerItem}
        text={`Log out on this device?`}
        buttons={buttons}
      />
    );
  });
}

export const FABLogout: React.FC<FABLogoutProps> = (props: FABLogoutProps) => {
  const { supabase, doClose } = props;

  const handleClick = useCallback(() => {
    logoutConfirm(supabase);
  }, []);

  return (
    <FABItem
      doClose={doClose}
      icon={faArrowRightToBracket}
      label={"Logout"}
      onClick={handleClick}
    />
  );
};
