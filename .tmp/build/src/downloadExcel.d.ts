import powerbi from "powerbi-visuals-api";
import "./../style/excelDownloadModal.css";
export declare class ExcelDownloader {
    private host;
    private currentDataView;
    constructor(host: powerbi.extensibility.visual.IVisualHost, dataView: powerbi.DataView);
    excelDownloaderMethod(table: HTMLElement, grid: HTMLElement): void;
    private exportFromDataView;
    /**
     * Преобразует DataView в CSV и запускает скачивание
     */
    private convertDataViewToCsv;
    /**
     * Преобразует структурированные данные матрицы в CSV строку
     */
    private convertMatrixDataToCsv;
    /**
     * Экранирует строку для CSV формата
     */
    private escapeCsvRow;
    /**
     * Создает и скачивает CSV файл, а также показывает модальное окно
     */
    private downloadCsvFile;
    private exportToCSV;
    private showDownloadModal;
    private copyToClipboard;
}
