import styled from "@emotion/styled";

export const Table = styled.table`
  color: ${(p) => p.theme.colors.text};
  font-family: ${(p) => p.theme.font.body};
  font-size: 18px;
  border-collapse: collapse;
  width: 100%;
  user-select: none;
`;
