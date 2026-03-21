import styled from "@emotion/styled";
import React, { useEffect } from "react";
import { SearchInput } from "../Components/Search/SearchInput";
import { TableHeading } from "../Components/Table/TableHeading";

export interface SearchBarProps {
  query: string;
  onQueryChange: (newQuery: string) => void;
  onHeightChange?: (height: number) => void;
  colSpan: number;
}

export const SearchBarHeading: React.FC<SearchBarProps> = (
  props: SearchBarProps,
) => {
  const { query, onQueryChange, colSpan, onHeightChange } = props;
  const [rowHeight, setRowHeight] = React.useState<number>(0);
  const rowRef = React.useRef<HTMLTableHeaderCellElement>(null);

  useEffect(() => {
    if (!onHeightChange) {
      return;
    }

    const el = rowRef.current;
    if (!el) {
      return;
    }

    const onResize = (entries: ResizeObserverEntry[]) => {
      if (entries.length == 0) {
        return;
      }

      const entry = entries[0];
      const { blockSize } = entry.borderBoxSize[0];

      setRowHeight(() => blockSize);
    };

    const obs = new ResizeObserver(onResize);
    obs.observe(el);

    return () => {
      obs.unobserve(el);
      obs.disconnect();
    };
  }, [onHeightChange]);

  useEffect(() => {
    onHeightChange?.(rowHeight);
  }, [rowHeight, onHeightChange]);

  return (
    <S.SearchHeading colSpan={colSpan} ref={rowRef}>
      <S.Search
        query={query}
        onQueryChange={onQueryChange}
        placeholder="Search..."
      />
    </S.SearchHeading>
  );
};

namespace S {
  export const Search = styled(SearchInput)``;

  export const SearchHeading = styled(TableHeading)`
    background-color: ${(p) => p.theme.colors.background};
    border-top: none;
    border-bottom: 1px solid ${(p) => p.theme.colors.borderSubtle};
    padding: 6px 0 8px;
  `;
}
