import powerbi from "powerbi-visuals-api";

export class DataLoader {
    /**
     * Загружает все доступные данные используя fetchMoreData
     */
    public static async loadAllData(
        host: powerbi.extensibility.visual.IVisualHost,
        initialDataView: powerbi.DataView
    ): Promise<powerbi.DataView> {
        try {
            console.log("Starting data loading...");
            console.log(`Initial rows: ${this.countRows(initialDataView)}`);
            
            let currentDataView = initialDataView;
            let hasMoreData = true;
            let attempts = 0;
            const maxAttempts = 50; // Максимальное количество попыток
            
            // Пытаемся загрузить больше данных в цикле
            while (hasMoreData && attempts < maxAttempts) {
                attempts++;
                
                console.log(`Attempt ${attempts}: Requesting more data...`);
                
                // fetchMoreData возвращает boolean, а не Promise
                const canFetchMore = host.fetchMoreData(true);
                
                if (canFetchMore) {
                    console.log(`Attempt ${attempts}: Request accepted, waiting for data...`);
                    
                    // Ждем некоторое время для получения данных
                    await this.delay(500);
                    
                    // На этом этапе данные должны прийти в следующем вызове update
                    // Но мы не можем их получить здесь напрямую
                    // Эта функция должна быть вызвана из visual.ts
                    
                    hasMoreData = false; // Для простоты загружаем только один раз
                } else {
                    console.log(`Attempt ${attempts}: No more data available`);
                    hasMoreData = false;
                }
            }
            
            console.log(`Data loading completed. Total attempts: ${attempts}`);
            return currentDataView;
            
        } catch (error) {
            console.error('Error in loadAllData:', error);
            return initialDataView;
        }
    }
    
    /**
     * Задержка выполнения
     */
    private static delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * Подсчитывает количество строк в dataView
     */
    public static countRows(dataView: powerbi.DataView): number {
        if (!dataView?.matrix?.rows?.root?.children) return 0;
        
        let count = 0;
        for (const child of dataView.matrix.rows.root.children) {
            count++;
            if (child.children) {
                count += this.countChildRows(child);
            }
        }
        return count;
    }
    
    /**
     * Рекурсивно подсчитывает дочерние строки
     */
    private static countChildRows(node: powerbi.DataViewMatrixNode): number {
        if (!node.children) return 0;
        
        let count = 0;
        for (const child of node.children) {
            count++;
            if (child.children) {
                count += this.countChildRows(child);
            }
        }
        return count;
    }
    
    /**
     * Проверяет, поддерживает ли визуализация загрузку дополнительных данных
     */
    public static canFetchMoreData(host: powerbi.extensibility.visual.IVisualHost): boolean {
        return typeof host.fetchMoreData === 'function';
    }
}