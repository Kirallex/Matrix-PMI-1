// Данный файл содержит логику, аналогичную той, которая реализована в файле MatrixDataViewDictFormatter.ts,
// но в данном случае реализуется перевод данных таблицы в структуру "словарь" для последующей выгрузки в CSV-формат


import powerbi from "powerbi-visuals-api";
import { valueFormatter } from "powerbi-visuals-utils-formattingutils";
import { IMatrixData } from "./matrixDataInterfaces";

export class MatrixDataViewDictFormatter {
    public static formatDataViewMatrix(matrix: powerbi.DataViewMatrix): IMatrixData {
        const resultForDownload: IMatrixData = {
            topRow: [],
            midRow: [],
            totalRow: []
        };

        MatrixDataViewDictFormatter.formatColumnHeaders(matrix.columns, matrix.rows, resultForDownload);
        
        // Формируем строки данных
        MatrixDataViewDictFormatter.formatRowNodes(matrix.rows.root, resultForDownload, matrix.columns, matrix.valueSources);
        
        return resultForDownload;
    }

    private static formatColumnHeaders(columns: powerbi.DataViewHierarchy, rows: powerbi.DataViewHierarchy, resultTable: IMatrixData): void {
        if (!columns?.root?.children) return;

        // Определяем количество уровней в columns (исключая уровень мер)
        const columnLevels = columns.levels.filter(level => 
            !level.sources.some(source => source.isMeasure)
        );

        // Создаем строки для каждого уровня колонок
        for (let levelIndex = 0; levelIndex < columnLevels.length; levelIndex++) {
            const row: string[] = [];
            let headerText = columnLevels[levelIndex]?.sources[0]?.displayName || '';
            row.push(headerText);
            MatrixDataViewDictFormatter.formatColumnLevel(columns.root, levelIndex, row);
            resultTable.topRow.push(row);
        }

        // Создаем строку для мер (значений)
        this.createMeasuresRow(columns, rows, resultTable, 0);
    }

    private static createMeasuresRow(
        columns: powerbi.DataViewHierarchy, 
        rows: powerbi.DataViewHierarchy, 
        resultTable: IMatrixData, 
        measLevel: number): void 
    { 
        const measuresRow: string[] = [];
        
        // Добавляем заголовок из rows
        const rowHeaderName = rows?.levels[0]?.sources[0]?.displayName || '';
        measuresRow.push(rowHeaderName);
        
        // Получаем все меры из columns
        const measures = this.getAllMeasures(columns);
        
        // Собираем все конечные узлы (листья) в правильном порядке
        const leafNodes = this.collectLeafNodesInOrder(columns.root);
        
        // Для каждого листового узла добавляем соответствующую меру
        for (const leafNode of leafNodes) {
            const measureIndex = leafNode.levelSourceIndex || 0;
            const measureName = measures[measureIndex] || '';
            measuresRow.push(measureName);
        }
        resultTable.topRow.push(measuresRow);
    }

    private static formatColumnLevel(
        rootNode: powerbi.DataViewMatrixNode, 
        targetLevel: number, 
        headerRow: string[], 
        currentLevel: number = 0
    ): void {
        if (!rootNode.children) return;

        for (const child of rootNode.children) {
            if (currentLevel === targetLevel) {
                // На нужном уровне - создаем ячейку
                const displayText = child.isSubtotal ? 'Total' : (child.value?.toString() || '');
                const leafCount = this.calculateLeafCount(child);
                
                // Добавляем текст нужное количество раз (для colspan)
                for (let i = 0; i < leafCount; i++) {
                    headerRow.push(displayText);
                }
            } else if (child.children) {
                // Рекурсивно обходим детей
                MatrixDataViewDictFormatter.formatColumnLevel(child, targetLevel, headerRow, currentLevel + 1);
            }
        }
    }

    private static formatRowNodes(
        root: any, 
        resultTable: IMatrixData, 
        columns: powerbi.DataViewHierarchy, 
        valueSources: powerbi.DataViewMetadataColumn[]
    ) {
        if (!(typeof root.level === 'undefined' || root.level === null)) {
            let headerText = "";
            
            // Добавляем отступы в зависимости от уровня
            for (let level = 0; level < root.level; level++) {
                headerText += '\u00A0\u00A0\u00A0\u00A0';
            }
            
            // Получаем правильное значение для отображения
            let displayValue: string = "";
            if (root.isSubtotal) {
                displayValue = "Totals";
                headerText += displayValue;
                
                // Создаем строку для totalRow
                const totalRow: string[] = [headerText];
                if (root.values) {
                    this.addDataCells(totalRow, root.values, columns, valueSources);
                }
                resultTable.totalRow.push(totalRow);
                
            } else if (root.levelSourceIndex !== undefined) {
                // Для метрик используем levelSourceIndex для получения названия
                displayValue = root.levelSourceIndex.value !== undefined ? 
                            root.levelSourceIndex.value : 
                            (root.levelValues && root.levelValues[0] ? 
                            root.levelValues[0].value : "");
                
                headerText += displayValue;
                
                // Создаем строку для midRow
                const midRow: string[] = [headerText];
                if (root.values && !(root.children && root.children.length > 0)) {
                    this.addDataCells(midRow, root.values, columns, valueSources);
                }
                resultTable.midRow.push(midRow);
            } else {
                // Для группировок используем value
                displayValue = root.value !== undefined ? root.value : "";
                
                headerText += displayValue;
                
                // Создаем строку для midRow
                const midRow: string[] = [headerText];
                
                // Ключевое изменение: если у узла есть дети, и это не тотал,
                // добавляем ячейки с данными для родительской строки
                if (root.children && root.children.length > 0) {
                    // Ищем первый дочерний узел с тоталами (обычно последний)
                    const subtotalChild = root.children.find((child: { isSubtotal: any; }) => child.isSubtotal);
                    if (subtotalChild && subtotalChild.values) {
                        this.addDataCells(midRow, subtotalChild.values, columns, valueSources);
                    }
                } else if (root.values) {
                    // Если нет детей, добавляем обычные значения
                    this.addDataCells(midRow, root.values, columns, valueSources);
                }
                
                resultTable.midRow.push(midRow);
            }
        }
        
        // Рекурсивно обрабатываем детей
        if (root.children) {
            for (const child of root.children) {
                // Пропускаем отрисовку отдельных строк для тоталов, если они уже добавлены в родителя
                if (!child.isSubtotal || (root.children && root.children.length > 0 && !root.isSubtotal)) {
                    MatrixDataViewDictFormatter.formatRowNodes(child, resultTable, columns, valueSources);
                }
            }
        }
    }

    /**
     * Вспомогательный метод для добавления ячеек данных
     */
    private static addDataCells(
        row: string[], 
        values: any, 
        columns: powerbi.DataViewHierarchy, 
        valueSources: powerbi.DataViewMetadataColumn[]
    ): void {
        // Получаем общее количество колонок
        const totalColumns = this.getTotalColumnsCount(columns);
        
        // Создаем массив для всех ячеек, сначала заполняем пустыми строками
        const dataCells: string[] = Array(totalColumns).fill('');
        
        // Заполняем ячейки, для которых есть значения
        const valueKeys = Object.keys(values).sort((a, b) => parseInt(a) - parseInt(b));
        
        for (let i = 0; i < valueKeys.length; i++) {
            const key = valueKeys[i];
            const value = values[key];
            const columnIndex = parseInt(key);
            
            if (value != null && value.value != null) {
                // Форматируем значение на основе valueSources
                const formattedValue = this.formatValue(value.value, value.valueSourceIndex, valueSources);
                if (columnIndex < dataCells.length) {
                    dataCells[columnIndex] = formattedValue;
                }
            }
        }
        
        // Добавляем все ячейки в строку
        row.push(...dataCells);
    }

    // Новый метод: получает общее количество колонок
    private static getTotalColumnsCount(columns: powerbi.DataViewHierarchy): number {
        if (!columns?.root) return 0;
        const leafNodes = this.collectLeafNodesInOrder(columns.root);
        return leafNodes.length;
    }

    // Вспомогательный метод для вычисления количества листьев
    private static calculateLeafCount(node: any): number {
        if (node.leafCount !== undefined) return node.leafCount;
        
        if (!node.children || node.children.length === 0) return 1;
        
        let count = 0;
        for (const child of node.children) {
            count += this.calculateLeafCount(child);
        }
        return count;
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

    private static formatValue(rawValue: number, valueSourceIndex: number, valueSources: any[]): string {
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
            console.warn('Error using Power BI data parser:', error);
            return rawValue.toString();
        }
    }
}