import { createWidget } from "@opendash/plugin-monitoring";
import { ConfigInterface } from "./types";

export default createWidget<ConfigInterface>({
  type: "opendash-widget-example",
  meta: {},
  displayComponent: () => import("./component"),
  settingsComponent: () => import("./settings"),

  dataItems: {
    select: "dimension",
    min: 1,
    max: 1,
    types: ["Number", "Boolean", "String"],
  },

  dataFetching: {
    live: true,
    history: true,
    historyRequired: true,
  },

  dataExplorer: {
    title: "app:widgets.example.title",
    description: "app:widgets.example.description",
    icon: "fa:table",
    config: {},
  },

  presets: [
    {
      label: "app:widgets.example.title",
      description: "app:widgets.example.description",
      imageLink: require("./preset.png"),
      tags: [],
      widget: {
        config: {},
      },
    },
  ],
});
