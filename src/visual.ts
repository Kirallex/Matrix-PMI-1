"use strict";
import "./../style/visual.less";
import powerbi from "powerbi-visuals-api";
import { MatrixDataviewHtmlFormatter } from "./matrixDataViewHtmlFormatter";
import IVisual = powerbi.extensibility.visual.IVisual;
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import DataView = powerbi.DataView;
import { VisualSettings } from "./settings";
import { ObjectEnumerationBuilder } from "./objectEnumerationBuilder";
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
import {MatrixEmptyColumnsHider} from "./hideEmptyCols";
import {ExcelDownloader} from "./downloadExcel"

export class Visual implements IVisual {
    private target: HTMLElement;
    private settings: VisualSettings;

    constructor(options: VisualConstructorOptions) {
        this.target = options.element;
    }

    public update(options: VisualUpdateOptions) {
        if (!options?.dataViews?.[0]) {
            this.clearDisplay();
            return;
        }

        const dataView = options.dataViews[0];
        console.log("dataView", dataView);
        
        // Автоматический парсинг настроек из DataView
        this.settings = VisualSettings.parse(dataView) as VisualSettings;
        
        // Проверка данных матрицы
        if (!dataView.matrix?.rows?.root?.children?.length || 
            !dataView.matrix?.columns?.root?.children?.length) {
            this.clearDisplay();
            return;
        }

        // console.log("Настройки субтоталов:", {
        //     rowSubtotals: this.settings.subTotals.rowSubtotals,
        //     columnSubtotals: this.settings.subTotals.columnSubtotals
        // });

        this.clearDisplay();

        const buttonContainer = document.createElement('div');
        const button = document.createElement('button');
        button.setAttribute("id", "exportBtn");
        button.setAttribute("type", "button");
        button.innerText = "Export to Excel";

    
        buttonContainer.appendChild(button);
        this.target.appendChild(buttonContainer);

        const formattedMatrix = MatrixDataviewHtmlFormatter.formatDataViewMatrix(dataView.matrix);
        
        //если hideColsLabel выставлен в True, то применяем applyHideEmptyColumnsSetting
        if (this.settings.hideEmptyCols.hideColsLabel) {
            this.applyHideEmptyColumnsSetting(formattedMatrix)
        }

        //Применяем excel downloader (мб поставить это свойство в самом конце)
        this.applyExcelDownloader(formattedMatrix, this.target);

        this.target.appendChild(formattedMatrix);

        
    }

    /**
     * Ключевой метод для отображения свойств в панели форматирования Power BI
     * Вызывается автоматически фреймворком Power BI при открытии панели форматирования
     */
    public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): powerbi.VisualObjectInstanceEnumerationObject {
        const enumeration = new ObjectEnumerationBuilder();

        // Для каждой группы настроек создаем соответствующий объект
        switch (options.objectName) {
            case "subTotals":
                // Создаем экземпляр объекта для группы subTotals
                enumeration.pushInstance({
                    objectName: "subTotals",
                    displayName: "Subtotals Settings",
                    selector: null,
                    properties: {
                        // Свойства автоматически связываются с VisualSettings
                        rowSubtotals: this.settings.subTotals.rowSubtotals,
                        columnSubtotals: this.settings.subTotals.columnSubtotals
                    }
                });
                break;
                
                case "hideEmptyCols":
                // Создаем экземпляр объекта для группы subTotals
                enumeration.pushInstance({
                    objectName: "hideEmptyCols",
                    displayName: "Hide Empty Columns",
                    selector: null,
                    properties: {
                        // Свойства автоматически связываются с VisualSettings
                        hideColsLabel: this.settings.hideEmptyCols.hideColsLabel
                    }
                });
                break;
        }

        return enumeration.complete();
    }

    private applyHideEmptyColumnsSetting(formattedMatrix: HTMLElement): void {
        const hider = new MatrixEmptyColumnsHider();
        // Если настройка включена - скрываем пустые колонки
        hider.hideEmptyColsMethod(formattedMatrix);
        
    }

    private applyExcelDownloader(formattedMatrix: HTMLElement, grid: HTMLElement): void {
        const downloader = new ExcelDownloader();
        // Если настройка включена - скрываем пустые колонки
        downloader.excelDownloaderMethod(formattedMatrix, grid); 
    }

    private clearDisplay() {
        while(this.target.firstChild) {
            this.target.removeChild(this.target.firstChild);
        }
    }
}