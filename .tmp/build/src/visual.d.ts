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
    constructor(options: VisualConstructorOptions);
    update(options: VisualUpdateOptions): void;
    /**
     * Обработчик клика по кнопке экспорта
     */
    private handleExportClick;
    /**
     * Выполняет экспорт текущих данных
     */
    private performExport;
    /**
     * Прямой экспорт без симуляции
     */
    private directExport;
    /**
     * Вызывает exportFromDataView через рефлексию (временное решение)
     * Лучше сделать метод публичным в ExcelDownloader
     */
    private callExportFromDataView;
    /**
     * Ключевой метод для отображения свойств в панели форматирования Power BI
     */
    enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): powerbi.VisualObjectInstanceEnumerationObject;
    private applyHideEmptyColumnsSetting;
    private clearDisplay;
}
