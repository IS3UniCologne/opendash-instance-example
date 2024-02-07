export interface ConfigInterface {
    type: "line" | "spline" | "area" | "areaspline" | "scatter" | "bar";
    unit: "minute" | "hour" | "day" | "week" | "month" | "year";
    start_a: number;
    end_a: number;
    start_b: number;
    end_b: number;
}
