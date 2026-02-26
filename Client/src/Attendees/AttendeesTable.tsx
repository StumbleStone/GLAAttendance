import {useTheme} from "@emotion/react";
import styled from "@emotion/styled";
import {
  faArrowDown,
  faArrowDown19,
  faArrowDownAZ,
  faArrowUp,
  faArrowUp19,
  faArrowUpAZ,
  faBusSimple,
  faCar,
} from "@fortawesome/free-solid-svg-icons";
import React, {useCallback, useEffect, useMemo, useReducer, useState,} from "react";
import {Icon} from "../Components/Icon";
import {Table} from "../Components/Table/Table";
import {TableCell} from "../Components/Table/TableCell";
import {TableHeading} from "../Components/Table/TableHeading";
import {TableRow} from "../Components/Table/TableRow";
import {SupaBase, SupaBaseEventKey} from "../SupaBase/SupaBase";
import {epochToDate} from "../Tools/Toolbox";
import {Attendee, AttendeeStatus} from "./Attendee";
import {AttendeesSummary} from "./AttendeesSummary";

export interface AttendeesTableProps {
  supabase: SupaBase;
  filter: string;
  onClickedAttendee: (attendee: Attendee) => void;
}

enum SortColumns {
  NAME = "name",
  SURNAME = "surname",
  STATUS = "status",
  BY = "by",
  ON = "on",
  TP = "tp",

  // Always included, cannot be sorted on since it's already sorted...
  INDEX = "index",
}

function sortStatus(
  a: Attendee,
  b: Attendee,
  supabase: SupaBase,
  sortAsc: boolean
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
  sortAsc: boolean
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
        } else if (filter === "CAR" && att.isUsingOwnTransport) {
          outArr.push(att);
        } else if (filter === "BUS" && !att.isUsingOwnTransport) {
          outArr.push(att);
        }
      });
    });

  return outArr;
}

export const AttendeesTable: React.FC<AttendeesTableProps> = (
  props: AttendeesTableProps
) => {
  const { supabase, filter, onClickedAttendee } = props;

  const [sortCol, setSortCol] = useState<SortColumns>(SortColumns.STATUS);
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  const measureWidthRef = React.useRef<HTMLDivElement>(null);

  const [colsToInclude, setColsToInclude] = useState<SortColumns[]>(() => [
    SortColumns.NAME,
    SortColumns.SURNAME,
    SortColumns.STATUS,
  ]);

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

  useEffect(() => {
    if (colsToInclude.includes(sortCol)) {
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
    [sortCol]
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

      const newCols: SortColumns[] = [
        SortColumns.NAME,
        SortColumns.SURNAME,
        SortColumns.TP,
        SortColumns.STATUS,
      ];

      if (width > 420) {
        newCols.push(SortColumns.ON);
      }

      if (width > 500) {
        newCols.push(SortColumns.BY);
      }

      setColsToInclude(() => newCols);
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
      />
      <S.PrimaryTable>
        <tbody>
          <TableRow key="heading">
            <Heading
              colName={SortColumns.INDEX}
              hideSpacersWhenNotSelected={true}
              isIncluded={true}
              label={"#"}
            />
            <Heading
              isIncluded={colsToInclude.includes(SortColumns.NAME)}
              colName={SortColumns.NAME}
              label={"Name"}
              sortAsc={sortAsc}
              sortCol={sortCol}
              useAZArrow={true}
              onClick={handleClickCol}
            />
            <Heading
              isIncluded={colsToInclude.includes(SortColumns.SURNAME)}
              colName={SortColumns.SURNAME}
              label={"Surname"}
              sortAsc={sortAsc}
              sortCol={sortCol}
              useAZArrow={true}
              onClick={handleClickCol}
            />
            <S.SpacerHeading />
            <Heading
              isIncluded={colsToInclude.includes(SortColumns.TP)}
              colName={SortColumns.TP}
              label={"TP"}
              centerLabel={true}
              sortAsc={sortAsc}
              sortCol={sortCol}
              addArrowSpacer={true}
              hideSpacersWhenNotSelected={true}
              onClick={handleClickCol}
            />
            <Heading
              isIncluded={colsToInclude.includes(SortColumns.STATUS)}
              colName={SortColumns.STATUS}
              label={"Status"}
              centerLabel={true}
              sortAsc={sortAsc}
              sortCol={sortCol}
              addArrowSpacer={true}
              hideSpacersWhenNotSelected={true}
              onClick={handleClickCol}
            />
            <Heading
              isIncluded={colsToInclude.includes(SortColumns.ON)}
              colName={SortColumns.ON}
              label={"Time"}
              sortAsc={sortAsc}
              sortCol={sortCol}
              useAZArrow={true}
              hideSpacersWhenNotSelected={true}
              onClick={handleClickCol}
            />
            <Heading
              isIncluded={colsToInclude.includes(SortColumns.BY)}
              colName={SortColumns.BY}
              label={"Recorder"}
              sortAsc={sortAsc}
              sortCol={sortCol}
              use19Arrow={true}
              hideSpacersWhenNotSelected={true}
              onClick={handleClickCol}
            />
          </TableRow>
          {sorted.map((att, index) => (
            <AttendeeRow
              att={att}
              supabase={supabase}
              key={att.id}
              onClickedAttendee={onClickedAttendee}
              colsToInclude={colsToInclude}
              index={index}
            />
          ))}
        </tbody>
      </S.PrimaryTable>
    </S.TableContainer>
  );
};

interface AttendeeRowProps {
  att: Attendee;
  supabase: SupaBase;
  onClickedAttendee: (attendee: Attendee) => void;
  colsToInclude: SortColumns[];
  index: number;
}

const AttendeeRow: React.FC<AttendeeRowProps> = (props) => {
  const theme = useTheme();
  const { att, supabase, colsToInclude, onClickedAttendee, index } = props;
  const status: AttendeeStatus = att.status(supabase.currentRollCallEvent);
  const [, forceUpdate] = useReducer((x) => x + 1, 0);

  useEffect(() => {
    return att.addListener({
      updated: forceUpdate,
    });
  }, []);

  const color =
    status === AttendeeStatus.PRESENT
      ? theme.colors.accent.success
      : status === AttendeeStatus.ABSENT
      ? theme.colors.accent.danger
      : theme.colors.state.disabled;

  // TODO Need to solve this further up
  if (att.isDeleted) {
    return null;
  }

  return (
    <TableRow key={att.id} onClick={() => onClickedAttendee(att)}>
      <S.IndexCell>{index + 1}</S.IndexCell>
      {colsToInclude.includes(SortColumns.NAME) && (
        <S.NameCell>{att.name}</S.NameCell>
      )}
      {colsToInclude.includes(SortColumns.SURNAME) && (
        <S.NameCell>{att.surname}</S.NameCell>
      )}
      <S.SpacerCell />
      {colsToInclude.includes(SortColumns.TP) && (
        <S.RCCell>
          <Icon
            size={22}
            color={
              att.isUsingOwnTransport
                ? theme.colors.accent.transportCar
                : theme.colors.accent.transportBus
            }
            icon={att.isUsingOwnTransport ? faCar : faBusSimple}
          />
        </S.RCCell>
      )}
      {colsToInclude.includes(SortColumns.STATUS) && (
        <S.StatusCell>
          <StatusChip status={status} color={color} />
        </S.StatusCell>
      )}
      {colsToInclude.includes(SortColumns.ON) && (
        <S.NameCell>
          {status !== AttendeeStatus.NOT_SCANNED
            ? epochToDate(new Date(att.currentRollCall!.created_at).getTime(), {
                includeDate: false,
                includeTime: true,
                includeSeconds: true,
              })
            : "--"}
        </S.NameCell>
      )}
      {colsToInclude.includes(SortColumns.BY) && (
        <S.RecorderCell>
          {status !== AttendeeStatus.NOT_SCANNED
            ? supabase.getUserName(att.currentRollCall!.created_by, {
                nameOnly: true,
              })
            : "--"}
        </S.RecorderCell>
      )}
    </TableRow>
  );
};

const StatusChip: React.FC<{ status: AttendeeStatus; color: string }> = (
  props
) => {
  const { status, color } = props;

  return (
    <S.StatusChip color={color}>
      <S.StatusDot color={color} />
      <S.StatusChipLabel>{status}</S.StatusChipLabel>
    </S.StatusChip>
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
  isIncluded?: boolean;
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
    isIncluded,
    hideSpacersWhenNotSelected = false,
  } = props;

  if (!isIncluded) {
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

  export const RCCell = styled(TableCell)`
    padding: 2px;
    text-align: center;
    width: 0;
  `;

  export const StatusCell = styled(RCCell)`
    width: 1%;
  `;

  export const IndexCell = styled(RCCell)`
    text-align: right;
    color: ${(p) => p.theme.colors.table.index};
  `;

  export const MeasureWidth = styled.div``;

  export const PrimaryTable = styled(Table)`
    width: 100%;
    font-size: 12px;
  `;

  export const StyledTableHeading = styled(TableHeading)<{ center?: boolean }>`
    text-align: ${(p) => (p.center ? "center" : null)};
    font-size: 16px;
    padding: 2px 4px;
    cursor: auto;
  `;

  export const NameCell = styled(TableCell)`
    width: 0;
    padding: 4px 4px;
  `;

  export const RecorderCell = styled(NameCell)`
    color: ${(p) => p.theme.colors.textMuted};
  `;

  export const StatusChip = styled.span<{ color: string }>`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    white-space: nowrap;
    border-radius: ${(p) => p.theme.radius.pill};
    padding: 3px 10px;
    font-size: 11px;
    font-weight: 700;
    line-height: 1;
    color: ${(p) => p.color};
    border: 1px solid ${(p) => `${p.color}66`};
    background-color: ${(p) => `${p.color}1a`};
  `;

  export const StatusDot = styled.span<{ color: string }>`
    width: 7px;
    height: 7px;
    border-radius: 50%;
    flex-shrink: 0;
    background-color: ${(p) => p.color};
  `;

  export const StatusChipLabel = styled.span``;

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
    min-width: 0;
    padding: 0;
  `;

  export const SpacerCell = styled(TableCell)`
    min-width: 0;
    padding: 0;
  `;
}
