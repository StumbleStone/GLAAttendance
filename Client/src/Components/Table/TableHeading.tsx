import styled from "@emotion/styled";

export const TableHeading = styled.th<{}>`
  border-top: 1px solid ${(p) => p.theme.colors.borderSubtle};
  border-bottom: 1px solid ${(p) => p.theme.colors.borderSubtle};
  font-weight: bolder;
  padding: 0px 6px;

  text-align: left;
  white-space: nowrap;
`;
