import React from "react";
import { SupaBase } from "../SupaBase/SupaBase";
import { RoutePath } from "./RouteFlow";

export interface RouteItemOptions {
  path: RoutePath;
  render: () => React.ReactElement;
  check: (s: SupaBase) => boolean;
  prerequisite: RouteItem | null;
  isEndpoint?: boolean;
}

export class RouteItem {
  constructor(private options: RouteItemOptions) {}

  get isEndpoint(): boolean {
    return this.options.isEndpoint ?? false;
  }

  get path(): RoutePath {
    return this.options.path;
  }

  get prerequisite(): RouteItem | null {
    return this.options.prerequisite;
  }

  get render(): React.ReactElement {
    return this.options.render();
  }

  canPassCheck(supabase: SupaBase): boolean {
    return this.options.check(supabase);
  }

  getMissingPrerequisite(supabase: SupaBase): RouteItem | null {
    // Go to the first prerequisite that fails the check. This ensures the user is always on the most relevant route.
    if (this.prerequisite) {
      const anyFailed = this.prerequisite.getMissingPrerequisite(supabase);
      if (anyFailed != null) {
        return anyFailed;
      }
    }

    if (!this.canPassCheck(supabase)) {
      // Stay on this route if it fails the check.
      return this;
    }

    // All prerequisites passed.
    return null;
  }
}
