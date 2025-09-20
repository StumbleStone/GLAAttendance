import { keyframes } from "@emotion/react";
import styled from "@emotion/styled";
import {
  faCheckSquare,
  faXmarkSquare,
} from "@fortawesome/free-solid-svg-icons";
import React, { useEffect } from "react";
import { Attendee } from "../Attendees/Attendee";
import { Icon } from "../Components/Icon";
import { LayerItem } from "../Components/Layer";
import { DefaultColors } from "../Tools/Toolbox";

export interface RollCallConfirmProps {
  attendee: Attendee;
  layerItem: LayerItem;
  present: boolean;
}

export const RollCallConfirm: React.FC<RollCallConfirmProps> = (
  props: RollCallConfirmProps
) => {
  const { attendee, layerItem, present } = props;

  useEffect(() => {
    let mounted = true;
    setTimeout(() => {
      if (!layerItem.destroyed) {
        layerItem.close();
      }
    }, 1800);

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <S.Background>
      <S.Container
        bdColor={present ? DefaultColors.BrightGreen : DefaultColors.BrightRed}
      >
        <Icon
          size={18}
          icon={present ? faCheckSquare : faXmarkSquare}
          color={present ? DefaultColors.BrightGreen : DefaultColors.BrightRed}
        />
        <S.Text
          tColor={present ? DefaultColors.BrightGreen : DefaultColors.BrightRed}
        >
          {attendee.fullName}
        </S.Text>
      </S.Container>
    </S.Background>
  );
};

namespace S {
  const anim = keyframes`
    0% {
      transform: scale(0.2);
      opacity: 0;
    }
    15% {
      transform: scale(1.2);
      opacity: 1;
    }
    25% {
      transform: scale(1);
      opacity: 1;
    }
    90% {
      transform: scale(1);
      opacity: 1;
    }
    100% {
      transform: scale(0.1);
      opacity: 0;
    }
  `;

  export const Background = styled.div`
    position: relative;
    width: 100vw;
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;

    animation: 1.5s linear ${anim};
    transform: scale(0.1);
    opacity: 0;
  `;

  export const Container = styled.div<{ bdColor: string }>`
    border: 2px solid ${(p) => p.bdColor};
    background-color: ${DefaultColors.Container};
    border-radius: 25px;
    display: flex;
    gap: 10px;
    padding: 10px 15px;
  `;

  export const Text = styled.div<{ tColor: string }>``;
}
