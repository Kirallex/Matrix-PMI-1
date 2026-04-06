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
        const rows = table.querySelectorAll('tr');
        let numOfRows = rows.length;
        let csv = '';
        
        for (let i = 0; i < numOfRows; i++) {
            const cols = rows[i].querySelectorAll('td, th');
            const row: string[] = [];
            
            for (let j = 0; j < cols.length; j++) {
                // Получаем текст ячейки (включая неразрывные пробелы)
                let text = cols[j].textContent || '';
                // Удаляем переносы строк и возврат каретки, заменяя их пробелом
                text = text.replace(/[\r\n]+/g, ' ');
                // Экранируем двойные кавычки
                text = text.replace(/"/g, '""');
                // Оборачиваем в кавычки, если есть запятая или кавычки (переносов уже нет)
                if (text.includes(',') || text.includes('"')) {
                    text = `"${text}"`;
                }
                row.push(text);
            }
            
            csv += row.join('~') + '\n';
        }

        const bom = '\uFEFF';
        const csvData = bom + csv;
        
        const blob = new Blob([csvData], { 
            type: 'text/csv;charset=utf-8' 
        });
        
        const blobUrl = URL.createObjectURL(blob);
        
        this.showDownloadModal(blobUrl, numOfRows);
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
        numberOfRowsToDownload.className='excel-download-modal-count-rows';
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