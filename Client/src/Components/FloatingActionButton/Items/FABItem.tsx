import styled from "@emotion/styled";
import { IconDefinition } from "@fortawesome/free-solid-svg-icons";
import * as React from "react";
import { DefaultColors } from "../../../Tools/Toolbox";
import { Icon } from "../../Icon";
import { Label } from "../../Label";
import { Tile } from "../../Tile";

export interface FABItemProps {
  close: () => void;
  icon: IconDefinition;
  label: string;
  onClick: () => void;
}

export const FABItem: React.FC<FABItemProps> = (props: FABItemProps) => {
  const { onClick, close, label, icon } = props;

  const onClickHandler = React.useCallback(() => {
    close();
    onClick();
  }, []);

  return (
    <S.FABItemTile onClick={onClickHandler}>
      <Icon icon={icon} size={16} />
      <Label text={label} />
    </S.FABItemTile>
  );
};

namespace S {
  export const FABItemTile = styled(Tile)`
    label: FABItemTile;
    display: flex;
    font-size: 16px;
    flex-direction: row;
    align-items: center;
    gap: 5px;
    margin-bottom: 3px;
    margin-right: 3px;
    box-shadow: 0px 5px 5px 0px ${DefaultColors.Container};
    padding: 4px 10px;
  `;
}
