import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  DeregisterCB,
  EventClass,
  EventClassEvents,
} from "../Tools/EventClass";
import { GenerateId } from "../Tools/Toolbox";

export interface HeadingIconOptions {
  color?: string;
  onClick: () => void;
  icon: IconDefinition;
}

export interface HeadingIcon extends HeadingIconOptions {
  remove: () => void;
  update: (newProps: Partial<HeadingIconOptions>) => void;
  id: string;
}

export enum HeadingIconHandlerEvent {
  ICONS_CHANGED = "icons_changed",
}

export interface HeadingIconHandlerListeners extends EventClassEvents {
  [HeadingIconHandlerEvent.ICONS_CHANGED]: (
    icons: Map<string, HeadingIcon>
  ) => void;
}

export class HeadingIconHandler extends EventClass<HeadingIconHandlerListeners> {
  private static _instance: HeadingIconHandler;

  _icons: Map<string, HeadingIcon>;

  constructor() {
    super();
    this._icons = new Map<string, HeadingIcon>();
  }

  static get Instance(): HeadingIconHandler {
    if (!HeadingIconHandler._instance) {
      HeadingIconHandler._instance = new HeadingIconHandler();
    }

    return HeadingIconHandler._instance;
  }

  static AddListener(cb: Partial<HeadingIconHandlerListeners>): DeregisterCB {
    return HeadingIconHandler.Instance.addListener(cb);
  }

  static get Icons(): HeadingIcon[] {
    return Array.from(HeadingIconHandler.Instance._icons.values()).reverse();
  }

  static AddIcon(options: HeadingIconOptions): HeadingIcon {
    const inst = HeadingIconHandler.Instance;
    const id = GenerateId();
    const newIcon: HeadingIcon = {
      ...options,
      id,
      remove: () => {
        inst._icons.delete(id);
        inst.fireUpdate((cb) =>
          cb[HeadingIconHandlerEvent.ICONS_CHANGED]?.(inst._icons)
        );
      },
      update: (newProps: Partial<HeadingIconOptions>) => {
        const existing = inst._icons.get(id);
        if (!existing) {
          return;
        }

        const updatedIcon = { ...existing, ...newProps };
        inst._icons.set(id, updatedIcon);
        inst.fireUpdate((cb) =>
          cb[HeadingIconHandlerEvent.ICONS_CHANGED]?.(inst._icons)
        );
        return updatedIcon;
      },
    };

    inst._icons.set(id, newIcon);
    inst.fireUpdate((cb) =>
      cb[HeadingIconHandlerEvent.ICONS_CHANGED]?.(inst._icons)
    );

    return newIcon;
  }
}
