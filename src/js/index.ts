import "antd/dist/antd.min.css";

import "./parse.config";
import "./highcharts.config";

import { init, StorageAdapterLS } from "@opendash/core";
import { registerIconPack } from "@opendash/icons";
import { ParsePlugin } from "@opendash/plugin-parse";
import { OpenwarePlugin } from "@opendash/plugin-openware";
import { HighchartsPlugin } from "@opendash/plugin-highcharts";

init("opendash", async (factory) => {
  // Icons
  // @ts-ignore
  registerIconPack(await import("@opendash/icons/dist/fa-regular.json"));

  // Translations:

  factory.registerLanguage("en", "English", undefined, true);

  // ant design translations

  factory.registerAntDesignTranslation(
    "en",
    () => import("antd/lib/locale/en_US")
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

  await factory.use(
    new OpenwarePlugin({
      host: "openware.apps.openinc.dev",
      secure: true,
    })
  );

  await factory.use(new HighchartsPlugin());

  // Widgets

  factory.registerWidget(await import("./widgets/example"));
}).then((app) => {
  console.log("init open.DASH");
});
