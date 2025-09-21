import styled from "@emotion/styled";
import React, { ChangeEvent, useCallback, useState } from "react";
import { DefaultColors } from "../../Tools/Toolbox";
import { Button } from "../Button/Button";
import { Input } from "../Inputs/BaseInput";
import { LayerItem } from "../Layer";
import {
  PopupBackdrop,
  PopupButtonContainer,
  PopupDialog,
} from "./PopupComponents";

export interface PopupInputProps {
  layerItem: LayerItem;
  text: string;
  onConfirm: (value: string) => void;
  onDecline: () => void;
}

export const PopupInput: React.FC<PopupInputProps> = (
  props: PopupInputProps
) => {
  const { onDecline, onConfirm, text } = props;

  const [val, setVal] = useState<string>("");

  const handleConfirm = useCallback(() => {
    onConfirm(val);
  }, [val]);

  const handleValChange = useCallback((even: ChangeEvent<HTMLInputElement>) => {
    setVal(() => even.target.value);
  }, []);

  return (
    <PopupBackdrop onClose={onDecline}>
      <PopupDialog>
        <S.ConfirmText>{text}</S.ConfirmText>
        <Input
          value={val}
          onChange={handleValChange}
          placeholder="Optional: Name or describe RollCall..."
        />
        <PopupButtonContainer>
          <Button color={DefaultColors.BrightRed} onClick={onDecline}>
            Cancel
          </Button>
          <Button color={DefaultColors.BrightGreen} onClick={handleConfirm}>
            Okay
          </Button>
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
