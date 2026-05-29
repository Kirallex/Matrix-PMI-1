import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";
import FormattingSettingsCard = formattingSettings.SimpleCard;
import FormattingSettingsCompositeCard = formattingSettings.CompositeCard;
import FormattingSettingsModel = formattingSettings.Model;
declare class SubtotalsCard extends FormattingSettingsCard {
    rowSubtotals: formattingSettings.ToggleSwitch;
    columnSubtotals: formattingSettings.ToggleSwitch;
    grandTotal: formattingSettings.ToggleSwitch;
    nonGrandTotal: formattingSettings.ToggleSwitch;
    name: string;
    displayName: string;
    slices: formattingSettings.ToggleSwitch[];
}
declare class HideEmptyColsCard extends FormattingSettingsCard {
    hideColsLabel: formattingSettings.ToggleSwitch;
    name: string;
    displayName: string;
    slices: formattingSettings.ToggleSwitch[];
}
declare class HorizontalGridlinesGroup extends FormattingSettingsCard {
    color: formattingSettings.ColorPicker;
    width: formattingSettings.NumUpDown;
    name: string;
    displayName: string;
    slices: (formattingSettings.NumUpDown | formattingSettings.ColorPicker)[];
}
declare class VerticalGridlinesGroup extends FormattingSettingsCard {
    color: formattingSettings.ColorPicker;
    width: formattingSettings.NumUpDown;
    name: string;
    displayName: string;
    slices: (formattingSettings.NumUpDown | formattingSettings.ColorPicker)[];
}
declare class BorderSectionCard extends formattingSettings.SimpleCard {
    positionTop: formattingSettings.ToggleSwitch;
    positionBottom: formattingSettings.ToggleSwitch;
    positionLeft: formattingSettings.ToggleSwitch;
    positionRight: formattingSettings.ToggleSwitch;
    color: formattingSettings.ColorPicker;
    width: formattingSettings.NumUpDown;
    constructor(sectionName: string, displayName: string);
}
declare class BordersCard extends formattingSettings.CompositeCard {
    allGroup: BorderSectionCard;
    columnHeaderGroup: BorderSectionCard;
    rowHeaderGroup: BorderSectionCard;
    valuesGroup: BorderSectionCard;
    groups: formattingSettings.Cards[];
    name: string;
    displayName: string;
    constructor();
}
declare class GridCard extends FormattingSettingsCompositeCard {
    horizontalGroup: HorizontalGridlinesGroup;
    verticalGroup: VerticalGridlinesGroup;
    optionsGroup: OptionsGroup;
    groups: FormattingSettingsCard[];
    name: string;
    displayName: string;
    constructor();
}
declare class OptionsGroup extends FormattingSettingsCard {
    rowPadding: formattingSettings.NumUpDown;
    name: string;
    displayName: string;
    slices: formattingSettings.NumUpDown[];
}
declare class ValuesGroup extends FormattingSettingsCard {
    font: formattingSettings.FontControl;
    textColor: formattingSettings.ColorPicker;
    backgroundColor: formattingSettings.ColorPicker;
    altTextColor: formattingSettings.ColorPicker;
    altBackgroundColor: formattingSettings.ColorPicker;
    name: string;
    displayName: string;
    slices: (formattingSettings.FontControl | formattingSettings.ColorPicker)[];
}
declare class ValuesCard extends FormattingSettingsCompositeCard {
    valuesGroup: ValuesGroup;
    groups: FormattingSettingsCard[];
    name: string;
    displayName: string;
    constructor();
}
declare class ColumnHeadersGroup extends FormattingSettingsCard {
    font: formattingSettings.FontControl;
    textColor: formattingSettings.ColorPicker;
    backgroundColor: formattingSettings.ColorPicker;
    headerAlignment: formattingSettings.AlignmentGroup;
    titleAlignment: formattingSettings.AlignmentGroup;
    name: string;
    displayName: string;
    slices: (formattingSettings.FontControl | formattingSettings.ColorPicker | formattingSettings.AlignmentGroup)[];
}
declare class ColumnHeadersRowHider extends FormattingSettingsCard {
    hideTechRowLabel: formattingSettings.ToggleSwitch;
    name: string;
    displayName: string;
    slices: formattingSettings.ToggleSwitch[];
}
declare class ColumnHeadersCard extends FormattingSettingsCompositeCard {
    columnHeadersGroup: ColumnHeadersGroup;
    hideTechRowCard: ColumnHeadersRowHider;
    groups: FormattingSettingsCard[];
    name: string;
    displayName: string;
    constructor();
}
declare class RowHeadersGroup extends FormattingSettingsCard {
    font: formattingSettings.FontControl;
    textColor: formattingSettings.ColorPicker;
    backgroundColor: formattingSettings.ColorPicker;
    textAlignment: formattingSettings.AlignmentGroup;
    name: string;
    displayName: string;
    slices: (formattingSettings.FontControl | formattingSettings.ColorPicker | formattingSettings.AlignmentGroup)[];
}
declare class RowHeadersCard extends FormattingSettingsCompositeCard {
    rowHeadersGroup: RowHeadersGroup;
    groups: FormattingSettingsCard[];
    name: string;
    displayName: string;
    constructor();
}
declare class ColumnGrandTotalGroup extends FormattingSettingsCard {
    font: formattingSettings.FontControl;
    textColor: formattingSettings.ColorPicker;
    backgroundColor: formattingSettings.ColorPicker;
    applyToLabels: formattingSettings.ToggleSwitch;
    name: string;
    displayName: string;
    slices: (formattingSettings.FontControl | formattingSettings.ToggleSwitch | formattingSettings.ColorPicker)[];
}
declare class ColumnGrandTotalCard extends FormattingSettingsCompositeCard {
    columnGrandTotalGroup: ColumnGrandTotalGroup;
    groups: FormattingSettingsCard[];
    name: string;
    displayName: string;
    constructor();
}
declare class RowGrandTotalGroup extends FormattingSettingsCard {
    font: formattingSettings.FontControl;
    textColor: formattingSettings.ColorPicker;
    backgroundColor: formattingSettings.ColorPicker;
    applyToLabels: formattingSettings.ToggleSwitch;
    name: string;
    displayName: string;
    slices: (formattingSettings.FontControl | formattingSettings.ToggleSwitch | formattingSettings.ColorPicker)[];
}
declare class RowGrandTotalCard extends FormattingSettingsCompositeCard {
    rowGrandTotalGroup: RowGrandTotalGroup;
    groups: FormattingSettingsCard[];
    name: string;
    displayName: string;
    constructor();
}
export declare class MeasureCard extends FormattingSettingsCard {
    headerTextColor: formattingSettings.ColorPicker;
    headerBackgroundColor: formattingSettings.ColorPicker;
    headerAlignment: formattingSettings.AlignmentGroup;
    totalTextColor: formattingSettings.ColorPicker;
    totalBackgroundColor: formattingSettings.ColorPicker;
    totalAlignment: formattingSettings.AlignmentGroup;
    valuesTextColor: formattingSettings.ColorPicker;
    valuesBackgroundColor: formattingSettings.ColorPicker;
    valuesAlignment: formattingSettings.AlignmentGroup;
    constructor(measureName: string, displayName: string);
}
declare class SpecificColumnCard extends formattingSettings.CompositeCard {
    groups: formattingSettings.Cards[];
    name: string;
    displayName: string;
    constructor();
    updateGroups(measureNames: string[]): void;
}
export declare class ColumnWidthCard extends formattingSettings.SimpleCard {
    name: string;
    displayName: string;
    slices: formattingSettings.Slice[];
    private rowHeaderWidth;
    private measureWidths;
    constructor();
    updateMeasureWidths(measureNames: string[]): void;
    getRowHeaderWidth(): number;
    getMeasureWidth(measureIndex: number): number;
}
export declare class VisualSettings extends FormattingSettingsModel {
    subTotals: SubtotalsCard;
    hideEmptyCols: HideEmptyColsCard;
    grid: GridCard;
    values: ValuesCard;
    columnHeaders: ColumnHeadersCard;
    rowHeaders: RowHeadersCard;
    columnGrandTotal: ColumnGrandTotalCard;
    rowGrandTotal: RowGrandTotalCard;
    specificColumn: SpecificColumnCard;
    columnWidth: ColumnWidthCard;
    borders: BordersCard;
    constructor();
}
export {};
