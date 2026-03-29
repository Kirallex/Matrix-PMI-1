export function applySpecificColumnSettings(
    container: HTMLElement,
    settings: {
        textColor: string;
        backgroundColor: string;
        alignment: string;
        applyToHeader: boolean;
        applyToTotal: boolean;
        applyToValues: boolean;
    },
    measureKey: string
): void {
    const table = container.querySelector('table');
    if (!table) return;

    const measureIndexMatch = measureKey.match(/measure(\d+)/);
    if (!measureIndexMatch) return;

    const measureIndex = parseInt(measureIndexMatch[1], 10);

    const headerRow = table.querySelector('thead tr:last-child');
    if (!headerRow) return;

    const measureCells = headerRow.querySelectorAll('th');

    let columnIndex = -1;
    for (let i = 1; i < measureCells.length; i++) {
        if (i - 1 === measureIndex) {
            columnIndex = i;
            break;
        }
    }

    if (columnIndex === -1) return;

    const applyStyles = (cellElement: HTMLElement) => {
        cellElement.style.setProperty('color', settings.textColor, 'important');
        cellElement.style.setProperty('background-color', settings.backgroundColor, 'important');
        cellElement.style.setProperty('text-align', settings.alignment, 'important');
    };

    if (settings.applyToHeader && columnIndex < measureCells.length) {
        applyStyles(measureCells[columnIndex] as HTMLElement);
    }

    if (settings.applyToTotal) {
        const totalRow = table.querySelector('tbody tr.totalRow[data-level="0"]');
        if (totalRow && (totalRow as HTMLTableRowElement).cells[columnIndex]) {
            applyStyles((totalRow as HTMLTableRowElement).cells[columnIndex] as HTMLElement);
        }
    }

    if (settings.applyToValues) {
        const dataRows = table.querySelectorAll('tbody tr.midRow');
        dataRows.forEach(row => {
            const tr = row as HTMLTableRowElement;
            if (tr.cells[columnIndex]) {
                applyStyles(tr.cells[columnIndex] as HTMLElement);
            }
        });
    }
}