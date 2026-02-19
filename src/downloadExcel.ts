"use strict";
import powerbi from "powerbi-visuals-api";
import "./../style/excelDownloadModal.css"
import { DataLoader } from "./dataLoader";
import { MatrixDataViewDictFormatter } from "./___matrixDataViewDictFormatter___"; 
import { IMatrixData } from "./matrixDataInterfaces";

export class ExcelDownloader {
    private host: powerbi.extensibility.visual.IVisualHost;
    private currentDataView: powerbi.DataView;

    constructor(host: powerbi.extensibility.visual.IVisualHost, dataView: powerbi.DataView) {
        this.host = host;
        this.currentDataView = dataView;
    }

    public excelDownloaderMethod(table: HTMLElement, grid: HTMLElement): void {
        const exportBtn = grid.querySelector('#exportBtn') as HTMLButtonElement;
        
        if (!exportBtn) {
            console.error('Export button not found');
            return;
        }

        const exportToExcel = async () => {
            try {
                // Используем DataLoader для получения данных
                await this.exportFromDataView();
            } catch (error) {
                console.error('Error exporting to CSV:', error);
                // Fallback: если есть DOM таблица, можно попробовать из нее
                if (table) {
                    this.exportToCSV(table as HTMLElement);
                }
            }
        };

        exportBtn.addEventListener('click', exportToExcel);
    }

    private async exportFromDataView(): Promise<void> {
        console.log("Starting export from DataView...");
        
        // Получаем информацию о текущих данных
        const initialRowCount = DataLoader.countRows(this.currentDataView);
        console.log(`Initial data rows: ${initialRowCount}`);
        
        // Загружаем данные (теперь просто используем текущие данные)
        console.log("Loading available data...");
        const allDataView = await DataLoader.loadAllData(this.host, this.currentDataView);
        
        const finalRowCount = DataLoader.countRows(allDataView);
        console.log(`Final data rows: ${finalRowCount}`);
        
        // Преобразуем DataView в CSV
        this.convertDataViewToCsv(allDataView);
    }

    /**
     * Преобразует DataView в CSV и запускает скачивание
     */
    private convertDataViewToCsv(dataView: powerbi.DataView): void {
        if (!dataView?.matrix) {
            console.error('No matrix data available for export');
            return;
        }

        try {
            const matrixData = MatrixDataViewDictFormatter.formatDataViewMatrix(dataView.matrix);
            const csv = this.convertMatrixDataToCsv(matrixData);
            this.downloadCsvFile(csv);
            
        } catch (error) {
            console.error('Error converting DataView to CSV:', error);
            throw error;
        }
    }

    /**
     * Преобразует структурированные данные матрицы в CSV строку
     */
    private convertMatrixDataToCsv(matrixData: IMatrixData): string {
        let csv = '';
        
        // Добавляем заголовки (topRow)
        for (const row of matrixData.topRow) {
            csv += this.escapeCsvRow(row) + '\n';
        }
        
        // Добавляем основные строки данных (midRow)
        for (const row of matrixData.midRow) {
            csv += this.escapeCsvRow(row) + '\n';
        }
        
        // Добавляем строки с тоталами (totalRow)
        for (const row of matrixData.totalRow) {
            csv += this.escapeCsvRow(row) + '\n';
        }
        
        return csv;
    }

    /**
     * Экранирует строку для CSV формата
     */
    private escapeCsvRow(row: string[]): string {
        return row.map(cell => {
            let text = cell || '';
            text = text.replace(/"/g, '""');
            if (text.includes(',') || text.includes('"') || text.includes('\n') || text.includes('\r')) {
                text = `"${text}"`;
            }
            return text;
        }).join(',');
    }

    /**
     * Создает и скачивает CSV файл, а также показывает модальное окно
     */
    private downloadCsvFile(csvContent: string): void {
        const bom = '\uFEFF';
        const csvData = bom + csvContent;
        
        const blob = new Blob([csvData], { 
            type: 'text/csv;charset=utf-8' 
        });
        
        const blobUrl = URL.createObjectURL(blob);
        
        this.showDownloadModal(blobUrl);
    }

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
        /**
     * Публичный метод для экспорта данных из DataView (используется после сбора всех сегментов)
     */
    public exportDataView(dataView: powerbi.DataView): void {
        if (!dataView?.matrix) {
            console.error('No matrix data available for export');
            return;
        }
        this.convertDataViewToCsv(dataView);
    }
}