import styled from "@emotion/styled";
import React, { useCallback, useEffect, useMemo, useState } from "react";
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

  const [attendees, setAttendees] = useState<AttendeesEntry[]>(
    supabase.attendees
  );

  const [sortCol, setSortCol] = useState<SortColumns>(SortColumns.NAME);
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  useEffect(() => {
    const l = supabase.addListener({
      [SupaBaseEventKey.LOADED_ATTENDEES]: (attendees) =>
        setAttendees(attendees),
    });

    return l;
  }, []);

  const filtered = useMemo<AttendeesEntry[]>(() => {
    if (!attendees || attendees.length == 0) {
      return [];
    }

    if (!filter || filter == "") {
      return attendees;
    }

    let outArr: AttendeesEntry[] = [];

    filter
      .toLowerCase()
      .split(/ +/)
      .forEach((part) => {
        attendees.forEach((att) => {
          if (
            att.name?.toLowerCase().includes(part) ||
            att.surname?.toLowerCase().includes(part)
          ) {
            outArr.push(att);
          }
        });
      });

    return outArr;
  }, [filter, attendees]);

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
      <S.Table>
        <tbody>
          <S.Row key="heading">
            <S.Heading onClick={() => handleClickCol(SortColumns.NAME)}>
              Name
            </S.Heading>
            <S.Heading onClick={() => handleClickCol(SortColumns.SURNAME)}>
              Surname
            </S.Heading>
            <S.Heading
              onClick={() => handleClickCol(SortColumns.STATUS)}
            ></S.Heading>
          </S.Row>
          {sorted.map((att) => (
            <S.Row key={att.id} onClick={() => onClickedAttendee(att)}>
              <S.NameCell>{att.name}</S.NameCell>
              <S.NameCell>{att.surname}</S.NameCell>
              <S.Cell></S.Cell>
            </S.Row>
          ))}
        </tbody>
      </S.Table>
    </S.TableContainer>
  );
};

namespace S {
  export const TableContainer = styled.div`
    color: ${DefaultColors.Text_Color};
  `;

  export const Table = styled.table`
    color: ${DefaultColors.Text_Color};
    font-family: monospace;
    font-size: 18px;
    border-collapse: collapse;
    width: 100%;
    user-select: none;
  `;

  export const Row = styled.tr`
    border: 1px solid ${DefaultColors.Black};
    cursor: pointer;

    :nth-of-type(odd) {
      background-color: ${DefaultColors.Black}22;
    }

    :nth-of-type(even) {
      background-color: ${"#3f3f3f"};
    }
  `;

  export const SharedCell = styled.td`
    border-top: 1px solid ${DefaultColors.Black};
    border-bottom: 1px solid ${DefaultColors.Black};
    padding: 0px 6px;
    user-select: none;
  `;

  export const Cell = styled(SharedCell)`
    border-left: 1px solid ${DefaultColors.Black};
  `;

  export const NameCell = styled(SharedCell)`
    width: 0px;
  `;

  export const Heading = styled.th`
    border-top: 1px solid ${DefaultColors.Black};
    border-bottom: 1px solid ${DefaultColors.Black};
    font-weight: bolder;
    padding: 0px 6px;
  `;
}
