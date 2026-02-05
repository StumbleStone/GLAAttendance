import styled from "@emotion/styled";
import { DefaultColors } from "../../Tools/Toolbox";

export const TableCell = styled.td<{ color?: string }>`
  border-top: 1px solid ${DefaultColors.Black};
  border-bottom: 1px solid ${DefaultColors.Black};
  padding: 2px 6px;
  user-select: none;
  color: ${(p) => p.color};
  white-space: nowrap;
`;
