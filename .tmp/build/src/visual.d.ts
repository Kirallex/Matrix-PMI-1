import "./../style/visual.less";
import powerbi from "powerbi-visuals-api";
import IVisual = powerbi.extensibility.visual.IVisual;
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
export declare class Visual implements IVisual {
    private target;
    private settings;
    private host;
    private selectionManager;
    private currentDataView;
    private exportButton;
    private isExporting;
    private pendingExport;
    private canFetchMore;
    private allDataLoaded;
    private maxRowLevelsEver;
    private prevRowCount;
    private currentHeight;
    private formattingSettingsService;
    private measureNames;
    private savedScrollTop;
    private savedScrollLeft;
    private cachedTotalRow;
    constructor(options: VisualConstructorOptions);
    update(options: VisualUpdateOptions): void;
    getFormattingModel(): powerbi.visuals.FormattingModel;
    private updateSpecificColumnGroups;
    private applySpecificColumnStyles;
    private countRows;
    private moveGrandTotalToBottom;
    private findNodePath;
    private renderVisualization;
    /**
     * Если текущий уровень – самый глубокий, сворачивает все развёрнутые узлы предпоследнего уровня.
     */
    private collapseAllOnDeepestLevel;
    private handleExportClick;
    private requestMoreDataForExport;
    private finalizeExport;
    private exportDataView;
    private resetExportState;
    private applyHideEmptyColumnsSetting;
    private applyGrandTotalSetting;
    private applyNonGrandTotalSetting;
    private clearDisplay;
}
