import styled from "@emotion/styled";
import React, { useCallback } from "react";
import { Backdrop } from "../Components/Backdrop/Backdrop";
import { LayerItem } from "../Components/Layer/Layer";
import { Tile } from "../Components/Tile";
import { AttendeesEntry } from "../SupaBase/SupaBase";
import { QRCode } from "./QRCode";

export interface AtendeeWindowProps {
  layerItem: LayerItem;
  entry: AttendeesEntry;
}

export const AtendeeWindow: React.FC<AtendeeWindowProps> = (
  props: AtendeeWindowProps
) => {
  const { layerItem, entry } = props;

  const bdClick = useCallback(() => {
    layerItem.close();
  }, [layerItem]);

  return (
    <S.StyledBackdrop onClose={bdClick}>
      <S.AtendeeWindowEl>
        <S.Name>{`${entry.name} ${entry.surname}`}</S.Name>
        <QRCode dataString={`${entry.name} ${entry.surname}`} />
      </S.AtendeeWindowEl>
    </S.StyledBackdrop>
  );
};

namespace S {
  export const AtendeeWindowEl = styled(Tile)`
    max-width: min(300px, 80vw);
    max-height: min(300px, 80vh);
    min-width: min(300px, 80vw);
    min-height: min(300px, 80vh);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    padding: 0;
    justify-content: center;
    align-items: center;
  `;

  export const Name = styled.div`
    width: 100%;
    text-align: center;
    padding: 5px;
    font-size: 18px;
  `;

  export const StyledBackdrop = styled(Backdrop)`
    display: flex;
    align-items: center;
    justify-content: center;
  `;
}
