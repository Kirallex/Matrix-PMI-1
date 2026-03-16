import { VisualSettings } from "./settings";

export function applyGridSettings(container: HTMLElement, settings: VisualSettings): void {
    const table = container.querySelector('table');
    if (!table) return;
    const grid = settings.grid;

    // Глобальный размер шрифта
    const fontSize = grid.optionsGroup.globalFontSize.value;
    if (fontSize) {
        container.style.fontSize = fontSize + 'px';
    }

    const rows = table.rows;
    const totalRows = rows.length;
    if (totalRows === 0) return;

    // Сброс всех границ (чтобы не было конфликтов)
    for (let i = 0; i < rows.length; i++) {
        for (let j = 0; j < rows[i].cells.length; j++) {
            const cell = rows[i].cells[j] as HTMLElement;
            cell.style.borderTop = '';
            cell.style.borderBottom = '';
            cell.style.borderLeft = '';
            cell.style.borderRight = '';
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
    });
    const maxHeaderLevel = Math.max(...headerLevels);

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

        // --- Специальная логика для columnHeader ---
        if (borderSection === 'columnHeader') {
            // Левая граница для первого столбца
            if (posLeft && colIdx === 0) {
                cell.style.borderLeft = `${borderWidth}px solid ${borderColor}`;
            }
            // Правая граница для последнего столбца
            if (posRight && colIdx === rows[rowIdx].cells.length - 1) {
                cell.style.borderRight = `${borderWidth}px solid ${borderColor}`;
            }

            const levelAttr = rows[rowIdx].getAttribute('data-level');
            const level = levelAttr ? parseInt(levelAttr, 10) : 0;

            // Нижняя граница для строки с data-level = 0
            if (posBottom && level === 0) {
                cell.style.borderBottom = `${borderWidth}px solid ${borderColor}`;
            }
            // Верхняя граница для строки с data-level = max
            if (posTop && level === maxHeaderLevel) {
                cell.style.borderTop = `${borderWidth}px solid ${borderColor}`;
            }
            return;
        }

        // --- Специальная логика для rowHeader ---
        if (borderSection === 'rowHeader') {
            // Применяем только к первому столбцу (заголовки строк) и только к midRow или totalRow
            if (colIdx !== 0) return;
            const row = rows[rowIdx];
            const isMidRow = row.classList.contains('midRow');
            const isTotalRow = row.classList.contains('totalRow');
            if (!isMidRow && !isTotalRow) return; // не применяем к topRow

            // Левая граница (внешняя)
            if (posLeft) {
                cell.style.borderLeft = `${borderWidth}px solid ${borderColor}`;
            }
            // Правая граница (отделяет заголовки от данных)
            if (posRight) {
                cell.style.borderRight = `${borderWidth}px solid ${borderColor}`;
            }

            // Верхняя граница для самой первой строки midRow
            if (posTop && isMidRow && rowIdx === firstMidRowIdx) {
                cell.style.borderTop = `${borderWidth}px solid ${borderColor}`;
            }
            // Нижняя граница для totalRow (если есть)
            if (posBottom && isTotalRow && rowIdx === totalRowIdx) {
                cell.style.borderBottom = `${borderWidth}px solid ${borderColor}`;
            }
            return;
        }

        // --- Специальная логика для values ---
        if (borderSection === 'values') {
            // Применяем только к ячейкам данных (td)
            if (cell.tagName !== 'TD') return;

            const row = rows[rowIdx];
            const isMidRow = row.classList.contains('midRow');
            const isTotalRow = row.classList.contains('totalRow');

            // Левая граница для первого столбца данных (colIdx === 1)
            if (posLeft && colIdx === 1) {
                cell.style.borderLeft = `${borderWidth}px solid ${borderColor}`;
            }
            // Правая граница для последнего столбца данных
            if (posRight && colIdx === rows[rowIdx].cells.length - 1) {
                cell.style.borderRight = `${borderWidth}px solid ${borderColor}`;
            }

            // Верхняя граница для всех td первой строки midRow
            if (posTop && isMidRow && rowIdx === firstMidRowIdx) {
                cell.style.borderTop = `${borderWidth}px solid ${borderColor}`;
            }

            // Нижняя граница для всех td в totalRow
            if (posBottom && isTotalRow && rowIdx === totalRowIdx) {
                cell.style.borderBottom = `${borderWidth}px solid ${borderColor}`;
            }
            return;
        }

        // --- Обычная логика для all (и для values, если бы мы не перехватили) ---
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

    // Дополнительные границы при выборе 'all'
    if (borderSection === 'all') {
        // 1. Нижняя граница для topRow с data-level="0"
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

        // 2. Вертикальная граница между первым и вторым столбцом для midRow и totalRow
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