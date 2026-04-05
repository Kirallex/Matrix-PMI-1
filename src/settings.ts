import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";
import powerbi from "powerbi-visuals-api";

import FormattingSettingsCard = formattingSettings.SimpleCard;
import FormattingSettingsCompositeCard = formattingSettings.CompositeCard;
import FormattingSettingsSlice = formattingSettings.Slice;
import FormattingSettingsModel = formattingSettings.Model;

// --- Карточка Subtotals (без изменений) ---
class SubtotalsCard extends FormattingSettingsCard {
    public rowSubtotals = new formattingSettings.ToggleSwitch({
        name: "rowSubtotals", displayName: "Row subtotals", value: true
    });
    public columnSubtotals = new formattingSettings.ToggleSwitch({
        name: "columnSubtotals", displayName: "Column subtotals", value: true
    });
    public grandTotal = new formattingSettings.ToggleSwitch({
        name: "grandTotal", displayName: "Grand total", value: true
    });
    public nonGrandTotal = new formattingSettings.ToggleSwitch({
        name: "nonGrandTotal", displayName: "NonGrand total", value: false
    });
    public name = "subTotals";
    public displayName = "Subtotals";
    public slices = [this.rowSubtotals, this.columnSubtotals, this.grandTotal, this.nonGrandTotal];
}

// --- Hide Empty Columns (без изменений) ---
class HideEmptyColsCard extends FormattingSettingsCard {
    public hideColsLabel = new formattingSettings.ToggleSwitch({
        name: "hideColsLabel", displayName: "Hide Empty Columns", value: false
    });
    public name = "hideEmptyCols";
    public displayName = "Hide Empty Columns";
    public slices = [this.hideColsLabel];
}

// --- Horizontal gridlines ---
class HorizontalGridlinesGroup extends FormattingSettingsCard {
    public color = new formattingSettings.ColorPicker({ name: "horizontalColor", displayName: "Color", value: { value: "#F1F1F1" } });
    public width = new formattingSettings.NumUpDown({ name: "horizontalWidth", displayName: "Width", value: 1, options: { minValue: 0, maxValue: 10, step: 1 } as any });
    public name = "horizontalGroup";
    public displayName = "Horizontal gridlines";
    public slices = [this.color, this.width];
}

// --- Vertical gridlines ---
class VerticalGridlinesGroup extends FormattingSettingsCard {
    public color = new formattingSettings.ColorPicker({ name: "verticalColor", displayName: "Color", value: { value: "#E1E1E1" } });
    public width = new formattingSettings.NumUpDown({ name: "verticalWidth", displayName: "Width", value: 1, options: { minValue: 0, maxValue: 10, step: 1 } as any });
    public name = "verticalGroup";
    public displayName = "Vertical gridlines";
    public slices = [this.color, this.width];
}

// --- Border ---
class BorderGroup extends FormattingSettingsCard {
    public section = new formattingSettings.ItemDropdown({
        name: "borderSection", displayName: "Section",
        items: [
            { value: "all", displayName: "All" },
            { value: "columnHeader", displayName: "Column Header" },
            { value: "rowHeader", displayName: "Row Header" },
            { value: "values", displayName: "Values Section" }
        ],
        value: { value: "all", displayName: "All" }
    });
    public positionTop = new formattingSettings.ToggleSwitch({ name: "borderPositionTop", displayName: "Top", value: true });
    public positionBottom = new formattingSettings.ToggleSwitch({ name: "borderPositionBottom", displayName: "Bottom", value: true });
    public positionLeft = new formattingSettings.ToggleSwitch({ name: "borderPositionLeft", displayName: "Left", value: true });
    public positionRight = new formattingSettings.ToggleSwitch({ name: "borderPositionRight", displayName: "Right", value: true });
    public color = new formattingSettings.ColorPicker({ name: "borderColor", displayName: "Color", value: { value: "#F1F1F1" } });
    public width = new formattingSettings.NumUpDown({ name: "borderWidth", displayName: "Width", value: 1, options: { minValue: 0, maxValue: 10, step: 1 } as any });
    public name = "borderGroup";
    public displayName = "Border";
    public slices = [this.section, this.positionTop, this.positionBottom, this.positionLeft, this.positionRight, this.color, this.width];
}

// --- Options ---
class OptionsGroup extends FormattingSettingsCard {
    public rowPadding = new formattingSettings.NumUpDown({ name: "rowPadding", displayName: "Row Padding", value: 5, options: { minValue: 0, maxValue: 50, step: 1 } as any });
    public globalFontSize = new formattingSettings.NumUpDown({ name: "globalFontSize", displayName: "Global font size", value: 9, options: { minValue: 8, maxValue: 72, step: 1 } as any });
    public name = "optionsGroup";
    public displayName = "Options";
    public slices = [this.rowPadding, this.globalFontSize];
}

// --- Grid ---
class GridCard extends FormattingSettingsCompositeCard {
    public horizontalGroup: HorizontalGridlinesGroup;
    public verticalGroup: VerticalGridlinesGroup;
    public borderGroup: BorderGroup;
    public optionsGroup: OptionsGroup;
    public groups: FormattingSettingsCard[];
    public name = "grid";
    public displayName = "Grid";
    constructor() {
        super();
        this.horizontalGroup = new HorizontalGridlinesGroup();
        this.verticalGroup = new VerticalGridlinesGroup();
        this.borderGroup = new BorderGroup();
        this.optionsGroup = new OptionsGroup();
        this.groups = [this.horizontalGroup, this.verticalGroup, this.borderGroup, this.optionsGroup];
    }
}

// --- Values ---
class ValuesGroup extends FormattingSettingsCard {
    public font = new formattingSettings.FontControl({
        name: "font", displayName: "Font",
        fontFamily: new formattingSettings.FontPicker({ name: "fontFamily", value: "Segoe UI Semibold" }),
        fontSize: new formattingSettings.NumUpDown({ name: "fontSize", value: 9, options: { minValue: 8, maxValue: 72, step: 1 } as any }),
        bold: new formattingSettings.ToggleSwitch({ name: "bold", value: false }),
        italic: new formattingSettings.ToggleSwitch({ name: "italic", value: false }),
        underline: new formattingSettings.ToggleSwitch({ name: "underline", value: false })
    });
    public textColor = new formattingSettings.ColorPicker({ name: "textColor", displayName: "Text color", value: { value: "#1E2323" } });
    public backgroundColor = new formattingSettings.ColorPicker({ name: "backgroundColor", displayName: "Background color", value: { value: "#FFFFFF" } });
    public altTextColor = new formattingSettings.ColorPicker({ name: "altTextColor", displayName: "Alternate text color", value: { value: "#1E2323" } });
    public altBackgroundColor = new formattingSettings.ColorPicker({ name: "altBackgroundColor", displayName: "Alternate background color", value: { value: "#FFFFFF" } });
    public name = "valuesGroup";
    public displayName = "Values";
    public slices = [this.font, this.textColor, this.backgroundColor, this.altTextColor, this.altBackgroundColor];
}
class ValuesCard extends FormattingSettingsCompositeCard {
    public valuesGroup: ValuesGroup;
    public groups: FormattingSettingsCard[];
    public name = "values";
    public displayName = "Values";
    constructor() {
        super();
        this.valuesGroup = new ValuesGroup();
        this.groups = [this.valuesGroup];
    }
}

// --- Column Headers ---
class ColumnHeadersGroup extends FormattingSettingsCard {
    public font = new formattingSettings.FontControl({
        name: "font", displayName: "Font",
        fontFamily: new formattingSettings.FontPicker({ name: "fontFamily", value: "Segoe UI" }),
        fontSize: new formattingSettings.NumUpDown({ name: "fontSize", value: 9, options: { minValue: 8, maxValue: 72, step: 1 } as any }),
        bold: new formattingSettings.ToggleSwitch({ name: "bold", value: true }),
        italic: new formattingSettings.ToggleSwitch({ name: "italic", value: false }),
        underline: new formattingSettings.ToggleSwitch({ name: "underline", value: false })
    });
    public textColor = new formattingSettings.ColorPicker({ name: "textColor", displayName: "Text color", value: { value: "#1E2323" } });
    public backgroundColor = new formattingSettings.ColorPicker({ name: "backgroundColor", displayName: "Background color", value: { value: "#FFFFFF" } });
    public headerAlignment = new formattingSettings.AlignmentGroup({ name: "headerAlignment", displayName: "Header alignment", value: "left", mode: powerbi.visuals.AlignmentGroupMode.Horizonal });
    public titleAlignment = new formattingSettings.AlignmentGroup({ name: "titleAlignment", displayName: "Title alignment", value: "left", mode: powerbi.visuals.AlignmentGroupMode.Horizonal });
    public name = "columnHeadersGroup";
    public displayName = "Text";
    public slices = [this.font, this.textColor, this.backgroundColor, this.headerAlignment, this.titleAlignment];
}
class ColumnHeadersCard extends FormattingSettingsCompositeCard {
    public columnHeadersGroup: ColumnHeadersGroup;
    public groups: FormattingSettingsCard[];
    public name = "columnHeaders";
    public displayName = "Column Headers";
    constructor() {
        super();
        this.columnHeadersGroup = new ColumnHeadersGroup();
        this.groups = [this.columnHeadersGroup];
    }
}

// --- Row Headers ---
class RowHeadersGroup extends FormattingSettingsCard {
    public font = new formattingSettings.FontControl({
        name: "font", displayName: "Font",
        fontFamily: new formattingSettings.FontPicker({ name: "fontFamily", value: "Segoe UI" }),
        fontSize: new formattingSettings.NumUpDown({ name: "fontSize", value: 9, options: { minValue: 8, maxValue: 72, step: 1 } as any }),
        bold: new formattingSettings.ToggleSwitch({ name: "bold", value: true }),
        italic: new formattingSettings.ToggleSwitch({ name: "italic", value: false }),
        underline: new formattingSettings.ToggleSwitch({ name: "underline", value: false })
    });
    public textColor = new formattingSettings.ColorPicker({ name: "textColor", displayName: "Text color", value: { value: "#1E2323" } });
    public backgroundColor = new formattingSettings.ColorPicker({ name: "backgroundColor", displayName: "Background color", value: { value: "#FFFFFF" } });
    public textAlignment = new formattingSettings.AlignmentGroup({ name: "textAlignment", displayName: "Alignment", value: "left", mode: powerbi.visuals.AlignmentGroupMode.Horizonal });
    public name = "rowHeadersGroup";
    public displayName = "Text";
    public slices = [this.font, this.textColor, this.backgroundColor, this.textAlignment];
}
class RowHeadersCard extends FormattingSettingsCompositeCard {
    public rowHeadersGroup: RowHeadersGroup;
    public groups: FormattingSettingsCard[];
    public name = "rowHeaders";
    public displayName = "Row Headers";
    constructor() {
        super();
        this.rowHeadersGroup = new RowHeadersGroup();
        this.groups = [this.rowHeadersGroup];
    }
}

// --- Column Grand Total ---
class ColumnGrandTotalGroup extends FormattingSettingsCard {
    public font = new formattingSettings.FontControl({
        name: "font", displayName: "Font",
        fontFamily: new formattingSettings.FontPicker({ name: "fontFamily", value: "Segoe UI" }),
        fontSize: new formattingSettings.NumUpDown({ name: "fontSize", value: 9, options: { minValue: 8, maxValue: 72, step: 1 } as any }),
        bold: new formattingSettings.ToggleSwitch({ name: "bold", value: true }),
        italic: new formattingSettings.ToggleSwitch({ name: "italic", value: false }),
        underline: new formattingSettings.ToggleSwitch({ name: "underline", value: false })
    });
    public textColor = new formattingSettings.ColorPicker({ name: "textColor", displayName: "Text color", value: { value: "#1E2323" } });
    public backgroundColor = new formattingSettings.ColorPicker({ name: "backgroundColor", displayName: "Background color", value: { value: "#FFFFFF" } });
    public applyToLabels = new formattingSettings.ToggleSwitch({ name: "applyToLabels", displayName: "Apply to labels", value: false });
    public name = "columnGrandTotalGroup";
    public displayName = "Values";
    public slices = [this.font, this.textColor, this.backgroundColor, this.applyToLabels];
}
class ColumnGrandTotalCard extends FormattingSettingsCompositeCard {
    public columnGrandTotalGroup: ColumnGrandTotalGroup;
    public groups: FormattingSettingsCard[];
    public name = "columnGrandTotal";
    public displayName = "Column grand total";
    constructor() {
        super();
        this.columnGrandTotalGroup = new ColumnGrandTotalGroup();
        this.groups = [this.columnGrandTotalGroup];
    }
}

// --- Row Grand Total ---
class RowGrandTotalGroup extends FormattingSettingsCard {
    public font = new formattingSettings.FontControl({
        name: "font", displayName: "Font",
        fontFamily: new formattingSettings.FontPicker({ name: "fontFamily", value: "Segoe UI" }),
        fontSize: new formattingSettings.NumUpDown({ name: "fontSize", value: 9, options: { minValue: 8, maxValue: 72, step: 1 } as any }),
        bold: new formattingSettings.ToggleSwitch({ name: "bold", value: true }),
        italic: new formattingSettings.ToggleSwitch({ name: "italic", value: false }),
        underline: new formattingSettings.ToggleSwitch({ name: "underline", value: false })
    });
    public textColor = new formattingSettings.ColorPicker({ name: "textColor", displayName: "Text color", value: { value: "#1E2323" } });
    public backgroundColor = new formattingSettings.ColorPicker({ name: "backgroundColor", displayName: "Background color", value: { value: "#FFFFFF" } });
    public applyToLabels = new formattingSettings.ToggleSwitch({ name: "applyToLabels", displayName: "Apply to labels", value: false });
    public name = "rowGrandTotalGroup";
    public displayName = "Values";
    public slices = [this.font, this.textColor, this.backgroundColor, this.applyToLabels];
}
class RowGrandTotalCard extends FormattingSettingsCompositeCard {
    public rowGrandTotalGroup: RowGrandTotalGroup;
    public groups: FormattingSettingsCard[];
    public name = "rowGrandTotal";
    public displayName = "Row grand total";
    constructor() {
        super();
        this.rowGrandTotalGroup = new RowGrandTotalGroup();
        this.groups = [this.rowGrandTotalGroup];
    }
}

// class MeasurePartGroup extends formattingSettings.Group {
//     public textColor: formattingSettings.ColorPicker;
//     public backgroundColor: formattingSettings.ColorPicker;
//     public alignment: formattingSettings.AlignmentGroup;

//     constructor(partName: string, displayName: string) {
//         // 🟢 Правильный вызов: передаём объект с именем и отображаемым именем группы
//         super({ name: partName, displayName: displayName });
//         const prefix = partName.toLowerCase();

//         this.textColor = new formattingSettings.ColorPicker({
//             name: `${prefix}_textColor`,
//             displayName: "Text color",
//             value: { value: "#1E2323" }
//         });
//         this.backgroundColor = new formattingSettings.ColorPicker({
//             name: `${prefix}_backgroundColor`,
//             displayName: "Background color",
//             value: { value: "#FFFFFF" }
//         });
//         this.alignment = new formattingSettings.AlignmentGroup({
//             name: `${prefix}_alignment`,
//             displayName: "Alignment",
//             value: "left",
//             mode: powerbi.visuals.AlignmentGroupMode.Horizonal
//         });

//         // 🔴 Важно: срезы добавляются в свойство `slices` после создания
//         this.slices = [this.textColor, this.backgroundColor, this.alignment];
//     }
// }

export class MeasureCard extends FormattingSettingsCard {
    // Header
    public headerTextColor: formattingSettings.ColorPicker;
    public headerBackgroundColor: formattingSettings.ColorPicker;
    public headerAlignment: formattingSettings.AlignmentGroup;
    // Total
    public totalTextColor: formattingSettings.ColorPicker;
    public totalBackgroundColor: formattingSettings.ColorPicker;
    public totalAlignment: formattingSettings.AlignmentGroup;
    // Values
    public valuesTextColor: formattingSettings.ColorPicker;
    public valuesBackgroundColor: formattingSettings.ColorPicker;
    public valuesAlignment: formattingSettings.AlignmentGroup;

    constructor(measureName: string, displayName: string) {
        super();
        this.name = measureName;      // "measure_0"
        this.displayName = displayName; // "#, Quantity sold"

        const prefix = measureName; // "measure_0"

        // Header
        this.headerTextColor = new formattingSettings.ColorPicker({
            name: `${prefix}_header_textColor`,
            displayName: "Header Text color",
            value: { value: "#1E2323" }
        });
        this.headerBackgroundColor = new formattingSettings.ColorPicker({
            name: `${prefix}_header_backgroundColor`,
            displayName: "Header Background color",
            value: { value: "#FFFFFF" }
        });
        this.headerAlignment = new formattingSettings.AlignmentGroup({
            name: `${prefix}_header_alignment`,
            displayName: "Header Alignment",
            value: "left",
            mode: powerbi.visuals.AlignmentGroupMode.Horizonal
        });

        // Total
        this.totalTextColor = new formattingSettings.ColorPicker({
            name: `${prefix}_total_textColor`,
            displayName: "Total Text color",
            value: { value: "#1E2323" }
        });
        this.totalBackgroundColor = new formattingSettings.ColorPicker({
            name: `${prefix}_total_backgroundColor`,
            displayName: "Total Background color",
            value: { value: "#FFFFFF" }
        });
        this.totalAlignment = new formattingSettings.AlignmentGroup({
            name: `${prefix}_total_alignment`,
            displayName: "Total Alignment",
            value: "left",
            mode: powerbi.visuals.AlignmentGroupMode.Horizonal
        });

        // Values
        this.valuesTextColor = new formattingSettings.ColorPicker({
            name: `${prefix}_values_textColor`,
            displayName: "Values Text color",
            value: { value: "#1E2323" }
        });
        this.valuesBackgroundColor = new formattingSettings.ColorPicker({
            name: `${prefix}_values_backgroundColor`,
            displayName: "Values Background color",
            value: { value: "#FFFFFF" }
        });
        this.valuesAlignment = new formattingSettings.AlignmentGroup({
            name: `${prefix}_values_alignment`,
            displayName: "Values Alignment",
            value: "left",
            mode: powerbi.visuals.AlignmentGroupMode.Horizonal
        });

        // Все срезы в одном массиве
        this.slices = [
            this.headerTextColor,
            this.headerBackgroundColor,
            this.headerAlignment,
            this.totalTextColor,
            this.totalBackgroundColor,
            this.totalAlignment,
            this.valuesTextColor,
            this.valuesBackgroundColor,
            this.valuesAlignment
        ];
    }
}



class SpecificColumnCard extends formattingSettings.CompositeCard {
    public groups: formattingSettings.Cards[];
    public name = "specificColumn";
    public displayName = "Specific column";

    constructor() {
        super();
        // Создаём фиксированные 30 карточек мер один раз
        const groups: MeasureCard[] = [];
        for (let i = 0; i < 30; i++) {
            groups.push(new MeasureCard(`measure_${i}`, `Measure ${i + 1}`));
        }
        this.groups = groups;
    }

    public updateGroups(measureNames: string[]): void {
        const groups = this.groups as MeasureCard[];
        // Сначала скрыть все карточки
        for (let i = 0; i < groups.length; i++) {
            groups[i].visible = false;
        }
        // Затем показать и переименовать только те, которые соответствуют реальным мерам
        for (let i = 0; i < measureNames.length && i < groups.length; i++) {
            groups[i].visible = true;
            groups[i].displayName = measureNames[i];
        }
        // НЕ пересоздаём массив groups
    }
}

// class SpecificColumnCard extends FormattingSettingsCompositeCard {
//     public groups: FormattingSettingsCard[];
//     public name = "specificColumn";
//     public displayName = "Specific column";

//     private savedSettings: Map<string, any> = new Map();

//     constructor() {
//         super();
//         this.groups = [];
//     }

//     public updateGroups(measureNames: string[]): void {
//         this.saveCurrentValues();

//         const newGroups: MeasureCard[] = [];
//         for (let i = 0; i < measureNames.length; i++) {
//             const measureName = measureNames[i];
//             const cardName = `measure_${i}`;
//             newGroups.push(new MeasureCard(cardName, measureName));
//         }

//         this.restoreValuesToGroups(newGroups);
//         this.groups = newGroups;
//     }

//     private saveCurrentValues(): void {
//         this.savedSettings.clear();
//         for (const card of this.groups as MeasureCard[]) {
//             this.savedSettings.set(card.name, {
//                 headerTextColor: card.headerTextColor.value.value,
//                 headerBackgroundColor: card.headerBackgroundColor.value.value,
//                 headerAlignment: card.headerAlignment.value,
//                 totalTextColor: card.totalTextColor.value.value,
//                 totalBackgroundColor: card.totalBackgroundColor.value.value,
//                 totalAlignment: card.totalAlignment.value,
//                 valuesTextColor: card.valuesTextColor.value.value,
//                 valuesBackgroundColor: card.valuesBackgroundColor.value.value,
//                 valuesAlignment: card.valuesAlignment.value
//             });
//         }
//     }

//     private restoreValuesToGroups(newGroups: MeasureCard[]): void {
//         for (const card of newGroups) {
//             const saved = this.savedSettings.get(card.name);
//             if (saved) {
//                 card.headerTextColor.value.value = saved.headerTextColor;
//                 card.headerBackgroundColor.value.value = saved.headerBackgroundColor;
//                 card.headerAlignment.value = saved.headerAlignment;
//                 card.totalTextColor.value.value = saved.totalTextColor;
//                 card.totalBackgroundColor.value.value = saved.totalBackgroundColor;
//                 card.totalAlignment.value = saved.totalAlignment;
//                 card.valuesTextColor.value.value = saved.valuesTextColor;
//                 card.valuesBackgroundColor.value.value = saved.valuesBackgroundColor;
//                 card.valuesAlignment.value = saved.valuesAlignment;
//             }
//         }
//     }
// }

// --- Основная модель ---
export class VisualSettings extends FormattingSettingsModel {
    public subTotals: SubtotalsCard = new SubtotalsCard();
    public hideEmptyCols: HideEmptyColsCard = new HideEmptyColsCard();
    public grid: GridCard = new GridCard();
    public values: ValuesCard = new ValuesCard();
    public columnHeaders: ColumnHeadersCard = new ColumnHeadersCard();
    public rowHeaders: RowHeadersCard = new RowHeadersCard();
    public columnGrandTotal: ColumnGrandTotalCard = new ColumnGrandTotalCard();
    public rowGrandTotal: RowGrandTotalCard = new RowGrandTotalCard();
    public specificColumn: SpecificColumnCard = new SpecificColumnCard();

    constructor() {
        super();
        this.cards = [
            this.subTotals, this.hideEmptyCols, this.grid, this.values,
            this.columnHeaders, this.rowHeaders, this.columnGrandTotal,
            this.rowGrandTotal, this.specificColumn
        ];
    }
}