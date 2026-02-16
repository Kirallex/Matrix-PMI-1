"use strict";
import "./../style/visual.less";
import powerbi from "powerbi-visuals-api";
import { MatrixDataviewHtmlFormatter } from "./matrixDataViewHtmlFormatter";
import { MatrixDataViewDictFormatter } from "./___matrixDataViewDictFormatter___";
import IVisual = powerbi.extensibility.visual.IVisual;
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import DataView = powerbi.DataView;
import Host = powerbi.extensibility.visual.IVisualHost;
import { VisualSettings } from "./settings";
import { ObjectEnumerationBuilder } from "./objectEnumerationBuilder";
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
import {MatrixEmptyColumnsHider} from "./hideEmptyCols";
import {ExcelDownloader} from "./downloadExcel";

export class Visual implements IVisual {
    private target: HTMLElement;
    private settings: VisualSettings;
    private host: Host;
    private currentDataView: DataView;
    private isFetchingData: boolean = false;
    private finalDataView: DataView | null = null;
    private segmentCount: number = 0;

    constructor(options: VisualConstructorOptions) {
        this.target = options.element;
        this.host = options.host;
    }

    public update(options: VisualUpdateOptions) {
        if (!options?.dataViews?.[0]) {
            this.clearDisplay();
            return;
        }

        const dataView = options.dataViews[0];
        this.currentDataView = dataView;

        // Если идёт сбор данных
        if (this.isFetchingData) {
            this.processDataSegment(dataView);
            return; // Не рендерим визуал во время сбора
        }

        console.log("dataView", dataView);
        
        this.settings = VisualSettings.parse(dataView) as VisualSettings;
        
        if (!dataView.matrix?.rows?.root?.children?.length || 
            !dataView.matrix?.columns?.root?.children?.length) {
            this.clearDisplay();
            return;
        }

        this.clearDisplay();

        const buttonContainer = document.createElement('div');
        const button = document.createElement('button');
        button.setAttribute("id", "exportBtn");
        button.setAttribute("type", "button");
        button.innerText = "Export Data";
        
        button.addEventListener('click', () => {
            this.startDataFetching();
        });
    
        buttonContainer.appendChild(button);
        this.target.appendChild(buttonContainer);

        const formattedMatrix = MatrixDataviewHtmlFormatter.formatDataViewMatrix(dataView.matrix);
        const formattedDictMatrix = MatrixDataViewDictFormatter.formatDataViewMatrix(dataView.matrix);
        console.log(formattedDictMatrix);
        
        if (this.settings.hideEmptyCols.hideColsLabel) {
            this.applyHideEmptyColumnsSetting(formattedMatrix)
        }

        this.target.appendChild(formattedMatrix);
    }

    /**
     * Начинает процесс сбора данных
     */
    private startDataFetching(): void {
        console.log("=== Начало сбора данных ===");
        this.isFetchingData = true;
        this.segmentCount = 0;
        this.finalDataView = null;

        // Проверяем, есть ли сегмент в текущих данных
        if (this.currentDataView.metadata?.segment) {
            // Есть дополнительные данные, запрашиваем первый сегмент
            console.log("Есть сегмент данных, запрашиваем...");
            this.requestMoreData();
        } else {
            // Нет сегментов — сразу экспортируем текущие данные
            console.log("Нет сегментов данных, экспортируем текущие данные.");
            this.finishDataFetching(this.currentDataView);
        }
    }

    /**
     * Запрашивает дополнительные данные
     */
    private requestMoreData(): void {
        try {
            const accepted = this.host.fetchMoreData(true); // режим агрегации
            if (!accepted) {
                console.log("fetchMoreData вернул false — больше данных нет");
                this.finishDataFetching(this.currentDataView);
            }
        } catch (error) {
            console.error("Ошибка fetchMoreData:", error);
            this.finishDataFetching(this.currentDataView);
        }
    }

    /**
     * Обрабатывает полученный сегмент данных
     */
    private processDataSegment(dataView: DataView): void {
        this.segmentCount++;
        this.finalDataView = dataView;

        const rowCount = this.countRows(dataView);
        console.log(`Сегмент ${this.segmentCount}, строк: ${rowCount}`);

        // Проверяем, есть ли ещё сегменты
        if (dataView.metadata?.segment) {
            // Ещё есть данные, запрашиваем следующий
            console.log("Ещё есть сегмент, запрашиваем следующий...");
            this.requestMoreData();
        } else {
            // Сегментов больше нет
            console.log("Сегментов больше нет, завершаем сбор.");
            this.finishDataFetching(dataView);
        }
    }

    /**
     * Завершает сбор и экспортирует данные
     */
    private finishDataFetching(dataView: DataView): void {
        console.log(`=== Сбор завершён. Сегментов: ${this.segmentCount} ===`);
        this.isFetchingData = false;

        const rowCount = this.countRows(dataView);
        console.log(`Всего строк: ${rowCount}`);

        // Экспортируем
        this.exportData(dataView);
    }

    /**
     * Экспортирует данные через ExcelDownloader
     */
    private exportData(dataView: DataView): void {
        try {
            const downloader = new ExcelDownloader(this.host, dataView);
            // Используем приватный метод exportFromDataView через any (он есть в downloadExcel.ts)
            (downloader as any).exportFromDataView()
                .then(() => {
                    console.log("Экспорт успешно завершён");
                })
                .catch((err: any) => {
                    console.error("Ошибка при экспорте из DataView:", err);
                    // Fallback: экспорт из DOM
                    const table = this.target.querySelector('table');
                    if (table) {
                        (downloader as any).exportToCSV(table as HTMLElement);
                    }
                });
        } catch (error) {
            console.error("Ошибка создания экспортёра:", error);
        } finally {
            // Разблокируем кнопку
            const mainButton = this.target.querySelector('#exportBtn') as HTMLButtonElement;
            if (mainButton) {
                mainButton.disabled = false;
                mainButton.textContent = "Export Data";
            }
        }
    }

    /**
     * Подсчитывает количество строк в dataView
     */
    private countRows(dataView: DataView): number {
        if (!dataView?.matrix?.rows?.root?.children) return 0;
        let count = 0;
        const countChildren = (nodes: powerbi.DataViewMatrixNode[]) => {
            for (const node of nodes) {
                count++;
                if (node.children) {
                    countChildren(node.children);
                }
            }
        };
        countChildren(dataView.matrix.rows.root.children);
        return count;
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

    private clearDisplay() {
        while(this.target.firstChild) {
            this.target.removeChild(this.target.firstChild);
        }
    }
}