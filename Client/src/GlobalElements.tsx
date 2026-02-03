import React from "react";
import { Outlet } from "react-router-dom";
import { Layer } from "./Components/Layer";

// Elements that should be present on all pages
export const GlobalElements = (): React.JSX.Element => {
  // Outlet renders the normal app content e.g. the LibraryView
  return (
    <>
      <Outlet />
      <Layer />
    </>
  );
};
