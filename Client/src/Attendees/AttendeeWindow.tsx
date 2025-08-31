import styled from "@emotion/styled";
import React, { useCallback } from "react";
import { Backdrop } from "../Components/Backdrop/Backdrop";
import { Button } from "../Components/Button/Button";
import { LayerHandler, LayerItem } from "../Components/Layer/Layer";
import { Tile } from "../Components/Tile";
import { AttendeesEntry, SupaBase } from "../SupaBase/SupaBase";
import { QRCode } from "./QRCode";

export interface AtendeeWindowProps {
  layerItem: LayerItem;
  entry: AttendeesEntry;
  supabase: SupaBase;
}

export interface ConfirmProps {
  layerItem: LayerItem;
  entry: AttendeesEntry;
  supabase: SupaBase;
  onConfirm: () => void;
}

export const Confirm: React.FC<ConfirmProps> = (props: ConfirmProps) => {
  const { layerItem, entry, supabase } = props;
  const bdClick = useCallback(() => {
    layerItem.close();
  }, [layerItem]);

  const handleYes = useCallback(() => {
    supabase.deleteAttendee(entry).then(() => {
      layerItem.close();
    });
  }, []);

  const handleNo = useCallback(() => {
    layerItem.close();
  }, []);

  return (
    <S.StyledBackdrop onClose={bdClick}>
      <S.AtendeeWindowEl>
        <div>{`Are you sure you wish to delete ${entry.name} ${entry.surname}?`}</div>
        <S.ButtonContainer>
          <Button onClick={handleYes}>YES</Button>
          <Button onClick={handleNo}>NO</Button>
        </S.ButtonContainer>
      </S.AtendeeWindowEl>
    </S.StyledBackdrop>
  );
};

export const AttendeeWindow: React.FC<AtendeeWindowProps> = (
  props: AtendeeWindowProps
) => {
  const { layerItem, entry, supabase } = props;

  const bdClick = useCallback(() => {
    layerItem.close();
  }, [layerItem]);

  const handleDelete = useCallback(() => {
    LayerHandler.AddLayer((layerItem2) => {
      return (
        <Confirm
          entry={entry}
          layerItem={layerItem2}
          supabase={supabase}
          onConfirm={() => {
            layerItem.close;
          }}
        />
      );
    });
  }, []);

  return (
    <S.StyledBackdrop onClose={bdClick}>
      <S.AtendeeWindowEl>
        <S.Name>{`${entry.name} ${entry.surname}`}</S.Name>
        <QRCode dataString={`${entry.name} ${entry.surname}`} />
        <S.ButtonContainer>
          <Button onClick={handleDelete}>Delete</Button>
        </S.ButtonContainer>
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
    gap: 10px;
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

  export const ButtonContainer = styled.div`
    display: flex;
    gap: 10px;
  `;
}
