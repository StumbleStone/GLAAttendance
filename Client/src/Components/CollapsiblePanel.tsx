import styled from "@emotion/styled";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import * as React from "react";
import { Icon } from "./Icon";
import { Tile } from "./Tile";

export interface CollapsiblePanelProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
  defaultExpanded?: boolean;
  description?: React.ReactNode;
  heading: React.ReactNode;
}

export const CollapsiblePanel: React.FC<CollapsiblePanelProps> = (
  props: CollapsiblePanelProps,
) => {
  const {
    children,
    className,
    defaultExpanded = false,
    description,
    heading,
    ...rest
  } = props;
  const [expanded, setExpanded] = React.useState(defaultExpanded);
  const contentId = React.useId();

  const handleToggle = React.useCallback(() => {
    setExpanded((prev) => !prev);
  }, []);

  return (
    <S.RootTile className={className} {...rest}>
      <S.HeaderButton
        aria-controls={contentId}
        aria-expanded={expanded}
        onClick={handleToggle}
        type="button"
      >
        <S.HeaderCopy>
          <S.Title>{heading}</S.Title>
          {!!description && <S.Description>{description}</S.Description>}
        </S.HeaderCopy>
        <S.ToggleIconWrap expanded={expanded}>
          <Icon icon={faChevronDown} size={18} />
        </S.ToggleIconWrap>
      </S.HeaderButton>

      {expanded && <S.Content id={contentId}>{children}</S.Content>}
    </S.RootTile>
  );
};

namespace S {
  export const RootTile = styled(Tile)`
    padding: 0;
    overflow: hidden;
  `;

  export const HeaderButton = styled.button`
    width: 100%;
    border: none;
    background: transparent;
    padding: 14px;
    color: inherit;
    font-family: inherit;
    text-align: left;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 12px;
    align-items: center;
    cursor: pointer;

    &:hover {
      background-color: ${(p) => p.theme.colors.surfaceRaised};
    }

    &:focus-visible {
      outline: 2px solid ${(p) => p.theme.colors.accent.primary};
      outline-offset: -2px;
    }
  `;

  export const HeaderCopy = styled.div`
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  `;

  export const Title = styled.div`
    font-size: 24px;
    color: ${(p) => p.theme.colors.text};
  `;

  export const Description = styled.div`
    font-size: 16px;
    color: ${(p) => p.theme.colors.textMuted};
  `;

  export const ToggleIconWrap = styled.div<{ expanded: boolean }>`
    width: 34px;
    height: 34px;
    border-radius: ${(p) => p.theme.radius.pill};
    border: 2px solid ${(p) => p.theme.colors.border};
    background-color: ${(p) => p.theme.colors.surfaceRaised};
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${(p) => p.theme.colors.textMuted};
    transform: rotate(${(p) => (p.expanded ? 180 : 0)}deg);
    transition: transform 160ms ease;
    flex-shrink: 0;
  `;

  export const Content = styled.div`
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 0 14px 14px;
    border-top: 1px solid ${(p) => p.theme.colors.borderSubtle};
  `;
}
