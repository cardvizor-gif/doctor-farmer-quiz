import { afterEach, describe, expect, it, vi } from "vitest";
import { printProposalAsPdf, teamFarmExportRows } from "./workspaceTransfer";

describe("proposal PDF print document", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("opens a dedicated printable document with proposal summary and scheme rows", () => {
    const write = vi.fn();
    const close = vi.fn();
    const open = vi.fn(() => ({ document: { write, close } }));
    vi.stubGlobal("window", { open });

    printProposalAsPdf({
      id: 0,
      title: "Тестовое КП <проверка>",
      crop: "Рапс",
      technology: "Классическая",
      area: "100",
      costPerHectare: "3340",
      totalCost: "334000",
      status: "draft",
      notes: "Проверка печатного макета",
      schemeJson: JSON.stringify({
        paymentTerm: "deferred",
        discountPercent: 2,
        seedTons: 110,
        manualRateOverrides: { "0-0": "0,4 л/га" },
        scheme: { steps: [{ stage: "1 обработка", task: "Защита", products: [{ name: "Тайсон, КС", rate: "0,3 л/га" }] }] },
        pricing: { lines: [{ key: "0-0", requirement: { label: "30 л" }, isManualPrice: true, maxTotal: 126000 }] },
      }),
    });

    expect(open).toHaveBeenCalledWith("", "_blank");
    expect(write).toHaveBeenCalledWith(expect.stringContaining("Doctor Farmer · коммерческое предложение"));
    expect(write).toHaveBeenCalledWith(expect.stringContaining("Тайсон, КС"));
    expect(write).toHaveBeenCalledWith(expect.stringContaining("Ручная"));
    expect(write).toHaveBeenCalledWith(expect.stringContaining("Ручные цены"));
    expect(write).toHaveBeenCalledWith(expect.stringContaining("Семена для протравливания"));
    expect(write).toHaveBeenCalledWith(expect.stringContaining("110 т"));
    expect(write).toHaveBeenCalledWith(expect.stringContaining("Изменена вручную"));
    expect(write).toHaveBeenCalledWith(expect.stringContaining("Тестовое КП &lt;проверка&gt;"));
    expect(close).toHaveBeenCalledOnce();
  });
});

describe("team farm Excel rows", () => {
  it("includes the owning manager together with farm fields in the administrative export", () => {
    const rows = teamFarmExportRows([{
      id: 1,
      ownerOpenId: "employee-1",
      managerName: "Светлана",
      managerEmail: "svetlana@example.com",
      name: "КФХ Север",
      district: "Ишимбайский",
      settlement: null,
      contactName: "Иван Петров",
      contactRole: null,
      phone: null,
      email: null,
      totalArea: "420.0",
      crops: "Ячмень",
      technology: null,
      salesStage: "proposal",
      potentialValue: "120000.00",
      nextAction: "Подготовить КП",
      nextActionAt: null,
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }]);

    expect(rows).toEqual([expect.objectContaining({
      "Менеджер": "Светлана",
      "E-mail менеджера": "svetlana@example.com",
      "Название хозяйства": "КФХ Север",
      "Площадь, га": 420,
      "Статус работы": "proposal",
    })]);
  });
});
