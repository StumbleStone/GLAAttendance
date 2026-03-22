import styled from "@emotion/styled";
import * as React from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Heading } from "../Components/Heading";
import { SubHeading } from "../Components/SubHeading";
import { Tile } from "../Components/Tile";
import { RoutePath } from "../MainMenu/RouteFlow";
import { SupaBase, SupaBaseEventKey } from "../SupaBase/SupaBase";
import { EventsEntry, RollCallEventEntry } from "../SupaBase/types";
import {
  RollCallCardActivityState,
  RollCallCardList,
  RollCallEmptyStateCard,
  RollCallSessionCard,
  RollCallStartCard,
} from "./RollCallCardComponents";
import {
  getRollCallEventLabel,
  getRollCallSessionLabel,
} from "./RollCallUtils";
import { ShowRollCallStartPopup } from "./RollCallWindow";

export interface RollCallsProps {
  supabase: SupaBase;
}

export const RollCalls: React.FC = () => {
  const { supabase } = useOutletContext<RollCallsProps>();
  const nav = useNavigate();
  const [, forceUpdate] = React.useReducer((x) => x + 1, 0);
  const [loading, setLoading] = React.useState<boolean>(() => {
    return (
      !supabase.attendeesHandler.dataLoaded ||
      !supabase.eventParticipantsHandler.dataLoaded ||
      !supabase.eventProctorsHandler.dataLoaded ||
      !supabase.eventsHandler.dataLoaded ||
      !supabase.rollcallEventsLoaded ||
      !supabase.rollCallsHandler.dataLoaded
    );
  });

  React.useEffect(() => {
    let active = true;
    const listener = supabase.addListener({
      [SupaBaseEventKey.ATTENDEES_CHANGED]: forceUpdate,
      [SupaBaseEventKey.EVENT_PARTICIPANTS_CHANGED]: forceUpdate,
      [SupaBaseEventKey.EVENT_PROCTORS_CHANGED]: forceUpdate,
      [SupaBaseEventKey.EVENTS_CHANGED]: forceUpdate,
      [SupaBaseEventKey.LOADED_ROLLCALLS]: forceUpdate,
      [SupaBaseEventKey.LOADED_ROLLCALL_EVENTS]: forceUpdate,
      [SupaBaseEventKey.UPDATED_ROLLCALL_EVENT]: forceUpdate,
      [SupaBaseEventKey.USER_UPDATE]: forceUpdate,
      [SupaBaseEventKey.USER_PROFILE]: forceUpdate,
      [SupaBaseEventKey.USERNAMES_LOADED]: forceUpdate,
    });

    setLoading(true);
    void supabase.loadData().finally(() => {
      if (!active) {
        return;
      }

      setLoading(false);
    });

    return () => {
      active = false;
      listener();
    };
  }, [supabase]);

  const currentUserId = supabase.user?.id ?? supabase.profile?.uid ?? null;
  const proctoredEventIds: number[] = !currentUserId
    ? []
    : supabase.eventProctorsHandler
        .getByUserId(currentUserId)
        .map((eventProctor) => eventProctor.event_id)
        .filter((eventId): eventId is number => Number.isInteger(eventId));

  const proctoredEventIdSet = new Set(proctoredEventIds);

  const proctoredEvents: EventsEntry[] =
    supabase.eventsHandler.attendanceEvents.filter((event) =>
      proctoredEventIdSet.has(event.id),
    );

  const rollCallEvents =
    supabase.getRollCallEventsByEventIds(proctoredEventIds);
  const activeRollCallEvents = rollCallEvents.filter(
    (rollCallEvent) => !rollCallEvent.closed_at,
  );
  const pastRollCallEvents = rollCallEvents.filter(
    (rollCallEvent) => !!rollCallEvent.closed_at,
  );
  const startableEventIds = proctoredEvents
    .filter((event) => !supabase.hasActiveRollCallEvent(event.id))
    .map((event) => event.id);
  const hasProctoredEvents = proctoredEventIds.length > 0;

  const handleStartRollCall = React.useCallback(() => {
    ShowRollCallStartPopup(supabase, {
      allowedEventIds: startableEventIds,
    });
  }, [startableEventIds, supabase]);

  const renderRollCallCard = React.useCallback(
    (rollCallEvent: RollCallEventEntry) => {
      const eventRecord =
        supabase.eventsHandler.attendanceEvents.find(
          (event) => event.id === rollCallEvent.event_id,
        ) ?? null;
      const activityState = rollCallEvent.closed_at
        ? RollCallCardActivityState.CLOSED
        : RollCallCardActivityState.ACTIVE;
      const presentCount = supabase.countPresentAttendees(rollCallEvent.id);
      const absentCount = supabase.countAbsentAttendees(rollCallEvent.id);
      const unscannedCount = supabase.countUnScannedAttendees(rollCallEvent.id);
      const participantCount = supabase.countTrackedAttendees(rollCallEvent.id);

      return (
        <RollCallSessionCard
          absentCount={absentCount}
          activityState={activityState}
          key={rollCallEvent.id}
          onSelect={() => nav(`${RoutePath.ROLLCALLS}/${rollCallEvent.id}`)}
          participantCount={participantCount}
          presentCount={presentCount}
          sessionLabel={getRollCallSessionLabel(rollCallEvent)}
          title={getRollCallEventLabel(eventRecord, rollCallEvent.event_id)}
          unscannedCount={unscannedCount}
        />
      );
    },
    [nav, supabase],
  );

  return (
    <S.Container>
      <S.Panel>
        <Heading>Rollcalls</Heading>
        <S.PanelDescription>
          {"Manage rollcalls for the events you are currently proctoring."}
        </S.PanelDescription>

        {loading ? (
          <S.EmptyStateTile>
            <S.SectionTitle>{"Loading rollcalls..."}</S.SectionTitle>
            <S.SectionDescription>
              {"Fetching the current rollcall session and participant state."}
            </S.SectionDescription>
          </S.EmptyStateTile>
        ) : !hasProctoredEvents ? (
          <S.EmptyStateTile>
            <S.SectionTitle>{"No Proctored Events Yet"}</S.SectionTitle>
            <S.SectionDescription>
              {
                "You are not assigned as a proctor on any events yet, so there are no rollcalls to manage here."
              }
            </S.SectionDescription>
          </S.EmptyStateTile>
        ) : (
          <>
            <RollCallCardList>
              <RollCallStartCard
                canStart={startableEventIds.length > 0}
                description={
                  startableEventIds.length > 0
                    ? "Click anywhere on this card to start a new rollcall for an assigned event that does not already have an active session."
                    : "Every proctored event already has an active rollcall. Conclude one below before starting another for that same event."
                }
                onStart={handleStartRollCall}
              />

              {activeRollCallEvents.length === 0 &&
              pastRollCallEvents.length === 0 ? (
                <RollCallEmptyStateCard
                  description={
                    "When you start a session it will appear here so you can monitor it and conclude it when needed."
                  }
                  title={"No Rollcalls Yet"}
                />
              ) : (
                <>
                  {activeRollCallEvents.map(renderRollCallCard)}
                  {pastRollCallEvents.map(renderRollCallCard)}
                </>
              )}
            </RollCallCardList>
          </>
        )}
      </S.Panel>
    </S.Container>
  );
};

namespace S {
  export const Container = styled.div`
    label: RollCallsContainer;
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

  export const Panel = styled(Tile)`
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 14px;
  `;

  export const PanelDescription = styled(SubHeading)`
    color: ${(p) => p.theme.colors.textMuted};
    font-size: 16px;
  `;

  export const ActiveViewTile = styled(Tile)`
    display: flex;
    flex-direction: column;
    gap: 12px;
    background-color: ${(p) => p.theme.colors.surfaceRaised};
  `;

  export const EmptyStateTile = styled(ActiveViewTile)`
    gap: 6px;
  `;

  export const ActionCopy = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
  `;

  export const SectionTitle = styled.div`
    font-size: 16px;
    color: ${(p) => p.theme.colors.text};
    font-weight: 700;
  `;

  export const SectionDescription = styled.div`
    font-size: 14px;
    color: ${(p) => p.theme.colors.textMuted};
  `;
}
