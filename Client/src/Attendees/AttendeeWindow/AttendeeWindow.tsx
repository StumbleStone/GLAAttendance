import { keyframes } from "@emotion/react";
import styled from "@emotion/styled";
import {
  faCheckCircle,
  faCheckSquare,
  faEdit,
  faMinusSquare,
  faTrash,
  faXmarkCircle,
  faXmarkSquare,
} from "@fortawesome/free-solid-svg-icons";
import React, {
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
} from "react";
import { Backdrop } from "../../Components/Backdrop/Backdrop";
import { Button, ButtonContainer } from "../../Components/Button/Button";
import { DownloadButton } from "../../Components/Button/DownloadButton";
import { ShareButton } from "../../Components/Button/ShareButton";
import { Icon } from "../../Components/Icon";
import { LayerHandler, LayerItem } from "../../Components/Layer";
import {
  PopupConfirm,
  PopupConfirmButton,
} from "../../Components/Popup/PopupConfirm";
import { Span } from "../../Components/Span";
import { Tile } from "../../Components/Tile";
import { QRCode } from "../../QRCode/QRCode";
import { SupaBase, SupaBaseEventKey } from "../../SupaBase/SupaBase";
import { RollCallMethod, RollCallStatus } from "../../SupaBase/types";
import { DefaultColors } from "../../Tools/Toolbox";
import { Attendee, AttendeeStatus } from "../Attendee";
import { AttendeeEditContainer } from "./AttendeeEditContainer";
import { AttendeeWindowStatusContainer } from "./AttendeeWindowStatusContainer";

export interface AtendeeWindowProps {
  layerItem: LayerItem;
  attendee: Attendee;
  rollCallEventId?: number | null;
  supabase: SupaBase;
}

const ICON_SIZE = 16;

export function ShowAttendeeWindow(
  supabase: SupaBase,
  attendee: Attendee,
  rollCallEventId?: number | null,
): void {
  LayerHandler.AddLayer((layerItem: LayerItem) => (
    <AttendeeWindow
      attendee={attendee}
      layerItem={layerItem}
      rollCallEventId={rollCallEventId}
      supabase={supabase}
    />
  ));
}

export const AttendeeWindow: React.FC<AtendeeWindowProps> = (
  props: AtendeeWindowProps,
) => {
  const { layerItem, attendee, rollCallEventId, supabase } = props;
  const [, forceUpdate] = useReducer((x) => x + 1, 0);
  const [showAnim, setShowAnim] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const previousStatusRef = useRef<AttendeeStatus>(AttendeeStatus.NOT_SCANNED);
  const resolvedRollCallEventId =
    rollCallEventId ?? supabase.currentRollCallEvent?.id ?? null;

  const bdClick = useCallback(() => {
    layerItem.close();
  }, [layerItem]);

  useEffect(() => {
    attendee.generateQRCode();
    return attendee.addListener({
      updated: forceUpdate,
      qrReady: forceUpdate,
    });
  }, [attendee]);

  useEffect(() => {
    if (!attendee.isDeleted) {
      return;
    }
    layerItem.close();
  }, [attendee.isDeleted, layerItem]);

  useEffect(() => {
    return supabase.addListener({
      [SupaBaseEventKey.LOADED_ROLLCALLS]: () => {
        const nextStatus = supabase.getAttendeeStatus(
          attendee,
          resolvedRollCallEventId,
        );
        if (previousStatusRef.current !== nextStatus) {
          previousStatusRef.current = nextStatus;
          setShowAnim(() => true);
        }
        forceUpdate();
      },
      [SupaBaseEventKey.UPDATED_ROLLCALL_EVENT]: () => {
        previousStatusRef.current = supabase.getAttendeeStatus(
          attendee,
          resolvedRollCallEventId,
        );
        forceUpdate();
      },
    });
  }, [attendee, resolvedRollCallEventId, supabase]);

  const status: AttendeeStatus = supabase.getAttendeeStatus(
    attendee,
    resolvedRollCallEventId,
  );
  const currentRollCall = supabase.getCurrentRollCallForAttendee(
    attendee,
    resolvedRollCallEventId,
  );

  useEffect(() => {
    previousStatusRef.current = status;
  }, [status]);

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
  }, [attendee, supabase]);

  const statusCol =
    status === AttendeeStatus.PRESENT
      ? DefaultColors.BrightGreen
      : status === AttendeeStatus.ABSENT
        ? DefaultColors.BrightRed
        : DefaultColors.BrightGrey;
  const canRecordRollCall = resolvedRollCallEventId != null;

  const handleEdit = useCallback(() => {
    setEditMode((prev) => !prev);
  }, []);

  const handleExitEdit = useCallback(() => {
    setEditMode(() => false);
  }, []);

  const handlePresent = useCallback(() => {
    if (!resolvedRollCallEventId) {
      return;
    }

    supabase.createRollCall(
      attendee,
      resolvedRollCallEventId,
      RollCallMethod.MANUAL,
    );
  }, [attendee, resolvedRollCallEventId, supabase]);

  const handleAbsent = useCallback(() => {
    if (!resolvedRollCallEventId) {
      return;
    }

    supabase.createRollCall(
      attendee,
      resolvedRollCallEventId,
      RollCallMethod.MANUAL,
      RollCallStatus.ABSENT,
    );
  }, [attendee, resolvedRollCallEventId, supabase]);

  return (
    <S.StyledBackdrop onClose={bdClick}>
      <S.AttendeeWindowEl>
        <S.AttendeeHeading>
          <S.Name>
            {`${attendee.name} ${attendee.surname}`}
            {!editMode && (
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
            )}
          </S.Name>
          {!editMode && (
            <AttendeeWindowStatusContainer
              attendee={attendee}
              currentRollCall={currentRollCall}
              status={status}
              statusCol={statusCol}
              supabase={supabase}
            />
          )}
          {editMode && (
            <AttendeeEditContainer
              attendee={attendee}
              supabase={supabase}
              exitEdit={handleExitEdit}
            />
          )}
        </S.AttendeeHeading>

        {!editMode && (
          <S.QRCodeContainer>
            <QRCode qrCodeUrl={attendee.QRCodeURL} />
          </S.QRCodeContainer>
        )}
        {!editMode && (
          <S.ActionButtonRow>
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
              onClick={handleEdit}
              icon={faEdit}
              color={DefaultColors.BrightOrange}
            />
          </S.ActionButtonRow>
        )}
        {!editMode && (
          <S.ActionButtonRow>
            <S.WideButton
              onClick={handleAbsent}
              icon={faXmarkCircle}
              disabled={!canRecordRollCall || status === AttendeeStatus.ABSENT}
              color={DefaultColors.BrightRed}
            />

            <S.WideButton
              onClick={handlePresent}
              icon={faCheckCircle}
              disabled={!canRecordRollCall || status === AttendeeStatus.PRESENT}
              color={DefaultColors.BrightGreen}
            />
          </S.ActionButtonRow>
        )}
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
    justify-content: flex-start;
    align-items: stretch;
    gap: 14px;
    padding: 18px 0 16px;
  `;

  export const AttendeeHeading = styled.div`
    width: 100%;
    box-sizing: border-box;
    text-align: center;
    padding: 0;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: stretch;
    gap: 10px;
  `;

  export const Name = styled.div`
    font-size: 22px;
    user-select: none;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px;
    padding: 0 24px;
    line-height: 1.1;
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
    z-index: 20;
  `;

  export const QRCodeContainer = styled.div`
    display: flex;
    justify-content: center;
    padding: 0 16px;
  `;

  export const WideButton = styled(Button)`
    flex: 1;
    justify-content: center;
  `;

  export const ActionButtonRow = styled(ButtonContainer)`
    padding: 0 16px;
    box-sizing: border-box;
  `;
}
