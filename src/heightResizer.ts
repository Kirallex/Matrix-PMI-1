// heightResizer.ts
export class HeightResizer {
    private static resizing: boolean = false;
    private static container: HTMLElement | null = null;
    private static handle: HTMLElement | null = null;
    private static startY: number = 0;
    private static startHeight: number = 0;
    private static minHeight: number = 100;

    public static init(container: HTMLElement): void {
        this.cleanup();
        this.container = container;

        // Убедимся, что контейнер позиционирован относительно
        if (getComputedStyle(container).position === 'static') {
            container.style.position = 'relative';
        }

        // Создаём ручку
        this.handle = document.createElement('div');
        this.handle.style.cssText = `
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 8px;
            cursor: ns-resize;
            background-color: transparent; /* замените на rgba(255,0,0,0.3) для отладки */
            z-index: 1000; /* поднимаем повыше */
            pointer-events: auto;
        `;
        container.appendChild(this.handle);

        console.log('HeightResizer: handle created', this.handle);

        this.handle.addEventListener('mousedown', this.onMouseDown);
        document.addEventListener('mousemove', this.onMouseMove);
        document.addEventListener('mouseup', this.onMouseUp);
    }

    private static onMouseDown = (e: MouseEvent): void => {
        e.preventDefault();
        if (!this.container) return;
        this.resizing = true;
        this.startY = e.clientY;
        this.startHeight = this.container.offsetHeight;
        document.body.style.cursor = 'ns-resize';
        document.body.style.userSelect = 'none';
        console.log('HeightResizer: mousedown', this.startY, this.startHeight);
    };

    private static onMouseMove = (e: MouseEvent): void => {
        if (!this.resizing || !this.container) return;
        const diff = e.clientY - this.startY;
        const newHeight = Math.max(this.minHeight, this.startHeight + diff);
        this.container.style.height = newHeight + 'px';
        console.log('HeightResizer: mousemove', newHeight);
    };

    private static onMouseUp = (e: MouseEvent): void => {
        if (this.resizing) {
            this.resizing = false;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            console.log('HeightResizer: mouseup');
        }
    };

    public static cleanup(): void {
        if (this.handle) {
            this.handle.removeEventListener('mousedown', this.onMouseDown);
            this.handle.remove();
            this.handle = null;
        }
        document.removeEventListener('mousemove', this.onMouseMove);
        document.removeEventListener('mouseup', this.onMouseUp);
        this.container = null;
        this.resizing = false;
    }
}