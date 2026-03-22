import { VisualSettings } from "./settings";

export function applyRowHeadersSettings(container: HTMLElement, settings: VisualSettings): void {
    const table = container.querySelector('table');
    if (!table) return;
    const rowHeaders = settings.rowHeaders?.rowHeadersGroup;
    if (!rowHeaders) return;

    const rowHeaderCells = table.querySelectorAll('tbody tr.midRow th.formatRowNodes, tbody tr.totalRow th.formatRowNodes');
    if (rowHeaderCells.length === 0) return;

    // Шрифтовые настройки
    const fontFamily = rowHeaders.font.fontFamily.value;
    const fontSize = rowHeaders.font.fontSize.value;
    const isBold = rowHeaders.font.bold.value;
    const isItalic = rowHeaders.font.italic.value;
    const isUnderline = rowHeaders.font.underline.value;

    rowHeaderCells.forEach(cell => {
        const htmlCell = cell as HTMLElement;
        htmlCell.style.setProperty('font-family', fontFamily, 'important');
        htmlCell.style.setProperty('font-size', fontSize + 'px', 'important');
        htmlCell.style.setProperty('font-weight', isBold ? 'bold' : 'normal', 'important');
        htmlCell.style.setProperty('font-style', isItalic ? 'italic' : 'normal', 'important');
        htmlCell.style.setProperty('text-decoration', isUnderline ? 'underline' : 'none', 'important');
    });

    // Цвета
    const textColor = rowHeaders.textColor.value.value;
    const bgColor = rowHeaders.backgroundColor.value.value;
    rowHeaderCells.forEach(cell => {
        const htmlCell = cell as HTMLElement;
        htmlCell.style.setProperty('color', textColor, 'important');
        htmlCell.style.setProperty('background-color', bgColor, 'important');
    });

    // Выравнивание текста – применяем к внутреннему span .row-header-text
    const alignment = rowHeaders.textAlignment.value; // "left", "center", "right"
    rowHeaderCells.forEach(cell => {
        const textSpan = cell.querySelector('.row-header-text') as HTMLElement;
        if (textSpan) {
            textSpan.style.setProperty('text-align', alignment, 'important');
        }
    });
}