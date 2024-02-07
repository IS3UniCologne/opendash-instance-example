import { createWidget } from "@opendash/plugin-monitoring";
import { ConfigInterface } from "./types";

export default createWidget<ConfigInterface>({
  type: "opendash-widget-leaflet-example",
  meta: {},
  displayComponent: () => import("./component"),
  settingsComponent: () => import("./settings"),

  mobileSize: (width, orientation, config) => {
    return 500;
  },

  presets: [
    {
      label: "Leaflet Beispiel",
      description: "Leaflet Beispiel Beschreibung",
      imageLink: require("./preset.png"),
      tags: [],
      widget: {
        config: {},
      },
    },
  ],
});
