import powerbi from "powerbi-visuals-api";
export declare class MatrixDataviewHtmlFormatter {
    static formatDataViewMatrix(matrix: powerbi.DataViewMatrix): HTMLElement;
    private static formatColumnHeaders;
    private static formatColumnLevel;
    private static calculateLeafCount;
    private static createMeasuresRow;
    private static collectLeafNodesInOrder;
    private static traverseForLeafNodes;
    private static isLeafNodeSubtotal;
    private static getAllMeasures;
    private static addRowHeader;
    private static createColumnNode;
    private static formatRowNodes;
    /**
     * Вспомогательный метод для добавления ячеек данных
     */
    private static addDataCells;
    private static getColumnTotalInfo;
    private static formatValue;
}
