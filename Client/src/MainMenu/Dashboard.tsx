import styled from "@emotion/styled";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import * as React from "react";
import { useOutletContext } from "react-router-dom";
import { Attendee } from "../Attendees/Attendee";
import { AttendeesTable } from "../Attendees/AttendeesTable";
import { AttendeeWindow } from "../Attendees/AttendeeWindow";
import { FABAddAttendees } from "../Attendees/FABAddAttendees";
import { CaptureButton } from "../Capture/CaptureButton";
import { CaptureWindow } from "../Capture/CaptureWindow";
import { FAB } from "../Components/FloatingActionButton/FAB";
import { InputWithIcon } from "../Components/Inputs/InputWithIcon";
import { LayerHandler, LayerItem } from "../Components/Layer/Layer";
import { FABQRGrid } from "../QRCode/FABQRGrid";
import { FABStartRollCall } from "../RollCall/FABStartRollCall";
import { RollCallDisplay } from "../RollCall/RollCallDisplay";
import { FABLogout } from "../SupaBase/FABLogout";
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

  React.useEffect(() => {
    supabase.loadData();
    return supabase.addListener({
      visibility_changed: (isVisible: boolean) =>
        isVisible == false ? setCaptureCode(() => false) : null,
    });
  }, []);

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
      <FABQRGrid doClose={close} key="FABQRGrid" supabase={supabase} />,
      <FABLogout doClose={close} key="FABLogout" supabase={supabase} />,
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
      <S.ButtonContainer>
        <RollCallDisplay supabase={supabase} />
        <CaptureButton handleClick={captureClick} isCapturing={captureCode} />
      </S.ButtonContainer>
      <CaptureWindow supabase={supabase} isCapturing={captureCode} />
      <InputWithIcon
        icon={faMagnifyingGlass}
        value={filter}
        onChange={handleChange}
        placeholder="Search..."
      />
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

  export const ButtonContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 5px;
    /* justify-content: space-between; */
  `;
}
