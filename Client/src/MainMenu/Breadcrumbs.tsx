import styled from "@emotion/styled";
import * as React from "react";
import { matchPath, useLocation, useNavigate } from "react-router-dom";
import { SupaBase, SupaBaseEventKey } from "../SupaBase/SupaBase";
import { EventsEntry } from "../SupaBase/types";
import { RoutePath } from "./RouteFlow";

export interface BreadcrumbsProps {
  supabase: SupaBase;
}

export interface BreadcrumbItem {
  label: string;
  path: string;
}

function createDashboardBreadcrumb(): BreadcrumbItem {
  return {
    label: "Dashboard",
    path: RoutePath.DASHBOARD,
  };
}

function withDashboardBase(
  breadcrumbItems: BreadcrumbItem[],
): BreadcrumbItem[] {
  if (breadcrumbItems.length === 0) {
    return [createDashboardBreadcrumb()];
  }

  if (breadcrumbItems[0]?.path === RoutePath.DASHBOARD) {
    return breadcrumbItems;
  }

  return [createDashboardBreadcrumb(), ...breadcrumbItems];
}

function findEvent(eventId: number, supabase: SupaBase): EventsEntry | null {
  return (
    supabase.eventsHandler.attendanceEvents.find(
      (event) => event.id === eventId,
    ) ?? null
  );
}

function getEventBreadcrumbLabel(eventId: number, supabase: SupaBase): string {
  const event = findEvent(eventId, supabase);
  const eventName = event?.name?.trim();
  if (!!eventName) {
    return eventName;
  }

  return "Event";
}

function getBreadcrumbItems(
  pathname: string,
  supabase: SupaBase,
): BreadcrumbItem[] {
  const eventRouteMatch = matchPath(
    {
      path: RoutePath.EVENT,
      end: true,
    },
    pathname,
  );

  if (!!eventRouteMatch?.params.id) {
    const eventId = Number(eventRouteMatch.params.id);
    return withDashboardBase([
      {
        label: "Events",
        path: RoutePath.EVENTS,
      },
      {
        label: Number.isInteger(eventId)
          ? getEventBreadcrumbLabel(eventId, supabase)
          : "Event",
        path: pathname,
      },
    ]);
  }

  switch (pathname) {
    case RoutePath.DASHBOARD:
      return [createDashboardBreadcrumb()];
    case RoutePath.EVENTS:
      return withDashboardBase([
        {
          label: "Events",
          path: RoutePath.EVENTS,
        },
      ]);
    case RoutePath.DEBUG:
      return withDashboardBase([
        {
          label: "Debug",
          path: RoutePath.DEBUG,
        },
      ]);
    case RoutePath.LOGIN:
      return withDashboardBase([
        {
          label: "Login",
          path: RoutePath.LOGIN,
        },
      ]);
    case RoutePath.ONBOARDING:
      return withDashboardBase([
        {
          label: "Onboard",
          path: RoutePath.ONBOARDING,
        },
      ]);
    case RoutePath.LOADING:
      return withDashboardBase([
        {
          label: "Loading",
          path: RoutePath.LOADING,
        },
      ]);
    case RoutePath.LOADING_PROFILE:
      return withDashboardBase([
        {
          label: "Loading Profile",
          path: RoutePath.LOADING_PROFILE,
        },
      ]);
    default:
      return [createDashboardBreadcrumb()];
  }
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = (
  props: BreadcrumbsProps,
) => {
  const { supabase } = props;
  const location = useLocation();
  const nav = useNavigate();
  const [revision, forceUpdate] = React.useReducer((x) => x + 1, 0);

  React.useEffect(() => {
    const listener = supabase.addListener({
      [SupaBaseEventKey.EVENTS_CHANGED]: forceUpdate,
    });

    return listener;
  }, [supabase]);

  const breadcrumbItems = React.useMemo<BreadcrumbItem[]>(() => {
    return getBreadcrumbItems(location.pathname, supabase);
  }, [location.pathname, revision, supabase]);

  const handleNavigate = React.useCallback(
    (path: string) => {
      if (path === location.pathname) {
        return;
      }

      nav(path);
    },
    [location.pathname, nav],
  );

  if (breadcrumbItems.length === 0) {
    return null;
  }

  return (
    <S.Container>
      <S.Inner>
        {breadcrumbItems.map((item, index) => {
          const isLastItem = index === breadcrumbItems.length - 1;
          return (
            <React.Fragment key={`${item.path}-${index}`}>
              {index > 0 && <S.Separator>{"/"}</S.Separator>}
              {isLastItem ? (
                <S.CurrentItem>{item.label}</S.CurrentItem>
              ) : (
                <S.LinkItem onClick={() => handleNavigate(item.path)}>
                  {item.label}
                </S.LinkItem>
              )}
            </React.Fragment>
          );
        })}
      </S.Inner>
    </S.Container>
  );
};

namespace S {
  export const Container = styled.div`
    border-bottom: 1px solid ${(p) => p.theme.colors.borderSubtle};
    background-color: ${(p) => p.theme.colors.surface};
    padding: 8px 20px 10px;

    @media (min-width: 700px) {
      padding-left: 10vw;
      padding-right: 10vw;
    }
  `;

  export const Inner = styled.div`
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
    min-height: 18px;
  `;

  export const Separator = styled.span`
    color: ${(p) => p.theme.colors.textMuted};
    font-size: 13px;
    user-select: none;
  `;

  export const LinkItem = styled.button`
    padding: 0;
    border: none;
    background: transparent;
    color: ${(p) => p.theme.colors.accent.primary};
    font-family: ${(p) => p.theme.font.body};
    font-size: 13px;
    cursor: pointer;

    &:hover {
      text-decoration: underline;
    }
  `;

  export const CurrentItem = styled.span`
    color: ${(p) => p.theme.colors.textMuted};
    font-size: 13px;
  `;
}
