import React from "react";

import {
  FormatRelativeDates,
  useTranslation,
  useOpenDashServices,
} from "@opendash/core";

import { createWidgetComponent } from "@opendash/plugin-monitoring";

import { ConfigInterface } from "./types";

export default createWidgetComponent<ConfigInterface>(
  ({ config, ...context }) => {
    const t = useTranslation();

    const { DataService } = useOpenDashServices();

    context.setLoading(false);
    context.setName(t("app:widgets.example.title"));

    const { height, width } = context.useContainerSize();
    const history = context.useFetchDimensionValues();
    return null;
  }
);
