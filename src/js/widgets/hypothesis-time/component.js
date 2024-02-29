var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { createWidgetComponent } from "@opendash/plugin-monitoring";
import { useDataService } from "@opendash/plugin-timeseries";
import dayjs from "dayjs";
import ttest2 from '@stdlib/stats/ttest2';
import * as React from "react";
import { Icon } from "@opendash/icons";
import { stringToColor, useTranslation } from "@opendash/core";
import { Card, Divider, Row, Col, Space } from "antd";
import Avatar from "antd/lib/avatar/avatar";
import { getCurrentLanguageSync } from "@opendash/i18n";
import { Button, Select } from "antd";


function get_start_till_end_dict(start, end, exclude_hours = [], only_weekdays = false, only_weekends = false) {
    let start_till_end_dict = {};
    for (let i = start; i < end; i = dayjs(i).add(1, 'hour').valueOf()) {
        if (exclude_hours.includes(dayjs(i).hour())
            || (only_weekdays && ((dayjs(i).day() === 0) || (dayjs(i).day() === 6)))
            || (only_weekends && (dayjs(i).day() !== 0) && (dayjs(i).day() !== 6))) {
            continue;
        }
        start_till_end_dict[i] = 0;
    }
    return start_till_end_dict;
}


function get_exclude_hours(start, end) {
    let exclude_hours = [];
    let i = end + 1;
    while (i != start) {
        exclude_hours.push(i);
        i = (i + 1) % 24;
    }
    return exclude_hours;
}


function get_trip_counts(series, start, end, exclude_hours = [], only_weekdays = false, only_weekends = false) {
    let trip_counts = get_start_till_end_dict(start, end, exclude_hours, only_weekdays, only_weekends);
    series.forEach(({ date, value }) => {
        const key = dayjs(date).startOf('hour').valueOf();
        if (key in trip_counts) {
            trip_counts[key] = trip_counts[key] + 1;
        }
    });
    return Object.values(trip_counts);
}

export default createWidgetComponent((_a) => {
    var { config, draft } = _a, context = __rest(_a, ["config", "draft"]);
    const t = useTranslation();
    const DataService = useDataService();
    context.setName(t(`app:widgets.hypothesis.headers.${draft.type}`, {
        name: context
            .useItemDimensionConfig()
            .map(([item, dimension]) => DataService.getItemName(item, dimension))
            .join(", "),
    }));
    const selectedUnit = draft.unit || "day";
    const selectedAggregationInterval = draft.aggregationInterval || "hour";
    const { width, height } = context.useContainerSize();
    const [[item, dimension]] = context.useItemDimensionConfig();
    const [chartConfig, setChartConfig] = React.useState({ 'title': '', "extra_text": '' });
    React.useEffect(() => {
        if (!draft.a_selection || !draft.b_selection) {
            context.updateDraft((current) => {
                start_a = dayjs()
                    .locale(getCurrentLanguageSync())
                    .startOf(selectedUnit)
                    .valueOf();
                end_a = dayjs(start_a)
                    .locale(getCurrentLanguageSync())
                    .endOf(selectedUnit)
                    .valueOf();
                start_b = dayjs(start_a)
                    .locale(getCurrentLanguageSync())
                    .subtract(1, selectedUnit)
                    .startOf(selectedUnit)
                    .valueOf();
                end_b = dayjs(start_b)
                    .locale(getCurrentLanguageSync())
                    .endOf(selectedUnit)
                    .valueOf();
                current.a_selection = { start: start_a, end: end_a };
                current.b_selection = { start: start_b, end: end_b };
            });
        }
        else {
            context.saveDraft();
            Promise.all([
                DataService.fetchDimensionValuesMultiItem([[item, dimension]], {
                    historyType: "absolute",
                    start: draft.a_selection.start,
                    end: draft.a_selection.end,
                    // aggregationOperation: "count",
                    // aggregationDateUnit: draft.unit,
                }),
                DataService.fetchDimensionValuesMultiItem([[item, dimension]], {
                    historyType: "absolute",
                    start: draft.b_selection.start,
                    end: draft.b_selection.end,
                    // aggregationOperation: "count",
                    // aggregationDateUnit: draft.unit,
                }),
            ]).then(([historyA, historyB]) => {
                const units = Object.fromEntries([historyA, historyB].flatMap((history) => history.map(([item, dimension]) => {
                    return [
                        item.valueTypes[dimension].name +
                        item.valueTypes[dimension].unit,
                        item.valueTypes[dimension],
                    ];
                })));
                const series = [
                    ...historyA.map(([item, dimension, values]) => {
                        if (draft.type === 'weekendgeo') {
                            return get_trip_counts(values, draft.a_selection.start, draft.a_selection.end, [], true, false);
                        } else if (draft.type === 'timeintervalgeo') {
                            const exclude_hours = get_exclude_hours(draft.a_start_hour, draft.a_end_hour);
                            return get_trip_counts(values, draft.a_selection.start, draft.a_selection.end, exclude_hours, false, false);
                        } else {
                            return get_trip_counts(values, draft.a_selection.start, draft.a_selection.end);
                        }
                    }),
                    ...historyB.map(([item, dimension, values]) => {
                        if (draft.type === 'weekendgeo') {
                            return get_trip_counts(values, draft.b_selection.start, draft.b_selection.end, [], false, true);
                        } else if (draft.type === 'timeintervalgeo') {
                            const exclude_hours = get_exclude_hours(draft.b_start_hour, draft.b_end_hour);
                            return get_trip_counts(values, draft.b_selection.start, draft.b_selection.end, exclude_hours, false, false);
                        } else {
                            return get_trip_counts(values, draft.b_selection.start, draft.b_selection.end);
                        }
                    }),
                ];
                const test_result = ttest2(series[0], series[1]);
                const level = test_result.pValue < 0.01 ? 'high_confidence' : test_result.pValue < 0.05 ? 'low_confidence' : 'not_rejected';
                const extracted_result = {
                    'title': t(`app:widgets.hypothesis.results.${level}`),
                    'color': level === 'high_confidence' ? '#e6a23c' : level === 'low_confidence' ? '#409eff' : '#67c23a',
                    'nObs_a': series[0].length,
                    'nObs_b': series[1].length,
                    'mean_a': test_result.xmean.toFixed(2),
                    'mean_b': test_result.ymean.toFixed(2),
                    'pvalue': test_result.pValue.toFixed(3),
                    'statistic': test_result.statistic.toFixed(2)
                }
                setChartConfig(extracted_result);
                context.setLoading(false);
            });
        }
    }, [draft.unit, draft.a_selection, draft.b_selection]);
    return (React.createElement(React.Fragment, null,
        React.createElement("div", {
            style: {
                height: 40,
                lineHeight: "40px",
                borderBottom: "1px solid #d9d9d9",
            }
        },
            React.createElement("div", {
                style: {
                    float: "left",
                    width: "33%",
                    padding: "0 20px",
                    textAlign: "center",
                }
            },
                React.createElement("span", null, t("app:widgets.hypothesis.comparison_description"))),
            React.createElement("div", {
                style: {
                    float: "left",
                    width: "33%",
                    padding: "0 20px",
                    textAlign: "center",
                }
            },
                React.createElement("span", null,
                    draft.a_title ? draft.a_title : t("highcharts:compare.a"),
                    ": ",
                    formatDateSelection('day', draft.a_selection.start),
                    " - ",
                    formatDateSelection('day', draft.a_selection.end))),
            React.createElement("div", {
                style: {
                    float: "left",
                    width: "33%",
                    padding: "0 20px",
                    textAlign: "center",
                }
            },
                React.createElement("span", null,
                    draft.b_title ? draft.b_title : t("highcharts:compare.b"),
                    ": ",
                    formatDateSelection('day', draft.b_selection.start),
                    " - ",
                    formatDateSelection('day', draft.b_selection.end)),
            )),
        React.createElement("div", { style: { height: "100%" } },
            React.createElement(Card, null,
                React.createElement(Row, { gutter: 16 },
                    React.createElement(Col, { span: 4 }, React.createElement(Avatar, {
                        size: 64, style: {
                            backgroundColor: chartConfig.color,
                            verticalAlign: "middle",
                        }
                    }, '')
                    ),
                    React.createElement(Col, { span: 20 },
                        React.createElement(Space, { direction: "vertical" },
                            React.createElement("span", { style: { fontSize: "16px" } }, t("app:widgets.hypothesis.result_type"), React.createElement("span", { style: { fontWeight: "bold", fontSize: "16px" } }, t(`app:widgets.hypothesis.${draft.type}`))),
                            React.createElement("span", { style: { fontSize: "16px" } }, t("app:widgets.hypothesis.result_descriptor"), React.createElement("span", { style: { fontWeight: "bold", fontSize: "16px" } }, chartConfig.title))
                        ),
                    )),
                React.createElement(Divider, null),
                React.createElement(Row, { gutter: 16, justify: "space-around", style: { color: "grey" } },
                    React.createElement(Col, { span: 24, style: { textAlign: "center", fontWeight: "bold" } }, t("app:widgets.hypothesis.results.details")),
                    React.createElement(Col, { span: 8 }, React.createElement(Space, { direction: "vertical" },
                        React.createElement("span", { style: { fontWeight: "bold" } }, draft.a_title ? draft.a_title : t("highcharts:compare.a")),
                        React.createElement("span", null, t("app:widgets.hypothesis.results.nobs"), ": ", chartConfig.nObs_a)),
                        React.createElement("span", null, t("app:widgets.hypothesis.results.mean"), ": ", chartConfig.mean_a)
                    ),
                    React.createElement(Col, { span: 8 }, React.createElement(Space, { direction: "vertical" },
                        React.createElement("span", { style: { fontWeight: "bold" } }, draft.b_title ? draft.b_title : t("highcharts:compare.b")),
                        React.createElement("span", null, t("app:widgets.hypothesis.results.nobs"), ": ", chartConfig.nObs_b)),
                        React.createElement("span", null, t("app:widgets.hypothesis.results.mean"), ": ", chartConfig.mean_b))
                    ,
                    React.createElement(Col, { span: 24, style: { textAlign: "center" } }, t("app:widgets.hypothesis.results.pvalue"), ": ", chartConfig.pvalue, ", ", t("app:widgets.hypothesis.results.statistic"), ": ", chartConfig.statistic)),
            ))
    ));
});
function formatter(opts, key, x, selectedUnit) {
    var _a;
    var date = selectedUnit === "hour"
        ? // @ts-ignore
        Highcharts.dateFormat("%H:%M:%S", key)
        : selectedUnit === "day"
            ? // @ts-ignore
            Highcharts.dateFormat("%H:%M:%S", key)
            : selectedUnit === "week"
                ? // @ts-ignore
                Highcharts.dateFormat("%A, %H:%M:%S", key)
                : selectedUnit === "year"
                    ? // @ts-ignore
                    Highcharts.dateFormat("%d.%m.%Y %H:%M:%S", key)
                    : // @ts-ignore
                    Highcharts.dateFormat("%d.%m.%Y %H:%M:%S", key);
    var s = "<div class='eud-tooltip-time'>" + "<b>" + date;
    ("</b>");
    let series = opts.chart.series;
    for (let index in series) {
        let serie = series[index];
        if (serie.name.indexOf("Navigator") == 0 || !serie.visible)
            continue;
        let i2Use = findLastIndex(serie.data, 0, serie.data.length - 1, x, "x");
        try {
            // console.log("CHECK THINGS");
            // console.log(serie);
            // console.log(opts);
            if (i2Use !== -1) {
                /*
                if (index === "0" || series.length == 1) {
                  serie.data[i2Use].select();
                } else {
                  serie.data[i2Use].select(true, true);
                }*/
                const fp = parseFloat(serie.data[i2Use]["y"]) % 1;
                const fpprecision = fp === 0
                    ? 2
                    : Math.min(20, Math.max(2, Math.ceil(Math.abs(Math.log10(fp)))));
                s +=
                    '<br/><span style="color:' +
                    serie.color +
                    '">\u25CF</span>: ' +
                    serie.name +
                    ": " +
                    (isNaN(parseFloat(serie.data[i2Use]["y"]))
                        ? serie.data[i2Use]["y"]
                        : serie.data[i2Use]["y"].toFixed(fpprecision)) +
                    " " +
                    (((_a = opts.chart.options.series[index]) === null || _a === void 0 ? void 0 : _a.unit) || "");
            }
        }
        catch (e) {
            console.error(e);
        }
    }
    s += "</div>";
    return s;
}
const findLastIndex = (reihe, start, end, ts, searchKey) => {
    try {
        let midIndex = Math.floor((end + start) / 2);
        if (!reihe[midIndex])
            return -1;
        if (reihe[midIndex][searchKey] === ts)
            return midIndex;
        if (reihe[start][searchKey] > ts)
            return -1;
        if (reihe[end][searchKey] < ts)
            return end;
        if (reihe[start][searchKey] > ts)
            return -1;
        if (reihe[end][searchKey] < ts)
            return end;
        return Math.max(findLastIndex(reihe, start, midIndex, ts, searchKey), findLastIndex(reihe, midIndex + 1, end, ts, searchKey));
    }
    catch (e) { }
};
function formatDateTooltip(time) {
    return dayjs(time).format("dddd, MMMM Do, HH:mm:ss");
}
function formatDateSelection(unit, time) {
    switch (unit) {
        case "minute":
            return dayjs(time).format("HH:mm, DD.MM.YYYY");
        case "hour":
            return dayjs(time).format("HH, DD.MM.YYYY");
        case "day":
            return dayjs(time).format("DD.MM.YYYY");
        case "week":
            return dayjs(time).format("W, YYYY");
        case "month":
            return dayjs(time).format("MMMM, YYYY");
        case "year":
        default:
            return dayjs(time).format("YYYY");
    }
}
function formatDateXAxis(unit, time) {
    switch (unit) {
        case "minute":
            return dayjs(time).format("ss");
        case "hour":
            return dayjs(time).format("mm:ss");
        case "day":
            return dayjs(time).format("HH:mm");
        case "week":
            return dayjs(time).format("dddd, HH:mm:ss");
        case "month":
            return dayjs(time).format("dddd, Do, HH:mm:ss");
        case "year":
        default:
            return dayjs(time).format("dddd, MMMM Do, HH:mm:ss");
    }
}
function flattenDate(unit, time) {
    let date = dayjs(time);
    if (unit === "minute") {
        date = date.set("minute", 0);
        date = date.set("hour", 0);
        date = date.set("day", 0);
        date = date.set("month", 0);
        date = date.set("year", 0);
    }
    if (unit === "hour") {
        date = date.set("hour", 0);
        date = date.set("day", 0);
        date = date.set("month", 0);
        date = date.set("year", 0);
    }
    if (unit === "day") {
        date = date.dayOfYear(1);
        date = date.set("day", 1);
        date = date.set("month", 0);
        date = date.set("year", 2000);
    }
    if (unit === "week") {
        date = date.isoWeek(0);
    }
    if (unit === "month") {
        date = date.set("month", 0);
        date = date.set("year", 0);
    }
    if (unit === "year") {
        date = date.set("year", 2000);
    }
    return date.valueOf();
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcG9uZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL3dpZGdldHMvaGMtdGltZXNlcmllcy1jb21wYXJlL2NvbXBvbmVudC50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFBQSxPQUFPLEVBQUUscUJBQXFCLEVBQUUsTUFBTSw2QkFBNkIsQ0FBQztBQUNwRSxPQUFPLEVBQUUsY0FBYyxFQUFFLE1BQU0sNkJBQTZCLENBQUM7QUFDN0QsT0FBTyxLQUFLLE1BQU0sT0FBTyxDQUFDO0FBQzFCLE9BQU8sS0FBSyxLQUFLLE1BQU0sT0FBTyxDQUFDO0FBSS9CLE9BQU8sRUFBRSxJQUFJLEVBQUUsTUFBTSxpQkFBaUIsQ0FBQztBQUV2QyxPQUFPLEVBQUUsYUFBYSxFQUFFLGNBQWMsRUFBRSxNQUFNLGdCQUFnQixDQUFDO0FBRS9ELE9BQU8sRUFBRSxlQUFlLEVBQUUsTUFBTSxPQUFPLENBQUM7QUFFeEMsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsTUFBTSxNQUFNLENBQUM7QUFHdEMsZUFBZSxxQkFBcUIsQ0FDbEMsQ0FBQyxFQUE2QixFQUFFLEVBQUU7UUFBakMsRUFBRSxNQUFNLEVBQUUsS0FBSyxPQUFjLEVBQVQsT0FBTyxjQUEzQixtQkFBNkIsQ0FBRjtJQUMxQixNQUFNLENBQUMsR0FBRyxjQUFjLEVBQUUsQ0FBQztJQUUzQixNQUFNLFdBQVcsR0FBRyxjQUFjLEVBQUUsQ0FBQztJQUVyQyxPQUFPLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQzFCLE9BQU8sQ0FBQyxPQUFPLENBQ2IsQ0FBQyxDQUFDLG9DQUFvQyxFQUFFO1FBQ3RDLElBQUksRUFBRSxPQUFPO2FBQ1Ysc0JBQXNCLEVBQUU7YUFDeEIsR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLEVBQUUsRUFBRSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FB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SSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN6QixJQUFJLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDMUIsSUFBSSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQzVCLElBQUksR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztLQUMvQjtJQUVELElBQUksSUFBSSxLQUFLLE1BQU0sRUFBRTtRQUNuQixJQUFJLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQztLQUN4QjtJQUVELElBQUksSUFBSSxLQUFLLE9BQU8sRUFBRTtRQUNwQixJQUFJLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDNUIsSUFBSSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO0tBQzVCO0lBRUQsSUFBSSxJQUFJLEtBQUssTUFBTSxFQUFFO1FBQ25CLElBQUksR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztLQUMvQjtJQUVELE9BQU8sSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO0FBQ3hCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBjcmVhdGVXaWRnZXRDb21wb25lbnQgfSBmcm9tIFwiQG9wZW5kYXNoL3BsdWdpbi1tb25pdG9yaW5nXCI7XG5pbXBvcnQgeyB1c2VEYXRhU2VydmljZSB9IGZyb20gXCJAb3BlbmRhc2gvcGx1Z2luLXRpbWVzZXJpZXNcIjtcbmltcG9ydCBkYXlqcyBmcm9tIFwiZGF5anNcIjtcbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gXCJyZWFjdFwiO1xuXG5pbXBvcnQgeyBPcHRpb25zIH0gZnJvbSBcImhpZ2hjaGFydHNcIjtcblxuaW1wb3J0IHsgSWNvbiB9IGZyb20gXCJAb3BlbmRhc2gvaWNvbnNcIjtcblxuaW1wb3J0IHsgc3RyaW5nVG9Db2xvciwgdXNlVHJhbnNsYXRpb24gfSBmcm9tIFwiQG9wZW5kYXNoL2NvcmVcIjtcblxuaW1wb3J0IHsgSGlnaGNoYXJ0c0NoYXJ0IH0gZnJvbSBcIi4uLy4uXCI7XG5cbmltcG9ydCB7IEJ1dHRvbiwgU2VsZWN0IH0gZnJvbSBcImFudGRcIjtcbmltcG9ydCB7IENvbmZpZ0ludGVyZmFjZSB9IGZyb20gXCIuL3R5cGVzXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGNyZWF0ZVdpZGdldENvbXBvbmVudDxDb25maWdJbnRlcmZhY2U+KFxuICAoeyBjb25maWcsIGRyYWZ0LCAuLi5jb250ZXh0IH0pID0+IHtcbiAgICBjb25zdCB0ID0gdXNlVHJhbnNsYXRpb24oKTtcblxuICAgIGNvbnN0IERhdGFTZXJ2aWNlID0gdXNlRGF0YVNlcnZpY2UoKTtcblxuICAgIGNvbnRleHQuc2V0TG9hZGluZyhmYWxzZSk7XG4gICAgY29udGV4dC5zZXROYW1lKFxuICAgICAgdChcImhpZ2hjaGFydHM6bmFtZS50aW1lc2VyaWVzX2NvbXBhcmVcIiwge1xuICAgICAgICBuYW1lOiBjb250ZXh0XG4gICAgICAgICAgLnVzZUl0ZW1EaW1lbnNpb25Db25maWcoKVxuICAgICAgICAgIC5tYXAoKFtpdGVtLCBkaW1lbnNpb25dKSA9PiBEYXRhU2VydmljZS5nZXRJdGVtTmFtZShpdGVtLCBkaW1lbnNpb24pKVxuICAgICAgICAgIC5qb2luKFwiLCBcIiksXG4gICAgICB9KVxuICAgICk7XG5cbiAgICBjb25zdCBzZWxlY3RlZFVuaXQgPSBkcmFmdC51bml0IHx8IFwiZGF5XCI7XG5cbiAgICBjb25zdCB7IHdpZHRoLCBoZWlnaHQgfSA9IGNvbnRleHQudXNlQ29udGFpbmVyU2l6ZSgpO1xuXG4gICAgY29uc3QgW1tpdGVtLCBkaW1lbnNpb25dXSA9IGNvbnRleHQudXNlSXRlbURpbWVuc2lvbkNvbmZpZygpO1xuXG4gICAgY29uc3QgW2NoYXJ0Q29uZmlnLCBzZXRDaGFydENvbmZpZ10gPSBSZWFjdC51c2VTdGF0ZTxPcHRpb25zPihudWxsKTtcblxuICAgIFJlYWN0LnVzZUVmZmVjdCgoKSA9PiB7XG4gICAgICBpZiAoIWRyYWZ0LnN0YXJ0X2EgfHwgIWRyYWZ0LmVuZF9hIHx8ICFkcmFmdC5zdGFydF9iIHx8ICFkcmFmdC5lbmRfYikge1xuICAgICAgICBjb250ZXh0LnVwZGF0ZURyYWZ0KChjdXJyZW50KSA9PiB7XG4gICAgICAgICAgY3VycmVudC5zdGFydF9hID0gZGF5anMoKS5zdGFydE9mKGN1cnJlbnQudW5pdCkudmFsdWVPZigpO1xuICAgICAgICAgIGN1cnJlbnQuZW5kX2EgPSBkYXlqcyhjdXJyZW50LnN0YXJ0X2EpLmVuZE9mKGN1cnJlbnQudW5pdCkudmFsdWVPZigpO1xuICAgICAgICAgIGN1cnJlbnQuc3RhcnRfYiA9IGRheWpzKGN1cnJlbnQuc3RhcnRfYSlcbiAgICAgICAgICAgIC5zdWJ0cmFjdCgxLCBjdXJyZW50LnVuaXQpXG4gICAgICAgICAgICAuc3RhcnRPZihjdXJyZW50LnVuaXQpXG4gICAgICAgICAgICAudmFsdWVPZigpO1xuICAgICAgICAgIGN1cnJlbnQuZW5kX2IgPSBkYXlqcyhjdXJyZW50LnN0YXJ0X2IpLmVuZE9mKGN1cnJlbnQudW5pdCkudmFsdWVPZigpO1xuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnRleHQuc2F2ZURyYWZ0KCk7XG5cbiAgICAgICAgUHJvbWlzZS5hbGwoW1xuICAgICAgICAgIERhdGFTZXJ2aWNlLmZldGNoRGltZW5zaW9uVmFsdWVzTXVsdGlJdGVtKFtbaXRlbSwgZGltZW5zaW9uXV0sIHtcbiAgICAgICAgICAgIGhpc3RvcnlUeXBlOiBcImFic29sdXRlXCIsXG4gICAgICAgICAgICBzdGFydDogZHJhZnQuc3RhcnRfYSxcbiAgICAgICAgICAgIGVuZDogZHJhZnQuZW5kX2EsXG5cbiAgICAgICAgICAgIHJlc29sdXRpb246IHRydWUsXG4gICAgICAgICAgICByZXNvbHV0aW9uTW9kZTogXCJtaW5tYXhcIixcbiAgICAgICAgICAgIHJlc29sdXRpb25NYXhWYWx1ZXM6IE1hdGguZmxvb3Iod2lkdGggLyAyKSxcbiAgICAgICAgICB9KSxcblxuICAgICAgICAgIERhdGFTZXJ2aWNlLmZldGNoRGltZW5zaW9uVmFsdWVzTXVsdGlJdGVtKFtbaXRlbSwgZGltZW5zaW9uXV0sIHtcbiAgICAgICAgICAgIGhpc3RvcnlUeXBlOiBcImFic29sdXRlXCIsXG4gICAgICAgICAgICBzdGFydDogZHJhZnQuc3RhcnRfYixcbiAgICAgICAgICAgIGVuZDogZHJhZnQuZW5kX2IsXG5cbiAgICAgICAgICAgIHJlc29sdXRpb246IHRydWUsXG4gICAgICAgICAgICByZXNvbHV0aW9uTW9kZTogXCJtaW5tYXhcIixcbiAgICAgICAgICAgIHJlc29sdXRpb25NYXhWYWx1ZXM6IE1hdGguZmxvb3Iod2lkdGggLyAyKSxcbiAgICAgICAgICB9KSxcbiAgICAgICAgXSkudGhlbigoW2hpc3RvcnlBLCBoaXN0b3J5Ql0pID0+IHtcbiAgICAgICAgICBjb25zdCB1bml0cyA9IE9iamVjdC5mcm9tRW50cmllcyhcbiAgICAgICAgICAgIFtoaXN0b3J5QSwgaGlzdG9yeUJdLmZsYXRNYXAoKGhpc3RvcnkpID0+XG4gICAgICAgICAgICAgIGhpc3RvcnkubWFwKChbaXRlbSwgZGltZW5zaW9uXSkgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICAgICAgICBpdGVtLnZhbHVlVHlwZXNbZGltZW5zaW9uXS5uYW1lICtcbiAgICAgICAgICAgICAgICAgICAgaXRlbS52YWx1ZVR5cGVzW2RpbWVuc2lvbl0udW5pdCxcbiAgICAgICAgICAgICAgICAgIGl0ZW0udmFsdWVUeXBlc1tkaW1lbnNpb25dLFxuICAgICAgICAgICAgICAgIF07XG4gICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICApXG4gICAgICAgICAgKTtcblxuICAgICAgICAgIGNvbnN0IHNlcmllcyA9IFtcbiAgICAgICAgICAgIC4uLmhpc3RvcnlBLm1hcCgoW2l0ZW0sIGRpbWVuc2lvbiwgdmFsdWVzXSkgPT4ge1xuICAgICAgICAgICAgICBjb25zdCB2YWx1ZVR5cGUgPSBpdGVtLnZhbHVlVHlwZXNbZGltZW5zaW9uXTtcbiAgICAgICAgICAgICAgY29uc3QgdW5pdCA9IHVuaXRzW3ZhbHVlVHlwZS5uYW1lICsgdmFsdWVUeXBlLnVuaXRdO1xuXG4gICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgbmFtZTogYCR7dChcImhpZ2hjaGFydHM6Y29tcGFyZS5hXCIpfTogJHtpdGVtLm5hbWV9ICgke1xuICAgICAgICAgICAgICAgICAgdmFsdWVUeXBlLm5hbWVcbiAgICAgICAgICAgICAgICB9KWAsXG4gICAgICAgICAgICAgICAgdW5pdDogYCR7dmFsdWVUeXBlLnVuaXR9YCxcbiAgICAgICAgICAgICAgICBjb2xvcjogc3RyaW5nVG9Db2xvcihpdGVtLmlkICsgXCJhYWFhXCIpLFxuICAgICAgICAgICAgICAgIHR5cGU6IGNvbmZpZy50eXBlLFxuICAgICAgICAgICAgICAgIHlBeGlzOiBPYmplY3QudmFsdWVzKHVuaXRzKS5pbmRleE9mKHVuaXQpLFxuICAgICAgICAgICAgICAgIGRhdGE6IHZhbHVlcy5tYXAoKHgpID0+IFtcbiAgICAgICAgICAgICAgICAgIGZsYXR0ZW5EYXRlKHNlbGVjdGVkVW5pdCwgeC5kYXRlKSxcbiAgICAgICAgICAgICAgICAgIHgudmFsdWUsXG4gICAgICAgICAgICAgICAgICAvL19kYXRlOiB4LmRhdGUsXG4gICAgICAgICAgICAgICAgXSksXG4gICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9KSxcblxuICAgICAgICAgICAgLi4uaGlzdG9yeUIubWFwKChbaXRlbSwgZGltZW5zaW9uLCB2YWx1ZXNdKSA9PiB7XG4gICAgICAgICAgICAgIGNvbnN0IHZhbHVlVHlwZSA9IGl0ZW0udmFsdWVUeXBlc1tkaW1lbnNpb25dO1xuICAgICAgICAgICAgICBjb25zdCB1bml0ID0gdW5pdHNbdmFsdWVUeXBlLm5hbWUgKyB2YWx1ZVR5cGUudW5pdF07XG5cbiAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBuYW1lOiBgJHt0KFwiaGlnaGNoYXJ0czpjb21wYXJlLmJcIil9OiAke2l0ZW0ubmFtZX0gKCR7XG4gICAgICAgICAgICAgICAgICB2YWx1ZVR5cGUubmFtZVxuICAgICAgICAgICAgICAgIH0pYCxcbiAgICAgICAgICAgICAgICBjb2xvcjogc3RyaW5nVG9Db2xvcihpdGVtLmlkICsgXCJiYmJiXCIpLFxuICAgICAgICAgICAgICAgIHVuaXQ6IGAke3ZhbHVlVHlwZS51bml0fWAsXG4gICAgICAgICAgICAgICAgdHlwZTogY29uZmlnLnR5cGUsXG4gICAgICAgICAgICAgICAgeUF4aXM6IE9iamVjdC52YWx1ZXModW5pdHMpLmluZGV4T2YodW5pdCksXG4gICAgICAgICAgICAgICAgZGF0YTogdmFsdWVzLm1hcCgoeCkgPT4gW1xuICAgICAgICAgICAgICAgICAgZmxhdHRlbkRhdGUoc2VsZWN0ZWRVbml0LCB4LmRhdGUpLFxuICAgICAgICAgICAgICAgICAgeC52YWx1ZSxcbiAgICAgICAgICAgICAgICAgIC8vX2RhdGU6IHguZGF0ZSxcbiAgICAgICAgICAgICAgICBdKSxcbiAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgIF07XG5cbiAgICAgICAgICBjb25zdCByZXN1bHQ6IE9wdGlvbnMgPSB7XG4gICAgICAgICAgICB0aXRsZTogbnVsbCxcbiAgICAgICAgICAgIHN1YnRpdGxlOiBudWxsLFxuXG4gICAgICAgICAgICBjaGFydDoge1xuICAgICAgICAgICAgICB6b29tVHlwZTogXCJ4XCIsXG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICB4QXhpczoge1xuICAgICAgICAgICAgICB0aXRsZToge1xuICAgICAgICAgICAgICAgIHRleHQ6IG51bGwsXG4gICAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgICAgdHlwZTogXCJkYXRldGltZVwiLFxuXG4gICAgICAgICAgICAgIGxhYmVsczoge1xuICAgICAgICAgICAgICAgIGZvcm1hdHRlcjogZnVuY3Rpb24gZm9ybWF0TGFiZWxzKCkge1xuICAgICAgICAgICAgICAgICAgcmV0dXJuIGZvcm1hdERhdGVYQXhpcyhzZWxlY3RlZFVuaXQsIHRoaXMudmFsdWUgYXMgbnVtYmVyKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgeUF4aXM6IE9iamVjdC52YWx1ZXModW5pdHMpLm1hcCgodW5pdCkgPT4gKHtcbiAgICAgICAgICAgICAgdGl0bGU6IHtcbiAgICAgICAgICAgICAgICB0ZXh0OiBgJHt1bml0Lm5hbWV9ICgke3VuaXQudW5pdH0pYCxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgbGFiZWxzOiB7XG4gICAgICAgICAgICAgICAgZm9ybWF0OiBcInt2YWx1ZX1cIiArIHVuaXQudW5pdCxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0pKSxcblxuICAgICAgICAgICAgbGVnZW5kOiB7XG4gICAgICAgICAgICAgIGVuYWJsZWQ6IHRydWUsXG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICB0b29sdGlwOiB7XG4gICAgICAgICAgICAgIHNoYWRvdzogZmFsc2UsXG4gICAgICAgICAgICAgIGJvcmRlcldpZHRoOiAwLFxuICAgICAgICAgICAgICBib3JkZXJDb2xvcjogXCJyZ2JhKDEwMCwxMDAsMTAwLDAuNSlcIixcbiAgICAgICAgICAgICAgYmFja2dyb3VuZENvbG9yOiBcInJnYmEoMjUwLDI1MCwyNTAsMSlcIixcbiAgICAgICAgICAgICAgLy9mb3JtYXR0ZXI6IGZvcm1hdHRlcixcbiAgICAgICAgICAgICAgZm9ybWF0dGVyOiBmdW5jdGlvbiBmb3JtYXRUb29sdGlwKGUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZm9ybWF0dGVyKGUsIHRoaXMua2V5LCB0aGlzLngsIHNlbGVjdGVkVW5pdCk7XG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY3JlZGl0czoge1xuICAgICAgICAgICAgICBlbmFibGVkOiBmYWxzZSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwbG90T3B0aW9uczoge1xuICAgICAgICAgICAgICBzZXJpZXM6IHtcbiAgICAgICAgICAgICAgICBlbmFibGVNb3VzZVRyYWNraW5nOiB0cnVlLFxuICAgICAgICAgICAgICAgIGFuaW1hdGlvbjogZmFsc2UsXG4gICAgICAgICAgICAgICAgbWFya2VyOiB7XG4gICAgICAgICAgICAgICAgICBlbmFibGVkOiB0cnVlLCAvL2NvbmZpZy50eXBlID09IFwic2NhdHRlclwiID8gdHJ1ZSA6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgcmFkaXVzOiAwLjEsXG4gICAgICAgICAgICAgICAgICBzdGF0ZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgaG92ZXI6IHtcbiAgICAgICAgICAgICAgICAgICAgICBlbmFibGVkOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgc2VsZWN0OiB7XG4gICAgICAgICAgICAgICAgICAgICAgZW5hYmxlZDogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICByYWRpdXM6IDUsXG4gICAgICAgICAgICAgICAgICAgICAgLy9AdHMtaWdub3JlXG4gICAgICAgICAgICAgICAgICAgICAgZmlsbENvbG9yOiBIaWdoY2hhcnRzLmNvbG9yWzBdLFxuICAgICAgICAgICAgICAgICAgICAgIC8vQHRzLWlnbm9yZVxuICAgICAgICAgICAgICAgICAgICAgIGxpbmVDb2xvcjogSGlnaGNoYXJ0cy5jb2xvclswXSxcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBzdGF0ZXM6IHtcbiAgICAgICAgICAgICAgICAgIGhvdmVyOiB7XG4gICAgICAgICAgICAgICAgICAgIGVuYWJsZWQ6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgIGluYWN0aXZlOiB7XG4gICAgICAgICAgICAgICAgICAgIG9wYWNpdHk6IDEsXG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIHNjYXR0ZXI6IHtcbiAgICAgICAgICAgICAgICBtYXJrZXI6IHtcbiAgICAgICAgICAgICAgICAgIHJhZGl1czogNSxcbiAgICAgICAgICAgICAgICAgIHN0YXRlczoge1xuICAgICAgICAgICAgICAgICAgICBob3Zlcjoge1xuICAgICAgICAgICAgICAgICAgICAgIGVuYWJsZWQ6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgbGluZUNvbG9yOiBcInJnYigxMDAsMTAwLDEwMClcIixcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBzdGF0ZXM6IHtcbiAgICAgICAgICAgICAgICAgIGhvdmVyOiB7fSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgc2VyaWVzLFxuICAgICAgICAgIH07XG5cbiAgICAgICAgICBzZXRDaGFydENvbmZpZyhyZXN1bHQpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9LCBbZHJhZnQudW5pdCwgZHJhZnQuc3RhcnRfYSwgZHJhZnQuZW5kX2EsIGRyYWZ0LnN0YXJ0X2IsIGRyYWZ0LmVuZF9iXSk7XG5cbiAgICByZXR1cm4gKFxuICAgICAgPD5cbiAgICAgICAgPGRpdlxuICAgICAgICAgIHN0eWxlPXt7XG4gICAgICAgICAgICBoZWlnaHQ6IDQwLFxuICAgICAgICAgICAgbGluZUhlaWdodDogXCI0MHB4XCIsXG4gICAgICAgICAgICBib3JkZXJCb3R0b206IFwiMXB4IHNvbGlkICNkOWQ5ZDlcIixcbiAgICAgICAgICB9fVxuICAgICAgICA+XG4gICAgICAgICAgPGRpdlxuICAgICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgICAgZmxvYXQ6IFwibGVmdFwiLFxuICAgICAgICAgICAgICB3aWR0aDogXCIzMyVcIixcbiAgICAgICAgICAgICAgcGFkZGluZzogXCIwIDIwcHhcIixcbiAgICAgICAgICAgICAgdGV4dEFsaWduOiBcImNlbnRlclwiLFxuICAgICAgICAgICAgfX1cbiAgICAgICAgICA+XG4gICAgICAgICAgICA8c3Bhbj57dChcImhpZ2hjaGFydHM6Y29tcGFyZS51bml0XCIpfTwvc3Bhbj5cbiAgICAgICAgICAgIDxTZWxlY3RcbiAgICAgICAgICAgICAgc3R5bGU9e3sgbWFyZ2luTGVmdDogMTAgfX1cbiAgICAgICAgICAgICAgdmFsdWU9e3NlbGVjdGVkVW5pdH1cbiAgICAgICAgICAgICAgb25DaGFuZ2U9eyh1bml0KSA9PiB7XG4gICAgICAgICAgICAgICAgY29udGV4dC51cGRhdGVEcmFmdCgoY3VycmVudCkgPT4ge1xuICAgICAgICAgICAgICAgICAgY3VycmVudC51bml0ID0gdW5pdDtcbiAgICAgICAgICAgICAgICAgIGN1cnJlbnQuc3RhcnRfYSA9IDA7XG4gICAgICAgICAgICAgICAgICBjdXJyZW50LnN0YXJ0X2IgPSAwO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgPlxuICAgICAgICAgICAgICA8U2VsZWN0Lk9wdGlvbiB2YWx1ZT1cImhvdXJcIj5cbiAgICAgICAgICAgICAgICB7dChcIm9wZW5kYXNoOnVpLmhvdXJcIil9XG4gICAgICAgICAgICAgIDwvU2VsZWN0Lk9wdGlvbj5cbiAgICAgICAgICAgICAgPFNlbGVjdC5PcHRpb24gdmFsdWU9XCJkYXlcIj57dChcIm9wZW5kYXNoOnVpLmRheVwiKX08L1NlbGVjdC5PcHRpb24+XG4gICAgICAgICAgICAgIDxTZWxlY3QuT3B0aW9uIHZhbHVlPVwid2Vla1wiPlxuICAgICAgICAgICAgICAgIHt0KFwib3BlbmRhc2g6dWkud2Vla1wiKX1cbiAgICAgICAgICAgICAgPC9TZWxlY3QuT3B0aW9uPlxuICAgICAgICAgICAgICA8U2VsZWN0Lk9wdGlvbiB2YWx1ZT1cIm1vbnRoXCI+XG4gICAgICAgICAgICAgICAge3QoXCJvcGVuZGFzaDp1aS5tb250aFwiKX1cbiAgICAgICAgICAgICAgPC9TZWxlY3QuT3B0aW9uPlxuICAgICAgICAgICAgPC9TZWxlY3Q+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGRpdlxuICAgICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgICAgZmxvYXQ6IFwibGVmdFwiLFxuICAgICAgICAgICAgICB3aWR0aDogXCIzMyVcIixcbiAgICAgICAgICAgICAgcGFkZGluZzogXCIwIDIwcHhcIixcbiAgICAgICAgICAgICAgdGV4dEFsaWduOiBcImNlbnRlclwiLFxuICAgICAgICAgICAgfX1cbiAgICAgICAgICA+XG4gICAgICAgICAgICA8c3Bhbj5cbiAgICAgICAgICAgICAge3QoXCJoaWdoY2hhcnRzOmNvbXBhcmUuYVwiKX06IHt0KFwib3BlbmRhc2g6dWkuXCIgKyBzZWxlY3RlZFVuaXQpfXtcIiBcIn1cbiAgICAgICAgICAgICAge2Zvcm1hdERhdGVTZWxlY3Rpb24oc2VsZWN0ZWRVbml0LCBkcmFmdC5zdGFydF9hKX1cbiAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgIDxCdXR0b25cbiAgICAgICAgICAgICAgc3R5bGU9e3sgbWFyZ2luTGVmdDogMTAgfX1cbiAgICAgICAgICAgICAgaWNvbj17PEljb24gaWNvbj1cImZhOnBsdXNcIiAvPn1cbiAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnRleHQudXBkYXRlRHJhZnQoKGN1cnJlbnQpID0+IHtcbiAgICAgICAgICAgICAgICAgIGN1cnJlbnQuc3RhcnRfYSA9IGRheWpzKGN1cnJlbnQuc3RhcnRfYSlcbiAgICAgICAgICAgICAgICAgICAgLmFkZCgxLCBzZWxlY3RlZFVuaXQpXG4gICAgICAgICAgICAgICAgICAgIC5zdGFydE9mKHNlbGVjdGVkVW5pdClcbiAgICAgICAgICAgICAgICAgICAgLnZhbHVlT2YoKTtcblxuICAgICAgICAgICAgICAgICAgY3VycmVudC5lbmRfYSA9IGRheWpzKGN1cnJlbnQuc3RhcnRfYSlcbiAgICAgICAgICAgICAgICAgICAgLmVuZE9mKHNlbGVjdGVkVW5pdClcbiAgICAgICAgICAgICAgICAgICAgLnZhbHVlT2YoKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgIC8+XG4gICAgICAgICAgICA8QnV0dG9uXG4gICAgICAgICAgICAgIHN0eWxlPXt7IG1hcmdpbkxlZnQ6IDMgfX1cbiAgICAgICAgICAgICAgaWNvbj17PEljb24gaWNvbj1cImZhOm1pbnVzXCIgLz59XG4gICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHtcbiAgICAgICAgICAgICAgICBjb250ZXh0LnVwZGF0ZURyYWZ0KChjdXJyZW50KSA9PiB7XG4gICAgICAgICAgICAgICAgICBjdXJyZW50LnN0YXJ0X2EgPSBkYXlqcyhjdXJyZW50LnN0YXJ0X2EpXG4gICAgICAgICAgICAgICAgICAgIC5zdWJ0cmFjdCgxLCBzZWxlY3RlZFVuaXQpXG4gICAgICAgICAgICAgICAgICAgIC5zdGFydE9mKHNlbGVjdGVkVW5pdClcbiAgICAgICAgICAgICAgICAgICAgLnZhbHVlT2YoKTtcblxuICAgICAgICAgICAgICAgICAgY3VycmVudC5lbmRfYSA9IGRheWpzKGN1cnJlbnQuc3RhcnRfYSlcbiAgICAgICAgICAgICAgICAgICAgLmVuZE9mKHNlbGVjdGVkVW5pdClcbiAgICAgICAgICAgICAgICAgICAgLnZhbHVlT2YoKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgIC8+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGRpdlxuICAgICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgICAgZmxvYXQ6IFwibGVmdFwiLFxuICAgICAgICAgICAgICB3aWR0aDogXCIzMyVcIixcbiAgICAgICAgICAgICAgcGFkZGluZzogXCIwIDIwcHhcIixcbiAgICAgICAgICAgICAgdGV4dEFsaWduOiBcImNlbnRlclwiLFxuICAgICAgICAgICAgfX1cbiAgICAgICAgICA+XG4gICAgICAgICAgICA8c3Bhbj5cbiAgICAgICAgICAgICAge3QoXCJoaWdoY2hhcnRzOmNvbXBhcmUuYlwiKX06IHt0KFwib3BlbmRhc2g6dWkuXCIgKyBzZWxlY3RlZFVuaXQpfXtcIiBcIn1cbiAgICAgICAgICAgICAge2Zvcm1hdERhdGVTZWxlY3Rpb24oc2VsZWN0ZWRVbml0LCBkcmFmdC5zdGFydF9iKX1cbiAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgIDxCdXR0b25cbiAgICAgICAgICAgICAgc3R5bGU9e3sgbWFyZ2luTGVmdDogMTAgfX1cbiAgICAgICAgICAgICAgaWNvbj17PEljb24gaWNvbj1cImZhOnBsdXNcIiAvPn1cbiAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnRleHQudXBkYXRlRHJhZnQoKGN1cnJlbnQpID0+IHtcbiAgICAgICAgICAgICAgICAgIGN1cnJlbnQuc3RhcnRfYiA9IGRheWpzKGN1cnJlbnQuc3RhcnRfYilcbiAgICAgICAgICAgICAgICAgICAgLmFkZCgxLCBzZWxlY3RlZFVuaXQpXG4gICAgICAgICAgICAgICAgICAgIC5zdGFydE9mKHNlbGVjdGVkVW5pdClcbiAgICAgICAgICAgICAgICAgICAgLnZhbHVlT2YoKTtcbiAgICAgICAgICAgICAgICAgIGN1cnJlbnQuZW5kX2IgPSBkYXlqcyhjdXJyZW50LnN0YXJ0X2IpXG4gICAgICAgICAgICAgICAgICAgIC5lbmRPZihzZWxlY3RlZFVuaXQpXG4gICAgICAgICAgICAgICAgICAgIC52YWx1ZU9mKCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAvPlxuICAgICAgICAgICAgPEJ1dHRvblxuICAgICAgICAgICAgICBzdHlsZT17eyBtYXJnaW5MZWZ0OiAzIH19XG4gICAgICAgICAgICAgIGljb249ezxJY29uIGljb249XCJmYTptaW51c1wiIC8+fVxuICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB7XG4gICAgICAgICAgICAgICAgY29udGV4dC51cGRhdGVEcmFmdCgoY3VycmVudCkgPT4ge1xuICAgICAgICAgICAgICAgICAgY3VycmVudC5zdGFydF9iID0gZGF5anMoY3VycmVudC5zdGFydF9iKVxuICAgICAgICAgICAgICAgICAgICAuc3VidHJhY3QoMSwgc2VsZWN0ZWRVbml0KVxuICAgICAgICAgICAgICAgICAgICAuc3RhcnRPZihzZWxlY3RlZFVuaXQpXG4gICAgICAgICAgICAgICAgICAgIC52YWx1ZU9mKCk7XG4gICAgICAgICAgICAgICAgICBjdXJyZW50LmVuZF9iID0gZGF5anMoY3VycmVudC5zdGFydF9iKVxuICAgICAgICAgICAgICAgICAgICAuZW5kT2Yoc2VsZWN0ZWRVbml0KVxuICAgICAgICAgICAgICAgICAgICAudmFsdWVPZigpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgLz5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIHtjaGFydENvbmZpZyAmJiAoXG4gICAgICAgICAgPEhpZ2hjaGFydHNDaGFydFxuICAgICAgICAgICAgb3B0aW9ucz17Y2hhcnRDb25maWd9XG4gICAgICAgICAgICB3aWR0aD17d2lkdGh9XG4gICAgICAgICAgICBoZWlnaHQ9e2hlaWdodCAtIDQwfVxuICAgICAgICAgIC8+XG4gICAgICAgICl9XG4gICAgICA8Lz5cbiAgICApO1xuICB9XG4pO1xuXG5mdW5jdGlvbiBmb3JtYXR0ZXIob3B0cywga2V5LCB4LCBzZWxlY3RlZFVuaXQpIHtcbiAgdmFyIGRhdGUgPVxuICAgIHNlbGVjdGVkVW5pdCA9PT0gXCJob3VyXCJcbiAgICAgID8gLy8gQHRzLWlnbm9yZVxuICAgICAgICBIaWdoY2hhcnRzLmRhdGVGb3JtYXQoXCIlSDolTTolU1wiLCBrZXkpXG4gICAgICA6IHNlbGVjdGVkVW5pdCA9PT0gXCJkYXlcIlxuICAgICAgPyAvLyBAdHMtaWdub3JlXG4gICAgICAgIEhpZ2hjaGFydHMuZGF0ZUZvcm1hdChcIiVIOiVNOiVTXCIsIGtleSlcbiAgICAgIDogc2VsZWN0ZWRVbml0ID09PSBcIndlZWtcIlxuICAgICAgPyAvLyBAdHMtaWdub3JlXG4gICAgICAgIEhpZ2hjaGFydHMuZGF0ZUZvcm1hdChcIiVBLCAlSDolTTolU1wiLCBrZXkpXG4gICAgICA6IHNlbGVjdGVkVW5pdCA9PT0gXCJ5ZWFyXCJcbiAgICAgID8gLy8gQHRzLWlnbm9yZVxuICAgICAgICBIaWdoY2hhcnRzLmRhdGVGb3JtYXQoXCIlZC4lbS4lWSAlSDolTTolU1wiLCBrZXkpXG4gICAgICA6IC8vIEB0cy1pZ25vcmVcbiAgICAgICAgSGlnaGNoYXJ0cy5kYXRlRm9ybWF0KFwiJWQuJW0uJVkgJUg6JU06JVNcIiwga2V5KTtcblxuICB2YXIgcyA9IFwiPGRpdiBjbGFzcz0nZXVkLXRvb2x0aXAtdGltZSc+XCIgKyBcIjxiPlwiICsgZGF0ZTtcbiAgKFwiPC9iPlwiKTtcblxuICBsZXQgc2VyaWVzID0gb3B0cy5jaGFydC5zZXJpZXM7XG5cbiAgZm9yIChsZXQgaW5kZXggaW4gc2VyaWVzKSB7XG4gICAgbGV0IHNlcmllID0gc2VyaWVzW2luZGV4XTtcbiAgICBpZiAoc2VyaWUubmFtZS5pbmRleE9mKFwiTmF2aWdhdG9yXCIpID09IDAgfHwgIXNlcmllLnZpc2libGUpIGNvbnRpbnVlO1xuICAgIGxldCBpMlVzZSA9IGZpbmRMYXN0SW5kZXgoc2VyaWUuZGF0YSwgMCwgc2VyaWUuZGF0YS5sZW5ndGggLSAxLCB4LCBcInhcIik7XG5cbiAgICB0cnkge1xuICAgICAgLy8gY29uc29sZS5sb2coXCJDSEVDSyBUSElOR1NcIik7XG4gICAgICAvLyBjb25zb2xlLmxvZyhzZXJpZSk7XG4gICAgICAvLyBjb25zb2xlLmxvZyhvcHRzKTtcblxuICAgICAgaWYgKGkyVXNlICE9PSAtMSkge1xuICAgICAgICAvKlxuICAgICAgICBpZiAoaW5kZXggPT09IFwiMFwiIHx8IHNlcmllcy5sZW5ndGggPT0gMSkge1xuICAgICAgICAgIHNlcmllLmRhdGFbaTJVc2VdLnNlbGVjdCgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHNlcmllLmRhdGFbaTJVc2VdLnNlbGVjdCh0cnVlLCB0cnVlKTtcbiAgICAgICAgfSovXG4gICAgICAgIGNvbnN0IGZwID0gcGFyc2VGbG9hdChzZXJpZS5kYXRhW2kyVXNlXVtcInlcIl0pICUgMTtcbiAgICAgICAgY29uc3QgZnBwcmVjaXNpb24gPVxuICAgICAgICAgIGZwID09PSAwXG4gICAgICAgICAgICA/IDJcbiAgICAgICAgICAgIDogTWF0aC5taW4oMjAsIE1hdGgubWF4KDIsIE1hdGguY2VpbChNYXRoLmFicyhNYXRoLmxvZzEwKGZwKSkpKSk7XG4gICAgICAgIHMgKz1cbiAgICAgICAgICAnPGJyLz48c3BhbiBzdHlsZT1cImNvbG9yOicgK1xuICAgICAgICAgIHNlcmllLmNvbG9yICtcbiAgICAgICAgICAnXCI+XFx1MjVDRjwvc3Bhbj46ICcgK1xuICAgICAgICAgIHNlcmllLm5hbWUgK1xuICAgICAgICAgIFwiOiBcIiArXG4gICAgICAgICAgKGlzTmFOKHBhcnNlRmxvYXQoc2VyaWUuZGF0YVtpMlVzZV1bXCJ5XCJdKSlcbiAgICAgICAgICAgID8gc2VyaWUuZGF0YVtpMlVzZV1bXCJ5XCJdXG4gICAgICAgICAgICA6IHNlcmllLmRhdGFbaTJVc2VdW1wieVwiXS50b0ZpeGVkKGZwcHJlY2lzaW9uKSkgK1xuICAgICAgICAgIFwiIFwiICtcbiAgICAgICAgICAob3B0cy5jaGFydC5vcHRpb25zLnNlcmllc1tpbmRleF0/LnVuaXQgfHwgXCJcIik7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgY29uc29sZS5lcnJvcihlKTtcbiAgICB9XG4gIH1cblxuICBzICs9IFwiPC9kaXY+XCI7XG4gIHJldHVybiBzO1xufVxuY29uc3QgZmluZExhc3RJbmRleCA9IChyZWloZSwgc3RhcnQsIGVuZCwgdHMsIHNlYXJjaEtleSkgPT4ge1xuICB0cnkge1xuICAgIGxldCBtaWRJbmRleCA9IE1hdGguZmxvb3IoKGVuZCArIHN0YXJ0KSAvIDIpO1xuICAgIGlmICghcmVpaGVbbWlkSW5kZXhdKSByZXR1cm4gLTE7XG4gICAgaWYgKHJlaWhlW21pZEluZGV4XVtzZWFyY2hLZXldID09PSB0cykgcmV0dXJuIG1pZEluZGV4O1xuXG4gICAgaWYgKHJlaWhlW3N0YXJ0XVtzZWFyY2hLZXldID4gdHMpIHJldHVybiAtMTtcbiAgICBpZiAocmVpaGVbZW5kXVtzZWFyY2hLZXldIDwgdHMpIHJldHVybiBlbmQ7XG5cbiAgICBpZiAocmVpaGVbc3RhcnRdW3NlYXJjaEtleV0gPiB0cykgcmV0dXJuIC0xO1xuICAgIGlmIChyZWloZVtlbmRdW3NlYXJjaEtleV0gPCB0cykgcmV0dXJuIGVuZDtcblxuICAgIHJldHVybiBNYXRoLm1heChcbiAgICAgIGZpbmRMYXN0SW5kZXgocmVpaGUsIHN0YXJ0LCBtaWRJbmRleCwgdHMsIHNlYXJjaEtleSksXG4gICAgICBmaW5kTGFzdEluZGV4KHJlaWhlLCBtaWRJbmRleCArIDEsIGVuZCwgdHMsIHNlYXJjaEtleSlcbiAgICApO1xuICB9IGNhdGNoIChlKSB7fVxufTtcblxuZnVuY3Rpb24gZm9ybWF0RGF0ZVRvb2x0aXAodGltZTogbnVtYmVyKSB7XG4gIHJldHVybiBkYXlqcyh0aW1lKS5mb3JtYXQoXCJkZGRkLCBNTU1NIERvLCBISDptbTpzc1wiKTtcbn1cblxuZnVuY3Rpb24gZm9ybWF0RGF0ZVNlbGVjdGlvbihcbiAgdW5pdDogXCJtaW51dGVcIiB8IFwiaG91clwiIHwgXCJkYXlcIiB8IFwid2Vla1wiIHwgXCJtb250aFwiIHwgXCJ5ZWFyXCIsXG4gIHRpbWU6IG51bWJlclxuKSB7XG4gIHN3aXRjaCAodW5pdCkge1xuICAgIGNhc2UgXCJtaW51dGVcIjpcbiAgICAgIHJldHVybiBkYXlqcyh0aW1lKS5mb3JtYXQoXCJISDptbSwgREQuTU0uWVlZWVwiKTtcblxuICAgIGNhc2UgXCJob3VyXCI6XG4gICAgICByZXR1cm4gZGF5anModGltZSkuZm9ybWF0KFwiSEgsIERELk1NLllZWVlcIik7XG5cbiAgICBjYXNlIFwiZGF5XCI6XG4gICAgICByZXR1cm4gZGF5anModGltZSkuZm9ybWF0KFwiREQuTU0uWVlZWVwiKTtcblxuICAgIGNhc2UgXCJ3ZWVrXCI6XG4gICAgICByZXR1cm4gZGF5anModGltZSkuZm9ybWF0KFwiVywgWVlZWVwiKTtcblxuICAgIGNhc2UgXCJtb250aFwiOlxuICAgICAgcmV0dXJuIGRheWpzKHRpbWUpLmZvcm1hdChcIk1NTU0sIFlZWVlcIik7XG5cbiAgICBjYXNlIFwieWVhclwiOlxuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gZGF5anModGltZSkuZm9ybWF0KFwiWVlZWVwiKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBmb3JtYXREYXRlWEF4aXMoXG4gIHVuaXQ6IFwibWludXRlXCIgfCBcImhvdXJcIiB8IFwiZGF5XCIgfCBcIndlZWtcIiB8IFwibW9udGhcIiB8IFwieWVhclwiLFxuICB0aW1lOiBudW1iZXJcbikge1xuICBzd2l0Y2ggKHVuaXQpIHtcbiAgICBjYXNlIFwibWludXRlXCI6XG4gICAgICByZXR1cm4gZGF5anModGltZSkuZm9ybWF0KFwic3NcIik7XG5cbiAgICBjYXNlIFwiaG91clwiOlxuICAgICAgcmV0dXJuIGRheWpzKHRpbWUpLmZvcm1hdChcIm1tOnNzXCIpO1xuXG4gICAgY2FzZSBcImRheVwiOlxuICAgICAgcmV0dXJuIGRheWpzKHRpbWUpLmZvcm1hdChcIkhIOm1tXCIpO1xuXG4gICAgY2FzZSBcIndlZWtcIjpcbiAgICAgIHJldHVybiBkYXlqcyh0aW1lKS5mb3JtYXQoXCJkZGRkLCBISDptbTpzc1wiKTtcblxuICAgIGNhc2UgXCJtb250aFwiOlxuICAgICAgcmV0dXJuIGRheWpzKHRpbWUpLmZvcm1hdChcImRkZGQsIERvLCBISDptbTpzc1wiKTtcblxuICAgIGNhc2UgXCJ5ZWFyXCI6XG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiBkYXlqcyh0aW1lKS5mb3JtYXQoXCJkZGRkLCBNTU1NIERvLCBISDptbTpzc1wiKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBmbGF0dGVuRGF0ZShcbiAgdW5pdDogXCJtaW51dGVcIiB8IFwiaG91clwiIHwgXCJkYXlcIiB8IFwid2Vla1wiIHwgXCJtb250aFwiIHwgXCJ5ZWFyXCIsXG4gIHRpbWU6IG51bWJlclxuKSB7XG4gIGxldCBkYXRlID0gZGF5anModGltZSk7XG5cbiAgaWYgKHVuaXQgPT09IFwibWludXRlXCIpIHtcbiAgICBkYXRlID0gZGF0ZS5zZXQoXCJtaW51dGVcIiwgMCk7XG4gICAgZGF0ZSA9IGRhdGUuc2V0KFwiaG91clwiLCAwKTtcbiAgICBkYXRlID0gZGF0ZS5zZXQoXCJkYXlcIiwgMCk7XG4gICAgZGF0ZSA9IGRhdGUuc2V0KFwibW9udGhcIiwgMCk7XG4gICAgZGF0ZSA9IGRhdGUuc2V0KFwieWVhclwiLCAwKTtcbiAgfVxuXG4gIGlmICh1bml0ID09PSBcImhvdXJcIikge1xuICAgIGRhdGUgPSBkYXRlLnNldChcImhvdXJcIiwgMCk7XG4gICAgZGF0ZSA9IGRhdGUuc2V0KFwiZGF5XCIsIDApO1xuICAgIGRhdGUgPSBkYXRlLnNldChcIm1vbnRoXCIsIDApO1xuICAgIGRhdGUgPSBkYXRlLnNldChcInllYXJcIiwgMCk7XG4gIH1cblxuICBpZiAodW5pdCA9PT0gXCJkYXlcIikge1xuICAgIGRhdGUgPSBkYXRlLmRheU9mWWVhcigxKTtcbiAgICBkYXRlID0gZGF0ZS5zZXQoXCJkYXlcIiwgMSk7XG4gICAgZGF0ZSA9IGRhdGUuc2V0KFwibW9udGhcIiwgMCk7XG4gICAgZGF0ZSA9IGRhdGUuc2V0KFwieWVhclwiLCAyMDAwKTtcbiAgfVxuXG4gIGlmICh1bml0ID09PSBcIndlZWtcIikge1xuICAgIGRhdGUgPSBkYXRlLmlzb1dlZWsoMCk7XG4gIH1cblxuICBpZiAodW5pdCA9PT0gXCJtb250aFwiKSB7XG4gICAgZGF0ZSA9IGRhdGUuc2V0KFwibW9udGhcIiwgMCk7XG4gICAgZGF0ZSA9IGRhdGUuc2V0KFwieWVhclwiLCAwKTtcbiAgfVxuXG4gIGlmICh1bml0ID09PSBcInllYXJcIikge1xuICAgIGRhdGUgPSBkYXRlLnNldChcInllYXJcIiwgMjAwMCk7XG4gIH1cblxuICByZXR1cm4gZGF0ZS52YWx1ZU9mKCk7XG59XG4iXX0=
