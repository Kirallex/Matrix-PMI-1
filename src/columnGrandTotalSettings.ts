import { VisualSettings } from "./settings";

export function applyColumnGrandTotalSettings(container: HTMLElement, settings: VisualSettings): void {
    const table = container.querySelector('table');
    if (!table) return;
    const grandTotalSettings = settings.columnGrandTotal?.columnGrandTotalGroup;
    if (!grandTotalSettings) return;

    // 1. Ячейки данных тоталов в строках midRow и totalRow (td.totalColumn)
    const dataTotalCells = table.querySelectorAll('tbody tr.midRow td.totalColumn, tbody tr.totalRow td.totalColumn');
    if (dataTotalCells.length === 0) return;

    const fontFamily = grandTotalSettings.font.fontFamily.value;
    const fontSize = grandTotalSettings.font.fontSize.value;
    const isBold = grandTotalSettings.font.bold.value;
    const isItalic = grandTotalSettings.font.italic.value;
    const isUnderline = grandTotalSettings.font.underline.value;
    const applyToLabels = grandTotalSettings.applyToLabels.value;
    const textColor = grandTotalSettings.textColor.value.value;
    const bgColor = grandTotalSettings.backgroundColor.value.value;

    // Применяем к ячейкам данных
    dataTotalCells.forEach(cell => {
        const htmlCell = cell as HTMLElement;
        htmlCell.style.setProperty('font-family', fontFamily, 'important');
        htmlCell.style.setProperty('font-size', fontSize + 'px', 'important');
        htmlCell.style.setProperty('font-weight', isBold ? 'bold' : 'normal', 'important');
        htmlCell.style.setProperty('font-style', isItalic ? 'italic' : 'normal', 'important');
        htmlCell.style.setProperty('text-decoration', isUnderline ? 'underline' : 'none', 'important');
        htmlCell.style.setProperty('color', textColor, 'important');
        htmlCell.style.setProperty('background-color', bgColor, 'important');
    });

    // 2. Если applyToLabels истинно, применяем к заголовкам колоночных тоталов (th.totalColumn в thead)
    if (applyToLabels) {
        const labelTotalCells = table.querySelectorAll('thead tr.topRow th.totalColumn');
        labelTotalCells.forEach(cell => {
            const htmlCell = cell as HTMLElement;
            htmlCell.style.setProperty('font-family', fontFamily, 'important');
            htmlCell.style.setProperty('font-size', fontSize + 'px', 'important');
            htmlCell.style.setProperty('font-weight', isBold ? 'bold' : 'normal', 'important');
            htmlCell.style.setProperty('font-style', isItalic ? 'italic' : 'normal', 'important');
            htmlCell.style.setProperty('text-decoration', isUnderline ? 'underline' : 'none', 'important');
            htmlCell.style.setProperty('color', textColor, 'important');
            htmlCell.style.setProperty('background-color', bgColor, 'important');
        });
    }
}