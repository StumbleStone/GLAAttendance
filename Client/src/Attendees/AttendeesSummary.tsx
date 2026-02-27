import { useTheme } from "@emotion/react";
import styled from "@emotion/styled";
import {
  faBusSimple,
  faCar,
  faCheckSquare,
  faMinusSquare,
  faXmarkSquare,
} from "@fortawesome/free-solid-svg-icons";
import React, { useCallback, useMemo } from "react";
import { RollCallEventEntry } from "../SupaBase/types";
import { Attendee, AttendeeStatus } from "./Attendee";
import {
  SummaryPill,
  SummaryPillId,
  SummaryPillProps,
  SummaryPillSelection,
} from "./SummaryPill";

export interface AttendeesSummaryProps {
  rows: Attendee[];
  currentRollCallEvent: RollCallEventEntry;
  selectedPills: SummaryPillSelection;
  setSelectedPills: (
    cb: (prev: SummaryPillSelection) => SummaryPillSelection,
  ) => void;
  statusOnly?: boolean;
  compact?: boolean;
  showLabels?: boolean;
}

export const AttendeesSummary: React.FC<AttendeesSummaryProps> = (
  props: AttendeesSummaryProps,
) => {
  const { rows, currentRollCallEvent, selectedPills, setSelectedPills } = props;
  const theme = useTheme();

  const summary = useMemo(() => {
    let present = 0;
    let absent = 0;
    let notScanned = 0;
    let bus = 0;
    let car = 0;

    rows.forEach((att) => {
      const status = att.status(currentRollCallEvent);
      if (status === AttendeeStatus.PRESENT) {
        present++;
      } else if (status === AttendeeStatus.ABSENT) {
        absent++;
      } else {
        notScanned++;
      }

      if (att.isUsingOwnTransport) {
        car++;
      } else {
        bus++;
      }
    });

    return {
      present,
      absent,
      notScanned,
      bus,
      car,
    };
  }, [rows, currentRollCallEvent?.id ?? 0]);

  const handleToggleSummaryPill = useCallback(
    (pillId: SummaryPillId) => {
      setSelectedPills((prev: SummaryPillSelection) => {
        return {
          ...prev,
          [pillId]: !prev[pillId],
        };
      });
    },
    [setSelectedPills],
  );

  const pillData: SummaryPillProps[] = useMemo(
    () => [
      {
        id: SummaryPillId.PRESENT,
        label: "Present",
        value: summary.present,
        icon: faCheckSquare,
        color: theme.colors.accent.success,
        selected: selectedPills[SummaryPillId.PRESENT],
        onToggle: handleToggleSummaryPill,
      },
      {
        id: SummaryPillId.ABSENT,
        label: "Absent",
        value: summary.absent,
        icon: faXmarkSquare,
        color: theme.colors.accent.danger,
        selected: selectedPills[SummaryPillId.ABSENT],
        onToggle: handleToggleSummaryPill,
      },
      {
        id: SummaryPillId.NOT_SCANNED,
        label: "No Scan",
        value: summary.notScanned,
        icon: faMinusSquare,
        color: theme.colors.state.disabled,
        selected: selectedPills[SummaryPillId.NOT_SCANNED],
        onToggle: handleToggleSummaryPill,
      },
      {
        id: SummaryPillId.BUS,
        label: "Bus",
        value: summary.bus,
        icon: faBusSimple,
        color: theme.colors.accent.transportBus,
        selected: selectedPills[SummaryPillId.BUS],
        onToggle: handleToggleSummaryPill,
      },
      {
        id: SummaryPillId.CAR,
        label: "Car",
        value: summary.car,
        icon: faCar,
        color: theme.colors.accent.transportCar,
        selected: selectedPills[SummaryPillId.CAR],
        onToggle: handleToggleSummaryPill,
      },
    ],
    [handleToggleSummaryPill, selectedPills, summary],
  );

  const statusPills = pillData.filter(
    (pill) =>
      pill.id === SummaryPillId.PRESENT ||
      pill.id === SummaryPillId.ABSENT ||
      pill.id === SummaryPillId.NOT_SCANNED,
  );
  const transportPills = pillData.filter(
    (pill) => pill.id === SummaryPillId.BUS || pill.id === SummaryPillId.CAR,
  );

  return (
    <S.SummaryBar>
      <S.Group>
        <S.GroupLabel>Status</S.GroupLabel>
        <S.PillsRow>
          {statusPills.map((pill) => (
            <SummaryPill key={pill.id} {...pill} />
          ))}
        </S.PillsRow>
      </S.Group>

      <S.Group>
        <S.GroupLabel>Transport</S.GroupLabel>
        <S.PillsRow>
          {transportPills.map((pill) => (
            <SummaryPill key={pill.id} {...pill} />
          ))}
        </S.PillsRow>
      </S.Group>
    </S.SummaryBar>
  );
};

namespace S {
  export const SummaryBar = styled.div`
    display: flex;
    gap: 8px;
    margin-bottom: 8px;
    width: 100%;
    flex-wrap: wrap;
    justify-content: stretch;
  `;

  export const Group = styled.div`
    flex: 1 1 260px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 6px;
    border: 1px solid ${(p) => p.theme.colors.borderSubtle};
    border-radius: ${(p) => p.theme.radius.lg};
    background-color: ${(p) => p.theme.colors.surfaceRaised};
  `;

  export const GroupLabel = styled.div`
    font-size: 10px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    font-weight: 700;
    color: ${(p) => p.theme.colors.textMuted};
    padding: 0 2px;
  `;

  export const PillsRow = styled.div`
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  `;
}
