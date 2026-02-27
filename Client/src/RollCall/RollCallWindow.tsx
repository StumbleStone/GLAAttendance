import styled from "@emotion/styled";
import {
  faCheckSquare,
  faMinusSquare,
  faXmarkSquare,
} from "@fortawesome/free-solid-svg-icons";
import * as React from "react";
import { ReactNode } from "react";
import { AttendeeStatus } from "../Attendees/Attendee";
import { SummaryPill, SummaryPillId } from "../Attendees/SummaryPill";
import { Backdrop } from "../Components/Backdrop/Backdrop";
import { Button, ButtonContainer } from "../Components/Button/Button";
import { Heading } from "../Components/Heading";
import { LayerHandler, LayerItem } from "../Components/Layer";
import { LoadingSpinner } from "../Components/LoadingSpinner";
import {
  PopupConfirm,
  PopupConfirmButton,
} from "../Components/Popup/PopupConfirm";
import { PopupInput } from "../Components/Popup/PopupInput";
import { Span } from "../Components/Span";
import { Tile } from "../Components/Tile";
import { SupaBase, SupaBaseEventKey } from "../SupaBase/SupaBase";
import { RollCallEventEntry } from "../SupaBase/types";
import { Username } from "../SupaBase/Username";
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

    let confirmMessage: string | (string | ReactNode)[];
    if (supabase.countUnScannedAttendees() > 0) {
      confirmMessage = [
        `Are you sure you want to conclude the RollCall?`,
        <>
          <Span
            color={DefaultColors.BrightRed}
          >{`${supabase.countUnScannedAttendees()} / ${attendeeCount}`}</Span>
          <Span>{` Attendees have not been scanned.`}</Span>
        </>,
      ];
    } else {
      confirmMessage = `All ${attendeeCount} Attendees accounted for, you can conclude the RollCall`;
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
  props: RollCallWindowProps,
) => {
  const { layerItem, supabase } = props;
  const [, forceUpdate] = React.useReducer((x) => x + 1, 0);

  const bdClick = React.useCallback(() => {
    layerItem.close();
  }, [layerItem]);

  const cur: RollCallEventEntry | null = supabase.currentRollCallEvent;
  const canStart =
    (!cur && supabase.rollcallEventsLoaded) || (!!cur && !!cur.closed_by);
  const canStop = !!cur && !cur.closed_by;
  const loading = !supabase.rollcallEventsLoaded;

  React.useEffect(() => {
    return supabase.addListener({
      [SupaBaseEventKey.UPDATED_ROLLCALL_EVENT]: forceUpdate,
      [SupaBaseEventKey.LOADED_ROLLCALL_EVENTS]: forceUpdate,
      [SupaBaseEventKey.LOADED_ROLLCALLS]: forceUpdate,
      [SupaBaseEventKey.USERNAMES_LOADED]: forceUpdate,
    });
  }, []);

  const handleNewRollCall = React.useCallback(
    () => startRollCallEvent(supabase),
    [],
  );

  const handleEndRollCall = React.useCallback(
    () => stopRollCallEvent(supabase),
    [],
  );

  if (loading) {
    return <LoadingSpinner size={50} />;
  }

  return (
    <S.StyledBackdrop onClose={bdClick}>
      <S.RollCallWindowEl>
        <Heading>Roll Call</Heading>
        <S.Content>
          {!!cur?.description && <Span>{cur.description}</Span>}
          <RollCallWindowTable event={cur} supabase={supabase} />
          <SummaryPills supabase={supabase} />
          <ButtonContainer>
            {canStart && <Button onClick={handleNewRollCall}>Start New</Button>}
            {canStop && (
              <Button onClick={handleEndRollCall}>End Rollcall</Button>
            )}
          </ButtonContainer>
        </S.Content>
      </S.RollCallWindowEl>
    </S.StyledBackdrop>
  );
};

const SummaryPills: React.FC<{
  supabase: SupaBase;
}> = (props) => {
  const { supabase } = props;

  const [, forceUpdate] = React.useReducer((x) => x + 1, 0);

  const absentCount = supabase.countAbsentAttendees();
  const presentCount = supabase.countPresentAttendees();

  React.useEffect(() => {
    return supabase.addListener({
      [SupaBaseEventKey.UPDATED_ROLLCALL_EVENT]: forceUpdate,
      [SupaBaseEventKey.LOADED_ROLLCALL_EVENTS]: forceUpdate,
      [SupaBaseEventKey.LOADED_ROLLCALLS]: forceUpdate,
      [SupaBaseEventKey.USERNAMES_LOADED]: forceUpdate,
    });
  }, []);

  return (
    <S.CounterContainer>
      <SummaryPill
        id={SummaryPillId.NOT_SCANNED}
        icon={faMinusSquare}
        label={"No Scan"}
        value={supabase.attendees.size - absentCount - presentCount}
        color={DefaultColors.BrightGrey}
      />
      <SummaryPill
        id={SummaryPillId.PRESENT}
        icon={faXmarkSquare}
        label={AttendeeStatus.PRESENT}
        value={presentCount}
        color={DefaultColors.BrightGreen}
      />
      <SummaryPill
        id={SummaryPillId.ABSENT}
        icon={faCheckSquare}
        label={AttendeeStatus.ABSENT}
        value={absentCount}
        color={DefaultColors.BrightRed}
      />
    </S.CounterContainer>
  );
};

interface RollCallWindowTableProps {
  event: RollCallEventEntry;
  supabase: SupaBase;
}

const RollCallWindowTable: React.FC<RollCallWindowTableProps> = (
  props: RollCallWindowTableProps,
) => {
  const { event, supabase } = props;
  return (
    <table>
      <tbody>
        <tr>
          <td>Number:</td>
          <td>{event?.counter ?? "--"}</td>
        </tr>
        <tr>
          <td>Status:</td>
          <S.StyledCell
            color={
              event?.closed_by
                ? DefaultColors.BrightOrange
                : DefaultColors.BrightGrey
            }
          >
            {!event ? "None" : !event.closed_by ? "In Progress" : "Closed"}
          </S.StyledCell>
        </tr>
        <tr>
          <td>Since:</td>
          <td>
            {event
              ? epochToDate(new Date(event.created_at).getTime(), {
                  includeTime: true,
                })
              : "--"}
          </td>
        </tr>
        <tr>
          <td>{"By:"}</td>
          <td>
            <Username id={event?.created_by} supabase={supabase} />
          </td>
        </tr>

        {!!event?.closed_by && (
          <>
            <tr></tr>
            <tr>
              <td>Ended:</td>
              <td>
                {epochToDate(new Date(event.closed_at!).getTime(), {
                  includeTime: true,
                })}
              </td>
            </tr>

            <tr>
              <td>{"Ended By:"}</td>
              <td>
                <Username id={event.closed_by} supabase={supabase} />
              </td>
            </tr>
          </>
        )}
      </tbody>
    </table>
  );
};

namespace S {
  export const StyledBackdrop = styled(Backdrop)`
    display: flex;
    align-items: center;
    justify-content: center;
  `;

  export const CounterContainer = styled.div`
    display: flex;
    flex-direction: row;
    gap: 10px;
    align-items: center;
    justify-content: space-around;
  `;

  export const RollCallWindowEl = styled(Tile)`
    max-height: min(300px, 80vh);
    min-width: min(300px, 80vw);
    display: flex;
    flex-direction: column;
    overflow: hidden;
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

  export const StyledCell = styled.td<{ color?: string }>`
    color: ${(p) => p.color};
  `;
}
