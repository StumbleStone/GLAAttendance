import styled from "@emotion/styled";
import * as React from "react";
import { Attendee, QR_SIZE } from "../Attendees/Attendee";
import { Backdrop } from "../Components/Backdrop/Backdrop";
import { DownloadButton } from "../Components/Button/DownloadButton";
import { ShareButton } from "../Components/Button/ShareButton";
import { LayerItem } from "../Components/Layer";
import { LoadingSpinner } from "../Components/LoadingSpinner";
import { Tile } from "../Components/Tile";
import { SupaBase } from "../SupaBase/SupaBase";
import { SupabaseAttendees } from "../SupaBase/table-handlers/SupabaseAttendees";
import { DefaultColors } from "../Tools/Toolbox";
import { QRGridController } from "./QRGridController";

export interface QRGridProps {
  supabase: SupaBase;
  layerItem: LayerItem;
}

interface DrawQRGridOptions {
  rows: number;
  cols: number;
  page: number;
  supabase: SupaBase;
}

async function drawQRGrid(options: DrawQRGridOptions): Promise<string> {
  const { cols, page, rows, supabase } = options;
  const arr = getSortedAttendees(supabase.attendeesHandler);

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

function checkPageLimit(
  rows: number,
  cols: number,
  attendees: number,
  newPage: number,
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

function getSortedAttendees(attendeesHandler: SupabaseAttendees): Attendee[] {
  return attendeesHandler.sort((a, b) => Attendee.SortByField(a, b, "name"));
}

export const QRGrid: React.FC<QRGridProps> = (props: QRGridProps) => {
  const { layerItem, supabase } = props;

  const [generatingQRs, setGeneratingQRs] = React.useState<boolean>(true);

  const [rows, setRows] = React.useState<number>(10);
  const [cols, setCols] = React.useState<number>(3);
  const [page, setPage] = React.useState<number>(1);
  const [busy, setBusy] = React.useState<boolean>(false);
  const attendeeCount = getSortedAttendees(supabase.attendeesHandler).length;

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
    [busy],
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
    [busy],
  );

  const onPageChange = React.useCallback(
    (newVal: number) => {
      if (busy) {
        return;
      }

      setPage(checkPageLimit(rows, cols, attendeeCount, newVal));
    },
    [rows, cols, busy, attendeeCount],
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
    }).then((dataUrl: string) => {
      console.log(`Grid draw completed`);
      setDataUrl(() => dataUrl);
      setBusy(() => false);
    });
  }, [rows, cols, page, generatingQRs, supabase]);

  const bdClick = React.useCallback(() => {
    layerItem.close();
  }, [layerItem]);

  React.useEffect(() => {
    let mounted = true;
    // TODO Move drawing to worker, this timeout is just to allow UI to update
    setTimeout(async () => {
      await supabase.generateAllQRCodes();
      if (!mounted) {
        return;
      }
      setGeneratingQRs(() => false);
    }, 500);

    return () => {
      mounted = false;
    };
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
          <QRGridController
            heading={"Columns"}
            onChange={onColChange}
            value={cols}
          />
          <QRGridController
            heading={"Rows"}
            onChange={onRowChange}
            value={rows}
          />
          <QRGridController
            heading={`Page (${page}/${checkPageLimit(
              rows,
              cols,
              attendeeCount,
              10000,
            )})`}
            onChange={onPageChange}
            value={page}
          />
        </S.Header>
        <S.Content>
          {busy ? (
            <LoadingSpinner size={40} />
          ) : (
            <S.StyledImage src={dataUrl ?? null} />
          )}
        </S.Content>
        <S.Footer>
          <S.ButtonContainerEl>
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
          </S.ButtonContainerEl>
        </S.Footer>
      </S.QRGridEl>
    </S.StyledBackdrop>
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

  export const ButtonContainerEl = styled.div`
    display: flex;
    gap: 10px;
    box-sizing: border-box;
    flex: 1;
    justify-content: flex-start;
  `;
}
