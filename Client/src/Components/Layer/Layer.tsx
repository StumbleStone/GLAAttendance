import styled from "@emotion/styled";
import * as React from "react";
import {LayerHandler, LayerItem} from "./LayerHandler";

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

    color: ${(p) => p.theme.colors.text};
    font-size: 18px;
  `;
}
