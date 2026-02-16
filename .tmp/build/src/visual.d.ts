import "./../style/visual.less";
import powerbi from "powerbi-visuals-api";
import IVisual = powerbi.extensibility.visual.IVisual;
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
export declare class Visual implements IVisual {
    private target;
    private settings;
    private host;
    private currentDataView;
    private isFetchingData;
    private finalDataView;
    private segmentCount;
    constructor(options: VisualConstructorOptions);
    update(options: VisualUpdateOptions): void;
    /**
     * Начинает процесс сбора данных
     */
    private startDataFetching;
    /**
     * Запрашивает дополнительные данные
     */
    private requestMoreData;
    /**
     * Обрабатывает полученный сегмент данных
     */
    private processDataSegment;
    /**
     * Завершает сбор и экспортирует данные
     */
    private finishDataFetching;
    /**
     * Экспортирует данные через ExcelDownloader
     */
    private exportData;
    /**
     * Подсчитывает количество строк в dataView
     */
    private countRows;
    enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): powerbi.VisualObjectInstanceEnumerationObject;
    private applyHideEmptyColumnsSetting;
    private clearDisplay;
}
