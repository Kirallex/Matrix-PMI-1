// drillManager.ts
import powerbi from "powerbi-visuals-api";
import DataViewMatrixNode = powerbi.DataViewMatrixNode;
import { MatrixDataviewHtmlFormatter } from "./matrixDataViewHtmlFormatter";

export class DrillManager {
    private host: powerbi.extensibility.visual.IVisualHost;
    private currentDataView: powerbi.DataView | null = null;
    private renderCallback: () => void; // функция перерисовки визуала
    private target: HTMLElement;        // контейнер для панели инструментов

    // Состояние
    private drillMode: boolean = false;
    private currentRoot: DataViewMatrixNode | null = null;
    private drillStack: DataViewMatrixNode[] = [];
    private selectedRowPath: string | null = null;
    private expandedNodes: Set<string>; // ссылка на набор раскрытых узлов (из visual.ts)

    // DOM-элементы панели
    private toolbar: HTMLDivElement | null = null;

    constructor(
        host: powerbi.extensibility.visual.IVisualHost,
        target: HTMLElement,
        renderCallback: () => void,
        expandedNodes: Set<string>
    ) {
        this.host = host;
        this.target = target;
        this.renderCallback = renderCallback;
        this.expandedNodes = expandedNodes;
        this.createToolbar();
    }

    // Инициализация при получении новых данных
    public setDataView(dataView: powerbi.DataView): void {
        this.currentDataView = dataView;
        // Сбрасываем состояние, кроме expandedNodes (они управляются из visual.ts)
        if (!this.currentRoot) {
            this.currentRoot = dataView?.matrix?.rows?.root || null;
        }
        this.drillStack = [];
        this.selectedRowPath = null;
        this.updateToolbarState();
    }

    // Сброс при смене данных (Create)
    public reset(): void {
        this.currentRoot = this.currentDataView?.matrix?.rows?.root || null;
        this.drillStack = [];
        this.selectedRowPath = null;
        this.drillMode = false;
        this.updateToolbarState();
    }

    // Возвращает текущий корневой узел для отображения
    public getCurrentRoot(): DataViewMatrixNode | null {
        return this.currentRoot;
    }

    // Возвращает выбранный путь (для выделения строки)
    public getSelectedRowPath(): string | null {
        return this.selectedRowPath;
    }

    // Применяет выделение к новому DOM после перерисовки
    public applyRowHighlight(container: HTMLElement): void {
        if (!this.selectedRowPath) return;
        const selectedHeader = container.querySelector(`th.formatRowNodes .expandCollapseButton[data-path="${this.selectedRowPath}"]`)?.closest('th.formatRowNodes');
        if (selectedHeader) {
            selectedHeader.classList.add('selected');
        }
    }

    // Обработчик клика на заголовок строки (должен вызываться из visual.ts)
    public onRowHeaderClick(event: Event): void {
        const target = event.target as HTMLElement;
        if (target.closest('.expandCollapseButton')) return;
        const th = target.closest('th.formatRowNodes');
        if (!th) return;

        const expandBtn = th.querySelector('.expandCollapseButton');
        const path = expandBtn?.getAttribute('data-path') || null;

        if (this.drillMode) {
            // В режиме drill – детализируем по выбранной строке
            if (path) {
                this.selectedRowPath = path;
                this.drillDownSingle();
            }
        } else {
            // Иначе – просто выделяем строку (без детализации)
            // Снимаем выделение со всех
            document.querySelectorAll('tbody th.formatRowNodes').forEach(header => header.classList.remove('selected'));
            th.classList.add('selected');
            this.selectedRowPath = path;
        }
    }

    // --- Кнопки панели ---
    private createToolbar(): void {
        this.toolbar = document.createElement('div');
        this.toolbar.className = 'drilldown-toolbar';

        const toggleBtn = document.createElement('button');
        toggleBtn.textContent = '🔘 Drill mode';
        toggleBtn.title = 'Вкл/выкл режим детализации';
        toggleBtn.addEventListener('click', () => this.toggleDrillMode(toggleBtn));

        const upBtn = document.createElement('button');
        upBtn.textContent = '⬆ Up';
        upBtn.title = 'Вернуться на уровень выше';
        upBtn.addEventListener('click', () => this.drillUp());

        const downBtn = document.createElement('button');
        downBtn.textContent = '⬇ Down';
        downBtn.title = 'Детализировать выбранную строку';
        downBtn.addEventListener('click', () => this.drillDownSingle());

        const groupedBtn = document.createElement('button');
        groupedBtn.textContent = '⤵ Grouped';
        groupedBtn.title = 'Раскрыть все строки на один уровень';
        groupedBtn.addEventListener('click', () => this.drillDownGrouped());

        this.toolbar.appendChild(toggleBtn);
        this.toolbar.appendChild(upBtn);
        this.toolbar.appendChild(downBtn);
        this.toolbar.appendChild(groupedBtn);
        this.target.appendChild(this.toolbar);
    }

    private toggleDrillMode(btn: HTMLButtonElement): void {
        this.drillMode = !this.drillMode;
        btn.classList.toggle('active', this.drillMode);
    }

    private updateToolbarState(): void {
        // Можно обновить активность кнопок, например, disabled если нельзя up
        const upBtn = this.toolbar?.children[1] as HTMLButtonElement;
        if (upBtn) upBtn.disabled = this.drillStack.length === 0;
    }

    private drillUp(): void {
        if (this.drillStack.length === 0) return;
        this.currentRoot = this.drillStack.pop()!;
        this.expandedNodes.clear(); // сбрасываем ручные раскрытия
        this.selectedRowPath = null;
        this.updateToolbarState();
        this.renderCallback();
    }

    private drillDownSingle(): void {
        if (!this.selectedRowPath) return;
        const root = this.currentRoot || this.currentDataView?.matrix?.rows?.root;
        if (!root) return;
        const targetNode = this.findNodeByPath(root, this.selectedRowPath);
        if (targetNode && targetNode.children && targetNode.children.length > 0) {
            this.drillStack.push(root);
            this.currentRoot = targetNode;
            this.expandedNodes.clear();
            this.selectedRowPath = null;
            this.updateToolbarState();
            this.renderCallback();
        }
    }

    private drillDownGrouped(): void {
        const root = this.currentRoot || this.currentDataView?.matrix?.rows?.root;
        if (!root) return;
        const newExpanded = new Set<string>();
        const addChildrenPaths = (node: DataViewMatrixNode, currentPath: string) => {
            if (node.children && node.children.length > 0) {
                node.children.forEach(child => {
                    const childPath = currentPath ? `${currentPath}-${child.value}` : `${child.value}`;
                    newExpanded.add(childPath);
                    addChildrenPaths(child, childPath);
                });
            }
        };
        addChildrenPaths(root, '');
        newExpanded.forEach(path => this.expandedNodes.add(path));
        this.renderCallback();
    }

    private findNodeByPath(node: DataViewMatrixNode, path: string): DataViewMatrixNode | null {
        if (!node) return null;
        const currentPath = node.levelSourceIndex !== undefined ? node.levelSourceIndex.toString() : node.value?.toString();
        if (currentPath === path) return node;
        if (node.children) {
            for (const child of node.children) {
                const found = this.findNodeByPath(child, path);
                if (found) return found;
            }
        }
        return null;
    }
}