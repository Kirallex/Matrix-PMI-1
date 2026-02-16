//Промпт для начала диалога с ИИ:
// 1) Контекст
// Я разрабатываю кастомную визуализацию для Power BI при помощи библиотеки power-bi-visual-tools. Кастомная визуализяция имеет тип matrix. 
// 2) В составе проекта имеются файлы: 
// downloadExcel.ts
// hideEmptyCols.ts
// matrixDataViewHtmlFormatter.ts
// objectEnumerationBuilder.ts
// settings.ts
// visual.ts



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
        console.log("dataView", dataView);
        
        // Автоматический парсинг настроек из DataView
        this.settings = VisualSettings.parse(dataView) as VisualSettings;
        
        // Проверка данных матрицы
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
        
        // Добавляем обработчик клика
        button.addEventListener('click', () => {
            this.handleExportClick();
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
     * Обработчик клика по кнопке экспорта
     */
    private handleExportClick(): void {
        console.log("Export button clicked");
        
        // Блокируем кнопку на время экспорта
        const button = this.target.querySelector('#exportBtn') as HTMLButtonElement;
        const originalText = button.textContent;
        button.disabled = true;
        button.textContent = 'Exporting...';
        
        try {
            // Пробуем получить больше данных через fetchMoreData
            console.log("Trying to fetch more data...");
            const canFetchMore = this.host.fetchMoreData(true);
            
            if (canFetchMore) {
                console.log("More data requested, it will come in next update");
                // Здесь можно добавить логику для сбора нескольких порций данных
                // Но для минимальных изменений просто экспортируем текущие данные
                this.performExport();
            } else {
                console.log("No more data available, exporting current data");
                this.performExport();
            }
        } catch (error) {
            console.error("Error in fetchMoreData:", error);
            // В случае ошибки просто экспортируем текущие данные
            this.performExport();
        } finally {
            // Разблокируем кнопку через некоторое время
            setTimeout(() => {
                button.textContent = originalText;
                button.disabled = false;
            }, 2000);
        }
    }

    /**
     * Выполняет экспорт текущих данных
     */
    private performExport(): void {
        if (!this.currentDataView) {
            console.error("No data to export");
            return;
        }
        
        // Просто создаем ExcelDownloader и вызываем exportFromDataView
        const downloader = new ExcelDownloader(this.host, this.currentDataView);
        
        // Вызываем экспорт напрямую (нужно будет сделать метод публичным)
        // Для минимальных изменений используем существующий подход
        this.directExport(downloader);
    }

    /**
     * Прямой экспорт без симуляции
     */
    private directExport(downloader: ExcelDownloader): void {
        // Используем существующий DOM для совместимости
        const table = this.target.querySelector('table');
        if (table) {
            // Используем метод exportFromDataView вместо экспорта из DOM
            this.callExportFromDataView(downloader);
        } else {
            console.error("No table found for export");
        }
    }

    /**
     * Вызывает exportFromDataView через рефлексию (временное решение)
     * Лучше сделать метод публичным в ExcelDownloader
     */
    private callExportFromDataView(downloader: ExcelDownloader): void {
        try {
            // Используем any для доступа к приватному методу
            // В будущем лучше сделать метод публичным
            (downloader as any).exportFromDataView().catch((error: any) => {
                console.error("Export failed:", error);
                // Fallback на старый метод
                const table = this.target.querySelector('table');
                if (table) {
                    (downloader as any).exportToCSV(table as HTMLElement);
                }
            });
        } catch (error) {
            console.error("Cannot call export method:", error);
        }
    }

    /**
     * Ключевой метод для отображения свойств в панели форматирования Power BI
     */
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