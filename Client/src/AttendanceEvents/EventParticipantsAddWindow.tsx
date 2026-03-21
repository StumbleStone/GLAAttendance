import { useTheme } from "@emotion/react";
import styled from "@emotion/styled";
import {
  faPlusCircle,
  faTrash,
  faXmarkCircle,
} from "@fortawesome/free-solid-svg-icons";
import * as React from "react";
import { Attendee } from "../Attendees/Attendee";
import { Backdrop } from "../Components/Backdrop/Backdrop";
import { Button, ButtonContainer } from "../Components/Button/Button";
import { LayerItem } from "../Components/Layer";
import { Search } from "../Components/Search/Search";
import { SearchInput } from "../Components/Search/SearchInput";
import { Tile } from "../Components/Tile";
import { SupaBase, SupaBaseEventKey } from "../SupaBase/SupaBase";
import { EventParticipantsEntry } from "../SupaBase/types";

export interface EventParticipantsAddWindowProps {
  eventId: number;
  layerItem: LayerItem;
  supabase: SupaBase;
}

export interface SelectableAttendeeItem {
  attendee: Attendee;
  eventParticipant: EventParticipantsEntry | null;
  label: string;
  searchKeywords: string[];
}

export enum AttendeeOptionState {
  DEFAULT = "DEFAULT",
  PARTICIPANT = "PARTICIPANT",
  SELECTED_TO_ADD = "SELECTED_TO_ADD",
  SELECTED_TO_REMOVE = "SELECTED_TO_REMOVE",
}

const EVENT_ATTENDEE_SEARCH_FIELDS: Array<keyof SelectableAttendeeItem> = [
  "label",
  "searchKeywords",
];

function sortSelectableAttendees(
  a: SelectableAttendeeItem,
  b: SelectableAttendeeItem,
): number {
  return a.label.localeCompare(b.label);
}

function getCountLabel(
  count: number,
  singular: string,
  plural: string,
): string {
  return count === 1 ? `1 ${singular}` : `${count} ${plural}`;
}

function getSelectionSummary(addCount: number, removeCount: number): string {
  if (addCount === 0 && removeCount === 0) {
    return "No attendee changes selected yet.";
  }

  if (removeCount === 0) {
    return `${getCountLabel(addCount, "attendee", "attendees")} queued to add.`;
  }

  if (addCount === 0) {
    return `${getCountLabel(removeCount, "participant", "participants")} queued to remove.`;
  }

  return `${getCountLabel(addCount, "attendee", "attendees")} queued to add and ${getCountLabel(removeCount, "participant", "participants")} queued to remove.`;
}

function toggleSelection(currentValues: number[], value: number): number[] {
  if (currentValues.includes(value)) {
    return currentValues.filter((currentValue) => currentValue !== value);
  }

  return [...currentValues, value];
}

function getAttendeeOptionState(
  eventParticipant: EventParticipantsEntry | null,
  selectedToAdd: boolean,
  selectedToRemove: boolean,
): AttendeeOptionState {
  if (selectedToRemove) {
    return AttendeeOptionState.SELECTED_TO_REMOVE;
  }

  if (selectedToAdd) {
    return AttendeeOptionState.SELECTED_TO_ADD;
  }

  if (!!eventParticipant) {
    return AttendeeOptionState.PARTICIPANT;
  }

  return AttendeeOptionState.DEFAULT;
}

export const EventParticipantsAddWindow: React.FC<
  EventParticipantsAddWindowProps
> = (props: EventParticipantsAddWindowProps) => {
  const { eventId, layerItem, supabase } = props;
  const theme = useTheme();
  const [revision, forceUpdate] = React.useReducer((x) => x + 1, 0);
  const [attendeeIdsToAdd, setAttendeeIdsToAdd] = React.useState<number[]>([]);
  const [participantAttendeeIdsToRemove, setParticipantAttendeeIdsToRemove] =
    React.useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const listener = supabase.addListener({
      [SupaBaseEventKey.ATTENDEES_CHANGED]: forceUpdate,
      [SupaBaseEventKey.EVENT_PARTICIPANTS_CHANGED]: forceUpdate,
    });

    void Promise.all([
      supabase.attendeesHandler.loadData(),
      supabase.eventParticipantsHandler.loadData(),
    ]);

    return listener;
  }, [supabase]);

  const attendeeItems = React.useMemo<SelectableAttendeeItem[]>(() => {
    const eventParticipantsByAttendeeId = new Map<
      number,
      EventParticipantsEntry
    >(
      supabase.eventParticipantsHandler
        .getByEventId(eventId)
        .map((entry) => [entry.attendee_id, entry]),
    );

    return supabase.attendeesHandler
      .arr()
      .map((attendee) => ({
        attendee,
        eventParticipant:
          eventParticipantsByAttendeeId.get(attendee.id) ?? null,
        label: attendee.fullName,
        searchKeywords: [
          attendee.name,
          attendee.surname,
          ...attendee.allergies,
        ],
      }))
      .sort(sortSelectableAttendees);
  }, [eventId, revision, supabase]);
  const attendeeCount = attendeeItems.length;
  const attendeeIdsToAddSet = React.useMemo<Set<number>>(
    () => new Set(attendeeIdsToAdd),
    [attendeeIdsToAdd],
  );
  const participantAttendeeIdsToRemoveSet = React.useMemo<Set<number>>(
    () => new Set(participantAttendeeIdsToRemove),
    [participantAttendeeIdsToRemove],
  );
  const addCount = attendeeIdsToAdd.length;
  const removeCount = participantAttendeeIdsToRemove.length;

  React.useEffect(() => {
    setAttendeeIdsToAdd((prev) =>
      prev.filter((attendeeId) =>
        attendeeItems.some(
          (item) => item.attendee.id === attendeeId && !item.eventParticipant,
        ),
      ),
    );
    setParticipantAttendeeIdsToRemove((prev) =>
      prev.filter((attendeeId) =>
        attendeeItems.some(
          (item) => item.attendee.id === attendeeId && !!item.eventParticipant,
        ),
      ),
    );
  }, [attendeeItems]);

  const toggleAttendeeSelection = React.useCallback(
    (item: SelectableAttendeeItem) => {
      if (!!item.eventParticipant) {
        setParticipantAttendeeIdsToRemove((prev) =>
          toggleSelection(prev, item.attendee.id),
        );
      } else {
        setAttendeeIdsToAdd((prev) => toggleSelection(prev, item.attendee.id));
      }

      setSubmitError(null);
    },
    [],
  );

  const handleClose = React.useCallback(() => {
    if (isSubmitting) {
      return;
    }

    layerItem.close();
  }, [isSubmitting, layerItem]);

  const handleAddParticipants = React.useCallback(async () => {
    if (addCount === 0 || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const success =
      await supabase.eventParticipantsHandler.createEventParticipants(
        eventId,
        attendeeIdsToAdd,
      );
    setIsSubmitting(false);

    if (!success) {
      setSubmitError("Could not add the selected participants. Try again.");
      return;
    }

    setAttendeeIdsToAdd([]);
  }, [addCount, attendeeIdsToAdd, eventId, isSubmitting, supabase]);

  const handleRemoveParticipants = React.useCallback(async () => {
    if (removeCount === 0 || isSubmitting) {
      return;
    }

    const participantIdsToRemove = attendeeItems.reduce<number[]>(
      (accumulator, item) => {
        if (
          participantAttendeeIdsToRemoveSet.has(item.attendee.id) &&
          !!item.eventParticipant
        ) {
          accumulator.push(item.eventParticipant.id);
        }

        return accumulator;
      },
      [],
    );

    setIsSubmitting(true);
    setSubmitError(null);

    const success =
      await supabase.eventParticipantsHandler.removeEventParticipants(
        participantIdsToRemove,
      );
    setIsSubmitting(false);

    if (!success) {
      setSubmitError("Could not remove the selected participants. Try again.");
      return;
    }

    setParticipantAttendeeIdsToRemove([]);
  }, [
    attendeeItems,
    isSubmitting,
    participantAttendeeIdsToRemoveSet,
    removeCount,
    supabase,
  ]);

  return (
    <S.StyledBackdrop onClose={handleClose}>
      <S.Window>
        <S.Header>
          <S.HeaderTop>
            <S.Title>{"Participants"}</S.Title>
            <Button
              color={theme.colors.textMuted}
              disabled={isSubmitting}
              icon={faXmarkCircle}
              label={"Close"}
              onClick={handleClose}
            />
          </S.HeaderTop>
          <S.Description>
            {
              "Click an attendee to queue them for add. Current participants are highlighted and can be selected for removal."
            }
          </S.Description>
        </S.Header>
        <S.SelectionSummary>
          {getSelectionSummary(addCount, removeCount)}
        </S.SelectionSummary>
        {attendeeCount === 0 ? (
          <S.EmptyState>{"No attendees are available yet."}</S.EmptyState>
        ) : (
          <Search
            items={attendeeItems}
            searchFields={EVENT_ATTENDEE_SEARCH_FIELDS}
          >
            {({ filteredItems, query, setQuery }) => (
              <>
                <S.AttendeesSearch
                  placeholder="Search attendees..."
                  query={query}
                  onQueryChange={setQuery}
                />
                {filteredItems.length === 0 ? (
                  <S.EmptyState>
                    {"No attendees match this search."}
                  </S.EmptyState>
                ) : (
                  <S.List>
                    {filteredItems.map((item) => {
                      const selectedToAdd = attendeeIdsToAddSet.has(
                        item.attendee.id,
                      );
                      const selectedToRemove =
                        participantAttendeeIdsToRemoveSet.has(item.attendee.id);
                      const selectionState = getAttendeeOptionState(
                        item.eventParticipant,
                        selectedToAdd,
                        selectedToRemove,
                      );

                      return (
                        <S.AttendeeOption
                          key={item.attendee.id}
                          selectionState={selectionState}
                          onClick={() => toggleAttendeeSelection(item)}
                        >
                          <S.SelectionIndicator selectionState={selectionState}>
                            {selectionState ===
                            AttendeeOptionState.SELECTED_TO_ADD
                              ? "+"
                              : selectionState ===
                                  AttendeeOptionState.SELECTED_TO_REMOVE
                                ? "-"
                                : ""}
                          </S.SelectionIndicator>
                          <S.AttendeeCopy>
                            <S.AttendeeName>{item.label}</S.AttendeeName>
                          </S.AttendeeCopy>
                        </S.AttendeeOption>
                      );
                    })}
                  </S.List>
                )}
              </>
            )}
          </Search>
        )}
        {!!submitError && <S.ErrorText>{submitError}</S.ErrorText>}
        <S.Actions>
          <Button
            color={theme.colors.accent.success}
            disabled={addCount === 0 || isSubmitting}
            icon={faPlusCircle}
            label={`Add (${addCount})`}
            onClick={handleAddParticipants}
          />
          <Button
            color={theme.colors.accent.danger}
            disabled={removeCount === 0 || isSubmitting}
            icon={faTrash}
            label={`Remove (${removeCount})`}
            onClick={handleRemoveParticipants}
          />
        </S.Actions>
      </S.Window>
    </S.StyledBackdrop>
  );
};

namespace S {
  export interface SelectionStateProps {
    selectionState: AttendeeOptionState;
  }

  export const StyledBackdrop = styled(Backdrop)`
    display: flex;
    align-items: center;
    justify-content: center;
  `;

  export const Window = styled(Tile)`
    width: min(560px, 90vw);
    max-height: min(620px, 84vh);
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px;
    background-color: ${(p) => p.theme.colors.surfaceRaised};
  `;

  export const Header = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
  `;

  export const HeaderTop = styled.div`
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
  `;

  export const Title = styled.div`
    color: ${(p) => p.theme.colors.text};
    font-size: 22px;
    font-weight: 700;
  `;

  export const Description = styled.div`
    color: ${(p) => p.theme.colors.textMuted};
    font-size: 14px;
  `;

  export const SelectionSummary = styled.div`
    color: ${(p) => p.theme.colors.textMuted};
    font-size: 13px;
  `;

  export const AttendeesSearch = styled(SearchInput)`
    width: 100%;
  `;

  export const List = styled.div`
    flex: 1;
    min-height: 0;
    overflow: auto;
    display: flex;
    flex-direction: column;
    gap: 8px;
  `;

  export const AttendeeOption = styled.div<SelectionStateProps>`
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 14px;
    border: 1px solid
      ${(p) =>
        p.selectionState === AttendeeOptionState.SELECTED_TO_ADD
          ? p.theme.colors.accent.primary
          : p.selectionState === AttendeeOptionState.SELECTED_TO_REMOVE
            ? p.theme.colors.accent.danger
            : p.selectionState === AttendeeOptionState.PARTICIPANT
              ? `${p.theme.colors.accent.success}88`
              : p.theme.colors.border};
    border-radius: ${(p) => p.theme.radius.md};
    background-color: ${(p) =>
      p.selectionState === AttendeeOptionState.SELECTED_TO_ADD
        ? p.theme.colors.surfaceActive
        : p.selectionState === AttendeeOptionState.SELECTED_TO_REMOVE
          ? `${p.theme.colors.accent.danger}16`
          : p.selectionState === AttendeeOptionState.PARTICIPANT
            ? `${p.theme.colors.accent.success}14`
            : p.theme.colors.surface};
    cursor: pointer;
  `;

  export const SelectionIndicator = styled.div<SelectionStateProps>`
    width: 22px;
    height: 22px;
    border-radius: ${(p) => p.theme.radius.sm};
    border: 1px solid
      ${(p) =>
        p.selectionState === AttendeeOptionState.SELECTED_TO_ADD
          ? p.theme.colors.accent.primary
          : p.selectionState === AttendeeOptionState.SELECTED_TO_REMOVE
            ? p.theme.colors.accent.danger
            : p.selectionState === AttendeeOptionState.PARTICIPANT
              ? `${p.theme.colors.accent.success}88`
              : p.theme.colors.border};
    background-color: ${(p) =>
      p.selectionState === AttendeeOptionState.SELECTED_TO_ADD
        ? `${p.theme.colors.accent.primary}22`
        : p.selectionState === AttendeeOptionState.SELECTED_TO_REMOVE
          ? `${p.theme.colors.accent.danger}22`
          : p.selectionState === AttendeeOptionState.PARTICIPANT
            ? `${p.theme.colors.accent.success}22`
            : p.theme.colors.surface};
    color: ${(p) =>
      p.selectionState === AttendeeOptionState.SELECTED_TO_ADD
        ? p.theme.colors.accent.primary
        : p.selectionState === AttendeeOptionState.SELECTED_TO_REMOVE
          ? p.theme.colors.accent.danger
          : p.selectionState === AttendeeOptionState.PARTICIPANT
            ? p.theme.colors.accent.success
            : p.theme.colors.textMuted};
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 700;
    user-select: none;
    flex-shrink: 0;
  `;

  export const AttendeeCopy = styled.div`
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  `;

  export const AttendeeName = styled.div`
    color: ${(p) => p.theme.colors.text};
    font-size: 15px;
    font-weight: 700;
  `;

  export const EmptyState = styled.div`
    min-height: 140px;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 16px;
    border: 1px dashed ${(p) => p.theme.colors.border};
    border-radius: ${(p) => p.theme.radius.md};
    background-color: ${(p) => p.theme.colors.surface};
    color: ${(p) => p.theme.colors.textMuted};
    font-size: 14px;
  `;

  export const ErrorText = styled.div`
    color: ${(p) => p.theme.colors.accent.danger};
    font-size: 13px;
  `;

  export const Actions = styled(ButtonContainer)`
    justify-content: flex-end;
    flex-wrap: wrap;
  `;
}
