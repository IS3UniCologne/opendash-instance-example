import "antd/dist/reset.css";

import "./parse.config";
import "./highcharts.config";

import { init, StorageAdapterLS } from "@opendash/core";
import { registerIconPack } from "@opendash/icons";
import { BDEPlugin } from "@opendash/plugin-bde";
import { FeedbackPlugin } from "@opendash/plugin-feedback";
import { GeoPlugin } from "@opendash/plugin-geo";
import { GeoPluginMapLibre } from "@opendash/plugin-geo-maplibre";
import { GTFSPlugin } from "@opendash/plugin-gtfs";
import { HighchartsPlugin } from "@opendash/plugin-highcharts";
import { KnowledgePlugin } from "@opendash/plugin-knowledge";
import { MIAASPlugin } from "@opendash/plugin-miaas";
import { $monitoring, MonitoringPlugin } from "@opendash/plugin-monitoring";
import { OpenServicePlugin } from "@opendash/plugin-openservice";
import { OpenwarePlugin } from "@opendash/plugin-openware";
import { $parse, ParsePlugin } from "@opendash/plugin-parse";
import { ParseMonitoringPlugin } from "@opendash/plugin-parse-monitoring";
import { PlotlyPlugin } from "@opendash/plugin-plotly";
import { TimeseriesPlugin } from "@opendash/plugin-timeseries";
import HypothesisTimeWidget from "./widgets/hypothesis-time";
import "./leaflet.config";

init("opendash", async (factory) => {
  // Icons
  // @ts-ignore
  registerIconPack(await import("@opendash/icons/dist/fa-regular.json"));

  // Translations:

  factory.registerLanguage("en", "English");
  factory.registerLanguage("zh_Hans", "Chinese");
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
  factory.registerTranslationResolver(
    "de",
    "app",
    async () => await import("./translations/app/de.json")
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
  await factory.use(new GTFSPlugin());
  await factory.use(new MIAASPlugin());
  await factory.use(
    new OpenwarePlugin({
      host: "openware.apps.openinc.dev",
      secure: true,
      disableFeature: {
        menu: {
          SensorsGroup: false,
          DataPoints: false,
          DataSources: false,
        },
        slideshow: false,
        dataCollection: false,
        VKPI: false,
        forms: {
          dateBySensor: false,
        },
        reporting: false,
      },
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

  factory.registerStaticNavigationItem({
    id: "admin/parse/item",
    group: "admin/parse",
    place: "frontpage",
    order: 100,
    label: "opendash:admin.label",
    icon: "fa:cogs",
    color: "#676767",
    link: "/admin/parse/_Role",
    routeCondition: "**",
    activeCondition: "/",
    permission: "parse-admin",
  });
  // Widgets
  $monitoring.registerWidget(HypothesisTimeWidget);
}).then((app) => {
  console.log("init open.DASH");
});
