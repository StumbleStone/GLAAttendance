import styled from "@emotion/styled";
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

export const Login: React.FC = (props) => {
  const { supabase } = useOutletContext<LoginProps>();

  const [username, setUsername] = React.useState("");
  const [pwd, setPwd] = React.useState("");
  const [otp, setOtp] = React.useState("");

  const [otpLock, setOtpLock] = React.useState(0);
  const [otpLockDisable, setOtpLockDisable] = React.useState(false);
  const [useOTP, setUseOTP] = React.useState(false);

  const usernameRef = React.useRef<HTMLInputElement>(null);
  const passwordRef = React.useRef<HTMLInputElement>(null);
  const otpRef = React.useRef<HTMLInputElement>(null);

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
    const { current: uname } = usernameRef;
    if (!uname || !uname.value || uname.value.length < 4) {
      return;
    }

    const time = Date.now();
    if (otpLock >= time) {
      return;
    }

    setOtpLock(time + 60 * 1000); // Lock for 60 seconds

    await supabase.userSendOTP(uname.value);
  }, [otpLock]);

  const toggleOTP = React.useCallback(() => {
    setUseOTP((prev) => !prev);
  }, [useOTP]);

  const handleOtpLogin = React.useCallback(async () => {
    const { current: uname } = usernameRef;
    const { current: otp } = otpRef;

    if (!uname || !uname.value || uname.value.length < 4) {
      return;
    }

    if (!otp || !otp.value || otp.value.length < 6) {
      return;
    }

    await supabase.userSignInOtp(uname.value, otp.value);
  }, []);

  const handleLogin = React.useCallback(async () => {
    const { current: uname } = usernameRef;
    const { current: pass } = passwordRef;

    if (!uname || !uname.value || uname.value.length < 4) {
      return;
    }

    if (!pass || !pass.value || pass.value.length < 6) {
      return;
    }

    await supabase.userSignIn(uname.value, pass.value);
  }, []);

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
          </S.LoginMethodContainer>
        </S.InputContainer>
        <S.InputContainer>
          <Label>Email</Label>
          <EmailInput
            forwardRef={usernameRef}
            type="email"
            autoComplete={"email"}
            name="supabase-username"
            aria-label="supabase-username"
            value={username}
            onChange={(ev) => setUsername(ev.target.value)}
          />
        </S.InputContainer>
        <S.InputContainer hide={useOTP}>
          <Label>Password</Label>
          <PasswordInput
            key={"password"}
            forwardRef={passwordRef}
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
            key={"otp"}
            autoComplete={"off"}
            forwardRef={otpRef}
            name="supabase-otp"
            aria-label="supabase-otp"
            value={otp}
            onChange={(ev) => setOtp(ev.target.value)}
          />
        </S.InputContainer>

        <ButtonContainer>
          {/*<Button onClick={handleReset}>Reset Password</Button>*/}
          {useOTP && (
            <Button onClick={handleSendOTP} disabled={otpLockDisable}>
              Send OTP
            </Button>
          )}
          {!useOTP && <Button onClick={handleLogin}>Login</Button>}
          {useOTP && <Button onClick={handleOtpLogin}>Login</Button>}
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
    flex-direction: column;
  `;

  export const InputContainer = styled("div")<{ hide?: boolean }>`
    display: ${(p) => (p.hide ? "none" : "flex")};
    flex-direction: column;
    gap: 15px;
    margin-bottom: 25px;
    width: 100%;
  `;

  export const LoginMethodContainer = styled("div")`
    display: flex;
    flex-direction: row;
  `;

  export const LoginMethod = styled(Button)`
    border-radius: 10px;
  `;
}
