import styled from "@emotion/styled";
import * as React from "react";
import { Backdrop } from "../Components/Backdrop/Backdrop";
import { Button, ButtonContainer } from "../Components/Button/Button";
import { Heading } from "../Components/Heading";
import { LayerHandler, LayerItem } from "../Components/Layer/Layer";
import { LoadingSpinner } from "../Components/LoadingSpinner";
import {
  PopupConfirm,
  PopupConfirmButton,
} from "../Components/Popup/PopupConfirm";
import { PopupInput } from "../Components/Popup/PopupInput";
import { SubHeading } from "../Components/SubHeading";
import { Tile } from "../Components/Tile";
import { SupaBase, SupaBaseEventKey } from "../SupaBase/SupaBase";
import { DefaultColors, epochToDate } from "../Tools/Toolbox";

export function ShowRollCallWindow(supabase: SupaBase) {
  LayerHandler.AddLayer((l: LayerItem) => {
    return <RollCallWindow layerItem={l} supabase={supabase} />;
  });
}

export interface RollCallWindowProps {
  supabase: SupaBase;
  layerItem: LayerItem;
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
        color: DefaultColors.BrightRed,
      },
      {
        label: "Yes",
        onClick: () => {
          supabase.closeCurrentRollCallEvent().then(() => {
            layerItem.close();
          });
        },
        color: DefaultColors.BrightGreen,
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

export const RollCallWindow: React.FC<RollCallWindowProps> = (
  props: RollCallWindowProps
) => {
  const { layerItem, supabase } = props;
  const [, forceUpdate] = React.useReducer((x) => x + 1, 0);

  const bdClick = React.useCallback(() => {
    layerItem.close();
  }, [layerItem]);

  const cur = supabase.currentRollCallEvent;
  const canStart = (!cur && supabase.rollcallEventsLoaded) || !!cur.closed_by;
  const canStop = !!cur && !cur.closed_by;
  const loading = !supabase.rollcallEventsLoaded;

  React.useEffect(() => {
    return supabase.addListener({
      [SupaBaseEventKey.UPDATED_ROLLCALL_EVENT]: forceUpdate,
      [SupaBaseEventKey.LOADED_ROLLCALL_EVENTS]: forceUpdate,
      [SupaBaseEventKey.USERNAMES_LOADED]: forceUpdate,
    });
  }, []);

  const handleNewRollCall = React.useCallback(
    () => startRollCallEvent(supabase),
    []
  );

  const handleEndRollCall = React.useCallback(
    () => stopRollCallEvent(supabase),
    []
  );

  const content = React.useMemo(() => {
    if (loading) {
      return <LoadingSpinner size={50} />;
    }

    return (
      <>
        <SubHeading>{`Number: ${cur.counter}`}</SubHeading>
        <SubHeading>
          <span>Status: </span>
          <S.Status
            color={
              !cur.closed_by
                ? DefaultColors.BrightOrange
                : DefaultColors.BrightGrey
            }
          >
            {!cur.closed_by ? "In Progress" : "Closed"}
          </S.Status>
        </SubHeading>
        {!!cur.description && <span>{cur.description}</span>}
        <table>
          <tbody>
            <tr>
              <td>Started:</td>
              <td>
                {epochToDate(new Date(cur.created_at).getTime(), {
                  includeTime: true,
                })}
              </td>
            </tr>
            <tr>
              <td>Started By:</td>
              <td>{supabase.getUserName(cur.created_by)}</td>
            </tr>

            {!!cur.closed_by && (
              <>
                <tr></tr>
                <tr>
                  <td>Ended:</td>
                  <td>
                    {epochToDate(new Date(cur.closed_at!).getTime(), {
                      includeTime: true,
                    })}
                  </td>
                </tr>

                <tr>
                  <td>Ended By:</td>
                  <td>{supabase.getUserName(cur.closed_by)}</td>
                </tr>
              </>
            )}
          </tbody>
        </table>
        <ButtonContainer>
          {canStart && <Button onClick={handleNewRollCall}>Start New</Button>}
          {canStop && <Button onClick={handleEndRollCall}>End Rollcall</Button>}
        </ButtonContainer>
      </>
    );
  }, [cur]);

  return (
    <S.StyledBackdrop onClose={bdClick}>
      <S.RollCallWindowEl>
        <Heading>Roll Call</Heading>
        <S.Content>{content}</S.Content>
      </S.RollCallWindowEl>
    </S.StyledBackdrop>
  );
};

namespace S {
  export const StyledBackdrop = styled(Backdrop)`
    display: flex;
    align-items: center;
    justify-content: center;
  `;

  export const RollCallWindowEl = styled(Tile)`
    max-height: min(300px, 80vh);
    min-width: min(300px, 80vw);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    padding: 0;
    justify-content: center;
    align-items: center;

    gap: 10px;
    padding: 10px;
  `;

  export const Content = styled.div`
    flex: 1;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 10px;
  `;

  export const Status = styled.span<{ color: string }>`
    color: ${(p) => p.color};
  `;
}
