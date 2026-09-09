// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SalesPlanWidget } from "./Dashboard";

describe("approved dashboard sales plan widget", () => {
  it("renders the regional scope and honest empty state", () => {
    render(
      <SalesPlanWidget
        isConfigured={false}
        percent={null}
        fact={null}
        planTarget={null}
        planScopeLabel="План региона"
      />
    );

    expect(screen.getByText("План региона")).toBeTruthy();
    expect(screen.getByText("План не задан")).toBeTruthy();
    expect(screen.getByText("Источник данных не подключён")).toBeTruthy();
  });

  it("renders a configured personal plan without changing the role scope", () => {
    render(
      <SalesPlanWidget
        isConfigured
        percent={68}
        fact={3240000}
        planTarget={4500000}
        planScopeLabel="Личный план"
      />
    );

    expect(screen.getByText("Личный план")).toBeTruthy();
    expect(screen.getByText("68%")).toBeTruthy();
    expect(screen.getByText("3240000 ₽")).toBeTruthy();
    expect(screen.getByText("из 4500000 ₽")).toBeTruthy();
  });
});
