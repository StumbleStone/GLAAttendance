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
import { SupaBase, SupaBaseEventKey } from "../SupaBase/SupaBase";
import { Attendee, AttendeeStatus } from "./Attendee";
import { AttendeeRow } from "./AttendeeRow";
import { AttendeesSummary, SummaryPillSelection } from "./AttendeesSummary";
import { SearchBarHeading } from "./SearchBarHeading";
import { SortColumns, SortColumnSize, SortColumnsMap } from "./Shared";
import { SummaryPillId } from "./SummaryPill";

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

  const [selectedSummaryPills, setSelectedSummaryPills] =
    useState<SummaryPillSelection>({
      [SummaryPillId.PRESENT]: false,
      [SummaryPillId.ABSENT]: false,
      [SummaryPillId.NOT_SCANNED]: false,
      [SummaryPillId.BUS]: false,
      [SummaryPillId.CAR]: false,
    });
  const [filter, setFilter] = useState<string>("");
  const [sortCol, setSortCol] = useState<SortColumns>(SortColumns.STATUS);
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [selectedAttendeeId, setSelectedAttendeeId] = useState<number | null>(
    null,
  );

  const [searchRowHeight, setSearchRowHeight] = useState<number>(0);
  const measureWidthRef = React.useRef<HTMLDivElement>(null);

  const [colsToInclude, setColsToInclude] = useState<SortColumnsMap>(() => ({
    [SortColumns.NAME]: SortColumnSize.NORMAL,
    [SortColumns.SURNAME]: SortColumnSize.NORMAL,
    [SortColumns.STATUS]: SortColumnSize.NORMAL,
  }));

  const [, forceUpdate] = useReducer((x) => x + 1, 0);

  useEffect(() => {
    return supabase.addListener({
      [SupaBaseEventKey.LOADED_ROLLCALLS]: forceUpdate,
      [SupaBaseEventKey.DELETED_ATTENDEES]: forceUpdate,
      [SupaBaseEventKey.ADDED_ATTENDEES]: forceUpdate,
      [SupaBaseEventKey.UPDATED_ROLLCALL_EVENT]: forceUpdate,
    });
  }, []);

  const filtered = filterData(supabase, filter);
  const visibleHeaderColSpan = useMemo(() => {
    return 2 + Object.values(colsToInclude).length;
  }, [colsToInclude]);

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

    return filtered.sort(sort);
  }, [filtered, sortCol, sortAsc, supabase.currentRollCallEvent?.id ?? 0]);

  const handleClickAttendee = useCallback(
    (attendee: Attendee) => {
      setSelectedAttendeeId(attendee.id);
      onClickedAttendee(attendee);
    },
    [onClickedAttendee],
  );
  const handleToggleSummaryPill = useCallback((pillId: SummaryPillId) => {
    setSelectedSummaryPills((prev) => ({
      ...prev,
      [pillId]: !prev[pillId],
    }));
  }, []);

  useEffect(() => {
    const el = measureWidthRef.current;
    if (!el) {
      return;
    }

    const onResize = (entries: ResizeObserverEntry[]) => {
      if (entries.length == 0) {
        return;
      }

      const entry = entries[0];
      const width = Math.floor(entry.contentRect.width);

      setColsToInclude(() => calculateColumnsOnResize(width));
    };

    const obs = new ResizeObserver(onResize);
    obs.observe(el);

    return () => {
      obs.unobserve(el);
      obs.disconnect();
    };
  }, []);

  return (
    <S.TableContainer>
      <S.MeasureWidth ref={measureWidthRef} />
      <AttendeesSummary
        rows={sorted}
        currentRollCallEvent={supabase.currentRollCallEvent}
        selectedPills={selectedSummaryPills}
        onTogglePill={handleToggleSummaryPill}
        clickable={true}
      />
      <S.PrimaryTable>
        <tbody>
          <S.StickyHeaderRow>
            <SearchBarHeading
              onHeightChange={setSearchRowHeight}
              filter={filter}
              onFilterChange={setFilter}
              colSpan={visibleHeaderColSpan}
            />
          </S.StickyHeaderRow>
          <S.StickyHeaderRow key="heading" stickyOffset={searchRowHeight}>
            <Heading
              colName={SortColumns.INDEX}
              hideSpacersWhenNotSelected={true}
              columnSize={SortColumnSize.NORMAL}
              label={"#"}
            />
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
          </S.StickyHeaderRow>
          {sorted.map((att, index) => (
            <AttendeeRow
              att={att}
              supabase={supabase}
              key={att.id}
              onClickAttendee={handleClickAttendee}
              index={index}
              selected={att.id === selectedAttendeeId}
              columnSizes={colsToInclude}
            />
          ))}
        </tbody>
      </S.PrimaryTable>
    </S.TableContainer>
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

  export const StickyHeaderRow = styled(HeaderRow)<{
    stickyOffset?: number;
  }>`
    position: sticky;
    top: ${(p) => p.stickyOffset ?? 0}px;
    z-index: 3;
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
    position: sticky;
    top: 0;
    z-index: 3;
    background-color: ${(p) => p.theme.colors.surfaceRaised};
    box-shadow: ${(p) =>
      `inset 0 -1px 0 ${p.theme.colors.border}, inset 0 1px 0 ${p.theme.colors.borderSubtle}`};
    min-width: 0;
    padding: 0;
  `;
}
