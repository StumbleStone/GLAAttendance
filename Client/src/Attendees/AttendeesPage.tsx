import styled from "@emotion/styled";
import { faPlusCircle, faUsers } from "@fortawesome/free-solid-svg-icons";
import * as React from "react";
import { useOutletContext } from "react-router-dom";
import { Button } from "../Components/Button/Button";
import { Chip } from "../Components/Chip/Chip";
import { Heading } from "../Components/Heading";
import { LabelTextInput } from "../Components/Inputs/label/LabelTextInput";
import { LayerHandler, LayerItem } from "../Components/Layer";
import { filterItemsBySearchQuery } from "../Components/Search/Search";
import { SearchInput } from "../Components/Search/SearchInput";
import { SubHeading } from "../Components/SubHeading";
import { Table } from "../Components/Table/Table";
import { TableCell } from "../Components/Table/TableCell";
import { TableHeading } from "../Components/Table/TableHeading";
import { TableRow } from "../Components/Table/TableRow";
import { Tile } from "../Components/Tile";
import { SupaBase, SupaBaseEventKey } from "../SupaBase/SupaBase";
import { InsertAttendees } from "../SupaBase/types";
import { Attendee } from "./Attendee";
import { AttendeeAddWindow } from "./AttendeeAddWindow";
import { ShowAttendeeWindow } from "./AttendeeWindow/AttendeeWindow";

export interface AttendeeRecordsItem {
  allergies: string[];
  emergencyContacts: string[];
  fullName: string;
  id: number | string;
  name: string;
  onClick?: () => void;
  surname: string;
}

export interface AttendeesPageProps {
  supabase: SupaBase;
}

export interface AttendeesRecordsPanelProps {
  attendees: AttendeeRecordsItem[];
  loading?: boolean;
  onQueryChange: (newQuery: string) => void;
  query: string;
}

interface AttendeeCreationPanelProps {
  onOpenBulkAdd: () => void;
  supabase: SupaBase;
}

enum AttendeeCreationPanelState {
  COLLAPSED = "collapsed",
  OPEN = "open",
}

enum CreateHintTone {
  DEFAULT = "default",
  READY = "ready",
  ERROR = "error",
}

enum AttendeeCountChipTone {
  ALLERGY = "allergy",
  ICE = "ice",
}

const ATTENDEE_SEARCH_FIELDS: Array<keyof AttendeeRecordsItem> = [
  "fullName",
  "name",
  "surname",
  "allergies",
  "emergencyContacts",
];

function sortAttendees(a: Attendee, b: Attendee): number {
  const surnameDelta = a.surname.localeCompare(b.surname, "en", {
    sensitivity: "base",
  });

  if (surnameDelta !== 0) {
    return surnameDelta;
  }

  const nameDelta = a.name.localeCompare(b.name, "en", {
    sensitivity: "base",
  });

  if (nameDelta !== 0) {
    return nameDelta;
  }

  return a.id - b.id;
}

function parseCommaSeparatedValues(value: string): string[] {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

function normalizeCommaSeparatedValue(value: string): string | null {
  const values = parseCommaSeparatedValues(value);
  return values.length > 0 ? values.join(", ") : null;
}

function getCountLabel(
  count: number,
  singularLabel: string,
  pluralLabel: string,
): string {
  return `${count} ${count === 1 ? singularLabel : pluralLabel}`;
}

function onClickableCardKeyDown(
  event: React.KeyboardEvent<HTMLElement>,
  onClick: () => void,
): void {
  if (event.key !== "Enter" && event.key !== " ") {
    return;
  }

  event.preventDefault();
  onClick();
}

export const AttendeesPage: React.FC = () => {
  const { supabase } = useOutletContext<AttendeesPageProps>();
  const [revision, forceUpdate] = React.useReducer((x) => x + 1, 0);
  const [query, setQuery] = React.useState("");

  React.useEffect(() => {
    const listener = supabase.addListener({
      [SupaBaseEventKey.ATTENDEES_CHANGED]: forceUpdate,
    });

    void supabase.attendeesHandler.loadData();

    return listener;
  }, [supabase]);

  const attendees = React.useMemo<Attendee[]>(() => {
    return [...supabase.attendeesHandler.arr()].sort(sortAttendees);
  }, [revision, supabase]);

  const handleOpenBulkAdd = React.useCallback(() => {
    LayerHandler.AddLayer((layerItem: LayerItem) => (
      <AttendeeAddWindow layerItem={layerItem} supabase={supabase} />
    ));
  }, [supabase]);

  const attendeeSearchItems = React.useMemo<AttendeeRecordsItem[]>(() => {
    return attendees.map((attendee) => ({
      allergies: attendee.allergies,
      emergencyContacts: attendee.emergencyContacts,
      fullName: attendee.fullName,
      id: attendee.id,
      name: attendee.name,
      onClick: () => ShowAttendeeWindow(supabase, attendee),
      surname: attendee.surname,
    }));
  }, [attendees, supabase]);

  return (
    <S.Container>
      <S.Panel>
        <Heading>Attendees</Heading>
        <S.PanelDescription>
          Add new attendees, open any record to edit or remove it, and keep the
          attendee list tidy in one place.
        </S.PanelDescription>

        <AttendeeCreationPanel
          onOpenBulkAdd={handleOpenBulkAdd}
          supabase={supabase}
        />

        <AttendeesRecordsPanel
          attendees={attendeeSearchItems}
          loading={!supabase.attendeesHandler.dataLoaded}
          onQueryChange={setQuery}
          query={query}
        />
      </S.Panel>
    </S.Container>
  );
};

export const AttendeesRecordsPanel: React.FC<AttendeesRecordsPanelProps> = (
  props: AttendeesRecordsPanelProps,
) => {
  const { attendees, loading = false, onQueryChange, query } = props;

  const filteredItems = React.useMemo<AttendeeRecordsItem[]>(() => {
    return filterItemsBySearchQuery(attendees, ATTENDEE_SEARCH_FIELDS, query);
  }, [attendees, query]);

  return (
    <>
      <S.Toolbar>
        <S.ToolbarSearch
          placeholder="Search attendees..."
          query={query}
          onQueryChange={onQueryChange}
        />
        <S.SummaryRow>
          <S.SummaryChip
            label={getCountLabel(attendees.length, "Attendee", "Attendees")}
          />
        </S.SummaryRow>
      </S.Toolbar>

      <S.ListSection>
        <S.ListHeader>
          <S.ListTitle>Attendee Records</S.ListTitle>
          <S.ListDescription>
            {query.trim().length > 0
              ? `Showing ${filteredItems.length} of ${attendees.length} attendees.`
              : "Open a record to edit, delete, or share the attendee QR code."}
          </S.ListDescription>
        </S.ListHeader>

        {loading && (
          <S.EmptyStateTile>
            <S.EmptyStateTitle>Loading attendees...</S.EmptyStateTitle>
            <S.EmptyStateCopy>
              Fetching the latest attendee records.
            </S.EmptyStateCopy>
          </S.EmptyStateTile>
        )}

        {!loading && attendees.length === 0 && (
          <S.EmptyStateTile>
            <S.EmptyStateTitle>No attendees yet</S.EmptyStateTitle>
            <S.EmptyStateCopy>
              Add the first attendee above or bulk import a list to get started.
            </S.EmptyStateCopy>
          </S.EmptyStateTile>
        )}

        {!loading && attendees.length > 0 && filteredItems.length === 0 && (
          <S.EmptyStateTile>
            <S.EmptyStateTitle>No matching attendees</S.EmptyStateTitle>
            <S.EmptyStateCopy>
              Try a different search term or clear the current filter.
            </S.EmptyStateCopy>
          </S.EmptyStateTile>
        )}

        {filteredItems.length > 0 && (
          <S.TableContainer>
            <S.AttendeesTable>
              <thead>
                <tr>
                  <S.AttendeesHeading>Name</S.AttendeesHeading>
                  <S.AttendeesHeading>Surname</S.AttendeesHeading>
                  <S.AttendeesHeading>Allergies</S.AttendeesHeading>
                  <S.AttendeesHeading>ICE</S.AttendeesHeading>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <S.AttendeeRow
                    key={item.id}
                    onClick={item.onClick}
                    onKeyDown={(event) =>
                      item.onClick
                        ? onClickableCardKeyDown(event, item.onClick)
                        : null
                    }
                    role={item.onClick ? "button" : undefined}
                    tabIndex={item.onClick ? 0 : undefined}
                  >
                    <S.AttendeeNameCell>{item.name}</S.AttendeeNameCell>
                    <S.AttendeeCell>{item.surname}</S.AttendeeCell>
                    <S.AttendeeChipCell>
                      <S.AttendeeCountChip
                        hasValue={item.allergies.length > 0}
                        label={getCountLabel(
                          item.allergies.length,
                          "Allergy",
                          "Allergies",
                        )}
                        tone={AttendeeCountChipTone.ALLERGY}
                      />
                    </S.AttendeeChipCell>
                    <S.AttendeeChipCell>
                      <S.AttendeeCountChip
                        hasValue={item.emergencyContacts.length > 0}
                        label={getCountLabel(
                          item.emergencyContacts.length,
                          "ICE Number",
                          "ICE Numbers",
                        )}
                        tone={AttendeeCountChipTone.ICE}
                      />
                    </S.AttendeeChipCell>
                  </S.AttendeeRow>
                ))}
              </tbody>
            </S.AttendeesTable>
          </S.TableContainer>
        )}
      </S.ListSection>
    </>
  );
};

const AttendeeCreationPanel: React.FC<AttendeeCreationPanelProps> = (
  props: AttendeeCreationPanelProps,
) => {
  const { onOpenBulkAdd, supabase } = props;
  const [panelState, setPanelState] =
    React.useState<AttendeeCreationPanelState>(
      AttendeeCreationPanelState.COLLAPSED,
    );
  const [name, setName] = React.useState("");
  const [surname, setSurname] = React.useState("");
  const [allergies, setAllergies] = React.useState("");
  const [emergencyContacts, setEmergencyContacts] = React.useState("");
  const [createAttempted, setCreateAttempted] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const resetForm = React.useCallback(() => {
    setName("");
    setSurname("");
    setAllergies("");
    setEmergencyContacts("");
    setCreateAttempted(false);
    setIsSubmitting(false);
    setSubmitError(null);
  }, []);

  const handleOpen = React.useCallback(() => {
    resetForm();
    setPanelState(AttendeeCreationPanelState.OPEN);
  }, [resetForm]);

  const handleCancel = React.useCallback(() => {
    resetForm();
    setPanelState(AttendeeCreationPanelState.COLLAPSED);
  }, [resetForm]);

  const trimmedName = React.useMemo(() => name.trim(), [name]);
  const trimmedSurname = React.useMemo(() => surname.trim(), [surname]);

  const nameValidationError = React.useMemo<string | null>(() => {
    if (trimmedName.length === 0) {
      return "First name is required.";
    }

    return null;
  }, [trimmedName]);

  const surnameValidationError = React.useMemo<string | null>(() => {
    if (trimmedSurname.length === 0) {
      return "Surname is required.";
    }

    return null;
  }, [trimmedSurname]);

  const isValid = React.useMemo<boolean>(() => {
    return !nameValidationError && !surnameValidationError;
  }, [nameValidationError, surnameValidationError]);

  const actionHint = React.useMemo<string>(() => {
    if (isSubmitting) {
      return "Creating attendee...";
    }

    if (!!submitError) {
      return submitError;
    }

    if (!isValid && createAttempted) {
      return (
        nameValidationError ?? surnameValidationError ?? "Missing details."
      );
    }

    if (!isValid) {
      return "Enter at least a name and surname.";
    }

    return "Optional notes can be entered as comma-separated values.";
  }, [
    createAttempted,
    isSubmitting,
    isValid,
    nameValidationError,
    submitError,
    surnameValidationError,
  ]);

  const hintTone = React.useMemo<CreateHintTone>(() => {
    if (!!submitError) {
      return CreateHintTone.ERROR;
    }

    return isValid ? CreateHintTone.READY : CreateHintTone.DEFAULT;
  }, [isValid, submitError]);

  const handleCreate = React.useCallback(async () => {
    setCreateAttempted(true);

    if (!isValid || isSubmitting) {
      return;
    }

    const attendeeEntry: InsertAttendees = {
      allergies: normalizeCommaSeparatedValue(allergies),
      emergency_contact: normalizeCommaSeparatedValue(emergencyContacts),
      name: trimmedName,
      surname: trimmedSurname,
    };

    setIsSubmitting(true);
    setSubmitError(null);

    const didCreate = await supabase.createAttendee(attendeeEntry);

    if (!didCreate) {
      setIsSubmitting(false);
      setSubmitError("Could not create the attendee. Try again.");
      return;
    }

    handleCancel();
  }, [
    allergies,
    emergencyContacts,
    handleCancel,
    isSubmitting,
    isValid,
    supabase,
    trimmedName,
    trimmedSurname,
  ]);

  if (panelState === AttendeeCreationPanelState.COLLAPSED) {
    return (
      <S.CollapsedActionRow>
        <S.PrimaryActionButton
          icon={faPlusCircle}
          label="Add Attendee"
          onClick={handleOpen}
        />
        <S.SecondaryActionButton
          icon={faUsers}
          label="Bulk Add"
          onClick={onOpenBulkAdd}
        />
      </S.CollapsedActionRow>
    );
  }

  return (
    <S.CreatePanelTile>
      <S.FormHeader>
        <S.FormHeaderCopy>
          <S.FormTitle>New Attendee</S.FormTitle>
          <S.FormDescription>
            Create a single attendee here, or use bulk add for pasted lists.
          </S.FormDescription>
        </S.FormHeaderCopy>
        <S.SecondaryActionButton
          icon={faUsers}
          label="Bulk Add"
          onClick={onOpenBulkAdd}
        />
      </S.FormHeader>

      <S.FormGrid>
        <LabelTextInput
          hasError={!!nameValidationError && createAttempted}
          label="Name"
          onChange={(event) => {
            setName(event.target.value);
            setSubmitError(null);
          }}
          placeholder="Anastasia"
          value={name}
        />
        <LabelTextInput
          hasError={!!surnameValidationError && createAttempted}
          label="Surname"
          onChange={(event) => {
            setSurname(event.target.value);
            setSubmitError(null);
          }}
          placeholder="Patel"
          value={surname}
        />
        <LabelTextInput
          label="Allergies"
          onChange={(event) => {
            setAllergies(event.target.value);
            setSubmitError(null);
          }}
          placeholder="Peanuts, shellfish"
          value={allergies}
        />
        <LabelTextInput
          label="ICE Contacts"
          onChange={(event) => {
            setEmergencyContacts(event.target.value);
            setSubmitError(null);
          }}
          placeholder="012 345 6789, 098 765 4321"
          value={emergencyContacts}
        />
      </S.FormGrid>

      <S.FormFooter>
        <S.FormHint tone={hintTone}>{actionHint}</S.FormHint>
        <S.FormActions>
          <S.SecondaryActionButton label="Cancel" onClick={handleCancel} />
          <S.PrimaryActionButton
            disabled={!isValid || isSubmitting}
            label="Create Attendee"
            onClick={handleCreate}
          />
        </S.FormActions>
      </S.FormFooter>
    </S.CreatePanelTile>
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
    gap: 14px;
    padding: 14px;
  `;

  export const PanelDescription = styled(SubHeading)`
    color: ${(p) => p.theme.colors.textMuted};
    font-size: 16px;
  `;

  export const CollapsedActionRow = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  `;

  export const CreatePanelTile = styled(Tile)`
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 14px;
    background-color: ${(p) => p.theme.colors.surfaceRaised};
    border-color: ${(p) => p.theme.colors.borderSubtle};
  `;

  export const FormHeader = styled.div`
    display: flex;
    flex-direction: column;
    gap: 10px;

    @media (min-width: 700px) {
      flex-direction: row;
      align-items: flex-start;
      justify-content: space-between;
    }
  `;

  export const FormHeaderCopy = styled.div`
    display: flex;
    flex-direction: column;
    gap: 6px;
  `;

  export const FormTitle = styled.div`
    font-size: 24px;
    color: ${(p) => p.theme.colors.text};
  `;

  export const FormDescription = styled.div`
    color: ${(p) => p.theme.colors.textMuted};
    font-size: 15px;
  `;

  export const FormGrid = styled.div`
    display: grid;
    grid-template-columns: 1fr;
    gap: 12px;

    @media (min-width: 900px) {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  `;

  export const FormFooter = styled.div`
    display: flex;
    flex-direction: column;
    gap: 12px;

    @media (min-width: 700px) {
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
    }
  `;

  export const FormHint = styled.div<{ tone: CreateHintTone }>`
    color: ${(p) =>
      p.tone === CreateHintTone.ERROR
        ? p.theme.colors.accent.danger
        : p.tone === CreateHintTone.READY
          ? p.theme.colors.accent.success
          : p.theme.colors.textMuted};
    font-size: 14px;
  `;

  export const FormActions = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  `;

  export const PrimaryActionButton = styled(Button)``;

  export const SecondaryActionButton = styled(Button)``;

  export const Toolbar = styled.div`
    display: flex;
    flex-direction: column;
    gap: 10px;
  `;

  export const ToolbarSearch = styled(SearchInput)`
    width: 100%;
  `;

  export const SummaryRow = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  `;

  export const SummaryChip = styled(Chip)`
    color: ${(p) => p.theme.colors.textMuted};
    border-color: ${(p) => p.theme.colors.borderSubtle};
    background-color: ${(p) => p.theme.colors.surfaceRaised};
    padding: 6px 10px;
    font-size: 12px;
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
    font-size: 22px;
    color: ${(p) => p.theme.colors.text};
  `;

  export const ListDescription = styled.div`
    font-size: 15px;
    color: ${(p) => p.theme.colors.textMuted};
  `;

  export const EmptyStateTile = styled(Tile)`
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 16px;
    background-color: ${(p) => p.theme.colors.surfaceRaised};
    border-color: ${(p) => p.theme.colors.borderSubtle};
  `;

  export const EmptyStateTitle = styled.div`
    font-size: 22px;
    color: ${(p) => p.theme.colors.text};
  `;

  export const EmptyStateCopy = styled.div`
    color: ${(p) => p.theme.colors.textMuted};
    font-size: 15px;
  `;

  export const TableContainer = styled.div`
    overflow-x: auto;
    border: 1px solid ${(p) => p.theme.colors.borderSubtle};
    border-radius: ${(p) => p.theme.radius.md};
    background-color: ${(p) => p.theme.colors.surfaceRaised};
  `;

  export const AttendeesTable = styled(Table)``;

  export const AttendeesHeading = styled(TableHeading)`
    background-color: ${(p) => p.theme.colors.surface};
    padding: 10px 12px;
    border-top: none;
  `;

  export const AttendeeRow = styled(TableRow)`
    &:focus-visible {
      outline: 2px solid ${(p) => p.theme.colors.accent.primary};
      outline-offset: 2px;
    }
  `;

  export const AttendeeCell = styled(TableCell)`
    padding: 10px 12px;
    white-space: normal;
    vertical-align: middle;
  `;

  export const AttendeeNameCell = styled(AttendeeCell)`
    font-size: 22px;
    color: ${(p) => p.theme.colors.text};
  `;

  export const AttendeeCellMuted = styled(AttendeeCell)<{
    hasValue: boolean;
  }>`
    color: ${(p) =>
      p.hasValue ? p.theme.colors.text : p.theme.colors.textMuted};
  `;

  export const AttendeeChipCell = styled(AttendeeCell)`
    vertical-align: middle;
  `;

  export const AttendeeCountChip = styled(Chip)<{
    hasValue: boolean;
    tone: AttendeeCountChipTone;
  }>`
    color: ${(p) =>
      !p.hasValue
        ? p.theme.colors.textMuted
        : p.tone === AttendeeCountChipTone.ALLERGY
          ? p.theme.colors.accent.warning
          : p.theme.colors.accent.primary};
    border-color: ${(p) =>
      !p.hasValue
        ? p.theme.colors.border
        : p.tone === AttendeeCountChipTone.ALLERGY
          ? p.theme.colors.accent.warning
          : p.theme.colors.accent.primary};
    background-color: ${(p) =>
      !p.hasValue
        ? p.theme.colors.surface
        : p.tone === AttendeeCountChipTone.ALLERGY
          ? `${p.theme.colors.accent.warning}1c`
          : `${p.theme.colors.accent.primary}1c`};
    padding: 5px 10px;
    font-size: 12px;
  `;
}
