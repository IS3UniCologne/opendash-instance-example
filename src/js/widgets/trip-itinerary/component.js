var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
import { Loading, useTranslation } from "@opendash/core";
import { HighchartsChart } from "@opendash/plugin-highcharts";
import { createWidgetComponent } from "@opendash/plugin-monitoring";
import { useDataFetchDimensionValues, useDataService, } from "@opendash/plugin-timeseries";
import * as turf from "@turf/turf";
import * as React from "react";
import { Icon } from "@opendash/icons";
import { Button, Checkbox, Divider, Input, Layout, Space } from "antd";
import { getFeatureCollections } from "@opendash/plugin-miaas/dist/components/GeographySelector";

function check_correct_district(position, districts) {
    let positionInDistrict = "_other";
    const [lon, lat] = position.geometry.coordinates;
    for (const district of districts) {
        if (lat > district.bbox[3] ||
            lat < district.bbox[1] ||
            lon > district.bbox[2] ||
            lon < district.bbox[0]) {
            continue;
        }
        if (turf.booleanWithin(position, district.geometry)) {
            positionInDistrict = district.properties.name;
        }
    }
    return positionInDistrict
}


export default createWidgetComponent((_a) => {
    var { config } = _a, context = __rest(_a, ["config"]);
    const t = useTranslation();
    const DataService = useDataService();
    const itemDimensionConfig = context.useItemDimensionConfig();
    const fetchingConfig = context.useFetchConfig();
    const itemConfig = React.useMemo(() => itemDimensionConfig.map(([item]) => item), [itemDimensionConfig]);
    const [nameFilter, setNameFilter] = React.useState();
    const name = React.useMemo(() => itemConfig.map((item) => DataService.getItemName(item)).join(", "), [itemConfig]);
    const [loadGraph, setLoadGraph] = React.useState(false);
    const [collapsed, setCollapsed] = React.useState(true);
    const [districts, setDistricts] = React.useState(null);
    context.setLoading(false);
    context.setName(t("highcharts:dependency.name", { name }));
    const data = useDataFetchDimensionValues(itemDimensionConfig, fetchingConfig);
    const { width, height } = context.useContainerSize();
    React.useEffect(() => {
        const init = () => __awaiter(void 0, void 0, void 0, function* () {
            const x = yield getFeatureCollections(config.type, config.type === "json"
                ? config.districts
                : config.type === "dimension"
                    ? config.districtFromDimension
                    : config.districtsFromZones);
            setDistricts(x.flatMap((entry) => entry.features));
        });
        init();
    }, [config.districts, config.type, config.districtFromDimension]);
    const filterEntries = {};
    const [filter, setFilter] = React.useState(filterEntries);
    React.useEffect(() => {
        if (districts) {
            const filters = {};
            districts.forEach((district) => {
                filters[district.properties.name] = true;
            });
            setFilter(filters);
        }
    }, [districts]);
    const seriesDataAll = React.useMemo(() => {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        setLoadGraph(true);
        if (data.length === 0)
            return [];
        const mapOfDistricts = {};
        mapOfDistricts._other = {};
        districts.forEach((district) => {
            mapOfDistricts[district.properties.name] = {};
            districts.forEach((district2) => {
                mapOfDistricts[district.properties.name][district2.properties.name] = 0;
            })
            mapOfDistricts[district.properties.name]._other = 0;
            mapOfDistricts._other[district.properties.name] = 0;
        });
        for (let idx = 0; idx < data[0][2].length; idx++) {
            const start_position = data[0][2][idx].value;
            const end_position = data[1][2][idx].value;
            let positionInDistrict = check_correct_district(start_position, districts);
            let positionInEndDistrict = check_correct_district(end_position, districts);
            mapOfDistricts[positionInDistrict][positionInEndDistrict] += 1;
        }
        const res = Object.keys(mapOfDistricts).flatMap((from) => {
            return Object.keys(mapOfDistricts[from]).map((to) => {
                return [
                    from === "_other" ? "sonstiges" : from,
                    to === "_other" ? "sonstiges" : to,
                    mapOfDistricts[from][to],
                ];
            });
        });
        setLoadGraph(false);
        return res;
    }, [data, districts]);
    const options = React.useMemo(() => {
        const result = {
            title: {
                text: null,
            },
            accessibility: {
                point: {
                    valueDescriptionFormat: "{index}. From {point.from} to {point.to}: {point.weight}.",
                },
            },
            plotOptions: {},
            credits: {
                enabled: false,
            },
            series: [
                {
                    type: "dependencywheel",
                    keys: ["from", "to", "weight"],
                    //@ts-ignore
                    data: seriesDataAll.filter((entry) => {
                        return filter[entry[0]];
                    }),
                    name: name,
                    dataLabels: {
                        color: "#333",
                        textPath: {
                            enabled: true,
                            attributes: {
                                dy: 5,
                            },
                        },
                        // @ts-ignore
                        distance: 10,
                    },
                    // @ts-ignore
                    size: "95%",
                },
            ],
        };
        return result;
    }, [config, seriesDataAll, filter]);
    const widthOfGraph = React.useMemo(() => {
        return width - (!collapsed ? 300 : 0);
    }, [width, collapsed]);
    return (React.createElement(Layout, { style: { background: "transparent" } },
        React.createElement(Layout.Content, null,
            !loadGraph && (React.createElement(HighchartsChart, { options: options, width: widthOfGraph, height: height })),
            loadGraph && React.createElement(Loading, { message: "..." })),
        React.createElement(Layout.Sider, {
            collapsed: collapsed, style: {
                width: 300,
                background: "transparent",
                padding: 5,
                height,
                overflowY: "auto",
            }
        },
            collapsed && (React.createElement(Button, {
                ghost: true, onClick: () => {
                    setCollapsed(false);
                }, icon: React.createElement(Icon, { icon: "fa:arrow-left" })
            })),
            !collapsed && (React.createElement(React.Fragment, null,
                React.createElement(Input, {
                    value: nameFilter || "", onChange: (e) => {
                        setNameFilter(e.target.value);
                    }, placeholder: "..."
                }),
                React.createElement(Space, { direction: "horizontal", style: { marginTop: 5 } },
                    React.createElement(Button, {
                        ghost: true, icon: React.createElement(Icon, { icon: "fa:check-double" }), onClick: () => {
                            setFilter((current) => {
                                const x = Object.assign({}, current);
                                let oldState = false;
                                Object.keys(x).forEach((key, index) => {
                                    if (index === 0) {
                                        oldState = x[key];
                                    }
                                    x[key] = !oldState;
                                });
                                return x;
                            });
                        }
                    }),
                    React.createElement(Button, {
                        ghost: true, icon: React.createElement(Icon, { icon: "fa:exchange-alt" }), onClick: () => {
                            setFilter((current) => {
                                const x = Object.assign({}, current);
                                Object.keys(x).forEach((key, index) => {
                                    x[key] = !x[key];
                                });
                                return x;
                            });
                        }
                    }),
                    React.createElement(Button, {
                        ghost: true, icon: React.createElement(Icon, { icon: "fa:arrow-right" }), onClick: () => {
                            setCollapsed(true);
                        }
                    })),
                React.createElement(Divider, null),
                React.createElement("div", null, Object.entries(filter)
                    .filter((entry) => {
                        return entry[0].indexOf(nameFilter) != -1 || !nameFilter;
                    })
                    .map(([state, checked]) => {
                        return (React.createElement("div", { key: state },
                            React.createElement(Checkbox, {
                                checked: checked, onChange: (e) => {
                                    const newChecked = e.target.checked;
                                    setFilter((current) => (Object.assign(Object.assign({}, current), { [state]: newChecked })));
                                }
                            }, state)));
                    })))))));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcG9uZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL3dpZGdldHMvbWlhYXMtZ2VvLWRlcGVuZGVuY3kvY29tcG9uZW50LnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLE9BQU8sRUFBRSxPQUFPLEVBQUUsY0FBYyxFQUFFLE1BQU0sZ0JBQWdCLENBQUM7QUFDekQsT0FBTyxFQUFFLGVBQWUsRUFBRSxNQUFNLDZCQUE2QixDQUFDO0FBQzlELE9BQU8sRUFBRSxxQkFBcUIsRUFBRSxNQUFNLDZCQUE2QixDQUFDO0FBQ3BFLE9BQU8sRUFDTCwyQkFBMkIsRUFDM0IsY0FBYyxHQUNmLE1BQU0sNkJBQTZCLENBQUM7QUFDckMsT0FBTyxLQUFLLElBQUksTUFBTSxZQUFZLENBQUM7QUFFbkMsT0FBTyxLQUFLLEtBQUssTUFBTSxPQUFPLENBQUM7QUFHL0IsT0FBTyxFQUFFLElBQUksRUFBRSxNQUFNLGlCQUFpQixDQUFDO0FBQ3ZDLE9BQU8sRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxNQUFNLE1BQU0sQ0FBQztBQUN2RSxPQUFPLEVBQUUscUJBQXFCLEVBQUUsTUFBTSxvQ0FBb0MsQ0FBQztBQUUzRSxlQUFlLHFCQUFxQixDQUNsQyxDQUFDLEVBQXNCLEVBQUUsRUFBRTtRQUExQixFQUFFLE1BQU0sT0FBYyxFQUFULE9BQU8sY0FBcEIsVUFBc0IsQ0FBRjtJQUNuQixNQUFNLENBQUMsR0FBRyxjQUFjLEVBQUUsQ0FBQztJQUUzQixNQUFNLFdBQVcsR0FBRyxjQUFjLEVBQUUsQ0FBQztJQUVyQyxNQUFNLG1CQUFtQixHQUFHLE9BQU8sQ0FBQyxzQkFBc0IsRUFBRSxDQUFDO0lBQzdELE1BQU0sY0FBYyxHQUFHLE9BQU8sQ0FBQyxjQUFjLEVBQUUsQ0FBQztJQUNoRCxNQUFNLFVBQVUsR0FBRyxLQUFLLENB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b0JBQUMsT0FBTyxPQUFHO2dCQUVYLGlDQUNHLE1BQU0sQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDO3FCQUNwQixNQUFNLENBQUMsQ0FBQyxLQUFLLEVBQUUsRUFBRTtvQkFDaEIsT0FBTyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDO2dCQUMzRCxDQUFDLENBQUM7cUJBQ0QsR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFLLEVBQUUsT0FBTyxDQUFDLEVBQUUsRUFBRTtvQkFDeEIsT0FBTyxDQUNMLDZCQUFLLEdBQUcsRUFBRSxLQUFLO3dCQUNiLG9CQUFDLFFBQVEsSUFDUCxPQUFPLEVBQUUsT0FBTyxFQUNoQixRQUFRLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRTtnQ0FDZCxNQUFNLFVBQVUsR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQztnQ0FDcEMsU0FBUyxDQUFDLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxpQ0FDbEIsT0FBTyxLQUNWLENBQUMsS0FBSyxDQUFDLEVBQUUsVUFBVSxJQUNuQixDQUFDLENBQUM7NEJBQ04sQ0FBQyxJQUVBLEtBQUssQ0FDRyxDQUNQLENBQ1AsQ0FBQztnQkFDSixDQUFDLENBQUMsQ0FDQSxDQUNMLENBQ0osQ0FDWSxDQUVWLENBQ1YsQ0FBQztBQUNKLENBQUMsQ0FDRixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTG9hZGluZywgdXNlVHJhbnNsYXRpb24gfSBmcm9tIFwiQG9wZW5kYXNoL2NvcmVcIjtcbmltcG9ydCB7IEhpZ2hjaGFydHNDaGFydCB9IGZyb20gXCJAb3BlbmRhc2gvcGx1Z2luLWhpZ2hjaGFydHNcIjtcbmltcG9ydCB7IGNyZWF0ZVdpZGdldENvbXBvbmVudCB9IGZyb20gXCJAb3BlbmRhc2gvcGx1Z2luLW1vbml0b3JpbmdcIjtcbmltcG9ydCB7XG4gIHVzZURhdGFGZXRjaERpbWVuc2lvblZhbHVlcyxcbiAgdXNlRGF0YVNlcnZpY2UsXG59IGZyb20gXCJAb3BlbmRhc2gvcGx1Z2luLXRpbWVzZXJpZXNcIjtcbmltcG9ydCAqIGFzIHR1cmYgZnJvbSBcIkB0dXJmL3R1cmZcIjtcbmltcG9ydCB7IE9wdGlvbnMgfSBmcm9tIFwiaGlnaGNoYXJ0c1wiO1xuaW1wb3J0ICogYXMgUmVhY3QgZnJvbSBcInJlYWN0XCI7XG5pbXBvcnQgeyBDb25maWdJbnRlcmZhY2UgfSBmcm9tIFwiLi90eXBlc1wiO1xuXG5pbXBvcnQgeyBJY29uIH0gZnJvbSBcIkBvcGVuZGFzaC9pY29uc1wiO1xuaW1wb3J0IHsgQnV0dG9uLCBDaGVja2JveCwgRGl2aWRlciwgSW5wdXQsIExheW91dCwgU3BhY2UgfSBmcm9tIFwiYW50ZFwiO1xuaW1wb3J0IHsgZ2V0RmVhdHVyZUNvbGxlY3Rpb25zIH0gZnJvbSBcIi4uLy4uL2NvbXBvbmVudHMvR2VvZ3JhcGh5U2VsZWN0b3JcIjtcblxuZXhwb3J0IGRlZmF1bHQgY3JlYXRlV2lkZ2V0Q29tcG9uZW50PENvbmZpZ0ludGVyZmFjZT4oXG4gICh7IGNvbmZpZywgLi4uY29udGV4dCB9KSA9PiB7XG4gICAgY29uc3QgdCA9IHVzZVRyYW5zbGF0aW9uKCk7XG5cbiAgICBjb25zdCBEYXRhU2VydmljZSA9IHVzZURhdGFTZXJ2aWNlKCk7XG5cbiAgICBjb25zdCBpdGVtRGltZW5zaW9uQ29uZmlnID0gY29udGV4dC51c2VJdGVtRGltZW5zaW9uQ29uZmlnKCk7XG4gICAgY29uc3QgZmV0Y2hpbmdDb25maWcgPSBjb250ZXh0LnVzZUZldGNoQ29uZmlnKCk7XG4gICAgY29uc3QgaXRlbUNvbmZpZyA9IFJlYWN0LnVzZU1lbW8oXG4gICAgICAoKSA9PiBpdGVtRGltZW5zaW9uQ29uZmlnLm1hcCgoW2l0ZW1dKSA9PiBpdGVtKSxcbiAgICAgIFtpdGVtRGltZW5zaW9uQ29uZmlnXVxuICAgICk7XG5cbiAgICBjb25zdCBbbmFtZUZpbHRlciwgc2V0TmFtZUZpbHRlcl0gPSBSZWFjdC51c2VTdGF0ZTxzdHJpbmc+KCk7XG4gICAgY29uc3QgbmFtZSA9IFJlYWN0LnVzZU1lbW8oXG4gICAgICAoKSA9PiBpdGVtQ29uZmlnLm1hcCgoaXRlbSkgPT4gRGF0YVNlcnZpY2UuZ2V0SXRlbU5hbWUoaXRlbSkpLmpvaW4oXCIsIFwiKSxcbiAgICAgIFtpdGVtQ29uZmlnXVxuICAgICk7XG4gICAgY29uc3QgW2xvYWRHcmFwaCwgc2V0TG9hZEdyYXBoXSA9IFJlYWN0LnVzZVN0YXRlKGZhbHNlKTtcbiAgICBjb25zdCBbY29sbGFwc2VkLCBzZXRDb2xsYXBzZWRdID0gUmVhY3QudXNlU3RhdGUodHJ1ZSk7XG4gICAgY29uc3QgW2Rpc3RyaWN0cywgc2V0RGlzdHJpY3RzXSA9IFJlYWN0LnVzZVN0YXRlPGFueT4obnVsbCk7XG4gICAgY29udGV4dC5zZXRMb2FkaW5nKGZhbHNlKTtcbiAgICBjb250ZXh0LnNldE5hbWUodChcImhpZ2hjaGFydHM6ZGVwZW5kZW5jeS5uYW1lXCIsIHsgbmFtZSB9KSk7XG5cbiAgICBjb25zdCBkYXRhID0gdXNlRGF0YUZldGNoRGltZW5zaW9uVmFsdWVzKFxuICAgICAgaXRlbURpbWVuc2lvbkNvbmZpZyxcbiAgICAgIGZldGNoaW5nQ29uZmlnXG4gICAgKTtcblxuICAgIGNvbnN0IHsgd2lkdGgsIGhlaWdodCB9ID0gY29udGV4dC51c2VDb250YWluZXJTaXplKCk7XG5cbiAgICBSZWFjdC51c2VFZmZlY3QoKCkgPT4ge1xuICAgICAgY29uc3QgaW5pdCA9IGFzeW5jICgpID0+IHtcbiAgICAgICAgY29uc3QgeCA9IGF3YWl0IGdldEZlYXR1cmVDb2xsZWN0aW9ucyhcbiAgICAgICAgICBjb25maWcudHlwZSxcbiAgICAgICAgICBjb25maWcudHlwZSA9PT0gXCJqc29uXCJcbiAgICAgICAgICAgID8gY29uZmlnLmRpc3RyaWN0c1xuICAgICAgICAgICAgOiBjb25maWcudHlwZSA9PT0gXCJkaW1lbnNpb25cIlxuICAgICAgICAgICAgICA/IGNvbmZpZy5kaXN0cmljdEZyb21EaW1lbnNpb25cbiAgICAgICAgICAgICAgOiBjb25maWcuZGlzdHJpY3RzRnJvbVpvbmVzXG4gICAgICAgICk7XG5cbiAgICAgICAgc2V0RGlzdHJpY3RzKHguZmxhdE1hcCgoZW50cnkpID0+IGVudHJ5LmZlYXR1cmVzKSk7XG4gICAgICB9O1xuICAgICAgaW5pdCgpO1xuICAgIH0sIFtjb25maWcuZGlzdHJpY3RzLCBjb25maWcudHlwZSwgY29uZmlnLmRpc3RyaWN0RnJvbURpbWVuc2lvbl0pO1xuXG4gICAgY29uc3QgZmlsdGVyRW50cmllcyA9IHt9O1xuXG4gICAgY29uc3QgW2ZpbHRlciwgc2V0RmlsdGVyXSA9XG4gICAgICBSZWFjdC51c2VTdGF0ZTxSZWNvcmQ8c3RyaW5nLCBib29sZWFuPj4oZmlsdGVyRW50cmllcyk7XG5cbiAgICBSZWFjdC51c2VFZmZlY3QoKCkgPT4ge1xuICAgICAgaWYgKGRpc3RyaWN0cykge1xuICAgICAgICBjb25zdCBmaWx0ZXJzID0ge307XG5cbiAgICAgICAgZGlzdHJpY3RzLmZvckVhY2goKGRpc3RyaWN0KSA9PiB7XG4gICAgICAgICAgZmlsdGVyc1tkaXN0cmljdC5wcm9wZXJ0aWVzLm5hbWVdID0gdHJ1ZTtcbiAgICAgICAgfSk7XG4gICAgICAgIHNldEZpbHRlcihmaWx0ZXJzKTtcbiAgICAgIH1cbiAgICB9LCBbZGlzdHJpY3RzXSk7XG5cbiAgICBjb25zdCBzZXJpZXNEYXRhQWxsID0gUmVhY3QudXNlTWVtbygoKSA9PiB7XG4gICAgICBzZXRMb2FkR3JhcGgodHJ1ZSk7XG4gICAgICBpZiAoZGF0YS5sZW5ndGggPT09IDApIHJldHVybiBbXTtcbiAgICAgIGNvbnN0IG1hcE9mRGlzdHJpY3RzID0ge30gYXMgUmVjb3JkPHN0cmluZywgYW55PjtcbiAgICAgIGRpc3RyaWN0cy5mb3JFYWNoKChkaXN0cmljdCkgPT4ge1xuICAgICAgICBtYXBPZkRpc3RyaWN0c1tkaXN0cmljdC5wcm9wZXJ0aWVzLm5hbWVdID0ge30gYXMgUmVjb3JkPHN0cmluZywgbnVtYmVyPjtcbiAgICAgIH0pO1xuICAgICAgbWFwT2ZEaXN0cmljdHMuX290aGVyID0ge307XG4gICAgICBsZXQgbGFzdERpc3RyaWN0ID0gbnVsbDtcblxuICAgICAgZm9yIChsZXQgaWR4ID0gMDsgaWR4IDwgZGF0YVswXVsyXS5sZW5ndGg7IGlkeCsrKSB7XG4gICAgICAgIGNvbnN0IHBvc2l0aW9uID0gZGF0YVswXVsyXVtpZHhdLnZhbHVlO1xuICAgICAgICBsZXQgcG9zaXRpb25JbkRpc3RyaWN0ID0gbnVsbDtcbiAgICAgICAgY29uc3QgW2xvbiwgbGF0XSA9IHBvc2l0aW9uLmdlb21ldHJ5LmNvb3JkaW5hdGVzO1xuICAgICAgICBmb3IgKGNvbnN0IGRpc3RyaWN0IG9mIGRpc3RyaWN0cykge1xuICAgICAgICAgIGlmIChcbiAgICAgICAgICAgIGxhdCA+IGRpc3RyaWN0LmJib3hbM10gfHxcbiAgICAgICAgICAgIGxhdCA8IGRpc3RyaWN0LmJib3hbMV0gfHxcbiAgICAgICAgICAgIGxvbiA+IGRpc3RyaWN0LmJib3hbMl0gfHxcbiAgICAgICAgICAgIGxvbiA8IGRpc3RyaWN0LmJib3hbMF1cbiAgICAgICAgICApIHtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAodHVyZi5ib29sZWFuV2l0aGluKHBvc2l0aW9uLCBkaXN0cmljdC5nZW9tZXRyeSkpIHtcbiAgICAgICAgICAgIHBvc2l0aW9uSW5EaXN0cmljdCA9IGRpc3RyaWN0O1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChpZHggPT09IDApIHtcbiAgICAgICAgICBsYXN0RGlzdHJpY3QgPSBwb3NpdGlvbkluRGlzdHJpY3Q7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKFxuICAgICAgICAgICFtYXBPZkRpc3RyaWN0c1tsYXN0RGlzdHJpY3Q/LnByb3BlcnRpZXM/Lm5hbWUgfHwgXCJfb3RoZXJcIl1bXG4gICAgICAgICAgICBwb3NpdGlvbkluRGlzdHJpY3Q/LnByb3BlcnRpZXM/Lm5hbWUgfHwgXCJfb3RoZXJcIlxuICAgICAgICAgIF1cbiAgICAgICAgKSB7XG4gICAgICAgICAgbWFwT2ZEaXN0cmljdHNbbGFzdERpc3RyaWN0Py5wcm9wZXJ0aWVzPy5uYW1lIHx8IFwiX290aGVyXCJdW1xuICAgICAgICAgICAgcG9zaXRpb25JbkRpc3RyaWN0Py5wcm9wZXJ0aWVzPy5uYW1lIHx8IFwiX290aGVyXCJcbiAgICAgICAgICBdID0gMDtcbiAgICAgICAgfVxuICAgICAgICBtYXBPZkRpc3RyaWN0c1tsYXN0RGlzdHJpY3Q/LnByb3BlcnRpZXM/Lm5hbWUgfHwgXCJfb3RoZXJcIl1bXG4gICAgICAgICAgcG9zaXRpb25JbkRpc3RyaWN0Py5wcm9wZXJ0aWVzPy5uYW1lIHx8IFwiX290aGVyXCJcbiAgICAgICAgXSA9XG4gICAgICAgICAgKG1hcE9mRGlzdHJpY3RzW2xhc3REaXN0cmljdD8ucHJvcGVydGllcz8ubmFtZSB8fCBcIl9vdGhlclwiXVtcbiAgICAgICAgICAgIHBvc2l0aW9uSW5EaXN0cmljdD8ucHJvcGVydGllcz8ubmFtZSB8fCBcIl9vdGhlclwiXG4gICAgICAgICAgXSB8fCAwKSArIDE7XG4gICAgICAgIGxhc3REaXN0cmljdCA9IHBvc2l0aW9uSW5EaXN0cmljdDtcbiAgICAgIH1cblxuICAgICAgY29uc3QgcmVzID0gT2JqZWN0LmtleXMobWFwT2ZEaXN0cmljdHMpLmZsYXRNYXAoKGZyb20pID0+IHtcbiAgICAgICAgcmV0dXJuIE9iamVjdC5rZXlzKG1hcE9mRGlzdHJpY3RzW2Zyb21dKS5tYXAoKHRvKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgIGZyb20gPT09IFwiX290aGVyXCIgPyBcInNvbnN0aWdlc1wiIDogZnJvbSxcbiAgICAgICAgICAgIHRvID09PSBcIl9vdGhlclwiID8gXCJzb25zdGlnZXNcIiA6IHRvLFxuICAgICAgICAgICAgbWFwT2ZEaXN0cmljdHNbZnJvbV1bdG9dLFxuICAgICAgICAgIF07XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICAgIHNldExvYWRHcmFwaChmYWxzZSk7XG5cbiAgICAgIHJldHVybiByZXMgYXMgdW5rbm93biBhcyBbc3RyaW5nLCBzdHJpbmcsIG51bWJlcl07XG4gICAgfSwgW2RhdGEsIGRpc3RyaWN0c10pO1xuXG4gICAgY29uc3Qgb3B0aW9ucyA9IFJlYWN0LnVzZU1lbW88T3B0aW9ucz4oKCkgPT4ge1xuICAgICAgY29uc3QgcmVzdWx0OiBPcHRpb25zID0ge1xuICAgICAgICB0aXRsZToge1xuICAgICAgICAgIHRleHQ6IG51bGwsXG4gICAgICAgIH0sXG5cbiAgICAgICAgYWNjZXNzaWJpbGl0eToge1xuICAgICAgICAgIHBvaW50OiB7XG4gICAgICAgICAgICB2YWx1ZURlc2NyaXB0aW9uRm9ybWF0OlxuICAgICAgICAgICAgICBcIntpbmRleH0uIEZyb20ge3BvaW50LmZyb219IHRvIHtwb2ludC50b306IHtwb2ludC53ZWlnaHR9LlwiLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIHBsb3RPcHRpb25zOiB7fSxcbiAgICAgICAgY3JlZGl0czoge1xuICAgICAgICAgIGVuYWJsZWQ6IGZhbHNlLFxuICAgICAgICB9LFxuICAgICAgICBzZXJpZXM6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICB0eXBlOiBcImRlcGVuZGVuY3l3aGVlbFwiLFxuICAgICAgICAgICAga2V5czogW1wiZnJvbVwiLCBcInRvXCIsIFwid2VpZ2h0XCJdLFxuICAgICAgICAgICAgLy9AdHMtaWdub3JlXG4gICAgICAgICAgICBkYXRhOiBzZXJpZXNEYXRhQWxsLmZpbHRlcigoZW50cnkpID0+IHtcbiAgICAgICAgICAgICAgcmV0dXJuIGZpbHRlcltlbnRyeVswXV07XG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIG5hbWU6IG5hbWUsXG4gICAgICAgICAgICBkYXRhTGFiZWxzOiB7XG4gICAgICAgICAgICAgIGNvbG9yOiBcIiMzMzNcIixcbiAgICAgICAgICAgICAgdGV4dFBhdGg6IHtcbiAgICAgICAgICAgICAgICBlbmFibGVkOiB0cnVlLFxuICAgICAgICAgICAgICAgIGF0dHJpYnV0ZXM6IHtcbiAgICAgICAgICAgICAgICAgIGR5OiA1LFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgICAgZGlzdGFuY2U6IDEwLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgIHNpemU6IFwiOTUlXCIsXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgIH07XG5cbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfSwgW2NvbmZpZywgc2VyaWVzRGF0YUFsbCwgZmlsdGVyXSk7XG5cbiAgICBjb25zdCB3aWR0aE9mR3JhcGggPSBSZWFjdC51c2VNZW1vKCgpID0+IHtcbiAgICAgIHJldHVybiB3aWR0aCAtICghY29sbGFwc2VkID8gMzAwIDogMCk7XG4gICAgfSwgW3dpZHRoLCBjb2xsYXBzZWRdKTtcblxuICAgIHJldHVybiAoXG4gICAgICA8TGF5b3V0IHN0eWxlPXt7IGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIiB9fT5cbiAgICAgICAgPExheW91dC5Db250ZW50PlxuICAgICAgICAgIHshbG9hZEdyYXBoICYmIChcbiAgICAgICAgICAgIDxIaWdoY2hhcnRzQ2hhcnRcbiAgICAgICAgICAgICAgb3B0aW9ucz17b3B0aW9uc31cbiAgICAgICAgICAgICAgd2lkdGg9e3dpZHRoT2ZHcmFwaH1cbiAgICAgICAgICAgICAgaGVpZ2h0PXtoZWlnaHR9XG4gICAgICAgICAgICAvPlxuICAgICAgICAgICl9XG4gICAgICAgICAge2xvYWRHcmFwaCAmJiA8TG9hZGluZyBtZXNzYWdlPVwiLi4uXCI+PC9Mb2FkaW5nPn1cbiAgICAgICAgPC9MYXlvdXQuQ29udGVudD5cbiAgICAgICAge1xuICAgICAgICAgIDxMYXlvdXQuU2lkZXJcbiAgICAgICAgICAgIGNvbGxhcHNlZD17Y29sbGFwc2VkfVxuICAgICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgICAgd2lkdGg6IDMwMCxcbiAgICAgICAgICAgICAgYmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgICAgICAgICAgICBwYWRkaW5nOiA1LFxuICAgICAgICAgICAgICBoZWlnaHQsXG4gICAgICAgICAgICAgIG92ZXJmbG93WTogXCJhdXRvXCIsXG4gICAgICAgICAgICB9fVxuICAgICAgICAgID5cbiAgICAgICAgICAgIHtjb2xsYXBzZWQgJiYgKFxuICAgICAgICAgICAgICA8QnV0dG9uXG4gICAgICAgICAgICAgICAgZ2hvc3RcbiAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB7XG4gICAgICAgICAgICAgICAgICBzZXRDb2xsYXBzZWQoZmFsc2UpO1xuICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgaWNvbj17PEljb24gaWNvbj1cImZhOmFycm93LWxlZnRcIiAvPn1cbiAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICl9XG4gICAgICAgICAgICB7IWNvbGxhcHNlZCAmJiAoXG4gICAgICAgICAgICAgIDw+XG4gICAgICAgICAgICAgICAgPElucHV0XG4gICAgICAgICAgICAgICAgICB2YWx1ZT17bmFtZUZpbHRlciB8fCBcIlwifVxuICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHNldE5hbWVGaWx0ZXIoZS50YXJnZXQudmFsdWUpO1xuICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyPXtcIi4uLlwifVxuICAgICAgICAgICAgICAgID48L0lucHV0PlxuICAgICAgICAgICAgICAgIDxTcGFjZSBkaXJlY3Rpb249XCJob3Jpem9udGFsXCIgc3R5bGU9e3sgbWFyZ2luVG9wOiA1IH19PlxuICAgICAgICAgICAgICAgICAgPEJ1dHRvblxuICAgICAgICAgICAgICAgICAgICBnaG9zdFxuICAgICAgICAgICAgICAgICAgICBpY29uPXs8SWNvbiBpY29uPVwiZmE6Y2hlY2stZG91YmxlXCIgLz59XG4gICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICBzZXRGaWx0ZXIoKGN1cnJlbnQpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHggPSB7IC4uLmN1cnJlbnQgfTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IG9sZFN0YXRlID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICBPYmplY3Qua2V5cyh4KS5mb3JFYWNoKChrZXksIGluZGV4KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpbmRleCA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9sZFN0YXRlID0geFtrZXldO1xuICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHhba2V5XSA9ICFvbGRTdGF0ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHg7XG4gICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICA+PC9CdXR0b24+XG4gICAgICAgICAgICAgICAgICA8QnV0dG9uXG4gICAgICAgICAgICAgICAgICAgIGdob3N0XG4gICAgICAgICAgICAgICAgICAgIGljb249ezxJY29uIGljb249XCJmYTpleGNoYW5nZS1hbHRcIiAvPn1cbiAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgIHNldEZpbHRlcigoY3VycmVudCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgeCA9IHsgLi4uY3VycmVudCB9O1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBPYmplY3Qua2V5cyh4KS5mb3JFYWNoKChrZXksIGluZGV4KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHhba2V5XSA9ICF4W2tleV07XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB4O1xuICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICAgIDxCdXR0b25cbiAgICAgICAgICAgICAgICAgICAgZ2hvc3RcbiAgICAgICAgICAgICAgICAgICAgaWNvbj17PEljb24gaWNvbj1cImZhOmFycm93LXJpZ2h0XCIgLz59XG4gICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICBzZXRDb2xsYXBzZWQodHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgIDwvU3BhY2U+XG4gICAgICAgICAgICAgICAgPERpdmlkZXIgLz5cblxuICAgICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgICB7T2JqZWN0LmVudHJpZXMoZmlsdGVyKVxuICAgICAgICAgICAgICAgICAgICAuZmlsdGVyKChlbnRyeSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBlbnRyeVswXS5pbmRleE9mKG5hbWVGaWx0ZXIpICE9IC0xIHx8ICFuYW1lRmlsdGVyO1xuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAubWFwKChbc3RhdGUsIGNoZWNrZWRdKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYga2V5PXtzdGF0ZX0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxDaGVja2JveFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoZWNrZWQ9e2NoZWNrZWR9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBuZXdDaGVja2VkID0gZS50YXJnZXQuY2hlY2tlZDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldEZpbHRlcigoY3VycmVudCkgPT4gKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLi4uY3VycmVudCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgW3N0YXRlXTogbmV3Q2hlY2tlZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge3N0YXRlfVxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L0NoZWNrYm94PlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgfSl9XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDwvPlxuICAgICAgICAgICAgKX1cbiAgICAgICAgICA8L0xheW91dC5TaWRlcj5cbiAgICAgICAgfVxuICAgICAgPC9MYXlvdXQ+XG4gICAgKTtcbiAgfVxuKTtcbiJdfQ==