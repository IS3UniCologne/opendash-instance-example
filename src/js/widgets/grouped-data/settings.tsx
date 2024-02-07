import * as React from "react";

import { useDataService } from "@opendash/plugin-timeseries";
import { createWidgetComponent } from "@opendash/plugin-monitoring";
import { Select } from "antd";

import { ConfigInterface } from "./types";

export default createWidgetComponent<ConfigInterface>(
  ({ draft, assignToDraft }) => {
    const DataService = useDataService();
    
    const [datasources, setDatasources] = React.useState<
    {
      value:string;
      label:string
    }[]>([]);
    const [groupKey, setGroupKey] = React.useState<{value:string; label:string}[]>([]);

    React.useEffect(() => {
      async function run() {
        const items = await DataService.list();
        const availableItems = items.filter((item) => item.source.includes('nextbike'));

        setDatasources(
          availableItems.map((item) => {
          return {
            label: item.name,
            value: item.id
          };
        }));
      }

      run();
    }, []);

    

    return (
      <div>
      <div>Select the datasource to be grouped</div>
      <Select
        style={{ width: "100%" }}
        value={draft.datasourceId}
        options={datasources}
        onChange={(value) => {
          assignToDraft({datasourceId: value});
          async function run() {
            const items = await DataService.list();
            const selectedItem = items.filter((item) => item.id === value)[0];
            setGroupKey(selectedItem.valueTypes.map((item) => {
              return {
                label: item.name,
                value: item.name
              };
            }));
          };
          run();
        }}
        />
      <div>Group by</div>
      <Select
        style={{ width: "100%" }}
        value={draft.groupKey}
        options={groupKey}
        onChange={(value) => {
          assignToDraft({groupKey: value});
        }}
        />
      </div>
    );
  }
);
