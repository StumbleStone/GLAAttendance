import { faListCheck } from "@fortawesome/free-solid-svg-icons";
import React, { useCallback } from "react";
import { FABItem } from "../Components/FloatingActionButton/Items/FABItem";
import { LayerHandler, LayerItem } from "../Components/Layer/Layer";
import {
  PopupConfirm,
  PopupConfirmButton,
} from "../Components/Popup/PopupConfirm";
import { PopupInput } from "../Components/Popup/PopupInput";
import { SupaBase } from "../SupaBase/SupaBase";

export interface FABStartRollCallProps {
  supabase: SupaBase;
  doClose: () => void;
}

function startRollCallEvent(supabase: SupaBase) {
  LayerHandler.AddLayer((layerItem2: LayerItem) => {
    return (
      <PopupInput
        layerItem={layerItem2}
        text={`You are about to start a new RollCall`}
        onDecline={() => {
          layerItem2.close();
        }}
        onConfirm={(val: string) => {
          supabase.createNewRollCallEvent(val).then(() => {
            layerItem2.close();
          });
        }}
      />
    );
  });
}

function stopRollCallEvent(supabase: SupaBase) {
  LayerHandler.AddLayer((layerItem: LayerItem) => {
    const attendeeCount = supabase.attendees.size;
    const attendeesPresent = supabase.countPresentAttendees();

    let confirmMessage: string;
    if (attendeesPresent !== attendeeCount) {
      confirmMessage = `Are you sure you want to conclude the RollCall? Only ${attendeesPresent}/${attendeeCount} Attendees are present.`;
    } else {
      confirmMessage = `All ${attendeesPresent} Attendees accounted for, you can conclude the RollCall`;
    }

    const buttons: PopupConfirmButton[] = [
      {
        label: "No",
        onClick: () => layerItem.close(),
      },
      {
        label: "Yes",
        onClick: () => {
          supabase.closeCurrentRollCallEvent().then(() => {
            layerItem.close();
          });
        },
      },
    ];

    return (
      <PopupConfirm
        layerItem={layerItem}
        text={confirmMessage}
        buttons={buttons}
      />
    );
  });
}

export const FABStartRollCall: React.FC<FABStartRollCallProps> = (
  props: FABStartRollCallProps
) => {
  const { supabase, doClose } = props;

  const [canStartRollCall, setCanStartRollCall] = React.useState<boolean>(
    supabase.currentRollCallEvent == null ||
      supabase.currentRollCallEvent.closed_at != null
  );

  React.useEffect(() => {
    return supabase.addListener({
      updated_rollcall_event: () => {
        setCanStartRollCall(() => {
          return (
            supabase.currentRollCallEvent == null ||
            supabase.currentRollCallEvent.closed_at != null
          );
        });
      },
    });
  }, []);

  const handleClick = useCallback(() => {
    if (canStartRollCall) {
      return startRollCallEvent(supabase);
    }

    stopRollCallEvent(supabase);
  }, [canStartRollCall]);

  return (
    <FABItem
      doClose={doClose}
      icon={faListCheck}
      label={canStartRollCall ? "Start RollCall" : "Stop RollCall"}
      onClick={handleClick}
    />
  );
};
