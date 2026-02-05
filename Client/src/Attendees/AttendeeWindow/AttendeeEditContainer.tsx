import styled from "@emotion/styled";
import {
  faBusSimple,
  faCar,
  faEdit,
  faSave,
} from "@fortawesome/free-solid-svg-icons";
import React, { useCallback, useMemo, useState } from "react";
import { Button } from "../../Components/Button/Button";
import { Icon } from "../../Components/Icon";
import { Input } from "../../Components/Inputs/BaseInput";
import { SupaBase } from "../../SupaBase/SupaBase";
import { UpdateAttendees } from "../../SupaBase/types";
import { DefaultColors } from "../../Tools/Toolbox";
import { Attendee } from "../Attendee";
import { ButtonContainer } from "./shared";

export interface AttendeeEditContainerProps {
  attendee: Attendee;
  supabase: SupaBase;
  exitEdit: () => void;
}

export const AttendeeEditContainer: React.FC<AttendeeEditContainerProps> = (
  props: AttendeeEditContainerProps
) => {
  const { attendee, exitEdit, supabase } = props;

  // const [name, setName] = useState(attendee.name);
  // const [surname, setSurname] = useState(attendee.surname);
  const [allergies, setAllergies] = useState(attendee.allergies.join(", "));
  const [emergencyContacts, setEmergencyContacts] = useState(
    attendee.emergencyContacts.join(", ")
  );
  const [usingCar, setUsingCar] = useState(attendee.isUsingOwnTransport);

  const toggleTravel = useCallback(() => {
    setUsingCar((prev) => !prev);
  }, []);

  // const onChangeName = useCallback(
  //   (ev: React.ChangeEvent<HTMLInputElement>) => {
  //     setName(ev.target.value);
  //   },
  //   []
  // );
  //
  // const onChangeSurname = useCallback(
  //   (ev: React.ChangeEvent<HTMLInputElement>) => {
  //     setSurname(ev.target.value);
  //   },
  //   []
  // );

  const onChangeAllergies = useCallback(
    (ev: React.ChangeEvent<HTMLInputElement>) => {
      setAllergies(ev.target.value);
    },
    []
  );

  const onChangeEmergencyContacts = useCallback(
    (ev: React.ChangeEvent<HTMLInputElement>) => {
      setEmergencyContacts(ev.target.value);
    },
    []
  );

  const hasChanges = useMemo(() => {
    const allergiesArr = allergies
      .split(",")
      .map((a) => a.trim())
      .filter((a) => a.length > 0);
    const emergencyContactsArr = emergencyContacts
      .split(",")
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    // if (name !== attendee.name) {
    //   return true;
    // }
    // if (surname !== attendee.surname) {
    //   return true;
    // }
    if (allergiesArr.join(",") !== attendee.allergies.join(",")) {
      return true;
    }
    if (
      emergencyContactsArr.join(",") !== attendee.emergencyContacts.join(",")
    ) {
      return true;
    }
    if (!!usingCar !== attendee.isUsingOwnTransport) {
      return true;
    }
  }, [attendee, /* name, surname, */ allergies, emergencyContacts, usingCar]);

  const handleSave = useCallback(() => {
    const allergiesArr = allergies
      .split(",")
      .map((a) => a.trim())
      .filter((a) => a.length > 0);
    const emergencyContactsArr = emergencyContacts
      .split(",")
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    const changedData: UpdateAttendees = {};
    // if (name !== attendee.name) {
    //   changedData.name = name;
    // }
    // if (surname !== attendee.surname) {
    //   changedData.surname = surname;
    // }
    if (allergiesArr.join(",") !== attendee.allergies.join(",")) {
      changedData.allergies = allergiesArr.join(", ");
    }
    if (
      emergencyContactsArr.join(",") !== attendee.emergencyContacts.join(",")
    ) {
      changedData.emergency_contact = emergencyContactsArr.join(", ");
    }
    if (!!usingCar !== attendee.isUsingOwnTransport) {
      changedData.own_transport = !!usingCar;
    }

    if (Object.keys(changedData).length === 0) {
      exitEdit();
      return;
    }

    supabase.updateAttendee(attendee, changedData).then(() => {
      exitEdit();
    });
  }, [
    attendee,
    // name,
    // surname,
    allergies,
    emergencyContacts,
    usingCar,
    supabase,
  ]);

  return (
    <>
      <S.EditContainer>
        {/*<S.LabelInputCombo>*/}
        {/*  <S.Label>Name</S.Label>*/}
        {/*  <S.EditInput*/}
        {/*    onChange={onChangeName}*/}
        {/*    value={name}*/}
        {/*    placeholder={"Enter Name"}*/}
        {/*  />*/}
        {/*</S.LabelInputCombo>*/}
        {/*<S.LabelInputCombo>*/}
        {/*  <S.Label>Surname</S.Label>*/}
        {/*  <S.EditInput*/}
        {/*    onChange={onChangeSurname}*/}
        {/*    value={surname}*/}
        {/*    placeholder={"Enter Surname"}*/}
        {/*  />*/}
        {/*</S.LabelInputCombo>*/}
        <S.LabelInputCombo>
          <S.Label>Allergies</S.Label>
          <S.EditInput
            onChange={onChangeAllergies}
            value={allergies}
            placeholder={"Enter Allergies"}
          />
        </S.LabelInputCombo>
        <S.LabelInputCombo>
          <S.Label>ICE</S.Label>
          <S.SideBySide>
            <S.EditInput
              onChange={onChangeEmergencyContacts}
              value={emergencyContacts}
              placeholder={"Enter Number(s)"}
            />
          </S.SideBySide>
        </S.LabelInputCombo>
        <S.SideBySide onClick={toggleTravel}>
          <S.Label>Travel</S.Label>
          <S.SideBySide>
            <Icon
              icon={faCar}
              size={24}
              color={
                usingCar ? DefaultColors.BrightPurple : DefaultColors.BrightGrey
              }
            />
            <span>{"/"}</span>
            <Icon
              icon={faBusSimple}
              size={24}
              color={
                !usingCar
                  ? DefaultColors.BrightOrange
                  : DefaultColors.BrightGrey
              }
            />
          </S.SideBySide>
        </S.SideBySide>
      </S.EditContainer>
      <ButtonContainer>
        <Button
          onClick={exitEdit}
          icon={faEdit}
          color={DefaultColors.BrightRed}
        />
        <Button
          disabled={!hasChanges}
          onClick={handleSave}
          icon={faSave}
          color={DefaultColors.BrightGreen}
        />
      </ButtonContainer>
    </>
  );
};

namespace S {
  export const EditContainer = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: stretch;
    width: 100%;
    padding: 20px;
    box-sizing: border-box;
  `;

  export const LabelInputCombo = styled.div`
    display: flex;
    flex-direction: column;
  `;

  export const SideBySide = styled.div`
    display: flex;
    gap: 10px;
  `;

  export const EditInput = styled(Input)`
    padding: 3px 10px;
  `;

  export const Label = styled.div`
    font-size: 14px;
    text-align: left;
  `;
}
