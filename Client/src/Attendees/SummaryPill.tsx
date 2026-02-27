import styled from "@emotion/styled";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import React from "react";
import { Icon } from "../Components/Icon";

export interface SummaryPillProps {
  id: SummaryPillId;
  icon: IconDefinition;
  label: string;
  value: number;
  color: string;
  selected?: boolean;
  onToggle?: (pillId: SummaryPillId) => void;
}

export enum SummaryPillId {
  PRESENT = "present",
  ABSENT = "absent",
  NOT_SCANNED = "not_scanned",
  BUS = "bus",
  CAR = "car",
}

export type SummaryPillSelection = Record<SummaryPillId, boolean>;

export function createSummaryPillSelection(
  selectedByDefault: boolean,
): SummaryPillSelection {
  return {
    [SummaryPillId.PRESENT]: selectedByDefault,
    [SummaryPillId.ABSENT]: selectedByDefault,
    [SummaryPillId.NOT_SCANNED]: selectedByDefault,
    [SummaryPillId.BUS]: selectedByDefault,
    [SummaryPillId.CAR]: selectedByDefault,
  };
}

export const SummaryPill: React.FC<SummaryPillProps> = (
  props: SummaryPillProps,
) => {
  const { id, icon, label, value, color, selected, onToggle } = props;

  const handleClick = React.useCallback(() => {
    if (!onToggle) {
      return;
    }

    onToggle(id);
  }, [id, onToggle]);

  return (
    <S.SummaryButton
      color={color}
      selected={selected}
      onClick={handleClick}
      aria-pressed={selected}
      title={selected ? `${label} filter selected` : `${label} filter`}
      clickable={!!onToggle}
    >
      <S.SummaryLead>
        <S.SummaryIcon icon={icon} size={12} color={color} />
        <S.SummaryLabel>{label}</S.SummaryLabel>
      </S.SummaryLead>
      <S.SummaryValue>{value}</S.SummaryValue>
    </S.SummaryButton>
  );
};

namespace S {
  export const SummaryButton = styled.button<{
    color: string;
    selected: boolean;
    clickable?: boolean;
  }>`
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-radius: ${(p) => p.theme.radius.pill};
    padding: ${(p) => "4px 10px"};
    border: 1px solid ${(p) => (p.selected ? `${p.color}cc` : `${p.color}66`)};
    background-color: ${(p) => (p.selected ? `${p.color}2e` : `${p.color}14`)};
    color: ${(p) => p.color};
    font-size: ${(p) => "11px"};
    line-height: 1;
    min-height: ${(p) => "24px"};
    gap: ${(p) => "6px"};
    cursor: ${(p) => (p.clickable ? "pointer" : null)};
    box-shadow: ${(p) =>
      p.selected
        ? `inset 0 0 0 1px ${p.color}66, 0 0 0 1px ${p.color}33`
        : "none"};

    :focus-visible {
      outline: 2px solid ${(p) => p.color};
      outline-offset: 2px;
    }
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
