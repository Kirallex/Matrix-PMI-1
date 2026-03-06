export declare class HeightResizer {
    private static resizing;
    private static container;
    private static handle;
    private static startY;
    private static startHeight;
    private static minHeight;
    private static onResizeCallback;
    static init(container: HTMLElement, onResize?: (height: number) => void): void;
    private static onMouseDown;
    private static onMouseMove;
    private static onMouseUp;
    static cleanup(): void;
}
