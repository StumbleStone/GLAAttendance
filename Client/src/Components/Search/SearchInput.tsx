import styled from "@emotion/styled";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import * as React from "react";
import { InputWithIcon } from "../Inputs/InputWithIcon";

export interface SearchInputProps {
  className?: string;
  disabled?: boolean;
  onQueryChange: (newQuery: string) => void;
  placeholder?: string;
  query: string;
}

export const SearchInput: React.FC<SearchInputProps> = (
  props: SearchInputProps,
) => {
  const {
    className,
    disabled,
    onQueryChange,
    placeholder = "Search...",
    query,
  } = props;

  const handleChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onQueryChange(event.target.value);
    },
    [onQueryChange],
  );

  return (
    <S.StyledSearch
      className={className}
      disabled={disabled}
      icon={faMagnifyingGlass}
      onChange={handleChange}
      placeholder={placeholder}
      value={query}
    />
  );
};

namespace S {
  export const StyledSearch = styled(InputWithIcon)`
    width: 100%;
  `;
}
