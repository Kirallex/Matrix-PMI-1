import powerbi from "powerbi-visuals-api";
export declare class SimpleDataService {
    /**
     * Простая проверка доступности данных
     */
    static checkData(host: powerbi.extensibility.visual.IVisualHost, dataView: powerbi.DataView): Promise<{
        hasFullData: boolean;
        rowCount: number;
    }>;
}
