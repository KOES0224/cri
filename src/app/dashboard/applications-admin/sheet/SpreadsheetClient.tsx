"use client";

import { useState, useMemo, useEffect } from "react";
import { 
  Download, 
  Search, 
  Filter, 
  Trash2, 
  FileSpreadsheet, 
  Check, 
  Loader2, 
  X, 
  Copy, 
  CheckCheck, 
  ExternalLink,
  Sparkles,
  ArrowUpRight
} from "lucide-react";
import { 
  updateApplicationProcessingFields, 
  deleteApplication,
  checkGoogleSheetWebhookStatus,
  syncAllApplicationsToGoogleSheet
} from "@/app/actions/adminApplications";
import { GOOGLE_APPS_SCRIPT_TEMPLATE } from "@/lib/googleSheets";

// Safe date parsing helper to prevent RangeError crashes
function safeIsoDate(dateVal: any): string {
  if (!dateVal) return "";
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "";
    return d.toISOString().split("T")[0];
  } catch {
    return "";
  }
}

export default function SpreadsheetClient({ initialData }: { initialData: any[] }) {
  const [data, setData] = useState(initialData);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("ALL");
  const [programFilter, setProgramFilter] = useState("ALL");
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Google Sheets modal state
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [webhookInfo, setWebhookInfo] = useState<{ hasWebhook: boolean; maskedUrl?: string } | null>(null);
  const [syncingAll, setSyncingAll] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  
  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  useEffect(() => {
    checkGoogleSheetWebhookStatus().then(setWebhookInfo);
  }, []);

  // Quick stats
  const stats = useMemo(() => {
    const total = data.length;
    const review = data.filter(d => (d.stage || "REVIEW") === "REVIEW").length;
    const interview = data.filter(d => d.stage === "INTERVIEW").length;
    const payment = data.filter(d => d.stage === "PAYMENT").length;
    const enrolled = data.filter(d => d.stage === "ENROLLED").length;
    return { total, review, interview, payment, enrolled };
  }, [data]);

  // Extract unique programs for filter
  const programs = useMemo(() => Array.from(new Set(initialData.map(d => d.program?.title))).filter(Boolean), [initialData]);

  // Extract all possible JSON content keys across all applications for dynamic columns
  const contentColumns = useMemo(() => {
    const keys = new Set<string>();
    initialData.forEach(app => {
      try {
        const obj = JSON.parse(app.content || "{}");
        Object.keys(obj).forEach(k => keys.add(k));
      } catch(e) {}
    });
    const important = ["studentFirstName", "studentLastName", "studentPhone", "school", "gradYear"];
    const ordered = [...important, ...Array.from(keys).filter(k => !important.includes(k))];
    return ordered;
  }, [initialData]);

  const filteredData = useMemo(() => {
    return data.filter((app: any) => {
      const matchSearch = (app.user?.name || "").toLowerCase().includes(search.toLowerCase()) || 
                          (app.user?.email || "").toLowerCase().includes(search.toLowerCase());
      const matchStage = stageFilter === "ALL" || (app.stage || "REVIEW") === stageFilter;
      const matchProgram = programFilter === "ALL" || app.program?.title === programFilter;
      return matchSearch && matchStage && matchProgram;
    });
  }, [data, search, stageFilter, programFilter]);

  const handleFieldChange = async (appId: string, field: string, value: any) => {
    // Optimistic update
    setData(prev => prev.map(app => app.id === appId ? { ...app, [field]: value } : app));
    setSaveStatus("Saving...");
    
    // Save to DB
    const res = await updateApplicationProcessingFields(appId, { [field]: value });
    if (res && res.success) {
      setSaveStatus("Saved");
      setTimeout(() => setSaveStatus(null), 1600);
    } else {
      setSaveStatus("Error saving");
      setTimeout(() => setSaveStatus(null), 2500);
    }
  };

  const handleDelete = async (appId: string) => {
    if (!confirm("Are you sure you want to permanently delete this application? This action cannot be undone.")) return;
    
    // Optimistic remove
    setData(prev => prev.filter(app => app.id !== appId));
    
    const res = await deleteApplication(appId);
    if (!res.success) {
      alert("Failed to delete application: " + res.error);
    }
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_TEMPLATE);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleBatchSync = async () => {
    setSyncingAll(true);
    setSyncMessage(null);
    const res = await syncAllApplicationsToGoogleSheet();
    setSyncingAll(false);
    if (res.success) {
      setSyncMessage(`Successfully streamed ${res.count} of ${res.total} applications to Google Sheet!`);
    } else {
      setSyncMessage(`Sync failed: ${res.error}`);
    }
  };

  const handleExport = () => {
    const csvData = [];
    
    // Build Headers
    const headers = [
      "ID", "Name", "Email", "Initial Program", "Final Course", "Stage", "Interview Date", 
      "Payment Deadline", "Interview Comments", "General Comments",
      ...contentColumns
    ];
    csvData.push(headers.join(","));

    const escapeCSV = (str: any) => {
      if (str === null || str === undefined) return '""';
      return `"${String(str).replace(/"/g, '""').replace(/\n/g, ' ')}"`;
    };

    filteredData.forEach((app: any) => {
      let contentObj: any = {};
      try { contentObj = JSON.parse(app.content || "{}"); } catch(e) {}

      const row = [
        escapeCSV(app.id),
        escapeCSV(app.user?.name),
        escapeCSV(app.user?.email),
        escapeCSV(app.program?.title),
        escapeCSV(app.finalRegisteredCourse),
        escapeCSV(app.stage || "REVIEW"),
        escapeCSV(safeIsoDate(app.interviewDate)),
        escapeCSV(safeIsoDate(app.paymentDeadline)),
        escapeCSV(app.interviewComments),
        escapeCSV(app.generalComments),
        ...contentColumns.map(col => escapeCSV(contentObj[col]))
      ];
      csvData.push(row.join(","));
    });

    const blob = new Blob(["\uFEFF" + csvData.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Applications_Pipeline_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const stageOptions = ["REVIEW", "INTERVIEW", "PAYMENT", "ENROLLED", "REJECTED"];

  return (
    <div className="flex flex-col h-full bg-white relative">
      
      {/* Apple-style Stats & Metric Pills */}
      <div className="bg-white border-b border-gray-100 px-6 py-2.5 flex items-center gap-3 text-xs overflow-x-auto">
        <span className="font-bold text-gray-500 uppercase tracking-wider text-[11px]">Pipeline:</span>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 bg-gray-100 text-gray-700 font-bold rounded-lg">
            Total: {stats.total}
          </span>
          <span className="px-2.5 py-1 bg-blue-50 text-blue-700 font-bold rounded-lg">
            Review: {stats.review}
          </span>
          <span className="px-2.5 py-1 bg-purple-50 text-purple-700 font-bold rounded-lg">
            Interview: {stats.interview}
          </span>
          <span className="px-2.5 py-1 bg-amber-50 text-amber-700 font-bold rounded-lg">
            Payment: {stats.payment}
          </span>
          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold rounded-lg">
            Enrolled: {stats.enrolled}
          </span>
        </div>

        {saveStatus && (
          <div className="ml-auto flex items-center gap-1.5 text-xs font-bold text-emerald-600 animate-in fade-in duration-200">
            {saveStatus === "Saving..." ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}
            {saveStatus}
          </div>
        )}
      </div>

      {/* Control Toolbar */}
      <div className="bg-gray-50/80 backdrop-blur-md border-b border-gray-200 px-6 py-3 flex flex-wrap items-center justify-between gap-4 z-30">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search applicants..." 
              className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl w-64 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select 
              value={stageFilter} onChange={e => setStageFilter(e.target.value)}
              className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="ALL">All Stages</option>
              {stageOptions.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
            <select 
              value={programFilter} onChange={e => setProgramFilter(e.target.value)}
              className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white font-medium max-w-[220px] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="ALL">All Programs</option>
              {programs.map((p: any) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Google Sheets Integration Button */}
          <button
            onClick={() => setShowSyncModal(true)}
            className="flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 px-3.5 py-2 rounded-xl text-sm font-bold transition shadow-sm cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Google Sheets Sync</span>
            {webhookInfo?.hasWebhook ? (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Live stream active" />
            ) : (
              <span className="text-[10px] bg-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded font-bold">Setup</span>
            )}
          </button>

          {/* Export CSV Button */}
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 bg-gray-900 hover:bg-black text-white px-4 py-2 rounded-xl text-sm font-bold transition shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Spreadsheet Table Container */}
      <div className="flex-1 overflow-auto bg-gray-100/70 p-4">
        <div className="bg-white shadow-xl ring-1 ring-gray-200/80 rounded-2xl overflow-hidden inline-block min-w-full">
          <table className="w-full text-left border-collapse whitespace-nowrap text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-20">
              <tr>
                <th className="px-4 py-3 font-semibold text-gray-700 border-r border-gray-200 sticky left-0 z-30 bg-gray-50">Actions</th>
                <th className="px-4 py-3 font-semibold text-gray-700 border-r border-gray-200 sticky left-[80px] z-30 bg-gray-50">Applicant</th>
                <th className="px-4 py-3 font-semibold text-gray-700 border-r border-gray-200">Initial Program</th>
                <th className="px-4 py-3 font-semibold text-gray-700 border-r border-gray-200 bg-amber-50/70 min-w-[200px]">Final Enrolled Course</th>
                <th className="px-4 py-3 font-semibold text-gray-700 border-r border-gray-200 bg-amber-50/70 min-w-[140px]">Pipeline Stage</th>
                <th className="px-4 py-3 font-semibold text-gray-700 border-r border-gray-200 bg-amber-50/70 min-w-[160px]">Interview Date</th>
                <th className="px-4 py-3 font-semibold text-gray-700 border-r border-gray-200 bg-amber-50/70 min-w-[160px]">Payment Deadline</th>
                <th className="px-4 py-3 font-semibold text-gray-700 border-r border-gray-200 bg-blue-50/50 min-w-[250px]">Interview Comments</th>
                <th className="px-4 py-3 font-semibold text-gray-700 border-r border-gray-200 bg-blue-50/50 min-w-[300px]">General Comments</th>
                {contentColumns.map(col => (
                  <th key={col} className="px-4 py-3 font-semibold text-gray-500 border-r border-gray-200 max-w-[200px] truncate" title={col}>
                    [Form] {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredData.map((app: any) => {
                let contentObj: any = {};
                try { contentObj = JSON.parse(app.content || "{}"); } catch(e) {}
                
                return (
                  <tr key={app.id} className="hover:bg-blue-50/20 group transition-colors">
                    {/* Fixed Columns */}
                    <td className="px-2 py-2 border-r border-gray-200 sticky left-0 z-10 bg-white group-hover:bg-blue-50/30 text-center w-[80px]">
                      <button 
                         onClick={() => handleDelete(app.id)}
                         className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                         title="Delete Application"
                      >
                         <Trash2 className="w-4 h-4 mx-auto" />
                      </button>
                    </td>
                    <td className="px-4 py-2 border-r border-gray-200 sticky left-[80px] z-10 bg-white group-hover:bg-blue-50/30 min-w-[150px]">
                      <div className="font-semibold text-gray-900">{app.user?.name}</div>
                      <div className="text-xs text-gray-400">{app.user?.email}</div>
                    </td>
                    <td className="px-4 py-2 border-r border-gray-200 text-gray-700">
                      <span className="truncate block max-w-[200px]" title={app.program?.title}>{app.program?.title}</span>
                    </td>

                    <td className="px-2 py-2 border-r border-gray-200 bg-amber-50/20">
                      <select 
                        value={app.finalRegisteredCourse || ""}
                        onChange={(e) => handleFieldChange(app.id, 'finalRegisteredCourse', e.target.value)}
                        className="w-full bg-transparent border-0 font-bold px-2 py-1 focus:ring-2 focus:ring-blue-500 rounded text-xs cursor-pointer text-gray-900"
                      >
                        <option value="">-- Select Final Course --</option>
                        {programs.map((p: any) => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </td>
                    
                    {/* Interactive Pipeline State cells */}
                    <td className="px-2 py-2 border-r border-gray-200 bg-amber-50/20">
                      <select 
                        value={app.stage || "REVIEW"}
                        onChange={(e) => handleFieldChange(app.id, 'stage', e.target.value)}
                        className={`w-full bg-transparent border-0 font-bold px-2 py-1 focus:ring-2 focus:ring-blue-500 rounded text-xs cursor-pointer
                           ${app.stage === 'ENROLLED' ? 'text-green-700' : 
                             app.stage === 'REJECTED' ? 'text-red-600' : 
                             app.stage === 'PAYMENT' ? 'text-orange-600' : 'text-blue-700'}`}
                      >
                        {stageOptions.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </td>

                    {/* Safe ISO Dates */}
                    <td className="px-2 py-2 border-r border-gray-200 bg-amber-50/20">
                      <input 
                        type="date"
                        value={safeIsoDate(app.interviewDate)}
                        onChange={(e) => handleFieldChange(app.id, 'interviewDate', e.target.value ? new Date(e.target.value) : null)}
                        className="w-full bg-transparent border-0 px-2 py-1 text-gray-700 focus:ring-2 focus:ring-blue-500 font-mono text-sm rounded cursor-pointer"
                      />
                    </td>

                    <td className="px-2 py-2 border-r border-gray-200 bg-amber-50/20">
                      <input 
                        type="date"
                        value={safeIsoDate(app.paymentDeadline)}
                        onChange={(e) => handleFieldChange(app.id, 'paymentDeadline', e.target.value ? new Date(e.target.value) : null)}
                        className="w-full bg-transparent border-0 px-2 py-1 text-gray-700 focus:ring-2 focus:ring-blue-500 font-mono text-sm rounded cursor-pointer"
                      />
                    </td>

                    <td className="p-0 border-r border-gray-200 bg-blue-50/10 relative group/cell">
                      <textarea
                        defaultValue={app.interviewComments || ""}
                        onBlur={(e) => {
                          if (e.target.value !== app.interviewComments) {
                             handleFieldChange(app.id, 'interviewComments', e.target.value);
                          }
                        }}
                        placeholder="Add interview notes..."
                        className="w-full h-full min-h-[44px] bg-transparent border-0 px-3 py-2 text-gray-700 focus:ring-2 focus:ring-blue-500 focus:bg-white resize-none text-sm"
                        style={{ overflow: 'hidden' }}
                        onInput={(e) => {
                          const target = e.target as HTMLTextAreaElement;
                          target.style.height = 'auto';
                          target.style.height = target.scrollHeight + 'px';
                        }}
                      />
                    </td>

                    <td className="p-0 border-r border-gray-200 bg-blue-50/10 relative group/cell">
                      <textarea
                        defaultValue={app.generalComments || ""}
                        onBlur={(e) => {
                          if (e.target.value !== app.generalComments) {
                             handleFieldChange(app.id, 'generalComments', e.target.value);
                          }
                        }}
                        placeholder="General remarks..."
                        className="w-full h-full min-h-[44px] bg-transparent border-0 px-3 py-2 text-gray-700 focus:ring-2 focus:ring-blue-500 focus:bg-white resize-none text-sm"
                        style={{ overflow: 'hidden' }}
                        onInput={(e) => {
                          const target = e.target as HTMLTextAreaElement;
                          target.style.height = 'auto';
                          target.style.height = target.scrollHeight + 'px';
                        }}
                      />
                    </td>

                    {/* Raw JSON Application Form Data Columns */}
                    {contentColumns.map(col => {
                      const val = contentObj[col];

                      // Special formatting for payment metadata
                      if (col === "payment" && typeof val === "object" && val !== null) {
                        return (
                          <td key={col} className="px-3 py-2 border-r border-gray-200 text-gray-700 max-w-[250px]">
                            <div className="flex items-center gap-1.5">
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md font-bold text-xs">
                                {val.feeStatus || "PAID"} (${val.amount || 50} {val.currency || "USD"})
                              </span>
                              {val.receiptUrl && (
                                <a
                                  href={val.receiptUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 p-0.5 inline-flex items-center"
                                  title="View Official Receipt"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                          </td>
                        );
                      }

                      const displayVal = typeof val === 'object' ? JSON.stringify(val) : String(val || "");
                      const isLongText = displayVal.length > 50;
                      
                      return (
                        <td key={col} className="px-4 py-2 border-r border-gray-200 text-gray-600 max-w-[250px]">
                          {isLongText ? (
                            <div className="truncate cursor-help" title={displayVal}>
                               {displayVal}
                            </div>
                          ) : (
                            displayVal
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
              {filteredData.length === 0 && (
                 <tr>
                    <td colSpan={100} className="px-4 py-16 text-center text-gray-400 font-medium bg-white">
                       No applications found matching your search.
                    </td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Google Sheets Live Stream Setup Modal */}
      {showSyncModal && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-2xl w-full p-8 relative animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowSyncModal(false)}
              className="absolute right-6 top-6 p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Google Spreadsheet Live Sync</h3>
                <p className="text-xs text-gray-500">Stream submissions directly into Google Sheets like Google Forms</p>
              </div>
            </div>

            {/* Status Card */}
            <div className={`mt-6 p-4 rounded-2xl border flex items-center justify-between ${
              webhookInfo?.hasWebhook 
                ? "bg-emerald-50/60 border-emerald-200 text-emerald-900" 
                : "bg-amber-50/60 border-amber-200 text-amber-900"
            }`}>
              <div className="flex items-center gap-3">
                <span className={`w-3 h-3 rounded-full ${webhookInfo?.hasWebhook ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
                <div>
                  <div className="text-sm font-bold">
                    {webhookInfo?.hasWebhook ? "Live Sync Active" : "No Webhook Configured Yet"}
                  </div>
                  <div className="text-xs opacity-75">
                    {webhookInfo?.hasWebhook 
                      ? `Endpoint: ${webhookInfo.maskedUrl}` 
                      : "Add GOOGLE_SHEET_WEBHOOK_URL in .env to stream new applications automatically."}
                  </div>
                </div>
              </div>

              {webhookInfo?.hasWebhook && (
                <button
                  onClick={handleBatchSync}
                  disabled={syncingAll}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {syncingAll ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  {syncingAll ? "Syncing..." : "Sync All Now"}
                </button>
              )}
            </div>

            {syncMessage && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs font-semibold text-blue-800">
                {syncMessage}
              </div>
            )}

            {/* Setup Instructions */}
            <div className="mt-6 space-y-4 text-xs text-gray-600">
              <h4 className="text-sm font-bold text-gray-900">Quick 30-Second Setup:</h4>
              <ol className="list-decimal pl-5 space-y-2 leading-relaxed">
                <li>Create or open any Google Sheet where you want responses to go.</li>
                <li>Click <strong>Extensions &gt; Apps Script</strong> in the top menu of your Google Sheet.</li>
                <li>Delete any placeholder code, and paste the script below:</li>
              </ol>

              {/* Code Snippet Box */}
              <div className="relative bg-gray-900 rounded-2xl p-4 font-mono text-gray-200 text-[11px] overflow-x-auto max-h-48">
                <button
                  onClick={handleCopyScript}
                  className="absolute right-3 top-3 px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-sans font-semibold transition flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedCode ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedCode ? "Copied!" : "Copy Code"}
                </button>
                <pre>{GOOGLE_APPS_SCRIPT_TEMPLATE}</pre>
              </div>

              <ol start={4} className="list-decimal pl-5 space-y-2 leading-relaxed">
                <li>Click <strong>Deploy &gt; New deployment</strong> (blue button top right).</li>
                <li>Click the gear icon next to "Select type" and choose <strong>Web app</strong>.</li>
                <li>Set Execute as: <strong>Me</strong>, and Who has access: <strong>Anyone</strong>.</li>
                <li>Click <strong>Deploy</strong>, copy the Web app URL, and paste it into your <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono text-gray-800">.env</code> as <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono text-gray-800">GOOGLE_SHEET_WEBHOOK_URL="https://script.google.com/..."</code>.</li>
              </ol>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                onClick={() => setShowSyncModal(false)}
                className="px-6 py-2.5 bg-gray-900 hover:bg-black text-white text-sm font-bold rounded-xl transition shadow-sm cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
