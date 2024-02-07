import React from "react";

import {
  useTranslation,
} from "@opendash/core";
import { useDataService } from "@opendash/plugin-timeseries";
import { Highcharts } from "@opendash/plugin-highcharts";

import { WidgetConfigError, createWidgetComponent } from "@opendash/plugin-monitoring";

import { ConfigInterface } from "./types";

export default createWidgetComponent<ConfigInterface>(
  ({ config, ...context }: { config: ConfigInterface, context: any }) => {
    const t = useTranslation();

    const DataService = useDataService();

    if (!config.datasourceId || !config.groupKey) {
      throw new WidgetConfigError("Datasource id and group key are required");
    }

    const [dataFetch, setDataFetch] = React.useState([]);

    React.useEffect(() => {
      async function run() {
        const items = await DataService.list();
        const trip_items = items.find(
          (item) => item.id === config.datasourceId
          );
        const pos = trip_items.valueTypes.map(e => e.name).indexOf(config.groupKey);
        const history = await DataService.fetchDimensionValues(trip_items, pos, {
          historyType: "relative",
          unit: "week",
          value: 1,
        });
        console.log(history);
        const groupedData = {};
        for (var item in history){
          var name = history[item].value;
          if (name in groupedData){
            groupedData[name] = groupedData[name] + 1;
          }else{
            groupedData[name] = 1;
          }
        }
        setDataFetch(groupedData);
      };
      run();
    }, [config.datasourceId, config.groupKey]);

    const { height, width } = context.useContainerSize();
    const container = React.useRef(null);


    
    if (dataFetch.length === 0) {
      context.setLoading(true);
    } else {
      context.setLoading(false);
    }
    context.setName(t("app:widgets.grouped.title"));


    Highcharts.chart('container', {
      chart: {
          type: 'bar'
      },
      title: {
          text: 'Historic World Population by Region',
          align: 'left'
      },
      subtitle: {
          text: 'Source: <a ' +
              'href="https://en.wikipedia.org/wiki/List_of_continents_and_continental_subregions_by_population"' +
              'target="_blank">Wikipedia.org</a>',
          align: 'left'
      },
      xAxis: {
          categories: ['Africa', 'America', 'Asia', 'Europe'],
          title: {
              text: null
          },
          gridLineWidth: 1,
          lineWidth: 0
      },
      yAxis: {
          min: 0,
          title: {
              text: 'Population (millions)',
              align: 'high'
          },
          labels: {
              overflow: 'justify'
          },
          gridLineWidth: 0
      },
      tooltip: {
          valueSuffix: ' millions'
      },
      plotOptions: {
          bar: {
              borderRadius: '50%',
              dataLabels: {
                  enabled: true
              },
              groupPadding: 0.1
          }
      },
      legend: {
          layout: 'vertical',
          align: 'right',
          verticalAlign: 'top',
          x: -40,
          y: 80,
          floating: true,
          borderWidth: 1,
          backgroundColor:
              Highcharts.defaultOptions.legend.backgroundColor || '#FFFFFF',
          shadow: true
      },
      credits: {
          enabled: false
      },
      series: [{
          name: 'Year 1990',
          data: [631, 727, 3202, 721]
      }, {
          name: 'Year 2000',
          data: [814, 841, 3714, 726]
      }, {
          name: 'Year 2018',
          data: [1276, 1007, 4561, 746]
      }]
  });
  Highcharts.chart('container', {
    chart: {
        type: 'bar'
    },
    title: {
        text: 'Historic World Population by Region',
        align: 'left'
    },
    subtitle: {
        text: 'Source: <a ' +
            'href="https://en.wikipedia.org/wiki/List_of_continents_and_continental_subregions_by_population"' +
            'target="_blank">Wikipedia.org</a>',
        align: 'left'
    },
    xAxis: {
        categories: ['Africa', 'America', 'Asia', 'Europe'],
        title: {
            text: null
        },
        gridLineWidth: 1,
        lineWidth: 0
    },
    yAxis: {
        min: 0,
        title: {
            text: 'Population (millions)',
            align: 'high'
        },
        labels: {
            overflow: 'justify'
        },
        gridLineWidth: 0
    },
    tooltip: {
        valueSuffix: ' millions'
    },
    plotOptions: {
        bar: {
            borderRadius: '50%',
            dataLabels: {
                enabled: true
            },
            groupPadding: 0.1
        }
    },
    legend: {
        layout: 'vertical',
        align: 'right',
        verticalAlign: 'top',
        x: -40,
        y: 80,
        floating: true,
        borderWidth: 1,
        backgroundColor:
            Highcharts.defaultOptions.legend.backgroundColor || '#FFFFFF',
        shadow: true
    },
    credits: {
        enabled: false
    },
    series: [{
        name: 'Year 1990',
        data: [631, 727, 3202, 721]
    }, {
        name: 'Year 2000',
        data: [814, 841, 3714, 726]
    }, {
        name: 'Year 2018',
        data: [1276, 1007, 4561, 746]
    }]
});
  

    // const history = context.useFetchDimensionValues();
    return <div ref={container} style={{ height, width }} />;
  }
);
