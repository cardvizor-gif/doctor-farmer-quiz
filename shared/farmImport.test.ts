import { describe, expect, it } from "vitest";
import { getMissingFarmImportColumns, previewFarmImportRows } from "./farmImport";

describe("farm Excel import preview", () => {
  it("maps a valid template row to the same farm payload used by the card form", () => {
    const rows = previewFarmImportRows([{
      "Название хозяйства *": "Тестовое хозяйство",
      "Район": "Район",
      "Площадь, га": "1 250,5",
      "Статус работы": "КП готовится",
      "Потенциал, ₽": "250000",
      "Дата следующего действия": "2026-09-01",
    }]);

    expect(rows[0]).toMatchObject({ rowNumber: 2, name: "Тестовое хозяйство", totalArea: 1250.5, errors: [] });
    expect(rows[0]?.farm).toMatchObject({ salesStage: "proposal", potentialValue: 250000, totalArea: 1250.5 });
  });

  it("blocks a row with an empty name, invalid email or a negative area before any write", () => {
    const rows = previewFarmImportRows([{
      "Название хозяйства *": "",
      "E-mail": "not-an-email",
      "Площадь, га": "-1",
    }]);

    expect(rows[0]?.farm).toBeUndefined();
    expect(rows[0]?.errors.length).toBeGreaterThanOrEqual(3);
  });

  it("ignores fully blank rows left by the official Excel template", () => {
    const rows = previewFarmImportRows([
      { "Название хозяйства *": "", "Район": "", "Площадь, га": "" },
      { "Название хозяйства *": "Хозяйство после пустой строки", "Площадь, га": "500" },
    ]);

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ rowNumber: 3, name: "Хозяйство после пустой строки", totalArea: 500, errors: [] });
  });

  it("requires the identifying column from the official template", () => {
    expect(getMissingFarmImportColumns(["Район", "Площадь, га"])).toEqual(["Название хозяйства *"]);
    expect(getMissingFarmImportColumns(["Название хозяйства *", "Район"])).toEqual([]);
  });
});
