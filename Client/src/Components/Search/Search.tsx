import * as React from "react";

export interface SearchRenderProps<T extends object> {
  filteredItems: T[];
  query: string;
  setQuery: (newQuery: string) => void;
}

export interface SearchProps<T extends object> {
  children: (props: SearchRenderProps<T>) => React.ReactNode;
  defaultQuery?: string;
  items: T[];
  onQueryChange?: (newQuery: string) => void;
  query?: string;
  searchFields: Array<keyof T>;
}

function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replaceAll(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function stringifySearchValue(value: unknown): string {
  if (value == null) {
    return "";
  }

  if (Array.isArray(value)) {
    return value
      .map((entry) => stringifySearchValue(entry))
      .filter((entry) => entry !== "")
      .join(" ");
  }

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "bigint"
  ) {
    return normalizeSearchText(`${value}`);
  }

  return "";
}

function getSearchTokens(query: string): string[] {
  const normalizedQuery = normalizeSearchText(query);

  if (normalizedQuery === "") {
    return [];
  }

  return normalizedQuery.split(/\s+/).filter((token) => token !== "");
}

function matchesSearch<T extends object>(
  item: T,
  searchFields: Array<keyof T>,
  queryTokens: string[],
): boolean {
  if (queryTokens.length === 0) {
    return true;
  }

  const searchableValues = searchFields.map((field) =>
    stringifySearchValue(item[field]),
  );

  return queryTokens.every((token) =>
    searchableValues.some((value) => value.includes(token)),
  );
}

export function filterItemsBySearchQuery<T extends object>(
  items: T[],
  searchFields: Array<keyof T>,
  query: string,
): T[] {
  const queryTokens = getSearchTokens(query);

  if (queryTokens.length === 0) {
    return items;
  }

  return items.filter((item) => matchesSearch(item, searchFields, queryTokens));
}

export function Search<T extends object>(
  props: SearchProps<T>,
): React.ReactElement {
  const {
    children,
    defaultQuery = "",
    items,
    onQueryChange,
    query,
    searchFields,
  } = props;
  const [internalQuery, setInternalQuery] = React.useState<string>(defaultQuery);

  const resolvedQuery = query ?? internalQuery;

  const setQuery = React.useCallback(
    (newQuery: string) => {
      if (query == null) {
        setInternalQuery(newQuery);
      }

      onQueryChange?.(newQuery);
    },
    [onQueryChange, query],
  );

  const filteredItems = React.useMemo<T[]>(
    () => filterItemsBySearchQuery(items, searchFields, resolvedQuery),
    [items, resolvedQuery, searchFields],
  );

  return <>{children({ filteredItems, query: resolvedQuery, setQuery })}</>;
}
