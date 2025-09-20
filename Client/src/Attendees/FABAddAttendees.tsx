import { faUserPlus } from "@fortawesome/free-solid-svg-icons";
import React, { useCallback } from "react";
import { FABItem } from "../Components/FloatingActionButton/Items/FABItem";
import { LayerHandler, LayerItem } from "../Components/Layer";
import { SupaBase } from "../SupaBase/SupaBase";
import { AttendeeAddWindow } from "./AttendeeAddWindow";

export interface FABAddAttendeesProps {
  supabase: SupaBase;
  doClose: () => void;
}

export const FABAddAttendees: React.FC<FABAddAttendeesProps> = (
  props: FABAddAttendeesProps
) => {
  const { supabase, doClose } = props;

  const handleClick = useCallback(() => {
    LayerHandler.AddLayer((item: LayerItem) => (
      <AttendeeAddWindow layerItem={item} supabase={supabase} />
    ));
  }, []);

  return (
    <FABItem
      doClose={doClose}
      icon={faUserPlus}
      label={"Add Attendee(s)"}
      onClick={handleClick}
    />
  );
};
