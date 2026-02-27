import { useTheme } from "@emotion/react";
import styled from "@emotion/styled";
import {
  faBusSimple,
  faCar,
  faCheckSquare,
  faMinusSquare,
  faXmarkSquare,
} from "@fortawesome/free-solid-svg-icons";
import React, { useMemo } from "react";
import { RollCallEventEntry } from "../SupaBase/types";
import { Attendee, AttendeeStatus } from "./Attendee";
import { SummaryPill, SummaryPillId, SummaryPillProps } from "./SummaryPill";

export type SummaryPillSelection = Record<SummaryPillId, boolean>;

export interface AttendeesSummaryProps {
  className?: string;
  rows: Attendee[];
  currentRollCallEvent: RollCallEventEntry;
  selectedPills?: SummaryPillSelection;
  onTogglePill?: (pillId: SummaryPillId) => void;
  clickable?: boolean;
  statusOnly?: boolean;
  compact?: boolean;
  showLabels?: boolean;
}

export const AttendeesSummary: React.FC<AttendeesSummaryProps> = (
  props: AttendeesSummaryProps,
) => {
  const theme = useTheme();
  const { className, rows, currentRollCallEvent, selectedPills, onTogglePill } =
    props;

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

  const pillData: SummaryPillProps[] = useMemo(
    () => [
      {
        id: SummaryPillId.PRESENT,
        label: "Present",
        value: summary.present,
        icon: faCheckSquare,
        color: theme.colors.accent.success,
        selected: selectedPills?.[SummaryPillId.PRESENT] ?? false,
        onToggle: onTogglePill,
      },
      {
        id: SummaryPillId.ABSENT,
        label: "Absent",
        value: summary.absent,
        icon: faXmarkSquare,
        color: theme.colors.accent.danger,
        selected: selectedPills?.[SummaryPillId.ABSENT] ?? false,
        onToggle: onTogglePill,
      },
      {
        id: SummaryPillId.NOT_SCANNED,
        label: "No Scan",
        value: summary.notScanned,
        icon: faMinusSquare,
        color: theme.colors.state.disabled,
        selected: selectedPills?.[SummaryPillId.NOT_SCANNED] ?? false,
        onToggle: onTogglePill,
      },
      {
        id: SummaryPillId.BUS,
        label: "Bus",
        value: summary.bus,
        icon: faBusSimple,
        color: theme.colors.accent.transportBus,
        selected: selectedPills?.[SummaryPillId.BUS] ?? false,
        onToggle: onTogglePill,
      },
      {
        id: SummaryPillId.CAR,
        label: "Car",
        value: summary.car,
        icon: faCar,
        color: theme.colors.accent.transportCar,
        selected: selectedPills?.[SummaryPillId.CAR] ?? false,
        onToggle: onTogglePill,
      },
    ],
    [onTogglePill, selectedPills, summary],
  );

  return (
    <S.SummaryBar className={className}>
      {pillData.map((pill) => (
        <SummaryPill key={pill.id} {...pill} />
      ))}
    </S.SummaryBar>
  );
};

namespace S {
  export const SummaryBar = styled.div`
    display: flex;
    gap: 6px;
    margin-bottom: 8px;
    width: 100%;
    flex-wrap: wrap;
    justify-content: center;
  `;
}
