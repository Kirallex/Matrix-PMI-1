import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";
import FormattingSettingsCard = formattingSettings.SimpleCard;
import FormattingSettingsCompositeCard = formattingSettings.CompositeCard;
import FormattingSettingsSlice = formattingSettings.Slice;
import FormattingSettingsModel = formattingSettings.Model;
declare class SubtotalsCard extends FormattingSettingsCard {
    rowSubtotals: formattingSettings.ToggleSwitch;
    columnSubtotals: formattingSettings.ToggleSwitch;
    grandTotal: formattingSettings.ToggleSwitch;
    nonGrandTotal: formattingSettings.ToggleSwitch;
    name: string;
    displayName: string;
    slices: FormattingSettingsSlice[];
}
declare class HideEmptyColsCard extends FormattingSettingsCard {
    hideColsLabel: formattingSettings.ToggleSwitch;
    name: string;
    displayName: string;
    slices: FormattingSettingsSlice[];
}
declare class HorizontalGridlinesGroup extends FormattingSettingsCard {
    color: formattingSettings.ColorPicker;
    width: formattingSettings.NumUpDown;
    name: string;
    displayName: string;
    slices: FormattingSettingsSlice[];
}
declare class VerticalGridlinesGroup extends FormattingSettingsCard {
    color: formattingSettings.ColorPicker;
    width: formattingSettings.NumUpDown;
    name: string;
    displayName: string;
    slices: FormattingSettingsSlice[];
}
declare class BorderGroup extends FormattingSettingsCard {
    section: formattingSettings.ItemDropdown;
    positionTop: formattingSettings.ToggleSwitch;
    positionBottom: formattingSettings.ToggleSwitch;
    positionLeft: formattingSettings.ToggleSwitch;
    positionRight: formattingSettings.ToggleSwitch;
    color: formattingSettings.ColorPicker;
    width: formattingSettings.NumUpDown;
    name: string;
    displayName: string;
    slices: FormattingSettingsSlice[];
}
declare class OptionsGroup extends FormattingSettingsCard {
    rowPadding: formattingSettings.NumUpDown;
    globalFontSize: formattingSettings.NumUpDown;
    name: string;
    displayName: string;
    slices: FormattingSettingsSlice[];
}
declare class GridCard extends FormattingSettingsCompositeCard {
    horizontalGroup: HorizontalGridlinesGroup;
    verticalGroup: VerticalGridlinesGroup;
    borderGroup: BorderGroup;
    optionsGroup: OptionsGroup;
    groups: FormattingSettingsCard[];
    name: string;
    displayName: string;
    constructor();
}
declare class ValuesGroup extends FormattingSettingsCard {
    font: formattingSettings.FontControl;
    textColor: formattingSettings.ColorPicker;
    backgroundColor: formattingSettings.ColorPicker;
    altTextColor: formattingSettings.ColorPicker;
    altBackgroundColor: formattingSettings.ColorPicker;
    name: string;
    displayName: string;
    slices: FormattingSettingsSlice[];
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
    slices: FormattingSettingsSlice[];
}
declare class ColumnHeadersCard extends FormattingSettingsCompositeCard {
    columnHeadersGroup: ColumnHeadersGroup;
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
    slices: FormattingSettingsSlice[];
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
    slices: FormattingSettingsSlice[];
}
declare class ColumnGrandTotalCard extends FormattingSettingsCompositeCard {
    columnGrandTotalGroup: ColumnGrandTotalGroup;
    groups: FormattingSettingsCard[];
    name: string;
    displayName: string;
    constructor();
}
export declare class VisualSettings extends FormattingSettingsModel {
    subTotals: SubtotalsCard;
    hideEmptyCols: HideEmptyColsCard;
    grid: GridCard;
    values: ValuesCard;
    columnHeaders: ColumnHeadersCard;
    rowHeaders: RowHeadersCard;
    columnGrandTotal: ColumnGrandTotalCard;
    constructor();
}
export {};
