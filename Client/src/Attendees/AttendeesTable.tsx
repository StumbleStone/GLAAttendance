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
import {
  AttendeesEntry,
  SupaBase,
  SupaBaseEventKey,
} from "../SupaBase/SupaBase";
import { DefaultColors } from "../Tools/Toolbox";

export interface AttendeesTableProps {
  supabase: SupaBase;
  filter: string;
  onClickedAttendee: (entry: AttendeesEntry) => void;
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

  const [sortCol, setSortCol] = useState<SortColumns>(SortColumns.NAME);
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  const [, forceUpdate] = useReducer((x) => x + 1, 0);

  useEffect(() => {
    const l = supabase.addListener({
      [SupaBaseEventKey.LOADED_ATTENDEES]: () => forceUpdate(),
      [SupaBaseEventKey.DELETED_ATTENDEES]: () => forceUpdate(),
      [SupaBaseEventKey.ADDED_ATTENDEES]: () => forceUpdate(),
    });

    return l;
  }, []);

  const filtered = useMemo<AttendeesEntry[]>(() => {
    if (!supabase.attendees || supabase.attendees.length == 0) {
      return [];
    }

    if (!filter || filter == "") {
      return supabase.attendees;
    }

    let outArr: AttendeesEntry[] = [];

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
  }, [filter, supabase.attendees]);

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

  const sorted = useMemo(() => {
    const sort = (a: AttendeesEntry, b: AttendeesEntry) => {
      let field: string;
      switch (sortCol) {
        case SortColumns.NAME:
          field = "name";
          break;
        case SortColumns.SURNAME:
          field = "surname";
          break;
        case SortColumns.STATUS:
          field = "status";
          break;
        default:
          field = "name";
      }

      const res = (a as any)[field].localeCompare((b as any)[field], "en", {
        sensitivity: "base",
      });

      return res * (sortAsc ? 1 : -1);
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
                sortCol === SortColumns.NAME
                  ? DefaultColors.BrightGreen
                  : undefined
              }
              onClick={() => handleClickCol(SortColumns.NAME)}
            >
              Name
            </TableHeading>
            <TableHeading
              color={
                sortCol === SortColumns.SURNAME
                  ? DefaultColors.BrightGreen
                  : undefined
              }
              onClick={() => handleClickCol(SortColumns.SURNAME)}
            >
              Surname
            </TableHeading>
            <TableHeading
              color={
                sortCol === SortColumns.STATUS
                  ? DefaultColors.BrightGreen
                  : undefined
              }
              onClick={() => handleClickCol(SortColumns.STATUS)}
            ></TableHeading>
          </TableRow>
          {sorted.map((att) => (
            <TableRow key={att.id} onClick={() => onClickedAttendee(att)}>
              <S.NameCell>{att.name}</S.NameCell>
              <S.NameCell>{att.surname}</S.NameCell>
              <S.Cell></S.Cell>
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

  export const NameCell = styled(TableCell)`
    width: 0px;
  `;
}
