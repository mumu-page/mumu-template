export const autoRows = (minRowHeight = "20px") =>
    `minmax(${minRowHeight}, auto)`;

export const frGetter = (value: any) => {
    if (!value) return;
    return typeof value === "number" ? `repeat(${value}, 1fr)` : value;
};

export const gap = ({ gap = "8px" }) => gap;

export const flow = ({ flow = "row" }) => flow;

export const formatAreas = (areas: any[] | undefined) => {
    if (!areas) return;
    return areas.map((area: any) => `"${area}"`).join(" ");
};
