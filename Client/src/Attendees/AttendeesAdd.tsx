import styled from "@emotion/styled";
import { faArrowLeft, faClock } from "@fortawesome/free-solid-svg-icons";
import React, { useCallback } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Button } from "../Components/Button/Button";
import { LayerHandler, LayerItem } from "../Components/Layer";
import { Tile } from "../Components/Tile";
import { DashboardProps } from "../MainMenu/Dashboard";
import { DefaultColors } from "../Tools/Toolbox";
import { AttendeeAddWindow } from "./AttendeeAddWindow";

export interface AttendeesAddProps {}

export const AttendeesAdd: React.FC = () => {
  const { supabase } = useOutletContext<DashboardProps>();
  const nav = useNavigate();

  const handleBack = useCallback(() => {
    nav("/dashboard");
  }, []);

  const handleQuickAdd = useCallback(() => {
    LayerHandler.AddLayer((item: LayerItem) => (
      <AttendeeAddWindow layerItem={item} supabase={supabase} />
    ));
  }, []);

  return (
    <S.Container>
      <S.ButtonContainer>
        <S.StyledButton
          onClick={handleBack}
          id={"Back"}
          icon={faArrowLeft}
          label={"Back"}
          color={DefaultColors.BrightGrey}
        />
        <S.StyledButton
          onClick={handleQuickAdd}
          id={"quick-add"}
          icon={faClock}
          label={"Quick Add"}
          color={DefaultColors.BrightPurple}
        />
      </S.ButtonContainer>
      <S.Panel>
        <S.Heading>Add New</S.Heading>
      </S.Panel>
      <S.Panel>
        <S.Heading>Edit existing</S.Heading>
      </S.Panel>
    </S.Container>
  );
};

namespace S {
  export const Container = styled.div`
    label: AttendeesAddContainer;
    padding: 0 20px 20px;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 10px;

    @media (min-width: 700px) {
      padding-left: 10vw;
      padding-right: 10vw;
    }
  `;

  export const ButtonContainer = styled.div`
    label: AttendeesAddButtonContainer;
    display: flex;
    flex-direction: row;
    align-items: stretch;
    gap: 5px;
  `;

  export const StyledButton = styled(Button)`
    flex: 1;
  `;

  export const Panel = styled(Tile)``;

  export const Heading = styled("h3")`
    font-size: 18px;
    margin: 0;
  `;
}
