import "@testing-library/jest-dom";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { authSlice } from "@shared/api/auth-slice";
import { uiSlice } from "@shared/state/ui-slice";

import { KioskShell } from "./KioskShell";

const createStore = () =>
  configureStore({
    reducer: {
      auth: authSlice.reducer,
      ui: uiSlice.reducer
    }
  });

describe("KioskShell", () => {
  beforeAll(() => {
    vi.useFakeTimers();
  });

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.clearAllMocks();
  });

  it("queues scans offline and flushes when connection restores", async () => {
    const store = createStore();
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});

    Object.defineProperty(window.navigator, "onLine", { value: false, configurable: true });

    render(
      <Provider store={store}>
        <KioskShell tiles={[]} />
      </Provider>
    );

    await act(async () => {
      window.dispatchEvent(new Event("offline"));
    });

    const input = screen.getByRole("textbox", { name: /scan input field/i });
    fireEvent.change(input, { target: { value: "ABC123" } });

    const form = screen.getByRole("form", { name: /scan workstation order form/i });
    fireEvent.submit(form);

    expect(screen.getByTestId("kiosk-queue-size")).toHaveTextContent("1");

    Object.defineProperty(window.navigator, "onLine", { value: true, configurable: true });

    await act(async () => {
      window.dispatchEvent(new Event("online"));
    });

    expect(screen.getByText(/online/i)).toBeInTheDocument();

    await act(async () => {
      vi.runAllTimers();
    });

    expect(screen.getByTestId("kiosk-queue-size")).toHaveTextContent("0");
    expect(infoSpy).toHaveBeenCalledWith(
      "[telemetry] kiosk_scan",
      expect.objectContaining({ code: "ABC123" })
    );
  });

  it("enqueues tile actions as status events", async () => {
    const store = createStore();
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});

    render(
      <Provider store={store}>
        <KioskShell
          tiles={[
            { id: "start", title: "Start / Pause", description: "Toggle production activity" }
          ]}
        />
      </Provider>
    );

    fireEvent.click(screen.getByRole("button", { name: /start \/ pause/i }));

    await act(async () => {
      vi.runAllTimers();
    });

    expect(infoSpy).toHaveBeenCalledWith(
      "[telemetry] tile_click",
      expect.objectContaining({ tileId: "start" })
    );
  });
});
