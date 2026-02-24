"use strict";
import "./../style/excelDownloadModal.css"

export class ExcelDownloader {
    /**
     * Конструктор больше не требует host и dataView, так как экспорт идёт из готовой HTML-таблицы.
     * Оставлен для обратной совместимости.
     */
    constructor() {}

    /**
     * Публичный метод для экспорта HTML-таблицы в CSV.
     * Вызывается из visual.ts после применения всех настроек (hideEmptyCols, subTotals).
     * @param table - DOM-элемент таблицы (HTMLElement)
     */
    public exportTable(table: HTMLElement): void {
        this.exportToCSV(table);
    }

    /**
     * Экспорт таблицы в CSV (прежняя реализация)
     * @param table - HTML-таблица
     */
    private exportToCSV(table: HTMLElement): void {
        const rows = table.querySelectorAll('tr');
        let csv = '';
        
        for (let i = 0; i < rows.length; i++) {
            const cols = rows[i].querySelectorAll('td, th');
            const row: string[] = [];
            
            for (let j = 0; j < cols.length; j++) {
                let text = cols[j].textContent?.trim() || '';
                text = text.replace(/"/g, '""');
                if (text.includes(',') || text.includes('"') || text.includes('\n')) {
                    text = `"${text}"`;
                }
                row.push(text);
            }
            
            csv += row.join(',') + '\n';
        }

        const bom = '\uFEFF';
        const csvData = bom + csv;
        
        const blob = new Blob([csvData], { 
            type: 'text/csv;charset=utf-8' 
        });
        
        const blobUrl = URL.createObjectURL(blob);
        
        this.showDownloadModal(blobUrl);
    }

    /**
     * Показывает модальное окно для скачивания (без изменений)
     */
    private showDownloadModal(blobUrl: string): void {
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

    /**
     * Копирование ссылки в буфер обмена (без изменений)
     */
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