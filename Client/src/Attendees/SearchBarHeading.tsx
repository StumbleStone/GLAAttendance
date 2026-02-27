import styled from "@emotion/styled";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import React, { useEffect } from "react";
import { InputWithIcon } from "../Components/Inputs/InputWithIcon";
import { TableHeading } from "../Components/Table/TableHeading";

export interface SearchBarProps {
  filter: string;
  onFilterChange: (newFilter: string) => void;
  onHeightChange: (height: number) => void;
  colSpan: number;
}

export const SearchBarHeading: React.FC<SearchBarProps> = (
  props: SearchBarProps,
) => {
  const { filter, onFilterChange, colSpan, onHeightChange } = props;
  const [rowHeight, setRowHeight] = React.useState<number>(0);
  const rowRef = React.useRef<HTMLTableHeaderCellElement>(null);

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    onHeightChange(rowHeight);
  }, [rowHeight, onHeightChange]);

  const onChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onFilterChange(event.target.value);
    },
    [onFilterChange],
  );

  return (
    <S.SearchHeading colSpan={colSpan} ref={rowRef}>
      <S.Search
        icon={faMagnifyingGlass}
        value={filter}
        onChange={onChange}
        placeholder="Search..."
      />
    </S.SearchHeading>
  );
};

namespace S {
  export const Search = styled(InputWithIcon)`
    width: 100%;
  `;

  export const SearchHeading = styled(TableHeading)`
    background-color: ${(p) => p.theme.colors.background};
    border-top: none;
    border-bottom: 1px solid ${(p) => p.theme.colors.borderSubtle};
    padding: 6px 0 8px;
  `;
}
