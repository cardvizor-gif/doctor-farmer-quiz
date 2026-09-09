import { describe, expect, it } from "vitest";
import { catalogProductToPriceItem, catalogProductToPriceRecord } from "./catalog";

const product = {
  catalogId: "DF-101",
  name: "Тестовый препарат, КС",
  category: "СЗР",
  productGroup: "Гербицид",
  active: 1,
  pricePrepayment: "100.00",
  price5050: "102.00",
  price7030: "104.00",
  priceDeferred: "106.00",
  fullDataJson: JSON.stringify({
    "Действующее вещество": "480 г/л вещества",
    "Культуры": "Пшеница; Кукуруза",
    "Норма от": "0,5",
    "Норма до": "1,0",
    "Единица нормы": "л/га",
    "Фаза и время обработки": "2–4 листа",
    "Вредные объекты": "Двудольные сорняки",
    "Условия применения": "Температура выше +10 °C",
    "Ограничения и требования": "Не применять в стрессовых посевах",
  }),
};

describe("catalog adapters", () => {
  it("maps full regulation data into the knowledge-base shape", () => {
    const item = catalogProductToPriceItem(product);
    expect(item).toMatchObject({ name: product.name, dv: "480 г/л вещества", rate: "0,5–1,0 л/га", cultures: ["Пшеница", "Кукуруза"] });
    expect(item.regulation?.objects).toBe("Двудольные сорняки");
  });

  it("maps prices and package units for proposal calculations", () => {
    const record = catalogProductToPriceRecord({ ...product, fullDataJson: JSON.stringify({ "Единица продажи": "упаковка", "Норма для отображения": "10–12 га" }) });
    expect(record).toMatchObject({ prepayment: 100, payment3070: 104, deferred: 106, priceUnit: "package", sourceRate: "10–12 га" });
  });
});
