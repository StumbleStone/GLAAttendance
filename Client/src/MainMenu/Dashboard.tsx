import styled from "@emotion/styled";
import { faGithub } from "@fortawesome/free-brands-svg-icons";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import * as React from "react";
import { useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { Attendee } from "../Attendees/Attendee";
import { AttendeesTable } from "../Attendees/AttendeesTable";
import { AttendeeWindow } from "../Attendees/AttendeeWindow";
import { FABAddAttendees } from "../Attendees/FABAddAttendees";
import { CaptureButton } from "../Capture/CaptureButton";
import { CaptureWindow } from "../Capture/CaptureWindow";
import { FAB } from "../Components/FloatingActionButton/FAB";
import { InputWithIcon } from "../Components/Inputs/InputWithIcon";
import { LayerHandler, LayerItem } from "../Components/Layer";
import { FABQRGrid } from "../QRCode/FABQRGrid";
import { RollCallDisplay } from "../RollCall/RollCallDisplay";
import { FABLogout } from "../SupaBase/FABLogout";
import { SupaBase } from "../SupaBase/SupaBase";
import { HeadingIconHandler } from "./HeadingIconHandler";

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
      <S.Search
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
    align-items: stretch;
    gap: 10px;

    @media (min-width: 700px) {
      padding-left: 10vw;
      padding-right: 10vw;
    }
  `;

  export const ButtonContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 5px;
    /* justify-content: space-between; */
  `;

  export const Search = styled(InputWithIcon)``;
}
