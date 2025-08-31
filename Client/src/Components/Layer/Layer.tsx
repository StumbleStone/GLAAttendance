import styled from "@emotion/styled";
import * as React from "react";
import {
  DeregisterCB,
  EventClass,
  EventClassEvents,
} from "../../Tools/EventClass";
import { DefaultColors, GenerateId } from "../../Tools/Toolbox";

export interface LayerProps {}

export const Layer: React.FC<LayerProps> = (props: LayerProps) => {
  const [layers, setLayers] = React.useState<LayerItem[]>([]);

  React.useEffect(() => {
    return LayerHandler.AddListener({
      changed: (newLayers) => {
        setLayers([...newLayers]);
      },
    });
  }, []);

  return (
    <S.LayerEl>
      {layers
        .map((l) =>
          l.destroyed ? null : (
            <React.Fragment key={l.id}>{l.render(l)}</React.Fragment>
          )
        )
        .filter((l) => l !== null)}
    </S.LayerEl>
  );
};

namespace S {
  export const LayerEl = styled("div")`
    position: fixed;
    pointer-events: none;
    top: 0;
    left: 0;

    color: ${DefaultColors.Text_Color};
    font-size: 18px;
  `;
}

export enum LayerEventKey {
  CHANGED = "changed",
}

export interface LayerEvent extends EventClassEvents {
  [LayerEventKey.CHANGED]: (layers: LayerItem[]) => void;
}

export interface LayerItem {
  id: string;
  destroyed: boolean;
  render: (l: LayerItem) => React.ReactNode;
  close: () => void;
}

export class LayerHandler extends EventClass<LayerEvent> {
  private static _instance: LayerHandler;

  _layers: LayerItem[];

  constructor() {
    super();
    this._layers = [];
  }

  static get Instance(): LayerHandler {
    if (!LayerHandler._instance) {
      LayerHandler._instance = new LayerHandler();
    }

    return LayerHandler._instance;
  }

  static get Layers() {
    return LayerHandler.Instance._layers;
  }

  static AddListener(cb: Partial<LayerEvent>): DeregisterCB {
    return LayerHandler.Instance.addListener(cb);
  }

  removeLayer(id: string) {
    this._layers = this._layers.filter((l) => l.id !== id);
    this.fireUpdate((cb) => cb[LayerEventKey.CHANGED]?.(this._layers));
  }

  addLayer(item: LayerItem) {
    this._layers.push(item);
    this.fireUpdate((cb) => cb[LayerEventKey.CHANGED]?.(this._layers));
  }

  static AddLayer(render: (l: LayerItem) => React.ReactNode): LayerItem {
    const inst = LayerHandler.Instance;

    const id = GenerateId();
    const item: LayerItem = {
      destroyed: false,
      id: id,
      close: () => inst.removeLayer(id),
      render: render,
    };

    inst.addLayer(item);

    return item;
  }
}
