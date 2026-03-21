import styled from "@emotion/styled";
import * as React from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Chip } from "../Components/Chip/Chip";
import { Heading } from "../Components/Heading";
import { SubHeading } from "../Components/SubHeading";
import { Tile } from "../Components/Tile";
import { SupaBase } from "../SupaBase/SupaBase";
import { RoutePath } from "./RouteFlow";

export interface DashboardProps {
  supabase: SupaBase;
}

export const Dashboard: React.FC = () => {
  useOutletContext<DashboardProps>();
  const nav = useNavigate();

  const onClickRollCalls = React.useCallback(() => {
    nav(RoutePath.ROLLCALLS);
  }, [nav]);

  const onClickEvents = React.useCallback(() => {
    nav(RoutePath.EVENTS);
  }, [nav]);

  return (
    <S.Container>
      <S.Panel>
        <Heading>Dashboard</Heading>
        <S.PanelDescription>
          Quick access modules. Functional behavior can be added later.
        </S.PanelDescription>

        <S.PanelGrid>
          <S.PanelItem onClick={onClickRollCalls} clickable={true}>
            <S.ItemTitle>Rollcalls</S.ItemTitle>
            <S.ItemCopy>Start and monitor attendance rollcalls.</S.ItemCopy>
            <S.Badge label="Surface" />
          </S.PanelItem>

          <S.PanelItem onClick={onClickEvents} clickable={true}>
            <S.ItemTitle>Events</S.ItemTitle>
            <S.ItemCopy>Manage event setup and scheduling.</S.ItemCopy>
            <S.Badge label="Surface" />
          </S.PanelItem>

          <S.PanelItem>
            <S.ItemTitle>Attendees</S.ItemTitle>
            <S.ItemCopy>View and manage attendee records.</S.ItemCopy>
            <S.Badge label="Surface" />
          </S.PanelItem>

          <S.PanelItem>
            <S.ItemTitle>Profile</S.ItemTitle>
            <S.ItemCopy>Review account details and preferences.</S.ItemCopy>
            <S.Badge label="Surface" />
          </S.PanelItem>
        </S.PanelGrid>
      </S.Panel>
    </S.Container>
  );
};

namespace S {
  export const Container = styled.div`
    label: DashboardContainer;
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

  export const PanelGrid = styled.div`
    display: grid;
    grid-template-columns: 1fr;
    gap: 10px;

    @media (min-width: 700px) {
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    }
  `;

  export const PanelItem = styled(Tile)<{ clickable?: boolean }>`
    display: flex;
    flex-direction: column;
    gap: 8px;
    background-color: ${(p) => p.theme.colors.surfaceRaised};
    border-color: ${(p) => p.theme.colors.borderSubtle};
    cursor: ${(p) => (p.clickable ? "pointer" : "default")};

    &:hover {
      background-color: ${(p) =>
        p.clickable
          ? p.theme.colors.surfaceActive
          : p.theme.colors.surfaceRaised};
    }
  `;

  export const ItemTitle = styled.div`
    font-size: 20px;
    color: ${(p) => p.theme.colors.text};
  `;

  export const ItemCopy = styled.div`
    font-size: 15px;
    color: ${(p) => p.theme.colors.textMuted};
  `;

  export const Badge = styled(Chip)`
    align-self: flex-start;
    color: ${(p) => p.theme.colors.accent.primary};
    border-color: ${(p) => p.theme.colors.border};
    background-color: ${(p) => p.theme.colors.surfaceActive};
    padding: 4px 10px;
    font-size: 13px;
  `;
}
