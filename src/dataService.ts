"use strict";
import powerbi from "powerbi-visuals-api";

export class SimpleDataService {
    /**
     * Простая проверка доступности данных
     */
    public static async checkData(
        host: powerbi.extensibility.visual.IVisualHost,
        dataView: powerbi.DataView
    ): Promise<{hasFullData: boolean; rowCount: number}> {
        
        const rowCount = dataView.matrix?.rows?.root?.children?.length || 0;
        //console.log('Data check:', { rowCount, hostMethods: Object.keys(host) });
        console.log("host", host)
        
        // Просто возвращаем текущий dataView
        return {
            hasFullData: rowCount > 0,
            rowCount: rowCount
        };
    }
}