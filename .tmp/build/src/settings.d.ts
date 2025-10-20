import { dataViewObjectsParser } from "powerbi-visuals-utils-dataviewutils";
import DataViewObjectsParser = dataViewObjectsParser.DataViewObjectsParser;
export declare class VisualSettings extends DataViewObjectsParser {
    subTotals: Subtotals;
    hideEmptyCols: HideEmptyCols;
}
export declare class Subtotals {
    rowSubtotals: boolean;
    columnSubtotals: boolean;
}
export declare class HideEmptyCols {
    hideColsLabel: boolean;
}
