import styled from "@emotion/styled";
import {
  faArrowDown,
  faArrowDownAZ,
  faArrowUp,
  faArrowUpAZ,
  faCheckSquare,
  faMinusSquare,
  faXmarkSquare,
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
import { TableCell } from "../Components/Table/TableCell";
import { TableHeading } from "../Components/Table/TableHeading";
import { TableRow } from "../Components/Table/TableRow";
import { SupaBase, SupaBaseEventKey } from "../SupaBase/SupaBase";
import { DefaultColors } from "../Tools/Toolbox";
import { Attendee, AttendeeStatus } from "./Attendee";

export interface AttendeesTableProps {
  supabase: SupaBase;
  filter: string;
  onClickedAttendee: (attendee: Attendee) => void;
}

enum SortColumns {
  NAME = "name",
  SURNAME = "surname",
  STATUS = "status",
}

export const AttendeesTable: React.FC<AttendeesTableProps> = (
  props: AttendeesTableProps
) => {
  const { supabase, filter, onClickedAttendee } = props;

  const [sortCol, setSortCol] = useState<SortColumns>(SortColumns.STATUS);
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  const [, forceUpdate] = useReducer((x) => x + 1, 0);

  useEffect(() => {
    return supabase.addListener({
      [SupaBaseEventKey.LOADED_ROLLCALLS]: forceUpdate,
      [SupaBaseEventKey.DELETED_ATTENDEES]: forceUpdate,
      [SupaBaseEventKey.ADDED_ATTENDEES]: forceUpdate,
      [SupaBaseEventKey.UPDATED_ROLLCALL_EVENT]: forceUpdate,
    });
  }, []);

  const filtered = useMemo<Attendee[]>(() => {
    if (!supabase.attendees || supabase.attendees.size == 0) {
      return [];
    }

    if (!filter || filter == "") {
      return Array.from(supabase.attendees.values());
    }

    let outArr: Attendee[] = [];

    filter
      .toLowerCase()
      .split(/ +/)
      .forEach((part) => {
        supabase.attendees.forEach((att) => {
          if (
            att.name?.toLowerCase().includes(part) ||
            att.surname?.toLowerCase().includes(part)
          ) {
            outArr.push(att);
          }
        });
      });

    return outArr;
  }, [filter, supabase.attendeesModified]);

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
    const sortStatus = (a: Attendee, b: Attendee) => {
      const aPresent = a.isPresent(supabase.currentRollCallEvent);
      const bPresent = b.isPresent(supabase.currentRollCallEvent);

      if (aPresent === bPresent) {
        // Cancel out the sortAsc
        return Attendee.SortByField(a, b, "name") * (sortAsc ? 1 : -1);
      }

      if (aPresent) {
        return -1;
      }

      if (bPresent) {
        return 1;
      }

      return 0;
    };

    const sort = (a: Attendee, b: Attendee) => {
      let field: string;
      switch (sortCol) {
        case SortColumns.NAME:
          field = "name";
          break;
        case SortColumns.SURNAME:
          field = "surname";
          break;
        case SortColumns.STATUS:
        default:
          return sortStatus(a, b) * (sortAsc ? 1 : -1);
      }

      return Attendee.SortByField(a, b, field) * (sortAsc ? 1 : -1);
    };

    return filtered.sort(sort);
  }, [filtered, sortCol, sortAsc, supabase.currentRollCallEvent?.id ?? 0]);

  return (
    <S.TableContainer>
      <S.PrimaryTable>
        <tbody>
          <TableRow key="heading">
            <Heading
              colName={SortColumns.NAME}
              label={"Name"}
              sortAsc={sortAsc}
              sortCol={sortCol}
              useAZArrow={true}
              onClick={handleClickCol}
            />
            <Heading
              colName={SortColumns.SURNAME}
              label={"Surname"}
              sortAsc={sortAsc}
              sortCol={sortCol}
              useAZArrow={true}
              onClick={handleClickCol}
            />
            {/* Spacer */}
            <TableHeading />
            <Heading
              colName={SortColumns.STATUS}
              label={"✓"}
              centerLabel={true}
              sortAsc={sortAsc}
              sortCol={sortCol}
              addArrowSpacer={true}
              onClick={handleClickCol}
            />
          </TableRow>
          {sorted.map((att) => {
            const status: AttendeeStatus = att.status(
              supabase.currentRollCallEvent
            );

            return (
              <TableRow key={att.id} onClick={() => onClickedAttendee(att)}>
                <S.NameCell>{att.name}</S.NameCell>
                <S.NameCell>{att.surname}</S.NameCell>
                {/* Spacer */}
                <TableCell />
                <S.RCCell>
                  <Icon
                    size={26}
                    color={
                      status === AttendeeStatus.PRESENT
                        ? DefaultColors.BrightGreen
                        : status === AttendeeStatus.ABSENT
                        ? DefaultColors.BrightRed
                        : DefaultColors.Grey
                    }
                    icon={
                      status === AttendeeStatus.PRESENT
                        ? faCheckSquare
                        : status === AttendeeStatus.ABSENT
                        ? faXmarkSquare
                        : faMinusSquare
                    }
                  />
                </S.RCCell>
              </TableRow>
            );
          })}
        </tbody>
      </S.PrimaryTable>
    </S.TableContainer>
  );
};

interface HeadingProps {
  colName: SortColumns;
  sortCol: SortColumns;
  sortAsc: boolean;
  onClick: (colName: SortColumns) => void;
  label: string;
  centerLabel?: boolean;
  useAZArrow?: boolean;
  addArrowSpacer?: boolean;
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
    addArrowSpacer,
  } = props;

  const handleClick = useCallback(() => onClick(colName), [onClick, colName]);

  return (
    <S.StyledTableHeading onClick={handleClick} center={centerLabel}>
      <S.HeadingContainer>
        {addArrowSpacer && <SortArrow selected={false} ascending={false} />}
        <S.HeadingText>{label}</S.HeadingText>
        <SortArrow
          selected={sortCol === colName}
          ascending={sortAsc}
          useAZ={useAZArrow}
        />
      </S.HeadingContainer>
    </S.StyledTableHeading>
  );
};

export const SortArrow: React.FC<{
  ascending: boolean;
  selected: boolean;
  useAZ?: boolean;
}> = (props) => {
  const { ascending, selected, useAZ } = props;

  const icon = ascending
    ? useAZ
      ? faArrowDownAZ
      : faArrowDown
    : useAZ
    ? faArrowUpAZ
    : faArrowUp;

  return (
    <S.SortArrow
      icon={icon}
      size={14}
      color={selected ? DefaultColors.BrightGrey : "transparent"}
    />
  );
};

namespace S {
  export const SortArrow = styled(Icon)``;

  export const TableContainer = styled.div`
    color: ${DefaultColors.Text_Color};
    display: flex;
    align-items: center;
    justify-content: center;
  `;

  export const RCCell = styled(TableCell)`
    padding: 2px;
    text-align: center;
    width: 0;
  `;

  export const PrimaryTable = styled(Table)`
    width: 100%;
    font-size: 12px;
  `;

  export const StyledTableHeading = styled(TableHeading)<{ center?: boolean }>`
    text-align: ${(p) => (p.center ? "center" : null)};
    font-size: 16px;
    padding: 4px 4px;
  `;

  export const NameCell = styled(TableCell)`
    width: 0;
    padding: 0px 4px;
  `;

  export const HeadingText = styled.span``;

  export const HeadingContainer = styled.div`
    display: flex;
    align-items: center;
    gap: 5px;
  `;
}
