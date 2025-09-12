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
      <Icon icon={icon} size={16} />
      <Label text={label} />
    </S.FABItemTile>
  );
};

namespace S {
  export const FABItemTile = styled(Tile)<{
    disabled?: boolean;
    color?: string;
  }>`
    label: FABItemTile;
    display: flex;
    font-size: 16px;
    flex-direction: row;
    align-items: center;
    gap: 5px;
    margin-bottom: 3px;
    margin-right: 3px;
    padding: 4px 10px;
    background-color: ${DefaultColors.Container};
    border: 2px solid ${DefaultColors.Background};
    cursor: ${(p) => (p.disabled ? "not-allowed" : "pointer")};

    box-shadow: none;
    user-select: none;

    :hover {
      background-color: ${(p) => (p.disabled ? null : `${p.color}22`)};
    }
  `;
}
