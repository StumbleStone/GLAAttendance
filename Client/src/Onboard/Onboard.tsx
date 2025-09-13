import styled from "@emotion/styled";
import { faAsterisk, faSignature } from "@fortawesome/free-solid-svg-icons";
import React, { ChangeEvent, useCallback, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { Button } from "../Components/Button/Button";
import { CheckboxBool } from "../Components/Checkbox/Checkbox";
import { Heading } from "../Components/Heading";
import { InputWithIcon } from "../Components/Inputs/InputWithIcon";
import { PasswordInput } from "../Components/Inputs/PasswordInput";
import { Label } from "../Components/Label";
import { SubHeading } from "../Components/SubHeading";
import { Tile } from "../Components/Tile";
import { SupaBase } from "../SupaBase/SupaBase";
import { DefaultColors } from "../Tools/Toolbox";

export interface OnboardProps {
  supabase: SupaBase;
}

function validateName(name: string): boolean {
  if (!name) {
    return false;
  }

  return name.length > 3;
}

interface PasswordValidation {
  hasSpecial: boolean;
  hasNumber: boolean;
  hasUpperCase: boolean;
  hasLowerCase: boolean;
  minLength: boolean;
  passwordsMatch: boolean;
}

const hasLowerCase = /[a-z]/;
const hasUpperCase = /[A-Z]/;
const hasNumber = /[0-9]/;
const hasSpecial = /[^\w\s]/;
const pwdMinLength = 10;
function validatePassword(pwd: string, pwd2: string): PasswordValidation {
  return {
    hasLowerCase: hasLowerCase.test(pwd),
    hasUpperCase: hasUpperCase.test(pwd),
    hasNumber: hasNumber.test(pwd),
    hasSpecial: hasSpecial.test(pwd),
    minLength: pwd.length >= pwdMinLength,
    passwordsMatch: pwd === pwd2,
  };
}

function passwordIsValid(pv: PasswordValidation): boolean {
  return Object.values(pv).every((t) => t === true);
}

export const Onboard: React.FC = () => {
  const { supabase } = useOutletContext<OnboardProps>();

  const [name, setName] = React.useState("");
  const [validName, setValidName] = React.useState<boolean>(false);
  const [surname, setSurname] = React.useState("");
  const [validSurname, setValidSurname] = React.useState<boolean>(false);

  const [pwd, setPwd] = React.useState("");
  const [pwd2, setPwd2] = React.useState("");
  const [passwordValid, setPasswordValid] = React.useState<PasswordValidation>(
    () => validatePassword(pwd || "", pwd2 || "")
  );

  const [accepted, setAccepted] = React.useState<boolean>(false);

  const onChangeName = useCallback((ev: ChangeEvent<HTMLInputElement>) => {
    setName(() => ev.target.value);
  }, []);

  useEffect(() => {
    setValidName(validateName(name));
  }, [name]);

  const onChangeSurname = useCallback((ev: ChangeEvent<HTMLInputElement>) => {
    setSurname(() => ev.target.value);
  }, []);

  useEffect(() => {
    setValidSurname(validateName(surname));
  }, [surname]);

  const onChangePass = useCallback((ev: ChangeEvent<HTMLInputElement>) => {
    setPwd(() => ev.target.value);
  }, []);

  const onChangePass2 = useCallback((ev: ChangeEvent<HTMLInputElement>) => {
    setPwd2(() => ev.target.value);
  }, []);

  useEffect(() => {
    setPasswordValid(validatePassword(pwd, pwd2));
  }, [pwd, pwd2]);

  const onChangeAccept = useCallback(
    (newVal: boolean) => {
      setAccepted(() => newVal);
    },
    [accepted]
  );

  const onComplete = useCallback(async () => {
    await supabase.submitOnBoarding({
      password: pwd,
      name: name,
      surname: surname,
    });
  }, [pwd, name, surname]);

  return (
    <S.Container>
      <Heading>Onboarding</Heading>
      <S.StyledSubHeading>User Details</S.StyledSubHeading>
      <S.Section>
        <S.InputContainer>
          <Label color={validName ? DefaultColors.BrightGreen : null}>
            Name
          </Label>
          <InputWithIcon
            icon={faSignature}
            key={"name"}
            autoComplete={"name"}
            name="supabase-name"
            aria-label="supabase-name"
            value={name}
            onChange={onChangeName}
          />
        </S.InputContainer>
        <S.InputContainer>
          <Label color={validSurname ? DefaultColors.BrightGreen : null}>
            Surname
          </Label>
          <InputWithIcon
            icon={faSignature}
            key={"surname"}
            autoComplete={"surname"}
            name="supabase-surname"
            aria-label="supabase-surname"
            value={surname}
            onChange={onChangeSurname}
          />
        </S.InputContainer>
      </S.Section>
      <S.Section>
        <S.InputContainer>
          <Label
            color={
              passwordIsValid(passwordValid) ? DefaultColors.BrightGreen : null
            }
          >
            Password
          </Label>
          <PasswordInput
            icon={faAsterisk}
            key={"password"}
            autoComplete={"new-password"}
            name="supabase-new-password"
            aria-label="supabase-new-password"
            value={pwd}
            onChange={onChangePass}
          />
          <S.PasswordContainer>
            <S.PasswordCheck
              tColor={
                passwordValid.hasLowerCase ? DefaultColors.BrightGreen : null
              }
            >
              {"a-z"}
            </S.PasswordCheck>
            <S.PasswordCheck
              tColor={
                passwordValid.hasUpperCase ? DefaultColors.BrightGreen : null
              }
            >
              {"A-Z"}
            </S.PasswordCheck>
            <S.PasswordCheck
              tColor={
                passwordValid.hasNumber ? DefaultColors.BrightGreen : null
              }
            >
              {"0-9"}
            </S.PasswordCheck>
            <S.PasswordCheck
              tColor={
                passwordValid.hasSpecial ? DefaultColors.BrightGreen : null
              }
            >
              {"!@#"}
            </S.PasswordCheck>
            <S.PasswordCheck
              tColor={
                passwordValid.minLength ? DefaultColors.BrightGreen : null
              }
            >{`${pwdMinLength}+`}</S.PasswordCheck>
          </S.PasswordContainer>
        </S.InputContainer>
        <S.InputContainer>
          <Label
            color={
              !pwd
                ? null
                : passwordValid.passwordsMatch
                ? DefaultColors.BrightGreen
                : DefaultColors.BrightRed
            }
          >
            Confirm Password
          </Label>
          <PasswordInput
            icon={faAsterisk}
            key={"password"}
            autoComplete={"new-password-confirm"}
            name="supabase-new-password-confirm"
            aria-label="supabase-new-password-confirm"
            value={pwd2}
            onChange={onChangePass2}
          />
        </S.InputContainer>
      </S.Section>

      <S.StyledSubHeading>Disclaimer</S.StyledSubHeading>
      <S.Section>
        <S.Disclaimer>
          <span>{`This website and its attendance tracking service are provided "as is" and "as available" without any guarantees or warranties of any kind, whether express or implied. We do not guarantee that the service will be error-free or uninterrupted, or that any information provided will be completely accurate.\n\nTo perform the roll call function, we collect and use attendee names and user names and emails. We are committed to protecting your privacy and use `}</span>
          <S.RefLink target="_blank" href="https://supabase.com/">
            {"Supabase"}
          </S.RefLink>
          <span>{` to securely store user information and handle authentication. We do not share your personal data with third parties.\n\nThis website requires an online connection in order to function.`}</span>
        </S.Disclaimer>
        <S.AcceptContainer>
          <CheckboxBool onChange={onChangeAccept} value={accepted} />
          <S.AcceptLabel>I Accept</S.AcceptLabel>
        </S.AcceptContainer>
      </S.Section>
      {/* <ButtonContainer> */}
      <S.CompleteButton
        onClick={onComplete}
        disabled={
          accepted !== true ||
          !validName ||
          !validSurname ||
          !passwordIsValid(passwordValid)
        }
      >
        Complete
      </S.CompleteButton>
      {/* </ButtonContainer> */}
    </S.Container>
  );
};

namespace S {
  export const Container = styled(Tile)`
    margin-top: 0;
    margin: 30px;
  `;

  export const CompleteButton = styled(Button)`
    justify-content: center;
  `;

  export const Disclaimer = styled.div`
    white-space: break-spaces;
    text-align: justify;
  `;

  export const InputContainer = styled("div")<{ hide?: boolean }>`
    display: ${(p) => (p.hide ? "none" : "flex")};
    flex-direction: column;
    gap: 5px;
    width: 100%;
  `;

  export const StyledSubHeading = styled(SubHeading)`
    margin-bottom: 10px;
  `;

  export const Section = styled.div`
    margin-bottom: 25px;
    display: flex;
    gap: 5px;
    flex-direction: column;
  `;

  export const RefLink = styled.a`
    color: ${DefaultColors.BrightCyan};
  `;

  export const AcceptLabel = styled.div``;

  export const AcceptContainer = styled.div`
    display: flex;
    gap: 5px;
    align-items: center;
    margin-top: 10px;
  `;

  export const PasswordContainer = styled.div`
    display: flex;
    flex-direction: row;

    border: 1px solid ${DefaultColors.OffWhite}55;
    border-radius: 15px;
    padding: 0px 5px;
    flex-wrap: wrap;
    justify-content: space-evenly;
    user-select: none;
  `;

  export const PasswordCheck = styled.div<{ tColor?: string | null }>`
    white-space: nowrap;
    padding: 3px 6px;

    font-size: 16px;

    color: ${(p) => p.tColor ?? `${DefaultColors.OffWhite}`};
    width: 50px;

    text-align: center;

    /* ::before {
      content: "•";
      color: ${(p) => p.tColor ?? `${DefaultColors.OffWhite}`};
    } */
  `;
}
