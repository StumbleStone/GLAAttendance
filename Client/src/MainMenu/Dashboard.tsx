import styled from "@emotion/styled";
import { faGithub } from "@fortawesome/free-brands-svg-icons";
import * as React from "react";
import { useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { Attendee } from "../Attendees/Attendee";
import { AttendeesTable } from "../Attendees/AttendeesTable";
import { AttendeeWindow } from "../Attendees/AttendeeWindow/AttendeeWindow";
import { FABAddAttendees } from "../Attendees/FABAddAttendees";
import { CaptureButton } from "../Capture/CaptureButton";
import { CaptureWindow } from "../Capture/CaptureWindow";
import { FAB } from "../Components/FloatingActionButton/FAB";
import { LayerHandler, LayerItem } from "../Components/Layer";
import { FABQRGrid } from "../QRCode/FABQRGrid";
import { RollCallDisplay } from "../RollCall/RollCallDisplay";
import { FABLogout } from "../SupaBase/FABLogout";
import { FABRefresh } from "../SupaBase/FABRefresh";
import { SupaBase } from "../SupaBase/SupaBase";
import { HeadingIconHandler } from "./HeadingIconHandler";

export interface DashboardProps {
  supabase: SupaBase;
}

export const Dashboard: React.FC = (props) => {
  const { supabase } = useOutletContext<DashboardProps>();

  const [captureCode, setCaptureCode] = React.useState<boolean>(false);

  React.useEffect(() => {
    supabase.loadData();
    return supabase.addListener({
      visibility_changed: (isVisible: boolean) =>
        !isVisible ? setCaptureCode(() => false) : null,
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
      <FABQRGrid doClose={close} key="FABQRGrid" supabase={supabase} />,
      <FABLogout doClose={close} key="FABLogout" supabase={supabase} />,
      <FABRefresh doClose={close} key="FABRefresh" supabase={supabase} />,
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

  useEffect(() => {
    const icon = HeadingIconHandler.AddIcon({
      icon: faGithub,
      onClick: () =>
        window.open("https://github.com/StumbleStone/GLAAttendance", "_blank"),
    });

    return icon.remove;
  }, []);

  return (
    <S.Container>
      <S.ButtonContainer>
        <RollCallDisplay supabase={supabase} />
        <CaptureButton handleClick={captureClick} isCapturing={captureCode} />
      </S.ButtonContainer>
      <CaptureWindow supabase={supabase} isCapturing={captureCode} />
      <AttendeesTable supabase={supabase} onClickedAttendee={clickedAttendee} />
      <FAB items={fabItems} />
    </S.Container>
  );
};

namespace S {
  export const Container = styled.div`
    label: DashboardContainer;
    padding: 0 20px 20px;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    margin-top: 15px;
    gap: 10px;

    @media (min-width: 700px) {
      padding-left: 10vw;
      padding-right: 10vw;
    }
  `;

  export const ButtonContainer = styled.div`
    label: DashboardButtonContainer;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 5px;
  `;
}
