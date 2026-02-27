import { useTheme } from "@emotion/react";
import styled from "@emotion/styled";
import {
  faCheckSquare,
  faMinusSquare,
  faXmarkSquare,
} from "@fortawesome/free-solid-svg-icons";
import React from "react";
import { Icon } from "../Components/Icon";
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
    <S.StatusChip color={color} compact={compact} title={status}>
      <Icon color={color} size={14} icon={icon} />
      <S.StatusChipLabel>
        {compact ? getCompactLabel(status) : getLabel(status)}
      </S.StatusChipLabel>
    </S.StatusChip>
  );
};

export const StatusChip = React.memo(StatusChipComponent);
StatusChip.displayName = "StatusChip";

namespace S {
  export const StatusChip = styled.span<{ color: string; compact?: boolean }>`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: ${(p) => (p.compact ? "4px" : "6px")};
    white-space: nowrap;
    border-radius: ${(p) => p.theme.radius.pill};
    padding: ${(p) => (p.compact ? "2px 6px" : "3px 10px")};
    font-size: ${(p) => (p.compact ? "10px" : "11px")};
    font-weight: 700;
    line-height: 1;
    color: ${(p) => p.color};
    border: 1px solid ${(p) => `${p.color}66`};
    background-color: ${(p) => `${p.color}1a`};
  `;

  export const StatusChipLabel = styled.span``;
}
