import powerbi from "powerbi-visuals-api";
export declare class DataLoader {
    /**
     * Загружает все доступные данные используя fetchMoreData
     */
    static loadAllData(host: powerbi.extensibility.visual.IVisualHost, initialDataView: powerbi.DataView): Promise<powerbi.DataView>;
    /**
     * Задержка выполнения
     */
    private static delay;
    /**
     * Подсчитывает количество строк в dataView
     */
    static countRows(dataView: powerbi.DataView): number;
    /**
     * Рекурсивно подсчитывает дочерние строки
     */
    private static countChildRows;
    /**
     * Проверяет, поддерживает ли визуализация загрузку дополнительных данных
     */
    static canFetchMoreData(host: powerbi.extensibility.visual.IVisualHost): boolean;
}
