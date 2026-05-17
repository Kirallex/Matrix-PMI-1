import powerbi from "powerbi-visuals-api";
import DataViewMatrixNode = powerbi.DataViewMatrixNode;
export declare class DrillManager {
    private host;
    private currentDataView;
    private renderCallback;
    private target;
    private drillMode;
    private currentRoot;
    private drillStack;
    private selectedRowPath;
    private expandedNodes;
    private toolbar;
    constructor(host: powerbi.extensibility.visual.IVisualHost, target: HTMLElement, renderCallback: () => void, expandedNodes: Set<string>);
    setDataView(dataView: powerbi.DataView): void;
    reset(): void;
    getCurrentRoot(): DataViewMatrixNode | null;
    getSelectedRowPath(): string | null;
    applyRowHighlight(container: HTMLElement): void;
    onRowHeaderClick(event: Event): void;
    private createToolbar;
    private toggleDrillMode;
    private updateToolbarState;
    private drillUp;
    private drillDownSingle;
    private drillDownGrouped;
    private findNodeByPath;
}
