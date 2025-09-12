import styled from "@emotion/styled";
import { faListCheck } from "@fortawesome/free-solid-svg-icons";
import React, { useCallback, useReducer } from "react";
import { Button } from "../Components/Button/Button";
import { SupaBase } from "../SupaBase/SupaBase";
import { DefaultColors } from "../Tools/Toolbox";

export interface RollCallDisplayProps {
  supabase: SupaBase;
}

export const RollCallDisplay: React.FC<RollCallDisplayProps> = (
  props: RollCallDisplayProps
) => {
  const { supabase } = props;

  const [, forceUpdate] = useReducer((x) => x + 1, 0);

  React.useEffect(() => {
    return supabase.addListener({
      updated_rollcall_event: forceUpdate,
    });
  }, []);

  const curRoll = supabase.currentRollCallEvent;

  let isInProgress: boolean | null;
  let message: string;

  if (!curRoll) {
    isInProgress = null;
    message = `None`;
  } else if (curRoll.closed_by != null) {
    isInProgress = false;
    message = `Closed`;
  } else {
    isInProgress = true;
    message = ` In Progress!`;
  }

  const handleClick = useCallback(() => {}, []);

  return (
    <S.StyledButton
      onClick={handleClick}
      icon={faListCheck}
      color={
        isInProgress === true
          ? DefaultColors.BrightOrange
          : DefaultColors.BrightGrey
      }
    >
      <S.RollCallText>{"RollCall:"}</S.RollCallText>
      <S.RollCallStatus>{message}</S.RollCallStatus>
    </S.StyledButton>
  );
};

namespace S {
  export const StyledButton = styled(Button)`
    font-size: 22px;
    display: flex;
    gap: 5px;
  `;

  export const RollCallText = styled.span``;
  export const RollCallStatus = styled.span``;
}
