import powerbi from "powerbi-visuals-api";

export class DataLoader {
    /**
     * Просто возвращает переданные данные без попытки загрузить больше
     */
    public static async loadAllData(
        host: powerbi.extensibility.visual.IVisualHost,
        initialDataView: powerbi.DataView
    ): Promise<powerbi.DataView> {
        try {
            console.log("Data loading (simplified)...");
            console.log(`Rows: ${this.countRows(initialDataView)}`);
            
            // Возвращаем исходные данные без попытки загрузить больше
            return initialDataView;
            
        } catch (error) {
            console.error('Error in loadAllData:', error);
            return initialDataView;
        }
    }
    
    /**
     * Задержка выполнения
     */
    public static delay(ms: number): Promise<void> {
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
}