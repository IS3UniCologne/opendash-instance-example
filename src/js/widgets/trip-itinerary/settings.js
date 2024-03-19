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
import * as React from "react";
import GeographySelector from "@opendash/plugin-miaas/dist/components/GeographySelector";
export default createWidgetComponent((_a) => {
    var { draft, assignToDraft, updateDraft } = _a, context = __rest(_a, ["draft", "assignToDraft", "updateDraft"]);
    //const [text, setText] = React.useState(JSON.stringify(draft.districts));
    const [type, setType] = React.useState(draft.type || "zones");
    const [json, setJSON] = React.useState(draft.districts);
    const [zones, setZones] = React.useState(draft.districtsFromZones);
    const [dimension, setDimension] = React.useState(draft.districtFromDimension || null);
    return (React.createElement(React.Fragment, null,
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
                    draft.type = type;
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
        })));
});