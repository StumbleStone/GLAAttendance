import { useTheme } from "@emotion/react";
import styled from "@emotion/styled";
import {
  faCheckSquare,
  faMinusSquare,
  faXmarkSquare,
} from "@fortawesome/free-solid-svg-icons";
import React from "react";
import { Chip } from "../Components/Chip/Chip";
import { AttendeeStatus } from "./Attendee";

export interface StatusChipProps {
  status: AttendeeStatus;
  compact?: boolean;
}

function getCompactLabel(status: AttendeeStatus): string {
  switch (status) {
    case AttendeeStatus.PRESENT:
      return "Pres";
    case AttendeeStatus.ABSENT:
      return "Abs";
    case AttendeeStatus.NOT_SCANNED:
      return "Pend";
    default:
      return status;
  }
}

function getLabel(status: AttendeeStatus): string {
  switch (status) {
    case AttendeeStatus.PRESENT:
      return "Present";
    case AttendeeStatus.ABSENT:
      return "Absent";
    case AttendeeStatus.NOT_SCANNED:
      return "Pending";
    default:
      return status;
  }
}

const StatusChipComponent: React.FC<StatusChipProps> = (
  props: StatusChipProps,
) => {
  const theme = useTheme();
  const { status, compact = false } = props;

  const color =
    status === AttendeeStatus.PRESENT
      ? theme.colors.accent.success
      : status === AttendeeStatus.ABSENT
        ? theme.colors.accent.danger
        : theme.colors.state.disabled;

  const icon =
    status === AttendeeStatus.PRESENT
      ? faCheckSquare
      : status === AttendeeStatus.ABSENT
        ? faXmarkSquare
        : faMinusSquare;

  return (
    <S.StatusChip
      tone={color}
      compact={compact}
      title={status}
      icon={icon}
      iconSize={14}
      label={compact ? getCompactLabel(status) : getLabel(status)}
    />
  );
};

export const StatusChip = React.memo(StatusChipComponent);
StatusChip.displayName = "StatusChip";

namespace S {
  export const StatusChip = styled(Chip)<{ tone: string; compact: boolean }>`
    color: ${(p) => p.tone};
    border-color: ${(p) => `${p.tone}66`};
    background-color: ${(p) => `${p.tone}1a`};
    padding: ${(p) => (p.compact ? "2px 6px" : "3px 10px")};
    font-size: ${(p) => (p.compact ? "10px" : "11px")};
  `;
}
