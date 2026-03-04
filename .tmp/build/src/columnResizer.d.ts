export declare class ColumnResizer {
    private static resizing;
    private static currentTh;
    private static startX;
    private static startWidth;
    private static currentTable;
    private static resizeHandles;
    private static onResizeCallback;
    static init(table: HTMLTableElement, onResize?: (colIndex: number, newWidth: number) => void): void;
    private static startResize;
    private static onMouseMove;
    private static onMouseUp;
    static cleanup(): void;
}
