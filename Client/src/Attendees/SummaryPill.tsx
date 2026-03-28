import styled from "@emotion/styled";
import {IconDefinition} from "@fortawesome/fontawesome-svg-core";
import React from "react";
import {Chip} from "../Components/Chip/Chip";

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
}

export type SummaryPillSelection = Record<SummaryPillId, boolean>;

export function createSummaryPillSelection(
  selectedByDefault: boolean,
): SummaryPillSelection {
  return {
    [SummaryPillId.PRESENT]: selectedByDefault,
    [SummaryPillId.ABSENT]: selectedByDefault,
    [SummaryPillId.NOT_SCANNED]: selectedByDefault,
  };
}

export const SummaryPill: React.FC<SummaryPillProps> = (
  props: SummaryPillProps,
) => {
  const { id, icon, label, value, color, selected, onToggle } = props;
  const isInteractive = !!onToggle;

  const handleClick = React.useCallback(() => {
    onToggle?.(id);
  }, [id, onToggle]);

  return (
    <S.SummaryButton
      tone={color}
      selected={selected}
      onClick={isInteractive ? handleClick : undefined}
      aria-pressed={isInteractive ? selected : undefined}
      title={
        isInteractive
          ? selected
            ? `${label} filter selected`
            : `${label} filter`
          : `${label}: ${value}`
      }
      icon={icon}
      iconSize={12}
      label={
        <S.SummaryContent>
          <S.SummaryLabel>{label}</S.SummaryLabel>
          <S.SummaryValue>{value}</S.SummaryValue>
        </S.SummaryContent>
      }
    />
  );
};

namespace S {
  export const SummaryButton = styled(Chip)<{
    tone: string;
    selected: boolean;
  }>`
    justify-content: space-between;
    gap: 6px;
    min-height: 24px;
    padding: 4px 10px;
    font-size: 11px;
    color: ${(p) => p.tone};
    border-color: ${(p) => (p.selected ? `${p.tone}cc` : `${p.tone}66`)};
    background-color: ${(p) => (p.selected ? `${p.tone}2e` : `${p.tone}14`)};
    box-shadow: ${(p) =>
      p.selected
        ? `inset 0 0 0 1px ${p.tone}66, 0 0 0 1px ${p.tone}33`
        : "none"};
  `;

  export const SummaryContent = styled("span")`
    display: inline-flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    gap: 8px;
  `;

  export const SummaryLabel = styled("span")`
    color: ${(p) => p.theme.colors.textMuted};
    font-weight: 600;
    white-space: nowrap;
  `;

  export const SummaryValue = styled("span")`
    color: ${(p) => p.theme.colors.text};
    font-weight: 800;
    min-width: 12px;
    text-align: right;
  `;
}
