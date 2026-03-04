"use strict";
import "./../style/visual.less";
import powerbi from "powerbi-visuals-api";
import { MatrixDataviewHtmlFormatter } from "./matrixDataViewHtmlFormatter";
import { ExcelDownloader } from "./downloadExcel";
import { ColumnResizer } from "./columnResizer";
import { HeightResizer } from "./heightResizer";
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
    private pendingExport: boolean = false;
    private expandedNodes: Set<string> = new Set(); // множество путей раскрытых узлов

    constructor(options: VisualConstructorOptions) {
        this.target = options.element;
        this.host = options.host;
        //window.addEventListener('resize', this.handleResize);
    }

    // public destroy(): void {
    //     window.removeEventListener('resize', this.handleResize);
    // }

    // private handleResize = (): void => {
    //     if (this.currentDataView) {
    //         const rowCount = this.countRows(this.currentDataView);
    //         this.renderVisualization(rowCount);
    //     }
    // };

    public update(options: VisualUpdateOptions) {
        if (!options?.dataViews?.[0]) {
            this.clearDisplay();
            return;
        }

        this.settings = VisualSettings.parse<VisualSettings>(<any>options.dataViews[0]);
        this.currentDataView = options.dataViews[0];
        console.log('dataView', this.currentDataView);
        
        const rowCount = this.countRows(this.currentDataView);
        console.log(`[update] operationKind=${options.operationKind}, segment=${this.currentDataView.metadata?.segment ? 'YES' : 'NO'}, rows=${rowCount}`);

        // Инициализируем expandedNodes при получении новых данных (раскрываем все узлы с детьми)
        if (this.currentDataView?.matrix?.rows?.root) {
            this.expandedNodes.clear();
            this.buildExpandedNodes(this.currentDataView.matrix.rows.root);
        }

        if (this.isExporting) {
            this.handleDataSegment(this.currentDataView, rowCount);
        }

        this.renderVisualization(rowCount);

        if (this.pendingExport) {
            this.exportDataView(rowCount);
            this.pendingExport = false;
        }
    }

    /**
     * Рекурсивно строит множество путей для всех узлов, имеющих детей (раскрыты по умолчанию)
     */
    private buildExpandedNodes(node: any, path: string = ''): void {
        if (node.children && node.children.length > 0 && !node.isSubtotal) {
            // Текущий узел имеет детей – добавляем его путь
            this.expandedNodes.add(path);
            // Рекурсивно обходим детей
            for (let i = 0; i < node.children.length; i++) {
                const child = node.children[i];
                // Формируем уникальный путь: используем levelSourceIndex или value или индекс
                const childPath = path 
                    ? `${path}-${child.levelSourceIndex ?? child.value ?? i}` 
                    : `${child.levelSourceIndex ?? child.value ?? i}`;
                this.buildExpandedNodes(child, childPath);
            }
        }
    }

    private countRows(dataView: DataView): number {
        if (!dataView?.matrix?.rows?.root?.children) return 0;
        const countChildren = (nodes: powerbi.DataViewMatrixNode[]): number => {
            let total = 0;
            for (const node of nodes) {
                total++;
                if (node.children) total += countChildren(node.children);
            }
            return total;
        };
        return countChildren(dataView.matrix.rows.root.children);
    }

    private columnWidths: { [colIndex: number]: number } = {};
    
    private renderVisualization(cntRows: number): void {
        // Создаём кнопку экспорта, если её ещё нет
        if (!this.exportButton) {
            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'export-button-container';
            
            this.exportButton = document.createElement('button');
            this.exportButton.id = "exportBtn";
            this.exportButton.type = "button";
            this.exportButton.className = "export-button";
            this.exportButton.textContent = "Export Data";
            this.exportButton.addEventListener('click', () => this.handleExportClick(cntRows));
            
            buttonContainer.appendChild(this.exportButton);
            this.target.prepend(buttonContainer);
        }

        // Удаляем все старые контейнеры datagrid (включая пустые)
        const existingGrids = this.target.querySelectorAll('.datagrid');
        if (existingGrids.length > 0) {
            // Очищаем ресайзеры перед удалением
            ColumnResizer.cleanup();
            HeightResizer.cleanup();
            existingGrids.forEach(grid => grid.remove());
        }

        if (this.currentDataView?.matrix) {
            // Получаем valueSources (нужны для форматирования)
            const valueSources = (this.currentDataView.matrix as any).valueSources;

            // Создаём HTML-таблицу с учётом раскрытых узлов
            const formattedMatrix = MatrixDataviewHtmlFormatter.formatDataViewMatrix(
                this.currentDataView.matrix,
                valueSources,
                this.expandedNodes   // передаём Set с путями раскрытых узлов
            );

            // Применяем настройку скрытия пустых колонок
            if (this.settings?.hideEmptyCols?.hideColsLabel) {
                this.applyHideEmptyColumnsSetting(formattedMatrix);
            }

            // Добавляем таблицу в DOM
            this.target.appendChild(formattedMatrix);

            // Применяем сохранённые ширины колонок
            const table = formattedMatrix.querySelector('table');
            if (table) {
                this.applyColumnWidths(table);
            }

            // Добавляем обработчики кликов на кнопки раскрытия/свёртывания
            const expandButtons = formattedMatrix.querySelectorAll('.expandCollapseButton');
            expandButtons.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const path = (e.target as HTMLElement).dataset.path;
                    if (path) {
                        // Переключаем состояние узла
                        if (this.expandedNodes.has(path)) {
                            this.expandedNodes.delete(path);
                        } else {
                            this.expandedNodes.add(path);
                        }
                        // Перерисовываем таблицу с новым состоянием (ширины сохранятся через applyColumnWidths)
                        this.renderVisualization(this.countRows(this.currentDataView));
                    }
                });
            });

            // Инициализируем ресайзеры для новой таблицы
            if (table) {
                // Передаём колбэк для сохранения ширины при изменении
                ColumnResizer.init(table, (colIndex: number, newWidth: number) => {
                    this.columnWidths[colIndex] = newWidth;
                });
            }
            HeightResizer.init(formattedMatrix);
        }
    }


    /**
 * Применяет сохранённые ширины к таблице
 */
    private applyColumnWidths(table: HTMLTableElement): void {
        for (let colIndex = 0; colIndex < table.rows[0]?.cells.length; colIndex++) {
            const width = this.columnWidths[colIndex];
            if (width) {
                for (let rowIndex = 0; rowIndex < table.rows.length; rowIndex++) {
                    const cell = table.rows[rowIndex].cells[colIndex];
                    if (cell) {
                        cell.style.width = width + 'px';
                        cell.style.minWidth = width + 'px';
                        cell.style.maxWidth = width + 'px';
                    }
                }
            }
        }
    }

    private handleExportClick(cntRows: number): void {
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
            this.requestMoreData(cntRows);
        } else {
            console.log("No segment → exporting current data immediately");
            this.exportDataView(cntRows);
            this.resetExportState();
        }
    }

    private requestMoreData(cntRows: number): void {
        try {
            console.log("Requesting more data via fetchMoreData(true)...");
            const accepted = this.host.fetchMoreData(true);
            console.log(`fetchMoreData returned: ${accepted}`);
        } catch (error) {
            console.error("Error in fetchMoreData:", error);
            this.exportDataView(cntRows);
            this.resetExportState();
        }
    }

    private handleDataSegment(dataView: DataView, cntRows: number): void {
        console.log(`[handleDataSegment] received. segment: ${dataView.metadata?.segment ? 'YES' : 'NO'}`);
        const sizeEstimate = new Blob([JSON.stringify(this.currentDataView)]).size;
        if (dataView.metadata?.segment) {
            console.log("Segment present → requesting next...");
            this.requestMoreData(cntRows);
            console.log(`Estimated dataView size: ${(sizeEstimate / 1024 / 1024).toFixed(2)} MB`);
        } else {
            console.log("No segment → all data collected, scheduling export after render");
            this.pendingExport = true;
            console.log(`Estimated dataView size: ${(sizeEstimate / 1024 / 1024).toFixed(2)} MB`);
        }
    }

    private exportDataView(cntRows: number): void {
        console.log("Exporting data from HTML table...");
        const table = this.target.querySelector('table');
        if (!table) {
            console.error("No table found for export");
            this.resetExportState();
            return;
        }
        try {
            const downloader = new ExcelDownloader();
            downloader.exportTable(table as HTMLElement, cntRows);
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
            if (this.target.firstChild === this.exportButton?.parentElement) break;
            this.target.removeChild(this.target.firstChild);
        }
    }
}