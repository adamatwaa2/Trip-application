import type { SeatLayout } from "./types";

/**
 * Toyota Hiace, 14 seats — the geometry from the original Planet Infinity seat
 * booking sheet, preserved exactly:
 *
 *   driver | 1
 *   2  3   | 4
 *   5  6   | 7
 *   8  9   | 10
 *   11 12 13 14        (back row, no aisle)
 *
 * A layout is data, not markup. Other vehicles get their own entry here; no
 * component hardcodes a seat arrangement.
 */
export const HIACE_14: SeatLayout = {
  label: "Toyota Hiace · 14 seats",
  rows: [
    { left: ["driver"], right: [1] },
    { left: [2, 3], right: [4] },
    { left: [5, 6], right: [7] },
    { left: [8, 9], right: [10] },
    { left: [11, 12, 13, 14], right: [], contiguous: true },
  ],
};

/** Every seat number in a layout, in order. */
export function seatNumbers(layout: SeatLayout): number[] {
  return layout.rows.flatMap((row) =>
    [...row.left, ...row.right].filter((s): s is number => typeof s === "number")
  );
}
