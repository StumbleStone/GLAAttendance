import styled from "@emotion/styled";
import * as React from "react";
import { Backdrop } from "../Components/Backdrop/Backdrop";
import { Button } from "../Components/Button/Button";
import { Heading } from "../Components/Heading";
import { LayerHandler, LayerItem } from "../Components/Layer";
import { Tile } from "../Components/Tile";
import { epochToDate } from "../Tools/Toolbox";
import {
  RealtimeChannelMonitor,
  RealtimeChannelMonitorEventKey,
} from "./RealtimeChannelMonitor";

export function ShowRealtimeChannelWindow(monitor: RealtimeChannelMonitor) {
  LayerHandler.AddLayer((l: LayerItem) => (
    <RealtimeChannelWindow layerItem={l} monitor={monitor} />
  ));
}

export interface RealtimeChannelWindowProps {
  monitor: RealtimeChannelMonitor;
  layerItem: LayerItem;
}

export const RealtimeChannelWindow: React.FC<RealtimeChannelWindowProps> = (
  props: RealtimeChannelWindowProps
) => {
  const { layerItem, monitor } = props;
  const [, forceUpdate] = React.useReducer((x) => x + 1, 0);

  const bdClick = React.useCallback(() => {
    layerItem.close();
  }, [layerItem]);

  React.useEffect(() => {
    return monitor.addListener({
      [RealtimeChannelMonitorEventKey.UPDATE_RECEIVED]: forceUpdate,
      [RealtimeChannelMonitorEventKey.CONNECTION_CHANGED]: forceUpdate,
    });
  }, []);

  return (
    <S.StyledBackdrop onClose={bdClick}>
      <S.RealtimeChannelWindowEl>
        <Heading>Realtime Updates</Heading>
        <S.Content>
          <table>
            <tbody>
              <tr>
                <td>Status:</td>
                <td>
                  <S.Status color={monitor.iconColor}>
                    {monitor.status}
                  </S.Status>
                </td>
              </tr>
              <tr>
                <td>Last update:</td>
                <td>
                  <span>
                    {monitor.lastReceived
                      ? epochToDate(monitor.lastReceived, {
                          includeTime: true,
                          includeSeconds: true,
                        })
                      : "--"}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>

          <Button onClick={monitor.pingChannel}>Ping!</Button>
        </S.Content>
      </S.RealtimeChannelWindowEl>
    </S.StyledBackdrop>
  );
};

namespace S {
  export const StyledBackdrop = styled(Backdrop)`
    display: flex;
    align-items: center;
    justify-content: center;
  `;

  export const RealtimeChannelWindowEl = styled(Tile)`
    max-height: min(300px, 80vh);
    min-width: min(300px, 80vw);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    justify-content: center;
    align-items: center;

    gap: 10px;
    padding: 10px;
  `;

  export const Content = styled.div`
    flex: 1;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 10px;
  `;

  export const Status = styled.span<{ color: string }>`
    color: ${(p) => p.color};
  `;
}
