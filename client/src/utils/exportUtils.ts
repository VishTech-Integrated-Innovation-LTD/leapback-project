// ============================================================
// Fix: downloadCSV now accepts any typed interface array
// (no index signature required on your row interfaces)
// ============================================================

// ---------- CSV (no dependency) --------------------------------
// Accepts any array of objects — typed interfaces included
export const downloadCSV = (filename: string, rows: object[]) => {
  if (!rows.length) return;

  const first   = rows[0] as Record<string, unknown>;
  const headers = Object.keys(first);
  const escape  = (v: unknown) => {
    const s = String(v ?? '');
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };

  const csvLines = [
    headers.map(escape).join(','),
    ...rows.map(row =>
      headers.map(h => escape((row as Record<string, unknown>)[h])).join(',')
    ),
  ];

  const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, `${filename}.csv`);
};

// ---------- Excel (.xlsx) — requires the `xlsx` package --------
// Install once: npm install xlsx
export const downloadExcel = async (
  filename: string,
  sheets: { name: string; rows: object[] }[]
) => {
  const XLSX = (await import('xlsx')).default;

  const wb = XLSX.utils.book_new();
  for (const { name, rows } of sheets) {
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, name);
  }
  XLSX.writeFile(wb, `${filename}.xlsx`);
};

// ---------- Internal helper ------------------------------------
const triggerDownload = (blob: Blob, filename: string) => {
  const url  = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href  = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

// ---------- Per-entity row shapes (for autocomplete) ----------
// These are just for IDE hints — downloadCSV accepts them without errors now.

export interface QuoteExportRow {
  'Quote #':    string;
  Client:       string;
  Items:        number;
  'Amount (₦)': number;
  Status:       string;
  'Created At': string;
}

export interface InvoiceExportRow {
  'Invoice #':  string;
  Client:       string;
  'Quote Ref':  string;
  'Amount (₦)': number;
  Status:       string;
  'Due Date':   string;
  'Created At': string;
}

export interface ClientExportRow {
  'Client Name':    string;
  Email:            string;
  Phone:            string;
  'Contact Person': string;
  Address:          string;
  Label:            string;
  'Total Spent (₦)': number;
  'Created At':     string;
}

export interface InventoryExportRow {
  Name:                  string;
  Type:                  string;
  'Unit Price (₦)':      number;
  'Stock Qty':           number | string;
  'Low Stock Threshold': number | string;
  Availability:          string;
  'Created At':          string;
}
