import "antd/dist/reset.css";

import "./parse.config";
import "./highcharts.config";

import "./leaflet.config";
import { init, StorageAdapterLS } from "@opendash/core";
import { registerIconPack } from "@opendash/icons";
import { HighchartsPlugin } from "@opendash/plugin-highcharts";
import { GeoPlugin } from "@opendash/plugin-geo";
import { GeoPluginMapLibre } from "@opendash/plugin-geo-maplibre";
import { MIAASPlugin } from "@opendash/plugin-miaas";
import { $monitoring, MonitoringPlugin } from "@opendash/plugin-monitoring";
import { OpenwarePlugin } from "@opendash/plugin-openware";
import { ParsePlugin } from "@opendash/plugin-parse";
import { ParseMonitoringPlugin } from "@opendash/plugin-parse-monitoring";
import { TimeseriesPlugin } from "@opendash/plugin-timeseries";
import ExampleWidget from "./widgets/example";

init("opendash", async (factory) => {
  // Icons
  // @ts-ignore
  registerIconPack(await import("@opendash/icons/dist/fa-regular.json"));

  // Translations:

  factory.registerLanguage("en", "English");
  factory.registerLanguage("de", "Deutsch", "en", true);
  // ant design translations

  factory.registerAntDesignTranslation(
    "en",
    () => import("antd/lib/locale/en_US")
  );

  factory.registerAntDesignTranslation(
    "de",
    () => import("antd/lib/locale/de_DE")
  );

  // widget translations

  factory.registerTranslationResolver(
    "en",
    "app",
    async () => await import("./translations/app/en.json")
  );

  // Adapter + Plugins

  factory.registerDeviceStorageAdapter(new StorageAdapterLS());

  await factory.use(
    new ParsePlugin({
      authLdapActive: false,
    })
  );
  await factory.use(new TimeseriesPlugin());
  await factory.use(new MonitoringPlugin());
  await factory.use(new GeoPlugin());
  await factory.use(new GeoPluginMapLibre());
  await factory.use(new MIAASPlugin());
  await factory.use(
    new OpenwarePlugin({
      host: "openware.apps.openinc.dev",
      secure: true,
    })
  );
  await factory.use(
    new ParseMonitoringPlugin({
      liveQueries: false,
    })
  );
  await factory.use(new HighchartsPlugin());

  factory.registerStaticNavigationItem({
    id: "monitoring/dashboard",
    group: "monitoring",
    place: "frontpage",
    order: 1,
    label: "opendash:monitoring.label",
    icon: "fa:chart-line",
    color: "#4385c2",
    link: "/monitoring/dashboards",
    routeCondition: "**",
    activeCondition: "/",
  });
  // Widgets
 addcss(`
  .ant-modal-close-x {margin-top:16}
  .ant-steps-item-icon span {line-height:32px!important}
  .ant-steps-item-icon svg {margin-top:7}
  .ant-drawer-body .data-item-boolean {margin-top:12} 
  .ant-drawer-body .data-item-percentage {margin-top:10}
  .leaflet-top {z-index:998!important} 

  `);
  $monitoring.registerWidget(ExampleWidget);
}).then((app) => {
  console.log("init open.DASH");
});

function addcss(css) {
  const head = document.getElementsByTagName("head")[0];
  const s = document.createElement("style");
  s.setAttribute("type", "text/css");
  s.appendChild(document.createTextNode(css));
  head.appendChild(s);
}
