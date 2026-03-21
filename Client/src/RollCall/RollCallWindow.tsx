import styled from "@emotion/styled";
import {
  faCheckSquare,
  faMinusSquare,
  faXmarkSquare,
} from "@fortawesome/free-solid-svg-icons";
import * as React from "react";
import { ChangeEvent, ReactNode } from "react";
import { AttendeeStatus } from "../Attendees/Attendee";
import { SummaryPill, SummaryPillId } from "../Attendees/SummaryPill";
import { Backdrop } from "../Components/Backdrop/Backdrop";
import { Button, ButtonContainer } from "../Components/Button/Button";
import { Heading } from "../Components/Heading";
import { Input } from "../Components/Inputs/BaseInput";
import { LayerHandler, LayerItem } from "../Components/Layer";
import { LoadingSpinner } from "../Components/LoadingSpinner";
import {
  PopupBackdrop,
  PopupButtonContainer,
  PopupDialog,
} from "../Components/Popup/PopupComponents";
import {
  PopupConfirm,
  PopupConfirmButton,
} from "../Components/Popup/PopupConfirm";
import { Span } from "../Components/Span";
import { Tile } from "../Components/Tile";
import { SupaBase, SupaBaseEventKey } from "../SupaBase/SupaBase";
import { EventsEntry, RollCallEventEntry } from "../SupaBase/types";
import { Username } from "../SupaBase/Username";
import { DefaultColors, epochToDate } from "../Tools/Toolbox";

export interface ShowRollCallWindowOptions {
  allowedEventIds?: number[];
  rollCallEvent?: RollCallEventEntry | null;
}

interface RollCallStartPopupProps {
  availableEvents: EventsEntry[];
  layerItem: LayerItem;
  onConfirm: (description: string, eventId: number) => void;
}

function getEventDisplayLabel(event: EventsEntry): string {
  const eventName = event.name?.trim();
  if (!!eventName) {
    return eventName;
  }

  return `Event #${event.id}`;
}

function getAllowedRollCallEvents(
  supabase: SupaBase,
  allowedEventIds?: number[],
): EventsEntry[] {
  const allowedEventIdSet = new Set(
    (allowedEventIds ?? []).filter((eventId) => Number.isInteger(eventId)),
  );
  const hasEventFilter = allowedEventIdSet.size > 0;

  return [...supabase.eventsHandler.attendanceEvents]
    .filter((event) => {
      if (!hasEventFilter) {
        return true;
      }

      return allowedEventIdSet.has(event.id);
    })
    .sort((a, b) => {
      const aStart = a.start_time ? new Date(a.start_time).getTime() : 0;
      const bStart = b.start_time ? new Date(b.start_time).getTime() : 0;
      if (aStart !== bStart) {
        return aStart - bStart;
      }

      return getEventDisplayLabel(a).localeCompare(getEventDisplayLabel(b));
    });
}

function getStartableRollCallEvents(
  supabase: SupaBase,
  events: EventsEntry[],
): EventsEntry[] {
  return events.filter((event) => !supabase.hasActiveRollCallEvent(event.id));
}

const RollCallStartPopup: React.FC<RollCallStartPopupProps> = (
  props: RollCallStartPopupProps,
) => {
  const { availableEvents, layerItem, onConfirm } = props;
  const [description, setDescription] = React.useState<string>("");
  const [selectedEventId, setSelectedEventId] = React.useState<number>(() => {
    return availableEvents[0]?.id ?? 0;
  });

  const handleDescriptionChange = React.useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setDescription(() => event.target.value);
    },
    [],
  );

  const handleEventChange = React.useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      setSelectedEventId(() => Number(event.target.value));
    },
    [],
  );

  const handleConfirm = React.useCallback(() => {
    if (!selectedEventId) {
      return;
    }

    onConfirm(description, selectedEventId);
  }, [description, onConfirm, selectedEventId]);

  return (
    <PopupBackdrop onClose={layerItem.close}>
      <PopupDialog>
        <S.StartPopupText>
          {"You are about to start a new RollCall"}
        </S.StartPopupText>
        <S.StartPopupFields>
          <S.StartPopupField>
            <S.StartPopupLabel>{"Event"}</S.StartPopupLabel>
            <S.EventSelect value={selectedEventId} onChange={handleEventChange}>
              {availableEvents.map((event) => (
                <option key={event.id} value={event.id}>
                  {getEventDisplayLabel(event)}
                </option>
              ))}
            </S.EventSelect>
          </S.StartPopupField>
          <S.StartPopupField>
            <S.StartPopupLabel>{"Description"}</S.StartPopupLabel>
            <Input
              value={description}
              onChange={handleDescriptionChange}
              placeholder="Optional: Name or describe RollCall..."
            />
          </S.StartPopupField>
        </S.StartPopupFields>
        <PopupButtonContainer>
          <Button color={DefaultColors.BrightRed} onClick={layerItem.close}>
            Cancel
          </Button>
          <Button color={DefaultColors.BrightGreen} onClick={handleConfirm}>
            Okay
          </Button>
        </PopupButtonContainer>
      </PopupDialog>
    </PopupBackdrop>
  );
};

export function ShowRollCallWindow(
  supabase: SupaBase,
  options: ShowRollCallWindowOptions = {},
) {
  LayerHandler.AddLayer((l: LayerItem) => {
    return <RollCallWindow layerItem={l} supabase={supabase} {...options} />;
  });
}

export interface RollCallWindowProps {
  allowedEventIds?: number[];
  rollCallEvent?: RollCallEventEntry | null;
  supabase: SupaBase;
  layerItem: LayerItem;
}

function startRollCallEvent(
  supabase: SupaBase,
  availableEvents: EventsEntry[],
) {
  if (availableEvents.length === 0) {
    return;
  }

  LayerHandler.AddLayer((layerItem2: LayerItem) => {
    return (
      <RollCallStartPopup
        availableEvents={availableEvents}
        layerItem={layerItem2}
        onConfirm={(description: string, eventId: number) => {
          supabase.createNewRollCallEvent(description, eventId).then(() => {
            layerItem2.close();
          });
        }}
      />
    );
  });
}

function stopRollCallEvent(
  supabase: SupaBase,
  rollCallEvent: RollCallEventEntry | null,
) {
  if (!rollCallEvent) {
    return;
  }

  LayerHandler.AddLayer((layerItem: LayerItem) => {
    const attendeeCount = supabase.countTrackedAttendees(rollCallEvent.id);
    const unscannedCount = supabase.countUnScannedAttendees(rollCallEvent.id);

    let confirmMessage: string | (string | ReactNode)[];
    if (unscannedCount > 0) {
      confirmMessage = [
        `Are you sure you want to conclude the RollCall?`,
        <>
          <Span
            color={DefaultColors.BrightRed}
          >{`${unscannedCount} / ${attendeeCount}`}</Span>
          <Span>{` Participants have not been scanned.`}</Span>
        </>,
      ];
    } else {
      confirmMessage = `All ${attendeeCount} participants are accounted for, you can conclude the RollCall`;
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
          supabase.closeRollCallEvent(rollCallEvent.id).then(() => {
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
  const { allowedEventIds, layerItem, rollCallEvent, supabase } = props;
  const [, forceUpdate] = React.useReducer((x) => x + 1, 0);

  const bdClick = React.useCallback(() => {
    layerItem.close();
  }, [layerItem]);

  const globalCurrentRollCallEvent: RollCallEventEntry | null =
    supabase.currentRollCallEvent ?? null;
  const cur: RollCallEventEntry | null =
    rollCallEvent ??
    (allowedEventIds?.length
      ? supabase.getLatestRollCallEventByEventIds(allowedEventIds)
      : globalCurrentRollCallEvent);
  const availableEvents = getAllowedRollCallEvents(supabase, allowedEventIds);
  const startableEvents = getStartableRollCallEvents(supabase, availableEvents);
  const activeCurrentEventRollCall =
    cur?.event_id != null
      ? supabase.getActiveRollCallEvent(cur.event_id)
      : null;
  const canStart = startableEvents.length > 0;
  const canStop =
    !!cur && !cur.closed_by && activeCurrentEventRollCall?.id === cur.id;
  const activeRollCallHidden =
    !!cur &&
    !!activeCurrentEventRollCall &&
    activeCurrentEventRollCall.id !== cur.id;
  const loading =
    !supabase.rollcallEventsLoaded ||
    !supabase.rollCallsHandler.dataLoaded ||
    !supabase.eventsHandler.dataLoaded ||
    !supabase.usernamesLoaded;

  React.useEffect(() => {
    return supabase.addListener({
      [SupaBaseEventKey.EVENTS_CHANGED]: forceUpdate,
      [SupaBaseEventKey.UPDATED_ROLLCALL_EVENT]: forceUpdate,
      [SupaBaseEventKey.LOADED_ROLLCALL_EVENTS]: forceUpdate,
      [SupaBaseEventKey.LOADED_ROLLCALLS]: forceUpdate,
      [SupaBaseEventKey.USERNAMES_LOADED]: forceUpdate,
    });
  }, []);

  const handleNewRollCall = React.useCallback(
    () => startRollCallEvent(supabase, startableEvents),
    [startableEvents, supabase],
  );

  const handleEndRollCall = React.useCallback(
    () => stopRollCallEvent(supabase, cur),
    [cur, supabase],
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
          {activeRollCallHidden && (
            <S.StatusNotice>
              {"This event already has a different active rollcall."}
            </S.StatusNotice>
          )}
          {!activeRollCallHidden && availableEvents.length === 0 && (
            <S.StatusNotice>
              {"No events are available for starting a rollcall."}
            </S.StatusNotice>
          )}
          {!activeRollCallHidden &&
            availableEvents.length > 0 &&
            startableEvents.length === 0 && (
              <S.StatusNotice>
                {
                  "All available events already have an active rollcall in progress."
                }
              </S.StatusNotice>
            )}
          <RollCallWindowTable event={cur} supabase={supabase} />
          <SummaryPills rollCallEventId={cur?.id ?? null} supabase={supabase} />
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
  rollCallEventId: number | null;
  supabase: SupaBase;
}> = (props) => {
  const { rollCallEventId, supabase } = props;

  const [, forceUpdate] = React.useReducer((x) => x + 1, 0);

  const absentCount = supabase.countAbsentAttendees(rollCallEventId);
  const presentCount = supabase.countPresentAttendees(rollCallEventId);
  const unscannedCount = supabase.countUnScannedAttendees(rollCallEventId);

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
        value={unscannedCount}
        color={DefaultColors.BrightGrey}
      />
      <SummaryPill
        id={SummaryPillId.PRESENT}
        icon={faCheckSquare}
        label={AttendeeStatus.PRESENT}
        value={presentCount}
        color={DefaultColors.BrightGreen}
      />
      <SummaryPill
        id={SummaryPillId.ABSENT}
        icon={faXmarkSquare}
        label={AttendeeStatus.ABSENT}
        value={absentCount}
        color={DefaultColors.BrightRed}
      />
    </S.CounterContainer>
  );
};

interface RollCallWindowTableProps {
  event: RollCallEventEntry | null;
  supabase: SupaBase;
}

const RollCallWindowTable: React.FC<RollCallWindowTableProps> = (
  props: RollCallWindowTableProps,
) => {
  const { event, supabase } = props;
  const eventRecord =
    event?.event_id != null
      ? (supabase.eventsHandler.attendanceEvents.find(
          (attendanceEvent) => attendanceEvent.id === event.event_id,
        ) ?? null)
      : null;

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
          <td>Event:</td>
          <td>{eventRecord ? getEventDisplayLabel(eventRecord) : "--"}</td>
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

  export const StatusNotice = styled.div`
    color: ${(p) => p.theme.colors.textMuted};
    font-size: 14px;
    text-align: center;
  `;

  export const StartPopupText = styled.div`
    text-align: center;
    padding: 10px 0 10px;
  `;

  export const StartPopupFields = styled.div`
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 10px;
  `;

  export const StartPopupField = styled.div`
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 6px;
  `;

  export const StartPopupLabel = styled.div`
    font-size: 14px;
    color: ${(p) => p.theme.colors.textMuted};
  `;

  export const EventSelect = styled.select`
    box-sizing: border-box;
    width: 100%;
    min-height: 48px;
    font-size: 18px;
    font-family: inherit;
    background-color: ${(p) => p.theme.colors.input.background};
    color: ${(p) => p.theme.colors.input.foreground};
    border: 1px solid ${(p) => p.theme.colors.input.border};
    border-radius: ${(p) => p.theme.radius.lg};
    padding: 8px 16px;

    :focus,
    :focus-visible {
      outline: none;
      border-color: ${(p) => p.theme.colors.input.focus};
      box-shadow:
        inset 0 1px 0 ${(p) => p.theme.colors.borderSubtle},
        0 0 0 2px ${(p) => p.theme.colors.input.focus};
    }
  `;
}
