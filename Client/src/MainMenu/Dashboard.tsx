import * as React from "react";

import styled from "@emotion/styled";
import { faUserPlus } from "@fortawesome/free-solid-svg-icons";
import { useOutletContext } from "react-router-dom";
import { AttendeeAddWindow } from "../Attendees/AttendeeAddWindow";
import { AttendeesTable } from "../Attendees/AttendeesTable";
import { AttendeeWindow } from "../Attendees/AttendeeWindow";
import { CaptureButton } from "../Capture/CaptureButton";
import { CaptureWindow } from "../Capture/CaptureWindow";
import { FAB } from "../Components/FloatingActionButton/FAB";
import { FABItem } from "../Components/FloatingActionButton/Items/FABItem";
import { Input } from "../Components/Inputs/BaseInput";
import { LayerHandler, LayerItem } from "../Components/Layer/Layer";
import { AttendeesEntry, SupaBase } from "../SupaBase/SupaBase";

export interface DashboardProps {
  supabase: SupaBase;
}

export const Dashboard: React.FC = (props) => {
  const { supabase } = useOutletContext<DashboardProps>();

  const [captureCode, setCaptureCode] = React.useState<boolean>(false);

  const [filter, setFilter] = React.useState<string>("");

  const handleChange = React.useCallback(
    (ev: React.ChangeEvent<HTMLInputElement>) => {
      setFilter(ev.target.value);
    },
    []
  );

  const captureClick = React.useCallback(() => {
    setCaptureCode((prev) => !prev);
  }, []);

  const fabItems = React.useCallback((close: () => void) => {
    return [
      <FABItem
        key="addAtt"
        close={close}
        icon={faUserPlus}
        label={"Add Attendee"}
        onClick={() => {
          LayerHandler.AddLayer((item: LayerItem) => (
            <AttendeeAddWindow layerItem={item} supabase={supabase} />
          ));
        }}
      />,
    ];
  }, []);

  const clickedAttendee = React.useCallback((entry: AttendeesEntry) => {
    LayerHandler.AddLayer((layerItem: LayerItem) => {
      return (
        <AttendeeWindow
          layerItem={layerItem}
          entry={entry}
          supabase={supabase}
        />
      );
    });
  }, []);

  return (
    <S.Container>
      <CaptureButton handleClick={captureClick} isCapturing={captureCode} />
      {captureCode && <CaptureWindow />}
      <Input value={filter} onChange={handleChange} />
      <AttendeesTable
        supabase={supabase}
        filter={filter}
        onClickedAttendee={clickedAttendee}
      />
      <FAB items={fabItems} />
    </S.Container>
  );
};

namespace S {
  export const Container = styled.div`
    padding: 0 20px 20px;
    display: flex;
    flex-direction: column;
    gap: 15px;
  `;
}
