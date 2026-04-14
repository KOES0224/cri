"use client";

import { useState, useMemo, useEffect } from "react";
import { Download, Search, Filter } from "lucide-react";
import { updateApplicationProcessingFields } from "@/app/actions/adminApplications";
import { format } from "date-fns";

export default function SpreadsheetClient({ initialData }: { initialData: any[] }) {
  const [data, setData] = useState(initialData);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("ALL");
  const [programFilter, setProgramFilter] = useState("ALL");
  
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
    // Remove massive/unwanted ones if necessary, or just order them reasonably
    const important = ["studentFirstName", "studentLastName", "studentPhone", "school", "gradYear"];
    const ordered = [...important, ...Array.from(keys).filter(k => !important.includes(k))];
    return ordered;
  }, [initialData]);

  const filteredData = useMemo(() => {
    return data.filter((app: any) => {
      const matchSearch = (app.user?.name || "").toLowerCase().includes(search.toLowerCase()) || 
                          (app.user?.email || "").toLowerCase().includes(search.toLowerCase());
      const matchStage = stageFilter === "ALL" || app.stage === stageFilter;
      const matchProgram = programFilter === "ALL" || app.program?.title === programFilter;
      return matchSearch && matchStage && matchProgram;
    });
  }, [data, search, stageFilter, programFilter]);

  const handleFieldChange = async (appId: string, field: string, value: any) => {
    // Optimistic update
    setData(prev => prev.map(app => app.id === appId ? { ...app, [field]: value } : app));
    
    // Save to DB
    await updateApplicationProcessingFields(appId, { [field]: value });
  };

  const handleExport = () => {
    const csvData = [];
    
    // Build Headers
    const headers = [
      "ID", "Name", "Email", "Program", "Stage", "Interview Date", 
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
        escapeCSV(app.stage),
        escapeCSV(app.interviewDate ? new Date(app.interviewDate).toLocaleDateString() : ""),
        escapeCSV(app.paymentDeadline ? new Date(app.paymentDeadline).toLocaleDateString() : ""),
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
      
      {/* Control Toolbar */}
      <div className="bg-gray-50/80 backdrop-blur-md border-b border-gray-200 px-6 py-3 flex items-center justify-between z-30">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search applicants..." 
              className="pl-9 pr-4 py-1.5 text-sm border border-gray-300 rounded-lg w-64 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select 
              value={stageFilter} onChange={e => setStageFilter(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-2 py-1.5 bg-white font-medium"
            >
              <option value="ALL">All Stages</option>
              {stageOptions.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
            <select 
              value={programFilter} onChange={e => setProgramFilter(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-2 py-1.5 bg-white font-medium max-w-[200px]"
            >
              <option value="ALL">All Programs</option>
              {programs.map((p: any) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>
        
        <button 
          onClick={handleExport}
          className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-semibold transition shadow-sm"
        >
          <Download className="w-4 h-4" />
          Export Spreadsheet
        </button>
      </div>

      {/* Spreadsheet Container */}
      <div className="flex-1 overflow-auto bg-gray-100 p-4">
        <div className="bg-white shadow-xl ring-1 ring-gray-200 rounded-xl overflow-hidden inline-block min-w-full">
          <table className="w-full text-left border-collapse whitespace-nowrap text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-20">
              <tr>
                <th className="px-4 py-3 font-semibold text-gray-700 border-r border-gray-200 sticky left-0 z-30 bg-gray-50">Applicant</th>
                <th className="px-4 py-3 font-semibold text-gray-700 border-r border-gray-200">Program</th>
                <th className="px-4 py-3 font-semibold text-gray-700 border-r border-gray-200 bg-yellow-50 min-w-[140px]">Pipeline Stage</th>
                <th className="px-4 py-3 font-semibold text-gray-700 border-r border-gray-200 bg-yellow-50 min-w-[160px]">Interview Date</th>
                <th className="px-4 py-3 font-semibold text-gray-700 border-r border-gray-200 bg-yellow-50 min-w-[160px]">Payment Deadline</th>
                <th className="px-4 py-3 font-semibold text-gray-700 border-r border-gray-200 bg-blue-50 min-w-[250px]">Interview Comments</th>
                <th className="px-4 py-3 font-semibold text-gray-700 border-r border-gray-200 bg-blue-50 min-w-[300px]">General Comments</th>
                {contentColumns.map(col => (
                  <th key={col} className="px-4 py-3 font-semibold text-gray-500 border-r border-gray-200 max-w-[200px] truncate" title={col}>
                    [Form] {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredData.map((app: any, idx) => {
                let contentObj: any = {};
                try { contentObj = JSON.parse(app.content || "{}"); } catch(e) {}
                
                return (
                  <tr key={app.id} className="hover:bg-blue-50/30 group transition-colors">
                    {/* Fixed Columns */}
                    <td className="px-4 py-2 border-r border-gray-200 sticky left-0 z-10 bg-white group-hover:bg-blue-50/50">
                      <div className="font-semibold text-gray-900">{app.user?.name}</div>
                      <div className="text-xs text-gray-500">{app.user?.email}</div>
                    </td>
                    <td className="px-4 py-2 border-r border-gray-200 text-gray-700">
                      <span className="truncate block max-w-[200px]" title={app.program?.title}>{app.program?.title}</span>
                    </td>
                    
                    {/* Interactive Pipeline State cells */}
                    <td className="px-2 py-2 border-r border-gray-200 bg-yellow-50/30">
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

                    <td className="px-2 py-2 border-r border-gray-200 bg-yellow-50/30">
                      <input 
                        type="date"
                        value={app.interviewDate ? new Date(app.interviewDate).toISOString().split('T')[0] : ""}
                        onChange={(e) => handleFieldChange(app.id, 'interviewDate', e.target.value ? new Date(e.target.value) : null)}
                        className="w-full bg-transparent border-0 px-2 py-1 text-gray-700 focus:ring-2 focus:ring-blue-500 font-mono text-sm rounded cursor-pointer"
                      />
                    </td>

                    <td className="px-2 py-2 border-r border-gray-200 bg-yellow-50/30">
                      <input 
                        type="date"
                        value={app.paymentDeadline ? new Date(app.paymentDeadline).toISOString().split('T')[0] : ""}
                        onChange={(e) => handleFieldChange(app.id, 'paymentDeadline', e.target.value ? new Date(e.target.value) : null)}
                        className="w-full bg-transparent border-0 px-2 py-1 text-gray-700 focus:ring-2 focus:ring-blue-500 font-mono text-sm rounded cursor-pointer"
                      />
                    </td>

                    <td className="p-0 border-r border-gray-200 bg-blue-50/20 relative group/cell">
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

                    <td className="p-0 border-r border-gray-200 bg-blue-50/20 relative group/cell">
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
                    <td colSpan={100} className="px-4 py-12 text-center text-gray-500 font-medium bg-white">
                       No applications found matching your criteria.
                    </td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
