import powerbi from "powerbi-visuals-api";
import VisualObjectInstance = powerbi.VisualObjectInstance;
import VisualObjectInstanceEnumerationObject = powerbi.VisualObjectInstanceEnumerationObject;
/**
 * Упрощенный построитель перечисления объектов для панели форматирования
 * Вместо сложной логики мерджа используем простой массив
 */
export declare class ObjectEnumerationBuilder {
    private instances;
    /**
     * Добавление экземпляр объекта в перечисление
     */
    pushInstance(instance: VisualObjectInstance): ObjectEnumerationBuilder;
    /**
     * Завершение построения и возвращение результата
     */
    complete(): VisualObjectInstanceEnumerationObject;
}
