"use strict";
import "./../style/excelDownloadModal.css"

export class ExcelDownloader {
    constructor() {}

    /**
     * Публичный метод для экспорта HTML-таблицы в CSV.
     * @param table - DOM-элемент таблицы (HTMLElement)
     */
    public exportTable(table: HTMLElement): void {
        this.exportToCSV(table);
    }

    private exportToCSV(table: HTMLElement): void {
        const tbody = table.querySelector('tbody');
        if (!tbody) return;

        const rows = tbody.querySelectorAll('tr');
        if (rows.length === 0) return;

        // 1. Определяем максимальный уровень иерархии строк
        let maxLevel = 0;
        rows.forEach(row => {
            const levelAttr = row.getAttribute('data-level');
            if (levelAttr) {
                const level = parseInt(levelAttr, 10);
                if (!isNaN(level) && level > maxLevel) {
                    maxLevel = level;
                }
            }
        });
        const headerColsCount = maxLevel + 1; // столбцов для заголовков строк

        // 2. Получаем заголовки из thead с учётом дополнительных столбцов
        const theadRows = table.querySelectorAll('thead tr');
        const csvRows: string[][] = [];

        theadRows.forEach(tr => {
            const cells: string[] = [];
            const ths = tr.querySelectorAll('th');
            // Первый th – это rowsHeader (Year или ProductName)
            if (ths.length > 0) {
                cells.push(this.extractCellText(ths[0] as HTMLElement));
                // Добавляем пустые ячейки для дополнительных уровней строк
                for (let i = 0; i < headerColsCount - 1; i++) {
                    cells.push('');
                }
                // Остальные th – заголовки мер
                for (let i = 1; i < ths.length; i++) {
                    cells.push(this.extractCellText(ths[i] as HTMLElement));
                }
            }
            csvRows.push(cells);
        });

        // 3. Обрабатываем строки данных из tbody
        rows.forEach(row => {
            const levelAttr = row.getAttribute('data-level');
            const level = levelAttr ? parseInt(levelAttr, 10) : 0;

            // Получаем текст заголовка строки (из span.row-header-text)
            const headerCell = row.querySelector('th.formatRowNodes');
            let headerText = '';
            if (headerCell) {
                const textSpan = headerCell.querySelector('.row-header-text');
                if (textSpan) {
                    headerText = textSpan.textContent || '';
                } else {
                    // fallback: удаляем иконки и неразрывные пробелы
                    headerText = (headerCell.textContent || '').replace(/[\u00A0]/g, ' ').trim();
                }
            }

            // Очищаем пробелы в числовых заголовках
            if (this.isNumeric(headerText)) {
                headerText = headerText.replace(/[\s\u00A0]/g, '');
            }

            // Формируем массив для заголовочных столбцов
            const headerCols: string[] = new Array(headerColsCount).fill('');
            headerCols[level] = headerText;

            // Собираем данные из td
            const dataCells: string[] = [];
            const tds = row.querySelectorAll('td');
            tds.forEach(td => {
                let text = (td.textContent || '').replace(/[\r\n]+/g, ' ');
                if (this.isNumeric(text)) {
                    text = text.replace(/[\s\u00A0]/g, '');
                }
                dataCells.push(text);
            });

            // Объединяем
            const fullRow = headerCols.concat(dataCells);
            csvRows.push(fullRow);
        });

        // 4. Преобразуем в CSV
        let csv = '';
        csvRows.forEach(row => {
            const escapedRow = row.map(cell => {
                let text = cell || '';
                // Экранируем кавычки
                text = text.replace(/"/g, '""');
                // Если есть запятая, кавычки или точка с запятой – оборачиваем
                if (text.includes(',') || text.includes('"') || text.includes(';')) {
                    text = `"${text}"`;
                }
                return text;
            });
            csv += escapedRow.join('~') + '\n';
        });

        const bom = '\uFEFF';
        const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8' });
        const blobUrl = URL.createObjectURL(blob);
        this.showDownloadModal(blobUrl, rows.length);
    }

    /**
     * Проверяет, является ли текст числовым значением.
     */
    private isNumeric(text: string): boolean {
        let cleaned = text.replace(/[\s\u00A0]/g, '');
        if (cleaned === '') return false;
        let normalized = cleaned.replace(',', '.');
        return /^-?\d+(\.\d+)?$/.test(normalized);
    }

    /**
     * Извлекает текст из ячейки, очищая от пробелов, если это число.
     */
    private extractCellText(cell: HTMLElement): string {
        let text = (cell.textContent || '').replace(/[\r\n]+/g, ' ');
        if (this.isNumeric(text)) {
            text = text.replace(/[\s\u00A0]/g, '');
        }
        return text;
    }

    private showDownloadModal(blobUrl: string, cntRows: Number): void {
        const modal = document.createElement('div');
        modal.className = 'excel-download-modal';

        const modalContent = document.createElement('div');
        modalContent.className = 'excel-download-modal-content';

        const title = document.createElement('h3');
        title.textContent = 'Скачать CSV файл';
        title.className = 'excel-download-modal-title';
        modalContent.appendChild(title);

        const instruction = document.createElement('p');
        instruction.textContent = 'Скопируйте ссылку ниже, вставьте в отдельную вкладку браузера и нажмите Enter';
        instruction.className = 'excel-download-modal-instruction';
        modalContent.appendChild(instruction);

        const numberOfRowsToDownload = document.createElement('p');
        numberOfRowsToDownload.textContent = `Количество строк для скачивания: ${cntRows}`;
        numberOfRowsToDownload.className = 'excel-download-modal-count-rows';
        modalContent.appendChild(numberOfRowsToDownload);

        const linkContainer = document.createElement('div');
        linkContainer.className = 'excel-download-modal-link-container';

        const linkInput = document.createElement('input');
        linkInput.type = 'text';
        linkInput.value = blobUrl;
        linkInput.readOnly = true;
        linkInput.className = 'excel-download-modal-link-input';

        linkInput.addEventListener('focus', () => {
            linkInput.select();
        });

        const copyButton = document.createElement('button');
        copyButton.textContent = 'Копировать';
        copyButton.className = 'excel-download-modal-copy-button';

        copyButton.onclick = () => {
            this.copyToClipboard(blobUrl, copyButton);
        };

        linkContainer.appendChild(linkInput);
        linkContainer.appendChild(copyButton);
        modalContent.appendChild(linkContainer);

        const closeButton = document.createElement('button');
        closeButton.textContent = 'Закрыть';
        closeButton.className = 'excel-download-modal-close-button';

        closeButton.onclick = () => {
            URL.revokeObjectURL(blobUrl);
            document.body.removeChild(modal);
        };

        modalContent.appendChild(closeButton);
        modal.appendChild(modalContent);

        modal.onclick = (e) => {
            if (e.target === modal) {
                URL.revokeObjectURL(blobUrl);
                document.body.removeChild(modal);
            }
        };

        document.body.appendChild(modal);

        setTimeout(() => {
            linkInput.select();
        }, 100);
    }

    private copyToClipboard(text: string, button: HTMLButtonElement): void {
        const originalText = button.textContent;

        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();

        try {
            const successful = document.execCommand('copy');
            if (successful) {
                button.textContent = 'Скопировано!';
                button.classList.add('copied');
            } else {
                button.textContent = 'Ошибка';
                button.classList.add('error');
            }
        } catch (err) {
            button.textContent = 'Ошибка';
            button.classList.add('error');
        }

        document.body.removeChild(textArea);

        setTimeout(() => {
            button.textContent = originalText;
            button.classList.remove('copied', 'error');
        }, 2000);
    }
}