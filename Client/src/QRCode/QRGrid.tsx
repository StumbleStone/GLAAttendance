import styled from "@emotion/styled";
import {
  faBusSimple,
  faCar,
  faCaretLeft,
  faCaretRight,
} from "@fortawesome/free-solid-svg-icons";
import * as React from "react";
import { Attendee, QR_SIZE } from "../Attendees/Attendee";
import { Backdrop } from "../Components/Backdrop/Backdrop";
import { DownloadButton } from "../Components/Button/DownloadButton";
import { ShareButton } from "../Components/Button/ShareButton";
import { Icon } from "../Components/Icon";
import { Input as iInput } from "../Components/Inputs/BaseInput";
import { LayerItem } from "../Components/Layer";
import { LoadingSpinner } from "../Components/LoadingSpinner";
import { Tile } from "../Components/Tile";
import { SupaBase } from "../SupaBase/SupaBase";
import { DefaultColors } from "../Tools/Toolbox";

export interface QRGridProps {
  supabase: SupaBase;
  layerItem: LayerItem;
}

interface DrawQRGridOptions {
  rows: number;
  cols: number;
  page: number;
  supabase: SupaBase;
  transport: Transport[];
}

async function drawQRGrid(options: DrawQRGridOptions): Promise<string> {
  const { cols, page, rows, supabase, transport } = options;
  const arr = filter(
    Array.from(supabase.attendees.values()).sort((a, b) =>
      Attendee.SortByField(a, b, "name")
    ),
    transport
  );

  const canvas = document.createElement("canvas");
  canvas.width = cols * QR_SIZE;
  const divRemain = Math.min(rows, Math.max(1, Math.ceil(arr.length / cols)));
  canvas.height = divRemain * QR_SIZE;

  let xIndex: number = 0;
  let yIndex: number = 0;
  let arrIndex: number = page * (cols * rows);

  const ctx: CanvasRenderingContext2D = canvas.getContext("2d")!;

  await new Promise<void>((resolve) => {
    const drawNext = () => {
      const curQR = arr[arrIndex];
      arrIndex++;
      if (!curQR) {
        return resolve();
      }

      console.log(`Grid: Drawing ${curQR.fullName}`);
      ctx.drawImage(curQR.QRCode, xIndex * QR_SIZE, yIndex * QR_SIZE);

      xIndex++;

      if (xIndex >= cols) {
        xIndex = 0;
        yIndex++;
      }

      if (yIndex > rows) {
        // At the limit for this page
        return resolve();
      }

      requestAnimationFrame(() => {
        drawNext();
      });
    };

    requestAnimationFrame(() => {
      drawNext();
    });
  });

  return canvas.toDataURL("image/png");
}

enum Transport {
  BUS = "bus",
  CAR = "car",
}

function checkPageLimit(
  rows: number,
  cols: number,
  attendees: number,
  newPage: number
): number {
  if (attendees === 0) {
    return 0;
  }

  if (newPage <= 0 && attendees !== 0) {
    return 1;
  }

  const lim = Math.ceil(attendees / (rows * cols));
  if (newPage > lim) {
    return lim;
  }

  return newPage;
}

function filter(arr: Attendee[], transport: Transport[]): Attendee[] {
  return arr.filter((attendee) => {
    if (transport.includes(Transport.CAR) && attendee.isUsingOwnTransport) {
      return true;
    }

    if (transport.includes(Transport.BUS) && !attendee.isUsingOwnTransport) {
      return true;
    }

    return false;
  });
}

export const QRGrid: React.FC<QRGridProps> = (props: QRGridProps) => {
  const { layerItem, supabase } = props;

  const [generatingQRs, setGeneratingQRs] = React.useState<boolean>(true);

  const [rows, setRows] = React.useState<number>(10);
  const [cols, setCols] = React.useState<number>(3);
  const [page, setPage] = React.useState<number>(1);
  const [busy, setBusy] = React.useState<boolean>(false);

  const [transport, setTransport] = React.useState<Transport[]>([
    Transport.CAR,
    Transport.BUS,
  ]);

  const attendeeCount = filter(
    Array.from(supabase.attendees.values()),
    transport
  ).length;

  const toggleCar = React.useCallback(() => {
    if (transport.includes(Transport.CAR)) {
      setTransport((prev) => prev.filter((t) => t !== Transport.CAR));
    } else {
      setTransport((prev) => [...prev, Transport.CAR]);
    }
  }, [transport]);

  const toggleBus = React.useCallback(() => {
    if (transport.includes(Transport.BUS)) {
      setTransport((prev) => prev.filter((t) => t !== Transport.BUS));
    } else {
      setTransport((prev) => [...prev, Transport.BUS]);
    }
  }, [transport]);

  const onRowChange = React.useCallback(
    (newVal: number) => {
      if (busy) {
        return;
      }

      if (newVal <= 0) {
        return setRows(() => 1);
      }

      setRows(() => newVal);
    },
    [busy]
  );

  const onColChange = React.useCallback(
    (newVal: number) => {
      if (busy) {
        return;
      }

      if (newVal <= 0) {
        return setCols(() => 1);
      }

      setCols(() => newVal);
    },
    [busy]
  );

  const onPageChange = React.useCallback(
    (newVal: number) => {
      if (busy) {
        return;
      }

      setPage(checkPageLimit(rows, cols, attendeeCount, newVal));
    },
    [rows, cols, busy, attendeeCount]
  );

  React.useEffect(() => {
    const lim = checkPageLimit(rows, cols, attendeeCount, page);
    if (lim !== page) {
      setPage(lim);
    }
  }, [rows, cols, page, attendeeCount]);

  const [dataUrl, setDataUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (generatingQRs) {
      return;
    }

    console.log(`Starting Grid drawing`);
    setBusy(() => true);
    drawQRGrid({
      rows,
      cols,
      page: page - 1,
      supabase,
      transport,
    }).then((dataUrl: string) => {
      console.log(`Grid draw completed`);
      setDataUrl(() => dataUrl);
      setBusy(() => false);
    });
  }, [rows, cols, page, generatingQRs, transport]);

  const bdClick = React.useCallback(() => {
    layerItem.close();
  }, [layerItem]);

  React.useEffect(() => {
    (async () => {
      await supabase.generateAllQRCodes();
      setGeneratingQRs(() => false);
    })();
  }, []);

  if (generatingQRs) {
    return (
      <S.StyledBackdrop onClose={bdClick}>
        <S.QRGridEl>
          <LoadingSpinner size={80} />
        </S.QRGridEl>
      </S.StyledBackdrop>
    );
  }

  return (
    <S.StyledBackdrop onClose={bdClick}>
      <S.QRGridEl>
        <S.Header>
          <Controller heading={"Columns"} onChange={onColChange} value={cols} />
          <Controller heading={"Rows"} onChange={onRowChange} value={rows} />
          <Controller
            heading={`Page (${page} of ${checkPageLimit(
              rows,
              cols,
              attendeeCount,
              10000
            )})`}
            onChange={onPageChange}
            value={page}
          />
        </S.Header>
        <S.Content>
          <S.StyledImage src={dataUrl ?? null} />
        </S.Content>
        <S.Footer>
          <S.ButtonContainer>
            <DownloadButton
              data={dataUrl}
              filename={`Attendee_QR_${page}.png`}
            />
            <ShareButton
              data={dataUrl}
              filename={`Attendee_QR_${page}.png`}
              text={`Page ${page} of Attendee QR codes`}
              title={`Attendee QR List`}
            />
          </S.ButtonContainer>
          <S.IconContainer>
            <S.StyledIcon
              onClick={toggleBus}
              icon={faBusSimple}
              size={26}
              color={
                transport.includes(Transport.BUS)
                  ? DefaultColors.BrightCyan
                  : DefaultColors.Grey
              }
            />
            <S.StyledIcon
              onClick={toggleCar}
              icon={faCar}
              size={26}
              color={
                transport.includes(Transport.CAR)
                  ? DefaultColors.BrightCyan
                  : DefaultColors.Grey
              }
            />
          </S.IconContainer>
        </S.Footer>
      </S.QRGridEl>
    </S.StyledBackdrop>
  );
};

interface ControllerProps {
  onChange: (val: number) => void;
  value: number;
  heading: string;
}

const Controller: React.FC<ControllerProps> = (props: ControllerProps) => {
  const { onChange, value, heading } = props;

  const handleInputChange = React.useCallback(
    (ev: React.ChangeEvent<HTMLInputElement>) => {
      onChange(parseInt(ev.target.value));
    },
    [onChange]
  );

  const handleInc = React.useCallback(() => {
    onChange(value + 1);
  }, [onChange, value]);

  const handleDec = React.useCallback(() => {
    onChange(value - 1);
  }, [onChange, value]);

  return (
    <S.ControllerContainer>
      <S.ControllerHeading>{heading}</S.ControllerHeading>
      <S.ControllerInputContainer>
        <S.ControllerDec
          icon={faCaretLeft}
          size={15}
          color={DefaultColors.Black}
          onClick={handleDec}
        />
        <S.ControllerInput
          type="number"
          value={value}
          onChange={handleInputChange}
        />
        <S.ControllerInc
          icon={faCaretRight}
          size={15}
          color={DefaultColors.Black}
          onClick={handleInc}
        />
      </S.ControllerInputContainer>
    </S.ControllerContainer>
  );
};

namespace S {
  export const StyledBackdrop = styled(Backdrop)`
    display: flex;
    align-items: center;
    justify-content: center;
  `;

  export const QRGridEl = styled(Tile)`
    max-width: min(500px, 80vw);
    max-height: min(500px, 80vh);
    min-width: min(500px, 80vw);
    min-height: min(500px, 80vh);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    padding: 0;
    justify-content: center;
    align-items: center;

    gap: 10px;
  `;

  export const Content = styled.div`
    flex: 1;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    overflow: auto;
    padding: 10px;
    box-sizing: border-box;
    position: relative;
  `;

  export const StyledImage = styled.img`
    position: absolute;
    top: 0;
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  `;

  export const Header = styled.div`
    label: Header;
    border-bottom: 2px solid ${DefaultColors.OffWhite};
    display: flex;
    width: 100%;
    box-sizing: border-box;
    padding: 5px;
    gap: 5px;
    max-width: 100%;
    justify-content: space-around;
  `;

  export const Footer = styled.div`
    border-top: 2px solid ${DefaultColors.OffWhite};
    display: flex;
    width: 100%;
    box-sizing: border-box;
    padding: 10px;
    gap: 10px;
  `;

  export const ButtonContainer = styled.div`
    display: flex;
    gap: 10px;
    box-sizing: border-box;
    flex: 1;
    justify-content: flex-start;
  `;

  export const IconContainer = styled.div`
    display: flex;
    gap: 10px;
    box-sizing: border-box;
    flex: 1;
    justify-content: flex-end;
  `;

  export const StyledIcon = styled(Icon)`
    padding: 2px 5px;
    cursor: pointer;
  `;

  export const ControllerContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    user-select: none;
  `;

  export const ControllerHeading = styled.div`
    font-size: 18px;
  `;

  export const ControllerInputContainer = styled.div`
    display: flex;
    gap: 0;
    border-radius: 10px;
    align-items: center;
    border: 2px solid ${DefaultColors.Black};
    background-color: ${DefaultColors.OffWhite};
  `;

  export const ControllerInc = styled(Icon)`
    cursor: pointer;
    width: 30px;
  `;

  export const ControllerDec = styled(Icon)`
    cursor: pointer;
    width: 30px;
  `;

  export const ControllerInput = styled(iInput)`
    border-radius: 0;
    width: 30px;
    font-size: 15px;
    text-align: center;

    padding-left: 0;
    padding-right: 0;

    -moz-appearance: textfield;
    ::-webkit-outer-spin-button,
    ::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }

    border-top: 0px;
    border-bottom: 0;
  `;
}
