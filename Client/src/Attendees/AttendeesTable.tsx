import styled from "@emotion/styled";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from "react";
import { Table } from "../Components/Table/Table";
import { TableCell } from "../Components/Table/TableCell";
import { TableHeading } from "../Components/Table/TableHeading";
import { TableRow } from "../Components/Table/TableRow";
import { Attendee } from "../SupaBase/Attendee";
import { SupaBase, SupaBaseEventKey } from "../SupaBase/SupaBase";
import { RollCallStatus } from "../SupaBase/types";
import { DefaultColors } from "../Tools/Toolbox";

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
    const l = supabase.addListener({
      [SupaBaseEventKey.LOADED_ROLLCALLS]: () => forceUpdate(),
      [SupaBaseEventKey.DELETED_ATTENDEES]: () => forceUpdate(),
      [SupaBaseEventKey.ADDED_ATTENDEES]: () => forceUpdate(),
    });

    return l;
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
    const sortField = (a: Attendee, b: Attendee, field: string) =>
      (a as any)[field].localeCompare((b as any)[field], "en", {
        sensitivity: "base",
      });
    const sortStatus = (a: Attendee, b: Attendee) => {
      if (a.status === b.status) {
        // Cancel out the sortAsc
        return sortField(a, b, "name") * (sortAsc ? 1 : -1);
      }

      if (a.status === RollCallStatus.PRESENT) {
        return -1;
      }

      if (b.status === RollCallStatus.PRESENT) {
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

      return sortField(a, b, field) * (sortAsc ? 1 : -1);
    };

    return filtered.sort(sort);
  }, [filtered, sortCol, sortAsc]);

  return (
    <S.TableContainer>
      <Table>
        <tbody>
          <TableRow key="heading">
            <TableHeading
              color={
                sortCol !== SortColumns.NAME
                  ? undefined
                  : sortAsc
                  ? DefaultColors.BrightGreen
                  : DefaultColors.BrightRed
              }
              onClick={() => handleClickCol(SortColumns.NAME)}
            >
              Name
            </TableHeading>
            <TableHeading
              color={
                sortCol !== SortColumns.SURNAME
                  ? undefined
                  : sortAsc
                  ? DefaultColors.BrightGreen
                  : DefaultColors.BrightRed
              }
              onClick={() => handleClickCol(SortColumns.SURNAME)}
            >
              Surname
            </TableHeading>
            <TableHeading
              color={
                sortCol !== SortColumns.STATUS
                  ? undefined
                  : sortAsc
                  ? DefaultColors.BrightGreen
                  : DefaultColors.BrightRed
              }
              onClick={() => handleClickCol(SortColumns.STATUS)}
            >
              Status
            </TableHeading>
          </TableRow>
          {sorted.map((att) => (
            <TableRow key={att.id} onClick={() => onClickedAttendee(att)}>
              <S.NameCell>{att.name}</S.NameCell>
              <S.NameCell>{att.surname}</S.NameCell>
              <S.Cell
                color={
                  att.status === RollCallStatus.PRESENT
                    ? DefaultColors.BrightGreen
                    : DefaultColors.BrightRed
                }
              >
                {att.status}
              </S.Cell>
            </TableRow>
          ))}
        </tbody>
      </Table>
    </S.TableContainer>
  );
};

namespace S {
  export const TableContainer = styled.div`
    color: ${DefaultColors.Text_Color};
  `;

  export const Cell = styled(TableCell)`
    border-left: 1px solid ${DefaultColors.Black};
  `;

  export const NameCell = styled(TableCell)``;
}
