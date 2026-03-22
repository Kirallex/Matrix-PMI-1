import { VisualSettings } from "./settings";

export function applyRowGrandTotalSettings(container: HTMLElement, settings: VisualSettings): void {
    const table = container.querySelector('table');
    if (!table) return;
    const grandTotalSettings = settings.rowGrandTotal?.rowGrandTotalGroup;
    if (!grandTotalSettings) return;

    // Находим строку гранд-тотала (общий итог) – последняя строка с классом totalRow
    const grandTotalRow = table.querySelector('tbody tr.totalRow[data-level="0"]');
    if (!grandTotalRow) return;

    // Все ячейки данных (td) в этой строке
    const dataCells = grandTotalRow.querySelectorAll('td');
    if (dataCells.length === 0) return;

    const fontFamily = grandTotalSettings.font.fontFamily.value;
    const fontSize = grandTotalSettings.font.fontSize.value;
    const isBold = grandTotalSettings.font.bold.value;
    const isItalic = grandTotalSettings.font.italic.value;
    const isUnderline = grandTotalSettings.font.underline.value;
    const applyToLabels = grandTotalSettings.applyToLabels.value;
    const textColor = grandTotalSettings.textColor.value.value;
    const bgColor = grandTotalSettings.backgroundColor.value.value;

    // Применяем к ячейкам данных
    dataCells.forEach(cell => {
        const htmlCell = cell as HTMLElement;
        htmlCell.style.setProperty('font-family', fontFamily, 'important');
        htmlCell.style.setProperty('font-size', fontSize + 'px', 'important');
        htmlCell.style.setProperty('font-weight', isBold ? 'bold' : 'normal', 'important');
        htmlCell.style.setProperty('font-style', isItalic ? 'italic' : 'normal', 'important');
        htmlCell.style.setProperty('text-decoration', isUnderline ? 'underline' : 'none', 'important');
        htmlCell.style.setProperty('color', textColor, 'important');
        htmlCell.style.setProperty('background-color', bgColor, 'important');
    });

    // Если applyToLabels включено, применяем к заголовку строки (th.formatRowNodes в этой же строке)
    if (applyToLabels) {
        const labelCell = grandTotalRow.querySelector('th.formatRowNodes');
        if (labelCell) {
            const htmlCell = labelCell as HTMLElement;
            htmlCell.style.setProperty('font-family', fontFamily, 'important');
            htmlCell.style.setProperty('font-size', fontSize + 'px', 'important');
            htmlCell.style.setProperty('font-weight', isBold ? 'bold' : 'normal', 'important');
            htmlCell.style.setProperty('font-style', isItalic ? 'italic' : 'normal', 'important');
            htmlCell.style.setProperty('text-decoration', isUnderline ? 'underline' : 'none', 'important');
            htmlCell.style.setProperty('color', textColor, 'important');
            htmlCell.style.setProperty('background-color', bgColor, 'important');
        }
    }
}