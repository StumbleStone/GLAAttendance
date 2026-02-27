import { useTheme } from "@emotion/react";
import styled from "@emotion/styled";
import React, { useEffect, useMemo, useReducer, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Heading } from "../Components/Heading";
import { LoadingSpinner } from "../Components/LoadingSpinner";
import { Tile } from "../Components/Tile";
import { SupaBase, SupaBaseEventKey } from "../SupaBase/SupaBase";
import { HeadingIcons } from "./HeadingIcons";

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

// This comment is to make a difference to the main branch so that the PR is not automatically merged when the publish branch is updated.

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
  const theme = useTheme();
  const [, forceUpdate] = useReducer((x) => x + 1, 0);

  const location = useLocation();
  const nav = useNavigate();

  const supabase = useMemo(() => new SupaBase(), []);

  const [route, setRoute] = useState<RouteState | null>(
    calculateNextRoute(supabase),
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
        "color: cyan;",
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
      "color: lime;",
    );
    nav(route.path);
  }, [route, location.hash]);

  return (
    <S.ContainerEl>
      <S.TitleTile>
        <S.StyledHeading>
          <S.SideBySide>
            <S.TitlePart color={theme.colors.brand}>{"GLA "}</S.TitlePart>
            <S.TitlePart>{"Attendance"}</S.TitlePart>
          </S.SideBySide>
        </S.StyledHeading>
        <HeadingIcons />
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
    height: 100%;
    min-height: 0;
    color: ${(p) => p.theme.colors.text};
    font-size: 18px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
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
    box-shadow: none;
    user-select: none;

    display: flex;
    gap: 5px;
    align-items: center;
    justify-content: flex-start;
  `;

  export const SideBySide = styled("div")`
    label: SideBySide;
    display: flex;
    gap: 10px;
  `;

  export const Content = styled("div")`
    label: Content;
    position: relative;
    flex: 1 1 auto;
    min-height: 0;
    display: flex;
    overflow: hidden;
  `;

  export const ContentScroll = styled("div")`
    label: ContentScroll;
    flex: 1 1 auto;
    min-height: 0;
    overflow: auto;
    overscroll-behavior: auto;
    padding-bottom: 100px;
  `;

  export const StyledHeading = styled(Heading)`
    font-size: 26px;
    @media (min-width: 700px) {
      font-size: 32px;
    }
  `;

  export const StyledSubHeading = styled(Heading)`
    font-size: 18px;
    @media (min-width: 700px) {
      font-size: 20px;
    }
  `;
}
