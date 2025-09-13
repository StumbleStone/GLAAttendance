import styled from "@emotion/styled";
import { IconDefinition } from "@fortawesome/free-solid-svg-icons";
import * as React from "react";
import { DefaultColors } from "../../Tools/Toolbox";
import { Icon } from "../Icon";
import { BaseInputProps, Input } from "./BaseInput";

export interface InputWithIconProps extends BaseInputProps {
  fontSize?: number;
  color?: string;
  icon?: IconDefinition;
  forwardRef?: React.RefObject<HTMLInputElement>;
}

export const InputWithIcon: React.FC<InputWithIconProps> = (
  props: InputWithIconProps
) => {
  const { fontSize, color, icon, forwardRef, ...rest } = props;
  return (
    <S.InputContainer>
      <Input
        {...rest}
        forwardRef={forwardRef}
        color={color}
        fontSize={fontSize}
        padLeft={icon ? 16 + (fontSize || 18) : null}
      />
      {!!icon && (
        <S.StyledIcon
          icon={icon}
          color={color ?? DefaultColors.Container}
          size={fontSize || 18}
        />
      )}
    </S.InputContainer>
  );
};

namespace S {
  export const InputContainer = styled.div`
    position: relative;
    display: flex;
    align-items: center;
  `;

  export const StyledIcon = styled(Icon)`
    position: absolute;
    left: 10px;
  `;
}
