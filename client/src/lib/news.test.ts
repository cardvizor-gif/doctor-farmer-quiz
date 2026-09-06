import { describe, expect, it } from "vitest";
import { selectNewsNotifications } from "./news";

describe("selectNewsNotifications", () => {
  it("оставляет только записи типа news", () => {
    const items = [
      { id: 1, kind: "task" },
      { id: 2, kind: "news" },
      { id: 3, kind: "system" },
      { id: 4, kind: "news" },
    ];

    expect(selectNewsNotifications(items).map((item) => item.id)).toEqual([2, 4]);
  });
});
