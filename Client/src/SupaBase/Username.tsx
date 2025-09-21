import React, { useEffect, useMemo } from "react";
import { Span } from "../Components/Span";
import { SupaBase, SupaBaseEventKey } from "./SupaBase";

export interface UsernameProps {
  id: string;
  supabase: SupaBase;
}

export const Username: React.FC<UsernameProps> = (props: UsernameProps) => {
  const { id, supabase } = props;
  const [updater, forceUpdate] = React.useReducer((x) => x + 1, 0);

  useEffect(() => {
    if (supabase.usernamesLoaded) {
      return;
    }

    return supabase.addListener({
      [SupaBaseEventKey.USERNAMES_LOADED]: forceUpdate,
    });
  }, [supabase.usernamesLoaded]);

  const name: string = useMemo(
    () => (id ? supabase.getUserName(id) : "--"),
    [id, updater]
  );

  return <Span>{name}</Span>;
};
