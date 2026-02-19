"use strict";
import "./../style/visual.less";
import powerbi from "powerbi-visuals-api";
import { MatrixDataviewHtmlFormatter } from "./matrixDataViewHtmlFormatter";
import { ExcelDownloader } from "./downloadExcel";
import IVisual = powerbi.extensibility.visual.IVisual;
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import DataView = powerbi.DataView;
import Host = powerbi.extensibility.visual.IVisualHost;
import { VisualSettings } from "./settings";
import { ObjectEnumerationBuilder } from "./objectEnumerationBuilder";
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
import { MatrixEmptyColumnsHider } from "./hideEmptyCols";
import VisualDataChangeOperationKind = powerbi.VisualDataChangeOperationKind;

export class Visual implements IVisual {
    private target: HTMLElement;
    private settings: VisualSettings;
    private host: Host;
    private currentDataView: DataView;
    private exportButton: HTMLButtonElement | null = null;
    private isExporting: boolean = false;

    constructor(options: VisualConstructorOptions) {
        this.target = options.element;
        this.host = options.host;
    }

    public update(options: VisualUpdateOptions) {
        if (!options?.dataViews?.[0]) {
            this.clearDisplay();
            return;
        }

        this.settings = VisualSettings.parse<VisualSettings>(<any>options.dataViews[0]);
        this.currentDataView = options.dataViews[0];

        // Подсчёт строк для диагностики
        const rowCount = this.countRows(this.currentDataView);
        console.log(`[update] operationKind=${options.operationKind}, segment=${this.currentDataView.metadata?.segment ? 'YES' : 'NO'}, rows=${rowCount}`);

        if (this.isExporting) {
            this.handleDataSegment(this.currentDataView);
        }

        this.renderVisualization();
    }

    /**
     * Подсчёт количества строк в матрице (рекурсивно)
     */
    private countRows(dataView: DataView): number {
        if (!dataView?.matrix?.rows?.root?.children) return 0;

        const countChildren = (nodes: powerbi.DataViewMatrixNode[]): number => {
            let total = 0;
            for (const node of nodes) {
                total++; // сам узел
                if (node.children) {
                    total += countChildren(node.children);
                }
            }
            return total;
        };

        return countChildren(dataView.matrix.rows.root.children);
    }

    private renderVisualization(): void {
        // Создаём кнопку, если её нет
        if (!this.exportButton) {
            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'export-button-container';
            
            this.exportButton = document.createElement('button');
            this.exportButton.id = "exportBtn";
            this.exportButton.type = "button";
            this.exportButton.className = "export-button";
            this.exportButton.textContent = "Export Data";
            this.exportButton.addEventListener('click', () => this.handleExportClick());
            
            buttonContainer.appendChild(this.exportButton);
            this.target.prepend(buttonContainer);
        }

        // Удаляем старую таблицу
        const existingTable = this.target.querySelector('table');
        if (existingTable) {
            existingTable.remove();
        }

        if (this.currentDataView?.matrix) {
            const formattedMatrix = MatrixDataviewHtmlFormatter.formatDataViewMatrix(this.currentDataView.matrix);
            
            if (this.settings?.hideEmptyCols?.hideColsLabel) {
                this.applyHideEmptyColumnsSetting(formattedMatrix);
            }
            
            this.target.appendChild(formattedMatrix);
        }
    }

    private handleExportClick(): void {
        if (this.isExporting) return;

        console.log("=== Starting data export process ===");
        this.isExporting = true;

        if (this.exportButton) {
            this.exportButton.disabled = true;
            this.exportButton.textContent = "Loading data...";
        }

        const hasSegment = this.currentDataView.metadata?.segment;
        console.log(`[handleExportClick] currentDataView.metadata.segment: ${hasSegment ? 'YES' : 'NO'}`);

        if (hasSegment) {
            console.log("Segment exists → requesting more data...");
            this.requestMoreData();
        } else {
            console.log("No segment → exporting current data immediately");
            this.exportCurrentData();
        }
    }

    private requestMoreData(): void {
        try {
            console.log("Requesting more data via fetchMoreData(true)...");
            const accepted = this.host.fetchMoreData(true);
            console.log(`fetchMoreData returned: ${accepted}`);
            if (!accepted) {
                console.log("fetchMoreData returned false, exporting current data");
                this.exportCurrentData();
            }
        } catch (error) {
            console.error("Error in fetchMoreData:", error);
            this.exportCurrentData();
        }
    }

    private handleDataSegment(dataView: DataView): void {
        console.log(`[handleDataSegment] received. segment: ${dataView.metadata?.segment ? 'YES' : 'NO'}`);
        if (dataView.metadata?.segment) {
            console.log("Segment present → requesting next...");
            this.requestMoreData();
        } else {
            console.log("No segment → all data collected, exporting...");
            this.exportDataView(dataView);
        }
    }

    private exportCurrentData(): void {
        console.log("exportCurrentData called");
        this.exportDataView(this.currentDataView);
    }

    private exportDataView(dataView: DataView): void {
        console.log("Exporting data...");
        try {
            const downloader = new ExcelDownloader(this.host, dataView);
            downloader.exportDataView(dataView);
        } catch (error) {
            console.error("Export failed:", error);
        } finally {
            this.resetExportState();
        }
    }

    private resetExportState(): void {
        this.isExporting = false;
        if (this.exportButton) {
            this.exportButton.disabled = false;
            this.exportButton.textContent = "Export Data";
        }
    }

    public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): powerbi.VisualObjectInstanceEnumerationObject {
        const enumeration = new ObjectEnumerationBuilder();

        switch (options.objectName) {
            case "subTotals":
                enumeration.pushInstance({
                    objectName: "subTotals",
                    displayName: "Subtotals Settings",
                    selector: null,
                    properties: {
                        rowSubtotals: this.settings.subTotals.rowSubtotals,
                        columnSubtotals: this.settings.subTotals.columnSubtotals
                    }
                });
                break;

            case "hideEmptyCols":
                enumeration.pushInstance({
                    objectName: "hideEmptyCols",
                    displayName: "Hide Empty Columns",
                    selector: null,
                    properties: {
                        hideColsLabel: this.settings.hideEmptyCols.hideColsLabel
                    }
                });
                break;
        }

        return enumeration.complete();
    }

    private applyHideEmptyColumnsSetting(formattedMatrix: HTMLElement): void {
        const hider = new MatrixEmptyColumnsHider();
        hider.hideEmptyColsMethod(formattedMatrix);
    }

    private clearDisplay(): void {
        while (this.target.firstChild) {
            if (this.target.firstChild === this.exportButton?.parentElement) {
                break;
            }
            this.target.removeChild(this.target.firstChild);
        }
    }
}