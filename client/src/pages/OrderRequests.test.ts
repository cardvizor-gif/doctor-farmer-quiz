import { describe, expect, it } from "vitest";
import { requestProductPlaceholder } from "./OrderRequests";

describe("форма заявки: выбор препарата", () => {
  it("показывает понятный placeholder для пустой строки номенклатуры", () => {
    expect(requestProductPlaceholder).toBe("Выбрать препарат");
  });
});
