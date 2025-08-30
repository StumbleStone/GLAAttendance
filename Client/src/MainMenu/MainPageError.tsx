import styled from "@emotion/styled";
import React from "react";
import { useNavigate, useRouteError } from "react-router-dom";
import { Tile } from "../Components/Tile";

export const MainPageError: React.FC = () => {
  const error = useRouteError() as string | Error | null;

  const nav = useNavigate();

  console.error("Error: ", error);
  return (
    <S.Container>
      <S.Heading>An Error has occurred</S.Heading>
      <S.ErrorMessage>
        {typeof error === "string" ? error : error?.message}
      </S.ErrorMessage>
      <S.StyledTitleBarLink onClick={() => nav("/app")}>
        {"Go Back!"}
      </S.StyledTitleBarLink>
    </S.Container>
  );
};

namespace S {
  export const Container = styled(Tile)`
    margin: 10px;
    display: flex;
    flex-direction: column;
  `;

  export const Heading = styled("h1")``;

  export const ErrorMessage = styled("span")`
    margin: 10px;
  `;

  export const StyledTitleBarLink = styled("div")`
    position: relative;
  `;
}
