import styled from "@emotion/styled";
import {
  faCheckSquare,
  faLock,
  faMinusSquare,
  faUsers,
  faXmarkSquare,
} from "@fortawesome/free-solid-svg-icons";
import * as React from "react";
import { Button } from "../Components/Button/Button";
import { Chip } from "../Components/Chip/Chip";
import { Tile } from "../Components/Tile";
import { DefaultColors } from "../Tools/Toolbox";

export enum RollCallCardActivityState {
  ACTIVE = "active",
  CLOSED = "closed",
}

export interface RollCallStartCardProps {
  canStart: boolean;
  description: string;
  title?: string;
  onStart?: () => void;
}

export interface RollCallEmptyStateCardProps {
  description: string;
  title: string;
}

export interface RollCallSessionCardProps {
  absentCount: number;
  activityState: RollCallCardActivityState;
  onEndRollCall?: () => void;
  onSelect?: () => void;
  participantCount: number;
  presentCount: number;
  sessionLabel: string;
  title: string;
  unscannedCount: number;
}

export const RollCallCardList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const RollCallStartCard: React.FC<RollCallStartCardProps> = (
  props: RollCallStartCardProps,
) => {
  const { canStart, description, onStart, title = "Start a Rollcall" } = props;
  const isInteractive = canStart && !!onStart;

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (!isInteractive) {
        return;
      }

      if (event.key !== "Enter" && event.key !== " ") {
        return;
      }

      event.preventDefault();
      onStart();
    },
    [isInteractive, onStart],
  );

  return (
    <S.StartCard
      aria-disabled={!isInteractive}
      onClick={isInteractive ? onStart : undefined}
      onKeyDown={handleKeyDown}
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
    >
      <S.CardCopy>
        <S.SectionTitle>{title}</S.SectionTitle>
        <S.SectionDescription>{description}</S.SectionDescription>
      </S.CardCopy>
    </S.StartCard>
  );
};

export const RollCallEmptyStateCard: React.FC<RollCallEmptyStateCardProps> = (
  props: RollCallEmptyStateCardProps,
) => {
  const { description, title } = props;

  return (
    <S.EmptyListCard>
      <S.SectionTitle>{title}</S.SectionTitle>
      <S.SectionDescription>{description}</S.SectionDescription>
    </S.EmptyListCard>
  );
};

export const RollCallSessionCard: React.FC<RollCallSessionCardProps> = (
  props: RollCallSessionCardProps,
) => {
  const {
    absentCount,
    activityState,
    onEndRollCall,
    onSelect,
    participantCount,
    presentCount,
    sessionLabel,
    title,
    unscannedCount,
  } = props;
  const isInteractive = !!onSelect;

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (!isInteractive) {
        return;
      }

      if (event.key !== "Enter" && event.key !== " ") {
        return;
      }

      event.preventDefault();
      onSelect();
    },
    [isInteractive, onSelect],
  );

  return (
    <S.SessionCard
      data-interactive={isInteractive}
      data-state={activityState}
      onClick={onSelect}
      onKeyDown={handleKeyDown}
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
    >
      <S.SessionCardHeader>
        <S.CardCopy>
          <S.SectionTitle>{title}</S.SectionTitle>
          <S.SectionDescription>{sessionLabel}</S.SectionDescription>
        </S.CardCopy>
        {!!onEndRollCall && (
          <S.CloseButton
            color={DefaultColors.BrightOrange}
            icon={faLock}
            onClick={onEndRollCall}
          >
            {"Close"}
          </S.CloseButton>
        )}
      </S.SessionCardHeader>

      <S.StatsRow>
        <S.CountChip
          icon={faUsers}
          label={`${participantCount}`}
          title={`${participantCount} participants`}
        />
        <S.MetricChip
          icon={faCheckSquare}
          label={`${presentCount}`}
          title={`${presentCount} present`}
          tone={DefaultColors.BrightGreen}
        />
        <S.MetricChip
          icon={faXmarkSquare}
          label={`${absentCount}`}
          title={`${absentCount} absent`}
          tone={DefaultColors.BrightRed}
        />
        <S.MetricChip
          icon={faMinusSquare}
          label={`${unscannedCount}`}
          title={`${unscannedCount} unscanned`}
          tone={DefaultColors.BrightGrey}
        />
      </S.StatsRow>
    </S.SessionCard>
  );
};

namespace S {
  export const SectionTitle = styled.div`
    font-size: 16px;
    color: ${(p) => p.theme.colors.text};
    font-weight: 700;
  `;

  export const SectionDescription = styled.div`
    font-size: 14px;
    color: ${(p) => p.theme.colors.textMuted};
  `;

  export const CardCopy = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  `;

  export const StatsRow = styled.div`
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  `;

  export const CountChip = styled(Chip)`
    color: ${(p) => p.theme.colors.accent.primary};
    border-color: ${(p) => `${p.theme.colors.accent.primary}44`};
    background-color: ${(p) => `${p.theme.colors.accent.primary}12`};
    font-size: 12px;
    padding: 5px 8px;
  `;

  export const MetricChip = styled(Chip)<{ tone: string }>`
    color: ${(p) => p.tone};
    border-color: ${(p) => `${p.tone}55`};
    background-color: ${(p) => `${p.tone}14`};
    font-size: 12px;
    padding: 5px 8px;
  `;

  export const SessionCard = styled(Tile)`
    display: flex;
    flex-direction: column;
    gap: 10px;
    background-color: ${(p) => p.theme.colors.surfaceRaised};
    transition:
      border-color 120ms ease,
      box-shadow 120ms ease,
      background-color 120ms ease;

    &[data-interactive="true"] {
      cursor: pointer;
    }

    &[data-interactive="true"]:hover {
      box-shadow:
        ${(p) => p.theme.shadow.tile},
        0 0 0 1px ${(p) => `${p.theme.colors.accent.primary}22`};
    }

    &[data-interactive="true"]:focus-visible {
      outline: none;
      border-color: ${(p) => p.theme.colors.accent.primary};
      box-shadow:
        ${(p) => p.theme.shadow.tile},
        0 0 0 2px ${(p) => `${p.theme.colors.accent.primary}33`};
    }

    &[data-state="active"] {
      background: linear-gradient(
        180deg,
        ${(p) => `${p.theme.colors.accent.success}22`} 0%,
        ${(p) => `${p.theme.colors.accent.primary}12`} 100%
      );
      border-color: ${(p) => `${p.theme.colors.accent.success}88`};
      box-shadow:
        ${(p) => p.theme.shadow.tile},
        0 0 0 1px ${(p) => `${p.theme.colors.accent.success}22`},
        0 0 18px 0 ${(p) => `${p.theme.colors.accent.success}22`};
    }

    &[data-state="closed"] {
      background-color: ${(p) => `${p.theme.colors.textMuted}10`};
      border-color: ${(p) => `${p.theme.colors.textMuted}44`};
    }
  `;

  export const StartCard = styled(SessionCard)`
    background-color: ${(p) => p.theme.colors.surfaceRaised};
    transition:
      border-color 120ms ease,
      box-shadow 120ms ease,
      background-color 120ms ease;

    &[role="button"] {
      cursor: pointer;
      border-color: ${(p) => `${p.theme.colors.accent.success}66`};
    }

    &[role="button"]:hover {
      background-color: ${(p) => `${p.theme.colors.accent.success}0d`};
      box-shadow: 0 0 0 1px ${(p) => `${p.theme.colors.accent.success}33`};
    }

    &[role="button"]:focus-visible {
      outline: none;
      border-color: ${(p) => p.theme.colors.accent.success};
      box-shadow: 0 0 0 2px ${(p) => `${p.theme.colors.accent.success}44`};
    }

    &[aria-disabled="true"] {
      opacity: 0.8;
    }
  `;

  export const EmptyListCard = styled(SessionCard)`
    background-color: ${(p) => p.theme.colors.surfaceRaised};
  `;

  export const SessionCardHeader = styled.div`
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: start;
    gap: 10px;
  `;

  export const CloseButton = styled(Button)`
    font-size: 14px;
    padding: 2px 10px;
    gap: 6px;
    justify-self: end;
    align-self: start;
  `;
}
