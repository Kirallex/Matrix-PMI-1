import "./../style/visual.less";
import powerbi from "powerbi-visuals-api";
import IVisual = powerbi.extensibility.visual.IVisual;
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
export declare class Visual implements IVisual {
    private target;
    private settings;
    private host;
    private currentDataView;
    private exportButton;
    private isExporting;
    private pendingExport;
    private expandedNodes;
    private prevRowCount;
    private currentHeight;
    private formattingSettingsService;
    private loadingAllData;
    private allDataLoaded;
    private pendingRenderAfterLoad;
    private measureNames;
    private savedScrollTop;
    private savedScrollLeft;
    private targetRowPath;
    constructor(options: VisualConstructorOptions);
    update(options: VisualUpdateOptions): void;
    getFormattingModel(): powerbi.visuals.FormattingModel;
    /**
     * Обновляет группы в SpecificColumn и ColumnWidth в соответствии с реальными именами мер.
     */
    private updateSpecificColumnGroups;
    /**
     * Применяет стили для каждой меры (Header, Total, Values) к отрисованной таблице.
     */
    private applySpecificColumnStyles;
    private requestNextDataSegment;
    private countRows;
    private renderVisualization;
    private handleExportClick;
    private requestMoreData;
    private handleDataSegment;
    private exportDataView;
    private resetExportState;
    private applyHideEmptyColumnsSetting;
    private applyGrandTotalSetting;
    private applyNonGrandTotalSetting;
    private clearDisplay;
}
