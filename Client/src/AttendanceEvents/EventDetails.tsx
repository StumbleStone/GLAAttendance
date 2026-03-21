import { useTheme } from "@emotion/react";
import styled from "@emotion/styled";
import { faPlusCircle, faTrash } from "@fortawesome/free-solid-svg-icons";
import * as React from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { Attendee } from "../Attendees/Attendee";
import { Button } from "../Components/Button/Button";
import { Heading } from "../Components/Heading";
import { LayerHandler } from "../Components/Layer";
import { Search } from "../Components/Search/Search";
import { SearchInput } from "../Components/Search/SearchInput";
import { SubHeading } from "../Components/SubHeading";
import { Tile } from "../Components/Tile";
import { SupaBase, SupaBaseEventKey } from "../SupaBase/SupaBase";
import { EventParticipantsEntry, EventProctorsEntry } from "../SupaBase/types";
import { epochToDate } from "../Tools/Toolbox";
import { EventParticipantsAddWindow } from "./EventParticipantsAddWindow";
import { AttendanceEventCard } from "./Events";

export interface EventDetailsProps {
  supabase: SupaBase;
}

export interface EventParticipantDisplayItem {
  attendee: Attendee | null;
  eventParticipant: EventParticipantsEntry;
  label: string;
  searchKeywords: string[];
}

export interface EventProctorDisplayItem {
  addedLabel: string;
  eventProctor: EventProctorsEntry;
  isCurrentUser: boolean;
  label: string;
}

const EVENT_STATUS_REFRESH_MS = 30 * 1000;
const EVENT_PARTICIPANT_SEARCH_FIELDS: Array<
  keyof EventParticipantDisplayItem
> = ["label", "searchKeywords"];

enum SelfProctorAction {
  ADD = "ADD",
  REMOVE = "REMOVE",
}

function getParticipantDisplayLabel(
  attendee: Attendee | null,
  attendeeId: number,
): string {
  if (!!attendee) {
    return attendee.fullName;
  }

  return `Unknown attendee #${attendeeId}`;
}

function getProctorDisplayLabel(
  supabase: SupaBase,
  userId: string | null,
  currentUserId: string | null,
): string {
  if (!userId) {
    return "Unknown user";
  }

  const label =
    userId === currentUserId && !!supabase.profile
      ? `${supabase.profile.first_name} ${supabase.profile.last_name}`
      : supabase.getUserName(userId);

  return userId === currentUserId ? `${label} (You)` : label;
}

function formatProctorAddedAt(createdAt: string): string {
  return `Added ${epochToDate(new Date(createdAt).getTime(), {
    includeTime: true,
  })}`;
}

export const EventDetails: React.FC = () => {
  const { supabase } = useOutletContext<EventDetailsProps>();
  const theme = useTheme();
  const params = useParams();
  const [revision, forceUpdate] = React.useReducer((x) => x + 1, 0);
  const [currentTime, setCurrentTime] = React.useState<number>(() =>
    Date.now(),
  );
  const [isUpdatingSelfAsProctor, setIsUpdatingSelfAsProctor] =
    React.useState(false);
  const [proctorActionError, setProctorActionError] = React.useState<
    string | null
  >(null);

  React.useEffect(() => {
    const listener = supabase.addListener({
      [SupaBaseEventKey.EVENTS_CHANGED]: forceUpdate,
      [SupaBaseEventKey.EVENT_PARTICIPANTS_CHANGED]: forceUpdate,
      [SupaBaseEventKey.EVENT_PROCTORS_CHANGED]: forceUpdate,
      [SupaBaseEventKey.ATTENDEES_CHANGED]: forceUpdate,
      [SupaBaseEventKey.USERNAMES_LOADED]: forceUpdate,
      [SupaBaseEventKey.USER_PROFILE]: forceUpdate,
      [SupaBaseEventKey.USER_UPDATE]: forceUpdate,
    });

    void Promise.all([
      supabase.attendeesHandler.loadData(),
      supabase.eventParticipantsHandler.loadData(),
      supabase.eventProctorsHandler.loadData(),
      supabase.eventsHandler.loadData(),
    ]);

    if (!supabase.usernamesLoaded) {
      void supabase.loadUsernames();
    }

    return listener;
  }, [supabase]);

  React.useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCurrentTime(Date.now());
    }, EVENT_STATUS_REFRESH_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const eventId = React.useMemo<number | null>(() => {
    const parsedEventId = Number(params.id);
    return Number.isInteger(parsedEventId) ? parsedEventId : null;
  }, [params.id]);

  const events = supabase.eventsHandler.attendanceEvents ?? [];
  const loading =
    !supabase.attendeesHandler.dataLoaded ||
    !supabase.eventParticipantsHandler.dataLoaded ||
    !supabase.eventProctorsHandler.dataLoaded ||
    !supabase.eventsHandler.dataLoaded;
  const selectedEvent =
    eventId === null
      ? null
      : (events.find((event) => event.id === eventId) ?? null);
  const currentUserId = React.useMemo<string | null>(
    () => supabase.user?.id ?? supabase.profile?.uid ?? null,
    [supabase.profile?.uid, supabase.user?.id],
  );
  const participantItems = React.useMemo<EventParticipantDisplayItem[]>(() => {
    if (eventId === null) {
      return [];
    }

    return supabase.eventParticipantsHandler
      .getByEventId(eventId)
      .map((eventParticipant) => {
        const attendee = supabase.attendeesHandler.getById(
          eventParticipant.attendee_id,
        );

        return {
          attendee,
          eventParticipant,
          label: getParticipantDisplayLabel(
            attendee,
            eventParticipant.attendee_id,
          ),
          searchKeywords: attendee
            ? [attendee.name, attendee.surname, ...attendee.allergies]
            : [`Unknown attendee ${eventParticipant.attendee_id}`],
        };
      })
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [eventId, revision, supabase]);
  const proctorItems = React.useMemo<EventProctorDisplayItem[]>(() => {
    if (eventId === null) {
      return [];
    }

    return supabase.eventProctorsHandler
      .getByEventId(eventId)
      .map((eventProctor) => ({
        addedLabel: formatProctorAddedAt(eventProctor.created_at),
        eventProctor,
        isCurrentUser: eventProctor.user_id === currentUserId,
        label: getProctorDisplayLabel(
          supabase,
          eventProctor.user_id,
          currentUserId,
        ),
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [currentUserId, eventId, revision, supabase]);
  const participantsDescription = React.useMemo<string>(() => {
    if (participantItems.length === 1) {
      return "1 participant is assigned to this event.";
    }

    return `${participantItems.length} participants are assigned to this event.`;
  }, [participantItems.length]);
  const proctorsDescription = React.useMemo<string>(() => {
    if (proctorItems.length === 1) {
      return "1 proctor is assigned to this event.";
    }

    return `${proctorItems.length} proctors are assigned to this event.`;
  }, [proctorItems.length]);
  const attendeeCount = React.useMemo<number>(
    () => supabase.attendeesHandler.arr().length,
    [revision, supabase],
  );
  const currentUserProctor = React.useMemo<EventProctorsEntry | null>(() => {
    if (eventId === null || currentUserId === null) {
      return null;
    }

    return supabase.eventProctorsHandler.getByEventAndUserId(
      eventId,
      currentUserId,
    );
  }, [currentUserId, eventId, revision, supabase]);
  const currentUserIsProctor = React.useMemo<boolean>(() => {
    return !!currentUserProctor;
  }, [currentUserProctor]);
  const selfProctorAction = React.useMemo<SelfProctorAction>(() => {
    return currentUserIsProctor
      ? SelfProctorAction.REMOVE
      : SelfProctorAction.ADD;
  }, [currentUserIsProctor]);
  const handleAddParticipantsClick = React.useCallback(() => {
    if (eventId === null) {
      return;
    }

    LayerHandler.AddLayer((layerItem) => (
      <EventParticipantsAddWindow
        eventId={eventId}
        layerItem={layerItem}
        supabase={supabase}
      />
    ));
  }, [eventId, supabase]);
  const handleUpdateSelfAsProctor = React.useCallback(async () => {
    if (eventId === null || currentUserId === null || isUpdatingSelfAsProctor) {
      return;
    }

    setIsUpdatingSelfAsProctor(true);
    setProctorActionError(null);

    const success =
      selfProctorAction === SelfProctorAction.ADD
        ? await supabase.eventProctorsHandler.createEventProctor(
            eventId,
            currentUserId,
          )
        : !!currentUserProctor &&
          (await supabase.eventProctorsHandler.removeEventProctor(
            currentUserProctor.id,
          ));
    setIsUpdatingSelfAsProctor(false);

    if (!success) {
      setProctorActionError(
        selfProctorAction === SelfProctorAction.ADD
          ? "Could not add you as a proctor. Try again."
          : "Could not remove you as a proctor. Try again.",
      );
      return;
    }
  }, [
    currentUserId,
    currentUserProctor,
    eventId,
    isUpdatingSelfAsProctor,
    selfProctorAction,
    supabase,
  ]);

  return (
    <S.Container>
      <S.Panel>
        <Heading>Event</Heading>
        {loading && (
          <S.EmptyStateTile>
            <S.EmptyStateTitle>{"Loading event..."}</S.EmptyStateTitle>
            <S.EmptyStateDescription>
              {"Fetching the selected event details."}
            </S.EmptyStateDescription>
          </S.EmptyStateTile>
        )}
        {!loading && eventId === null && (
          <S.EmptyStateTile>
            <S.EmptyStateTitle>{"Invalid event"}</S.EmptyStateTitle>
            <S.EmptyStateDescription>
              {"The requested event id is not valid."}
            </S.EmptyStateDescription>
          </S.EmptyStateTile>
        )}
        {!loading && eventId !== null && !selectedEvent && (
          <S.EmptyStateTile>
            <S.EmptyStateTitle>{"Event not found"}</S.EmptyStateTitle>
            <S.EmptyStateDescription>
              {"We could not find an event matching this id."}
            </S.EmptyStateDescription>
          </S.EmptyStateTile>
        )}
        {!loading && !!selectedEvent && (
          <>
            <AttendanceEventCard
              event={selectedEvent}
              currentTime={currentTime}
              supabase={supabase}
            />
            <S.ParticipantsPanel>
              <S.ParticipantsHeader>
                <S.ParticipantsHeaderTop>
                  <S.ParticipantsTitle text={"Participants"} />
                  <Button
                    disabled={attendeeCount === 0}
                    icon={faPlusCircle}
                    label={"Add Participants"}
                    onClick={handleAddParticipantsClick}
                  />
                </S.ParticipantsHeaderTop>
                <S.ParticipantsDescription>
                  {participantsDescription}
                </S.ParticipantsDescription>
              </S.ParticipantsHeader>
              <Search
                items={participantItems}
                searchFields={EVENT_PARTICIPANT_SEARCH_FIELDS}
              >
                {({ filteredItems, query, setQuery }) => (
                  <>
                    {participantItems.length > 0 && (
                      <S.ParticipantsSearch
                        placeholder="Search participants..."
                        query={query}
                        onQueryChange={setQuery}
                      />
                    )}
                    {participantItems.length === 0 ? (
                      <S.ParticipantsPlaceholder>
                        {
                          "No participants have been assigned to this event yet."
                        }
                      </S.ParticipantsPlaceholder>
                    ) : filteredItems.length === 0 ? (
                      <S.ParticipantsPlaceholder>
                        {"No participants match this search."}
                      </S.ParticipantsPlaceholder>
                    ) : (
                      <S.ParticipantsList>
                        {filteredItems.map((participantItem) => (
                          <S.ParticipantRow
                            key={participantItem.eventParticipant.id}
                          >
                            <S.ParticipantName>
                              {participantItem.label}
                            </S.ParticipantName>
                          </S.ParticipantRow>
                        ))}
                      </S.ParticipantsList>
                    )}
                  </>
                )}
              </Search>
            </S.ParticipantsPanel>
            <S.ProctorsPanel>
              <S.ProctorsHeader>
                <S.ProctorsHeaderTop>
                  <S.ProctorsTitle text={"Proctors"} />
                  <Button
                    disabled={currentUserId === null || isUpdatingSelfAsProctor}
                    color={
                      selfProctorAction === SelfProctorAction.ADD
                        ? undefined
                        : theme.colors.accent.danger
                    }
                    icon={
                      selfProctorAction === SelfProctorAction.ADD
                        ? faPlusCircle
                        : faTrash
                    }
                    label={
                      isUpdatingSelfAsProctor
                        ? selfProctorAction === SelfProctorAction.ADD
                          ? "Adding..."
                          : "Removing..."
                        : selfProctorAction === SelfProctorAction.ADD
                          ? "Add Me as Proctor"
                          : "Remove Me as Proctor"
                    }
                    onClick={handleUpdateSelfAsProctor}
                  />
                </S.ProctorsHeaderTop>
                <S.ProctorsDescription>
                  {proctorsDescription}
                </S.ProctorsDescription>
              </S.ProctorsHeader>
              {proctorItems.length === 0 ? (
                <S.ProctorsPlaceholder>
                  {"No proctors have been assigned to this event yet."}
                </S.ProctorsPlaceholder>
              ) : (
                <S.ProctorsList>
                  {proctorItems.map((proctorItem) => (
                    <S.ProctorRow key={proctorItem.eventProctor.id}>
                      <S.ProctorName>{proctorItem.label}</S.ProctorName>
                      <S.ProctorMeta>{proctorItem.addedLabel}</S.ProctorMeta>
                    </S.ProctorRow>
                  ))}
                </S.ProctorsList>
              )}
              {!!proctorActionError && (
                <S.ProctorErrorText>{proctorActionError}</S.ProctorErrorText>
              )}
            </S.ProctorsPanel>
          </>
        )}
      </S.Panel>
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

  export const EmptyStateTile = styled(Tile)`
    display: flex;
    flex-direction: column;
    gap: 6px;
    background-color: ${(p) => p.theme.colors.surfaceRaised};
  `;

  export const EmptyStateTitle = styled.div`
    font-size: 16px;
    color: ${(p) => p.theme.colors.text};
    font-weight: 700;
  `;

  export const EmptyStateDescription = styled.div`
    font-size: 14px;
    color: ${(p) => p.theme.colors.textMuted};
  `;

  export const ParticipantsPanel = styled(Tile)`
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 14px;
    background-color: ${(p) => p.theme.colors.surfaceRaised};
  `;

  export const ParticipantsHeader = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
  `;

  export const ParticipantsHeaderTop = styled.div`
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
  `;

  export const ParticipantsTitle = styled(SubHeading)`
    color: ${(p) => p.theme.colors.text};
    font-size: 20px;
  `;

  export const ParticipantsDescription = styled.div`
    font-size: 14px;
    color: ${(p) => p.theme.colors.textMuted};
  `;

  export const ParticipantsPlaceholder = styled.div`
    min-height: 96px;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 14px;
    border: 1px dashed ${(p) => p.theme.colors.border};
    border-radius: ${(p) => p.theme.radius.md};
    color: ${(p) => p.theme.colors.textMuted};
    background-color: ${(p) => p.theme.colors.surface};
    font-size: 14px;
  `;

  export const ParticipantsSearch = styled(SearchInput)`
    width: 100%;
  `;

  export const ParticipantsList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
  `;

  export const ParticipantRow = styled.div`
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 12px 14px;
    border: 1px solid ${(p) => p.theme.colors.border};
    border-radius: ${(p) => p.theme.radius.md};
    background-color: ${(p) => p.theme.colors.surface};
  `;

  export const ParticipantName = styled.div`
    color: ${(p) => p.theme.colors.text};
    font-size: 16px;
    font-weight: 700;
  `;

  export const ProctorsPanel = styled(Tile)`
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 14px;
    background-color: ${(p) => p.theme.colors.surfaceRaised};
  `;

  export const ProctorsHeader = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
  `;

  export const ProctorsHeaderTop = styled.div`
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
  `;

  export const ProctorsTitle = styled(SubHeading)`
    color: ${(p) => p.theme.colors.text};
    font-size: 20px;
  `;

  export const ProctorsDescription = styled.div`
    font-size: 14px;
    color: ${(p) => p.theme.colors.textMuted};
  `;

  export const ProctorsPlaceholder = styled.div`
    min-height: 96px;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 14px;
    border: 1px dashed ${(p) => p.theme.colors.border};
    border-radius: ${(p) => p.theme.radius.md};
    color: ${(p) => p.theme.colors.textMuted};
    background-color: ${(p) => p.theme.colors.surface};
    font-size: 14px;
  `;

  export const ProctorsList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
  `;

  export const ProctorRow = styled.div`
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 12px 14px;
    border: 1px solid ${(p) => p.theme.colors.border};
    border-radius: ${(p) => p.theme.radius.md};
    background-color: ${(p) => p.theme.colors.surface};
  `;

  export const ProctorName = styled.div`
    color: ${(p) => p.theme.colors.text};
    font-size: 16px;
    font-weight: 700;
  `;

  export const ProctorMeta = styled.div`
    color: ${(p) => p.theme.colors.textMuted};
    font-size: 13px;
  `;

  export const ProctorErrorText = styled.div`
    color: ${(p) => p.theme.colors.accent.danger};
    font-size: 13px;
  `;
}
