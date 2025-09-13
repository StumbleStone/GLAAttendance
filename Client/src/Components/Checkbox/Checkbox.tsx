import styled from "@emotion/styled";
import React, { useCallback } from "react";
import { DefaultColors } from "../../Tools/Toolbox";

export interface CheckboxProps {
  value: boolean;
  onChange: (value: boolean) => void;
}

export const CheckboxBool: React.FC<CheckboxProps> = (props) => {
  const { value, onChange } = props;

  const handleChange = useCallback(() => {
    onChange?.(!value);
  }, [onChange]);

  return (
    <S.Container onClick={handleChange}>
      <S.Bar checked={value}>
        <S.Dot checked={value} />
      </S.Bar>
    </S.Container>
  );
};

namespace S {
  export const Container = styled.div`
    width: 60px;
    height: 30px;
    border-radius: 30px;
    border: 1px solid ${DefaultColors.TRANSPARENT};
    display: flex;
    cursor: pointer;
  `;

  export const Bar = styled.div<{ checked: boolean }>`
    height: 100%;
    width: 100%;
    border-radius: 30px;
    background-color: ${(p) =>
      `${p.checked ? DefaultColors.Green : DefaultColors.Red}33`};
    display: flex;
    justify-content: ${(p) => (p.checked ? "flex-end" : "flex-start")};
  `;

  export const Dot = styled.div<{ checked: boolean }>`
    height: 30px;
    width: 30px;
    border: 1px solid ${DefaultColors.OffWhite};
    border-radius: 30px;
    background-color: ${(p) =>
      p.checked ? DefaultColors.BrightGreen : DefaultColors.Red};
  `;
}
