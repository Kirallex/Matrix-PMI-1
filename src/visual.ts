"use strict";
import "./../style/visual.less";
import powerbi from "powerbi-visuals-api";
import { MatrixDataviewHtmlFormatter } from "./matrixDataViewHtmlFormatter";
import { ExcelDownloader } from "./downloadExcel";
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
import { applyColumnWidthsFromSettings } from "./columnWidth";
import { VisualSettings, MeasureCard, ColumnWidthCard } from "./settings";
import { applyBorderSettings } from "./borderSettings";

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

        // Обновляем структуру SpecificColumn и ColumnWidth (динамические группы)
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
                    this.loadingAllData = true;
                    this.requestNextDataSegment();
                    return;
                } else {
                    this.allDataLoaded = true;
                }
            }

            if (this.loadingAllData && options.operationKind === VisualDataChangeOperationKind.Append) {
                this.pendingRenderAfterLoad = true;
                if (this.currentDataView.metadata?.segment) {
                    this.requestNextDataSegment();
                } else {
                    this.loadingAllData = false;
                    this.allDataLoaded = true;
                    this.renderVisualization(this.countRows(this.currentDataView));
                    this.pendingRenderAfterLoad = false;
                }
                return;
            }
        }

        if (options.operationKind === VisualDataChangeOperationKind.Create) {
            this.expandedNodes.clear();
            this.prevRowCount = rowCount;
        } else {
            this.prevRowCount = rowCount;
        }

        if (this.isExporting) {
            this.handleDataSegment(this.currentDataView, rowCount);
        }

        if (!this.loadingAllData) {
            this.renderVisualization(rowCount);
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
     * Обновляет группы в SpecificColumn и ColumnWidth в соответствии с реальными именами мер.
     */
    private updateSpecificColumnGroups(): void {
        (this.settings.specificColumn as any).updateGroups(this.measureNames);
        (this.settings.columnWidth as ColumnWidthCard).updateMeasureWidths(this.measureNames);
    }

    /**
     * Применяет стили для каждой меры (Header, Total, Values) к отрисованной таблице.
     */
    private applySpecificColumnStyles(): void {
        const grid = this.target.querySelector('.datagrid');
        if (!grid) return;

        const groups = this.settings.specificColumn.groups as MeasureCard[];
        for (let i = 0; i < groups.length; i++) {
            const card = groups[i];
            if ((card as any).visible === false) continue;

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

            //applyGridSettings(formattedMatrix, this.settings);
            //applyBorderSettings(formattedMatrix, this.settings);
            applyValuesSettings(formattedMatrix, this.settings);
            applyColumnHeadersSettings(formattedMatrix, this.settings);
            applyRowHeadersSettings(formattedMatrix, this.settings);

            if (this.settings.subTotals.columnSubtotals.value) {
                applyColumnGrandTotalSettings(formattedMatrix, this.settings);
            }
            
            applyGridSettings(formattedMatrix, this.settings);
            applyRowGrandTotalSettings(formattedMatrix, this.settings);
            

            this.target.appendChild(formattedMatrix);
            this.applySpecificColumnStyles();

            const table = formattedMatrix.querySelector('table');
            if (table) {
                // Применяем ширины из панели форматирования (Column Width)
                const columnWidthCard = this.settings.columnWidth as ColumnWidthCard;
                if (columnWidthCard) {
                    applyColumnWidthsFromSettings(table, columnWidthCard, this.measureNames);
                }
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

            HeightResizer.init(formattedMatrix, (newHeight: number) => {
                this.currentHeight = newHeight;
            });
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

            //applyGridSettings(fullMatrix, this.settings);

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