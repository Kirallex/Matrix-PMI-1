import powerbi from "powerbi-visuals-api";
import VisualObjectInstance = powerbi.VisualObjectInstance;
import VisualObjectInstanceEnumerationObject = powerbi.VisualObjectInstanceEnumerationObject;

/**
 * Упрощенный построитель перечисления объектов для панели форматирования
 * Вместо сложной логики мерджа используем простой массив
 */
export class ObjectEnumerationBuilder {
    private instances: VisualObjectInstance[] = [];

    /**
     * Добавление экземпляр объекта в перечисление
     */
    public pushInstance(instance: VisualObjectInstance): ObjectEnumerationBuilder {
        this.instances.push(instance);
        return this;
    }

    /**
     * Завершение построения и возвращение результата
     */
    public complete(): VisualObjectInstanceEnumerationObject {
        return { instances: this.instances };
    }
}