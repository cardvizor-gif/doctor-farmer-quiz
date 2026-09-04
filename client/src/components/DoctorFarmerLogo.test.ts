import { describe, expect, it } from "vitest";
import { monochromeLogoGeometry } from "./DoctorFarmerLogo";

describe("DoctorFarmerLogo monochrome geometry", () => {
  it("keeps the monochrome icon square", () => {
    expect(monochromeLogoGeometry.icon.width).toBe(monochromeLogoGeometry.icon.height);
  });

  it("keeps the center cutout square and inside the icon", () => {
    const { icon, cutout } = monochromeLogoGeometry;

    expect(cutout.width).toBe(cutout.height);
    expect(cutout.x).toBeGreaterThan(icon.x);
    expect(cutout.y).toBeGreaterThan(icon.y);
    expect(cutout.x + cutout.width).toBeLessThan(icon.x + icon.width);
    expect(cutout.y + cutout.height).toBeLessThan(icon.y + icon.height);
  });
});
