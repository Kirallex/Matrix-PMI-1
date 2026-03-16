import { VisualSettings } from "./settings";

export function applyGridSettings(container: HTMLElement, settings: VisualSettings): void {
    const table = container.querySelector('table');
    if (!table) return;
    const grid = settings.grid;

    const rows = table.rows;
    const totalRows = rows.length;
    if (totalRows === 0) return;

    // Глобальный размер шрифта – применяется только к th
    const fontSize = grid.optionsGroup.globalFontSize.value;
    if (fontSize) {
        const baseFontSize = 20; // базовый размер шрифта в CSS
        const baseHeight = 42;    // базовая высота ячеек
        const baseLineHeight = 20; // базовый line-height
        const scale = fontSize / baseFontSize;

        const newHeight = Math.round(baseHeight * scale);
        const newLineHeight = Math.round(baseLineHeight * scale);

        const thElements = table.querySelectorAll('th');
        thElements.forEach((th: HTMLElement) => {
            th.style.fontSize = fontSize + 'px';
            th.style.height = newHeight + 'px';
            th.style.minHeight = newHeight + 'px';
            th.style.maxHeight = newHeight + 'px';
            th.style.lineHeight = newLineHeight + 'px';
        });
    }

    // Сброс всех границ (чтобы не было конфликтов)
    for (let i = 0; i < rows.length; i++) {
        for (let j = 0; j < rows[i].cells.length; j++) {
            const cell = rows[i].cells[j] as HTMLElement;
            cell.style.borderTop = '';
            cell.style.borderBottom = '';
            cell.style.borderLeft = '';
            cell.style.borderRight = '';
            cell.style.boxShadow = '';
        }
    }

    // Горизонтальные линии
    const hColor = grid.horizontalGroup.color.value.value;
    const hWidth = grid.horizontalGroup.width.value;

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowClass = row.className;
        const levelAttr = row.getAttribute('data-level');
        let applyHorizontal = false;

        if (rowClass.includes('midRow')) {
            applyHorizontal = true;
        } else if (rowClass.includes('topRow')) {
            const levelNum = parseInt(levelAttr, 10);
            if (!isNaN(levelNum) && levelNum % 2 === 1) {
                applyHorizontal = true;
            }
        }

        if (applyHorizontal) {
            for (let j = 0; j < row.cells.length; j++) {
                const cell = row.cells[j] as HTMLElement;
                cell.style.borderBottom = `${hWidth}px solid ${hColor}`;
            }
        }
    }

    // Вертикальные линии (всегда)
    const vColor = grid.verticalGroup.color.value.value;
    const vWidth = grid.verticalGroup.width.value;
    for (let i = 0; i < rows.length; i++) {
        for (let j = 0; j < rows[i].cells.length; j++) {
            const cell = rows[i].cells[j] as HTMLElement;
            cell.style.borderRight = `${vWidth}px solid ${vColor}`;
        }
    }

    // Определяем строки заголовков столбцов
    const columnHeaderRows = table.querySelectorAll('tr.topRow');
    const columnHeaderIndices = Array.from(columnHeaderRows).map(tr => {
        for (let i = 0; i < rows.length; i++) {
            if (rows[i] === tr) return i;
        }
        return -1;
    }).filter(i => i >= 0);

    // Собираем уровни заголовков и находим максимальный
    const headerLevels = columnHeaderIndices.map(idx => {
        const levelAttr = rows[idx].getAttribute('data-level');
        return levelAttr ? parseInt(levelAttr, 10) : 0;
    }).filter(level => !isNaN(level));
    const maxHeaderLevel = headerLevels.length ? Math.max(...headerLevels) : 0;

    // Заголовки строк – первый столбец
    const rowHeaderColIndices = [0];

    // Находим первый midRow и totalRow (если есть)
    let firstMidRowIdx = -1;
    let totalRowIdx = -1;
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (row.classList.contains('midRow') && firstMidRowIdx === -1) {
            firstMidRowIdx = i;
        } else if (row.classList.contains('totalRow')) {
            totalRowIdx = i;
        }
    }

    // Применение границ
    const borderColor = grid.borderGroup.color.value.value;
    const borderWidth = grid.borderGroup.width.value;
    const borderSection = grid.borderGroup.section.value.value;
    const posTop = grid.borderGroup.positionTop.value;
    const posBottom = grid.borderGroup.positionBottom.value;
    const posLeft = grid.borderGroup.positionLeft.value;
    const posRight = grid.borderGroup.positionRight.value;

    const applyBorderToCell = (cell: HTMLElement, rowIdx: number, colIdx: number) => {
        const isColumnHeader = columnHeaderIndices.includes(rowIdx);
        const isRowHeader = rowHeaderColIndices.includes(colIdx);
        const isValues = !isColumnHeader && !isRowHeader;

        let apply = false;
        switch (borderSection) {
            case 'all': apply = true; break;
            case 'columnHeader': apply = isColumnHeader; break;
            case 'rowHeader': apply = isRowHeader; break;
            case 'values': apply = isValues; break;
        }

        if (!apply) return;

        // Для columnHeader мы обработаем отдельно после цикла, поэтому здесь ничего не делаем
        if (borderSection === 'columnHeader') {
            return;
        }

        // --- Специальная логика для rowHeader ---
        if (borderSection === 'rowHeader') {
            if (colIdx !== 0) return;
            const row = rows[rowIdx];
            const isMidRow = row.classList.contains('midRow');
            const isTotalRow = row.classList.contains('totalRow');
            if (!isMidRow && !isTotalRow) return;

            if (posLeft) {
                cell.style.borderLeft = `${borderWidth}px solid ${borderColor}`;
            }
            if (posRight) {
                cell.style.borderRight = `${borderWidth}px solid ${borderColor}`;
            }
            if (posTop && isMidRow && rowIdx === firstMidRowIdx) {
                cell.style.borderTop = `${borderWidth}px solid ${borderColor}`;
            }
            if (posBottom && isTotalRow && rowIdx === totalRowIdx) {
                cell.style.borderBottom = `${borderWidth}px solid ${borderColor}`;
            }
            return;
        }

        // --- Специальная логика для values ---
        if (borderSection === 'values') {
            if (cell.tagName !== 'TD') return;

            const row = rows[rowIdx];
            const isMidRow = row.classList.contains('midRow');
            const isTotalRow = row.classList.contains('totalRow');

            if (posLeft && colIdx === 1) {
                cell.style.borderLeft = `${borderWidth}px solid ${borderColor}`;
            }
            if (posRight && colIdx === rows[rowIdx].cells.length - 1) {
                cell.style.borderRight = `${borderWidth}px solid ${borderColor}`;
            }
            if (posTop && isMidRow && rowIdx === firstMidRowIdx) {
                cell.style.borderTop = `${borderWidth}px solid ${borderColor}`;
            }
            if (posBottom && isTotalRow && rowIdx === totalRowIdx) {
                cell.style.borderBottom = `${borderWidth}px solid ${borderColor}`;
            }
            return;
        }

        // --- Обычная логика для all ---
        if (posTop && rowIdx === 0) {
            cell.style.borderTop = `${borderWidth}px solid ${borderColor}`;
        }
        if (posBottom && rowIdx === totalRows - 1) {
            cell.style.borderBottom = `${borderWidth}px solid ${borderColor}`;
        }
        if (posLeft && colIdx === 0) {
            cell.style.borderLeft = `${borderWidth}px solid ${borderColor}`;
        }
        if (posRight && colIdx === rows[rowIdx].cells.length - 1) {
            cell.style.borderRight = `${borderWidth}px solid ${borderColor}`;
        }
    };

    for (let i = 0; i < rows.length; i++) {
        for (let j = 0; j < rows[i].cells.length; j++) {
            applyBorderToCell(rows[i].cells[j] as HTMLElement, i, j);
        }
    }

    // --- Отдельная обработка для columnHeader с использованием псевдоэлемента (без потери sticky) ---
    const thead = table.querySelector('thead');
    if (borderSection === 'columnHeader' && thead) {
        // Сбрасываем границы и тени у всех th внутри thead
        const thInHead = thead.querySelectorAll('th');
        thInHead.forEach(th => {
            th.style.borderLeft = '';
            th.style.borderRight = '';
            th.style.borderTop = '';
            th.style.borderBottom = '';
            th.style.boxShadow = '';
        });

        // Убираем возможный border у самого thead
        thead.style.borderTop = '';
        thead.style.borderRight = '';
        thead.style.borderBottom = '';
        thead.style.borderLeft = '';

        // Создаём или находим контейнер для рамки
        let borderDiv = thead.querySelector('.thead-border');
        if (!borderDiv) {
            borderDiv = document.createElement('div');
            borderDiv.className = 'thead-border';
            thead.appendChild(borderDiv);
        }

        const div = borderDiv as HTMLElement;
        div.style.position = 'absolute';
        div.style.top = '0';
        div.style.left = '0';
        div.style.width = '100%';
        div.style.height = '100%';
        div.style.pointerEvents = 'none'; // чтобы не мешать кликам
        div.style.boxSizing = 'border-box';
        div.style.zIndex = '2000'; // выше, чем у ячеек первого столбца (у них z-index: 1000)

        const shadows: string[] = [];
        if (posTop) shadows.push(`inset 0 ${borderWidth}px 0 ${borderColor}`);
        if (posBottom) shadows.push(`inset 0 -${borderWidth}px 0 ${borderColor}`);
        if (posLeft) shadows.push(`inset ${borderWidth}px 0 0 ${borderColor}`);
        if (posRight) shadows.push(`inset -${borderWidth}px 0 0 ${borderColor}`);

        div.style.boxShadow = shadows.length ? shadows.join(', ') : 'none';
    }

    // Дополнительные границы при выборе 'all'
    if (borderSection === 'all') {
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            if (row.classList.contains('topRow') && row.getAttribute('data-level') === '0') {
                for (let j = 0; j < row.cells.length; j++) {
                    const cell = row.cells[j] as HTMLElement;
                    cell.style.borderBottom = `${borderWidth}px solid ${borderColor}`;
                }
                break;
            }
        }

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            if (row.classList.contains('midRow') || row.classList.contains('totalRow')) {
                if (row.cells.length >= 2) {
                    const firstCell = row.cells[0] as HTMLElement;
                    const secondCell = row.cells[1] as HTMLElement;
                    firstCell.style.borderRight = `${borderWidth}px solid ${borderColor}`;
                    secondCell.style.borderLeft = `${borderWidth}px solid ${borderColor}`;
                }
            }
        }
    }

    // Row padding
    const rowPadding = grid.optionsGroup.rowPadding.value;
    if (rowPadding !== undefined) {
        for (let i = 0; i < rows.length; i++) {
            for (let j = 0; j < rows[i].cells.length; j++) {
                const cell = rows[i].cells[j] as HTMLElement;
                cell.style.paddingTop = rowPadding + 'px';
                cell.style.paddingBottom = rowPadding + 'px';
            }
        }
    }
}