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

    // Раскрытые узлы (пути) – локальное состояние
    private expandedNodes: Set<string> = new Set();

    // Кэш дочерних узлов для восстановления иерархии при экспорте и drill-up
    private childrenCache: Map<string, powerbi.DataViewMatrixNode[]> = new Map();

    // Для прогрессивной загрузки (скролл)
    private canFetchMore: boolean = true;
    private allDataLoaded: boolean = false;

    // Максимальная глубина иерархии строк
    private maxRowLevelsEver: number = 0;

    private prevRowCount: number = 0;
    private currentHeight: number | null = null;
    private formattingSettingsService: FormattingSettingsService;

    private measureNames: string[] = [];

    private savedScrollTop: number = 0;
    private savedScrollLeft: number = 0;

    private cachedTotalRow: HTMLElement | null = null;

    // Флаг, чтобы при первом Create не дергать expandAllDrillRows повторно
    private initialLoadDone: boolean = false;

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

        const measures = this.currentDataView?.matrix?.columns?.levels?.find(level =>
            level.sources.some(source => source.isMeasure)
        )?.sources || [];
        this.measureNames = measures.map(m => m.displayName);

        this.updateSpecificColumnGroups();

        const rowLevelsCount = this.currentDataView.matrix?.rows?.levels?.length ?? 0;
        const rootNode = this.currentDataView.matrix?.rows?.root;
        const hasChildFields = rootNode?.childIdentityFields && rootNode.childIdentityFields.length > 0;
        const potentialMax = rowLevelsCount + (hasChildFields ? 1 : 0);
        this.maxRowLevelsEver = Math.max(this.maxRowLevelsEver, potentialMax);

        const rowCount = this.countRows(this.currentDataView);
        console.log(`[update] operationKind=${options.operationKind}, segment=${this.currentDataView.metadata?.segment ? 'YES' : 'NO'}, rows=${rowCount}`);

        // При полной замене данных (Create)
        if (options.operationKind === VisualDataChangeOperationKind.Create) {
            this.canFetchMore = true;
            this.allDataLoaded = false;

            // При самом первом Create запрашиваем полное раскрытие иерархии
            if (!this.initialLoadDone) {
                this.initialLoadDone = true;
                try {
                    (this.host as any).expandAllDrillRows();
                } catch (e) {
                    console.warn('expandAllDrillRows not available', e);
                }
                // Не делаем renderVisualization сразу — дождёмся Append с полными данными
                return;
            }

            // При последующих Create (изменение фильтров и т.п.) сбрасываем раскрытые узлы
            this.expandedNodes.clear();
            this.renderVisualization(rowCount);
            return;
        }

        // Если это дополнение (Append)
        if (options.operationKind === VisualDataChangeOperationKind.Append) {
            if (this.isExporting) {
                if (!this.currentDataView.metadata?.segment) {
                    this.finalizeExport();
                } else {
                    this.requestMoreDataForExport();
                }
            } else {
                this.canFetchMore = true;
                if (!this.currentDataView.metadata?.segment) {
                    this.allDataLoaded = true;
                    this.canFetchMore = false;
                }

                // Восстанавливаем детей из кэша (если после expandAll пришли новые сегменты)
                if (!this.allDataLoaded) {
                    this.applyChildrenCache(this.currentDataView);
                }

                this.renderVisualization(rowCount);
            }
            return;
        }

        // Обычное обновление (Create без сброса, если такое возможно)
        this.renderVisualization(rowCount);
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

    private updateSpecificColumnGroups(): void {
        (this.settings.specificColumn as any).updateGroups(this.measureNames);
        (this.settings.columnWidth as ColumnWidthCard).updateMeasureWidths(this.measureNames);
    }

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

    private moveGrandTotalToBottom(container: HTMLElement): void {
        const tbody = container.querySelector('tbody');
        if (!tbody) return;

        const totalRow = tbody.querySelector('tr.totalRow[data-level="0"]');
        if (!totalRow) return;

        if (totalRow === tbody.lastElementChild) return;

        tbody.appendChild(totalRow);
    }

    private renderVisualization(cntRows: number): void {
        const oldGrid = this.target.querySelector('.datagrid') as HTMLElement;
        if (oldGrid) {
            this.savedScrollTop = oldGrid.scrollTop;
            this.savedScrollLeft = oldGrid.scrollLeft;
        }

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
            existingGrids.forEach(grid => grid.remove());
        }

        if (this.currentDataView?.matrix) {
            const valueSources = (this.currentDataView.matrix as any).valueSources;

            // Обновляем кэш детей
            this.updateChildrenCache(this.currentDataView.matrix.rows.root, '');

            const formattedMatrix = MatrixDataviewHtmlFormatter.formatDataViewMatrix(
                this.currentDataView.matrix,
                valueSources,
                this.expandedNodes,
                this.maxRowLevelsEver
            );

            const totalRow = formattedMatrix.querySelector('tr.totalRow[data-level="0"]');
            if (totalRow) {
                this.cachedTotalRow = totalRow.cloneNode(true) as HTMLElement;
            }

            if (!totalRow && this.cachedTotalRow) {
                const tbody = formattedMatrix.querySelector('tbody');
                if (tbody) {
                    tbody.appendChild(this.cachedTotalRow.cloneNode(true));
                }
            }

            if (this.settings?.hideEmptyCols?.hideColsLabel?.value) {
                this.applyHideEmptyColumnsSetting(formattedMatrix);
            }

            this.applyGrandTotalSetting(formattedMatrix);
            this.applyNonGrandTotalSetting(formattedMatrix);

            if (this.currentHeight) {
                formattedMatrix.style.height = this.currentHeight + 'px';
            }

            applyBorderSettings(formattedMatrix, this.settings);
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
            this.moveGrandTotalToBottom(formattedMatrix);

            const table = formattedMatrix.querySelector('table');
            if (table) {
                const columnWidthCard = this.settings.columnWidth as ColumnWidthCard;
                if (columnWidthCard) {
                    applyColumnWidthsFromSettings(table, columnWidthCard, this.measureNames);
                }
            }

            const newGrid = this.target.querySelector('.datagrid') as HTMLElement;
            if (newGrid) {
                if (!this.isExporting && (this.savedScrollTop > 0 || this.savedScrollLeft > 0)) {
                    newGrid.scrollTop = this.savedScrollTop;
                    newGrid.scrollLeft = this.savedScrollLeft;
                }

                if (!this.isExporting) {
                    newGrid.addEventListener('scroll', () => {
                        if (!this.canFetchMore || this.allDataLoaded) return;

                        const scrollBottom = newGrid.scrollTop + newGrid.clientHeight;
                        if (scrollBottom >= newGrid.scrollHeight - 20) {
                            console.log('Scroll reached bottom, requesting more data...');
                            this.canFetchMore = false;
                            const accepted = this.host.fetchMoreData(true);
                            if (!accepted) {
                                console.log('Host rejected fetchMoreData, no more data.');
                                this.canFetchMore = false;
                                this.allDataLoaded = true;
                            }
                        }
                    });
                }
            }

            // Обработчик кликов на кнопки +/-
            formattedMatrix.addEventListener('click', (e) => {
                const target = e.target as HTMLElement;
                const expandBtn = target.closest('.expandCollapseButton') as HTMLElement;
                if (!expandBtn) return;
                e.stopPropagation();

                const path = expandBtn.dataset.path;
                if (path) {
                    if (this.expandedNodes.has(path)) {
                        this.expandedNodes.delete(path);   // свернуть
                    } else {
                        this.expandedNodes.add(path);      // раскрыть
                    }
                    this.renderVisualization(this.countRows(this.currentDataView));
                }
            });

            HeightResizer.init(formattedMatrix, (newHeight: number) => {
                this.currentHeight = newHeight;
            });
        }
    }

    // Кэширование детей для экспорта и восстановления при Append
    private updateChildrenCache(node: powerbi.DataViewMatrixNode, path: string): void {
        if (!node) return;
        if (node.children && node.children.length > 0) {
            const nonSubtotalChildren = node.children.filter(c => !c.isSubtotal);
            if (nonSubtotalChildren.length > 0) {
                this.childrenCache.set(path, nonSubtotalChildren);
            }
        }
        if (node.children) {
            for (const child of node.children) {
                const childPath = path ? `${path}-${child.levelSourceIndex || child.value}` : `${child.levelSourceIndex || child.value}`;
                this.updateChildrenCache(child, childPath);
            }
        }
    }

    private applyChildrenCache(dataView: DataView): DataView {
        if (!dataView.matrix || !dataView.matrix.rows || !dataView.matrix.rows.root) {
            return dataView;
        }
        const newRoot = this.injectCachedChildren(dataView.matrix.rows.root, '');
        return {
            ...dataView,
            matrix: {
                ...dataView.matrix,
                rows: {
                    ...dataView.matrix.rows,
                    root: newRoot
                }
            }
        };
    }

    private injectCachedChildren(node: powerbi.DataViewMatrixNode, path: string): powerbi.DataViewMatrixNode {
        const newNode: any = { ...node };
        if (!newNode.children || newNode.children.length === 0 || newNode.children.every((c: any) => c.isSubtotal)) {
            const cached = this.childrenCache.get(path);
            if (cached && cached.length > 0) {
                newNode.children = cached.map(c => ({ ...c }));
            }
        } else {
            newNode.children = newNode.children.map((child: any) => {
                const childPath = path ? `${path}-${child.levelSourceIndex || child.value}` : `${child.levelSourceIndex || child.value}`;
                return this.injectCachedChildren(child, childPath);
            });
        }
        return newNode;
    }

    // Экспорт
    private handleExportClick(cntRows: number): void {
        if (this.isExporting) return;
        console.log("=== Starting data export process ===");
        this.isExporting = true;
        if (this.exportButton) {
            this.exportButton.disabled = true;
            this.exportButton.textContent = "Loading data...";
        }
        if (this.allDataLoaded) {
            this.exportDataView(cntRows);
            return;
        }
        this.requestMoreDataForExport();
    }

    private requestMoreDataForExport(): void {
        try {
            const accepted = this.host.fetchMoreData(true);
            if (!accepted) {
                console.log("All data collected for export.");
                this.finalizeExport();
            }
        } catch (error) {
            console.error("Error in fetchMoreData for export:", error);
            this.finalizeExport();
        }
    }

    private finalizeExport(): void {
        if (!this.isExporting) return;
        this.renderVisualization(this.countRows(this.currentDataView));
        this.exportDataView(this.countRows(this.currentDataView));
    }

    private exportDataView(cntRows: number): void {
        console.log("Exporting data...");
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
            const dataViewWithChildren = this.applyChildrenCache(this.currentDataView);
            if (!dataViewWithChildren.matrix) {
                console.warn("Matrix is undefined after cache");
                this.resetExportState();
                return;
            }

            const valueSources = (dataViewWithChildren.matrix as any).valueSources;
            const fullMatrix = MatrixDataviewHtmlFormatter.formatDataViewMatrix(
                dataViewWithChildren.matrix,
                valueSources,
                undefined,
                this.maxRowLevelsEver,
                true
            );

            this.applyNonGrandTotalSetting(fullMatrix);
            this.moveGrandTotalToBottom(fullMatrix);

            if (this.settings?.hideEmptyCols?.hideColsLabel?.value) {
                this.applyHideEmptyColumnsSetting(fullMatrix);
            }

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
        this.allDataLoaded = true;
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