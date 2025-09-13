import * as React from "react";
import ReactDom from "react-dom/client";
import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { LoadingSpinner } from "./Components/LoadingSpinner";
import { Login } from "./Components/Login/Login";
import { Reset } from "./Components/Login/Reset";
import { GlobalElements } from "./GlobalElements";
import { Dashboard } from "./MainMenu/Dashboard";
import { MainMenu } from "./MainMenu/MainMenu";
import { MainPageError } from "./MainMenu/MainPageError";
import { Onboard } from "./Onboard/Onboard";

document.addEventListener("DOMContentLoaded", () => {
  const domContainer: HTMLElement = document.getElementById("Container")!;
  const root = ReactDom.createRoot(domContainer);
  root.render(
    <HashRouter
      future={{
        v7_relativeSplatPath: true,
        v7_startTransition: true,
      }}
    >
      <Routes>
        <Route
          path={""}
          errorElement={<MainPageError />}
          element={<GlobalElements />}
        >
          <Route path={""} element={<MainMenu />}>
            <Route path={"loading"} element={<LoadingSpinner size={100} />} />
            <Route
              path={"loading_profile"}
              element={<LoadingSpinner size={100} />}
            />
            <Route path={"login"} element={<Login />} />
            <Route path={"reset"} element={<Reset />} />
            <Route path={"onboard"} element={<Onboard />} />
            <Route path={"dashboard"} element={<Dashboard />} />
            {/* TODO add NOT FOUND page here */}
            <Route path={"*"} element={<LoadingSpinner size={100} />} />
          </Route>
        </Route>

        {/* Catch All */}
        <Route path={"*"} element={<Navigate to={"/"} />} />
      </Routes>
    </HashRouter>
  );
});
