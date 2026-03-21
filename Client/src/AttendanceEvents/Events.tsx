import { useTheme } from "@emotion/react";
import styled from "@emotion/styled";
import {
  faCancel,
  faPlusCircle,
  faUser,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import * as React from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Button, ButtonContainer } from "../Components/Button/Button";
import { Chip } from "../Components/Chip/Chip";
import { Heading } from "../Components/Heading";
import { LabelDateInput } from "../Components/Inputs/label/LabelDateInput";
import { LabelTextInput } from "../Components/Inputs/label/LabelTextInput";
import { SubHeading } from "../Components/SubHeading";
import { Tile } from "../Components/Tile";
import { SupaBase, SupaBaseEventKey } from "../SupaBase/SupaBase";
import { EventsEntry } from "../SupaBase/types";
import { epochToDate, Toolbox } from "../Tools/Toolbox";

export interface EventsProps {
  supabase: SupaBase;
}

const EVENT_STATUS_REFRESH_MS = 30 * 1000;

enum EventTimingStatus {
  ACTIVE = "active",
  UPCOMING = "upcoming",
  CONCLUDED = "concluded",
  UNSCHEDULED = "unscheduled",
}

enum ActionHintTone {
  DEFAULT = "default",
  READY = "ready",
  ERROR = "error",
}

enum ButtonPosition {
  LEFT = "left",
  RIGHT = "right",
}

export const Events: React.FC = () => {
  const { supabase } = useOutletContext<EventsProps>();
  const nav = useNavigate();
  const [, forceUpdate] = React.useReducer((x) => x + 1, 0);
  const [currentTime, setCurrentTime] = React.useState<number>(() =>
    Date.now(),
  );

  React.useEffect(() => {
    const listener = supabase.addListener({
      [SupaBaseEventKey.EVENTS_CHANGED]: forceUpdate,
      [SupaBaseEventKey.EVENT_PARTICIPANTS_CHANGED]: forceUpdate,
      [SupaBaseEventKey.EVENT_PROCTORS_CHANGED]: forceUpdate,
      [SupaBaseEventKey.USERNAMES_LOADED]: forceUpdate,
    });

    void Promise.all([
      supabase.eventsHandler.loadData(),
      supabase.eventParticipantsHandler.loadData(),
      supabase.eventProctorsHandler.loadData(),
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

  const events = supabase.eventsHandler.attendanceEvents ?? [];
  const loading =
    !supabase.eventsHandler.dataLoaded ||
    !supabase.eventParticipantsHandler.dataLoaded ||
    !supabase.eventProctorsHandler.dataLoaded;
  const handleOpenEvent = React.useCallback(
    (eventId: number) => {
      nav(`/event/${eventId}`);
    },
    [nav],
  );

  return (
    <S.Container>
      <S.Panel>
        <Heading>Events</Heading>
        <EventCreationPanel supabase={supabase} />
        <S.ListSection>
          <S.ListHeader>
            <S.ListTitle>{"Created Events"}</S.ListTitle>
            <S.ActiveViewDescription>
              {"Review the most recently created attendance events."}
            </S.ActiveViewDescription>
          </S.ListHeader>
          {loading && (
            <S.EmptyStateTile>
              <S.ActiveViewTitle>{"Loading events..."}</S.ActiveViewTitle>
              <S.ActiveViewDescription>
                {"Fetching the current event list."}
              </S.ActiveViewDescription>
            </S.EmptyStateTile>
          )}
          {!loading && events.length === 0 && (
            <S.EmptyStateTile>
              <S.ActiveViewTitle>{"No events yet"}</S.ActiveViewTitle>
              <S.ActiveViewDescription>
                {"Create your first event to start building the schedule."}
              </S.ActiveViewDescription>
            </S.EmptyStateTile>
          )}
          {!loading &&
            events.map((event) => (
              <AttendanceEventCard
                key={event.id}
                event={event}
                currentTime={currentTime}
                onClick={() => handleOpenEvent(event.id)}
                showAssignmentCounts={true}
                supabase={supabase}
              />
            ))}
        </S.ListSection>
      </S.Panel>
    </S.Container>
  );
};

function formatEventDateTime(time: string | null): string {
  const epoch = parseTime(time);
  if (epoch === null) {
    return "--";
  }

  return epochToDate(epoch, {
    includeTime: true,
  });
}

function getAssignmentCountLabel(
  count: number,
  singularLabel: string,
  pluralLabel: string,
): string {
  return `${count} ${count === 1 ? singularLabel : pluralLabel}`;
}

function getEventDurationLabel(event: EventsEntry): string | null {
  return Toolbox.formatDurationBetween(
    parseTime(event.start_time),
    parseTime(event.end_time),
  );
}

interface EventStatusSummary {
  label: string;
  status: EventTimingStatus;
  title: string;
}

function getEventStatus(
  event: EventsEntry,
  currentTime: number,
): EventStatusSummary {
  const startEpoch = parseTime(event.start_time);
  const endEpoch = parseTime(event.end_time);

  if (
    startEpoch === null ||
    endEpoch === null ||
    isNaN(currentTime) ||
    endEpoch < startEpoch
  ) {
    return {
      status: EventTimingStatus.UNSCHEDULED,
      label: "Schedule TBD",
      title: "Event start or end time is unavailable.",
    };
  }

  if (currentTime < startEpoch) {
    return {
      status: EventTimingStatus.UPCOMING,
      label: "Not Started",
      title: "Event starts in the future.",
    };
  }

  if (currentTime > endEpoch) {
    return {
      status: EventTimingStatus.CONCLUDED,
      label: "Concluded",
      title: "Event has ended.",
    };
  }

  return {
    status: EventTimingStatus.ACTIVE,
    label: "Active",
    title: "Event is currently active.",
  };
}

export interface AttendanceEventCardProps {
  event: EventsEntry;
  currentTime: number;
  onClick?: () => void;
  showAssignmentCounts?: boolean;
  supabase: SupaBase;
}

export const AttendanceEventCard: React.FC<AttendanceEventCardProps> = (
  props: AttendanceEventCardProps,
) => {
  const {
    event,
    currentTime,
    onClick,
    showAssignmentCounts = false,
    supabase,
  } = props;

  const durationLabel = React.useMemo<string | null>(
    () => getEventDurationLabel(event),
    [event],
  );

  const eventStatus = React.useMemo<EventStatusSummary>(
    () => getEventStatus(event, currentTime),
    [currentTime, event.end_time, event.start_time],
  );

  const creatorName = supabase.getUserName(event.created_by, {
    nameOnly: true,
  });
  const participantCount = showAssignmentCounts
    ? supabase.eventParticipantsHandler.countByEventId(event.id)
    : 0;
  const proctorCount = showAssignmentCounts
    ? supabase.eventProctorsHandler.countByEventId(event.id)
    : 0;

  return (
    <S.EventCardTile clickable={!!onClick} onClick={onClick}>
      <S.EventCardHeader>
        <S.EventCardPrimary>
          <S.EventCardTitle>{event.name || "Untitled Event"}</S.EventCardTitle>
          <S.EventScheduleRow>
            <S.EventScheduleItem>
              <S.EventMetaLabel>{"Start"}</S.EventMetaLabel>
              <S.EventMetaValue>
                {formatEventDateTime(event.start_time)}
              </S.EventMetaValue>
            </S.EventScheduleItem>
            <S.EventScheduleItem>
              <S.EventMetaLabel>{"End"}</S.EventMetaLabel>
              <S.EventMetaValue>
                {formatEventDateTime(event.end_time)}
              </S.EventMetaValue>
            </S.EventScheduleItem>
          </S.EventScheduleRow>
        </S.EventCardPrimary>
        <S.EventCardHeaderMeta>
          <S.EventStatusPill
            eventStatus={eventStatus.status}
            label={eventStatus.label}
            title={eventStatus.title}
          />
          {!!durationLabel && (
            <S.DurationSummary>{durationLabel}</S.DurationSummary>
          )}
        </S.EventCardHeaderMeta>
      </S.EventCardHeader>
      <S.EventMetaRow>
        <S.EventMetaGroup>
          <S.CreatorChip
            icon={faUser}
            iconSize={12}
            label={`${creatorName}`}
            title={`Created by ${creatorName}`}
          />
          {showAssignmentCounts && (
            <S.EventAssignmentChips>
              <S.ParticipantsCountChip
                icon={faUsers}
                iconSize={12}
                label={getAssignmentCountLabel(
                  participantCount,
                  "Participant",
                  "Participants",
                )}
                title={`${participantCount} participants assigned`}
              />
              <S.ProctorsCountChip
                icon={faUser}
                iconSize={12}
                label={getAssignmentCountLabel(
                  proctorCount,
                  "Proctor",
                  "Proctors",
                )}
                title={`${proctorCount} proctors assigned`}
              />
            </S.EventAssignmentChips>
          )}
        </S.EventMetaGroup>
        <S.ActiveViewDescription>
          {`Created ${formatEventDateTime(event.created_at)}`}
        </S.ActiveViewDescription>
      </S.EventMetaRow>
    </S.EventCardTile>
  );
};

function validateTime(time: string): boolean {
  if (!time) {
    return false;
  }

  try {
    if (isNaN(Date.parse(time))) {
      return false;
    }
  } catch (e) {
    return false;
  }

  return true;
}

function parseTime(time: string | null): number | null {
  if (!validateTime(time)) {
    return null;
  }

  const parsedTime = Date.parse(time);
  if (isNaN(parsedTime)) {
    return null;
  }

  return parsedTime;
}

function getNameValidationError(name: string): string | null {
  const trimmedName = name?.trim();
  if (!trimmedName) {
    return "Event name is required.";
  }

  if (trimmedName.length < 3) {
    return "Event name must be at least 3 characters.";
  }

  return null;
}

function getStartTimeValidationError(startTime: string | null): string | null {
  if (!startTime) {
    return "Start time is required.";
  }

  if (!validateTime(startTime)) {
    return "Start time is invalid.";
  }

  return null;
}

function getEndTimeValidationError(
  startTime: string | null,
  endTime: string | null,
): string | null {
  if (!endTime) {
    return "End time is required.";
  }

  if (!validateTime(endTime)) {
    return "End time is invalid.";
  }

  const parsedEndTime = parseTime(endTime);
  if (parsedEndTime === null) {
    return "End time is invalid.";
  }

  const parsedStartTime = parseTime(startTime);
  if (startTime && parsedStartTime === null) {
    return null;
  }

  if (parsedStartTime !== null && parsedEndTime <= parsedStartTime) {
    return "End time must be after start time.";
  }

  return null;
}

export interface EventCreationPanelProps {
  supabase: SupaBase;
}

export const EventCreationPanel: React.FC<EventCreationPanelProps> = (
  props: EventCreationPanelProps,
) => {
  const { supabase } = props;

  const [name, setName] = React.useState("");
  const [startTime, setStartTime] = React.useState<string>("");
  const [endTime, setEndTime] = React.useState<string>("");
  const [nameTouched, setNameTouched] = React.useState(false);
  const [startTimeTouched, setStartTimeTouched] = React.useState(false);
  const [endTimeTouched, setEndTimeTouched] = React.useState(false);
  const [createAttempted, setCreateAttempted] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const resetForm = React.useCallback(() => {
    setName("");
    setStartTime("");
    setEndTime("");
    setNameTouched(false);
    setStartTimeTouched(false);
    setEndTimeTouched(false);
    setCreateAttempted(false);
    setIsSubmitting(false);
    setSubmitError(null);
  }, []);

  const [isCreating, setIsCreating] = React.useState<boolean>(false);
  const handleCreateNewClick = React.useCallback(() => {
    resetForm();
    setIsCreating(() => true);
  }, [resetForm]);
  const handleCancelClick = React.useCallback(() => {
    resetForm();
    setIsCreating(() => false);
  }, [resetForm]);

  const theme = useTheme();

  const onChangeName = React.useCallback(
    (ev: React.ChangeEvent<HTMLInputElement>) => {
      setName(() => ev.target.value);
      setSubmitError(null);
    },
    [],
  );
  const onBlurName = React.useCallback(() => {
    setNameTouched(true);
  }, []);

  const onChangeStartTime = React.useCallback(
    (ev: React.ChangeEvent<HTMLInputElement>) => {
      setStartTime(() => ev.target.value);
      setSubmitError(null);
    },
    [],
  );
  const onBlurStartTime = React.useCallback(() => {
    setStartTimeTouched(true);
  }, []);

  const onChangeEndTime = React.useCallback(
    (ev: React.ChangeEvent<HTMLInputElement>) => {
      setEndTime(() => ev.target.value);
      setSubmitError(null);
    },
    [],
  );
  const onBlurEndTime = React.useCallback(() => {
    setEndTimeTouched(true);
  }, []);

  const nameValidationError = React.useMemo<string | null>(() => {
    return getNameValidationError(name);
  }, [name]);

  const startTimeValidationError = React.useMemo<string | null>(() => {
    return getStartTimeValidationError(startTime);
  }, [startTime]);

  const endTimeValidationError = React.useMemo<string | null>(() => {
    return getEndTimeValidationError(startTime, endTime);
  }, [startTime, endTime]);

  const parsedStartTime = React.useMemo<number | null>(() => {
    return parseTime(startTime);
  }, [startTime]);

  const parsedEndTime = React.useMemo<number | null>(() => {
    return parseTime(endTime);
  }, [endTime]);

  const durationLabel = React.useMemo<string | null>(() => {
    return Toolbox.formatDurationBetween(parsedStartTime, parsedEndTime);
  }, [parsedEndTime, parsedStartTime]);

  const validEvent = React.useMemo<boolean>(() => {
    return (
      nameValidationError === null &&
      startTimeValidationError === null &&
      endTimeValidationError === null
    );
  }, [endTimeValidationError, nameValidationError, startTimeValidationError]);

  const showNameValidationError = React.useMemo<boolean>(() => {
    return !!nameValidationError && (nameTouched || createAttempted);
  }, [createAttempted, nameTouched, nameValidationError]);

  const showStartTimeValidationError = React.useMemo<boolean>(() => {
    return !!startTimeValidationError && (startTimeTouched || createAttempted);
  }, [createAttempted, startTimeTouched, startTimeValidationError]);

  const showEndTimeValidationError = React.useMemo<boolean>(() => {
    return !!endTimeValidationError && (endTimeTouched || createAttempted);
  }, [createAttempted, endTimeTouched, endTimeValidationError]);

  const createActionHint = React.useMemo<string>(() => {
    if (isSubmitting) {
      return "Creating event...";
    }

    if (!!submitError) {
      return submitError;
    }

    if (validEvent) {
      return "";
    }

    if (showNameValidationError) {
      return nameValidationError ?? "Event name is required.";
    }

    if (showStartTimeValidationError) {
      return startTimeValidationError ?? "Start time is required.";
    }

    if (showEndTimeValidationError) {
      return endTimeValidationError ?? "End time is required.";
    }

    return "Enter an event name and valid time range.";
  }, [
    durationLabel,
    endTimeValidationError,
    nameValidationError,
    showEndTimeValidationError,
    showNameValidationError,
    showStartTimeValidationError,
    startTimeValidationError,
    submitError,
    validEvent,
    isSubmitting,
  ]);

  const actionHintTone = React.useMemo<ActionHintTone>(() => {
    if (!!submitError) {
      return ActionHintTone.ERROR;
    }

    return validEvent ? ActionHintTone.READY : ActionHintTone.DEFAULT;
  }, [submitError, validEvent]);

  const handleCreateClick = React.useCallback(async () => {
    setCreateAttempted(true);

    if (!validEvent || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const success = await supabase.createNewAttendanceEvent(
      name,
      startTime,
      endTime,
    );

    if (!success) {
      setIsSubmitting(false);
      setSubmitError("Could not create the event. Try again.");
      return;
    }

    resetForm();
    setIsCreating(false);
  }, [endTime, isSubmitting, name, resetForm, startTime, supabase, validEvent]);

  if (!isCreating) {
    return (
      <S.StyledButtonContainer buttonPosition={ButtonPosition.LEFT}>
        <Button
          label={"Create New Event"}
          icon={faPlusCircle}
          onClick={handleCreateNewClick}
        />
      </S.StyledButtonContainer>
    );
  }

  return (
    <S.ActiveViewTile>
      <S.FormHeader>
        <S.HeaderCopy>
          <S.ActiveViewTitle>{"New Event"}</S.ActiveViewTitle>
          <S.ActiveViewDescription>
            {"Create a new event."}
          </S.ActiveViewDescription>
        </S.HeaderCopy>
      </S.FormHeader>

      <S.FormStack>
        <S.FormSection>
          <LabelTextInput
            label={"Event Name"}
            value={name}
            placeholder={"Summer camping trip"}
            hasError={showNameValidationError}
            onChange={onChangeName}
            onBlur={onBlurName}
          />
          {showNameValidationError && (
            <S.FieldValidationText>{nameValidationError}</S.FieldValidationText>
          )}
        </S.FormSection>

        <S.ScheduleSection>
          <S.ScheduleHeader>
            <S.ScheduleHeading text={"Schedule"} />
            <S.ScheduleDescription>
              {"Pick when the event starts and ends."}
            </S.ScheduleDescription>
          </S.ScheduleHeader>
          <S.TimeGrid>
            <S.TimeField>
              <S.StyledDateInput
                label={"Start Time"}
                value={startTime}
                type={"datetime-local"}
                required={true}
                max={endTime || undefined}
                hasError={showStartTimeValidationError}
                onChange={onChangeStartTime}
                onBlur={onBlurStartTime}
              />
              {showStartTimeValidationError && (
                <S.FieldValidationText>
                  {startTimeValidationError}
                </S.FieldValidationText>
              )}
            </S.TimeField>
            <S.TimeField>
              <S.StyledDateInput
                label={"End Time"}
                value={endTime}
                type={"datetime-local"}
                required={true}
                min={startTime || undefined}
                hasError={showEndTimeValidationError}
                onChange={onChangeEndTime}
                onBlur={onBlurEndTime}
              />
              {showEndTimeValidationError && (
                <S.FieldValidationText>
                  {endTimeValidationError}
                </S.FieldValidationText>
              )}
            </S.TimeField>
          </S.TimeGrid>
          {!!durationLabel && (
            <S.DurationSummary>{`Duration: ${durationLabel}`}</S.DurationSummary>
          )}
        </S.ScheduleSection>

        <S.ActionSection>
          <S.ActionHint tone={actionHintTone}>{createActionHint}</S.ActionHint>
          <S.ActionButtons>
            <S.PrimaryCreateButton
              color={theme.colors.accent.success}
              disabled={!validEvent || isSubmitting}
              label={isSubmitting ? "Creating Event..." : "Create Event"}
              icon={faPlusCircle}
              onClick={handleCreateClick}
            />
            <Button
              label={"Cancel"}
              icon={faCancel}
              color={theme.colors.accent.danger}
              disabled={isSubmitting}
              onClick={handleCancelClick}
            />
          </S.ActionButtons>
        </S.ActionSection>
      </S.FormStack>
    </S.ActiveViewTile>
  );
};

namespace S {
  export const Container = styled.div`
    label: EventsContainer;
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

  export const StyledButtonContainer = styled(ButtonContainer)<{
    buttonPosition: ButtonPosition;
  }>`
    justify-content: ${(p) =>
      p.buttonPosition === ButtonPosition.RIGHT ? "flex-end" : "flex-start"};
  `;

  export const Panel = styled(Tile)`
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 14px;
  `;

  export const ListSection = styled.div`
    display: flex;
    flex-direction: column;
    gap: 10px;
  `;

  export const ListHeader = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
  `;

  export const ListTitle = styled.div`
    font-size: 16px;
    color: ${(p) => p.theme.colors.text};
    font-weight: 700;
  `;

  export const ActiveViewTile = styled(Tile)`
    display: flex;
    flex-direction: column;
    gap: 14px;
    background-color: ${(p) => p.theme.colors.surfaceRaised};
  `;

  export const ActiveViewTitle = styled.div`
    font-size: 16px;
    color: ${(p) => p.theme.colors.text};
    white-space: nowrap;
    font-weight: 700;
  `;

  export const EventCardTitle = styled(ActiveViewTitle)`
    white-space: normal;
    line-height: 1.1;
  `;

  export const ActiveViewDescription = styled.div`
    font-size: 14px;
    color: ${(p) => p.theme.colors.textMuted};
  `;

  export const EmptyStateTile = styled(ActiveViewTile)`
    gap: 6px;
  `;

  export const EventCardTile = styled(ActiveViewTile)<{
    clickable?: boolean;
  }>`
    gap: 10px;
    cursor: ${(p) => (p.clickable ? "pointer" : "default")};
    transition:
      background-color 120ms ease,
      border-color 120ms ease;

    &:hover {
      background-color: ${(p) =>
        p.clickable
          ? p.theme.colors.surfaceActive
          : p.theme.colors.surfaceRaised};
      border-color: ${(p) =>
        p.clickable ? p.theme.colors.accent.primary : p.theme.colors.border};
    }
  `;

  export const EventCardHeader = styled.div`
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 10px;
    flex-wrap: wrap;

    @media (max-width: 640px) {
      flex-direction: column;
      gap: 8px;
    }
  `;

  export const EventCardPrimary = styled.div`
    flex: 1 1 320px;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;

    @media (max-width: 640px) {
      flex: none;
      width: 100%;
      gap: 8px;
    }
  `;

  export const EventCardHeaderMeta = styled.div`
    display: inline-flex;
    flex-direction: column;
    align-items: flex-end;
    justify-content: flex-end;
    gap: 4px;
    margin-left: auto;

    @media (max-width: 640px) {
      width: 100%;
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
      margin-left: 0;
      gap: 8px;
    }
  `;

  export const EventStatusPill = styled(Chip)<{
    eventStatus: EventTimingStatus;
  }>`
    color: ${(p) =>
      p.eventStatus === EventTimingStatus.ACTIVE
        ? p.theme.colors.accent.success
        : p.eventStatus === EventTimingStatus.UPCOMING
          ? p.theme.colors.accent.primary
          : p.eventStatus === EventTimingStatus.CONCLUDED
            ? p.theme.colors.textMuted
            : p.theme.colors.accent.warning};
    border-color: ${(p) =>
      p.eventStatus === EventTimingStatus.ACTIVE
        ? `${p.theme.colors.accent.success}66`
        : p.eventStatus === EventTimingStatus.UPCOMING
          ? `${p.theme.colors.accent.primary}66`
          : p.eventStatus === EventTimingStatus.CONCLUDED
            ? `${p.theme.colors.textMuted}66`
            : `${p.theme.colors.accent.warning}66`};
    background-color: ${(p) =>
      p.eventStatus === EventTimingStatus.ACTIVE
        ? `${p.theme.colors.accent.success}1a`
        : p.eventStatus === EventTimingStatus.UPCOMING
          ? `${p.theme.colors.accent.primary}1a`
          : p.eventStatus === EventTimingStatus.CONCLUDED
            ? `${p.theme.colors.textMuted}14`
            : `${p.theme.colors.accent.warning}1a`};
    font-size: 11px;
    font-weight: 700;
    padding: 3px 10px;
  `;

  export const EventScheduleRow = styled.div`
    display: flex;
    gap: 10px;
    flex-wrap: wrap;

    @media (max-width: 640px) {
      gap: 8px;
    }
  `;

  export const EventScheduleItem = styled.div`
    flex: 1 1 140px;
    min-width: 180px;
    display: flex;
    flex-direction: column;
    gap: 2px;

    @media (max-width: 640px) {
      min-width: 130px;
    }
  `;

  export const EventMetaRow = styled.div`
    display: flex;
    justify-content: space-between;
    gap: 10px;
    flex-wrap: wrap;

    @media (max-width: 640px) {
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
    }
  `;

  export const EventMetaGroup = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;

    @media (max-width: 640px) {
      width: 100%;
      gap: 6px;
    }
  `;

  export const EventAssignmentChips = styled.div`
    display: flex;
    gap: 8px;
    flex-wrap: wrap;

    @media (max-width: 640px) {
      gap: 6px;
    }
  `;

  export const CreatorChip = styled(Chip)`
    align-self: flex-start;
    color: ${(p) => p.theme.colors.textMuted};
    border-color: ${(p) => p.theme.colors.borderSubtle};
    background-color: ${(p) => p.theme.colors.textMuted}14;
    font-size: 12px;
  `;

  export const ParticipantsCountChip = styled(Chip)`
    align-self: flex-start;
    color: ${(p) => p.theme.colors.accent.primary};
    border-color: ${(p) => `${p.theme.colors.accent.primary}55`};
    background-color: ${(p) => `${p.theme.colors.accent.primary}14`};
    font-size: 12px;
  `;

  export const ProctorsCountChip = styled(Chip)`
    align-self: flex-start;
    color: ${(p) => p.theme.colors.accent.success};
    border-color: ${(p) => `${p.theme.colors.accent.success}55`};
    background-color: ${(p) => `${p.theme.colors.accent.success}14`};
    font-size: 12px;
  `;

  export const EventMetaLabel = styled.div`
    font-size: 12px;
    color: ${(p) => p.theme.colors.textMuted};
    letter-spacing: 0.08em;
    text-transform: uppercase;
    font-weight: 700;
  `;

  export const EventMetaValue = styled.div`
    font-size: 14px;
    color: ${(p) => p.theme.colors.text};
  `;

  export const FormHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
    flex-wrap: wrap;
  `;

  export const HeaderCopy = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
  `;

  export const FormStack = styled.div`
    display: flex;
    flex-direction: column;
    gap: 16px;
  `;

  export const FormSection = styled.div`
    display: flex;
    flex-direction: column;
    gap: 6px;
  `;

  export const ScheduleSection = styled.div`
    display: flex;
    flex-direction: column;
    gap: 12px;
    border-top: 1px solid ${(p) => p.theme.colors.borderSubtle};
    padding-top: 14px;
  `;

  export const ScheduleHeader = styled.div`
    display: flex;
    flex-direction: column;
    gap: 2px;
  `;

  export const ScheduleHeading = styled(SubHeading)`
    color: ${(p) => p.theme.colors.textMuted};
    font-size: 15px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  `;

  export const ScheduleDescription = styled.div`
    font-size: 14px;
    color: ${(p) => p.theme.colors.textMuted};
  `;

  export const TimeGrid = styled.div`
    display: flex;
    gap: 8px;

    @media (max-width: 860px) {
      flex-direction: column;
    }
  `;

  export const TimeField = styled.div`
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  `;

  export const StyledDateInput = styled(LabelDateInput)`
    flex: 1;
  `;

  export const FieldValidationText = styled.div`
    color: ${(p) => p.theme.colors.accent.danger};
    font-size: 13px;
  `;

  export const DurationSummary = styled.div`
    color: ${(p) => p.theme.colors.accent.success};
    font-size: 14px;
  `;

  export const ActionSection = styled.div`
    display: flex;
    flex-direction: column;
    gap: 10px;
    border-top: 1px solid ${(p) => p.theme.colors.borderSubtle};
    padding-top: 14px;
  `;

  export const ActionHint = styled.div<{
    tone?: ActionHintTone;
  }>`
    color: ${(p) =>
      p.tone === ActionHintTone.READY
        ? p.theme.colors.accent.success
        : p.tone === ActionHintTone.ERROR
          ? p.theme.colors.accent.danger
          : p.theme.colors.textMuted};
    font-size: 14px;
  `;

  export const ActionButtons = styled(ButtonContainer)`
    justify-content: flex-start;
    flex-wrap: wrap;
  `;

  export const PrimaryCreateButton = styled(Button)`
    font-weight: 700;
    background-color: ${(p) =>
      p.disabled
        ? p.theme.colors.surface
        : `${p.theme.colors.accent.success}18`};
    box-shadow: ${(p) =>
      p.disabled
        ? "none"
        : `0px 0px 0px 1px ${p.theme.colors.accent.success}33`};
  `;
}
