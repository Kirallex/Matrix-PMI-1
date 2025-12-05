// matrixDataInterfaces.ts
export interface IMatrixData {
    topRow: string[][];
    midRow: string[][];
    totalRow: string[][];
}

export interface IColumnHeader {
    level: number;
    cells: IHeaderCell[];
    isMeasuresRow: boolean;
}

export interface IHeaderCell {
    text: string;
    colspan: number;
    isSubtotal: boolean;
    columnIndex?: number;
}

export interface IMatrixRow {
    level: number;
    rowPath: string[];
    cells: IDataCell[];
    isSubtotal: boolean;
    hasChildren: boolean;
}

export interface IDataCell {
    value: any;
    formattedValue: string;
    columnIndex: number;
    isSubtotal: boolean;
    valueSourceIndex?: number;
}