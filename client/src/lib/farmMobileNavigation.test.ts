import { describe, expect, it } from "vitest";
import {
  FARMS_MOBILE_BREAKPOINT,
  getFarmReturnState,
  getFarmSelectionState,
  isFarmsMobileViewport,
} from "./farmMobileNavigation";

describe("mobile farms master-detail navigation", () => {
  it("treats 768px as mobile and keeps wider desktop view unchanged", () => {
    expect(FARMS_MOBILE_BREAKPOINT).toBe(768);
    expect(isFarmsMobileViewport(375)).toBe(true);
    expect(isFarmsMobileViewport(768)).toBe(true);
    expect(isFarmsMobileViewport(769)).toBe(false);
  });

  it("opens a selected farm as a detail screen and preserves list scroll", () => {
    expect(getFarmSelectionState(true, 412)).toEqual({
      mobileView: "detail",
      listScrollTop: 412,
    });
  });

  it("returns to the list with the previous scroll position", () => {
    expect(getFarmReturnState(680)).toEqual({
      mobileView: "list",
      listScrollTop: 680,
    });
    expect(getFarmReturnState(-10).listScrollTop).toBe(0);
  });

  it("does not switch desktop to a separate detail view", () => {
    expect(getFarmSelectionState(false, 220)).toEqual({
      mobileView: "list",
      listScrollTop: 0,
    });
  });
});
