import powerbi from "powerbi-visuals-api";
import "./../style/excelDownloadModal.css";
export declare class ExcelDownloader {
    private host;
    private currentDataView;
    /**
     * Конструктор теперь принимает host и dataView
     */
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
    /**
 * Вспомогательный метод для отображения информации о данных
 */
    private showDataInfo;
    private exportToCSV;
    private showDownloadModal;
    private copyToClipboard;
}
