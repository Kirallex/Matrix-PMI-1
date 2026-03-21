import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";

import FormattingSettingsCard = formattingSettings.SimpleCard;
import FormattingSettingsCompositeCard = formattingSettings.CompositeCard;
import FormattingSettingsSlice = formattingSettings.Slice;
import FormattingSettingsModel = formattingSettings.Model;

// --- Карточка Subtotals ---
class SubtotalsCard extends FormattingSettingsCard {
    public rowSubtotals = new formattingSettings.ToggleSwitch({
        name: "rowSubtotals",
        displayName: "Row subtotals",
        value: true
    });
    public columnSubtotals = new formattingSettings.ToggleSwitch({
        name: "columnSubtotals",
        displayName: "Column subtotals",
        value: true
    });
    public grandTotal = new formattingSettings.ToggleSwitch({
        name: "grandTotal",
        displayName: "Grand total",
        value: true
    });
    public nonGrandTotal = new formattingSettings.ToggleSwitch({
        name: "nonGrandTotal",
        displayName: "NonGrand total",
        value: false
    });
    public name: string = "subTotals";
    public displayName: string = "Subtotals";
    public slices: FormattingSettingsSlice[] = [this.rowSubtotals, this.columnSubtotals, this.grandTotal, this.nonGrandTotal];
}

// --- Карточка Hide Empty Columns ---
class HideEmptyColsCard extends FormattingSettingsCard {
    public hideColsLabel = new formattingSettings.ToggleSwitch({
        name: "hideColsLabel",
        displayName: "Hide Empty Columns",
        value: false
    });
    public name: string = "hideEmptyCols";
    public displayName: string = "Hide Empty Columns";
    public slices: FormattingSettingsSlice[] = [this.hideColsLabel];
}

// --- Группа Horizontal gridlines (без переключателя) ---
class HorizontalGridlinesGroup extends FormattingSettingsCard {
    public color = new formattingSettings.ColorPicker({
        name: "horizontalColor",
        displayName: "Color",
        value: { value: "#F1F1F1" }
    });
    public width = new formattingSettings.NumUpDown({
        name: "horizontalWidth",
        displayName: "Width",
        value: 1,
        options: { minValue: 0, maxValue: 10, step: 1 } as any
    });
    public name: string = "horizontalGroup";
    public displayName: string = "Horizontal gridlines";
    public slices: FormattingSettingsSlice[] = [this.color, this.width];
}

// --- Группа Vertical gridlines (без переключателя) ---
class VerticalGridlinesGroup extends FormattingSettingsCard {
    public color = new formattingSettings.ColorPicker({
        name: "verticalColor",
        displayName: "Color",
        value: { value: "#E1E1E1" }
    });
    public width = new formattingSettings.NumUpDown({
        name: "verticalWidth",
        displayName: "Width",
        value: 1,
        options: { minValue: 0, maxValue: 10, step: 1 } as any
    });
    public name: string = "verticalGroup";
    public displayName: string = "Vertical gridlines";
    public slices: FormattingSettingsSlice[] = [this.color, this.width];
}

// --- Группа Border ---
class BorderGroup extends FormattingSettingsCard {
    public section = new formattingSettings.ItemDropdown({
        name: "borderSection",
        displayName: "Section",
        items: [
            { value: "all", displayName: "All" },
            { value: "columnHeader", displayName: "Column Header" },
            { value: "rowHeader", displayName: "Row Header" },
            { value: "values", displayName: "Values Section" }
        ],
        value: { value: "all", displayName: "All" }
    });
    public positionTop = new formattingSettings.ToggleSwitch({
        name: "borderPositionTop",
        displayName: "Top",
        value: true
    });
    public positionBottom = new formattingSettings.ToggleSwitch({
        name: "borderPositionBottom",
        displayName: "Bottom",
        value: true
    });
    public positionLeft = new formattingSettings.ToggleSwitch({
        name: "borderPositionLeft",
        displayName: "Left",
        value: true
    });
    public positionRight = new formattingSettings.ToggleSwitch({
        name: "borderPositionRight",
        displayName: "Right",
        value: true
    });
    public color = new formattingSettings.ColorPicker({
        name: "borderColor",
        displayName: "Color",
        value: { value: "#F1F1F1" }
    });
    public width = new formattingSettings.NumUpDown({
        name: "borderWidth",
        displayName: "Width",
        value: 1,
        options: { minValue: 0, maxValue: 10, step: 1 } as any
    });
    public name: string = "borderGroup";
    public displayName: string = "Border";
    public slices: FormattingSettingsSlice[] = [
        this.section,
        this.positionTop,
        this.positionBottom,
        this.positionLeft,
        this.positionRight,
        this.color,
        this.width
    ];
}

// --- Группа Options ---
class OptionsGroup extends FormattingSettingsCard {
    public rowPadding = new formattingSettings.NumUpDown({
        name: "rowPadding",
        displayName: "Row Padding",
        value: 5,
        options: { minValue: 0, maxValue: 50, step: 1 } as any
    });
    public globalFontSize = new formattingSettings.NumUpDown({
        name: "globalFontSize",
        displayName: "Global font size",
        value: 9,
        options: { minValue: 8, maxValue: 72, step: 1 } as any
    });
    public name: string = "optionsGroup";
    public displayName: string = "Options";
    public slices: FormattingSettingsSlice[] = [this.rowPadding, this.globalFontSize];
}

// --- Композитная карточка Grid ---
class GridCard extends FormattingSettingsCompositeCard {
    public horizontalGroup: HorizontalGridlinesGroup;
    public verticalGroup: VerticalGridlinesGroup;
    public borderGroup: BorderGroup;
    public optionsGroup: OptionsGroup;
    public groups: FormattingSettingsCard[];

    public name: string = "grid";
    public displayName: string = "Grid";

    constructor() {
        super();

        this.horizontalGroup = new HorizontalGridlinesGroup();
        this.verticalGroup = new VerticalGridlinesGroup();
        this.borderGroup = new BorderGroup();
        this.optionsGroup = new OptionsGroup();

        this.groups = [
            this.horizontalGroup,
            this.verticalGroup,
            this.borderGroup,
            this.optionsGroup
        ];
    }
}

// --- Группа Values (содержит настройки шрифта и цветов) ---
class ValuesGroup extends FormattingSettingsCard {
    // Font control (family, size, bold, italic, underline)
    public font = new formattingSettings.FontControl({
        name: "font",
        displayName: "Font",
        fontFamily: new formattingSettings.FontPicker({
            name: "fontFamily",
            value: "Segoe UI Semibold"
        }),
        fontSize: new formattingSettings.NumUpDown({
            name: "fontSize",
            displayName: "Size",
            value: 9,
            options: { minValue: 8, maxValue: 72, step: 1 } as any
        }),
        bold: new formattingSettings.ToggleSwitch({
            name: "bold",
            displayName: "Bold",
            value: false
        }),
        italic: new formattingSettings.ToggleSwitch({
            name: "italic",
            displayName: "Italic",
            value: false
        }),
        underline: new formattingSettings.ToggleSwitch({
            name: "underline",
            displayName: "Underline",
            value: false
        })
    });

    public textColor = new formattingSettings.ColorPicker({
        name: "textColor",
        displayName: "Text color",
        value: { value: "#1E2323" }
    });
    public backgroundColor = new formattingSettings.ColorPicker({
        name: "backgroundColor",
        displayName: "Background color",
        value: { value: "#FFFFFF" }
    });
    public altTextColor = new formattingSettings.ColorPicker({
        name: "altTextColor",
        displayName: "Alternate text color",
        value: { value: "#1E2323" }
    });
    public altBackgroundColor = new formattingSettings.ColorPicker({
        name: "altBackgroundColor",
        displayName: "Alternate background color",
        value: { value: "#FFFFFF" }
    });

    public name: string = "valuesGroup";
    public displayName: string = "Values";
    public slices: FormattingSettingsSlice[] = [
        this.font,
        this.textColor,
        this.backgroundColor,
        this.altTextColor,
        this.altBackgroundColor
    ];
}

// --- Композитная карточка Values ---
class ValuesCard extends FormattingSettingsCompositeCard {
    public valuesGroup: ValuesGroup;
    public groups: FormattingSettingsCard[];

    public name: string = "values";
    public displayName: string = "Values";

    constructor() {
        super();

        this.valuesGroup = new ValuesGroup();
        this.groups = [this.valuesGroup];
    }
}



class ColumnHeadersGroup extends FormattingSettingsCard {
    public font = new formattingSettings.FontControl({
        name: "font",
        displayName: "Font",
        fontFamily: new formattingSettings.FontPicker({
            name: "fontFamily",
            value: "Segoe UI"
        }),
        fontSize: new formattingSettings.NumUpDown({
            name: "fontSize",
            displayName: "Size",
            value: 9,
            options: { minValue: 8, maxValue: 72, step: 1 } as any
        }),
        bold: new formattingSettings.ToggleSwitch({
            name: "bold",
            displayName: "Bold",
            value: true
        }),
        italic: new formattingSettings.ToggleSwitch({
            name: "italic",
            displayName: "Italic",
            value: false
        }),
        underline: new formattingSettings.ToggleSwitch({
            name: "underline",
            displayName: "Underline",
            value: false
        })
    });

    public textColor = new formattingSettings.ColorPicker({
        name: "textColor",
        displayName: "Text color",
        value: { value: "#1E2323" }
    });

    public backgroundColor = new formattingSettings.ColorPicker({
        name: "backgroundColor",
        displayName: "Background color",
        value: { value: "#FFFFFF" }
    });

    // Выравнивание заголовков (кнопки)
    public headerAlignment = new formattingSettings.AlignmentGroup({
        name: "headerAlignment",
        displayName: "Header alignment",
        value: "left",
        mode: powerbi.visuals.AlignmentGroupMode.Horizonal
    });

    // Выравнивание текста заголовков (кнопки)
    public titleAlignment = new formattingSettings.AlignmentGroup({
        name: "titleAlignment",
        displayName: "Title alignment",
        value: "left",
        mode: powerbi.visuals.AlignmentGroupMode.Horizonal
    });

    public name: string = "columnHeadersGroup";
    public displayName: string = "Text";
    public slices: FormattingSettingsSlice[] = [
        this.font,
        this.textColor,
        this.backgroundColor,
        this.headerAlignment,
        this.titleAlignment
    ];
}

// --- Композитная карточка Column Headers ---
class ColumnHeadersCard extends FormattingSettingsCompositeCard {
    public columnHeadersGroup: ColumnHeadersGroup;
    public groups: FormattingSettingsCard[];

    public name: string = "columnHeaders";
    public displayName: string = "Column Headers";

    constructor() {
        super();

        this.columnHeadersGroup = new ColumnHeadersGroup();
        this.groups = [this.columnHeadersGroup];
    }
}




// --- Основная модель настроек ---
export class VisualSettings extends FormattingSettingsModel {
    public subTotals: SubtotalsCard = new SubtotalsCard();
    public hideEmptyCols: HideEmptyColsCard = new HideEmptyColsCard();
    public grid: GridCard = new GridCard();
    public values: ValuesCard = new ValuesCard();
    public columnHeaders: ColumnHeadersCard = new ColumnHeadersCard();

    constructor() {
        super();
        this.cards = [this.subTotals, this.hideEmptyCols, this.grid, this.values, this.columnHeaders];
    }
}