import { useState } from "react";

interface Props<T> {
  rows: T[];
  filename: string;
  sheetName?: string;
  label?: string;
  /** Sarakkeet ja niiden muotoilu (järjestys ja nimi). Jos ei annettu, käytetään kaikkia kenttiä. */
  columns?: Array<{ header: string; key: keyof T | ((row: T) => unknown); width?: number }>;
  disabled?: boolean;
}

export default function ExportXlsxButton<T extends Record<string, unknown>>({
  rows,
  filename,
  sheetName = "Data",
  label = "Vie Excel",
  columns,
  disabled = false,
}: Props<T>) {
  const [busy, setBusy] = useState(false);

  const handle = async () => {
    if (disabled || !rows.length) return;
    setBusy(true);
    try {
      const XLSX = await import("xlsx");
      let data: Record<string, unknown>[];
      if (columns && columns.length > 0) {
        data = rows.map((r) => {
          const obj: Record<string, unknown> = {};
          for (const c of columns) {
            const v = typeof c.key === "function" ? c.key(r) : r[c.key];
            obj[c.header] = v as unknown;
          }
          return obj;
        });
      } else {
        data = rows as unknown as Record<string, unknown>[];
      }
      const ws = XLSX.utils.json_to_sheet(data);
      if (columns) {
        ws["!cols"] = columns.map((c) => ({ wch: c.width ?? Math.max(10, c.header.length + 2) }));
      }
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
      XLSX.writeFile(wb, filename);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={handle}
      disabled={disabled || busy || rows.length === 0}
      className="xlsx-btn"
      title={`Lataa ${rows.length} riviä Excel-tiedostona`}
    >
      <span className="xlsx-icon" aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 24 24">
          <rect x="2" y="3" width="20" height="18" rx="2.5" fill="#107C41" />
          <path
            d="M 8 8 L 16 16 M 16 8 L 8 16"
            stroke="#ffffff"
            strokeWidth="2.2"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </span>
      <span>{busy ? "Viedään…" : label}</span>
      <span style={{ color: "rgba(255,255,255,0.75)", fontSize: 11, marginLeft: 4 }}>
        {rows.length.toLocaleString("fi-FI")} riviä
      </span>
    </button>
  );
}
