import styled from "@emotion/styled";
import React from "react";
import { Button } from "../Button/Button";
import { LayerItem } from "../Layer/Layer";
import {
  PopupBackdrop,
  PopupButtonContainer,
  PopupDialog,
} from "./PopupComponents";

export interface PopupConfirmProps {
  layerItem: LayerItem;
  text: string;
  onConfirm: () => void;
  onDecline: () => void;
}

export const PopupConfirm: React.FC<PopupConfirmProps> = (
  props: PopupConfirmProps
) => {
  const { onDecline, onConfirm, text } = props;

  return (
    <PopupBackdrop onClose={onDecline}>
      <PopupDialog>
        <S.ConfirmText>{text}</S.ConfirmText>
        <PopupButtonContainer>
          <Button onClick={onConfirm}>YES</Button>
          <Button onClick={onDecline}>NO</Button>
        </PopupButtonContainer>
      </PopupDialog>
    </PopupBackdrop>
  );
};

namespace S {
  export const ConfirmText = styled.div`
    text-align: center;
    padding: 10px 0 10px;
  `;
}
