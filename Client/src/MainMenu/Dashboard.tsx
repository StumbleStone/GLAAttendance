import * as React from "react";

import styled from "@emotion/styled";
import { useOutletContext } from "react-router-dom";
import { AttendeesTable } from "../Attendees/AttendeesTable";
import { AttendeeWindow } from "../Attendees/AttendeeWindow";
import { FABAddAttendees } from "../Attendees/FABAddAttendees";
import { FABStartRollCall } from "../Attendees/FABStartRollCall";
import { CaptureButton } from "../Capture/CaptureButton";
import { CaptureWindow } from "../Capture/CaptureWindow";
import { FAB } from "../Components/FloatingActionButton/FAB";
import { Input } from "../Components/Inputs/BaseInput";
import { LayerHandler, LayerItem } from "../Components/Layer/Layer";
import { RollCallDisplay } from "../RollCall/RollCallDisplay";
import { Attendee } from "../SupaBase/Attendee";
import { SupaBase } from "../SupaBase/SupaBase";

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
      <FABAddAttendees
        doClose={close}
        key="FABAddAttendees"
        supabase={supabase}
      />,
      <FABStartRollCall
        doClose={close}
        key="FABStartRollCall"
        supabase={supabase}
      />,
    ];
  }, []);

  const clickedAttendee = React.useCallback((attendee: Attendee) => {
    LayerHandler.AddLayer((layerItem: LayerItem) => {
      return (
        <AttendeeWindow
          layerItem={layerItem}
          attendee={attendee}
          supabase={supabase}
        />
      );
    });
  }, []);

  return (
    <S.Container>
      <S.HeaderContainer>
        <RollCallDisplay supabase={supabase} />
        <CaptureButton handleClick={captureClick} isCapturing={captureCode} />
      </S.HeaderContainer>
      <CaptureWindow supabase={supabase} isCapturing={captureCode} />
      <Input value={filter} onChange={handleChange} placeholder="Search..." />
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
    gap: 10px;
  `;

  export const HeaderContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    align-items: flex-start;
    gap: 5px;
    /* justify-content: space-between; */
  `;
}
