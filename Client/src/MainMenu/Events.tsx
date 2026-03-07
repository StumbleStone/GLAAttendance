import styled from "@emotion/styled";
import * as React from "react";
import { useOutletContext, useSearchParams } from "react-router-dom";
import { Heading } from "../Components/Heading";
import { SubHeading } from "../Components/SubHeading";
import { TabOption, Tabs } from "../Components/Tabs/Tabs";
import { Tile } from "../Components/Tile";
import { SupaBase } from "../SupaBase/SupaBase";

export interface EventsProps {
  supabase: SupaBase;
}

enum EventsView {
  MY = "my",
  ACTIVE = "active",
  PAST = "past",
}

const VIEW_OPTIONS: TabOption<EventsView>[] = [
  { id: EventsView.MY, label: "My Events" },
  { id: EventsView.ACTIVE, label: "Active Events" },
  { id: EventsView.PAST, label: "Past Events" },
];

function parseEventsView(view: string | null): EventsView {
  switch (view) {
    case EventsView.ACTIVE:
      return EventsView.ACTIVE;
    case EventsView.PAST:
      return EventsView.PAST;
    case EventsView.MY:
    default:
      return EventsView.MY;
  }
}

function getViewDescription(view: EventsView): string {
  switch (view) {
    case EventsView.ACTIVE:
      return "Events currently running or upcoming soon.";
    case EventsView.PAST:
      return "Event history and completed sessions.";
    case EventsView.MY:
    default:
      return "Events relevant to your assigned scope.";
  }
}

export const Events: React.FC = () => {
  useOutletContext<EventsProps>();
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedView = React.useMemo(
    () => parseEventsView(searchParams.get("view")),
    [searchParams],
  );

  const onChangeView = React.useCallback(
    (view: EventsView) => {
      const next = new URLSearchParams(searchParams);
      next.set("view", view);
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  return (
    <S.Container>
      <S.Panel>
        <Heading>Events</Heading>
        <S.PanelDescription>Browse events by view.</S.PanelDescription>

        <S.ViewContainer>
          <S.ViewLabel>View</S.ViewLabel>
          <Tabs<EventsView>
            options={VIEW_OPTIONS}
            selectedId={selectedView}
            onChange={onChangeView}
            stretch={true}
          />
        </S.ViewContainer>

        <S.ActiveViewTile>
          <S.ActiveViewTitle>
            {VIEW_OPTIONS.find((option) => option.id === selectedView)?.label}
          </S.ActiveViewTitle>
          <S.ActiveViewDescription>
            {getViewDescription(selectedView)}
          </S.ActiveViewDescription>
          <S.Code>{`/events?view=${selectedView}`}</S.Code>
        </S.ActiveViewTile>
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

  export const ViewContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
  `;

  export const ViewLabel = styled.div`
    font-size: 12px;
    color: ${(p) => p.theme.colors.textMuted};
    letter-spacing: 0.06em;
    text-transform: uppercase;
    font-weight: 700;
  `;

  export const ActiveViewTile = styled(Tile)`
    display: flex;
    flex-direction: column;
    gap: 6px;
    background-color: ${(p) => p.theme.colors.surfaceRaised};
  `;

  export const ActiveViewTitle = styled.div`
    font-size: 16px;
    color: ${(p) => p.theme.colors.text};
    font-weight: 700;
  `;

  export const ActiveViewDescription = styled.div`
    font-size: 14px;
    color: ${(p) => p.theme.colors.textMuted};
  `;

  export const Code = styled("span")`
    color: ${(p) => p.theme.colors.accent.primary};
    font-size: 14px;
  `;
}
