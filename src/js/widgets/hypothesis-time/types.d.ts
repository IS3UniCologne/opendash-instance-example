export interface ConfigInterface {
    featuresA: string;
    featuresB: string;
    geotypeName: string;
    type: "weekendgeo" | "timeintervalgeo" | "timegeo" | "geo";
    geotype: "zones" | "json" | "dimension";
    geotypeB: "zones" | "json" | "dimension";
    districts: string;
    districtsFromZones: string;
    districtsFromDimension: string;
    districtsB: string;
    districtsFromZonesB: string;
    districtsFromDimensionB: string;
    use_geo_filter: boolean;
    a_title: string;
    a_selection: any;
    a_start_hour: number;
    a_end_hour: number;
    b_selection: any;
    b_start_hour: number;
    b_end_hour: number;
}
