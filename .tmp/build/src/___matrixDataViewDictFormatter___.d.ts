import powerbi from "powerbi-visuals-api";
import { IMatrixData } from "./matrixDataInterfaces";
export declare class MatrixDataViewDictFormatter {
    static formatDataViewMatrix(matrix: powerbi.DataViewMatrix): IMatrixData;
    private static formatColumnHeaders;
    private static createMeasuresRow;
    private static formatColumnLevel;
    private static formatRowNodes;
    /**
     * Вспомогательный метод для добавления ячеек данных
     */
    private static addDataCells;
    private static getTotalColumnsCount;
    private static calculateLeafCount;
    private static collectLeafNodesInOrder;
    private static traverseForLeafNodes;
    private static getAllMeasures;
    private static formatValue;
}
