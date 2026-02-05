import styled from "@emotion/styled";
import { faCaretLeft, faCaretRight } from "@fortawesome/free-solid-svg-icons";
import * as React from "react";
import { Icon } from "../Components/Icon";
import { Input as iInput } from "../Components/Inputs/BaseInput";
import { DefaultColors } from "../Tools/Toolbox";

export interface QRGridControllerProps {
  onChange: (val: number) => void;
  value: number;
  heading: string;
}

export const QRGridController: React.FC<QRGridControllerProps> = (
  props: QRGridControllerProps
) => {
  const { onChange, value, heading } = props;

  const handleInputChange = React.useCallback(
    (ev: React.ChangeEvent<HTMLInputElement>) => {
      onChange(parseInt(ev.target.value));
    },
    [onChange]
  );

  const handleInc = React.useCallback(() => {
    onChange(value + 1);
  }, [onChange, value]);

  const handleDec = React.useCallback(() => {
    onChange(value - 1);
  }, [onChange, value]);

  return (
    <S.ControllerContainer>
      <S.ControllerHeading>{heading}</S.ControllerHeading>
      <S.ControllerInputContainer>
        <S.ControllerDec
          icon={faCaretLeft}
          size={15}
          color={DefaultColors.Black}
          onClick={handleDec}
        />
        <S.ControllerInput
          type="number"
          value={value}
          onChange={handleInputChange}
        />
        <S.ControllerInc
          icon={faCaretRight}
          size={15}
          color={DefaultColors.Black}
          onClick={handleInc}
        />
      </S.ControllerInputContainer>
    </S.ControllerContainer>
  );
};

namespace S {
  export const ControllerContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    user-select: none;
  `;

  export const ControllerHeading = styled.div`
    font-size: 14px;
  `;

  export const ControllerInputContainer = styled.div`
    display: flex;
    gap: 0;
    border-radius: 10px;
    align-items: center;
    border: 2px solid ${DefaultColors.Black};
    background-color: ${DefaultColors.OffWhite};
  `;

  export const ControllerInc = styled(Icon)`
    cursor: pointer;
    width: 30px;
  `;

  export const ControllerDec = styled(Icon)`
    cursor: pointer;
    width: 30px;
  `;

  export const ControllerInput = styled(iInput)`
    border-radius: 0;
    width: 30px;
    font-size: 12px;
    text-align: center;

    padding-left: 0;
    padding-right: 0;

    -moz-appearance: textfield;
    ::-webkit-outer-spin-button,
    ::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }

    border-top: 0px;
    border-bottom: 0;
  `;
}
