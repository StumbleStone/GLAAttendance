import styled from "@emotion/styled";
import { DefaultColors } from "../../Tools/Toolbox";

export const TableRow = styled.tr`
  border: 1px solid ${DefaultColors.Black};
  cursor: pointer;

  :nth-of-type(odd) {
    background-color: ${DefaultColors.Black}22;
  }

  :nth-of-type(even) {
    background-color: ${"#3f3f3f"};
  }
`;
