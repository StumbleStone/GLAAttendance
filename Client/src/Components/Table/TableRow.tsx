import styled from "@emotion/styled";

export const TableRow = styled.tr`
  border: 1px solid ${(p) => p.theme.colors.borderSubtle};
  cursor: pointer;

  :nth-of-type(odd) {
    background-color: ${(p) => p.theme.colors.table.rowOdd};
  }

  :nth-of-type(even) {
    background-color: ${(p) => p.theme.colors.table.rowEven};
  }

  :hover {
    background-color: ${(p) => p.theme.colors.table.rowHover};
  }
`;
