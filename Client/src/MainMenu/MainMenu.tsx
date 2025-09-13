import styled from "@emotion/styled";
import React, { useEffect, useMemo, useReducer, useState } from "react";

import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Heading } from "../Components/Heading";
import { LoadingSpinner } from "../Components/LoadingSpinner";
import { Tile } from "../Components/Tile";
import { SupaBase, SupaBaseEventKey } from "../SupaBase/SupaBase";
import { DefaultColors } from "../Tools/Toolbox";

interface RouteState {
  path: RoutePath;
  canPassCheck: (s: SupaBase) => boolean;
}

enum RoutePath {
  LOADING = "/loading",
  LOADING_PROFILE = "/loading_profile",
  LOGIN = "/login",
  ONBOARDING = "/onboard",
  DASHBOARD = "/dashboard",
}

// Order here very important
const ROUTES: RouteState[] = [
  {
    path: RoutePath.LOADING,
    canPassCheck: (s) => s.hasInit && s.supabaseConnected,
  },
  {
    path: RoutePath.LOGIN,
    canPassCheck: (s) => s.isLoggedIn,
  },
  {
    path: RoutePath.LOADING_PROFILE,
    canPassCheck: (s) => !!s.profile,
  },
  {
    path: RoutePath.ONBOARDING,
    canPassCheck: (s) => s.isOnboarded,
  },
  {
    path: RoutePath.DASHBOARD,
    // Last route, will never pass
    canPassCheck: (s) => false,
  },
];

function calculateNextRoute(supabase: SupaBase): RouteState | null {
  for (let route of ROUTES) {
    if (!route.canPassCheck(supabase)) {
      return route;
    }
  }

  return null;
}

export const MainMenu: React.FC<{}> = () => {
  const [, forceUpdate] = useReducer((x) => x + 1, 0);

  const location = useLocation();
  const nav = useNavigate();

  const supabase = useMemo(() => new SupaBase(), []);

  const [route, setRoute] = useState<RouteState | null>(
    calculateNextRoute(supabase)
  );

  useEffect(() => {
    const l = supabase.addListener({
      [SupaBaseEventKey.INIT_DONE]: forceUpdate,
      [SupaBaseEventKey.USER_LOGIN]: forceUpdate,
      [SupaBaseEventKey.USER_PROFILE]: forceUpdate,
      [SupaBaseEventKey.CLIENT_CONNECTED]: forceUpdate,
    });

    supabase.init();
    return l;
  }, []);

  const content = useMemo(() => {
    if (!supabase.hasInit) {
      return <LoadingSpinner size={100} />;
    }

    switch (location.pathname) {
      // Nothing much to do here yet, the useEffect responsible for nav will take care of it
      case "":
      case "/":
        return <></>;
    }

    // Handled by router
    return (
      <S.Content>
        <S.ContentScroll>
          <Outlet context={{ supabase }} />
        </S.ContentScroll>
      </S.Content>
    );
  }, [location, supabase.hasInit]);

  // The navigator
  useEffect(() => {
    const nextRoute: RouteState | null = calculateNextRoute(supabase);

    if (nextRoute == null) {
      return;
    }

    if (!route || nextRoute.path != route.path) {
      console.log(
        `%cRoute sequence: %c${route?.path ?? "/"} %c-> %c${nextRoute.path}`,
        "color: grey;",
        "color: cyan;",
        "color: grey;",
        "color: cyan;"
      );
      setRoute(nextRoute);
    }
  });

  useEffect(() => {
    if (!route) {
      return;
    }

    if (location.hash == route.path) {
      return;
    }

    console.log(
      `%cNavigating to: %c${route.path}`,
      "color: grey;",
      "color: lime;"
    );
    nav(route.path);
  }, [route, location.hash]);

  return (
    <S.ContainerEl>
      <S.TitleTile>
        <Heading>
          <S.TitlePart color={DefaultColors.BrightGreen}>{"GLA "}</S.TitlePart>
          <S.TitlePart>{"Attendance"}</S.TitlePart>
        </Heading>
      </S.TitleTile>
      {content}
    </S.ContainerEl>
  );
};

namespace S {
  export const ContainerEl = styled("div")`
    label: MainMenuContainer;
    touch-action: manipulation;
    width: 100%;
    max-height: 100%;
    height: 100%;
    color: ${DefaultColors.Text_Color};
    font-size: 18px;
    /* This ensured that landscape mobile has some whitespace at the bottom */
    padding-bottom: 100px;
    display: flex;
    flex-direction: column;
  `;

  export const TitlePart = styled("span")<{ color?: string }>`
    color: ${(p) => p.color};
  `;

  export const TitleTile = styled(Tile)`
    label: Title;
    border-top: transparent;
    border-left: transparent;
    border-right: transparent;
    border-top-left-radius: 0;
    border-top-right-radius: 0;
    box-shadow: 0 5px 10px 5px ${DefaultColors.Container};
    margin-bottom: 15px;
    user-select: none;

    display: flex;
    gap: 5px;
    align-items: center;
    justify-content: flex-start;
  `;

  export const BackIcon = styled("div")``;

  export const Content = styled("div")`
    label: Content;
    position: relative;
    flex-grow: 1;
    max-height: 100%;
    overflow: auto;
    overscroll-behavior: auto;
  `;

  export const ContentScroll = styled("div")`
    label: ContentScroll;
    overflow: auto;
    padding-bottom: 100px;
  `;
}
