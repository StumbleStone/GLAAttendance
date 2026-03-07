import styled from "@emotion/styled";
import * as React from "react";

export interface TabOption<T extends string = string> {
  id: T;
  label: string;
  disabled?: boolean;
}

export interface TabsProps<T extends string = string> {
  options: TabOption<T>[];
  selectedId: T;
  onChange?: (id: T) => void;
  className?: string;
  stretch?: boolean;
}

interface TabButtonProps<T extends string = string> {
  option: TabOption<T>;
  isSelected: boolean;
  stretch: boolean;
  onChange?: (id: T) => void;
}

function TabButton<T extends string>(props: TabButtonProps<T>): React.ReactElement {
  const { option, isSelected, stretch, onChange } = props;

  const handleClick = React.useCallback(() => {
    if (option.disabled || isSelected) {
      return;
    }

    onChange?.(option.id);
  }, [option, isSelected, onChange]);

  return (
    <S.TabButton
      role="tab"
      type="button"
      $isSelected={isSelected}
      $stretch={stretch}
      disabled={option.disabled}
      aria-selected={isSelected}
      title={option.label}
      onClick={handleClick}
    >
      {option.label}
    </S.TabButton>
  );
}

export function Tabs<T extends string>(props: TabsProps<T>): React.ReactElement {
  const { options, selectedId, onChange, className, stretch = false } = props;

  return (
    <S.TabsList className={className} role="tablist" $stretch={stretch}>
      {options.map((option) => (
        <TabButton<T>
          key={option.id}
          option={option}
          isSelected={option.id === selectedId}
          stretch={stretch}
          onChange={onChange}
        />
      ))}
    </S.TabsList>
  );
}

namespace S {
  export const TabsList = styled("div", {
    shouldForwardProp: (prop) => prop !== "$stretch",
  })<{ $stretch: boolean }>`
    display: flex;
    align-items: stretch;
    gap: 6px;
    padding: 4px;
    border-radius: ${(p) => p.theme.radius.pill};
    border: 1px solid ${(p) => p.theme.colors.border};
    background-color: ${(p) => p.theme.colors.surfaceRaised};
    width: ${(p) => (p.$stretch ? "100%" : "fit-content")};
  `;

  export const TabButton = styled("button", {
    shouldForwardProp: (prop) => prop !== "$isSelected" && prop !== "$stretch",
  })<{ $isSelected: boolean; $stretch: boolean }>`
    flex: ${(p) => (p.$stretch ? "1 1 0" : "0 0 auto")};
    min-width: 0;
    border-radius: ${(p) => p.theme.radius.pill};
    border: 1px solid
      ${(p) =>
        p.$isSelected ? p.theme.colors.accent.primary : p.theme.colors.border};
    background-color: ${(p) =>
      p.$isSelected ? p.theme.colors.surfaceActive : p.theme.colors.surface};
    color: ${(p) =>
      p.$isSelected ? p.theme.colors.text : p.theme.colors.textMuted};
    padding: 6px 12px;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    transition:
      background-color 0.12s ease,
      border-color 0.12s ease,
      color 0.12s ease;

    &:hover:not(:disabled) {
      border-color: ${(p) => p.theme.colors.accent.primary};
      color: ${(p) => p.theme.colors.text};
    }

    &:focus-visible {
      outline: 2px solid ${(p) => p.theme.colors.accent.primary};
      outline-offset: 2px;
    }

    &:disabled {
      cursor: default;
      color: ${(p) => p.theme.colors.state.disabled};
      border-color: ${(p) => p.theme.colors.borderSubtle};
      background-color: ${(p) => p.theme.colors.surfaceRaised};
    }
  `;
}
