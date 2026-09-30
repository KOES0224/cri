"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpDown, Check, ChevronDown, ChevronUp, Columns3, Download, ExternalLink, Loader2, Rows3, Search, Trash2, X } from "lucide-react";
import { deleteApplication, updateApplicationProcessingFields } from "@/app/actions/adminApplications";
import { applicationLabels } from "@/lib/application-validation";
import type { SheetRow } from "@/lib/admin-sheet";
import { formatKST } from "@/lib/formatKST";

/*
 * Full-screen applications sheet.
 * - One fixed-layout table: every cell clips its own content (no text runs into the next column).
 * - Column widths are dragged on the header edge; row height is a three-way switch (1 line / 3 lines / full).
 * - Clicking a read-only cell opens the whole record in a side panel with the clicked field in view.
 * - Pipeline fields (final course, stage, dates, comments) are edited in place, as before.
 * - Export CSV writes the filtered rows with every column, UTF-8 with BOM so Excel and Google Sheets read Korean.
 * Preferences (widths, hidden columns, row height) persist in localStorage.
 */

type RowMode = "compact" | "cozy" | "full";
type Kind = "text" | "date" | "stage" | "course" | "textarea" | "applicant" | "resume" | "fee" | "actions";
type Column = { key: string; label: string; width: number; kind: Kind; sticky?: boolean; get: (r: SheetRow) => string };

const STAGES = ["REVIEW", "INTERVIEW", "PAYMENT", "ENROLLED", "REJECTED"];
const PREFS_KEY = "cri.admin.sheet.v1";
const MIN_WIDTH = 72;
/** Form fields in the order admissions reads them; anything else the form ever stored is appended after. */
const FORM_ORDER = [
  "studentFirstName", "studentLastName", "studentEmail", "studentPhone", "studentLevel", "residenceCountry", "school", "gradYear", "gender", "tShirtSize", "photoConsent",
  "parentFirstName", "parentLastName", "parentEmail", "parentPhone",
  "areaOfInterest", "initialTopicIdeas", "essay", "shortAnswer", "firstChoiceProfessor", "secondChoiceProfessor", "thirdChoiceProfessor", "previousResearch", "howLearned",
];
const FORM_HIDDEN = new Set(["payment", "resumeUrl", "resumeDriveUrl"]);
const WIDE_FIELDS = new Set(["initialTopicIdeas", "essay", "shortAnswer", "previousResearch", "interviewComments", "generalComments"]);

const str = (v: unknown) => (v === null || v === undefined ? "" : typeof v === "object" ? JSON.stringify(v) : String(v));
const day = (v: string | null | undefined) => (v ? v.slice(0, 10) : "");
const fee = (r: SheetRow) => {
  const p = (r.form.payment && typeof r.form.payment === "object" ? r.form.payment : {}) as Record<string, unknown>;
  if (!p.feeStatus && !p.amount) return "";
  return `${str(p.feeStatus) || "PAID"}${p.amount ? ` · ${str(p.amount)} ${str(p.currency) || "USD"}` : ""}`;
};

function buildColumns(rows: SheetRow[]): Column[] {
  const formKeys = new Set<string>();
  for (const r of rows) for (const k of Object.keys(r.form)) if (!FORM_HIDDEN.has(k)) formKeys.add(k);
  const ordered = [...FORM_ORDER.filter((k) => formKeys.has(k)), ...Array.from(formKeys).filter((k) => !FORM_ORDER.includes(k)).sort()];
  return [
    { key: "actions", label: "", width: 44, kind: "actions", sticky: true, get: () => "" },
    { key: "applicant", label: "Applicant", width: 220, kind: "applicant", sticky: true, get: (r) => `${r.user.name || ""} <${r.user.email}>` },
    { key: "submittedAt", label: "Submitted", width: 110, kind: "text", get: (r) => formatKST(r.createdAt, "yyyy-MM-dd") },
    { key: "program", label: "Program", width: 240, kind: "text", get: (r) => r.program.title },
    { key: "finalRegisteredCourse", label: "Final course", width: 220, kind: "course", get: (r) => r.finalRegisteredCourse || "" },
    { key: "stage", label: "Stage", width: 130, kind: "stage", get: (r) => r.stage || "REVIEW" },
    { key: "status", label: "Decision", width: 110, kind: "text", get: (r) => r.status },
    { key: "interviewDate", label: "Interview date", width: 140, kind: "date", get: (r) => day(r.interviewDate) },
    { key: "paymentDeadline", label: "Payment deadline", width: 150, kind: "date", get: (r) => day(r.paymentDeadline) },
    { key: "interviewComments", label: "Interview comments", width: 260, kind: "textarea", get: (r) => r.interviewComments || "" },
    { key: "generalComments", label: "General comments", width: 260, kind: "textarea", get: (r) => r.generalComments || "" },
    { key: "fee", label: "Fee", width: 150, kind: "fee", get: fee },
    { key: "resume", label: "Resume", width: 120, kind: "resume", get: (r) => str(r.form.resumeDriveUrl) || (typeof r.form.resumeUrl === "string" && r.form.resumeUrl ? `${window.location.origin}${r.form.resumeUrl}` : "") },
    { key: "studentCode", label: "Student code", width: 120, kind: "text", get: (r) => r.user.studentCode || "" },
    ...ordered.map<Column>((k) => ({ key: `form.${k}`, label: applicationLabels[k] || k, width: WIDE_FIELDS.has(k) ? 320 : 160, kind: "text", get: (r) => str(r.form[k]) })),
    { key: "id", label: "Application ID", width: 220, kind: "text", get: (r) => r.id },
  ];
}

function csvFor(rows: SheetRow[], columns: Column[]) {
  const cols = columns.filter((c) => c.kind !== "actions");
  // Values a spreadsheet would run as a formula get a leading apostrophe; "+82 10…" phone numbers and negative numbers are left alone.
  const formulaLike = (v: string) => /^[=@\t\r]/.test(v) || /^[+-](?![\d\s(])/.test(v);
  const cell = (v: string) => `"${(formulaLike(v) ? `'${v}` : v).replace(/"/g, '""')}"`;
  const lines = [cols.map((c) => cell(c.label)).join(",")];
  for (const r of rows) lines.push(cols.map((c) => cell(c.get(r))).join(","));
  return "﻿" + lines.join("\r\n");
}

export default function ApplicationsSheet({ rows: initialRows, programs }: { rows: SheetRow[]; programs: string[] }) {
  const [rows, setRows] = useState(initialRows);
  useEffect(() => setRows(initialRows), [initialRows]);
  const base = useMemo(() => buildColumns(rows), [rows]);

  // Preferences
  const [widths, setWidths] = useState<Record<string, number>>({});
  const [hidden, setHidden] = useState<string[]>([]);
  const [rowMode, setRowMode] = useState<RowMode>("cozy");
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(PREFS_KEY) || "{}");
      if (saved.widths) setWidths(saved.widths);
      if (Array.isArray(saved.hidden)) setHidden(saved.hidden);
      if (saved.rowMode) setRowMode(saved.rowMode);
    } catch {}
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(PREFS_KEY, JSON.stringify({ widths, hidden, rowMode })); } catch {}
  }, [loaded, widths, hidden, rowMode]);

  const columns = useMemo(() => base.map((c) => ({ ...c, width: widths[c.key] || c.width })).filter((c) => !hidden.includes(c.key)), [base, widths, hidden]);
  const stickyLeft = useMemo(() => { let left = 0; const map: Record<string, number> = {}; for (const c of columns) { if (!c.sticky) break; map[c.key] = left; left += c.width; } return map; }, [columns]);
  const tableWidth = columns.reduce((sum, c) => sum + c.width, 0);

  // Filters and sort
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("ALL");
  const [programFilter, setProgramFilter] = useState("ALL");
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 } | null>(null);
  const programTitles = useMemo(() => Array.from(new Set(initialRows.map((r) => r.program.title))).sort(), [initialRows]);
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = rows.filter((r) => {
      if (stageFilter !== "ALL" && (r.stage || "REVIEW") !== stageFilter) return false;
      if (programFilter !== "ALL" && r.program.title !== programFilter) return false;
      if (!q) return true;
      const hay = `${r.user.name || ""} ${r.user.email} ${r.program.title} ${str(r.form.studentFirstName)} ${str(r.form.studentLastName)} ${str(r.form.studentEmail)} ${str(r.form.school)} ${r.user.studentCode || ""}`.toLowerCase();
      return hay.includes(q);
    });
    if (sort) {
      const col = base.find((c) => c.key === sort.key);
      if (col) list = [...list].sort((a, b) => col.get(a).localeCompare(col.get(b), undefined, { numeric: true }) * sort.dir);
    }
    return list;
  }, [rows, search, stageFilter, programFilter, sort, base]);

  // Column resize by dragging the header edge
  const drag = useRef<{ key: string; startX: number; startWidth: number } | null>(null);
  const onResizeStart = (key: string, width: number) => (event: React.PointerEvent) => {
    event.preventDefault();
    drag.current = { key, startX: event.clientX, startWidth: width };
    // The state updater runs later, possibly after pointerup cleared the drag, so the key is captured here.
    const move = (e: PointerEvent) => { if (!drag.current) return; const { key: k, startWidth, startX } = drag.current; const next = Math.max(MIN_WIDTH, startWidth + e.clientX - startX); setWidths((w) => ({ ...w, [k]: next })); };
    const up = () => { drag.current = null; window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); window.removeEventListener("pointercancel", up); };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  };

  // Inline edits of the pipeline fields
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [saveNote, setSaveNote] = useState<{ text: string; ok: boolean } | null>(null);
  const save = useCallback(async (row: SheetRow, field: "stage" | "finalRegisteredCourse" | "interviewDate" | "paymentDeadline" | "interviewComments" | "generalComments", value: string) => {
    if (saving[row.id]) return;
    const enrollment = field === "stage" && value === "ENROLLED";
    if (enrollment && !window.confirm("Mark as ENROLLED? Confirm that admission, tuition arrangements and registration have been verified.")) return;
    const payload = field === "interviewDate" || field === "paymentDeadline" ? { [field]: value ? new Date(value) : null } : { [field]: value };
    const previous = row;
    setSaving((s) => ({ ...s, [row.id]: true }));
    setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, [field]: field.endsWith("Date") || field.endsWith("Deadline") ? (value ? new Date(value).toISOString() : null) : value } : r)));
    try {
      const result = await updateApplicationProcessingFields(row.id, payload, row.updatedAt, enrollment);
      if (!result.success) throw new Error(result.error || "Could not save.");
      setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, updatedAt: String(result.updatedAt ?? r.updatedAt), status: result.status ?? r.status, stage: result.stage ?? r.stage } : r)));
      setSaveNote({ text: "Saved", ok: true });
    } catch (error) {
      setRows((rs) => rs.map((r) => (r.id === row.id ? previous : r)));
      setSaveNote({ text: error instanceof Error ? error.message : "Could not save.", ok: false });
    } finally {
      setSaving((s) => { const n = { ...s }; delete n[row.id]; return n; });
    }
  }, [saving]);

  const remove = async (row: SheetRow) => {
    if (!window.confirm(`Delete the application of ${row.user.name || row.user.email}? This cannot be undone.`)) return;
    const kept = rows;
    setRows((rs) => rs.filter((r) => r.id !== row.id));
    const result = await deleteApplication(row.id);
    if (!result.success) { setRows(kept); setSaveNote({ text: result.error || "Delete failed.", ok: false }); }
  };

  // Side panel with the whole record
  const [detail, setDetail] = useState<{ id: string; key: string } | null>(null);
  const detailRow = detail ? rows.find((r) => r.id === detail.id) : null;
  useEffect(() => {
    if (!detail) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setDetail(null); };
    window.addEventListener("keydown", onKey);
    document.getElementById(`detail-${detail.key}`)?.scrollIntoView({ block: "center" });
    return () => window.removeEventListener("keydown", onKey);
  }, [detail]);

  const [showColumns, setShowColumns] = useState(false);

  const exportCsv = () => {
    const blob = new Blob([csvFor(visible, base)], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `CRI-applications-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  };

  // line-clamp sets its own display (-webkit-box), so the block class is only added where clamping is off.
  const textClass = rowMode === "compact" ? "block truncate" : rowMode === "cozy" ? "line-clamp-3 whitespace-pre-wrap break-words" : "block whitespace-pre-wrap break-words";
  const textareaRows = rowMode === "compact" ? 1 : rowMode === "cozy" ? 3 : 8;
  const inputClass = "w-full rounded-md border border-transparent bg-transparent px-1.5 py-1 text-[13px] text-slate-800 hover:border-slate-200 focus:border-blue-500 focus:bg-white focus:outline-none";

  return (
    <div className="flex h-screen flex-col bg-slate-100 text-slate-900">
      <header className="flex shrink-0 flex-wrap items-center gap-3 border-b border-slate-200 bg-white px-4 py-2.5">
        <div className="mr-2">
          <div className="text-sm font-black tracking-tight">CRI Admin · Applications</div>
          <div className="text-[11px] text-slate-500">{visible.length} of {rows.length} applications</div>
        </div>
        <label className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, email, school…" className="w-64 rounded-lg border border-slate-200 py-1.5 pl-8 pr-3 text-sm focus:border-blue-500 focus:outline-none" />
        </label>
        <select value={stageFilter} onChange={(e) => setStageFilter(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm">
          <option value="ALL">All stages</option>
          {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={programFilter} onChange={(e) => setProgramFilter(e.target.value)} className="max-w-[240px] rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm">
          <option value="ALL">All programs</option>
          {programTitles.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>

        <div className="ml-auto flex items-center gap-2">
          {saveNote && <span role="status" className={`text-xs font-semibold ${saveNote.ok ? "text-emerald-700" : "text-red-700"}`}>{saveNote.ok ? <Check className="mr-1 inline h-3.5 w-3.5" /> : null}{saveNote.text}</span>}
          <div className="flex items-center rounded-lg border border-slate-200 bg-white p-0.5" role="group" aria-label="Row height">
            <Rows3 className="mx-1.5 h-4 w-4 text-slate-400" />
            {(["compact", "cozy", "full"] as RowMode[]).map((m) => (
              <button key={m} type="button" onClick={() => setRowMode(m)} aria-pressed={rowMode === m} className={`rounded-md px-2 py-1 text-xs font-semibold ${rowMode === m ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}>
                {m === "compact" ? "1 line" : m === "cozy" ? "3 lines" : "Full"}
              </button>
            ))}
          </div>
          <div className="relative">
            <button type="button" onClick={() => setShowColumns((v) => !v)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold hover:bg-slate-50">
              <Columns3 className="h-4 w-4" /> Columns{hidden.length > 0 && <span className="rounded-full bg-slate-900 px-1.5 text-[10px] text-white">{hidden.length} hidden</span>}
            </button>
            {showColumns && (
              <div className="absolute right-0 z-50 mt-1 max-h-[70vh] w-72 overflow-auto rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
                <div className="flex items-center justify-between px-2 py-1 text-xs text-slate-500">
                  <span>Show columns</span>
                  <button type="button" onClick={() => { setHidden([]); setWidths({}); }} className="font-semibold text-blue-700 hover:underline">Reset all</button>
                </div>
                {base.filter((c) => c.kind !== "actions").map((c) => (
                  <label key={c.key} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-slate-50">
                    <input type="checkbox" checked={!hidden.includes(c.key)} onChange={(e) => setHidden((h) => (e.target.checked ? h.filter((k) => k !== c.key) : [...h, c.key]))} className="h-4 w-4 accent-slate-900" />
                    <span className="truncate">{c.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
          <button type="button" onClick={exportCsv} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-black">
            <Download className="h-4 w-4" /> Export CSV
          </button>
          <a href="/dashboard/applications-admin" className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold hover:bg-slate-50">Admin</a>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <div className="min-w-0 flex-1 overflow-auto">
          <table className="border-separate border-spacing-0 text-[13px]" style={{ tableLayout: "fixed", width: tableWidth }}>
            <colgroup>{columns.map((c) => <col key={c.key} style={{ width: c.width }} />)}</colgroup>
            <thead>
              <tr>
                {columns.map((c) => (
                  <th key={c.key} scope="col" style={c.sticky ? { left: stickyLeft[c.key] } : undefined} className={`sticky top-0 border-b border-r border-slate-200 bg-slate-50 px-2 py-2 text-left text-xs font-semibold text-slate-600 ${c.sticky ? "z-30" : "z-20"}`}>
                    <div className="flex items-center gap-1 overflow-hidden">
                      {c.kind === "actions" ? <span className="sr-only">Actions</span> : (
                        <button type="button" onClick={() => setSort((s) => (s?.key === c.key ? (s.dir === 1 ? { key: c.key, dir: -1 } : null) : { key: c.key, dir: 1 }))} className="flex min-w-0 items-center gap-1 truncate hover:text-slate-900" title={`Sort by ${c.label}`}>
                          <span className="truncate">{c.label}</span>
                          {sort?.key === c.key ? (sort.dir === 1 ? <ChevronUp className="h-3 w-3 shrink-0" /> : <ChevronDown className="h-3 w-3 shrink-0" />) : <ArrowUpDown className="h-3 w-3 shrink-0 text-slate-300" />}
                        </button>
                      )}
                    </div>
                    {c.kind !== "actions" && <span role="separator" aria-orientation="vertical" onPointerDown={onResizeStart(c.key, c.width)} onDoubleClick={() => setWidths((w) => { const n = { ...w }; delete n[c.key]; return n; })} className="absolute right-0 top-0 h-full w-2 cursor-col-resize touch-none select-none hover:bg-blue-400/40" title="Drag to resize · double-click to reset" />}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white">
              {visible.map((r) => (
                <tr key={r.id} className={`group ${saving[r.id] ? "opacity-60" : ""}`}>
                  {columns.map((c) => {
                    const stickyStyle = c.sticky ? { left: stickyLeft[c.key] } : undefined;
                    const cellClass = `border-b border-r border-slate-200 p-0 align-top ${c.sticky ? "sticky z-10 bg-white group-hover:bg-blue-50" : "group-hover:bg-blue-50/20"}`;
                    if (c.kind === "actions") return <td key={c.key} style={stickyStyle} className={cellClass}><button type="button" onClick={() => void remove(r)} title="Delete application" className="flex h-full w-full items-start justify-center px-2 py-2 text-slate-300 hover:text-red-600"><Trash2 className="h-4 w-4" /></button></td>;
                    if (c.kind === "applicant") return <td key={c.key} style={stickyStyle} className={cellClass}><button type="button" onClick={() => setDetail({ id: r.id, key: "applicant" })} className="block w-full overflow-hidden px-2 py-1.5 text-left hover:bg-blue-50"><div className="truncate font-semibold text-slate-900">{r.user.name || "—"}</div><div className="truncate text-[11px] text-slate-500">{r.user.email}</div></button></td>;
                    if (c.kind === "stage") return <td key={c.key} className={cellClass}><select disabled={!!saving[r.id]} value={r.stage || "REVIEW"} onChange={(e) => void save(r, "stage", e.target.value)} className={`${inputClass} font-bold ${r.stage === "ENROLLED" ? "text-emerald-700" : r.stage === "REJECTED" ? "text-red-600" : r.stage === "PAYMENT" ? "text-amber-700" : "text-blue-700"}`}>{STAGES.map((s) => <option key={s} value={s}>{s}</option>)}</select></td>;
                    if (c.kind === "course") return <td key={c.key} className={cellClass}><select disabled={!!saving[r.id]} value={r.finalRegisteredCourse || ""} onChange={(e) => void save(r, "finalRegisteredCourse", e.target.value)} className={inputClass}><option value="">—</option>{programs.map((p) => <option key={p} value={p}>{p}</option>)}</select></td>;
                    if (c.kind === "date") { const field = c.key as "interviewDate" | "paymentDeadline"; return <td key={c.key} className={cellClass}><input disabled={!!saving[r.id]} type="date" value={day(r[field])} onChange={(e) => void save(r, field, e.target.value)} className={`${inputClass} font-mono`} /></td>; }
                    if (c.kind === "textarea") { const field = c.key as "interviewComments" | "generalComments"; return <td key={c.key} className={cellClass}><textarea key={`${r.id}-${field}-${rowMode}`} disabled={!!saving[r.id]} rows={textareaRows} defaultValue={r[field] || ""} onBlur={(e) => { if (e.target.value !== (r[field] || "")) void save(r, field, e.target.value); }} placeholder="…" className={`${inputClass} resize-none leading-snug`} /></td>; }
                    if (c.kind === "resume") { const site = typeof r.form.resumeUrl === "string" ? r.form.resumeUrl : ""; const drive = typeof r.form.resumeDriveUrl === "string" ? r.form.resumeDriveUrl : ""; return <td key={c.key} className={cellClass}><div className="flex flex-wrap gap-2 px-2 py-1.5 text-xs font-semibold">{site && <a href={site} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-700 hover:underline">PDF <ExternalLink className="h-3 w-3" /></a>}{drive && <a href={drive} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-emerald-700 hover:underline">Drive <ExternalLink className="h-3 w-3" /></a>}{!site && !drive && <span className="text-slate-300">—</span>}</div></td>; }
                    const value = c.get(r);
                    return <td key={c.key} className={cellClass}><button type="button" onClick={() => setDetail({ id: r.id, key: c.key })} title={rowMode === "full" ? undefined : "Click to read in full"} className="block w-full overflow-hidden px-2 py-1.5 text-left text-slate-700 hover:bg-blue-50"><span className={textClass}>{value || <span className="text-slate-300">—</span>}</span></button></td>;
                  })}
                </tr>
              ))}
              {visible.length === 0 && <tr><td colSpan={columns.length} className="px-4 py-16 text-center text-sm text-slate-400">No applications match.</td></tr>}
            </tbody>
          </table>
        </div>

        {detailRow && (
          <aside className="flex w-[460px] shrink-0 flex-col border-l border-slate-200 bg-white" aria-label="Application details">
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
              <div className="min-w-0">
                <div className="truncate text-base font-black text-slate-900">{detailRow.user.name || detailRow.user.email}</div>
                <div className="truncate text-xs text-slate-500">{detailRow.program.title} · {formatKST(detailRow.createdAt, "yyyy-MM-dd")}</div>
              </div>
              <button type="button" onClick={() => setDetail(null)} aria-label="Close" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X className="h-5 w-5" /></button>
            </div>
            <dl className="min-h-0 flex-1 overflow-auto px-5 py-4">
              {base.filter((c) => c.kind !== "actions").map((c) => {
                const value = c.kind === "resume" ? "" : c.get(detailRow);
                const highlight = detail?.key === c.key;
                return (
                  <div key={c.key} id={`detail-${c.key}`} className={`mb-4 rounded-lg ${highlight ? "bg-amber-50 ring-1 ring-amber-200" : ""} px-2 py-1.5`}>
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{c.label}</dt>
                    <dd className="mt-0.5 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-800">
                      {c.kind === "resume" ? (
                        <span className="flex gap-3 text-sm font-semibold">
                          {typeof detailRow.form.resumeUrl === "string" && detailRow.form.resumeUrl && <a href={detailRow.form.resumeUrl} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline">Open PDF</a>}
                          {typeof detailRow.form.resumeDriveUrl === "string" && detailRow.form.resumeDriveUrl && <a href={detailRow.form.resumeDriveUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-700 hover:underline">Drive</a>}
                        </span>
                      ) : value || <span className="text-slate-300">—</span>}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </aside>
        )}
      </div>
      {saving && Object.keys(saving).length > 0 && <div className="pointer-events-none fixed bottom-4 right-4 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…</div>}
    </div>
  );
}
