import powerbi from "powerbi-visuals-api";
export declare class DataLoader {
    /**
     * Просто возвращает переданные данные без попытки загрузить больше
     */
    static loadAllData(host: powerbi.extensibility.visual.IVisualHost, initialDataView: powerbi.DataView): Promise<powerbi.DataView>;
    /**
     * Задержка выполнения
     */
    static delay(ms: number): Promise<void>;
    /**
     * Подсчитывает количество строк в dataView
     */
    static countRows(dataView: powerbi.DataView): number;
    /**
     * Рекурсивно подсчитывает дочерние строки
     */
    private static countChildRows;
}
