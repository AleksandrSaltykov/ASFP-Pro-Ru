import { describe, expect, it } from "vitest";

import {
  addRecent,
  toggleTileFavorite,
  uiSlice
} from "./ui-slice";

const createState = () => uiSlice.getInitialState();

describe("uiSlice reducers", () => {
  it("adds recent items with deduplication", () => {
    const state = createState();

    const first = uiSlice.reducer(state, addRecent("/orders/42"));
    expect(first.recent[0]).toBe("/orders/42");

    const second = uiSlice.reducer(first, addRecent("/sales"));
    expect(second.recent[0]).toBe("/sales");
    expect(second.recent[1]).toBe("/orders/42");

    const third = uiSlice.reducer(second, addRecent("/sales"));
    expect(third.recent[0]).toBe("/sales");
    expect(third.recent.filter((item) => item === "/sales").length).toBe(1);
  });

  it("toggles tile favorites", () => {
    const state = createState();

    const added = uiSlice.reducer(state, toggleTileFavorite("tile:test"));
    expect(added.favoriteTiles).toContain("tile:test");

    const removed = uiSlice.reducer(added, toggleTileFavorite("tile:test"));
    expect(removed.favoriteTiles).not.toContain("tile:test");
  });
});
