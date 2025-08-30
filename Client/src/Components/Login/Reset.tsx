import styled from "@emotion/styled";
import * as React from "react";
import { useOutletContext } from "react-router-dom";
import { SupaBase } from "../../SupaBase/SupaBase";
import { Button, ButtonContainer } from "../Button/Button";
import { PasswordInput } from "../Inputs/PasswordInput";
import { Label } from "../Label";
import { SubHeading } from "../SubHeading";
import { Tile } from "../Tile";

export interface ResetProps {
  supabase: SupaBase;
}

export const Reset: React.FC = (props) => {
  const { supabase } = useOutletContext<ResetProps>();

  const [pwd, setPwd] = React.useState("");
  const [pwd2, setPwd2] = React.useState("");

  const passwordRef = React.useRef<HTMLInputElement>(null);

  const handlePasswordSet = React.useCallback(async () => {
    debugger;
  }, []);

  return (
    <S.ContainerEl>
      <S.ResetEl>
        <SubHeading text="Reset" />
        <S.InputContainer>
          <Label>Password</Label>
          <PasswordInput
            forwardRef={passwordRef}
            name="supabase-password"
            aria-label="supabase-password"
            value={pwd}
            onChange={(ev) => {
              setPwd(ev.target.value);
            }}
          />
        </S.InputContainer>
        <S.InputContainer>
          <Label>Retype Password</Label>
          <PasswordInput
            forwardRef={passwordRef}
            name="supabase-password"
            aria-label="supabase-password"
            value={pwd2}
            onChange={(ev) => {
              setPwd2(ev.target.value);
            }}
          />
        </S.InputContainer>
        <ButtonContainer>
          <Button onClick={handlePasswordSet}>Change Password</Button>
        </ButtonContainer>
      </S.ResetEl>
    </S.ContainerEl>
  );
};

namespace S {
  export const ContainerEl = styled("div")`
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  `;

  export const ResetEl = styled(Tile)`
    width: 80vw;
    display: flex;
    flex-direction: column;
  `;

  export const InputContainer = styled("div")`
    display: flex;
    flex-direction: column;
    gap: 15px;
    margin-bottom: 25px;
    width: 100%;
  `;
}
