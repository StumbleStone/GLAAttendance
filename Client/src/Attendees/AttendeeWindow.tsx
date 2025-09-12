import styled from "@emotion/styled";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from "react";
import { Button } from "../Components/Button/Button";
import { LayerHandler, LayerItem } from "../Components/Layer/Layer";
import { Tile } from "../Components/Tile";
import { Attendee } from "../SupaBase/Attendee";
import { SupaBase, SupaBaseEventKey } from "../SupaBase/SupaBase";

import { keyframes } from "@emotion/react";
import {
  faCheckCircle,
  faCheckSquare,
  faSave,
  faShare,
  faXmarkCircle,
  faXmarkSquare,
} from "@fortawesome/free-solid-svg-icons";
import { Backdrop } from "../Components/Backdrop/Backdrop";
import { Icon } from "../Components/Icon";
import { PopupConfirm } from "../Components/Popup/PopupConfirm";
import { RollCallMethod, RollCallStatus } from "../SupaBase/types";
import { DefaultColors } from "../Tools/Toolbox";
import { QRCode } from "./QRCode";

export interface AtendeeWindowProps {
  layerItem: LayerItem;
  attendee: Attendee;
  supabase: SupaBase;
}

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
    LayerHandler.AddLayer((layerItem2: LayerItem) => {
      return (
        <PopupConfirm
          layerItem={layerItem2}
          text={`Are you sure you wish to delete ${attendee.name} ${attendee.surname}?`}
          onDecline={() => {
            layerItem2.close();
          }}
          onConfirm={() => {
            supabase.deleteAttendee(attendee).then(() => {
              layerItem2.close();
            });
            layerItem.close();
          }}
        />
      );
    });
  }, []);

  const present = attendee.isPresent(supabase.currentRollCallEvent);
  const rollCallInProgress = supabase.rollcallInProgress;

  const handlePresent = useCallback(() => {
    supabase.createNewRollCall(attendee, RollCallMethod.MANUAL);
  }, [present]);

  const handleSave = useCallback(() => {
    // Create a temporary anchor element
    const link = document.createElement("a");

    // Set the anchor's href to the image data
    link.href = attendee.QRCodeURL;

    // Set the download attribute with a desired filename
    link.download = `${attendee.fullNameFileSafe}.png`;

    // Append the link to the document body
    document.body.appendChild(link);

    // Programmatically click the link to trigger the download
    link.click();

    // Clean up by removing the link from the document
    document.body.removeChild(link);
  }, [attendee.QRCodeURL]);

  const canShare = useMemo(
    () => "share" in navigator && navigator.canShare?.({ files: [] }),
    []
  );

  const handleShare = useCallback(async () => {
    if (!canShare) {
      return;
    }

    const blob: Blob = await (await fetch(attendee.QRCodeURL)).blob();

    const file = new File([blob], `${attendee.fullNameFileSafe}.png`, {
      type: "image/png",
    });

    const shareData: ShareData = {
      files: [file],
      title: `Share Attendance QR`,
      text: `Attendance QR code for ${attendee.fullName}`,
    };

    await navigator.share(shareData);
  }, [canShare, attendee.QRCodeURL]);

  const handleAbsent = useCallback(() => {
    supabase.createNewRollCall(
      attendee,
      RollCallMethod.MANUAL,
      RollCallStatus.MISSING
    );
  }, [present]);

  return (
    <S.StyledBackdrop onClose={bdClick}>
      <S.AtendeeWindowEl>
        <S.Heading>
          <S.Name>{`${attendee.name} ${attendee.surname}`}</S.Name>
          <S.Status>
            <S.StatusText>{"Status:"}</S.StatusText>
            <S.IconContainer>
              <S.AnimIcon
                showAnim={showAnim}
                key={present ? "present" : "absent"}
                icon={present ? faCheckSquare : faXmarkSquare}
                size={22}
                color={
                  present ? DefaultColors.BrightGreen : DefaultColors.BrightRed
                }
              />
            </S.IconContainer>
          </S.Status>
        </S.Heading>
        <QRCode qrCodeUrl={attendee.QRCodeURL} />
        <S.ButtonContainer>
          {/* <Button onClick={handleDelete} icon={faTrash} /> */}
          <Button
            onClick={handleSave}
            icon={faSave}
            disabled={!attendee.QRCodeURL}
          />
          <Button
            onClick={handleShare}
            icon={faShare}
            disabled={!attendee.QRCodeURL || !canShare}
          />
          <Button
            onClick={handleAbsent}
            icon={faXmarkCircle}
            disabled={!rollCallInProgress || !present}
            color={DefaultColors.BrightRed}
          />
          <Button
            onClick={handlePresent}
            icon={faCheckCircle}
            disabled={!rollCallInProgress || present}
            color={DefaultColors.BrightGreen}
          />
        </S.ButtonContainer>
      </S.AtendeeWindowEl>
    </S.StyledBackdrop>
  );
};

namespace S {
  export const AtendeeWindowEl = styled(Tile)`
    /* max-width: min(300px, 80vw); */
    //max-height: min(300px, 80vh);
    min-width: min(300px, 80vw);
    min-height: min(300px, 80vh);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    padding: 0;
    justify-content: center;
    align-items: center;
    gap: 10px;
  `;

  export const Heading = styled.div`
    width: 100%;
    box-sizing: border-box;
    text-align: center;
    padding: 5px 30px;
    padding-top: 10px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  `;

  export const Name = styled.span`
    font-size: 22px;
    user-select: none;
  `;

  export const Status = styled.div`
    display: flex;
    justify-content: center;
    gap: 5px;
  `;

  export const StatusText = styled.span`
    font-size: 18px;
    user-select: none;
  `;

  export const IconContainer = styled.div`
    height: 22px;
    width: 22px;
  `;

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
    padding-bottom: 10px;
  `;
}
