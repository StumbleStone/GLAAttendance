import { useTheme } from "@emotion/react";
import styled from "@emotion/styled";
import {
  faBusSimple,
  faCar,
  faCheckSquare,
  faMinusSquare,
  faXmarkSquare,
} from "@fortawesome/free-solid-svg-icons";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { RollCallEventEntry } from "../SupaBase/types";
import { Attendee, AttendeeStatus } from "./Attendee";
import { SummaryPill, SummaryPillId, SummaryPillProps } from "./SummaryPill";

export type SummaryPillSelection = Record<SummaryPillId, boolean>;

export interface AttendeesSummaryProps {
  rows: Attendee[];
  currentRollCallEvent: RollCallEventEntry;
  onPillSelectionChanged?: (pills: SummaryPillId[]) => void;
  statusOnly?: boolean;
  compact?: boolean;
  showLabels?: boolean;
}

export const AttendeesSummary: React.FC<AttendeesSummaryProps> = (
  props: AttendeesSummaryProps,
) => {
  const { rows, currentRollCallEvent, onPillSelectionChanged } = props;
  const theme = useTheme();
  const [selectedPills, setSelectedPills] = useState<SummaryPillId[]>([]);

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

  const handleToggleSummaryPill = useCallback((pillId: SummaryPillId) => {
    setSelectedPills((prev) => {
      const newPills = [...prev];
      const index = newPills.indexOf(pillId);
      if (index >= 0) {
        newPills.splice(index, 1);
      } else {
        newPills.push(pillId);
      }

      return newPills;
    });
  }, []);

  useEffect(() => {
    onPillSelectionChanged?.(Object.keys(selectedPills) as SummaryPillId[]);
  }, [selectedPills, onPillSelectionChanged]);

  const pillData: SummaryPillProps[] = useMemo(
    () => [
      {
        id: SummaryPillId.PRESENT,
        label: "Present",
        value: summary.present,
        icon: faCheckSquare,
        color: theme.colors.accent.success,
        selected: selectedPills.includes(SummaryPillId.PRESENT),
        onToggle: handleToggleSummaryPill,
      },
      {
        id: SummaryPillId.ABSENT,
        label: "Absent",
        value: summary.absent,
        icon: faXmarkSquare,
        color: theme.colors.accent.danger,
        selected: selectedPills.includes(SummaryPillId.ABSENT),
        onToggle: handleToggleSummaryPill,
      },
      {
        id: SummaryPillId.NOT_SCANNED,
        label: "No Scan",
        value: summary.notScanned,
        icon: faMinusSquare,
        color: theme.colors.state.disabled,
        selected: selectedPills.includes(SummaryPillId.NOT_SCANNED),
        onToggle: handleToggleSummaryPill,
      },
      {
        id: SummaryPillId.BUS,
        label: "Bus",
        value: summary.bus,
        icon: faBusSimple,
        color: theme.colors.accent.transportBus,
        selected: selectedPills.includes(SummaryPillId.BUS),
        onToggle: handleToggleSummaryPill,
      },
      {
        id: SummaryPillId.CAR,
        label: "Car",
        value: summary.car,
        icon: faCar,
        color: theme.colors.accent.transportCar,
        selected: selectedPills.includes(SummaryPillId.CAR),
        onToggle: handleToggleSummaryPill,
      },
    ],
    [handleToggleSummaryPill, selectedPills, summary],
  );

  return (
    <S.SummaryBar>
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
