import styled from "@emotion/styled";
import * as React from "react";
import { useOutletContext } from "react-router-dom";
import { Heading } from "../Components/Heading";
import { SubHeading } from "../Components/SubHeading";
import { Tile } from "../Components/Tile";
import { SupaBase } from "../SupaBase/SupaBase";

export interface EventsProps {
  supabase: SupaBase;
}

export const Events: React.FC = () => {
  useOutletContext<EventsProps>();

  return (
    <S.Container>
      <S.Panel>
        <Heading>Events</Heading>
        <S.PanelDescription>
          Events route is ready. Filtering by query params can be added with
          views like <S.Code>/events?view=my</S.Code>,{" "}
          <S.Code>/events?view=active</S.Code>, and{" "}
          <S.Code>/events?view=past</S.Code>.
        </S.PanelDescription>
      </S.Panel>
    </S.Container>
  );
};

namespace S {
  export const Container = styled.div`
    label: EventsContainer;
    padding: 0 20px 20px;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    margin-top: 15px;
    gap: 10px;

    @media (min-width: 700px) {
      padding-left: 10vw;
      padding-right: 10vw;
    }
  `;

  export const Panel = styled(Tile)`
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 14px;
  `;

  export const PanelDescription = styled(SubHeading)`
    color: ${(p) => p.theme.colors.textMuted};
    font-size: 16px;
  `;

  export const Code = styled("span")`
    color: ${(p) => p.theme.colors.accent.primary};
    font-size: 14px;
  `;
}
