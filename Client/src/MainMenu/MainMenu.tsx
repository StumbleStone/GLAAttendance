import { useTheme } from "@emotion/react";
import styled from "@emotion/styled";
import React, { useEffect, useMemo, useReducer } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Heading } from "../Components/Heading";
import { Tile } from "../Components/Tile";
import { SupaBase, SupaBaseEventKey } from "../SupaBase/SupaBase";
import { Breadcrumbs } from "./Breadcrumbs";
import { HeadingIcons } from "./HeadingIcons";
import { getRouteByPath, resolveNextPath, setFinalRoute } from "./RouteFlow";

export const MainMenu: React.FC<{}> = () => {
  const theme = useTheme();
  const [revision, forceUpdate] = useReducer((x) => x + 1, 0);

  const location = useLocation();
  const nav = useNavigate();
  const lastRedirectKeyRef = React.useRef<string | null>(null);

  const supabase = useMemo(() => new SupaBase(), []);

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
  }, [location.pathname]);

  useEffect(() => {
    // Persist the user's endpoint intent (e.g. /dashboard or /events) across prerequisite redirects.
    const route = getRouteByPath(location.pathname);
    if (!route?.isEndpoint) {
      return;
    }

    setFinalRoute(location.pathname);
  }, [location.pathname]);

  // Re-evaluate route gating when route or auth/profile state changes.
  useEffect(() => {
    const nextPath = resolveNextPath(supabase, location.pathname);
    if (!nextPath || nextPath === location.pathname) {
      lastRedirectKeyRef.current = null;
      return;
    }

    const redirectKey = `${location.pathname}->${nextPath}`;
    if (lastRedirectKeyRef.current === redirectKey) {
      return;
    }
    lastRedirectKeyRef.current = redirectKey;

    console.log(
      `%cRoute gate: %c${location.pathname || "/"} %c-> %c${nextPath}`,
      "color: grey;",
      "color: cyan;",
      "color: grey;",
      "color: lime;",
    );
    nav(nextPath, { replace: true });
  }, [location.pathname, nav, revision, supabase]);

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
      <Breadcrumbs supabase={supabase} />
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
