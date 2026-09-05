import { describe, expect, it } from "vitest";
import { accessDialogOverlayClasses, accessDialogPanelClasses } from "./AccessPortalDialog";

describe("AccessPortalDialog mobile layout", () => {
  it("keeps the overlay vertically scrollable above the fixed mobile navigation", () => {
    expect(accessDialogOverlayClasses).toContain("z-[300]");
    expect(accessDialogOverlayClasses).toContain("overflow-y-auto");
    expect(accessDialogOverlayClasses).toContain("pb-[calc(5.5rem+env(safe-area-inset-bottom))]");
    expect(accessDialogOverlayClasses).toContain("sm:overflow-hidden");
  });

  it("makes the access panel scrollable within the dynamic mobile viewport", () => {
    expect(accessDialogPanelClasses).toContain("max-h-[calc(100dvh-2rem)]");
    expect(accessDialogPanelClasses).toContain("overflow-y-auto");
    expect(accessDialogPanelClasses).toContain("pb-[calc(1.5rem+env(safe-area-inset-bottom))]");
    expect(accessDialogPanelClasses).toContain("sm:max-h-none");
  });
});
