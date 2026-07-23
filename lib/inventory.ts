// Crates are a derived view over a single running total (warehouse_qty),
// not a separately tracked count - "opening a new crate" falls out of the
// division for free whenever the total drops below a case boundary.
export function formatAsCrates(qty: number, unitsPerCase: number): string {
  if (unitsPerCase <= 1) return String(qty);
  const crates = Math.floor(qty / unitsPerCase);
  const loose = qty % unitsPerCase;
  if (crates === 0) return `${loose}`;
  if (loose === 0) return `${crates} crate${crates === 1 ? "" : "s"}`;
  return `${crates} crate${crates === 1 ? "" : "s"} + ${loose}`;
}
