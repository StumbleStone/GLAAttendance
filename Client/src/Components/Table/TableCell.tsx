import styled from "@emotion/styled";

export const TableCell = styled.td<{ color?: string }>`
  border-top: 1px solid ${(p) => p.theme.colors.borderSubtle};
  border-bottom: 1px solid ${(p) => p.theme.colors.borderSubtle};
  padding: 2px 6px;
  user-select: none;
  color: ${(p) => p.color};
  white-space: nowrap;
`;
