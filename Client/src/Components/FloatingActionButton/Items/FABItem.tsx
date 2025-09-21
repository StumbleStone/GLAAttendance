import styled from "@emotion/styled";
import { IconDefinition } from "@fortawesome/free-solid-svg-icons";
import * as React from "react";
import { DefaultColors } from "../../../Tools/Toolbox";
import { Icon } from "../../Icon";
import { Label } from "../../Label";
import { Tile } from "../../Tile";

export interface FABItemProps {
  doClose: () => void;
  icon: IconDefinition;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  color?: string;
}

export const FABItem: React.FC<FABItemProps> = (props: FABItemProps) => {
  const { onClick, doClose, label, icon, disabled, color } = props;

  const onClickHandler = React.useCallback(() => {
    doClose();
    onClick();
  }, []);

  const resolvedColor = React.useMemo(() => {
    return disabled ? DefaultColors.Grey : color || DefaultColors.BrightCyan;
  }, [color, disabled]);

  return (
    <S.FABItemTile
      onClick={onClickHandler}
      color={resolvedColor}
      disabled={disabled}
    >
      <S.Background color={resolvedColor} disabled={disabled}>
        <Icon icon={icon} size={16} />
        <Label text={label} />
      </S.Background>
    </S.FABItemTile>
  );
};

namespace S {
  export const FABItemTile = styled(Tile)<{
    disabled?: boolean;
    color?: string;
  }>`
    label: FABItemTile;
    font-size: 16px;
    margin-bottom: 3px;
    margin-right: 3px;
    background-color: ${DefaultColors.Container};
    border: 2px solid ${DefaultColors.Background};
    cursor: ${(p) => (p.disabled ? "not-allowed" : "pointer")};

    box-shadow: none;
    user-select: none;
    padding: 0;
    overflow: hidden;

    :hover {
      box-shadow: ${(p) =>
        p.disabled ? "none" : `0px 0px 5px 0px ${p.color}`};
    }
  `;

  export const Background = styled.div<{
    disabled?: boolean;
    color?: string;
  }>`
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: 4px 10px;
    gap: 5px;

    height: 100%;
    :hover {
      background-color: ${(p) => (p.disabled ? null : `${p.color}44`)};
    }
  `;
}
