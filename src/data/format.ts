const eurFmt0 = new Intl.NumberFormat("fi-FI", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const numFmt = new Intl.NumberFormat("fi-FI", { maximumFractionDigits: 0 });

export function formatEur(value: number | null | undefined): string {
  if (value == null) return "—";
  if (Math.abs(value) >= 1e9) return (value / 1e9).toFixed(2).replace(".", ",") + " mrd €";
  if (Math.abs(value) >= 1e6) return (value / 1e6).toFixed(1).replace(".", ",") + " M€";
  return eurFmt0.format(value);
}

export function formatEurExact(value: number | null | undefined): string {
  if (value == null) return "—";
  return eurFmt0.format(value);
}

export function formatNumber(value: number | null | undefined): string {
  if (value == null) return "—";
  return numFmt.format(value);
}

export function formatPercent(value: number | null | undefined, fractionDigits = 1): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return (value * 100).toFixed(fractionDigits).replace(".", ",") + " %";
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("fi-FI", { year: "numeric", month: "long", day: "numeric" });
}
