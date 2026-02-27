import { useTheme } from "@emotion/react";
import styled from "@emotion/styled";
import {
  faArrowDown,
  faArrowDown19,
  faArrowDownAZ,
  faArrowUp,
  faArrowUp19,
  faArrowUpAZ,
} from "@fortawesome/free-solid-svg-icons";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from "react";
import { Icon } from "../Components/Icon";
import { Table } from "../Components/Table/Table";
import { TableHeading } from "../Components/Table/TableHeading";
import { TableRow } from "../Components/Table/TableRow";
import { useObserveWidth } from "../hooks/useObserveWidth";
import { SupaBase, SupaBaseEventKey } from "../SupaBase/SupaBase";
import { Attendee, AttendeeStatus } from "./Attendee";
import { AttendeeRow } from "./AttendeeRow";
import { AttendeesSummary } from "./AttendeesSummary";
import { SearchBarHeading } from "./SearchBarHeading";
import { SortColumns, SortColumnSize, SortColumnsMap } from "./Shared";
import {
  createSummaryPillSelection,
  SummaryPillId,
  SummaryPillSelection,
} from "./SummaryPill";

export interface AttendeesTableProps {
  supabase: SupaBase;
  onClickedAttendee: (attendee: Attendee) => void;
}

function sortStatus(
  a: Attendee,
  b: Attendee,
  supabase: SupaBase,
  sortAsc: boolean,
) {
  const aPresent = a.status(supabase.currentRollCallEvent);
  const bPresent = b.status(supabase.currentRollCallEvent);

  if (aPresent === bPresent) {
    // Cancel out the sortAsc
    return Attendee.SortByField(a, b, "name") * (sortAsc ? 1 : -1);
  }

  const bWeight =
    bPresent === AttendeeStatus.PRESENT
      ? 2
      : bPresent === AttendeeStatus.ABSENT
        ? 1
        : 0;
  const aWeight =
    aPresent === AttendeeStatus.PRESENT
      ? 2
      : aPresent === AttendeeStatus.ABSENT
        ? 1
        : 0;

  return bWeight - aWeight;
}

function sortTransport(a: Attendee, b: Attendee, sortAsc: boolean) {
  const aTransport: boolean = a.isUsingOwnTransport;
  const bTransport: boolean = b.isUsingOwnTransport;

  if (aTransport === bTransport) {
    // Cancel out the sortAsc
    return Attendee.SortByField(a, b, "name") * (sortAsc ? 1 : -1);
  }

  if (aTransport == true) {
    return -1;
  }

  if (bTransport == true) {
    return 1;
  }

  return 0;
}

function sortBy(
  a: Attendee,
  b: Attendee,
  supabase: SupaBase,
  sortAsc: boolean,
) {
  if (a.currentRollCall == null && b.currentRollCall == null) {
    return Attendee.SortByField(a, b, "name") * (sortAsc ? 1 : -1);
  }

  if (a.currentRollCall == null) {
    return 1 * (sortAsc ? 1 : -1);
  }

  if (b.currentRollCall == null) {
    return -1 * (sortAsc ? 1 : -1);
  }

  if (a.currentRollCall.created_by === b.currentRollCall.created_by) {
    return Attendee.SortByField(a, b, "name") * (sortAsc ? 1 : -1);
  }

  const aName = supabase.getUserName(a.currentRollCall.created_by, {
    nameOnly: true,
  });
  const bName = supabase.getUserName(b.currentRollCall.created_by, {
    nameOnly: true,
  });

  return aName.localeCompare(bName, "en", {
    sensitivity: "base",
  });
}

function sortOn(a: Attendee, b: Attendee, sortAsc: boolean) {
  if (a.currentRollCall == null && b.currentRollCall == null) {
    return Attendee.SortByField(a, b, "name") * (sortAsc ? 1 : -1);
  }

  if (a.currentRollCall == null) {
    return 1 * (sortAsc ? 1 : -1);
  }

  if (b.currentRollCall == null) {
    return -1 * (sortAsc ? 1 : -1);
  }

  const aTime = new Date(a.currentRollCall.created_at).getTime();
  const bTime = new Date(b.currentRollCall.created_at).getTime();

  return aTime - bTime;
}

function normalizeString(str: string | null): string | null {
  if (str == null) {
    return null;
  }

  return str
    .normalize("NFD")
    .replaceAll(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function filterData(supabase: SupaBase, filter: string) {
  if (!supabase.attendees || supabase.attendees.size == 0) {
    return [];
  }

  if (!filter || filter == "") {
    return Array.from(supabase.attendees.values()).filter((a) => !a.isDeleted);
  }

  let outArr: Attendee[] = [];

  normalizeString(filter)
    .toLowerCase()
    .split(/ +/)
    .forEach((part) => {
      supabase.attendees.forEach((att) => {
        if (
          normalizeString(att.name)?.includes(part) ||
          normalizeString(att.surname)?.includes(part)
        ) {
          outArr.push(att);
        }
      });
    });

  return outArr;
}

function isIncludedBySummaryPills(
  attendee: Attendee,
  currentRollCallEvent: SupaBase["currentRollCallEvent"],
  selectedPills: SummaryPillSelection,
): boolean {
  const status = attendee.status(currentRollCallEvent);
  const isCar = attendee.isUsingOwnTransport;

  let statusMatches = false;

  if (
    selectedPills[SummaryPillId.PRESENT] &&
    status === AttendeeStatus.PRESENT
  ) {
    statusMatches = true;
  }

  if (selectedPills[SummaryPillId.ABSENT] && status === AttendeeStatus.ABSENT) {
    statusMatches = true;
  }

  if (
    selectedPills[SummaryPillId.NOT_SCANNED] &&
    status === AttendeeStatus.NOT_SCANNED
  ) {
    statusMatches = true;
  }

  let transportMatches = false;

  if (selectedPills[SummaryPillId.BUS] && !isCar) {
    transportMatches = true;
  }

  if (selectedPills[SummaryPillId.CAR] && isCar) {
    transportMatches = true;
  }

  return statusMatches && transportMatches;
}

function calculateColumnsOnResize(width: number): SortColumnsMap {
  const newCols: SortColumnsMap = {
    [SortColumns.NAME]: SortColumnSize.NORMAL,
    [SortColumns.SURNAME]: SortColumnSize.NORMAL,
    [SortColumns.STATUS]: SortColumnSize.COMPACTER,
  };

  if (width > 340) {
    newCols[SortColumns.TP] = SortColumnSize.COMPACTER;
  }

  if (width > 380) {
    newCols[SortColumns.TP] = SortColumnSize.COMPACT;
  }

  if (width > 430) {
    newCols[SortColumns.ON] = SortColumnSize.COMPACTER;
  }

  if (width > 460) {
    newCols[SortColumns.ON] = SortColumnSize.COMPACTER;
  }

  if (width > 500) {
    newCols[SortColumns.BY] = SortColumnSize.COMPACTER;
  }

  if (width > 520) {
    newCols[SortColumns.BY] = SortColumnSize.COMPACT;
  }

  if (width > 550) {
    newCols[SortColumns.STATUS] = SortColumnSize.COMPACT;
  }

  if (width > 615) {
    newCols[SortColumns.BY] = SortColumnSize.NORMAL;
  }

  if (width > 630) {
    newCols[SortColumns.ON] = SortColumnSize.NORMAL;
  }

  if (width > 680) {
    newCols[SortColumns.STATUS] = SortColumnSize.NORMAL;
  }

  if (width > 680) {
    newCols[SortColumns.TP] = SortColumnSize.NORMAL;
  }

  return newCols;
}

export const AttendeesTable: React.FC<AttendeesTableProps> = (
  props: AttendeesTableProps,
) => {
  const { supabase, onClickedAttendee } = props;

  const [filter, setFilter] = useState<string>("");
  const [sortCol, setSortCol] = useState<SortColumns>(SortColumns.STATUS);
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [selectedAttendeeId, setSelectedAttendeeId] = useState<number | null>(
    null,
  );
  const [selectedPills, setSelectedPills] = useState<SummaryPillSelection>(() =>
    createSummaryPillSelection(true),
  );

  const measureWidthRef = React.useRef<HTMLDivElement>(null);

  const [colsToInclude, setColsToInclude] = useState<SortColumnsMap>(() => ({
    [SortColumns.NAME]: SortColumnSize.NORMAL,
    [SortColumns.SURNAME]: SortColumnSize.NORMAL,
    [SortColumns.STATUS]: SortColumnSize.NORMAL,
  }));

  const [recalculateRows, forceUpdate] = useReducer((x) => x + 1, 0);

  useEffect(() => {
    return supabase.addListener({
      [SupaBaseEventKey.LOADED_ROLLCALLS]: forceUpdate,
      [SupaBaseEventKey.DELETED_ATTENDEES]: forceUpdate,
      [SupaBaseEventKey.ADDED_ATTENDEES]: forceUpdate,
      [SupaBaseEventKey.UPDATED_ROLLCALL_EVENT]: forceUpdate,
    });
  }, []);

  const filtered: Attendee[] = useMemo(() => {
    return filterData(supabase, filter).filter((attendee) =>
      isIncludedBySummaryPills(
        attendee,
        supabase.currentRollCallEvent,
        selectedPills,
      ),
    );
  }, [
    filter,
    recalculateRows,
    selectedPills,
    supabase.currentRollCallEvent?.id,
  ]);

  useEffect(() => {
    if (!!colsToInclude[sortCol]) {
      return;
    }

    setSortCol(SortColumns.STATUS);
    setSortAsc(false);
  }, [sortCol, colsToInclude]);

  const handleClickCol = useCallback(
    (name: SortColumns) => {
      if (sortCol === name) {
        setSortAsc((prev) => !prev);
        return;
      }

      setSortAsc(true);
      setSortCol(name);
    },
    [sortCol],
  );

  const sorted: Attendee[] = useMemo(() => {
    const sort = (a: Attendee, b: Attendee) => {
      let field: string;
      switch (sortCol) {
        case SortColumns.NAME:
          field = "name";
          break;
        case SortColumns.SURNAME:
          field = "surname";
          break;
        case SortColumns.BY:
          return sortBy(a, b, supabase, sortAsc) * (sortAsc ? 1 : -1);

        case SortColumns.ON:
          return sortOn(a, b, sortAsc) * (sortAsc ? 1 : -1);
        case SortColumns.TP:
          return sortTransport(a, b, sortAsc) * (sortAsc ? 1 : -1);

        case SortColumns.STATUS:
        default:
          return sortStatus(a, b, supabase, sortAsc) * (sortAsc ? 1 : -1);
      }

      return Attendee.SortByField(a, b, field) * (sortAsc ? 1 : -1);
    };

    // console.log("%cSorted rows", "color: lime");
    return filtered.sort(sort);
  }, [filtered, sortCol, sortAsc, supabase.currentRollCallEvent?.id ?? 0]);

  const handleClickAttendee = useCallback(
    (attendee: Attendee) => {
      setSelectedAttendeeId(attendee.id);
      onClickedAttendee(attendee);
    },
    [onClickedAttendee],
  );

  const width = useObserveWidth(measureWidthRef);
  useEffect(() => {
    setColsToInclude(() => calculateColumnsOnResize(width));
  }, [width]);

  return (
    <S.TableContainer>
      <S.MeasureWidth ref={measureWidthRef} />
      <AttendeesSummary
        rows={sorted}
        currentRollCallEvent={supabase.currentRollCallEvent}
        selectedPills={selectedPills}
        setSelectedPills={setSelectedPills}
      />
      <S.PrimaryTable>
        <TableHeadings
          sortAsc={sortAsc}
          sortCol={sortCol}
          handleClickCol={handleClickCol}
          filter={filter}
          setFilter={setFilter}
          colsToInclude={colsToInclude}
        />
        <ContentRows
          rows={sorted}
          selectedAttendeeId={selectedAttendeeId}
          supabase={supabase}
          colsToInclude={colsToInclude}
          handleClickAttendee={handleClickAttendee}
        />
      </S.PrimaryTable>
    </S.TableContainer>
  );
};

interface ContentRowsProps {
  rows: Attendee[];
  supabase: SupaBase;
  handleClickAttendee: (attendee: Attendee) => void;
  selectedAttendeeId: number | null;
  colsToInclude: SortColumnsMap;
}

const ContentRows: React.FC<ContentRowsProps> = (props: ContentRowsProps) => {
  const {
    rows,
    supabase,
    selectedAttendeeId,
    handleClickAttendee,
    colsToInclude,
  } = props;
  return (
    <tbody>
      {rows.map((att) => (
        <AttendeeRow
          att={att}
          supabase={supabase}
          key={att.id}
          onClickAttendee={handleClickAttendee}
          // index={index}
          selected={att.id === selectedAttendeeId}
          columnSizes={colsToInclude}
        />
      ))}
    </tbody>
  );
};

interface TableHeadingsProps {
  filter: string;
  setFilter: (newFilter: string) => void;
  colsToInclude: SortColumnsMap;
  sortAsc: boolean;
  sortCol: SortColumns;
  handleClickCol: (colName: SortColumns) => void;
}

const TableHeadings: React.FC<TableHeadingsProps> = (
  props: TableHeadingsProps,
) => {
  const { filter, setFilter, colsToInclude, sortAsc, sortCol, handleClickCol } =
    props;

  const visibleHeaderColSpan = useMemo(() => {
    return 1 + Object.values(colsToInclude).length;
  }, [colsToInclude]);

  return (
    <S.StickyTableHead>
      <S.HeaderRow>
        <SearchBarHeading
          filter={filter}
          onFilterChange={setFilter}
          colSpan={visibleHeaderColSpan}
        />
      </S.HeaderRow>
      <S.HeaderRow key="heading">
        {/*<Heading*/}
        {/*  colName={SortColumns.INDEX}*/}
        {/*  hideSpacersWhenNotSelected={true}*/}
        {/*  columnSize={SortColumnSize.NORMAL}*/}
        {/*  label={"#"}*/}
        {/*/>*/}
        <Heading
          columnSize={colsToInclude[SortColumns.NAME]}
          colName={SortColumns.NAME}
          label={"Name"}
          sortAsc={sortAsc}
          sortCol={sortCol}
          useAZArrow={true}
          onClick={handleClickCol}
        />
        <Heading
          columnSize={colsToInclude[SortColumns.SURNAME]}
          colName={SortColumns.SURNAME}
          label={"Surname"}
          sortAsc={sortAsc}
          sortCol={sortCol}
          useAZArrow={true}
          onClick={handleClickCol}
        />
        <S.SpacerHeading />
        <Heading
          columnSize={colsToInclude[SortColumns.TP]}
          colName={SortColumns.TP}
          label={
            colsToInclude[SortColumns.TP] >= SortColumnSize.NORMAL
              ? "Travel"
              : "TR"
          }
          centerLabel={true}
          sortAsc={sortAsc}
          sortCol={sortCol}
          addArrowSpacer={true}
          hideSpacersWhenNotSelected={true}
          onClick={handleClickCol}
        />
        <Heading
          columnSize={colsToInclude[SortColumns.STATUS]}
          colName={SortColumns.STATUS}
          label={
            colsToInclude[SortColumns.STATUS] >= SortColumnSize.NORMAL
              ? "Status"
              : "Stat"
          }
          centerLabel={true}
          sortAsc={sortAsc}
          sortCol={sortCol}
          addArrowSpacer={true}
          hideSpacersWhenNotSelected={true}
          onClick={handleClickCol}
        />
        <Heading
          columnSize={colsToInclude[SortColumns.ON]}
          colName={SortColumns.ON}
          label={
            colsToInclude[SortColumns.ON] >= SortColumnSize.NORMAL
              ? "Time"
              : "On"
          }
          sortAsc={sortAsc}
          sortCol={sortCol}
          useAZArrow={true}
          hideSpacersWhenNotSelected={true}
          onClick={handleClickCol}
        />
        <Heading
          columnSize={colsToInclude[SortColumns.BY]}
          colName={SortColumns.BY}
          label={"By"}
          sortAsc={sortAsc}
          sortCol={sortCol}
          use19Arrow={true}
          hideSpacersWhenNotSelected={true}
          onClick={handleClickCol}
        />
      </S.HeaderRow>
    </S.StickyTableHead>
  );
};

interface HeadingProps {
  colName: SortColumns;
  sortCol?: SortColumns;
  sortAsc?: boolean;
  onClick?: (colName: SortColumns) => void;
  label: string;
  centerLabel?: boolean;
  useAZArrow?: boolean;
  use19Arrow?: boolean;
  addArrowSpacer?: boolean;
  columnSize?: SortColumnSize;
  hideSpacersWhenNotSelected?: boolean;
}

const Heading: React.FC<HeadingProps> = (props: HeadingProps) => {
  const {
    colName,
    sortAsc,
    sortCol,
    onClick,
    label,
    centerLabel,
    useAZArrow,
    use19Arrow,
    addArrowSpacer,
    columnSize,
    hideSpacersWhenNotSelected = false,
  } = props;

  if (!columnSize) {
    return null;
  }

  const handleClick = useCallback(() => onClick(colName), [onClick, colName]);
  const isSelected = sortCol === colName;
  const showArrow = isSelected || !hideSpacersWhenNotSelected;
  const showSpacer = showArrow && addArrowSpacer;
  return (
    <S.StyledTableHeading
      onClick={!!onClick ? handleClick : null}
      center={centerLabel}
    >
      <S.HeadingContainer>
        {showSpacer && <SortArrow selected={false} ascending={false} />}
        <S.HeadingText>{label}</S.HeadingText>
        {showArrow && (
          <SortArrow
            selected={isSelected}
            ascending={sortAsc}
            useAZ={useAZArrow}
            use09={use19Arrow}
          />
        )}
      </S.HeadingContainer>
    </S.StyledTableHeading>
  );
};

export const SortArrow: React.FC<{
  ascending: boolean;
  selected: boolean;
  useAZ?: boolean;
  use09?: boolean;
}> = (props) => {
  const theme = useTheme();
  const { ascending, selected, useAZ, use09 } = props;

  const icon = ascending
    ? useAZ
      ? faArrowDownAZ
      : use09
        ? faArrowDown19
        : faArrowDown
    : useAZ
      ? faArrowUpAZ
      : use09
        ? faArrowUp19
        : faArrowUp;

  return (
    <S.SortArrow
      icon={icon}
      size={14}
      color={selected ? theme.colors.table.sortActive : "transparent"}
    />
  );
};

namespace S {
  export const SortArrow = styled(Icon)``;

  export const TableContainer = styled.div`
    color: ${(p) => p.theme.colors.text};
    display: flex;
    flex-direction: column;
    align-items: stretch;
    justify-content: center;
  `;

  export const HeaderRow = styled(TableRow)`
    position: relative;
    z-index: 2;
  `;

  export const StickyTableHead = styled.thead`
    position: sticky;
    top: 0;
    z-index: 2;
  `;

  export const MeasureWidth = styled.div`
    label: MeasureWidth;
  `;

  export const PrimaryTable = styled(Table)`
    width: 100%;
    font-size: 12px;
    border-collapse: separate;
    border-spacing: 0;
  `;

  export const StyledTableHeading = styled(TableHeading)<{
    center?: boolean;
  }>`
    background-color: ${(p) => p.theme.colors.surfaceRaised};
    box-shadow: ${(p) =>
      `inset 0 -1px 0 ${p.theme.colors.border}, inset 0 1px 0 ${p.theme.colors.borderSubtle}`};
    text-align: ${(p) => (p.center ? "center" : null)};

    font-size: 16px;
    padding: 2px 4px;

    cursor: auto;
  `;

  export const HeadingText = styled.span`
    text-align: center;
  `;

  export const HeadingContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
  `;

  export const SpacerHeading = styled(TableHeading)`
    background-color: ${(p) => p.theme.colors.surfaceRaised};
    box-shadow: ${(p) =>
      `inset 0 -1px 0 ${p.theme.colors.border}, inset 0 1px 0 ${p.theme.colors.borderSubtle}`};
    min-width: 0;
    padding: 0;
  `;
}
