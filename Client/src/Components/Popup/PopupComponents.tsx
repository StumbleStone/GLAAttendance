import styled from "@emotion/styled";
import { Backdrop } from "../Backdrop/Backdrop";
import { Tile } from "../Tile";

export const PopupBackdrop = styled(Backdrop)`
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const PopupDialog = styled(Tile)`
  min-width: min(300px, 80vw);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 20px;
  justify-content: center;
  align-items: center;
  gap: 10px;
`;

export const PopupButtonContainer = styled.div`
  display: flex;
  gap: 10px;
`;
