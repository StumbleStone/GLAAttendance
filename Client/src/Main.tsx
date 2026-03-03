import * as React from "react";
import ReactDom from "react-dom/client";
import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { LoadingSpinner } from "./Components/LoadingSpinner";
import { GlobalElements } from "./GlobalElements";
import { MainMenu } from "./MainMenu/MainMenu";
import { MainPageError } from "./MainMenu/MainPageError";
import { routePathToSegment, ROUTES } from "./MainMenu/RouteFlow";
import { RouteItem } from "./MainMenu/RouteItem";
import { AppThemeProvider } from "./theme/AppThemeProvider";

document.addEventListener("DOMContentLoaded", () => {
  const domContainer: HTMLElement = document.getElementById("Container")!;
  const root = ReactDom.createRoot(domContainer);
  root.render(
    <AppThemeProvider>
      <HashRouter>
        <Routes>
          <Route
            path={""}
            errorElement={<MainPageError />}
            element={<GlobalElements />}
          >
            <Route path={""} element={<MainMenu />}>
              {ROUTES.map((route: RouteItem) => (
                <Route
                  key={route.path}
                  path={routePathToSegment(route.path)}
                  element={route.render}
                />
              ))}
              {/* TODO add NOT FOUND page here */}
              <Route path={"*"} element={<LoadingSpinner size={100} />} />
            </Route>
          </Route>

          {/* Catch All */}
          <Route path={"*"} element={<Navigate to={"/"} />} />
        </Routes>
      </HashRouter>
    </AppThemeProvider>,
  );
});
