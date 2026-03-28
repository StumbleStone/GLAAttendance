import styled from "@emotion/styled";
import * as React from "react";
import { Chip } from "../Components/Chip/Chip";
import { Tile } from "../Components/Tile";
import { SupaBase } from "../SupaBase/SupaBase";
import { EventsEntry } from "../SupaBase/types";
import { epochToDate, Toolbox } from "../Tools/Toolbox";

export enum EventTimingStatus {
  ACTIVE = "active",
  UPCOMING = "upcoming",
  CONCLUDED = "concluded",
  UNSCHEDULED = "unscheduled",
}

export interface EventStatusSummary {
  label: string;
  status: EventTimingStatus;
  title: string;
}

export interface EventInformationPanelProps {
  currentTime: number;
  description?: React.ReactNode;
  event: EventsEntry | null;
  extraChips?: React.ReactNode;
  heading?: React.ReactNode;
  supabase: SupaBase;
}

function validateEventTime(time: string | null): boolean {
  if (!time) {
    return false;
  }

  try {
    if (isNaN(Date.parse(time))) {
      return false;
    }
  } catch (error) {
    return false;
  }

  return true;
}

export function parseEventTime(time: string | null): number | null {
  if (!validateEventTime(time)) {
    return null;
  }

  const parsedTime = Date.parse(time);
  return isNaN(parsedTime) ? null : parsedTime;
}

export function formatEventDateTime(time: string | null): string {
  const epoch = parseEventTime(time);
  if (epoch === null) {
    return "--";
  }

  return epochToDate(epoch, {
    includeTime: true,
  });
}

export function getEventDurationLabel(event: EventsEntry): string | null {
  return Toolbox.formatDurationBetween(
    parseEventTime(event.start_time),
    parseEventTime(event.end_time),
  );
}

export function getEventStatus(
  event: EventsEntry,
  currentTime: number,
): EventStatusSummary {
  const startEpoch = parseEventTime(event.start_time);
  const endEpoch = parseEventTime(event.end_time);

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

export const EventInformationPanel: React.FC<EventInformationPanelProps> = (
  props: EventInformationPanelProps,
) => {
  const { currentTime, description, event, extraChips, heading, supabase } =
    props;

  const eventStatus = React.useMemo<EventStatusSummary | null>(() => {
    if (!event) {
      return null;
    }

    return getEventStatus(event, currentTime);
  }, [currentTime, event]);
  const durationLabel = React.useMemo<string | null>(() => {
    if (!event) {
      return null;
    }

    return getEventDurationLabel(event);
  }, [event]);
  const creatorName = React.useMemo<string>(() => {
    if (!event) {
      return "--";
    }

    return supabase.getUserName(event.created_by, {
      nameOnly: true,
    });
  }, [event, supabase]);

  return (
    <S.Panel>
      {!!heading && <S.SectionTitle>{heading}</S.SectionTitle>}
      {!!description && (
        <S.SectionDescription>{description}</S.SectionDescription>
      )}

      {!event ? (
        <S.EmptyStateCopy>
          {"This event record is no longer available."}
        </S.EmptyStateCopy>
      ) : (
        <>
          <S.BadgeRow>
            {!!eventStatus && (
              <EventStatusChip
                eventStatus={eventStatus.status}
                label={eventStatus.label}
                title={eventStatus.title}
              />
            )}
            {!!durationLabel && (
              <S.NeutralInfoChip
                label={`Duration ${durationLabel}`}
                title={`Event duration ${durationLabel}`}
              />
            )}
            {extraChips}
          </S.BadgeRow>

          <S.DetailGrid>
            <S.DetailItem>
              <S.DetailLabel>{"Name"}</S.DetailLabel>
              <S.DetailValue>{event.name || "Untitled Event"}</S.DetailValue>
            </S.DetailItem>
            <S.DetailItem>
              <S.DetailLabel>{"Start"}</S.DetailLabel>
              <S.DetailValue>
                {formatEventDateTime(event.start_time)}
              </S.DetailValue>
            </S.DetailItem>
            <S.DetailItem>
              <S.DetailLabel>{"End"}</S.DetailLabel>
              <S.DetailValue>
                {formatEventDateTime(event.end_time)}
              </S.DetailValue>
            </S.DetailItem>
            <S.DetailItem>
              <S.DetailLabel>{"Created"}</S.DetailLabel>
              <S.DetailValue>
                {formatEventDateTime(event.created_at)}
              </S.DetailValue>
            </S.DetailItem>
            <S.DetailItem>
              <S.DetailLabel>{"Created By"}</S.DetailLabel>
              <S.DetailValue>{creatorName}</S.DetailValue>
            </S.DetailItem>
          </S.DetailGrid>
        </>
      )}
    </S.Panel>
  );
};

export const EventStatusChip = styled(Chip)<{
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

export const EventInfoChip = styled(Chip)`
  color: ${(p) => p.theme.colors.textMuted};
  border-color: ${(p) => p.theme.colors.border};
  background-color: ${(p) => p.theme.colors.surface};
  font-size: 12px;
  padding: 5px 8px;
`;

namespace S {
  export const Panel = styled(Tile)`
    display: flex;
    flex-direction: column;
    gap: 12px;
    background-color: ${(p) => p.theme.colors.surfaceRaised};
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

  export const BadgeRow = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  `;

  export const NeutralInfoChip = styled(EventInfoChip)``;

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

  export const EmptyStateCopy = styled.div`
    color: ${(p) => p.theme.colors.textMuted};
    font-size: 14px;
  `;
}
