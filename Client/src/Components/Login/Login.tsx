import styled from "@emotion/styled";
import {
  faAsterisk,
  faHashtag,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import { AuthApiError } from "@supabase/supabase-js";
import * as React from "react";
import { useOutletContext } from "react-router-dom";
import { SupaBase } from "../../SupaBase/SupaBase";
import { DefaultColors } from "../../Tools/Toolbox";
import { Button, ButtonContainer } from "../Button/Button";
import { EmailInput } from "../Inputs/EmailInput";
import { PasswordInput } from "../Inputs/PasswordInput";
import { Label } from "../Label";
import { SubHeading } from "../SubHeading";
import { Tile } from "../Tile";

export interface LoginProps {
  supabase: SupaBase;
}

const emailRegex = /[a-zA-Z0-9+]{3,}@.{2,}\..{3,}/;

function validateEmail(newEmail: string): boolean {
  if (!newEmail) {
    return false;
  }

  if (!emailRegex.test(newEmail)) {
    return false;
  }

  return true;
}

export const Login: React.FC = (props) => {
  const { supabase } = useOutletContext<LoginProps>();

  const [username, setUsername] = React.useState("");
  const [pwd, setPwd] = React.useState("");
  const [otp, setOtp] = React.useState("");
  const [validEmail, setValidEmail] = React.useState(false);

  const [otpLock, setOtpLock] = React.useState(0);
  const [otpLockDisable, setOtpLockDisable] = React.useState(false);
  const [useOTP, setUseOTP] = React.useState(false);
  const [otpSent, setOtpSent] = React.useState(false);

  const [error, setError] = React.useState<string | null>(null);

  // Uses access code in URL which I don't like
  // const handleReset = React.useCallback(async () => {
  //   const { current: uname } = usernameRef;
  //   if (!uname) {
  //     return;
  //   }
  //
  //   if (!uname.value || uname.value.length < 4) {
  //     return;
  //   }
  //
  //   await supabase.userPasswordReset(uname.value);
  // }, []);

  React.useEffect(() => {
    const time = Date.now();
    if (otpLock >= time) {
      setOtpLockDisable(true);

      const l = setTimeout(() => {
        setOtpLockDisable(false);
      }, otpLock - time);
      return () => clearTimeout(l);
    }

    setOtpLockDisable(false);
  }, [otpLock]);

  const handleSendOTP = React.useCallback(async () => {
    if (!validEmail) {
      return;
    }

    const time = Date.now();
    if (otpLock >= time) {
      return;
    }

    setOtpLock(time + 60 * 1000); // Lock for 60 seconds

    await supabase.userSendOTP(username);
    setOtpSent(() => true);
  }, [otpLock, username, validEmail]);

  const toggleOTP = React.useCallback(() => {
    setError(() => null);
    setUseOTP((prev) => !prev);
  }, [useOTP]);

  const handleOtpLogin = React.useCallback(async () => {
    if (!validEmail) {
      return;
    }

    if (!otp || !otp || otp.length < 6) {
      return;
    }

    await supabase.userSignInOtp(username, otp);
  }, [validEmail, username, otp]);

  const handleLogin = React.useCallback(async () => {
    if (!validEmail) {
      return;
    }

    if (!pwd || pwd.length < 6) {
      return;
    }

    setError(() => null);

    try {
      await supabase.userSignIn(username, pwd);
    } catch (e) {
      if (e instanceof AuthApiError) {
        setError(() => e.message);
      }
    }
  }, [username, validEmail, pwd, setError]);

  const handleUsernameChange = React.useCallback(
    (ev: React.ChangeEvent<HTMLInputElement>) => {
      setUsername(ev.target.value);
    },
    []
  );

  React.useEffect(() => {
    setValidEmail(() => validateEmail(username));
  }, [username]);

  return (
    <S.ContainerEl>
      <S.LoginEl>
        <SubHeading text="Login" />
        <S.InputContainer>
          <S.LoginMethodContainer>
            <S.LoginMethod
              onClick={toggleOTP}
              color={
                useOTP ? DefaultColors.BrightCyan : DefaultColors.BrightOrange
              }
            >
              {useOTP ? "Login with OTP" : "Login with Password"}
            </S.LoginMethod>
            {useOTP && (
              <Button
                onClick={handleSendOTP}
                disabled={otpLockDisable || !validEmail}
              >
                Send OTP
              </Button>
            )}
          </S.LoginMethodContainer>
        </S.InputContainer>
        <S.InputContainer>
          <Label>Email</Label>
          <EmailInput
            icon={faUser}
            type="email"
            autoComplete={"email"}
            name="supabase-username"
            aria-label="supabase-username"
            value={username}
            onChange={handleUsernameChange}
          />
        </S.InputContainer>
        <S.InputContainer hide={useOTP}>
          <Label>Password</Label>
          <PasswordInput
            icon={faAsterisk}
            key={"password"}
            autoComplete={"current-password"}
            name="supabase-password"
            aria-label="supabase-password"
            value={pwd}
            onChange={(ev) => setPwd(ev.target.value)}
          />
        </S.InputContainer>

        <S.InputContainer hide={!useOTP}>
          <Label>OTP</Label>
          <PasswordInput
            icon={faHashtag}
            disabled={useOTP && !otpSent}
            key={"otp"}
            autoComplete={"off"}
            name="supabase-otp"
            aria-label="supabase-otp"
            value={otp}
            onChange={(ev) => setOtp(ev.target.value)}
          />
        </S.InputContainer>
        {!!error && <S.ErrorText>{error}</S.ErrorText>}
        <ButtonContainer>
          <Button
            onClick={useOTP ? handleOtpLogin : handleLogin}
            disabled={
              !validEmail ||
              !((useOTP && otp?.length === 6) || (!useOTP && pwd?.length > 6))
            }
          >
            Login
          </Button>
        </ButtonContainer>
      </S.LoginEl>
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

  export const LoginEl = styled(Tile)`
    width: 80vw;
    display: flex;
    gap: 15px;
    flex-direction: column;
  `;

  export const InputContainer = styled("div")<{ hide?: boolean }>`
    display: ${(p) => (p.hide ? "none" : "flex")};
    flex-direction: column;
    gap: 5px;
    width: 100%;
  `;

  export const LoginMethodContainer = styled(ButtonContainer)`
    justify-content: flex-start;
    flex-wrap: wrap;
  `;

  export const ErrorText = styled("div")`
    color: ${DefaultColors.BrightRed};
  `;

  export const LoginMethod = styled(Button)``;
}
