export const FARMS_MOBILE_BREAKPOINT = 768;

export type FarmsMobileView = "list" | "detail";

export function isFarmsMobileViewport(width: number) {
  return width <= FARMS_MOBILE_BREAKPOINT;
}

export function getFarmSelectionState(isMobile: boolean, scrollTop: number) {
  return {
    mobileView: (isMobile ? "detail" : "list") as FarmsMobileView,
    listScrollTop: isMobile ? Math.max(0, scrollTop) : 0,
  };
}

export function getFarmReturnState(scrollTop: number) {
  return {
    mobileView: "list" as FarmsMobileView,
    listScrollTop: Math.max(0, scrollTop),
  };
}
