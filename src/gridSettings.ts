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

    // Горизонтальные линии (всегда)
    const hColor = grid.horizontalGroup.color.value.value;
    const hWidth = grid.horizontalGroup.width.value;
    for (let i = 0; i < rows.length; i++) {
        for (let j = 0; j < rows[i].cells.length; j++) {
            const cell = rows[i].cells[j] as HTMLElement;
            cell.style.borderBottom = `${hWidth}px solid ${hColor}`;
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

    // Заголовки строк – первый столбец
    const rowHeaderColIndices = [0];

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

        if (apply) {
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
        }
    };

    for (let i = 0; i < rows.length; i++) {
        for (let j = 0; j < rows[i].cells.length; j++) {
            applyBorderToCell(rows[i].cells[j] as HTMLElement, i, j);
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