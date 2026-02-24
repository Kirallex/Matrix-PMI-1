import "./../style/excelDownloadModal.css";
export declare class ExcelDownloader {
    /**
     * Конструктор больше не требует host и dataView, так как экспорт идёт из готовой HTML-таблицы.
     * Оставлен для обратной совместимости.
     */
    constructor();
    /**
     * Публичный метод для экспорта HTML-таблицы в CSV.
     * Вызывается из visual.ts после применения всех настроек (hideEmptyCols, subTotals).
     * @param table - DOM-элемент таблицы (HTMLElement)
     */
    exportTable(table: HTMLElement): void;
    /**
     * Экспорт таблицы в CSV (прежняя реализация)
     * @param table - HTML-таблица
     */
    private exportToCSV;
    /**
     * Показывает модальное окно для скачивания (без изменений)
     */
    private showDownloadModal;
    /**
     * Копирование ссылки в буфер обмена (без изменений)
     */
    private copyToClipboard;
}
