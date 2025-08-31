import styled from "@emotion/styled";
import { DefaultColors } from "../../Tools/Toolbox";

export const TableHeading = styled.th<{ color?: null | string }>`
  border-top: 1px solid ${DefaultColors.Black};
  border-bottom: 1px solid ${DefaultColors.Black};
  font-weight: bolder;
  padding: 0px 6px;
  color: ${(p) => p.color};
`;
