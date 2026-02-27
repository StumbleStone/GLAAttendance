import { useTheme } from "@emotion/react";
import styled from "@emotion/styled";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faBusSimple,
  faCar,
  faCheckSquare,
  faMinusSquare,
  faXmarkSquare,
} from "@fortawesome/free-solid-svg-icons";
import React, { useMemo } from "react";
import { Icon } from "../Components/Icon";
import { RollCallEventEntry } from "../SupaBase/types";
import { Attendee, AttendeeStatus } from "./Attendee";

export interface AttendeesSummaryProps {
  rows: Attendee[];
  currentRollCallEvent: RollCallEventEntry;
}

export const AttendeesSummary: React.FC<AttendeesSummaryProps> = (
  props: AttendeesSummaryProps,
) => {
  const theme = useTheme();
  const { rows, currentRollCallEvent } = props;

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

  return (
    <S.SummaryBar>
      <SummaryPill
        label="Present"
        value={summary.present}
        icon={faCheckSquare}
        color={theme.colors.accent.success}
      />
      <SummaryPill
        label="Absent"
        value={summary.absent}
        icon={faXmarkSquare}
        color={theme.colors.accent.danger}
      />
      <SummaryPill
        label="No Scan"
        value={summary.notScanned}
        icon={faMinusSquare}
        color={theme.colors.state.disabled}
      />
      <SummaryPill
        label="Bus"
        value={summary.bus}
        icon={faBusSimple}
        color={theme.colors.accent.transportBus}
      />
      <SummaryPill
        label="Car"
        value={summary.car}
        icon={faCar}
        color={theme.colors.accent.transportCar}
      />
    </S.SummaryBar>
  );
};

interface SummaryPillProps {
  icon: IconDefinition;
  label: string;
  value: number;
  color: string;
}

const SummaryPill: React.FC<SummaryPillProps> = (props: SummaryPillProps) => {
  const { icon, label, value, color } = props;

  return (
    <S.SummaryItem color={color}>
      <S.SummaryLead>
        <S.SummaryIcon icon={icon} size={12} color={color} />
        <S.SummaryLabel>{label}</S.SummaryLabel>
      </S.SummaryLead>
      <S.SummaryValue>{value}</S.SummaryValue>
    </S.SummaryItem>
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

  export const SummaryItem = styled.span<{ color: string }>`
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-radius: ${(p) => p.theme.radius.pill};
    padding: 4px 10px;
    border: 1px solid ${(p) => `${p.color}66`};
    background-color: ${(p) => `${p.color}14`};
    color: ${(p) => p.color};
    font-size: 11px;
    line-height: 1;
    min-height: 24px;
    gap: 6px;
  `;

  export const SummaryLead = styled.span`
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
  `;

  export const SummaryIcon = styled(Icon)``;

  export const SummaryLabel = styled.span`
    color: ${(p) => p.theme.colors.textMuted};
    font-weight: 600;
    white-space: nowrap;
  `;

  export const SummaryValue = styled.span`
    color: ${(p) => p.theme.colors.text};
    font-weight: 800;
    min-width: 12px;
    text-align: right;
  `;
}
