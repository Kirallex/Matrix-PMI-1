export interface IMeasureSettings {
    textColor: string;
    backgroundColor: string;
    alignment: string;
    applyToHeader: boolean;
    applyToTotal: boolean;
    applyToValues: boolean;
}

export const defaultMeasureSettings: IMeasureSettings = {
    textColor: "#1E2323",
    backgroundColor: "#FFFFFF",
    alignment: "left",
    applyToHeader: false,
    applyToTotal: false,
    applyToValues: false
};