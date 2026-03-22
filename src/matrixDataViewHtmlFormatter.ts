import powerbi from "powerbi-visuals-api";
import { valueFormatter } from "powerbi-visuals-utils-formattingutils";
import { plusIcon, minusIcon } from './icons';

export class MatrixDataviewHtmlFormatter {
    public static formatDataViewMatrix(
        matrix: powerbi.DataViewMatrix,
        valueSources?: powerbi.DataViewMetadataColumn[],
        expandedNodes?: Set<string>,
        showNonGrandTotal: boolean = true,   // новый параметр
        forceExpandAll: boolean = false
    ): HTMLElement {
        const htmlElement = document.createElement('div');
        htmlElement.classList.add('datagrid');
        const tableElement = document.createElement('table');
        const theadElement = document.createElement('thead');
        const tbodyElement = document.createElement('tbody');

        // Создаём массив соответствия индексов колонок индексам источников
        let columnSourceIndices: number[] = [];
        if (matrix.columns?.root) {
            const leafNodes = this.collectLeafNodesInOrder(matrix.columns.root);
            columnSourceIndices = leafNodes.map(node => node.levelSourceIndex !== undefined ? node.levelSourceIndex : -1);
        }

        // Заголовки в thead
        this.formatColumnHeaders(matrix.columns, matrix.rows, theadElement);
        // Данные в tbody
        this.formatRowNodes(
            matrix.rows.root,
            tbodyElement,
            matrix.columns,
            valueSources,
            columnSourceIndices,
            expandedNodes,
            '',
            forceExpandAll, // передаём флаг дальше
            showNonGrandTotal
        );

        tableElement.appendChild(theadElement);
        tableElement.appendChild(tbodyElement);
        htmlElement.appendChild(tableElement);
        return htmlElement;
    }

    private static formatColumnHeaders(
        columns: powerbi.DataViewHierarchy,
        rows: powerbi.DataViewHierarchy,
        theadElement: HTMLElement
    ): void {
        if (!columns?.root?.children) return;

        const columnLevels = columns.levels.filter(level =>
            !level.sources.some(source => source.isMeasure)
        );

        for (let levelIndex = 0; levelIndex < columnLevels.length; levelIndex++) {
            const row = document.createElement('tr');
            let rowLevel = columnLevels.length - levelIndex;
            row.classList.add('topRow');
            row.setAttribute('data-level', rowLevel.toString());
            let childrenNum: number;
            this.addRowHeader(row, columnLevels[levelIndex]?.sources[0]?.displayName || '');
            this.formatColumnLevel(columns.root, levelIndex, row);
            childrenNum = row.children.length > 0 ? row.children.length - 1 : 0;
            row.setAttribute('data-children-num', childrenNum.toString());
            theadElement.appendChild(row);
        }

        this.createMeasuresRow(columns, rows, theadElement, 0);
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

    private static createMeasuresRow(
        columns: powerbi.DataViewHierarchy,
        rows: powerbi.DataViewHierarchy,
        theadElement: HTMLElement,
        measLevel: number
    ): void {
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
        theadElement.appendChild(measuresRow);
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
        columnSourceIndices?: number[],
        expandedNodes?: Set<string>,
        path: string = '',
        forceExpandAll: boolean = false,
        showNonGrandTotal: boolean = true
    ) {
        if (!root) return;

        const level = (root.level !== undefined && root.level !== null) ? root.level : -1;

        if (root.isSubtotal && level !== 0 && !showNonGrandTotal) {
            return;
        }

        if (level >= 0) {
            const trElement = document.createElement('tr');
            trElement.setAttribute('data-level', level.toString());

            const thElement = document.createElement('th');
            thElement.setAttribute('class', 'formatRowNodes');
            thElement.style.textAlign = 'left';

            // Отступы
            let indentText = "";
            for (let i = 0; i < level; i++) {
                indentText += '\u00A0\u00A0\u00A0\u00A0';
            }
            if (indentText) {
                const indentNode = document.createTextNode(indentText);
                thElement.appendChild(indentNode);
            }

            // Значение ячейки (без отступов)
            let displayValue = "";
            if (root.isSubtotal) {
                displayValue = "Total";
            } else if (root.levelSourceIndex !== undefined) {
                displayValue = root.levelSourceIndex.value !== undefined ?
                    root.levelSourceIndex.value :
                    (root.levelValues && root.levelValues[0] ? root.levelValues[0].value : "");
            } else {
                displayValue = root.value !== undefined ? root.value : "";
            }

            // Кнопка раскрытия
            const hasChildren = root.children && root.children.length > 0 && !root.isSubtotal;
            if (hasChildren) {
                const expandBtn = document.createElement('span');
                expandBtn.className = 'expandCollapseButton';
                expandBtn.dataset.path = path;
                expandBtn.innerHTML = '';
                expandBtn.insertAdjacentHTML('beforeend', expandedNodes?.has(path) ? minusIcon : plusIcon);
                thElement.appendChild(expandBtn);
                // Фиксированный пробел после кнопки
                const spaceNode = document.createTextNode('\u00A0\u00A0');
                thElement.appendChild(spaceNode);
            }

            // Текст оборачиваем в span для независимого выравнивания
            const textSpan = document.createElement('span');
            textSpan.className = 'row-header-text';
            const textNode = document.createTextNode(displayValue);
            textSpan.appendChild(textNode);
            thElement.appendChild(textSpan);

            trElement.appendChild(thElement);

            if (root.isSubtotal) {
                trElement.classList.add('totalRow');
            } else {
                trElement.classList.add('midRow');
            }

            // Ячейки данных
            const columnCount = columnSourceIndices ? columnSourceIndices.length : 0;
            if (root.values && !(root.children && root.children.length > 0 && !root.isSubtotal)) {
                this.addDataCells(trElement, root.values, columns, valueSources, columnSourceIndices);
            } else if (root.children && root.children.length > 0) {
                const subtotalChild = root.children.find(child => child.isSubtotal);
                if (subtotalChild && subtotalChild.values) {
                    this.addDataCells(trElement, subtotalChild.values, columns, valueSources, columnSourceIndices);
                } else {
                    for (let i = 0; i < columnCount; i++) {
                        const tdElement = document.createElement('td');
                        tdElement.setAttribute('id', i.toString());
                        trElement.appendChild(tdElement);
                    }
                }
            } else {
                for (let i = 0; i < columnCount; i++) {
                    const tdElement = document.createElement('td');
                    tdElement.setAttribute('id', i.toString());
                    trElement.appendChild(tdElement);
                }
            }

            topElement.appendChild(trElement);
        }

        // Рекурсивный обход детей
        if (root.children && root.children.length > 0 && !root.isSubtotal) {
            const showChildren = forceExpandAll || (level === -1) || (expandedNodes?.has(path) === true);
            if (showChildren) {
                for (const child of root.children) {
                    const childPath = path ? `${path}-${child.levelSourceIndex || child.value}` : `${child.levelSourceIndex || child.value}`;
                    this.formatRowNodes(child, topElement, columns, valueSources, columnSourceIndices, expandedNodes, childPath, forceExpandAll, showNonGrandTotal);
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
                let sourceIndex = value.valueSourceIndex;
                if (sourceIndex === undefined) {
                    sourceIndex = colIndex;
                }
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

            let decimalPlaces = 0;
            const decimalMatch = /\.(0+)/.exec(formatString);
            if (decimalMatch) {
                decimalPlaces = decimalMatch[1].length;
            }

            let roundedValue: number;
            if (decimalPlaces > 0) {
                const factor = Math.pow(10, decimalPlaces);
                roundedValue = Math.round(rawValue * factor) / factor;
            } else {
                roundedValue = Math.round(rawValue);
            }

            const needsThousandsSeparator = formatString.includes(',');

            if (needsThousandsSeparator) {
                return roundedValue.toLocaleString('ru-RU', {
                    minimumFractionDigits: decimalPlaces,
                    maximumFractionDigits: decimalPlaces,
                    useGrouping: true
                });
            } else {
                return roundedValue.toLocaleString('ru-RU', {
                    minimumFractionDigits: decimalPlaces,
                    maximumFractionDigits: decimalPlaces,
                    useGrouping: false
                });
            }
        } catch (error) {
            console.warn('Error formatting value:', error);
            return rawValue?.toLocaleString('ru-RU') || '';
        }
    }
}