import { describe, expect, it } from "vitest";
import { quickActionTitles } from "./QuickActionSheet";

describe("QuickActionSheet", () => {
  it("содержит три согласованных встроенных действия", () => {
    expect(quickActionTitles).toEqual({
      client: "Новый клиент",
      meeting: "Новая встреча",
      call: "Новый звонок",
    });
  });
});
