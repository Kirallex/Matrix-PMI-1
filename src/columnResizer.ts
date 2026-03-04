export class ColumnResizer {
    private static resizing: boolean = false;
    private static currentTh: HTMLTableCellElement | null = null;
    private static startX: number = 0;
    private static startWidth: number = 0;
    private static currentTable: HTMLTableElement | null = null;
    private static resizeHandles: HTMLElement[] = [];
    private static onResizeCallback: ((colIndex: number, newWidth: number) => void) | null = null;

    public static init(table: HTMLTableElement, onResize?: (colIndex: number, newWidth: number) => void): void {
        this.cleanup();
        this.onResizeCallback = onResize || null;
        this.currentTable = table;
        const headers = table.querySelectorAll('th');
        headers.forEach(th => {
            const resizer = document.createElement('div');
            resizer.style.position = 'absolute';
            resizer.style.top = '0';
            resizer.style.right = '0';
            resizer.style.width = '5px';
            resizer.style.height = '100%';
            resizer.style.cursor = 'col-resize';
            resizer.style.userSelect = 'none';
            resizer.style.zIndex = '1';
            resizer.style.backgroundColor = 'transparent';
            
            if (getComputedStyle(th).position === 'static') {
                th.style.position = 'relative';
            }
            
            th.appendChild(resizer);
            this.resizeHandles.push(resizer);
            
            resizer.addEventListener('mousedown', (e: MouseEvent) => {
                e.preventDefault();
                this.startResize(e, th);
            });
        });

        document.addEventListener('mousemove', this.onMouseMove);
        document.addEventListener('mouseup', this.onMouseUp);
    }

    private static startResize(e: MouseEvent, th: HTMLTableCellElement): void {
        this.resizing = true;
        this.currentTh = th;
        this.startX = e.clientX;
        this.startWidth = th.offsetWidth;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    }

    private static onMouseMove = (e: MouseEvent): void => {
        if (!this.resizing || !this.currentTh || !this.currentTable) return;
        
        const diff = e.clientX - this.startX;
        const newWidth = Math.max(30, this.startWidth + diff); // минимальная ширина 30px
        const cellIndex = this.currentTh.cellIndex;
        
        // Применяем ко всем ячейкам колонки
        for (let i = 0; i < this.currentTable.rows.length; i++) {
            const cell = this.currentTable.rows[i].cells[cellIndex];
            if (cell) {
                cell.style.width = newWidth + 'px';
                cell.style.minWidth = newWidth + 'px';
                cell.style.maxWidth = newWidth + 'px';
            }
        }

        // Вызываем колбэк, если есть
        if (this.onResizeCallback) {
            this.onResizeCallback(cellIndex, newWidth);
        }
    };

    private static onMouseUp = (e: MouseEvent): void => {
        if (this.resizing) {
            this.resizing = false;
            this.currentTh = null;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        }
    };

    public static cleanup(): void {
        this.resizeHandles.forEach(handle => handle.remove());
        this.resizeHandles = [];
        document.removeEventListener('mousemove', this.onMouseMove);
        document.removeEventListener('mouseup', this.onMouseUp);
        this.resizing = false;
        this.currentTh = null;
        this.currentTable = null;
        this.onResizeCallback = null;
    }
}