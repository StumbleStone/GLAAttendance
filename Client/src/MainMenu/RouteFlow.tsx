import React from "react";
import { LoadingSpinner } from "../Components/LoadingSpinner";
import { Login } from "../Components/Login/Login";
import { Onboard } from "../Onboard/Onboard";
import { SupaBase } from "../SupaBase/SupaBase";
import { Dashboard } from "./Dashboard";
import { Debug } from "./Debug";
import { Events } from "./Events";
import { RouteItem } from "./RouteItem";

export enum RoutePath {
  LOADING = "/loading",
  LOADING_PROFILE = "/loading_profile",
  LOGIN = "/login",
  ONBOARDING = "/onboard",
  DASHBOARD = "/dashboard",
  EVENTS = "/events",
  DEBUG = "/debug",
}

export const LoadingRouteItem: RouteItem = new RouteItem({
  path: RoutePath.LOADING,
  render: () => <LoadingSpinner size={100} />,
  check: (s) => s.hasInit && s.supabaseConnected,
  prerequisite: null,
});

export const LoginRouteItem: RouteItem = new RouteItem({
  path: RoutePath.LOGIN,
  render: () => <Login />,
  check: (s) => s.isLoggedIn,
  prerequisite: LoadingRouteItem,
});

export const LoadingProfileRouteItem: RouteItem = new RouteItem({
  path: RoutePath.LOADING_PROFILE,
  render: () => <LoadingSpinner size={100} />,
  check: (s) => !!s.profile,
  prerequisite: LoginRouteItem,
});

export const OnboardingRouteItem: RouteItem = new RouteItem({
  path: RoutePath.ONBOARDING,
  render: () => <Onboard />,
  check: (s) => s.isOnboarded,
  prerequisite: LoadingProfileRouteItem,
});

export const DashboardRouteItem: RouteItem = new RouteItem({
  path: RoutePath.DASHBOARD,
  render: () => <Dashboard />,
  // Dashboard doesn't require any checks specifically since prerequisites handle them.
  check: () => true,
  isEndpoint: true,
  prerequisite: OnboardingRouteItem,
});

export const EventsRouteItem: RouteItem = new RouteItem({
  path: RoutePath.EVENTS,
  render: () => <Events />,
  check: () => true,
  isEndpoint: true,
  prerequisite: OnboardingRouteItem,
});

export const DebugRouteItem: RouteItem = new RouteItem({
  path: RoutePath.DEBUG,
  render: () => <Debug />,
  check: () => true,
  isEndpoint: true,
  prerequisite: OnboardingRouteItem,
});

// Order is still important for route declaration order.
export const ROUTES: RouteItem[] = [
  LoadingRouteItem,
  LoginRouteItem,
  LoadingProfileRouteItem,
  OnboardingRouteItem,
  DashboardRouteItem,
  EventsRouteItem,
  DebugRouteItem,
];

export function getRouteByPath(pathname: string): RouteItem | null {
  for (const route of ROUTES) {
    if (route.path === pathname) {
      return route;
    }
  }

  return null;
}

let finalRoute: RouteItem = DashboardRouteItem;
const warnedMissingPaths = new Set<string>();

export function setFinalRoute(path: string): void {
  const route: RouteItem = getRouteByPath(path);
  if (!route) {
    finalRoute = DashboardRouteItem;
    return;
  }

  if (!route.isEndpoint) {
    console.warn(`Route ${route.path} is not an endpoint.`);
    finalRoute = DashboardRouteItem;
    return;
  }

  finalRoute = route;
}

export function resolveNextPath(
  supabase: SupaBase,
  currentPathname: string,
): RoutePath | null {
  const currentRoute: RouteItem = getRouteByPath(currentPathname);

  if (!currentRoute) {
    if (!warnedMissingPaths.has(currentPathname)) {
      warnedMissingPaths.add(currentPathname);
      console.warn(
        `No route found for path ${currentPathname}, redirecting to default route.`,
      );
    }
    return DashboardRouteItem.path;
  }

  const failedRoute: RouteItem = currentRoute.getMissingPrerequisite(supabase);

  if (failedRoute) {
    return failedRoute.path;
  }

  // We passed a check but we're not at an endpoint, so we should be redirected to the default endpoint.
  if (!currentRoute.isEndpoint) {
    return finalRoute.path;
  }

  // We're already at an endpoint and passed all checks, so stay here.
  return currentRoute.path;
}

export function routePathToSegment(path: RoutePath): string {
  return path.startsWith("/") ? path.substring(1) : path;
}
