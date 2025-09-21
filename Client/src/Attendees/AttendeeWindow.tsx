import { keyframes } from "@emotion/react";
import styled from "@emotion/styled";
import {
  faCheckCircle,
  faCheckSquare,
  faMinusSquare,
  faTrash,
  faXmarkCircle,
  faXmarkSquare,
} from "@fortawesome/free-solid-svg-icons";
import React, { useCallback, useEffect, useReducer, useState } from "react";
import { Backdrop } from "../Components/Backdrop/Backdrop";
import { Button } from "../Components/Button/Button";
import { DownloadButton } from "../Components/Button/DownloadButton";
import { ShareButton } from "../Components/Button/ShareButton";
import { Icon } from "../Components/Icon";
import { LayerHandler, LayerItem } from "../Components/Layer";
import {
  PopupConfirm,
  PopupConfirmButton,
} from "../Components/Popup/PopupConfirm";
import { Span } from "../Components/Span";
import { Tile } from "../Components/Tile";
import { QRCode } from "../QRCode/QRCode";
import { SupaBase, SupaBaseEventKey } from "../SupaBase/SupaBase";
import { RollCallMethod, RollCallStatus } from "../SupaBase/types";
import { Username } from "../SupaBase/Username";
import { DefaultColors, epochToDate } from "../Tools/Toolbox";
import { Attendee, AttendeeStatus } from "./Attendee";

export interface AtendeeWindowProps {
  layerItem: LayerItem;
  attendee: Attendee;
  supabase: SupaBase;
}

const ICON_SIZE = 16;

export const AttendeeWindow: React.FC<AtendeeWindowProps> = (
  props: AtendeeWindowProps
) => {
  const { layerItem, attendee, supabase } = props;
  const [, forceUpdate] = useReducer((x) => x + 1, 0);
  const [showAnim, setShowAnim] = useState(false);

  const bdClick = useCallback(() => {
    layerItem.close();
  }, [layerItem]);

  useEffect(() => {
    attendee.generateQRCode();
    return attendee.addListener({
      updated: forceUpdate,
      statusUpdated: () => {
        setShowAnim(() => true);
      },
      qrReady: forceUpdate,
    });
  }, []);

  useEffect(() => {
    return supabase.addListener({
      [SupaBaseEventKey.UPDATED_ROLLCALL_EVENT]: () => {},
    });
  }, []);

  const handleDelete = useCallback(() => {
    LayerHandler.AddLayer((layerItem: LayerItem) => {
      const buttons: PopupConfirmButton[] = [
        {
          label: "No",
          onClick: () => layerItem.close(),
          color: DefaultColors.BrightRed,
        },
        {
          label: "Yes",
          onClick: () => {
            supabase.deleteAttendee(attendee).then(() => {
              layerItem.close();
            });
          },
          color: DefaultColors.BrightGreen,
        },
      ];

      return (
        <PopupConfirm
          layerItem={layerItem}
          text={
            <>
              <Span>{`Are you sure you wish to delete `}</Span>
              <Span
                color={DefaultColors.BrightCyan}
              >{`${attendee.name} ${attendee.surname}`}</Span>
              <Span>{`?`}</Span>
            </>
          }
          buttons={buttons}
        />
      );
    });
  }, []);

  const status: AttendeeStatus = attendee.status(supabase.currentRollCallEvent);
  const statusCol =
    status === AttendeeStatus.PRESENT
      ? DefaultColors.BrightGreen
      : status === AttendeeStatus.ABSENT
      ? DefaultColors.BrightRed
      : DefaultColors.BrightGrey;
  const rollCallInProgress = supabase.rollcallInProgress;

  const handlePresent = useCallback(() => {
    supabase.createNewRollCall(attendee, RollCallMethod.MANUAL);
  }, [status]);

  const handleAbsent = useCallback(() => {
    supabase.createNewRollCall(
      attendee,
      RollCallMethod.MANUAL,
      RollCallStatus.ABSENT
    );
  }, [status]);

  return (
    <S.StyledBackdrop onClose={bdClick}>
      <S.AttendeeWindowEl>
        <S.Heading>
          <S.Name>
            {`${attendee.name} ${attendee.surname}`}
            <S.IconContainer>
              <S.AnimIcon
                showAnim={showAnim}
                key={status}
                icon={
                  status === AttendeeStatus.PRESENT
                    ? faCheckSquare
                    : status === AttendeeStatus.ABSENT
                    ? faXmarkSquare
                    : faMinusSquare
                }
                size={ICON_SIZE}
                color={statusCol}
              />
            </S.IconContainer>
          </S.Name>

          <S.StatusMetaContainer>
            <S.StyledTable>
              <tbody>
                <tr>
                  <td>Is:</td>
                  <S.StyledCell color={statusCol}>{status}</S.StyledCell>
                </tr>
                {!!attendee.currentRollCall && (
                  <tr>
                    <td>By:</td>
                    <td>
                      <Username
                        id={attendee.currentRollCall.created_by}
                        supabase={supabase}
                      />
                    </td>
                  </tr>
                )}
                {!!attendee.currentRollCall && (
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
              </tbody>
            </S.StyledTable>
          </S.StatusMetaContainer>
        </S.Heading>
        <S.QRCodeContainer>
          <QRCode qrCodeUrl={attendee.QRCodeURL} />
        </S.QRCodeContainer>
        <S.ButtonContainer>
          <Button
            onClick={handleDelete}
            icon={faTrash}
            color={DefaultColors.BrightPurple}
          />
          <DownloadButton
            data={attendee.QRCodeURL}
            filename={`${attendee.fullNameFileSafe}.png`}
          />
          <ShareButton
            data={attendee.QRCodeURL}
            title={"Share Attendance QR"}
            text={"Attendance QR code for ${attendee.fullName}"}
            filename={`${attendee.fullNameFileSafe}.png`}
          />
          <Button
            onClick={handleAbsent}
            icon={faXmarkCircle}
            disabled={!rollCallInProgress || status === AttendeeStatus.ABSENT}
            color={DefaultColors.BrightRed}
          />
          <Button
            onClick={handlePresent}
            icon={faCheckCircle}
            disabled={!rollCallInProgress || status === AttendeeStatus.PRESENT}
            color={DefaultColors.BrightGreen}
          />
        </S.ButtonContainer>
      </S.AttendeeWindowEl>
    </S.StyledBackdrop>
  );
};

namespace S {
  export const AttendeeWindowEl = styled(Tile)`
    /* max-width: min(300px, 80vw); */
    //max-height: min(300px, 80vh);
    min-width: min(300px, 80vw);
    min-height: min(300px, 80vh);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    justify-content: center;
    align-items: stretch;
    padding: 0;
  `;

  export const Heading = styled.div`
    width: 100%;
    box-sizing: border-box;
    text-align: center;
    padding: 10px 0 5px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: stretch;
  `;

  export const Name = styled.div`
    font-size: 22px;
    user-select: none;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 5px;
    padding: 0 20px;
  `;

  export const IconContainer = styled.div``;

  const animPulse = keyframes`
    0% {
      scale: 1;
    }
    50% {
      scale: 1.5;
    }
    100% {
      scale: 1;
    }
  `;

  export const AnimIcon = styled(Icon)<{ showAnim: boolean }>`
    animation: ${animPulse};
    animation-duration: ${(p) => (p.showAnim ? "0.5s" : "0s")};
  `;

  export const StyledBackdrop = styled(Backdrop)`
    display: flex;
    align-items: center;
    justify-content: center;
  `;

  export const ButtonContainer = styled.div`
    display: flex;
    gap: 10px;
    padding: 10px 20px;
    justify-content: center;
  `;

  export const StatusMetaContainer = styled.div`
    box-sizing: border-box;
    padding: 0 20px;
  `;

  export const StyledTable = styled.table``;

  export const StyledCell = styled.td<{ color?: string }>`
    color: ${(p) => p.color};
  `;

  export const QRCodeContainer = styled.div`
    display: flex;
    justify-content: center;
  `;
}
