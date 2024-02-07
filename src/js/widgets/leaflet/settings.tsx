import * as React from "react";

import { useDataService } from "@opendash/plugin-timeseries";
import { createWidgetComponent } from "@opendash/plugin-monitoring";
import { Select } from "antd";

import { ConfigInterface } from "./types";

export default createWidgetComponent<ConfigInterface>(
  ({ draft, assignToDraft, updateDraft }) => {
    const DataService = useDataService();

    const [cities, setCities] = React.useState<{value: string;label: string;}[]>([]);

    React.useEffect(() => {
      async function run() {
        const items = await DataService.list();
        const stationItems = items.filter(
          (item: { source: string; }) => item.source === "uzk_charging_usage_stations"
        );

        setCities(
          stationItems.map((item: { name: any; id: any; }) => {
            return {
              label: item.name,
              value: item.id,
            };
          })
        );
      }

      run();
    }, []);

    return (
      <Select
        style={{ width: "100%", height: "100%" }}
        value={draft.cityItemId}
        options={cities}
        onChange={(value) => {
          assignToDraft({ cityItemId: value });
        }}
      />
    );
  }
);
