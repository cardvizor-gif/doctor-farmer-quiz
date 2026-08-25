import { afterEach, describe, expect, it, vi } from "vitest";
import { printProposalAsPdf } from "./workspaceTransfer";

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
        scheme: { steps: [{ stage: "1 обработка", task: "Защита", products: [{ name: "Тайсон, КС", rate: "0,3 л/га" }] }] },
        pricing: { lines: [{ key: "0-0", requirement: { label: "30 л" }, maxTotal: 126000 }] },
      }),
    });

    expect(open).toHaveBeenCalledWith("", "_blank");
    expect(write).toHaveBeenCalledWith(expect.stringContaining("Doctor Farmer · коммерческое предложение"));
    expect(write).toHaveBeenCalledWith(expect.stringContaining("Тайсон, КС"));
    expect(write).toHaveBeenCalledWith(expect.stringContaining("Тестовое КП &lt;проверка&gt;"));
    expect(close).toHaveBeenCalledOnce();
  });
});
