import "./../style/excelDownloadModal.css";
export declare class ExcelDownloader {
    constructor();
    /**
     * Публичный метод для экспорта HTML-таблицы в CSV.
     * @param table - DOM-элемент таблицы (HTMLElement)
     */
    exportTable(table: HTMLElement): void;
    private exportToCSV;
    /**
     * Проверяет, является ли текст числовым значением.
     */
    private isNumeric;
    /**
     * Извлекает текст из ячейки, очищая от пробелов, если это число.
     */
    private extractCellText;
    private showDownloadModal;
    private copyToClipboard;
}
