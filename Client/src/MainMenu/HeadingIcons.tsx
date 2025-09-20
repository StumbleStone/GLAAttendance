import styled from "@emotion/styled";
import * as React from "react";
import { useEffect } from "react";
import { Icon } from "../Components/Icon";
import {
  HeadingIconHandler,
  HeadingIconHandlerEvent,
} from "./HeadingIconHandler";

export interface HeadingIconsProps {}

export const HeadingIcons: React.FC<HeadingIconsProps> = (
  props: HeadingIconsProps
) => {
  const [, forceUpdate] = React.useReducer((x) => x + 1, 0);

  useEffect(() => {
    return HeadingIconHandler.AddListener({
      [HeadingIconHandlerEvent.ICONS_CHANGED]: forceUpdate,
    });
  }, []);

  return (
    <S.HeadingIconsEl>
      {HeadingIconHandler.Icons.map((icon, idx) => (
        <S.HeadingIcon
          size={24}
          key={idx}
          icon={icon.icon}
          onClick={icon.onClick}
          color={icon.color}
        />
      ))}
    </S.HeadingIconsEl>
  );
};

namespace S {
  export const HeadingIconsEl = styled.div`
    flex-grow: 1;
    display: flex;
    justify-content: flex-end;
    gap: 15px;
  `;

  export const HeadingIcon = styled(Icon)`
    cursor: pointer;
  `;
}
