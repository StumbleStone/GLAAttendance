import React, { useEffect } from "react";

export function useObserveWidth(ref: React.RefObject<HTMLElement>) {
  const [width, setWidth] = React.useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) {
      return;
    }

    const onResize = (entries: ResizeObserverEntry[]) => {
      if (entries.length == 0) {
        return;
      }

      const entry = entries[0];
      const width = Math.floor(entry.contentRect.width);

      setWidth(() => width);
    };

    const obs = new ResizeObserver(onResize);
    obs.observe(el);

    return () => {
      obs.unobserve(el);
      obs.disconnect();
    };
  }, [ref, ref.current]);

  return width;
}
