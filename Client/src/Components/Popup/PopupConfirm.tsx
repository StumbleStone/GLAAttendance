import styled from "@emotion/styled";
import React, { useCallback } from "react";
import { Button, ButtonProps } from "../Button/Button";
import { LayerItem } from "../Layer/Layer";
import {
  PopupBackdrop,
  PopupButtonContainer,
  PopupDialog,
} from "./PopupComponents";

export interface PopupConfirmProps {
  layerItem: LayerItem;
  text: string;
  buttons: PopupConfirmButton[];
  canDismiss?: boolean;
}

export const PopupConfirm: React.FC<PopupConfirmProps> = (
  props: PopupConfirmProps
) => {
  const { buttons, text, canDismiss = true, layerItem } = props;

  const handleBDClick = useCallback(() => {
    if (!canDismiss) {
      return;
    }

    layerItem.close();
  }, [canDismiss, layerItem]);

  return (
    <PopupBackdrop onClose={handleBDClick}>
      <PopupDialog>
        <S.ConfirmText>{text}</S.ConfirmText>
        <PopupButtonContainer>
          {buttons.map((btn, idx) => (
            <PopupConfirmButton {...btn} key={idx} />
          ))}
        </PopupButtonContainer>
      </PopupDialog>
    </PopupBackdrop>
  );
};

export interface PopupConfirmButton extends ButtonProps {}

const PopupConfirmButton: React.FC<PopupConfirmButton> = (
  props: PopupConfirmButton
) => {
  const { ...rest } = props;

  return <Button {...rest} />;
};

namespace S {
  export const ConfirmText = styled.div`
    text-align: center;
    padding: 10px 0 10px;
  `;
}
