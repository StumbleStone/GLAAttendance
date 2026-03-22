import styled from "@emotion/styled";
import {
  faCheckSquare,
  faClock,
  faMinusSquare,
  faQrcode,
  faXmarkSquare,
} from "@fortawesome/free-solid-svg-icons";
import * as React from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { AttendeeStatus } from "../Attendees/Attendee";
import { ShowAttendeeWindow } from "../Attendees/AttendeeWindow/AttendeeWindow";
import { CaptureWindow } from "../Capture/CaptureWindow";
import { Backdrop } from "../Components/Backdrop/Backdrop";
import { Button } from "../Components/Button/Button";
import { Chip } from "../Components/Chip/Chip";
import { Heading } from "../Components/Heading";
import { LoadingSpinner } from "../Components/LoadingSpinner";
import { Search } from "../Components/Search/Search";
import { SearchInput } from "../Components/Search/SearchInput";
import { SubHeading } from "../Components/SubHeading";
import { Tile } from "../Components/Tile";
import { SupaBase, SupaBaseEventKey } from "../SupaBase/SupaBase";
import {
  RollCallEntry,
  RollCallEventEntry,
  RollCallMethod,
} from "../SupaBase/types";
import { DefaultColors, epochToDate } from "../Tools/Toolbox";
import { EventParticipant } from "./EventParticipant";
import {
  RollCallCardActivityState,
  RollCallSessionCard,
} from "./RollCallCardComponents";
import {
  getRollCallEventLabel,
  getRollCallSessionLabel,
} from "./RollCallUtils";
import { ShowRollCallStopPopup } from "./RollCallWindow";

export interface RollCallDetailsProps {
  supabase: SupaBase;
}

enum RollCallParticipantState {
  PRESENT = "present",
  ABSENT = "absent",
  NOT_SCANNED = "not_scanned",
}

export interface RollCallParticipantDisplayItem {
  detailLabel: string;
  eventParticipant: EventParticipant;
  isLate: boolean;
  label: string;
  searchKeywords: string[];
  state: RollCallParticipantState;
  statusLabel: string;
}

const ROLLCALL_PARTICIPANT_SEARCH_FIELDS: Array<
  keyof RollCallParticipantDisplayItem
> = ["label", "searchKeywords", "statusLabel", "detailLabel"];

function getParticipantState(status: AttendeeStatus): RollCallParticipantState {
  switch (status) {
    case AttendeeStatus.PRESENT:
      return RollCallParticipantState.PRESENT;
    case AttendeeStatus.ABSENT:
      return RollCallParticipantState.ABSENT;
    case AttendeeStatus.NOT_SCANNED:
    default:
      return RollCallParticipantState.NOT_SCANNED;
  }
}

function getParticipantStateColor(state: RollCallParticipantState): string {
  switch (state) {
    case RollCallParticipantState.PRESENT:
      return DefaultColors.BrightGreen;
    case RollCallParticipantState.ABSENT:
      return DefaultColors.BrightRed;
    case RollCallParticipantState.NOT_SCANNED:
    default:
      return DefaultColors.BrightGrey;
  }
}

function getParticipantStateIcon(state: RollCallParticipantState) {
  switch (state) {
    case RollCallParticipantState.PRESENT:
      return faCheckSquare;
    case RollCallParticipantState.ABSENT:
      return faXmarkSquare;
    case RollCallParticipantState.NOT_SCANNED:
    default:
      return faMinusSquare;
  }
}

function formatParticipantActivity(
  latestRollCall: RollCallEntry | null,
  supabase: SupaBase,
): string {
  if (!latestRollCall) {
    return "No scan recorded yet.";
  }

  const methodLabel =
    latestRollCall.created_method === RollCallMethod.MANUAL
      ? "Marked manually"
      : "Scanned via QR";
  const createdAtLabel = epochToDate(
    new Date(latestRollCall.created_at).getTime(),
    {
      includeTime: true,
    },
  );
  const createdByLabel = supabase.getUserName(latestRollCall.created_by, {
    nameOnly: true,
  });

  return `${methodLabel} by ${createdByLabel} on ${createdAtLabel}`;
}

function formatRollCallDate(value: string | null | undefined): string {
  if (!value) {
    return "--";
  }

  return epochToDate(new Date(value).getTime(), {
    includeTime: true,
  });
}

function formatRollCallUser(
  userId: string | null | undefined,
  supabase: SupaBase,
): string {
  if (!userId) {
    return "--";
  }

  return supabase.getUserName(userId);
}

export const RollCallDetails: React.FC = () => {
  const { supabase } = useOutletContext<RollCallDetailsProps>();
  const params = useParams();
  const [revision, forceUpdate] = React.useReducer((x) => x + 1, 0);
  const [scannerOpen, setScannerOpen] = React.useState(false);

  React.useEffect(() => {
    const listener = supabase.addListener({
      [SupaBaseEventKey.ATTENDEES_CHANGED]: forceUpdate,
      [SupaBaseEventKey.EVENT_PARTICIPANTS_CHANGED]: forceUpdate,
      [SupaBaseEventKey.EVENTS_CHANGED]: forceUpdate,
      [SupaBaseEventKey.LOADED_ROLLCALLS]: forceUpdate,
      [SupaBaseEventKey.LOADED_ROLLCALL_EVENTS]: forceUpdate,
      [SupaBaseEventKey.UPDATED_ROLLCALL_EVENT]: forceUpdate,
      [SupaBaseEventKey.USERNAMES_LOADED]: forceUpdate,
      [SupaBaseEventKey.USER_PROFILE]: forceUpdate,
      [SupaBaseEventKey.USER_UPDATE]: forceUpdate,
    });

    void Promise.all([
      supabase.attendeesHandler.loadData(),
      supabase.eventParticipantsHandler.loadData(),
      supabase.eventsHandler.loadData(),
      supabase.rollCallEventsHandler.loadData(),
      supabase.rollCallsHandler.loadData(),
    ]);

    if (!supabase.usernamesLoaded) {
      void supabase.loadUsernames();
    }

    return listener;
  }, [supabase]);

  const rollCallEventId = React.useMemo<number | null>(() => {
    const parsedRollCallEventId = Number(params.rollcallid);
    return Number.isInteger(parsedRollCallEventId)
      ? parsedRollCallEventId
      : null;
  }, [params.rollcallid]);

  const loading =
    !supabase.attendeesHandler.dataLoaded ||
    !supabase.eventParticipantsHandler.dataLoaded ||
    !supabase.eventsHandler.dataLoaded ||
    !supabase.rollcallEventsLoaded ||
    !supabase.rollCallsHandler.dataLoaded;
  const rollCallEvent = React.useMemo<RollCallEventEntry | null>(() => {
    if (rollCallEventId == null) {
      return null;
    }

    return supabase.getRollCallEventById(rollCallEventId);
  }, [revision, rollCallEventId, supabase]);
  const eventRecord = React.useMemo(() => {
    if (rollCallEvent?.event_id == null) {
      return null;
    }

    return (
      supabase.eventsHandler.attendanceEvents.find(
        (event) => event.id === rollCallEvent.event_id,
      ) ?? null
    );
  }, [revision, rollCallEvent?.event_id, supabase]);
  const participantItems = React.useMemo<
    RollCallParticipantDisplayItem[]
  >(() => {
    if (!rollCallEvent) {
      return [];
    }

    return supabase
      .getEventParticipantsForRollCallEvent(rollCallEvent.id)
      .map((eventParticipant) => {
        const statusLabel = eventParticipant.status(rollCallEvent);
        const latestRollCall = eventParticipant.getLatestRollCall(
          rollCallEvent.id,
        );

        return {
          detailLabel: formatParticipantActivity(latestRollCall, supabase),
          eventParticipant,
          isLate: eventParticipant.isLate(rollCallEvent),
          label: eventParticipant.attendee.fullName,
          searchKeywords: [
            eventParticipant.attendee.name,
            eventParticipant.attendee.surname,
            ...eventParticipant.attendee.allergies,
          ],
          state: getParticipantState(statusLabel),
          statusLabel,
        };
      })
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [revision, rollCallEvent, supabase]);
  const isActive = !!rollCallEvent && !rollCallEvent.closed_at;
  const activityState = isActive
    ? RollCallCardActivityState.ACTIVE
    : RollCallCardActivityState.CLOSED;
  const title = getRollCallEventLabel(
    eventRecord,
    rollCallEvent?.event_id ?? null,
  );
  const sessionLabel = getRollCallSessionLabel(rollCallEvent);
  const participantCount = rollCallEvent
    ? supabase.countTrackedAttendees(rollCallEvent.id)
    : 0;
  const presentCount = rollCallEvent
    ? supabase.countPresentAttendees(rollCallEvent.id)
    : 0;
  const absentCount = rollCallEvent
    ? supabase.countAbsentAttendees(rollCallEvent.id)
    : 0;
  const unscannedCount = rollCallEvent
    ? supabase.countUnScannedAttendees(rollCallEvent.id)
    : 0;

  const handleCloseRollCall = React.useCallback(() => {
    if (!rollCallEvent || !!rollCallEvent.closed_at) {
      return;
    }

    ShowRollCallStopPopup(supabase, rollCallEvent);
  }, [rollCallEvent, supabase]);

  const handleOpenScanner = React.useCallback(() => {
    if (!rollCallEvent || !!rollCallEvent.closed_at) {
      return;
    }

    setScannerOpen(true);
  }, [rollCallEvent]);

  const handleCloseScanner = React.useCallback(() => {
    setScannerOpen(false);
  }, []);

  const handleOpenParticipant = React.useCallback(
    (eventParticipant: EventParticipant) => {
      if (!rollCallEvent) {
        return;
      }

      ShowAttendeeWindow(supabase, eventParticipant.attendee, rollCallEvent.id);
    },
    [rollCallEvent, supabase],
  );

  React.useEffect(() => {
    if (isActive) {
      return;
    }

    setScannerOpen(false);
  }, [isActive]);

  return (
    <S.Container>
      <S.Panel>
        <Heading>{"Rollcall"}</Heading>
        <S.PanelDescription>
          {
            "Review this rollcall session, monitor participant statuses, and conclude it here when needed."
          }
        </S.PanelDescription>

        {loading ? (
          <S.LoadingWrap>
            <LoadingSpinner size={70} />
          </S.LoadingWrap>
        ) : !rollCallEvent ? (
          <S.EmptyStateTile>
            <S.SectionTitle>{"Rollcall Not Found"}</S.SectionTitle>
            <S.SectionDescription>
              {
                "This rollcall could not be found, or it is no longer available for your account."
              }
            </S.SectionDescription>
          </S.EmptyStateTile>
        ) : (
          <>
            <RollCallSessionCard
              absentCount={absentCount}
              activityState={activityState}
              onEndRollCall={isActive ? handleCloseRollCall : undefined}
              participantCount={participantCount}
              presentCount={presentCount}
              sessionLabel={sessionLabel}
              title={title}
              unscannedCount={unscannedCount}
            />

            {isActive && (
              <S.ActionRow>
                <S.ScanButton
                  color={DefaultColors.BrightCyan}
                  icon={faQrcode}
                  onClick={handleOpenScanner}
                >
                  {"Open QR Scanner"}
                </S.ScanButton>
              </S.ActionRow>
            )}

            <S.DetailPanel>
              <S.SectionTitle>{"Session Details"}</S.SectionTitle>
              <S.DetailGrid>
                <S.DetailItem>
                  <S.DetailLabel>{"Event"}</S.DetailLabel>
                  <S.DetailValue>{title}</S.DetailValue>
                </S.DetailItem>
                <S.DetailItem>
                  <S.DetailLabel>{"Started"}</S.DetailLabel>
                  <S.DetailValue>
                    {formatRollCallDate(rollCallEvent.created_at)}
                  </S.DetailValue>
                </S.DetailItem>
                <S.DetailItem>
                  <S.DetailLabel>{"Started By"}</S.DetailLabel>
                  <S.DetailValue>
                    {formatRollCallUser(rollCallEvent.created_by, supabase)}
                  </S.DetailValue>
                </S.DetailItem>
                <S.DetailItem>
                  <S.DetailLabel>{"Closed"}</S.DetailLabel>
                  <S.DetailValue>
                    {formatRollCallDate(rollCallEvent.closed_at)}
                  </S.DetailValue>
                </S.DetailItem>
                <S.DetailItem>
                  <S.DetailLabel>{"Closed By"}</S.DetailLabel>
                  <S.DetailValue>
                    {formatRollCallUser(rollCallEvent.closed_by, supabase)}
                  </S.DetailValue>
                </S.DetailItem>
              </S.DetailGrid>
            </S.DetailPanel>

            <S.ParticipantsPanel>
              <S.SectionTitle>{"Participants"}</S.SectionTitle>
              <S.SectionDescription>
                {participantCount === 1
                  ? "1 participant belongs to this rollcall event."
                  : `${participantCount} participants belong to this rollcall event.`}
              </S.SectionDescription>

              <Search
                items={participantItems}
                searchFields={ROLLCALL_PARTICIPANT_SEARCH_FIELDS}
              >
                {({ filteredItems, query, setQuery }) => (
                  <>
                    <SearchInput
                      onQueryChange={setQuery}
                      placeholder={"Search participants..."}
                      query={query}
                    />

                    {filteredItems.length === 0 ? (
                      <S.EmptyParticipantsState>
                        {participantItems.length === 0
                          ? "No participants are assigned to this rollcall event yet."
                          : "No participants matched your search."}
                      </S.EmptyParticipantsState>
                    ) : (
                      <S.ParticipantList>
                        {filteredItems.map((item) => (
                          <S.ParticipantRow
                            data-state={item.state}
                            key={item.eventParticipant.participantId}
                            onClick={() =>
                              handleOpenParticipant(item.eventParticipant)
                            }
                            onKeyDown={(event) => {
                              if (event.key !== "Enter" && event.key !== " ") {
                                return;
                              }

                              event.preventDefault();
                              handleOpenParticipant(item.eventParticipant);
                            }}
                            role={"button"}
                            tabIndex={0}
                          >
                            <S.ParticipantCopy>
                              <S.ParticipantName>
                                {item.label}
                              </S.ParticipantName>
                              <S.ParticipantDetail>
                                {item.detailLabel}
                              </S.ParticipantDetail>
                            </S.ParticipantCopy>
                            <S.ParticipantBadgeColumn>
                              <S.ParticipantStatusChip
                                icon={getParticipantStateIcon(item.state)}
                                label={item.statusLabel}
                                state={item.state}
                                title={item.statusLabel}
                              />
                              {item.isLate && (
                                <S.LateChip
                                  icon={faClock}
                                  label={"Late"}
                                  title={
                                    "Recorded present after rollcall closed"
                                  }
                                />
                              )}
                            </S.ParticipantBadgeColumn>
                          </S.ParticipantRow>
                        ))}
                      </S.ParticipantList>
                    )}
                  </>
                )}
              </Search>
            </S.ParticipantsPanel>
          </>
        )}
      </S.Panel>
      {scannerOpen && rollCallEvent && (
        <S.ScannerBackdrop onClose={handleCloseScanner}>
          <CaptureWindow
            isCapturing={scannerOpen}
            rollCallEventId={rollCallEvent.id}
            supabase={supabase}
          />
        </S.ScannerBackdrop>
      )}
    </S.Container>
  );
};

namespace S {
  export const Container = styled.div`
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

  export const DetailPanel = styled(Tile)`
    display: flex;
    flex-direction: column;
    gap: 12px;
    background-color: ${(p) => p.theme.colors.surfaceRaised};
  `;

  export const ParticipantsPanel = styled(DetailPanel)`
    gap: 10px;
  `;

  export const ActionRow = styled.div`
    display: flex;
    justify-content: flex-start;
  `;

  export const ScanButton = styled(Button)`
    justify-content: center;
  `;

  export const LoadingWrap = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 220px;
  `;

  export const EmptyStateTile = styled(DetailPanel)`
    gap: 6px;
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

  export const DetailGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 12px;
  `;

  export const DetailItem = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  `;

  export const DetailLabel = styled.div`
    font-size: 13px;
    color: ${(p) => p.theme.colors.textMuted};
    text-transform: uppercase;
    letter-spacing: 0.08em;
  `;

  export const DetailValue = styled.div`
    font-size: 16px;
    color: ${(p) => p.theme.colors.text};
    word-break: break-word;
  `;

  export const EmptyParticipantsState = styled.div`
    padding: 16px;
    border: 1px dashed ${(p) => p.theme.colors.borderSubtle};
    border-radius: ${(p) => p.theme.radius.md};
    color: ${(p) => p.theme.colors.textMuted};
    background-color: ${(p) => `${p.theme.colors.surfaceRaised}66`};
  `;

  export const ParticipantList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 10px;
  `;

  export const ParticipantRow = styled.div`
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: start;
    gap: 12px;
    padding: 12px 14px;
    border-radius: ${(p) => p.theme.radius.md};
    border: 1px solid ${(p) => p.theme.colors.border};
    background-color: ${(p) => p.theme.colors.surface};

    &[data-state="present"] {
      border-color: ${(p) => `${p.theme.colors.accent.success}55`};
      background-color: ${(p) => `${p.theme.colors.accent.success}10`};
    }

    &[data-state="absent"] {
      border-color: ${(p) => `${p.theme.colors.accent.danger}55`};
      background-color: ${(p) => `${p.theme.colors.accent.danger}10`};
    }

    &[data-state="not_scanned"] {
      border-color: ${(p) => `${p.theme.colors.textMuted}44`};
      background-color: ${(p) => `${p.theme.colors.textMuted}0c`};
    }

    cursor: pointer;
    transition:
      border-color 120ms ease,
      box-shadow 120ms ease,
      background-color 120ms ease;

    &:hover {
      box-shadow:
        ${(p) => p.theme.shadow.tile},
        0 0 0 1px ${(p) => `${p.theme.colors.accent.primary}22`};
    }

    &:focus-visible {
      outline: none;
      border-color: ${(p) => p.theme.colors.accent.primary};
      box-shadow:
        ${(p) => p.theme.shadow.tile},
        0 0 0 2px ${(p) => `${p.theme.colors.accent.primary}33`};
    }
  `;

  export const ParticipantCopy = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  `;

  export const ParticipantName = styled.div`
    font-size: 17px;
    color: ${(p) => p.theme.colors.text};
    font-weight: 700;
    word-break: break-word;
  `;

  export const ParticipantDetail = styled.div`
    font-size: 13px;
    color: ${(p) => p.theme.colors.textMuted};
    word-break: break-word;
  `;

  export const ParticipantStatusChip = styled(Chip)<{
    state: RollCallParticipantState;
  }>`
    justify-self: end;
    align-self: start;
    color: ${(p) => getParticipantStateColor(p.state)};
    border-color: ${(p) => `${getParticipantStateColor(p.state)}55`};
    background-color: ${(p) => `${getParticipantStateColor(p.state)}14`};
    font-size: 12px;
    padding: 5px 8px;
  `;

  export const ParticipantBadgeColumn = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 6px;
  `;

  export const LateChip = styled(Chip)`
    color: ${DefaultColors.BrightYellow};
    border-color: ${`${DefaultColors.BrightYellow}55`};
    background-color: ${`${DefaultColors.BrightYellow}14`};
    font-size: 12px;
    padding: 5px 8px;
  `;

  export const ScannerBackdrop = styled(Backdrop)`
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 20;
  `;
}
