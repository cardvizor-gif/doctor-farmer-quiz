// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MobileMenuDismissal } from "./CabinetShell";

describe("MobileMenuDismissal interactions", () => {
  it("closes on a tap outside the drawer", () => {
    const onClose = vi.fn();
    render(
      <MobileMenuDismissal isOpen onClose={onClose}>
        <aside aria-label="Мобильное меню">Меню</aside>
      </MobileMenuDismissal>
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Закрыть боковое меню" })
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes on a horizontal swipe left", () => {
    const onClose = vi.fn();
    const { container } = render(
      <MobileMenuDismissal isOpen onClose={onClose}>
        <aside aria-label="Мобильное меню">Меню</aside>
      </MobileMenuDismissal>
    );
    const drawerLayer = container.firstElementChild as HTMLElement;

    fireEvent.touchStart(drawerLayer, {
      changedTouches: [{ clientX: 180, clientY: 220 }],
    });
    fireEvent.touchEnd(drawerLayer, {
      changedTouches: [{ clientX: 100, clientY: 226 }],
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not close on a mostly vertical gesture", () => {
    const onClose = vi.fn();
    const { container } = render(
      <MobileMenuDismissal isOpen onClose={onClose}>
        <aside aria-label="Мобильное меню">Меню</aside>
      </MobileMenuDismissal>
    );
    const drawerLayer = container.firstElementChild as HTMLElement;

    fireEvent.touchStart(drawerLayer, {
      changedTouches: [{ clientX: 180, clientY: 220 }],
    });
    fireEvent.touchEnd(drawerLayer, {
      changedTouches: [{ clientX: 150, clientY: 310 }],
    });

    expect(onClose).not.toHaveBeenCalled();
  });
});
