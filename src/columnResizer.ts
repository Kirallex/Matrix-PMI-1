// columnResizer.ts Метод для изменения ширины колонок с помощью мышки
export class ColumnResizer {
    private static resizing: boolean = false;
    private static currentTh: HTMLTableCellElement | null = null;
    private static startX: number = 0;
    private static startWidth: number = 0;
    private static currentTable: HTMLTableElement | null = null;
    private static resizeHandles: HTMLElement[] = [];

    public static init(table: HTMLTableElement): void {
        // Очищаем предыдущую таблицу, если была
        this.cleanup();
        
        this.currentTable = table;
        const headers = table.querySelectorAll('th');
        headers.forEach(th => {
            // Добавляем "ручку" для ресайза
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
            
            // Убедимся, что ячейка имеет позиционирование
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
        const newWidth = this.startWidth + diff;
        
        // Минимальная ширина
        if (newWidth < 30) return;
        
        // Определяем индекс колонки
        const cellIndex = this.currentTh.cellIndex;
        
        // Применяем ширину ко всем ячейкам этой колонки
        const rows = this.currentTable.rows;
        for (let i = 0; i < rows.length; i++) {
            const cell = rows[i].cells[cellIndex];
            if (cell) {
                cell.style.width = newWidth + 'px';
                cell.style.minWidth = newWidth + 'px';
                cell.style.maxWidth = newWidth + 'px';
            }
        }
    }

    private static onMouseUp = (e: MouseEvent): void => {
        if (this.resizing) {
            this.resizing = false;
            this.currentTh = null;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        }
    }

    public static cleanup(): void {
        // Удаляем все добавленные ресайзеры
        this.resizeHandles.forEach(handle => handle.remove());
        this.resizeHandles = [];
        
        // Удаляем глобальные обработчики
        document.removeEventListener('mousemove', this.onMouseMove);
        document.removeEventListener('mouseup', this.onMouseUp);
        
        // Сбрасываем состояние
        this.resizing = false;
        this.currentTh = null;
        this.currentTable = null;
    }
}