import styled from "@emotion/styled";
import { faSave, faXmarkCircle } from "@fortawesome/free-solid-svg-icons";
import React, { useCallback, useMemo, useState } from "react";
import { Button, ButtonContainer } from "../../Components/Button/Button";
import { Input } from "../../Components/Inputs/BaseInput";
import { SupaBase } from "../../SupaBase/SupaBase";
import { UpdateAttendees } from "../../SupaBase/types";
import { DefaultColors } from "../../Tools/Toolbox";
import { Attendee } from "../Attendee";

export interface AttendeeEditContainerProps {
  attendee: Attendee;
  supabase: SupaBase;
  exitEdit: () => void;
}

export const AttendeeEditContainer: React.FC<AttendeeEditContainerProps> = (
  props: AttendeeEditContainerProps,
) => {
  const { attendee, exitEdit, supabase } = props;

  const [name, setName] = useState(attendee.name);
  const [surname, setSurname] = useState(attendee.surname);
  const [allergies, setAllergies] = useState(attendee.allergies.join(", "));
  const [emergencyContacts, setEmergencyContacts] = useState(
    attendee.emergencyContacts.join(", "),
  );

  const onChangeName = useCallback(
    (ev: React.ChangeEvent<HTMLInputElement>) => {
      setName(ev.target.value);
    },
    [],
  );

  const onChangeSurname = useCallback(
    (ev: React.ChangeEvent<HTMLInputElement>) => {
      setSurname(ev.target.value);
    },
    [],
  );

  const onChangeAllergies = useCallback(
    (ev: React.ChangeEvent<HTMLInputElement>) => {
      setAllergies(ev.target.value);
    },
    [],
  );

  const onChangeEmergencyContacts = useCallback(
    (ev: React.ChangeEvent<HTMLInputElement>) => {
      setEmergencyContacts(ev.target.value);
    },
    [],
  );

  const trimmedName = useMemo(() => name.trim(), [name]);
  const trimmedSurname = useMemo(() => surname.trim(), [surname]);

  const hasValidationError = useMemo(() => {
    return trimmedName.length === 0 || trimmedSurname.length === 0;
  }, [trimmedName, trimmedSurname]);

  const hasChanges = useMemo(() => {
    const allergiesArr = allergies
      .split(",")
      .map((a) => a.trim())
      .filter((a) => a.length > 0);
    const emergencyContactsArr = emergencyContacts
      .split(",")
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    if (trimmedName !== attendee.name) {
      return true;
    }
    if (trimmedSurname !== attendee.surname) {
      return true;
    }
    if (allergiesArr.join(",") !== attendee.allergies.join(",")) {
      return true;
    }
    if (
      emergencyContactsArr.join(",") !== attendee.emergencyContacts.join(",")
    ) {
      return true;
    }
    return false;
  }, [attendee, allergies, emergencyContacts, trimmedName, trimmedSurname]);

  const handleSave = useCallback(() => {
    const allergiesArr = allergies
      .split(",")
      .map((a) => a.trim())
      .filter((a) => a.length > 0);
    const emergencyContactsArr = emergencyContacts
      .split(",")
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    if (trimmedName.length === 0 || trimmedSurname.length === 0) {
      return;
    }

    const changedData: UpdateAttendees = {};
    if (trimmedName !== attendee.name) {
      changedData.name = trimmedName;
    }
    if (trimmedSurname !== attendee.surname) {
      changedData.surname = trimmedSurname;
    }
    if (allergiesArr.join(",") !== attendee.allergies.join(",")) {
      changedData.allergies = allergiesArr.join(", ");
    }
    if (
      emergencyContactsArr.join(",") !== attendee.emergencyContacts.join(",")
    ) {
      changedData.emergency_contact = emergencyContactsArr.join(", ");
    }

    if (Object.keys(changedData).length === 0) {
      exitEdit();
      return;
    }

    supabase.updateAttendee(attendee, changedData).then((didSave) => {
      if (didSave) {
        exitEdit();
      }
    });
  }, [
    attendee,
    allergies,
    emergencyContacts,
    trimmedName,
    trimmedSurname,
    supabase,
    exitEdit,
  ]);

  return (
    <>
      <S.EditContainer>
        <S.LabelInputCombo>
          <S.Label>Name</S.Label>
          <S.EditInput
            hasError={trimmedName.length === 0}
            onChange={onChangeName}
            value={name}
            placeholder={"Enter Name"}
          />
        </S.LabelInputCombo>
        <S.LabelInputCombo>
          <S.Label>Surname</S.Label>
          <S.EditInput
            hasError={trimmedSurname.length === 0}
            onChange={onChangeSurname}
            value={surname}
            placeholder={"Enter Surname"}
          />
        </S.LabelInputCombo>
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
      </S.EditContainer>
      <ButtonContainer>
        <Button
          onClick={exitEdit}
          icon={faXmarkCircle}
          color={DefaultColors.BrightRed}
        />
        <Button
          disabled={!hasChanges || hasValidationError}
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
