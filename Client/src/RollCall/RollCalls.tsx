import styled from "@emotion/styled";
import * as React from "react";
import { useOutletContext } from "react-router-dom";
import { Chip } from "../Components/Chip/Chip";
import { Heading } from "../Components/Heading";
import { SubHeading } from "../Components/SubHeading";
import { Tile } from "../Components/Tile";
import { SupaBase, SupaBaseEventKey } from "../SupaBase/SupaBase";
import { EventsEntry, RollCallEventEntry } from "../SupaBase/types";
import { epochToDate } from "../Tools/Toolbox";
import { RollCallDisplay } from "./RollCallDisplay";

export interface RollCallsProps {
  supabase: SupaBase;
}

enum RollCallActivityState {
  NONE = "none",
  ACTIVE = "active",
  CLOSED = "closed",
}

interface RollCallStatusSummary {
  description: string;
  label: string;
  state: RollCallActivityState;
}

function getRollCallEventLabel(
  event: EventsEntry | null,
  eventId: number | null,
): string {
  const eventName = event?.name?.trim();
  if (!!eventName) {
    return eventName;
  }

  if (eventId != null) {
    return `Event #${eventId}`;
  }

  return "Unassigned Event";
}

function formatRollCallTimestamp(timestamp: string | null): string {
  if (!timestamp) {
    return "--";
  }

  return epochToDate(new Date(timestamp).getTime(), {
    includeTime: true,
  });
}

function getRollCallStatusSummary(
  currentRollCallEvent: RollCallEventEntry | null,
): RollCallStatusSummary {
  if (!currentRollCallEvent) {
    return {
      state: RollCallActivityState.NONE,
      label: "No Session",
      description: "There is no rollcall session yet.",
    };
  }

  if (currentRollCallEvent.closed_by != null) {
    return {
      state: RollCallActivityState.CLOSED,
      label: "Closed",
      description: "The most recent rollcall has concluded.",
    };
  }

  return {
    state: RollCallActivityState.ACTIVE,
    label: "In Progress",
    description: "A rollcall is currently active.",
  };
}

export const RollCalls: React.FC = () => {
  const { supabase } = useOutletContext<RollCallsProps>();
  const [, forceUpdate] = React.useReducer((x) => x + 1, 0);
  const [loading, setLoading] = React.useState<boolean>(() => {
    return (
      !supabase.attendeesHandler.dataLoaded ||
      !supabase.eventProctorsHandler.dataLoaded ||
      !supabase.eventsHandler.dataLoaded ||
      !supabase.rollcallEventsLoaded
    );
  });

  React.useEffect(() => {
    let active = true;
    const listener = supabase.addListener({
      [SupaBaseEventKey.ATTENDEES_CHANGED]: forceUpdate,
      [SupaBaseEventKey.EVENT_PROCTORS_CHANGED]: forceUpdate,
      [SupaBaseEventKey.EVENTS_CHANGED]: forceUpdate,
      [SupaBaseEventKey.LOADED_ROLLCALLS]: forceUpdate,
      [SupaBaseEventKey.LOADED_ROLLCALL_EVENTS]: forceUpdate,
      [SupaBaseEventKey.UPDATED_ROLLCALL_EVENT]: forceUpdate,
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
  const proctoredEventIds = React.useMemo<number[]>(() => {
    if (!currentUserId) {
      return [];
    }

    return supabase.eventProctorsHandler
      .getByUserId(currentUserId)
      .map((eventProctor) => eventProctor.event_id)
      .filter((eventId): eventId is number => Number.isInteger(eventId));
  }, [currentUserId, supabase]);

  const proctoredEventIdSet = React.useMemo<Set<number>>(() => {
    return new Set(proctoredEventIds);
  }, [proctoredEventIds]);

  const proctoredEvents = React.useMemo<EventsEntry[]>(() => {
    return supabase.eventsHandler.attendanceEvents.filter((event) =>
      proctoredEventIdSet.has(event.id),
    );
  }, [proctoredEventIdSet, supabase]);

  const currentRollCallEvent = React.useMemo<RollCallEventEntry | null>(() => {
    return supabase.getLatestRollCallEventByEventIds(proctoredEventIds);
  }, [proctoredEventIds, supabase]);

  const currentRollCallEventId = currentRollCallEvent?.id ?? null;
  const statusSummary = React.useMemo<RollCallStatusSummary>(() => {
    return getRollCallStatusSummary(currentRollCallEvent);
  }, [currentRollCallEvent]);

  const presentCount = supabase.countPresentAttendees(currentRollCallEventId);
  const absentCount = supabase.countAbsentAttendees(currentRollCallEventId);
  const unscannedCount = supabase.countUnScannedAttendees(
    currentRollCallEventId,
  );
  const totalTrackedCount = supabase.countTrackedAttendees(
    currentRollCallEventId,
  );
  const currentEventRecord =
    currentRollCallEvent?.event_id != null
      ? (proctoredEvents.find(
          (event) => event.id === currentRollCallEvent.event_id,
        ) ??
        supabase.eventsHandler.attendanceEvents.find(
          (event) => event.id === currentRollCallEvent.event_id,
        ) ??
        null)
      : null;
  const currentEventLabel = getRollCallEventLabel(
    currentEventRecord,
    currentRollCallEvent?.event_id ?? null,
  );
  const currentRollCallName =
    currentRollCallEvent?.description?.trim() || "Untitled";
  const createdByLabel = currentRollCallEvent
    ? supabase.getUserName(currentRollCallEvent.created_by, {
        nameOnly: true,
      })
    : "--";
  const closedByLabel = currentRollCallEvent?.closed_by
    ? supabase.getUserName(currentRollCallEvent.closed_by, {
        nameOnly: true,
      })
    : null;
  const hasProctoredEvents = proctoredEventIds.length > 0;

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
            <S.ActiveViewTile>
              <S.ActionCopy>
                <S.SectionTitle>{"Rollcall Controls"}</S.SectionTitle>
                <S.SectionDescription>
                  {
                    "Open the rollcall manager to start or conclude a session for one of your assigned events."
                  }
                </S.SectionDescription>
              </S.ActionCopy>
              <RollCallDisplay
                allowedEventIds={proctoredEventIds}
                rollCallEvent={currentRollCallEvent}
                supabase={supabase}
              />
            </S.ActiveViewTile>

            <S.ActiveViewTile>
              <S.SectionTitle>{"Current Overview"}</S.SectionTitle>
              <S.SectionDescription>
                {statusSummary.description}
              </S.SectionDescription>
              <S.StatsRow>
                <S.StatusChip
                  activityState={statusSummary.state}
                  label={statusSummary.label}
                />
                <S.EventChip label={currentEventLabel} />
                <S.CountChip
                  label={`${proctoredEvents.length} Proctored Events`}
                />
                <S.CountChip label={`${presentCount} Present`} />
                <S.CountChip label={`${absentCount} Absent`} />
                <S.CountChip label={`${unscannedCount} Unscanned`} />
                <S.CountChip label={`${totalTrackedCount} Participants`} />
              </S.StatsRow>
            </S.ActiveViewTile>

            <S.ActiveViewTile>
              <S.SectionTitle>{"Latest Session"}</S.SectionTitle>
              {!currentRollCallEvent ? (
                <S.SectionDescription>
                  {"No rollcall has been started yet."}
                </S.SectionDescription>
              ) : (
                <S.DetailsGrid>
                  <S.DetailItem>
                    <S.DetailLabel>{"Event"}</S.DetailLabel>
                    <S.DetailValue>{currentEventLabel}</S.DetailValue>
                  </S.DetailItem>
                  <S.DetailItem>
                    <S.DetailLabel>{"Session"}</S.DetailLabel>
                    <S.DetailValue>
                      {`#${currentRollCallEvent.counter} ${currentRollCallName}`}
                    </S.DetailValue>
                  </S.DetailItem>
                  <S.DetailItem>
                    <S.DetailLabel>{"Started"}</S.DetailLabel>
                    <S.DetailValue>
                      {formatRollCallTimestamp(currentRollCallEvent.created_at)}
                    </S.DetailValue>
                  </S.DetailItem>
                  <S.DetailItem>
                    <S.DetailLabel>{"Started By"}</S.DetailLabel>
                    <S.DetailValue>{createdByLabel}</S.DetailValue>
                  </S.DetailItem>
                  <S.DetailItem>
                    <S.DetailLabel>{"Closed"}</S.DetailLabel>
                    <S.DetailValue>
                      {formatRollCallTimestamp(currentRollCallEvent.closed_at)}
                    </S.DetailValue>
                  </S.DetailItem>
                  <S.DetailItem>
                    <S.DetailLabel>{"Closed By"}</S.DetailLabel>
                    <S.DetailValue>{closedByLabel ?? "--"}</S.DetailValue>
                  </S.DetailItem>
                </S.DetailsGrid>
              )}
            </S.ActiveViewTile>
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

  export const StatsRow = styled.div`
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  `;

  export const StatusChip = styled(Chip)<{
    activityState: RollCallActivityState;
  }>`
    color: ${(p) =>
      p.activityState === RollCallActivityState.ACTIVE
        ? p.theme.colors.accent.success
        : p.activityState === RollCallActivityState.CLOSED
          ? p.theme.colors.textMuted
          : p.theme.colors.accent.warning};
    border-color: ${(p) =>
      p.activityState === RollCallActivityState.ACTIVE
        ? `${p.theme.colors.accent.success}55`
        : p.activityState === RollCallActivityState.CLOSED
          ? `${p.theme.colors.textMuted}55`
          : `${p.theme.colors.accent.warning}55`};
    background-color: ${(p) =>
      p.activityState === RollCallActivityState.ACTIVE
        ? `${p.theme.colors.accent.success}14`
        : p.activityState === RollCallActivityState.CLOSED
          ? `${p.theme.colors.textMuted}14`
          : `${p.theme.colors.accent.warning}14`};
    font-size: 12px;
  `;

  export const CountChip = styled(Chip)`
    color: ${(p) => p.theme.colors.accent.primary};
    border-color: ${(p) => `${p.theme.colors.accent.primary}44`};
    background-color: ${(p) => `${p.theme.colors.accent.primary}12`};
    font-size: 12px;
  `;

  export const EventChip = styled(Chip)`
    color: ${(p) => p.theme.colors.accent.success};
    border-color: ${(p) => `${p.theme.colors.accent.success}44`};
    background-color: ${(p) => `${p.theme.colors.accent.success}12`};
    font-size: 12px;
  `;

  export const HiddenNotice = styled.div`
    color: ${(p) => p.theme.colors.accent.warning};
    font-size: 14px;
  `;

  export const DetailsGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 10px;
  `;

  export const DetailItem = styled.div`
    display: flex;
    flex-direction: column;
    gap: 2px;
  `;

  export const DetailLabel = styled.div`
    font-size: 12px;
    color: ${(p) => p.theme.colors.textMuted};
    letter-spacing: 0.08em;
    text-transform: uppercase;
    font-weight: 700;
  `;

  export const DetailValue = styled.div`
    font-size: 14px;
    color: ${(p) => p.theme.colors.text};
  `;
}
