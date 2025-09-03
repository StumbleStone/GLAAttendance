import { keyframes } from "@emotion/react";
import styled from "@emotion/styled";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import React, { useEffect, useMemo, useState } from "react";

import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Heading } from "../Components/Heading";
import { Icon } from "../Components/Icon";
import { Tile } from "../Components/Tile";
import { SupaBase, SupaBaseEventKey } from "../SupaBase/SupaBase";
import { DefaultColors } from "../Tools/Toolbox";

export const MainMenu: React.FC<{}> = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isSupabaseLoading, setIsSupabaseLoading] = useState<boolean>(true);

  const location = useLocation();
  const nav = useNavigate();

  const [supabase, _] = useState(() => new SupaBase());

  useEffect(() => {
    const l = supabase.addListener({
      [SupaBaseEventKey.INIT_DONE]: (done: boolean) => {
        setIsSupabaseLoading(!done);
      },
      [SupaBaseEventKey.USER_LOGIN]: () => {
        setIsLoggedIn(supabase.isLoggedIn);
      },
    });

    supabase.init();
    return l;
  }, []);

  const content = useMemo(() => {
    if (isSupabaseLoading) {
      return (
        <S.SpinnerContainer>
          <S.Spinner size={100} />
        </S.SpinnerContainer>
      );
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
  }, [location, isSupabaseLoading]);

  // The navigator
  useEffect(() => {
    if (isSupabaseLoading) {
      return;
    }

    if (isLoggedIn && ["/login"].includes(location.pathname)) {
      nav("/dashboard");
      return;
    }

    if (!isLoggedIn && !["/login"].includes(location.pathname)) {
      nav("/login");
      return;
    }

    switch (location.pathname) {
      case "":
      case "/": {
        nav("/dashboard");
      }
    }
  }, [location, isLoggedIn, isSupabaseLoading]);

  const canBack =
    isLoggedIn && !isSupabaseLoading && location.pathname !== "/dashboard";

  return (
    <S.ContainerEl>
      <S.TitleTile>
        <S.BackIcon
          onClick={() => {
            canBack ? nav("/dashboard") : null;
          }}
        >
          <Icon
            icon={faArrowLeft}
            size={28}
            color={
              canBack ? DefaultColors.Text_Color : DefaultColors.TRANSPARENT
            }
          />
        </S.BackIcon>
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

  export const SpinnerContainer = styled("div")`
    label: SpinnerContainer;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
  `;

  const anim_spin = keyframes`
    0% {
      transform: rotate(0);
    }
    50% {
      transform: rotate(180deg);
    }
    100% {
      transform: rotate(360deg);
    }
  `;

  export const Spinner = styled("div")<{ size: number }>`
    label: Spinner;
    border-top: 10px solid ${DefaultColors.OffWhite};
    border-bottom: 10px solid ${DefaultColors.OffWhite};
    border-left: 10px solid transparent;
    border-right: 10px solid transparent;
    width: ${(p) => p.size}px;
    height: ${(p) => p.size}px;
    border-radius: 50%;
    animation: ${anim_spin} linear infinite 1s;
  `;

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
