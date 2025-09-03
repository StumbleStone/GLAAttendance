import styled from "@emotion/styled";
import React, { useCallback } from "react";
import { Backdrop } from "../Components/Backdrop/Backdrop";
import { Button } from "../Components/Button/Button";
import { LayerHandler, LayerItem } from "../Components/Layer/Layer";
import { Tile } from "../Components/Tile";
import { Attendee } from "../SupaBase/Attendee";
import { SupaBase } from "../SupaBase/SupaBase";

import { QRCode } from "./QRCode";

export interface AtendeeWindowProps {
  layerItem: LayerItem;
  attendee: Attendee;
  supabase: SupaBase;
}

export interface ConfirmProps {
  layerItem: LayerItem;
  attendee: Attendee;
  supabase: SupaBase;
  onConfirm: () => void;
}

export const Confirm: React.FC<ConfirmProps> = (props: ConfirmProps) => {
  const { layerItem, attendee, supabase } = props;
  const bdClick = useCallback(() => {
    layerItem.close();
  }, [layerItem]);

  const handleYes = useCallback(() => {
    supabase.deleteAttendee(attendee).then(() => {
      layerItem.close();
    });
  }, []);

  const handleNo = useCallback(() => {
    layerItem.close();
  }, []);

  return (
    <S.StyledBackdrop onClose={bdClick}>
      <S.ConfirmDialog>
        <S.ConfirmText>{`Are you sure you wish to delete ${attendee.name} ${attendee.surname}?`}</S.ConfirmText>
        <S.ButtonContainer>
          <Button onClick={handleYes}>YES</Button>
          <Button onClick={handleNo}>NO</Button>
        </S.ButtonContainer>
      </S.ConfirmDialog>
    </S.StyledBackdrop>
  );
};

export const AttendeeWindow: React.FC<AtendeeWindowProps> = (
  props: AtendeeWindowProps
) => {
  const { layerItem, attendee, supabase } = props;

  const bdClick = useCallback(() => {
    layerItem.close();
  }, [layerItem]);

  const handleDelete = useCallback(() => {
    LayerHandler.AddLayer((layerItem2) => {
      return (
        <Confirm
          attendee={attendee}
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
        <S.Name>{`${attendee.name} ${attendee.surname}`}</S.Name>
        <QRCode dataString={attendee.hash} title={attendee.fullName} />
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
    //max-height: min(300px, 80vh);
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

  export const ConfirmDialog = styled(Tile)`
    max-width: min(300px, 80vw);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    padding: 0;
    justify-content: center;
    align-items: center;
    gap: 10px;
  `;

  export const ConfirmText = styled.div`
    text-align: center;
    padding: 10px 0 10px;
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
    padding-bottom: 10px;
  `;
}
