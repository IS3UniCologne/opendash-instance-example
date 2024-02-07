import * as React from "react";

import { point, featureCollection } from "@turf/helpers";
import { createWidgetComponent } from "@opendash/plugin-monitoring";
import {
  useSource,
  useTranslation,
  useDataItem,
  useDataItemHistory,
  useDataItemValue,
  WidgetConfigError,
} from "@opendash/core";
import { useDataService } from "@opendash/plugin-timeseries";

// Geo Service importieren
// import { Map } from "@opendash/plugin-geo";

import { ConfigInterface } from "./types";

interface StationInterface {
  id: string;
  label: string;
  longitude: number;
  latitude: number;
  state: string;
}

export default createWidgetComponent<ConfigInterface>(
  ({ config, ...context }) => {
    const t = useTranslation();

    const { DataService } = useDataService();

    if (!config.cityItemId) {
      throw new WidgetConfigError("Station needs to be selected");
    }
    const [state, setState] = React.useState<StationInterface[]>([]);

    React.useEffect(() => {
      async function run() {
        const items = await DataService.list();

        const stationItem = items.find(
          (item) =>
            item.source === "uzk_charging_usage_stations" &&
            item.id === config.cityItemId
        );

        if (!stationItem) {
          throw new WidgetConfigError("Station does not exist");
        }

        const value = await DataService.getValue(stationItem);

        // const history = await DataService.fetchDimensionValues(item, 0, {
        //   historyType: "relative",
        //   unit: "week",
        //   value: 1,
        // });

        const geoJson = value.value[0];

        const stations: StationInterface[] = geoJson.features.map(
          (feature: any) => {
            return {
              // todo id
              id: feature.properties.id,
              label: feature.properties.address,
              latitude: parseFloat(feature.geometry.coordinates[1]),
              longitude: parseFloat(feature.geometry.coordinates[0]),
              state: "unknown",
            };
          }
        );

        const stationsMap = Object.fromEntries(
          stations.map((station) => [station.id, station])
        );

        const auslastungItem = items.find(
          (item) =>
            item.source === "uzk_charging_usage" &&
            item.id === config.cityItemId
        );

        if (!auslastungItem) {
          throw new WidgetConfigError("Auslastung does not exist");
        }

        const history = await DataService.fetchValues(auslastungItem, {
          historyType: "relative",
          unit: "minute",
          value: 5,
        });

        for (const { date, value } of history) {
          const [stationsId, ladesäulenId, konnektorId, konnektorStatus] =
            value;

          if (stationsMap[stationsId]) {
            stationsMap[stationsId].state = konnektorStatus;
          }
        }

        console.log(stations);

        setState(stations);
      }

      run();
    }, [config.cityItemId]);

    if (state.length === 0) {
      context.setLoading(true);
    } else {
      context.setLoading(false);
    }

    const map = React.useRef(null); 
    const layer = React.useRef(null);
    const container = React.useRef(null);

    // Karte in div rendern
    React.useEffect(() => {
      if (!container.current) {
        return;
      }

      map.current = L.map(container.current, {
        center: [50.940991, 6.992267],
        zoom: 17,
        layers: [L.tileLayer(...window.leafletTiles)],
      });

      map.current.scrollWheelZoom.disable();
    }, [container]);

    React.useEffect(() => {
      try {
        map.current.invalidateSize();
      } catch (error) {
        // console.error(error);
      }
    }, [map.current, width, height]);

    React.useEffect(() => {
      if (layer.current) {
        layer.current.clearLayers();
      }

      if (!layer.current) {
        layer.current = L.markerClusterGroup();
      }

      if (state.length === 0) {
        return;
      }

      if (layer.current) {
        state.forEach((station) => {
          const latlong = new L.LatLng(station.latitude, station.longitude);
          const marker = L.marker(latlong, {
            title: station.label,
          });

          marker.bindPopup(`${station.label} (${station.state})`);

          layer.current.addLayer(marker);
        });
        console.log("add markers", state);

        map.current.addLayer(layer.current);
      }
    }, [map.current, state]);

    return <div ref={container} style={{ height, width }} />;
  }
);
