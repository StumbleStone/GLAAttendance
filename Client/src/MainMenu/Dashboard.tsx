import * as React from "react";

import styled from "@emotion/styled";
import { faCartPlus } from "@fortawesome/free-solid-svg-icons";
import { useOutletContext } from "react-router-dom";
import { AttendeesTable } from "../Attendees/AttendeesTable";
import { AtendeeWindow } from "../Attendees/AttendeeWindow";
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
        key="addC"
        close={close}
        icon={faCartPlus}
        label={"Add Category"}
        onClick={() => {
          LayerHandler.AddLayer((item: LayerItem) => null);
        }}
      />,
    ];
  }, []);

  const clickedAttendee = React.useCallback((entry: AttendeesEntry) => {
    LayerHandler.AddLayer((layerItem: LayerItem) => {
      return <AtendeeWindow layerItem={layerItem} entry={entry} />;
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
