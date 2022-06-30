import * as React from "react";

import { createWidgetComponent } from "@opendash/core";

import { ConfigInterface } from "./types";

export default createWidgetComponent<ConfigInterface>(
  ({ draft, updateDraft, ...context }) => {
    return null;
  }
);
