export interface IColumnPartSettings {
    textColor: string;
    backgroundColor: string;
    alignment: string;
}
export interface IMeasureSettings {
    header: IColumnPartSettings;
    total: IColumnPartSettings;
    values: IColumnPartSettings;
}
export declare const defaultColumnPartSettings: IColumnPartSettings;
export declare const defaultMeasureSettings: IMeasureSettings;
