import { useTheme } from "@emotion/react";
import styled from "@emotion/styled";
import { faCancel, faPlusCircle } from "@fortawesome/free-solid-svg-icons";
import * as React from "react";
import { useOutletContext } from "react-router-dom";
import { Button, ButtonContainer } from "../Components/Button/Button";
import { Heading } from "../Components/Heading";
import { LabelDateInput } from "../Components/Inputs/label/LabelDateInput";
import { LabelTextInput } from "../Components/Inputs/label/LabelTextInput";
import { Tile } from "../Components/Tile";
import { SupaBase } from "../SupaBase/SupaBase";

export interface EventsProps {
  supabase: SupaBase;
}

export const Events: React.FC = () => {
  useOutletContext<EventsProps>();

  return (
    <S.Container>
      <S.Panel>
        <Heading>Events</Heading>
        <EventCreationPanel />
        <S.ActiveViewTile>
          <S.ActiveViewTitle>{"Label"}</S.ActiveViewTitle>
          <S.ActiveViewDescription>{"Description"}</S.ActiveViewDescription>
        </S.ActiveViewTile>
      </S.Panel>
    </S.Container>
  );
};

function validateName(name: string): boolean {
  if (!name) {
    return false;
  }

  return name.length >= 3;
}

function validateTime(time: string): boolean {
  if (!time) {
    return false;
  }

  try {
    if (isNaN(Date.parse(time))) {
      return false;
    }
  } catch (e) {
    return false;
  }

  return true;
}

function parseTime(time: string | null): number | null {
  if (!validateTime(time)) {
    return null;
  }

  const parsedTime = Date.parse(time);
  if (isNaN(parsedTime)) {
    return null;
  }

  return parsedTime;
}

function getTimeValidationError(
  startTime: string | null,
  endTime: string | null,
): string | null {
  if (!startTime) {
    return "Start time is required.";
  }

  if (!validateTime(startTime)) {
    return "Start time is invalid.";
  }

  if (!endTime) {
    return "End time is required.";
  }

  if (!validateTime(endTime)) {
    return "End time is invalid.";
  }

  const parsedStartTime = parseTime(startTime);
  const parsedEndTime = parseTime(endTime);
  if (parsedStartTime === null || parsedEndTime === null) {
    return "Start and end times must be valid.";
  }

  if (parsedEndTime <= parsedStartTime) {
    return "End time must be after start time.";
  }

  return null;
}

export interface EventCreationPanelProps {}

export const EventCreationPanel: React.FC<EventCreationPanelProps> = (
  props: EventCreationPanelProps,
) => {
  const {} = props;

  const [isCreating, setIsCreating] = React.useState<boolean>(true);
  const handleCreateNewClick = React.useCallback(() => {
    setIsCreating(() => true);
  }, []);
  const handleCancelClick = React.useCallback(() => {
    setIsCreating(() => false);
  }, []);

  const theme = useTheme();

  const [name, setName] = React.useState("");
  const onChangeName = React.useCallback(
    (ev: React.ChangeEvent<HTMLInputElement>) => {
      setName(() => ev.target.value);
    },
    [],
  );

  const [startTime, setStartTime] = React.useState<string>("");
  const onChangeStartTime = React.useCallback(
    (ev: React.ChangeEvent<HTMLInputElement>) => {
      setStartTime(() => ev.target.value);
    },
    [],
  );

  const [endTime, setEndTime] = React.useState<string>("");
  const onChangeEndTime = React.useCallback(
    (ev: React.ChangeEvent<HTMLInputElement>) => {
      setEndTime(() => ev.target.value);
    },
    [],
  );

  const timeValidationError = React.useMemo<string | null>(() => {
    return getTimeValidationError(startTime, endTime);
  }, [startTime, endTime]);

  const validEvent = React.useMemo<boolean>(() => {
    if (!validateName(name)) {
      return false;
    }

    if (!!timeValidationError) {
      return false;
    }

    return true;
  }, [name, timeValidationError]);

  const handleCreateClick = React.useCallback(() => {
    if (!validEvent) {
      return;
    }

    debugger;
  }, [validEvent]);

  const showTimeValidationError = React.useMemo<boolean>(() => {
    if (!timeValidationError) {
      return false;
    }

    return !!startTime || !!endTime;
  }, [startTime, endTime, timeValidationError]);

  if (!isCreating) {
    return (
      <S.StyledButtonContainer buttonPosition={"left"}>
        <Button
          label={"Create New Event"}
          icon={faPlusCircle}
          onClick={handleCreateNewClick}
        />
      </S.StyledButtonContainer>
    );
  }

  return (
    <S.ActiveViewTile>
      <S.SideBySide>
        <S.ActiveViewTitle>{"New Event"}</S.ActiveViewTitle>
        <S.StyledButtonContainer buttonPosition={"right"}>
          <Button
            label={"Cancel"}
            icon={faCancel}
            color={theme.colors.accent.danger}
            onClick={handleCancelClick}
          />
        </S.StyledButtonContainer>
      </S.SideBySide>
      <LabelTextInput
        label={"Event Name"}
        value={name}
        onChange={onChangeName}
      />
      <S.SideBySide>
        <S.StyledDateInput
          label={"Start Time"}
          value={startTime}
          type={"datetime-local"}
          required={true}
          max={endTime || undefined}
          onChange={onChangeStartTime}
        />
        <S.StyledDateInput
          label={"End Time"}
          value={endTime}
          type={"datetime-local"}
          required={true}
          min={startTime || undefined}
          onChange={onChangeEndTime}
        />
      </S.SideBySide>
      {showTimeValidationError && (
        <S.ValidationText>{timeValidationError}</S.ValidationText>
      )}
      <S.StyledButtonContainer buttonPosition={"left"}>
        <Button
          color={theme.colors.accent.success}
          disabled={!validEvent}
          label={"Create Event"}
          icon={faPlusCircle}
          onClick={handleCreateClick}
        />
      </S.StyledButtonContainer>
    </S.ActiveViewTile>
  );
};

namespace S {
  export const Container = styled.div`
    label: EventsContainer;
    padding: 0 20px 20px;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    margin-top: 15px;
    gap: 10px;

    @media (min-width: 700px) {
      padding-left: 10vw;
      padding-right: 10vw;
    }
  `;

  export const StyledButtonContainer = styled(ButtonContainer)<{
    buttonPosition: "left" | "right";
  }>`
    justify-content: ${(p) =>
      p.buttonPosition === "right" ? "flex-end" : "flex-start"};
  `;

  export const Panel = styled(Tile)`
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 14px;
  `;

  export const ActiveViewTile = styled(Tile)`
    display: flex;
    flex-direction: column;
    gap: 6px;
    background-color: ${(p) => p.theme.colors.surfaceRaised};
  `;

  export const ActiveViewTitle = styled.div`
    font-size: 16px;
    color: ${(p) => p.theme.colors.text};
    white-space: nowrap;
    font-weight: 700;
  `;

  export const ActiveViewDescription = styled.div`
    font-size: 14px;
    color: ${(p) => p.theme.colors.textMuted};
  `;

  export const SideBySide = styled.div`
    display: flex;
    gap: 5px;
  `;

  export const StyledDateInput = styled(LabelDateInput)`
    flex: 1;
  `;

  export const ValidationText = styled.div`
    color: ${(p) => p.theme.colors.accent.danger};
    font-size: 14px;
  `;
}
