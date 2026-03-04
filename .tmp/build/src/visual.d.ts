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
    private pendingExport;
    private expandedNodes;
    constructor(options: VisualConstructorOptions);
    update(options: VisualUpdateOptions): void;
    /**
     * Рекурсивно строит множество путей для всех узлов, имеющих детей (раскрыты по умолчанию)
     */
    private buildExpandedNodes;
    private countRows;
    private columnWidths;
    private renderVisualization;
    /**
 * Применяет сохранённые ширины к таблице
 */
    private applyColumnWidths;
    private handleExportClick;
    private requestMoreData;
    private handleDataSegment;
    private exportDataView;
    private resetExportState;
    enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): powerbi.VisualObjectInstanceEnumerationObject;
    private applyHideEmptyColumnsSetting;
    private clearDisplay;
}
