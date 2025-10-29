"use strict"

import { dataViewObjectsParser } from "powerbi-visuals-utils-dataviewutils";

import DataViewObjectsParser = dataViewObjectsParser.DataViewObjectsParser;

export class VisualSettings extends DataViewObjectsParser {
    public subTotals: Subtotals = new Subtotals();
    public hideEmptyCols = new HideEmptyCols();
}

export class Subtotals {
    public rowSubtotals: boolean = true;
    public columnSubtotals: boolean = true;
}

export class HideEmptyCols {
    public hideColsLabel: boolean = false
}