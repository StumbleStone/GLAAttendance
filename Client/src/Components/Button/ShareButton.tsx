import { faShare } from "@fortawesome/free-solid-svg-icons";
import React, { useCallback, useMemo } from "react";
import { Button } from "./Button";

export interface ShareButtonProps {
  data: string | null;
  filename: string;
  title: string;
  text: string;
}

export const ShareButton: React.FC<ShareButtonProps> = (
  props: ShareButtonProps
) => {
  const { data, title, text, filename } = props;
  const canShare = useMemo(() => "share" in navigator, []);

  const handleShare = useCallback(async () => {
    if (!canShare || !data) {
      return;
    }

    const blob: Blob = await (await fetch(data)).blob();

    const file = new File([blob], filename, {
      type: "image/png",
    });

    const shareData: ShareData = {
      files: [file],
      title: title,
      text: text,
    };

    try {
      if (navigator.canShare?.(shareData)) {
        await navigator.share(shareData);
      }
    } catch (e) {
      if (`${e}` === "AbortError: Share canceled") {
        return;
      }
      throw e;
    }
  }, [canShare, data, title, text, filename]);

  return (
    <Button
      onClick={handleShare}
      icon={faShare}
      disabled={!data || !canShare}
    />
  );
};

namespace S {}
