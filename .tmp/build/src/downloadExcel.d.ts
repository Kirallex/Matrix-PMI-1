import "./../style/excelDownloadModal.css";
export declare class ExcelDownloader {
    constructor();
    /**
     * Публичный метод для экспорта HTML-таблицы в CSV.
     * @param table - DOM-элемент таблицы (HTMLElement)
     */
    exportTable(table: HTMLElement): void;
    private exportToCSV;
    private showDownloadModal;
    private copyToClipboard;
}
