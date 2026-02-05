import { faFileDownload } from "@fortawesome/free-solid-svg-icons";
import React, { useCallback } from "react";
import { Button } from "./Button";

export interface DownloadButtonProps {
  data: string | null;
  filename: string;
}

export const DownloadButton: React.FC<DownloadButtonProps> = (
  props: DownloadButtonProps
) => {
  const { data, filename } = props;

  const handleSave = useCallback(() => {
    if (!data) {
      return;
    }

    // Create a temporary anchor element
    const link = document.createElement("a");

    // Set the anchor's href to the image data
    link.href = data;

    // Set the download attribute with a desired filename
    link.download = filename;

    // Append the link to the document body
    document.body.appendChild(link);

    // Programmatically click the link to trigger the download
    link.click();

    // Clean up by removing the link from the document
    document.body.removeChild(link);
  }, [data, filename]);

  return <Button onClick={handleSave} icon={faFileDownload} disabled={!data} />;
};

namespace S {}
