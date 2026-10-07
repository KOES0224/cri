/**
 * One CSV cell, quoted. Values a spreadsheet would run as a formula (leading =, @, tab, CR, or +/- that is not a plain
 * number or phone number) get a leading apostrophe, so an applicant cannot plant a formula in an admin's export.
 */
export function csvCell(value: unknown): string {
  const s = value === null || value === undefined ? "" : String(value);
  const formulaLike = /^[=@\t\r]/.test(s) || (/^[+-]/.test(s) && !/^[+-]?[\d\s().-]+$/.test(s));
  return `"${(formulaLike ? `'${s}` : s).replace(/"/g, '""')}"`;
}

/** Joins rows into a UTF-8 CSV with a BOM, so Excel and Google Sheets read Korean text. */
export function csvDocument(rows: unknown[][]): string {
  return "\uFEFF" + rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
}
