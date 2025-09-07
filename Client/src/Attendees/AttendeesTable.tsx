import styled from "@emotion/styled";
import {
  faCheckSquare,
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
import { Attendee } from "../SupaBase/Attendee";
import { SupaBase, SupaBaseEventKey } from "../SupaBase/SupaBase";
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
    console.log(`Listeners Setup`);
    return supabase.addListener({
      [SupaBaseEventKey.LOADED_ROLLCALLS]: forceUpdate,
      [SupaBaseEventKey.DELETED_ATTENDEES]: forceUpdate,
      [SupaBaseEventKey.ADDED_ATTENDEES]: forceUpdate,
      [SupaBaseEventKey.UPDATED_ROLLCALL_EVENT]: forceUpdate,
    });
  }, []);

  const filtered = useMemo<Attendee[]>(() => {
    console.log(`Rerunning filtered`);
    if (!supabase.attendees || supabase.attendees.size == 0) {
      console.log(`Rerunning filtered 0, attendees empty`);
      return [];
    }

    if (!filter || filter == "") {
      console.log(`Rerunning filtered ${supabase.attendees.size}, no filter`);
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
      const aPresent = a.isPresent(supabase.currentRollCallEvent);
      const bPresent = b.isPresent(supabase.currentRollCallEvent);

      if (aPresent === bPresent) {
        // Cancel out the sortAsc
        return sortField(a, b, "name") * (sortAsc ? 1 : -1);
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

      return sortField(a, b, field) * (sortAsc ? 1 : -1);
    };

    return filtered.sort(sort);
  }, [filtered, sortCol, sortAsc, supabase.currentRollCallEvent?.id ?? 0]);

  return (
    <S.TableContainer>
      <S.PrimaryTable>
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
            <S.CenteredHeading
              color={
                sortCol !== SortColumns.STATUS
                  ? undefined
                  : sortAsc
                  ? DefaultColors.BrightGreen
                  : DefaultColors.BrightRed
              }
              onClick={() => handleClickCol(SortColumns.STATUS)}
            >
              {`RC: ${supabase.currentRollCallEvent?.counter || 0}`}
            </S.CenteredHeading>
          </TableRow>
          {sorted.map((att) => {
            const isPresentOnThisRollCall = att.isPresent(
              supabase.currentRollCallEvent
            );

            return (
              <TableRow key={att.id} onClick={() => onClickedAttendee(att)}>
                <S.NameCell>{att.name}</S.NameCell>
                <S.NameCell>{att.surname}</S.NameCell>
                <S.Cell>
                  <Icon
                    size={18}
                    color={
                      isPresentOnThisRollCall
                        ? DefaultColors.BrightGreen
                        : DefaultColors.BrightRed
                    }
                    icon={
                      isPresentOnThisRollCall ? faCheckSquare : faXmarkSquare
                    }
                  />
                </S.Cell>
              </TableRow>
            );
          })}
        </tbody>
      </S.PrimaryTable>
      <S.SecondaryTable>
        <tbody>
          {false && (
            <TableRow key="heading">
              <S.CenteredHeading></S.CenteredHeading>
            </TableRow>
          )}
          {false &&
            sorted.map((att) => (
              <TableRow key={att.id} onClick={() => onClickedAttendee(att)}>
                <S.Cell>
                  <Icon
                    size={18}
                    color={
                      att.isPresent(supabase.currentRollCallEvent)
                        ? DefaultColors.BrightGreen
                        : DefaultColors.BrightRed
                    }
                    icon={
                      att.isPresent(supabase.currentRollCallEvent)
                        ? faCheckSquare
                        : faXmarkSquare
                    }
                  />
                </S.Cell>
              </TableRow>
            ))}
        </tbody>
      </S.SecondaryTable>
    </S.TableContainer>
  );
};

namespace S {
  export const TableContainer = styled.div`
    color: ${DefaultColors.Text_Color};
    display: flex;
  `;

  export const Cell = styled(TableCell)`
    border-left: 1px solid ${DefaultColors.Black};
    padding: 2px;
    text-align: center;
  `;

  export const PrimaryTable = styled(Table)`
    width: auto;
  `;

  export const SecondaryTable = styled(Table)`
    flex: 1;
  `;

  export const CenteredHeading = styled(TableHeading)`
    text-align: center;
  `;

  export const NameCell = styled(TableCell)`
    width: 0px;
  `;
}
