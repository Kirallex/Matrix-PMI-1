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
import { MatrixEmptyColumnsHider } from "./hideEmptyCols";
import VisualDataChangeOperationKind = powerbi.VisualDataChangeOperationKind;
import { applyGridSettings } from "./gridSettings";
import { applyValuesSettings } from "./valuesSettings";
import { applyColumnHeadersSettings } from "./columnHeadersSettings";
import { applyRowHeadersSettings } from "./rowHeaderSettings";
import { applyColumnGrandTotalSettings } from "./columnGrandTotalSettings";
import { applyRowGrandTotalSettings } from "./rowGrandTotalSettings";
import { FormattingSettingsService } from "powerbi-visuals-utils-formattingmodel";
import { IMeasureSettings } from "./measureSettings";
import { applySpecificColumnSettings } from "./specificColumnSettings";
import { VisualSettings, MeasureCard } from "./settings";

export class Visual implements IVisual {
    private target: HTMLElement;
    private settings: VisualSettings;
    private host: Host;
    private currentDataView!: DataView;
    private exportButton: HTMLButtonElement | null = null;
    private isExporting: boolean = false;
    private pendingExport: boolean = false;
    private expandedNodes: Set<string> = new Set();
    private prevRowCount: number = 0;
    private columnWidths: { [colIndex: number]: number } = {};
    private currentHeight: number | null = null;
    private formattingSettingsService: FormattingSettingsService;

    private loadingAllData: boolean = false;
    private allDataLoaded: boolean = false;
    private pendingRenderAfterLoad: boolean = false;

    private measureNames: string[] = [];

    constructor(options: VisualConstructorOptions) {
        this.target = options.element;
        this.host = options.host;
        this.formattingSettingsService = new FormattingSettingsService();
        this.settings = new VisualSettings();
    }

    public update(options: VisualUpdateOptions) {
        if (!options?.dataViews?.[0]) {
            this.clearDisplay();
            return;
        }

        this.currentDataView = options.dataViews[0];
        this.settings = this.formattingSettingsService.populateFormattingSettingsModel(
            VisualSettings,
            options.dataViews[0]
        ) as VisualSettings;

        // Получаем реальные имена мер
        const measures = this.currentDataView?.matrix?.columns?.levels?.find(level =>
            level.sources.some(source => source.isMeasure)
        )?.sources || [];
        this.measureNames = measures.map(m => m.displayName);

        // Обновляем структуру SpecificColumn (динамические группы)
        this.updateSpecificColumnGroups();

        const rowCount = this.countRows(this.currentDataView);
        console.log(`[update] operationKind=${options.operationKind}, segment=${this.currentDataView.metadata?.segment ? 'YES' : 'NO'}, rows=${rowCount}`);

        if (options.operationKind === VisualDataChangeOperationKind.Create) {
            this.allDataLoaded = false;
            this.loadingAllData = false;
        }

        // Автозагрузка сегментов
        if (!this.isExporting && !this.allDataLoaded) {
            if (!this.loadingAllData) {
                if (this.currentDataView.metadata?.segment) {
                    //console.log('Starting to load all data segments for display...');
                    this.loadingAllData = true;
                    this.requestNextDataSegment();
                    return;
                } else {
                    this.allDataLoaded = true;
                }
            }

            if (this.loadingAllData && options.operationKind === VisualDataChangeOperationKind.Append) {
                //console.log('Received next data segment, continuing...');
                this.pendingRenderAfterLoad = true;
                if (this.currentDataView.metadata?.segment) {
                    this.requestNextDataSegment();
                } else {
                    //console.log('All data loaded.');
                    this.loadingAllData = false;
                    this.allDataLoaded = true;
                    this.renderVisualization(this.countRows(this.currentDataView));
                    this.pendingRenderAfterLoad = false;
                }
                return;
            }
        }

        if (options.operationKind === VisualDataChangeOperationKind.Create) {
            //console.log('New data set, clearing expandedNodes and columnWidths');
            this.expandedNodes.clear();
            this.columnWidths = {};
            this.prevRowCount = rowCount;
        } else {
            this.prevRowCount = rowCount;
        }

        if (this.isExporting) {
            this.handleDataSegment(this.currentDataView, rowCount);
        }

        if (!this.loadingAllData) {
            this.renderVisualization(rowCount);
            //this.applySpecificColumnStyles();
        }

        if (this.pendingExport) {
            this.exportDataView(rowCount);
            this.pendingExport = false;
        }
    }

    public getFormattingModel(): powerbi.visuals.FormattingModel {
        try {
            this.updateSpecificColumnGroups();
            const model = this.formattingSettingsService.buildFormattingModel(this.settings);
            return model;
        } catch (err) {
            console.error("Error in getFormattingModel:", err);
            return { cards: [] };
        }
    }

    /**
     * Обновляет группы в SpecificColumn в соответствии с реальными именами мер.
     * Вызывается из update() и getFormattingModel().
     */
    private updateSpecificColumnGroups(): void {
        // Вызываем метод updateGroups у specificColumn, который перестраивает карточки
        (this.settings.specificColumn as any).updateGroups(this.measureNames);
    }

    /**
     * Применяет стили для каждой меры (Header, Total, Values) к отрисованной таблице.
     */
    private applySpecificColumnStyles(): void {
        const grid = this.target.querySelector('.datagrid');
        if (!grid) {
            return;
        }

        const groups = this.settings.specificColumn.groups as MeasureCard[];
        console.log("=== applySpecificColumnStyles: raw card values ===");
    for (let i = 0; i < groups.length; i++) {
        const card = groups[i];
        console.log(`Card ${i}: displayName = ${card.displayName}`);
        console.log(`  headerTextColor.value.value = ${card.headerTextColor.value.value}`);
        console.log(`  headerBackgroundColor.value.value = ${card.headerBackgroundColor.value.value}`);
        console.log(`  headerAlignment.value = ${card.headerAlignment.value}`);
        console.log(`  totalTextColor.value.value = ${card.totalTextColor.value.value}`);
        console.log(`  totalBackgroundColor.value.value = ${card.totalBackgroundColor.value.value}`);
        console.log(`  totalAlignment.value = ${card.totalAlignment.value}`);
        console.log(`  valuesTextColor.value.value = ${card.valuesTextColor.value.value}`);
        console.log(`  valuesBackgroundColor.value.value = ${card.valuesBackgroundColor.value.value}`);
        console.log(`  valuesAlignment.value = ${card.valuesAlignment.value}`);
    }

        for (let i = 0; i < groups.length; i++) {
            const card = groups[i];
            // Если у карточки есть свойство visible – проверяем
            if ((card as any).visible === false) {
                //console.log(`Skipping card ${i} because visible=false`);
                continue;
            }

            const measureName = String(card.displayName);

            const settings: IMeasureSettings = {
                header: {
                    textColor: card.headerTextColor.value.value,
                    backgroundColor: card.headerBackgroundColor.value.value,
                    alignment: card.headerAlignment.value
                },
                total: {
                    textColor: card.totalTextColor.value.value,
                    backgroundColor: card.totalBackgroundColor.value.value,
                    alignment: card.totalAlignment.value
                },
                values: {
                    textColor: card.valuesTextColor.value.value,
                    backgroundColor: card.valuesBackgroundColor.value.value,
                    alignment: card.valuesAlignment.value
                }
            };

            const measureKey = `measure_${i}`;
            applySpecificColumnSettings(grid as HTMLElement, settings, measureKey, measureName);
        }
    }

    private requestNextDataSegment(): void {
        try {
            const accepted = this.host.fetchMoreData(true);
            if (!accepted) {
                console.log('Cannot fetch more data, stopping.');
                this.loadingAllData = false;
                this.allDataLoaded = true;
                if (this.pendingRenderAfterLoad) {
                    this.renderVisualization(this.countRows(this.currentDataView));
                    this.pendingRenderAfterLoad = false;
                }
            }
        } catch (error) {
            console.error('Error fetching more ', error);
            this.loadingAllData = false;
            this.allDataLoaded = true;
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

    private renderVisualization(cntRows: number): void {
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

        const existingGrids = this.target.querySelectorAll('.datagrid');
        if (existingGrids.length > 0) {
            ColumnResizer.cleanup();
            HeightResizer.cleanup();
            existingGrids.forEach(grid => grid.remove());
        }

        if (this.currentDataView?.matrix) {
            const valueSources = (this.currentDataView.matrix as any).valueSources;
            const formattedMatrix = MatrixDataviewHtmlFormatter.formatDataViewMatrix(
                this.currentDataView.matrix,
                valueSources,
                this.expandedNodes
            );

            if (this.settings?.hideEmptyCols?.hideColsLabel?.value) {
                this.applyHideEmptyColumnsSetting(formattedMatrix);
            }

            this.applyGrandTotalSetting(formattedMatrix);
            this.applyNonGrandTotalSetting(formattedMatrix);

            if (this.currentHeight) {
                formattedMatrix.style.height = this.currentHeight + 'px';
            }

            applyGridSettings(formattedMatrix, this.settings);
            applyValuesSettings(formattedMatrix, this.settings);
            applyColumnHeadersSettings(formattedMatrix, this.settings);
            applyRowHeadersSettings(formattedMatrix, this.settings);

            if (this.settings.subTotals.columnSubtotals.value) {
                applyColumnGrandTotalSettings(formattedMatrix, this.settings);
            }

            applyRowGrandTotalSettings(formattedMatrix, this.settings);
            

            this.target.appendChild(formattedMatrix);
            this.applySpecificColumnStyles();

            const table = formattedMatrix.querySelector('table');
            if (table) {
                if (Object.keys(this.columnWidths).length > 0) {
                    for (let colIndex = 1; colIndex < table.rows[0]?.cells.length; colIndex++) {
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

                const firstColCells = table.querySelectorAll('tr > *:first-child');
                if (firstColCells.length > 0) {
                    if (this.columnWidths[0]) {
                        for (let i = 0; i < table.rows.length; i++) {
                            const cell = table.rows[i].cells[0];
                            if (cell) {
                                const w = this.columnWidths[0];
                                cell.style.width = w + 'px';
                                cell.style.minWidth = w + 'px';
                                cell.style.maxWidth = w + 'px';
                            }
                        }
                    } else {
                        firstColCells.forEach(cell => {
                            (cell as HTMLElement).style.width = '';
                            (cell as HTMLElement).style.minWidth = '';
                            (cell as HTMLElement).style.maxWidth = '';
                        });

                        const measureDiv = document.createElement('div');
                        measureDiv.style.position = 'absolute';
                        measureDiv.style.left = '-9999px';
                        measureDiv.style.top = '-9999px';
                        measureDiv.style.visibility = 'hidden';

                        const sampleCell = firstColCells[0];
                        const computedStyle = window.getComputedStyle(sampleCell);
                        measureDiv.style.font = computedStyle.font;
                        measureDiv.style.fontFamily = computedStyle.fontFamily;
                        measureDiv.style.fontSize = computedStyle.fontSize;
                        measureDiv.style.fontWeight = computedStyle.fontWeight;
                        measureDiv.style.lineHeight = computedStyle.lineHeight;
                        measureDiv.style.whiteSpace = 'nowrap';

                        document.body.appendChild(measureDiv);

                        let maxWidth = 0;
                        firstColCells.forEach(cell => {
                            const text = cell.textContent || '';
                            measureDiv.textContent = text;
                            const w = measureDiv.offsetWidth;
                            if (w > maxWidth) maxWidth = w;
                        });

                        document.body.removeChild(measureDiv);
                        maxWidth += 20;

                        for (let i = 0; i < table.rows.length; i++) {
                            const cell = table.rows[i].cells[0];
                            if (cell) {
                                cell.style.minWidth = maxWidth + 'px';
                            }
                        }
                    }
                }

                if (Object.keys(this.columnWidths).length === 0) {
                    for (let colIndex = 1; colIndex < table.rows[0]?.cells.length; colIndex++) {
                        const cell = table.rows[0].cells[colIndex];
                        if (cell) {
                            const width = cell.offsetWidth;
                            this.columnWidths[colIndex] = width;
                        }
                    }
                }

                this.applyColumnWidths(table);
            }

            formattedMatrix.addEventListener('click', (e) => {
                const target = e.target as HTMLElement;
                const expandBtn = target.closest('.expandCollapseButton') as HTMLElement;
                if (expandBtn) {
                    e.stopPropagation();
                    const path = expandBtn.dataset.path;
                    if (path) {
                        if (this.expandedNodes.has(path)) {
                            this.expandedNodes.delete(path);
                        } else {
                            this.expandedNodes.add(path);
                        }
                        this.renderVisualization(this.countRows(this.currentDataView));
                    }
                }
            });

            if (table) {
                ColumnResizer.init(table, (colIndex: number, newWidth: number) => {
                    this.columnWidths[colIndex] = newWidth;
                });
            }

            HeightResizer.init(formattedMatrix, (newHeight: number) => {
                this.currentHeight = newHeight;
            });
        }
    }

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
        this.exportDataView(cntRows);
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
            //console.log("Segment present → requesting next...");
            this.requestMoreData(cntRows);
            console.log(`Estimated dataView size: ${(sizeEstimate / 1024 / 1024).toFixed(2)} MB`);
        } else {
            console.log("No segment → all data collected, scheduling export after render");
            this.pendingExport = true;
            console.log(`Estimated dataView size: ${(sizeEstimate / 1024 / 1024).toFixed(2)} MB`);
        }
    }

    private exportDataView(cntRows: number): void {
        console.log("Exporting data with all nodes expanded...");
        if (!this.currentDataView) {
            console.error("No data view found");
            this.resetExportState();
            return;
        }

        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'absolute';
        tempContainer.style.left = '-9999px';
        tempContainer.style.top = '-9999px';
        tempContainer.style.visibility = 'hidden';
        document.body.appendChild(tempContainer);

        try {
            const valueSources = (this.currentDataView.matrix as any).valueSources;
            const showNonGrandTotal = this.settings.subTotals.nonGrandTotal?.value ?? true;
            const fullMatrix = MatrixDataviewHtmlFormatter.formatDataViewMatrix(
                this.currentDataView.matrix,
                valueSources,
                this.expandedNodes,
                showNonGrandTotal,
                true
            );

            if (this.settings?.hideEmptyCols?.hideColsLabel?.value) {
                this.applyHideEmptyColumnsSetting(fullMatrix);
            }

            applyGridSettings(fullMatrix, this.settings);

            tempContainer.appendChild(fullMatrix);

            const table = fullMatrix.querySelector('table');
            if (table) {
                const downloader = new ExcelDownloader();
                downloader.exportTable(table as HTMLElement);
            } else {
                console.error("No table generated for export");
            }
        } catch (error) {
            console.error("Export failed:", error);
        } finally {
            document.body.removeChild(tempContainer);
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

    private applyHideEmptyColumnsSetting(formattedMatrix: HTMLElement): void {
        const hider = new MatrixEmptyColumnsHider();
        hider.hideEmptyColsMethod(formattedMatrix);
    }

    private applyGrandTotalSetting(container: HTMLElement): void {
        const showGrandTotal = this.settings.subTotals.grandTotal?.value;
        if (showGrandTotal === false) {
            const grandTotalRows = container.querySelectorAll('tr.totalRow[data-level="0"]');
            grandTotalRows.forEach(row => row.remove());
        }
    }

    private applyNonGrandTotalSetting(container: HTMLElement): void {
        const showNonGrandTotal = this.settings.subTotals.nonGrandTotal?.value;
        if (showNonGrandTotal === false) {
            const nonGrandTotalRows = container.querySelectorAll('tr.totalRow:not([data-level="0"])');
            nonGrandTotalRows.forEach(row => row.remove());
        }
    }

    private clearDisplay(): void {
        while (this.target.firstChild) {
            if (this.target.firstChild === this.exportButton?.parentElement) break;
            this.target.removeChild(this.target.firstChild);
        }
    }
}