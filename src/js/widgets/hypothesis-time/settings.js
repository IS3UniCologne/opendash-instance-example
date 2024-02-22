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
import { useTranslation } from "@opendash/core";
import { createWidgetComponent } from "@opendash/plugin-monitoring";
import { DataItemHistoryOptionsPicker } from "@opendash/plugin-timeseries";
import GeographySelector from "@opendash/plugin-miaas/dist/components/GeographySelector";
import { Description, IconSelect as Select } from "@opendash/ui";
import { Collapse, Divider } from "antd";
import * as React from "react";
export default createWidgetComponent((_a) => {
    var { draft, updateDraft } = _a, context = __rest(_a, ["draft", "updateDraft"]);
    const [type, setType] = React.useState(draft.geotype || "zones");
    const [json, setJSON] = React.useState(draft.districts);
    const [zones, setZones] = React.useState(draft.districtsFromZones);
    const [dimension, setDimension] = React.useState(draft.districtFromDimension || null);
    const t = useTranslation();
    return (React.createElement(React.Fragment, null,
        React.createElement(Collapse, { bordered: false, defaultActiveKey: ["type"] },
            React.createElement(Collapse.Panel, { header: t("app:widgets.hypothesis.settings.title"), key: "type" },
                React.createElement(Description, { children: t("app:widgets.hypothesis.settings.description") }),
                React.createElement(Select, {
                    value: draft.type, size: 3, onChange: (nextValue) => {
                        updateDraft((draft) => {
                            draft.type = nextValue;
                        });
                    }, options: [
                        {
                            label: t("app:widgets.hypothesis.timeseries"),
                            icon: t("highcharts:types.line_icon"),
                            tooltip: null,
                            value: "timeseries",
                            disabled: false,
                        },
                        {
                            label: t("app:widgets.hypothesis.geozones"),
                            icon: t("highcharts:types.spline_icon"),
                            tooltip: null,
                            value: "geozones",
                            disabled: false,
                        },
                        {
                            label: t("app:widgets.hypothesis.timegeo"),
                            icon: t("highcharts:types.area_icon"),
                            tooltip: null,
                            value: "timegeo",
                            disabled: false,
                        },
                        {
                            label: t("app:widgets.hypothesis.weekendgeo"),
                            icon: t("highcharts:types.areaspline_icon"),
                            tooltip: null,
                            value: "weekendgeo",
                            disabled: false,
                        },
                        {
                            label: t("app:widgets.hypothesis.timeintervalgeo"),
                            icon: t("highcharts:types.scatter_icon"),
                            tooltip: null,
                            value: "timeintervalgeo",
                            disabled: false,
                        },
                    ]
                }))),
        React.createElement(Collapse, { bordered: false },
            React.createElement(Collapse.Panel, { header: t("app:widgets.hypothesis.settings.titleA"), key: "type" },
                React.createElement(Description, { children: t("app:widgets.hypothesis.settings.descriptionA") }),
                React.createElement(DataItemHistoryOptionsPicker, {
                    options: { live: false, history: true, aggregation: false }, value: draft.a_selection, onChange: (nextValue) => {
                        updateDraft((draft) => {
                            draft.a_selection = nextValue;
                        });
                    }
                }),
                React.createElement(Divider),
                React.createElement(GeographySelector, {
                    type: type, value: type === "json" ? json : type === "dimension" ? dimension : zones, update: (type, value) => {
                        setType(type);
                        if (type === "json") {
                            setJSON(value);
                        }
                        if (type === "dimension") {
                            setDimension(value);
                        }
                        if (type === "zones") {
                            setZones(value);
                        }
                        updateDraft((draft) => {
                            draft.geotype = type;
                            if (type === "json") {
                                draft.districtFromDimension = null;
                                draft.districts = value;
                                draft.districtsFromZones = null;
                            }
                            if (type === "dimension") {
                                draft.districtFromDimension = value;
                                draft.districts = null;
                                draft.districtsFromZones = null;
                            }
                            if (type === "zones") {
                                draft.districtFromDimension = null;
                                draft.districts = null;
                                draft.districtsFromZones = value;
                            }
                        });
                    }
                })
            )
        ),
        React.createElement(Collapse, { bordered: false },
            React.createElement(Collapse.Panel, { header: t("app:widgets.hypothesis.settings.titleB"), key: "type" },
                React.createElement(Description, { children: t("app:widgets.hypothesis.settings.descriptionB") }),
                React.createElement(DataItemHistoryOptionsPicker, {
                    options: { live: false, history: true, aggregation: false }, value: draft.b_selection, onChange: (nextValue) => {
                        updateDraft((draft) => {
                            draft.b_selection = nextValue;
                        });
                    }
                }),
                React.createElement(Divider),
                React.createElement(GeographySelector, {
                    type: type, value: type === "json" ? json : type === "dimension" ? dimension : zones, update: (type, value) => {
                        setType(type);
                        if (type === "json") {
                            setJSON(value);
                        }
                        if (type === "dimension") {
                            setDimension(value);
                        }
                        if (type === "zones") {
                            setZones(value);
                        }
                        updateDraft((draft) => {
                            draft.geotype = type;
                            if (type === "json") {
                                draft.districtFromDimension = null;
                                draft.districts = value;
                                draft.districtsFromZones = null;
                            }
                            if (type === "dimension") {
                                draft.districtFromDimension = value;
                                draft.districts = null;
                                draft.districtsFromZones = null;
                            }
                            if (type === "zones") {
                                draft.districtFromDimension = null;
                                draft.districts = null;
                                draft.districtsFromZones = value;
                            }
                        });
                    }
                })
            ))));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2V0dGluZ3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvd2lkZ2V0cy9oYy10aW1lc2VyaWVzLWNvbXBhcmUvc2V0dGluZ3MudHN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBQUEsT0FBTyxFQUFFLGNBQWMsRUFBRSxNQUFNLGdCQUFnQixDQUFDO0FBQ2hELE9BQU8sRUFBRSxxQkFBcUIsRUFBRSxNQUFNLDZCQUE2QixDQUFDO0FBQ3BFLE9BQU8sRUFBRSxXQUFXLEVBQUUsVUFBVSxJQUFJLE1BQU0sRUFBRSxNQUFNLGNBQWMsQ0FBQztBQUNqRSxPQUFPLEVBQUUsUUFBUSxFQUFFLE1BQU0sTUFBTSxDQUFDO0FBQ2hDLE9BQU8sS0FBSyxLQUFLLE1BQU0sT0FBTyxDQUFDO0FBRy9CLGVBQWUscUJBQXFCLENBQ2xDLENBQUMsRUFBa0MsRUFBRSxFQUFFO1FBQXRDLEVBQUUsS0FBSyxFQUFFLFdBQVcsT0FBYyxFQUFULE9BQU8sY0FBaEMsd0JBQWtDLENBQUY7SUFDL0IsTUFBTSxDQUFDLEdBQUcsY0FBYyxFQUFFLENBQUM7SUFDM0IsT0FBTyxDQUNMLG9CQUFDLEtBQUssQ0FBQyxRQUFRO1FBQ2Isb0JBQUMsUUFBUSxJQUFDLFFBQVEsRUFBRSxLQUFLLEVBQUUsZ0JBQWdCLEVBQUUsQ0FBQyxNQUFNLENBQUM7WUFDbkQsb0JBQUMsUUFBUSxDQUFDLEtBQUssSUFBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLDhCQUE4QixDQUFDLEVBQUUsR0FBRyxFQUFDLE1BQU07Z0JBQ25FLG9CQUFDLFdBQVcsSUFBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLG9DQUFvQyxDQUFDLEdBQUk7Z0JBQ2xFLG9CQUFDLE1BQU0sSUFDTCxLQUFLLEVBQUUsS0FBSyxDQUFDLElBQUksRUFDakIsSUFBSSxFQUFFLENBQUMsRUFDUCxRQUFRLEVBQUUsQ0FBQyxTQUFTLEVBQUUsRUFBRTt3QkFDdEIsV0FBVyxDQUFDLENBQUMsS0FBSyxFQUFFLEVBQUU7NEJBQ3BCLEtBQUssQ0FBQyxJQUFJLEdBQUcsU0FNSixDQUFDO3dCQUNaLENBQUMsQ0FBQyxDQUFDO29CQUNMLENBQUMsRUFDRCxPQUFPLEVBQUU7d0JBQ1A7NEJBQ0UsS0FBSyxFQUFFLENBQUMsQ0FBQyx1QkFBdUIsQ0FBQzs0QkFDakMsSUFBSSxFQUFFLENBQUMsQ0FBQyw0QkFBNEIsQ0FBQzs0QkFDckMsT0FBTyxFQUFFLElBQUk7NEJBQ2IsS0FBSyxFQUFFLE1BQU07NEJBQ2IsUUFBUSxFQUFFLEtBQUs7eUJBQ2hCO3dCQUNEOzRCQUNFLEtBQUssRUFBRSxDQUFDLENBQUMseUJBQXlCLENBQUM7NEJBQ25DLElBQUksRUFBRSxDQUFDLENBQUMsOEJBQThCLENBQUM7NEJBQ3ZDLE9BQU8sRUFBRSxJQUFJOzRCQUNiLEtBQUssRUFBRSxRQUFROzRCQUNmLFFBQVEsRUFBRSxLQUFLO3lCQUNoQjt3QkFDRDs0QkFDRSxLQUFLLEVBQUUsQ0FBQyxDQUFDLHVCQUF1QixDQUFDOzRCQUNqQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLDRCQUE0QixDQUFDOzRCQUNyQyxPQUFPLEVBQUUsSUFBSTs0QkFDYixLQUFLLEVBQUUsTUFBTTs0QkFDYixRQUFRLEVBQUUsS0FBSzt5QkFDaEI7d0JBQ0Q7NEJBQ0UsS0FBSyxFQUFFLENBQUMsQ0FBQyw2QkFBNkIsQ0FBQzs0QkFDdkMsSUFBSSxFQUFFLENBQUMsQ0FBQyxrQ0FBa0MsQ0FBQzs0QkFDM0MsT0FBTyxFQUFFLElBQUk7NEJBQ2IsS0FBSyxFQUFFLFlBQVk7NEJBQ25CLFFBQVEsRUFBRSxLQUFLO3lCQUNoQjt3QkFDRDs0QkFDRSxLQUFLLEVBQUUsQ0FBQyxDQUFDLDBCQUEwQixDQUFDOzRCQUNwQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLCtCQUErQixDQUFDOzRCQUN4QyxPQUFPLEVBQUUsSUFBSTs0QkFDYixLQUFLLEVBQUUsU0FBUzs0QkFDaEIsUUFBUSxFQUFFLEtBQUs7eUJBQ2hCO3dCQUNEOzRCQUNFLEtBQUssRUFBRSxDQUFDLENBQUMsc0JBQXNCLENBQUM7NEJBQ2hDLElBQUksRUFBRSxDQUFDLENBQUMsMkJBQTJCLENBQUM7NEJBQ3BDLE9BQU8sRUFBRSxJQUFJOzRCQUNiLEtBQUssRUFBRSxLQUFLOzRCQUNaLFFBQVEsRUFBRSxLQUFLO3lCQUNoQjtxQkFDRixHQUNELENBQ2EsQ0FDUixDQUNJLENBQ2xCLENBQUM7QUFDSixDQUFDLENBQ0YsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHVzZVRyYW5zbGF0aW9uIH0gZnJvbSBcIkBvcGVuZGFzaC9jb3JlXCI7XG5pbXBvcnQgeyBjcmVhdGVXaWRnZXRDb21wb25lbnQgfSBmcm9tIFwiQG9wZW5kYXNoL3BsdWdpbi1tb25pdG9yaW5nXCI7XG5pbXBvcnQgeyBEZXNjcmlwdGlvbiwgSWNvblNlbGVjdCBhcyBTZWxlY3QgfSBmcm9tIFwiQG9wZW5kYXNoL3VpXCI7XG5pbXBvcnQgeyBDb2xsYXBzZSB9IGZyb20gXCJhbnRkXCI7XG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tIFwicmVhY3RcIjtcbmltcG9ydCB7IENvbmZpZ0ludGVyZmFjZSB9IGZyb20gXCIuL3R5cGVzXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGNyZWF0ZVdpZGdldENvbXBvbmVudDxDb25maWdJbnRlcmZhY2U+KFxuICAoeyBkcmFmdCwgdXBkYXRlRHJhZnQsIC4uLmNvbnRleHQgfSkgPT4ge1xuICAgIGNvbnN0IHQgPSB1c2VUcmFuc2xhdGlvbigpO1xuICAgIHJldHVybiAoXG4gICAgICA8UmVhY3QuRnJhZ21lbnQ+XG4gICAgICAgIDxDb2xsYXBzZSBib3JkZXJlZD17ZmFsc2V9IGRlZmF1bHRBY3RpdmVLZXk9e1tcInR5cGVcIl19PlxuICAgICAgICAgIDxDb2xsYXBzZS5QYW5lbCBoZWFkZXI9e3QoXCJoaWdoY2hhcnRzOnR5cGVfc2VsZWN0LnRpdGxlXCIpfSBrZXk9XCJ0eXBlXCI+XG4gICAgICAgICAgICA8RGVzY3JpcHRpb24gY2hpbGRyZW49e3QoXCJoaWdoY2hhcnRzOnR5cGVfc2VsZWN0LmRlc2NyaXB0aW9uXCIpfSAvPlxuICAgICAgICAgICAgPFNlbGVjdFxuICAgICAgICAgICAgICB2YWx1ZT17ZHJhZnQudHlwZX1cbiAgICAgICAgICAgICAgc2l6ZT17M31cbiAgICAgICAgICAgICAgb25DaGFuZ2U9eyhuZXh0VmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgICB1cGRhdGVEcmFmdCgoZHJhZnQpID0+IHtcbiAgICAgICAgICAgICAgICAgIGRyYWZ0LnR5cGUgPSBuZXh0VmFsdWUgYXNcbiAgICAgICAgICAgICAgICAgICAgfCBcImxpbmVcIlxuICAgICAgICAgICAgICAgICAgICB8IFwic3BsaW5lXCJcbiAgICAgICAgICAgICAgICAgICAgfCBcImFyZWFcIlxuICAgICAgICAgICAgICAgICAgICB8IFwiYXJlYXNwbGluZVwiXG4gICAgICAgICAgICAgICAgICAgIHwgXCJzY2F0dGVyXCJcbiAgICAgICAgICAgICAgICAgICAgfCBcImJhclwiO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICBvcHRpb25zPXtbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgbGFiZWw6IHQoXCJoaWdoY2hhcnRzOnR5cGVzLmxpbmVcIiksXG4gICAgICAgICAgICAgICAgICBpY29uOiB0KFwiaGlnaGNoYXJ0czp0eXBlcy5saW5lX2ljb25cIiksXG4gICAgICAgICAgICAgICAgICB0b29sdGlwOiBudWxsLFxuICAgICAgICAgICAgICAgICAgdmFsdWU6IFwibGluZVwiLFxuICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ6IGZhbHNlLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgbGFiZWw6IHQoXCJoaWdoY2hhcnRzOnR5cGVzLnNwbGluZVwiKSxcbiAgICAgICAgICAgICAgICAgIGljb246IHQoXCJoaWdoY2hhcnRzOnR5cGVzLnNwbGluZV9pY29uXCIpLFxuICAgICAgICAgICAgICAgICAgdG9vbHRpcDogbnVsbCxcbiAgICAgICAgICAgICAgICAgIHZhbHVlOiBcInNwbGluZVwiLFxuICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ6IGZhbHNlLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgbGFiZWw6IHQoXCJoaWdoY2hhcnRzOnR5cGVzLmFyZWFcIiksXG4gICAgICAgICAgICAgICAgICBpY29uOiB0KFwiaGlnaGNoYXJ0czp0eXBlcy5hcmVhX2ljb25cIiksXG4gICAgICAgICAgICAgICAgICB0b29sdGlwOiBudWxsLFxuICAgICAgICAgICAgICAgICAgdmFsdWU6IFwiYXJlYVwiLFxuICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ6IGZhbHNlLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgbGFiZWw6IHQoXCJoaWdoY2hhcnRzOnR5cGVzLmFyZWFzcGxpbmVcIiksXG4gICAgICAgICAgICAgICAgICBpY29uOiB0KFwiaGlnaGNoYXJ0czp0eXBlcy5hcmVhc3BsaW5lX2ljb25cIiksXG4gICAgICAgICAgICAgICAgICB0b29sdGlwOiBudWxsLFxuICAgICAgICAgICAgICAgICAgdmFsdWU6IFwiYXJlYXNwbGluZVwiLFxuICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ6IGZhbHNlLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgbGFiZWw6IHQoXCJoaWdoY2hhcnRzOnR5cGVzLnNjYXR0ZXJcIiksXG4gICAgICAgICAgICAgICAgICBpY29uOiB0KFwiaGlnaGNoYXJ0czp0eXBlcy5zY2F0dGVyX2ljb25cIiksXG4gICAgICAgICAgICAgICAgICB0b29sdGlwOiBudWxsLFxuICAgICAgICAgICAgICAgICAgdmFsdWU6IFwic2NhdHRlclwiLFxuICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ6IGZhbHNlLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgbGFiZWw6IHQoXCJoaWdoY2hhcnRzOnR5cGVzLmJhclwiKSxcbiAgICAgICAgICAgICAgICAgIGljb246IHQoXCJoaWdoY2hhcnRzOnR5cGVzLmJhcl9pY29uXCIpLFxuICAgICAgICAgICAgICAgICAgdG9vbHRpcDogbnVsbCxcbiAgICAgICAgICAgICAgICAgIHZhbHVlOiBcImJhclwiLFxuICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ6IGZhbHNlLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIF19XG4gICAgICAgICAgICAvPlxuICAgICAgICAgIDwvQ29sbGFwc2UuUGFuZWw+XG4gICAgICAgIDwvQ29sbGFwc2U+XG4gICAgICA8L1JlYWN0LkZyYWdtZW50PlxuICAgICk7XG4gIH1cbik7XG4iXX0=