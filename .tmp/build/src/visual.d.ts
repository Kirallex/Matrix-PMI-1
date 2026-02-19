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
    private exportButton;
    private isExporting;
    constructor(options: VisualConstructorOptions);
    update(options: VisualUpdateOptions): void;
    /**
     * Подсчёт количества строк в матрице (рекурсивно)
     */
    private countRows;
    private renderVisualization;
    private handleExportClick;
    private requestMoreData;
    private handleDataSegment;
    private exportCurrentData;
    private exportDataView;
    private resetExportState;
    enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): powerbi.VisualObjectInstanceEnumerationObject;
    private applyHideEmptyColumnsSetting;
    private clearDisplay;
}
