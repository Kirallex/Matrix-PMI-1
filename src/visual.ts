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
    private pendingExport: boolean = false; // Флаг для отложенного экспорта

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

        // Рендерим визуализацию (таблицу)
        this.renderVisualization();

        // Если есть отложенный экспорт, выполняем его после обновления таблицы
        if (this.pendingExport) {
            this.exportDataView();
            this.pendingExport = false;
        }
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
            
            // Применяем настройку скрытия пустых колонок
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
            this.exportDataView();
            this.resetExportState();
        }
    }

    private requestMoreData(): void {
        try {
            console.log("Requesting more data via fetchMoreData(true)...");
            const accepted = this.host.fetchMoreData(true);
            console.log(`fetchMoreData returned: ${accepted}`);
            // Если fetchMoreData вернул false, ничего не делаем – данные либо закончились, либо лимит.
            // В следующем update обработаем сегмент.
        } catch (error) {
            console.error("Error in fetchMoreData:", error);
            // При ошибке пытаемся экспортировать текущие данные
            this.exportDataView();
            this.resetExportState();
        }
    }

    private handleDataSegment(dataView: DataView): void {
        console.log(`[handleDataSegment] received. segment: ${dataView.metadata?.segment ? 'YES' : 'NO'}`);
        const sizeEstimate = new Blob([JSON.stringify(this.currentDataView)]).size;
        if (dataView.metadata?.segment) {
            console.log("Segment present → requesting next...");
            this.requestMoreData();
            console.log(`Estimated dataView size: ${(sizeEstimate / 1024 / 1024).toFixed(2)} MB`);
        } else {
            console.log("No segment → all data collected, scheduling export after render");
            this.pendingExport = true; // откладываем экспорт до следующей отрисовки
            console.log(`Estimated dataView size: ${(sizeEstimate / 1024 / 1024).toFixed(2)} MB`);
        }
    }

    private exportDataView(): void {
        console.log("Exporting data from HTML table...");
        const table = this.target.querySelector('table');
        if (!table) {
            console.error("No table found for export");
            this.resetExportState();
            return;
        }
        try {
            const downloader = new ExcelDownloader();
            downloader.exportTable(table as HTMLElement);
        } catch (error) {
            console.error("Export failed:", error);
        } finally {
            this.resetExportState();
        }
    }

    private resetExportState(): void {
        this.isExporting = false;
        this.pendingExport = false;
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