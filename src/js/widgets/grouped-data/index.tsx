import { createWidget } from "@opendash/plugin-monitoring";
import { ConfigInterface } from "./types";

export default createWidget<ConfigInterface>({
  type: "opendash-widget-grouped",
  meta: {},
  displayComponent: () => import("./component"),
  settingsComponent: () => import("./settings"),

  // dataItems: {
  //   select: "dimension",
  //   min: 1,
  //   max: 1,
  //   types: ["Number", "Boolean", "String", "Object"],
  // },

  // dataFetching: {
  //   live: true,
  //   history: true,
  //   historyRequired: true,
  // },

  // dataExplorer: {
  //   title: "app:widgets.grouped.title",
  //   description: "app:widgets.grouped.description",
  //   icon: "fa:table",
  //   config: {},
  // },

  presets: [
    {
      label: "app:widgets.grouped.title",
      description: "app:widgets.grouped.description",
      imageLink: require("./preset.png"),
      tags: [],
      widget: {
        config: {},
      },
    },
  ],
});
