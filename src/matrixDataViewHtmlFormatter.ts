import powerbi from "powerbi-visuals-api";
import { valueFormatter } from "powerbi-visuals-utils-formattingutils";

export class MatrixDataviewHtmlFormatter {
    public static formatDataViewMatrix(
        matrix: powerbi.DataViewMatrix,
        valueSources?: powerbi.DataViewMetadataColumn[]
    ): HTMLElement {
        const htmlElement = document.createElement('div');
        htmlElement.classList.add('datagrid');
        const tableElement = document.createElement('table');
        const tbodyElement = document.createElement('tbody');
        
        // Создаём массив соответствия индексов колонок индексам источников
        let columnSourceIndices: number[] = [];
        if (matrix.columns?.root) {
            const leafNodes = this.collectLeafNodesInOrder(matrix.columns.root);
            columnSourceIndices = leafNodes.map(node => node.levelSourceIndex !== undefined ? node.levelSourceIndex : -1);
        }
        
        this.formatColumnHeaders(matrix.columns, matrix.rows, tbodyElement);
        this.formatRowNodes(matrix.rows.root, tbodyElement, matrix.columns, valueSources, columnSourceIndices);
        
        tableElement.appendChild(tbodyElement);
        htmlElement.appendChild(tableElement);
        return htmlElement;
    }

    private static formatColumnHeaders(columns: powerbi.DataViewHierarchy, rows: powerbi.DataViewHierarchy, tbodyElement: HTMLTableSectionElement): void {
        if (!columns?.root?.children) return;

        const columnLevels = columns.levels.filter(level => 
            !level.sources.some(source => source.isMeasure)
        );

        for (let levelIndex = 0; levelIndex < columnLevels.length; levelIndex++) {
            const row = document.createElement('tr');
            let rowLevel = columnLevels.length - levelIndex;
            row.classList.add('topRow');
            row.setAttribute('data-level',  rowLevel.toString());
            let childrenNum: number;
            this.addRowHeader(row, columnLevels[levelIndex]?.sources[0]?.displayName || '');
            this.formatColumnLevel(columns.root, levelIndex, row);
            childrenNum = row.children.length > 0 ? row.children.length - 1 : 0;
            row.setAttribute('data-children-num', childrenNum.toString());
            tbodyElement.appendChild(row);
        }

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
                const leafCount = this.calculateLeafCount(child);
                const displayText = child.isSubtotal ? 'Total' : (child.value?.toString() || '');
                const isSubtotal = child.isSubtotal;
                const th = this.createColumnNode(displayText, leafCount, isSubtotal);
                row.appendChild(th);
            } else if (child.children) {
                this.formatColumnLevel(child, targetLevel, row, currentLevel + 1);
            }
        }
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
        
        const rowHeaderName = rows?.levels[0]?.sources[0]?.displayName || '';
        this.addRowHeader(measuresRow, rowHeaderName);
        
        const measures = this.getAllMeasures(columns);
        const leafNodes = this.collectLeafNodesInOrder(columns.root);
        
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
            leafNodes.push(node);
        } else {
            for (const child of node.children) {
                this.traverseForLeafNodes(child, leafNodes);
            }
        }
    }

    private static isLeafNodeSubtotal(node: powerbi.DataViewMatrixNode): boolean {
        return node.isSubtotal || 
               (node.levelValues && node.levelValues.some(lv => lv.value === 'Total')) ||
               node.value === 'Total';
    }

    private static getAllMeasures(columns: powerbi.DataViewHierarchy): string[] {
        const measures: string[] = [];
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
        if (isSubtotal || text === 'Total') {
            th.classList.add('totalColumn');
        } else {
            th.classList.add('formatColumnNodes');
        }
        th.textContent = text;
        if (colspan > 0) {
            th.setAttribute('colspan', colspan.toString());
        }
        return th;
    }

    private static formatRowNodes(
        root: any,
        topElement: HTMLElement,
        columns: powerbi.DataViewHierarchy,
        valueSources?: powerbi.DataViewMetadataColumn[],
        columnSourceIndices?: number[]
    ) {
        if (!(typeof root.level === 'undefined' || root.level === null)) {
            const trElement = document.createElement('tr');
            const thElement = document.createElement('th');
            thElement.setAttribute('class', 'formatRowNodes');
            thElement.style.textAlign = 'left';
            let headerText = "";
            for (let level = 0; level < root.level; level++) {
                headerText += '\u00A0\u00A0\u00A0\u00A0';
            }
            
            let displayValue = "";
            if (root.isSubtotal) {
                displayValue = "Totals";
                headerText += displayValue;
                const textElement = document.createTextNode(headerText);
                thElement.appendChild(textElement);
                trElement.appendChild(thElement);
                trElement.classList.add('totalRow');
            } else if (root.levelSourceIndex !== undefined) {
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
                displayValue = root.value !== undefined ? root.value : "";
                headerText += displayValue;
                const textElement = document.createTextNode(headerText);
                thElement.appendChild(textElement);
                trElement.appendChild(thElement);
                trElement.classList.add('midRow');
                
                if (root.children && root.children.length > 0) {
                    const subtotalChild = root.children.find(child => child.isSubtotal);
                    if (subtotalChild && subtotalChild.values) {
                        this.addDataCells(trElement, subtotalChild.values, columns, valueSources, columnSourceIndices);
                    }
                }
            }
            
            if (root.values && !(root.children && root.children.length > 0 && !root.isSubtotal)) {
                this.addDataCells(trElement, root.values, columns, valueSources, columnSourceIndices);
            }
            
            topElement.appendChild(trElement);
        }
        if (root.children) {
            for (const child of root.children) {
                if (!child.isSubtotal || (root.children && root.children.length > 0 && !root.isSubtotal)) {
                    this.formatRowNodes(child, topElement, columns, valueSources, columnSourceIndices);
                }
            }
        }
    }

    private static addDataCells(
        trElement: HTMLTableRowElement,
        values: any,
        columns: powerbi.DataViewHierarchy,
        valueSources?: powerbi.DataViewMetadataColumn[],
        columnSourceIndices?: number[]
    ): void {
        const valueKeys = Object.keys(values).sort((a, b) => parseInt(a) - parseInt(b));
        const columnTotalInfo = this.getColumnTotalInfo(columns);
        
        for (let i = 0; i < valueKeys.length; i++) {
            const key = valueKeys[i];
            const value = values[key];
            const tdElement = document.createElement('td');
            tdElement.setAttribute('id', key);
            const colIndex = parseInt(key);
            
            if (columnTotalInfo[colIndex]) {
                tdElement.classList.add('totalColumn');
            }
            
            if (value != null && value.value != null) {
                // Определяем индекс источника значения
                let sourceIndex = value.valueSourceIndex;
                if (sourceIndex === undefined) {
                    // Если не указан, используем ключ как индекс (предполагаем, что ключ = индекс меры)
                    sourceIndex = colIndex;
                }
                // Добавим отладку
                //console.log(`colIndex=${colIndex}, sourceIndex=${sourceIndex}, value=${value.value}`);
                const formattedValue = this.formatValue(value.value, sourceIndex, valueSources);
                tdElement.appendChild(document.createTextNode(formattedValue));
            } 
            trElement.appendChild(tdElement);
        }
    }

    private static getColumnTotalInfo(columns: powerbi.DataViewHierarchy): boolean[] {
        const totalInfo: boolean[] = [];
        if (!columns?.root?.children) return totalInfo;
        const leafNodes = this.collectLeafNodesInOrder(columns.root);
        for (const leafNode of leafNodes) {
            totalInfo.push(this.isLeafNodeSubtotal(leafNode));
        }
        return totalInfo;
    }

    private static formatValue(rawValue: number, valueSourceIndex: number, valueSources?: any[]): string {
        if (valueSourceIndex === undefined || valueSourceIndex < 0 || !valueSources || !valueSources[valueSourceIndex]) {
            return rawValue?.toLocaleString('ru-RU') || '';
        }
        const valueSource = valueSources[valueSourceIndex];
        
        try {
            const formatString = valueSource.format || '0';
            
            // Процентные форматы оставляем стандартному форматтеру (они работают корректно)
            if (formatString.includes('%')) {
                const options: any = {
                    format: formatString,
                    value: rawValue,
                    cultureSelector: 'ru-RU',
                    displayUnit: 0
                };
                const formatter = valueFormatter.create(options);
                return formatter.format(rawValue);
            }
            
            // Определяем количество десятичных знаков из строки формата
            let decimalPlaces = 0;
            const decimalMatch = /\.(0+)/.exec(formatString);
            if (decimalMatch) {
                decimalPlaces = decimalMatch[1].length;
            }
            
            // Округляем значение
            let roundedValue: number;
            if (decimalPlaces > 0) {
                const factor = Math.pow(10, decimalPlaces);
                roundedValue = Math.round(rawValue * factor) / factor;
            } else {
                roundedValue = Math.round(rawValue);
            }
            
            // Определяем, нужен ли разделитель тысяч (пробел в русской локали)
            // Критерий: наличие запятой в строке формата (напр. "#,##0" или "#,##0.00")
            const needsThousandsSeparator = formatString.includes(',');
            
            // Форматируем с учётом русской локали
            if (needsThousandsSeparator) {
                return roundedValue.toLocaleString('ru-RU', {
                    minimumFractionDigits: decimalPlaces,
                    maximumFractionDigits: decimalPlaces,
                    useGrouping: true // включает разделители тысяч (в ru-RU это пробелы)
                });
            } else {
                // Без разделителей тысяч
                return roundedValue.toLocaleString('ru-RU', {
                    minimumFractionDigits: decimalPlaces,
                    maximumFractionDigits: decimalPlaces,
                    useGrouping: false // отключаем разделители
                });
            }
        } catch (error) {
            console.warn('Error formatting value:', error);
            return rawValue?.toLocaleString('ru-RU') || '';
        }
    }
}