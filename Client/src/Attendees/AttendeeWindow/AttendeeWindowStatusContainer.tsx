import styled from "@emotion/styled";
import {
  faBusSimple,
  faCar,
  faHandPointUp,
  faQrcode,
} from "@fortawesome/free-solid-svg-icons";
import React, { Fragment } from "react";
import { Icon } from "../../Components/Icon";
import { SupaBase } from "../../SupaBase/SupaBase";
import { RollCallMethod } from "../../SupaBase/types";
import { Username } from "../../SupaBase/Username";
import { DefaultColors, epochToDate } from "../../Tools/Toolbox";
import { Attendee, AttendeeStatus } from "../Attendee";

export interface AttendeeWindowStatusContainerProps {
  attendee: Attendee;
  supabase: SupaBase;
  statusCol?: string;
  status?: AttendeeStatus;
}

export const AttendeeWindowStatusContainer: React.FC<
  AttendeeWindowStatusContainerProps
> = (props: AttendeeWindowStatusContainerProps) => {
  const { attendee, statusCol, status, supabase } = props;

  let allergies: string[] = attendee.allergies;
  if (allergies.length == 0) {
    allergies = ["None"];
  }

  let emergencyContacts: string[] = attendee.emergencyContacts;
  if (emergencyContacts.length == 0) {
    emergencyContacts = ["None"];
  }

  return (
    <S.StatusMetaContainer>
      <S.StyledTable>
        <tbody>
          <tr>
            <td>Is:</td>
            <S.StyledCell color={statusCol}>{status}</S.StyledCell>
          </tr>
          {!!attendee.currentRollCall &&
            status !== AttendeeStatus.NOT_SCANNED && (
              <tr>
                <td>{"By:"}</td>
                <td>
                  <S.TextIconContainer>
                    <Icon
                      color={DefaultColors.BrightCyan}
                      icon={
                        attendee.currentRollCall.created_method ===
                        RollCallMethod.MANUAL
                          ? faHandPointUp
                          : faQrcode
                      }
                      size={14}
                    />
                    <Username
                      id={attendee.currentRollCall.created_by}
                      supabase={supabase}
                    />
                  </S.TextIconContainer>
                </td>
              </tr>
            )}
          {!!attendee.currentRollCall &&
            status !== AttendeeStatus.NOT_SCANNED && (
              <tr>
                <td>On:</td>
                <td>
                  {epochToDate(
                    new Date(attendee.currentRollCall.created_at).getTime(),
                    {
                      includeTime: true,
                      includeSeconds: true,
                    }
                  )}
                </td>
              </tr>
            )}
          <tr>
            <td>
              <S.CellHeading>{"Allergy:"}</S.CellHeading>
            </td>
            <S.StyledCell>{allergies.join(", ")}</S.StyledCell>
          </tr>
          <tr>
            <td>
              <S.CellHeading>{"ICE:"}</S.CellHeading>
            </td>
            <S.StyledCell>
              {emergencyContacts.map((c, idx) => (
                // TODO: Ugly, fix this
                <Fragment key={c}>
                  {idx > 0 && <span key={idx}>{", "}</span>}
                  <PhoneNumber number={c} key={c} />
                </Fragment>
              ))}
            </S.StyledCell>
          </tr>
          <tr>
            <td>{"Travel:"}</td>
            <S.StyledCell
              color={
                attendee.isUsingOwnTransport
                  ? DefaultColors.BrightPurple
                  : DefaultColors.BrightOrange
              }
            >
              <S.TextIconContainer>
                <Icon
                  color={
                    attendee.isUsingOwnTransport
                      ? DefaultColors.BrightPurple
                      : DefaultColors.BrightOrange
                  }
                  icon={attendee.isUsingOwnTransport ? faCar : faBusSimple}
                  size={14}
                />
                {attendee.isUsingOwnTransport ? "Car" : "Bus"}
              </S.TextIconContainer>
            </S.StyledCell>
          </tr>
        </tbody>
      </S.StyledTable>
    </S.StatusMetaContainer>
  );
};

const PhoneNumber: React.FC<{ number: string }> = ({ number }) => {
  if (number == "None") {
    return <span>{number}</span>;
  }

  return (
    <S.PhoneNumber href={`tel:${number.trim().replaceAll(/[() ]/g, "")}`}>
      {number}
    </S.PhoneNumber>
  );
};

namespace S {
  export const StatusMetaContainer = styled.div`
    box-sizing: border-box;
    padding: 0 20px;
  `;

  export const StyledTable = styled.table``;

  export const StyledCell = styled.td<{ color?: string }>`
    max-width: 200px;
    color: ${(p) => p.color};
  `;

  export const CellHeading = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  `;

  export const TextIconContainer = styled.div`
    display: flex;
    gap: 5px;
    align-items: center;
  `;

  export const PhoneNumber = styled.a`
    color: ${DefaultColors.BrightCyan};
  `;
}
