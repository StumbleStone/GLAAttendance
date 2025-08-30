import React from "react";
import { Outlet } from "react-router-dom";
import { Layer } from "./Components/Layer/Layer";

// Elements that should be present on all pages
export const GlobalElements = (): JSX.Element => {
  // Outlet renders the normal app content e.g. the LibraryView
  return (
    <>
      <Outlet />
      <Layer />
    </>
  );
};
