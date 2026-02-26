import {keyframes, useTheme} from "@emotion/react";
import styled from "@emotion/styled";
import {faPlus} from "@fortawesome/free-solid-svg-icons";
import * as React from "react";
import {SupaBase} from "../../SupaBase/SupaBase";
import {Backdrop} from "../Backdrop/Backdrop";
import {Icon} from "../Icon";

export interface FABProps {
  items: (close: () => void) => React.ReactNode;
}

export const FAB: React.FC<FABProps> = (props: FABProps) => {
  const theme = useTheme();
  const { items } = props;

  const [open, setOpen] = React.useState<boolean>(false);
  const [openTransition, setOpenTransition] = React.useState(false);

  React.useEffect(() => {
    // To skip first render
    if (openTransition === false) {
      return;
    }

    const timer = setTimeout(() => {
      setOpenTransition((c) => false);
    }, 250);

    return () => {
      clearTimeout(timer);
    };
  }, [openTransition]);

  const toggleOpen = React.useCallback(() => {
    if (openTransition) {
      return;
    }

    setOpenTransition(true);
    setOpen((prev) => true);
  }, [open, openTransition]);

  const toggle = React.useCallback(() => {
    if (openTransition) {
      return;
    }

    setOpenTransition(true);
    setOpen((prev) => !prev);
  }, [open, openTransition]);

  const toggleClose = React.useCallback(() => {
    setOpenTransition(true);
    setOpen((prev) => false);
  }, [open]);

  return (
    <S.FABEl>
      {(open || openTransition) && (
        <S.StyledBackdrop onClose={toggleClose}>
          <FABExtended
            isTransitioning={openTransition}
            open={open}
            children={items(toggleClose)}
          />
        </S.StyledBackdrop>
      )}
      <S.ShadowContainer>
        <S.IconContainer isOpen={!!open} onClick={toggle}>
          <Icon icon={faPlus} size={24} color={theme.colors.text} />
        </S.IconContainer>
      </S.ShadowContainer>
    </S.FABEl>
  );
};

export interface FABExtendedProps {
  isTransitioning: boolean;
  open: boolean;
  children: React.ReactNode;
}

const FABExtended: React.FC<FABExtendedProps> = (props: FABExtendedProps) => {
  const { isTransitioning, children, open } = props;
  return (
    <S.FABExtContainer>
      <S.FABExtEl isTransitioning={isTransitioning} open={open}>
        {children}
      </S.FABExtEl>
    </S.FABExtContainer>
  );
};

export interface FABAddCategoryProps {
  supabase: SupaBase;
  close: () => void;
}

namespace S {
  export const FABEl = styled("div")`
    label: FAB;
    user-select: none;
  `;

  export const FABExtContainer = styled("div")`
    label: FABExtContainer;
    position: fixed;
    right: 0;
    bottom: 80px;
    max-height: calc(100% - 150px);
    overflow: hidden;

    display: flex;
    gap: 5px;
    flex-direction: column;
    justify-content: flex-end;
    align-items: flex-end;

    padding: 10px;
  `;

  const anim = (opening: boolean) => keyframes`
    0% {
      transform: translateY(${opening ? 101 : 0}%);  
      opacity: ${opening ? 0 : 1};
    }
    50% {
      opacity: 0.3;
    }
    100% {
      transform: translateY(${opening ? 0 : 101}%);
      opacity: ${opening ? 1 : 0};
    }
  `;

  export const FABExtEl = styled("div")<{
    isTransitioning: boolean;
    open: boolean;
  }>`
    label: FABExtChildContainer;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    gap: 5px;

    transform: translateY(${(p) => (p.open ? 0 : 101)}%);
    opacity: ${(p) => (p.open ? 1 : 0)};
    animation: 0.25s ease-in-out ${(p) => anim(p.open)} forwards;
    pointer-events: all;
  `;

  export const ShadowContainer = styled("div")`
    display: flex;
    justify-content: center;
    align-items: center;

    position: fixed;
    width: 60px;
    height: 60px;
    right: 0;
    bottom: 0;
    margin: 20px;
    border-radius: 50%;
    box-shadow: ${(p) => `0px 6px 5px 0px ${p.theme.colors.surface}`};
  `;

  export const IconContainer = styled("div")<{ isOpen: boolean }>`
    display: flex;
    justify-content: center;
    align-items: center;

    width: 100%;
    height: 100%;

    background-color: ${(p) => p.theme.colors.surface};
    border-radius: 50%;
    box-sizing: border-box;
    border: 2px solid ${(p) => p.theme.colors.border};

    transform: rotate(${(p) => (p.isOpen ? 45 : 0)}deg);
    transition: 0.25s ease-in-out transform;

    cursor: pointer;
  `;

  export const StyledBackdrop = styled(Backdrop)`
    background-color: transparent;
  `;
}
