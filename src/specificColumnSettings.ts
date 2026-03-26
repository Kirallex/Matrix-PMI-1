import { VisualSettings } from "./settings";

export function applySpecificColumnSettings(
    container: HTMLElement,
    settings: VisualSettings
): void {
    const table = container.querySelector('table');
    if (!table) return;
    const specific = settings.specificColumn;
    if (!specific) return;

    const applyGroup = specific.applyGroup;
    const valuesGroup = specific.valuesGroup;

    const selectedMeasure = applyGroup.measuresGroup.value;
    if (!selectedMeasure) return;

    const applyToHeader = applyGroup.applyToHeader.value;
    const applyToTotal = applyGroup.applyToTotal.value;
    const applyToValues = applyGroup.applyToValues.value;

    const textColor = valuesGroup.textColor.value.value;
    const bgColor = valuesGroup.backgroundColor.value.value;
    const alignment = valuesGroup.alignment.value;

    // Получаем индекс выбранной меры из фиксированного значения (measure0, measure1...)
    const selectedValue = selectedMeasure.value;
    if (typeof selectedValue !== 'string') return;
    const measureIndexMatch = selectedValue.match(/measure(\d+)/);
    if (!measureIndexMatch) return;
    const measureIndex = parseInt(measureIndexMatch[1], 10);

    const headerRow = table.querySelector('thead tr:last-child');
    if (!headerRow) return;

    const measureCells = headerRow.querySelectorAll('th');
    // Ищем колонку по порядковому индексу (первая колонка с индексом 0 – row header)
    let columnIndex = -1;
    for (let i = 1; i < measureCells.length; i++) {
        if (i - 1 === measureIndex) {
            columnIndex = i;
            break;
        }
    }
    if (columnIndex === -1) return;

    const applyStyles = (cellElement: HTMLElement) => {
        cellElement.style.setProperty('color', textColor, 'important');
        cellElement.style.setProperty('background-color', bgColor, 'important');
        cellElement.style.setProperty('text-align', alignment, 'important');
    };

    if (applyToHeader && columnIndex < measureCells.length) {
        applyStyles(measureCells[columnIndex] as HTMLElement);
    }

    if (applyToTotal) {
        const totalRow = table.querySelector('tbody tr.totalRow[data-level="0"]');
        if (totalRow && (totalRow as HTMLTableRowElement).cells[columnIndex]) {
            applyStyles((totalRow as HTMLTableRowElement).cells[columnIndex] as HTMLElement);
        }
    }

    if (applyToValues) {
        const dataRows = table.querySelectorAll('tbody tr.midRow');
        dataRows.forEach(row => {
            const tr = row as HTMLTableRowElement;
            if (tr.cells[columnIndex]) {
                applyStyles(tr.cells[columnIndex] as HTMLElement);
            }
        });
    }
}