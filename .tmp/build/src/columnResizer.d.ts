export declare class ColumnResizer {
    private static resizing;
    private static currentTh;
    private static startX;
    private static startWidth;
    private static currentTable;
    private static resizeHandles;
    static init(table: HTMLTableElement): void;
    private static startResize;
    private static onMouseMove;
    private static onMouseUp;
    static cleanup(): void;
}
