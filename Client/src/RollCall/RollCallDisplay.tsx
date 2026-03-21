import { useTheme } from "@emotion/react";
import styled from "@emotion/styled";
import { faListCheck } from "@fortawesome/free-solid-svg-icons";
import React, { useCallback, useReducer } from "react";
import { Button } from "../Components/Button/Button";
import { SupaBase, SupaBaseEventKey } from "../SupaBase/SupaBase";
import { RollCallEventEntry } from "../SupaBase/types";
import {
  ShowRollCallWindow,
  ShowRollCallWindowOptions,
} from "./RollCallWindow";

export interface RollCallDisplayProps extends ShowRollCallWindowOptions {
  disabled?: boolean;
  supabase: SupaBase;
}

export const RollCallDisplay: React.FC<RollCallDisplayProps> = (
  props: RollCallDisplayProps,
) => {
  const theme = useTheme();
  const { allowedEventIds, disabled = false, rollCallEvent, supabase } = props;

  const [, forceUpdate] = useReducer((x) => x + 1, 0);

  React.useEffect(() => {
    return supabase.addListener({
      [SupaBaseEventKey.EVENTS_CHANGED]: forceUpdate,
      [SupaBaseEventKey.LOADED_ROLLCALL_EVENTS]: forceUpdate,
      [SupaBaseEventKey.UPDATED_ROLLCALL_EVENT]: forceUpdate,
    });
  }, [supabase]);

  const derivedRollCallEvent =
    allowedEventIds?.length && allowedEventIds.length > 0
      ? supabase.getLatestRollCallEventByEventIds(allowedEventIds)
      : (supabase.currentRollCallEvent ?? null);
  const curRoll: RollCallEventEntry | null =
    rollCallEvent ?? derivedRollCallEvent;

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

  const handleClick = useCallback(() => {
    ShowRollCallWindow(supabase, {
      allowedEventIds,
      rollCallEvent: curRoll,
    });
  }, [allowedEventIds, curRoll, supabase]);

  return (
    <S.StyledButton
      disabled={disabled}
      onClick={handleClick}
      icon={faListCheck}
      color={
        isInProgress === true
          ? theme.colors.accent.warning
          : theme.colors.textMuted
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
    width: fit-content;
  `;

  export const RollCallText = styled.span``;
  export const RollCallStatus = styled.span``;
}
