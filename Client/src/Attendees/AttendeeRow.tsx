import styled from "@emotion/styled";
import React, { useCallback, useEffect, useReducer } from "react";
import { TableCell } from "../Components/Table/TableCell";
import { TableRow } from "../Components/Table/TableRow";
import { SupaBase } from "../SupaBase/SupaBase";
import { epochToDate } from "../Tools/Toolbox";
import { Attendee, AttendeeStatus } from "./Attendee";
import { SortColumns, SortColumnSize, SortColumnsMap } from "./Shared";
import { StatusChip } from "./StatusChip";
import { TransportChip } from "./TransportChip";

export interface AttendeeRowProps {
  att: Attendee;
  supabase: SupaBase;
  onClickAttendee: (attendee: Attendee) => void;
  index: number;
  selected: boolean;
  columnSizes: SortColumnsMap;
}

function getRecorderName(
  att: Attendee,
  supabase: SupaBase,
  columnSizes: SortColumnsMap,
  status: AttendeeStatus,
): string {
  if (status == AttendeeStatus.NOT_SCANNED || !att.currentRollCall) {
    return "--";
  }

  if (columnSizes[SortColumns.BY] <= SortColumnSize.COMPACTER) {
    return supabase.getUserInitials(att.currentRollCall!.created_by);
  }

  let recorderName = supabase.getUserName(att.currentRollCall!.created_by, {
    nameOnly: true,
  });

  if (columnSizes[SortColumns.BY] <= SortColumnSize.COMPACT) {
    const suffix = recorderName.length > 8 ? "..." : "";
    return recorderName.substring(0, 8) + suffix;
  }

  return recorderName;
}

export const AttendeeRow: React.FC<AttendeeRowProps> = (
  props: AttendeeRowProps,
) => {
  const { att, supabase, onClickAttendee, index, selected, columnSizes } =
    props;

  const status: AttendeeStatus = att.status(supabase.currentRollCallEvent);
  const [, forceUpdate] = useReducer((x) => x + 1, 0);

  useEffect(() => {
    return att.addListener({
      updated: forceUpdate,
    });
  }, []);

  if (att.isDeleted) {
    return null;
  }

  const handleClickRow = useCallback(() => {
    onClickAttendee(att);
  }, [att, onClickAttendee]);

  return (
    <S.DataRow key={att.id} onClick={handleClickRow} selected={selected}>
      <S.IndexCell>{index + 1}</S.IndexCell>
      {columnSizes[SortColumns.NAME] && (
        <S.PrimaryNameCell>{att.name}</S.PrimaryNameCell>
      )}
      {columnSizes[SortColumns.SURNAME] && (
        <S.SurnameCell>{att.surname}</S.SurnameCell>
      )}
      <S.SpacerCell />
      {columnSizes[SortColumns.TP] && (
        <S.TransportCell>
          <TransportChip
            usingOwnTransport={att.isUsingOwnTransport}
            size={columnSizes[SortColumns.TP]}
          />
        </S.TransportCell>
      )}
      {columnSizes[SortColumns.STATUS] && (
        <S.StatusCell>
          <StatusChip
            status={status}
            compact={
              columnSizes[SortColumns.STATUS] === SortColumnSize.COMPACTER
            }
          />
        </S.StatusCell>
      )}
      {columnSizes[SortColumns.ON] && (
        <S.NameCell>
          {status !== AttendeeStatus.NOT_SCANNED
            ? epochToDate(new Date(att.currentRollCall!.created_at).getTime(), {
                includeDate: false,
                includeTime: true,
                includeSeconds:
                  columnSizes[SortColumns.ON] >= SortColumnSize.NORMAL,
              })
            : "--"}
        </S.NameCell>
      )}
      {columnSizes[SortColumns.BY] && (
        <S.RecorderCell>
          {getRecorderName(att, supabase, columnSizes, status)}
        </S.RecorderCell>
      )}
    </S.DataRow>
  );
};

namespace S {
  export const RCCell = styled(TableCell)`
    padding: 2px;
    text-align: center;
    width: 0;
  `;

  export const DataRow = styled(TableRow)<{ selected: boolean }>`
    background-color: ${(p) =>
      p.selected ? `${p.theme.colors.accent.primary}38` : null} !important;
    box-shadow: ${(p) =>
      p.selected
        ? `inset 3px 0 0 0 ${p.theme.colors.accent.primary}, inset 0 0 0 1px ${p.theme.colors.accent.primary}66`
        : "none"};

    :hover {
      background-color: ${(p) =>
        p.selected
          ? `${p.theme.colors.accent.primary}48`
          : `${p.theme.colors.table.rowHover}`};
    }
  `;

  export const StatusCell = styled(RCCell)`
    width: 1%;
  `;

  export const TransportCell = styled(RCCell)`
    width: 1%;
  `;

  export const IndexCell = styled(RCCell)`
    width: 1%;
    max-width: 1%;
    white-space: nowrap;
    text-align: right;
    color: ${(p) => p.theme.colors.table.index};
    font-size: 0.9em;
    font-weight: 500;
    padding-right: 8px;
  `;

  export const NameCell = styled(TableCell)`
    width: 0;
    padding: 4px 4px;
    overflow: hidden;
  `;

  export const PrimaryNameCell = styled(NameCell)`
    font-weight: 700;
  `;

  export const SurnameCell = styled(NameCell)`
    font-weight: 400;
  `;

  export const RecorderCell = styled(NameCell)`
    color: ${(p) => p.theme.colors.textMuted};
    font-size: 0.92em;
    font-weight: 500;
  `;

  export const SpacerCell = styled(TableCell)`
    min-width: 0;
    padding: 0;
  `;
}
