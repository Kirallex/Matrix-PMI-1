import powerbi from "powerbi-visuals-api";
import { valueFormatter } from "powerbi-visuals-utils-formattingutils";
// import IValueFormatter = powerbi.extensibility.utils.formatting.IValueFormatter;
// import valueFormatter = powerbi.extensibility.utils.formatting.valueFormatter;


export class MatrixDataviewHtmlFormatter {
    public static formatDataViewMatrix(matrix: powerbi.DataViewMatrix): HTMLElement {
        const htmlElement = document.createElement('div');
        htmlElement.classList.add('datagrid');
        const tableElement = document.createElement('table');
        const tbodyElement = document.createElement('tbody');
        //const tableForDownload: IMatrixData;
        // Формируем заголовки колонок на основе структуры matrix.columns
        MatrixDataviewHtmlFormatter.formatColumnHeaders(matrix.columns, matrix.rows, tbodyElement);
        
        // Формируем строки данных
        MatrixDataviewHtmlFormatter.formatRowNodes(matrix.rows.root, tbodyElement, matrix.columns, matrix.valueSources);
        
        tableElement.appendChild(tbodyElement);
        htmlElement.appendChild(tableElement);
        return htmlElement;
    }

    private static formatColumnHeaders(columns: powerbi.DataViewHierarchy, rows: powerbi.DataViewHierarchy, tbodyElement: HTMLTableSectionElement): void {
        if (!columns?.root?.children) return;

        // Определяем количество уровней в columns (исключая уровень мер)
        const columnLevels = columns.levels.filter(level => 
            !level.sources.some(source => source.isMeasure)
        );

        // Создаем строки для каждого уровня колонок
        for (let levelIndex = 0; levelIndex < columnLevels.length; levelIndex++) {
            const row = document.createElement('tr');
            let rowLevel = columnLevels.length - levelIndex;
            row.classList.add('topRow');
            row.setAttribute('data-level',  rowLevel.toString());
            let childrenNum: number;
            MatrixDataviewHtmlFormatter.addRowHeader(row, columnLevels[levelIndex]?.sources[0]?.displayName || '');
            MatrixDataviewHtmlFormatter.formatColumnLevel(columns.root, levelIndex, row);
            if(row.children.length > 0) {
                childrenNum = row.children.length - 1;
            }
            else {
                childrenNum = 0;
            }
            row.setAttribute('data-children-num', childrenNum.toString());
            tbodyElement.appendChild(row);
        }

        // Создаем строку для мер (значений)
        this.createMeasuresRow(columns, rows, tbodyElement, 0);
    }

    private static formatColumnLevel(
            rootNode: powerbi.DataViewMatrixNode, 
            targetLevel: number, 
            row: HTMLTableRowElement, 
            currentLevel: number = 0
        ): void {
        
        if (!rootNode.children) return;

        for (const child of rootNode.children) {
            if (currentLevel === targetLevel) {
                // На нужном уровне - создаем ячейку
                const leafCount = this.calculateLeafCount(child);
                const displayText = child.isSubtotal ? 'Total' : (child.value?.toString() || '');
                const isSubtotal = child.isSubtotal;
                const th = MatrixDataviewHtmlFormatter.createColumnNode(displayText, leafCount, isSubtotal);
                row.appendChild(th);
            } else if (child.children) {
                // Рекурсивно обходим детей
                MatrixDataviewHtmlFormatter.formatColumnLevel(child, targetLevel, row, currentLevel + 1);
            }
            
        }
        //row.setAttribute('data-childrenNum', headerCounter.toString());
    }

    private static calculateLeafCount(node): number {
        if (node.leafCount !== undefined) return node.leafCount;
        
        if (!node.children || node.children.length === 0) return 1;
        
        let count = 0;
        for (const child of node.children) {
            count += this.calculateLeafCount(child);
        }
        return count;
    }

    private static createMeasuresRow(columns: powerbi.DataViewHierarchy, rows: powerbi.DataViewHierarchy, tbodyElement: HTMLTableSectionElement, measLevel: number): void {
        const measuresRow = document.createElement('tr');
        measuresRow.classList.add('topRow');
        measuresRow.setAttribute('data-level', measLevel.toString());
        
        // Добавляем заголовок из rows
        const rowHeaderName = rows?.levels[0]?.sources[0]?.displayName || '';
        this.addRowHeader(measuresRow, rowHeaderName);
        
        // Получаем все меры из columns
        const measures = this.getAllMeasures(columns);
        
        // Собираем все конечные узлы (листья) в правильном порядке
        const leafNodes = this.collectLeafNodesInOrder(columns.root);
        
        // Для каждого листового узла добавляем соответствующую меру
        let counterOfHeaders: number = 0;
        for (const leafNode of leafNodes) {
            const measureIndex = leafNode.levelSourceIndex || 0;
            const measureName = measures[measureIndex] || '';
            const isSubtotal = this.isLeafNodeSubtotal(leafNode);
            const th = this.createColumnNode(measureName, 0, isSubtotal);
            th.setAttribute('id', counterOfHeaders.toString());
            measuresRow.appendChild(th);
            counterOfHeaders++;
        }
        measuresRow.setAttribute('data-children-num', counterOfHeaders.toString());
        tbodyElement.appendChild(measuresRow);
    }

    private static collectLeafNodesInOrder(node: powerbi.DataViewMatrixNode): powerbi.DataViewMatrixNode[] {
        const leafNodes: powerbi.DataViewMatrixNode[] = [];
        this.traverseForLeafNodes(node, leafNodes);
        return leafNodes;
    }

    private static traverseForLeafNodes(node: powerbi.DataViewMatrixNode, leafNodes: powerbi.DataViewMatrixNode[]): void {
        if (!node.children || node.children.length === 0) {
            // Это листовой узел (мера)
            leafNodes.push(node);
        } else {
            // Рекурсивно обходим детей (включая итоговые узлы)
            for (const child of node.children) {
                this.traverseForLeafNodes(child, leafNodes);
            }
        }
    }

    // Новый метод: проверяет, является ли листовой узел частью тотала
    private static isLeafNodeSubtotal(node: powerbi.DataViewMatrixNode): boolean {
        return node.isSubtotal || 
               (node.levelValues && node.levelValues.some(lv => lv.value === 'Total')) ||
               node.value === 'Total';
    }

    private static getAllMeasures(columns: powerbi.DataViewHierarchy): string[] {
        const measures: string[] = [];
        
        // Ищем уровень с мерами
        const measuresLevel = columns.levels.find(level => 
            level.sources.some(source => source.isMeasure)
        );
        
        if (measuresLevel) {
            for (const source of measuresLevel.sources) {
                if (source.isMeasure) {
                    measures.push(source.displayName);
                }
            }
        }
        
        return measures;
    }

    private static addRowHeader(row: HTMLTableRowElement, text: string): void {
        const th = document.createElement('th');
        th.classList.add('rowsHeader');
        th.textContent = text;
        row.appendChild(th);
    }

    private static createColumnNode(text: string, colspan: number, isSubtotal: boolean = false): HTMLTableCellElement {
        const th = document.createElement('th');
        
        // Добавляем класс для тоталов
        if (isSubtotal || text === 'Total') {
            th.classList.add('totalColumn');
        }
        else {
            th.classList.add('formatColumnNodes');
        }
        
        th.textContent = text;
        
        if (colspan > 0) {
            th.setAttribute('colspan', colspan.toString());
        }
        
        return th;
    }

    private static formatRowNodes(root, topElement: HTMLElement, columns: powerbi.DataViewHierarchy, valueSources: powerbi.DataViewMetadataColumn[]) {
        if (!(typeof root.level === 'undefined' || root.level === null)) {
            const trElement = document.createElement('tr');
            const thElement = document.createElement('th');
            thElement.setAttribute('class', 'formatRowNodes');
            thElement.style.textAlign = 'left';
            let headerText = "";
            //добавляем отступы в зависимости от уровня
            for (let level = 0; level < root.level; level++) {
                headerText += '\u00A0\u00A0\u00A0\u00A0';
            }
            
            // Получаем правильное значение для отображения
            let displayValue = "";
            if (root.isSubtotal) {
                displayValue = "Totals";
                headerText += displayValue;
                const textElement = document.createTextNode(headerText);
                thElement.appendChild(textElement);
                trElement.appendChild(thElement);
                trElement.classList.add('totalRow');
            } else if (root.levelSourceIndex !== undefined) {
                // Для метрик используем levelSourceIndex для получения названия
                displayValue = root.levelSourceIndex.value !== undefined ? 
                            root.levelSourceIndex.value : 
                            (root.levelValues && root.levelValues[0] ? 
                            root.levelValues[0].value : "");
                
                headerText += displayValue;
                const textElement = document.createTextNode(headerText);
                thElement.appendChild(textElement);
                trElement.appendChild(thElement);
                trElement.classList.add('midRow');
            } else {
                // Для группировок используем value
                displayValue = root.value !== undefined ? root.value : "";
                
                headerText += displayValue;
                const textElement = document.createTextNode(headerText);
                thElement.appendChild(textElement);
                trElement.appendChild(thElement);
                trElement.classList.add('midRow');
                
                // Ключевое изменение: если у узла есть дети, и это не тотал,
                // добавляем ячейки с данными для родительской строки
                if (root.children && root.children.length > 0) {
                    // Ищем первый дочерний узел с тоталами (обычно последний)
                    const subtotalChild = root.children.find(child => child.isSubtotal);
                    if (subtotalChild && subtotalChild.values) {
                        this.addDataCells(trElement, subtotalChild.values, columns, valueSources);
                    }
                }
            }
            
            // Добавляем ячейки данных для обычных строк и тоталов
            if (root.values && !(root.children && root.children.length > 0 && !root.isSubtotal)) {
                this.addDataCells(trElement, root.values, columns, valueSources);
            }
            
            topElement.appendChild(trElement);
        }
        if (root.children) {
            for (const child of root.children) {
                // Пропускаем отрисовку отдельных строк для тоталов, если они уже добавлены в родителя
                if (!child.isSubtotal || (root.children && root.children.length > 0 && !root.isSubtotal)) {
                    MatrixDataviewHtmlFormatter.formatRowNodes(child, topElement, columns, valueSources);
                }
            }
        }
    }

/**
 * Вспомогательный метод для добавления ячеек данных
 */
    private static addDataCells(trElement: HTMLTableRowElement, values: any, columns: powerbi.DataViewHierarchy, valueSources: powerbi.DataViewMetadataColumn[]): void {
    // Создаем массив ключей значений и сортируем их для правильного порядка
    const valueKeys = Object.keys(values).sort((a, b) => parseInt(a) - parseInt(b));
    
    // Получаем информацию о том, какие колонки являются тоталами
    const columnTotalInfo = this.getColumnTotalInfo(columns);
    
    // Получаем valueSources для форматирования
    const currentValueSources = valueSources || [];
    
    for (let i = 0; i < valueKeys.length; i++) {
        const key = valueKeys[i];
        const value = values[key];
        const tdElement = document.createElement('td');
        tdElement.setAttribute('id', key);
        
        // Помечаем ячейки данных, которые относятся к тоталам
        if (columnTotalInfo[parseInt(key)]) {
            tdElement.classList.add('totalColumn');
        }
        
        if (value != null && value.value != null) {
            // ИСПРАВЛЕНИЕ: Форматируем значение на основе valueSources
            const formattedValue = this.formatValue(value.value, value.valueSourceIndex, valueSources);
            tdElement.appendChild(document.createTextNode(formattedValue));
        } 
        trElement.appendChild(tdElement);
    }
}

    // Новый метод: получает информацию о том, какие колонки являются тоталами
    private static getColumnTotalInfo(columns: powerbi.DataViewHierarchy): boolean[] {
        const totalInfo: boolean[] = [];
        
        if (!columns?.root?.children) return totalInfo;
        
        // Собираем все листовые узлы колонок в правильном порядке
        const leafNodes = this.collectLeafNodesInOrder(columns.root);
        
        // Для каждого листового узла определяем, является ли он тоталом
        for (const leafNode of leafNodes) {
            totalInfo.push(this.isLeafNodeSubtotal(leafNode));
        }
        
        return totalInfo;
    }

    private static formatValue(rawValue: number, valueSourceIndex: number, valueSources: any[]): string {
        /*
        Метод форматирует значения, чтобы они соответствовали формату, 
        выбранному при создании визуализации в Power BI
        */ 
        if (valueSourceIndex === undefined || !valueSources || !valueSources[valueSourceIndex]) {
            return rawValue.toString();
        }
        
        const valueSource = valueSources[valueSourceIndex];
        
        try {
            // Используется встроенный форматтер Power BI
            const formatter = valueFormatter.create({
                format: valueSource.format,
                value: rawValue
            });
            
            return formatter.format(rawValue);
        } 
        catch (error) {
            console.warn('Error using Power BI formatter:', error);
            return rawValue.toString();
        }
}
}